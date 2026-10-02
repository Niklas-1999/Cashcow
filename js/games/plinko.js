import { h, fmtMult } from '../util.js';
import { betControl, segmented } from '../ui.js';
import { sfx } from '../audio.js';
import { S } from '../state.js';
import { burst } from '../fx.js';
import { PLINKO } from './plinko-math.js';

const bucketColor = (i, n) => {
  const d = Math.abs(i - n / 2) / (n / 2); // 0 centre → 1 edge
  const hue = 50 - d * 52; // yellow → red/pink
  return `hsl(${hue < 0 ? 340 : hue}, 95%, ${62 - d * 6}%)`;
};

export default {
  rules: `<p>Drop a ball from the top. At every peg it bounces left or right with equal chance and lands in a multiplier bucket.</p>
    <ul><li>Choose <b>8, 12 or 16 rows</b> and a <b>risk level</b>. Higher risk = bigger edges, smaller centre.</li>
    <li>16 rows on high risk tops out at <b>1000×</b>.</li>
    <li>You can drop many balls at once.</li></ul><p class="muted">Return ≈ 99%.</p>`,

  mount(root, ctx) {
    let rows = 12, risk = 'medium';
    root.innerHTML = `
    <div class="plinko-wrap"><canvas></canvas><div class="plinko-last"></div></div>
    <div class="controls panel">
      <div class="ctl-bet"></div>
      <div class="ctl-group"><div class="ctl-label">Rows</div><div id="rows"></div></div>
      <div class="ctl-group"><div class="ctl-label">Risk</div><div id="risk"></div></div>
      <div class="ctl-actions"><button class="btn primary big shine" id="drop">DROP BALL</button></div>
    </div>`;
    const $ = (s) => root.querySelector(s);
    const canvas = $('canvas'), c = canvas.getContext('2d');
    const bet = betControl('plinko', { initial: 50 });
    $('.ctl-bet').appendChild(bet.el);
    const rowSel = segmented([8, 12, 16].map((v) => ({ v, label: v })), rows, (v) => { rows = v; layout(); });
    const riskSel = segmented([{ v: 'low', label: 'Low' }, { v: 'medium', label: 'Medium' }, { v: 'high', label: 'High' }], risk, (v) => { risk = v; layout(); });
    $('#rows').appendChild(rowSel);
    $('#risk').appendChild(riskSel);

    let W, H, sp, top, pegR, ballR, dpr, alive = true;
    const balls = [];
    const pegGlow = new Map();
    const bucketPulse = [];

    function layout() {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = canvas.parentElement.clientWidth - 20;
      sp = Math.min(W / (rows + 2.5), 46);
      top = sp * 1.1;
      H = top + sp * (rows - 1) + sp * 1.6 + 10;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.height = H + 'px';
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      pegR = Math.max(2.4, sp * 0.09);
      ballR = Math.max(5, sp * 0.24);
      bucketPulse.length = rows + 1;
      bucketPulse.fill(0);
    }
    const pegPos = (r, i) => [W / 2 + (i - (r + 2) / 2) * sp, top + r * sp];
    const bucketX = (i) => W / 2 + (i - rows / 2) * sp;
    const bucketY = () => top + (rows - 1) * sp + sp * 0.85;

    function drop() {
      const b = bet.value;
      if (!ctx.bet(b)) return;
      const path = [];
      let k = 0;
      for (let r = 0; r < rows; r++) { const right = Math.random() < 0.5; path.push(right); if (right) k++; }
      balls.push({ bet: b, path, bucket: k, rows, risk, seg: -1, t: 0, x: W / 2, y: top - sp * 0.9, hue: 300 + Math.random() * 60 });
      sfx('pop');
      rowSel.disable(true); riskSel.disable(true);
    }

    function land(ball) {
      const mults = PLINKO[ball.rows][ball.risk];
      const m = mults[ball.bucket];
      bucketPulse[ball.bucket] = 1;
      const ret = Math.floor(ball.bet * m);
      const rect = canvas.getBoundingClientRect();
      const bx = rect.left + bucketX(ball.bucket), by = rect.top + bucketY();
      if (m >= 2) burst(bx, by, { n: Math.min(60, 10 + m * 2), speed: 7 });
      ctx.settle(ball.bet, ret, { anchor: null, quiet: m < 2 });
      if (m >= 1 && m < 2) sfx('coin');
      if (ball.bucket === 0 || ball.bucket === ball.rows) ctx.special('plinkoEdge');
      const last = $('.plinko-last');
      last.prepend(h(`<span style="background:${bucketColor(ball.bucket, ball.rows)}">${fmtMult(m)}</span>`));
      while (last.children.length > 6) last.lastChild.remove();
    }

    let lastT = performance.now();
    function frame(now) {
      if (!alive) return;
      const dt = Math.min(40, now - lastT); lastT = now;
      const segDur = S.settings.fastMode ? 70 : 115;
      // ---- update balls ----
      for (let i = balls.length - 1; i >= 0; i--) {
        const b = balls[i];
        b.t += dt / segDur;
        let landed = false;
        while (b.t >= 1) {
          b.t -= 1;
          b.seg++;
          if (b.seg >= b.rows) { landed = true; break; }
          const pos = b.path.slice(0, b.seg).filter(Boolean).length;
          pegGlow.set(`${b.seg},${pos + 1}`, 1);
          sfx('peg');
        }
        if (landed) { balls.splice(i, 1); land(b); continue; }
        // interpolate between contact points
        const from = b.seg < 0 ? [W / 2, top - sp * 0.9] : contact(b, b.seg);
        const to = b.seg + 1 >= b.rows ? [bucketX(b.bucket), bucketY()] : contact(b, b.seg + 1);
        const t = b.t;
        b.x = from[0] + (to[0] - from[0]) * t;
        b.y = from[1] + (to[1] - from[1]) * t * t - Math.sin(Math.PI * t) * sp * 0.28;
      }
      if (!balls.length) { rowSel.disable(false); riskSel.disable(false); }
      draw();
      requestAnimationFrame(frame);
    }
    // where the ball touches the peg on row r (sits just above it)
    function contact(b, r) {
      let pos = 0;
      for (let k = 0; k < r; k++) if (b.path[k]) pos++;
      const [px, py] = pegPos(r, pos + 1);
      return [px, py - pegR - ballR * 0.9];
    }

    function draw() {
      c.clearRect(0, 0, W, H);
      // pegs
      for (let r = 0; r < rows; r++) {
        for (let i = 0; i < r + 3; i++) {
          const [x, y] = pegPos(r, i);
          const g = pegGlow.get(`${r},${i}`) || 0;
          if (g > 0) {
            c.fillStyle = `rgba(255,140,200,${g * 0.5})`;
            c.beginPath(); c.arc(x, y, pegR * 3.2, 0, 7); c.fill();
            pegGlow.set(`${r},${i}`, g - 0.05);
            if (g - 0.05 <= 0) pegGlow.delete(`${r},${i}`);
          }
          c.fillStyle = g > 0 ? '#ffd1e8' : '#efe6ff';
          c.beginPath(); c.arc(x, y, pegR, 0, 7); c.fill();
        }
      }
      // buckets
      const mults = PLINKO[rows][risk];
      const by = bucketY();
      const bw = sp * 0.9, bh = Math.max(20, sp * 0.62);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let i = 0; i <= rows; i++) {
        const x = bucketX(i);
        const p = bucketPulse[i] || 0;
        const yy = by + p * 6;
        c.fillStyle = bucketColor(i, rows);
        c.shadowColor = bucketColor(i, rows);
        c.shadowBlur = p * 20;
        roundRect(c, x - bw / 2, yy - bh / 2, bw, bh, 6);
        c.fill();
        c.shadowBlur = 0;
        c.fillStyle = '#2a0b22';
        c.font = `900 ${Math.max(8, Math.min(13, sp * 0.3))}px "M PLUS Rounded 1c", sans-serif`;
        c.fillText(mults[i] >= 100 ? Math.round(mults[i]) : mults[i], x, yy + 1);
        if (p > 0) bucketPulse[i] = Math.max(0, p - 0.06);
      }
      // balls
      for (const b of balls) {
        const g = c.createRadialGradient(b.x - ballR * 0.3, b.y - ballR * 0.3, 1, b.x, b.y, ballR);
        g.addColorStop(0, '#fff'); g.addColorStop(0.35, `hsl(${b.hue},100%,72%)`); g.addColorStop(1, `hsl(${b.hue},90%,45%)`);
        c.fillStyle = g;
        c.shadowColor = `hsl(${b.hue},100%,65%)`; c.shadowBlur = 12;
        c.beginPath(); c.arc(b.x, b.y, ballR, 0, 7); c.fill();
        c.shadowBlur = 0;
      }
    }
    function roundRect(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }

    layout();
    const ro = new ResizeObserver(() => { if (!balls.length) layout(); });
    ro.observe(canvas.parentElement);
    $('#drop').onclick = drop;
    const onKey = (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.target.matches('input,button')) { e.preventDefault(); drop(); } };
    addEventListener('keydown', onKey);
    requestAnimationFrame(frame);
    return () => { balls.splice(0).forEach(land); alive = false; ro.disconnect(); removeEventListener('keydown', onKey); };
  },
};
