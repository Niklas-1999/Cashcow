import { sleep, fmtMult } from '../util.js';
import { betControl, segmented } from '../ui.js';
import { sfx } from '../audio.js';
import { S } from '../state.js';

const WHEELS = {
  low: [1.5, 1.2, 1.2, 1.2, 0, 1.2, 1.2, 1.2, 1.2, 0],
  medium: [0, 1.9, 0, 2, 0, 3, 0, 2, 0, 1.9, 0, 2, 0, 3, 0, 2, 2, 0, 0, 0],
  high: [29.7, ...Array(29).fill(0)],
};
const segColor = (m) => (m === 0 ? '#2d2148' : m < 1.4 ? '#6fe3ff' : m < 1.8 ? '#3ddc97' : m < 2.5 ? '#ffd23a' : m < 10 ? '#ff9a3c' : '#ff5c93');

function wheelSvg(segs) {
  const n = segs.length, A = 360 / n, R = 200;
  let s = '';
  segs.forEach((m, i) => {
    const a0 = (i * A - 90) * Math.PI / 180, a1 = ((i + 1) * A - 90) * Math.PI / 180;
    const p = (r, a) => `${(R + Math.cos(a) * r).toFixed(2)} ${(R + Math.sin(a) * r).toFixed(2)}`;
    s += `<path d="M 200 200 L ${p(186, a0)} A 186 186 0 0 1 ${p(186, a1)} Z" fill="${segColor(m)}" stroke="#1a0b33" stroke-width="2"/>`;
    if (n <= 20 || m > 0) s += `<text x="200" y="${n > 20 ? 40 : 44}" transform="rotate(${i * A + A / 2} 200 200)" text-anchor="middle" font-size="${n > 20 ? 13 : 15}" font-weight="900" fill="${m === 0 ? '#8a7fb8' : '#1a0b33'}" font-family="sans-serif">${m === 0 ? '0' : m + '×'}</text>`;
  });
  const pegs = segs.map((_, i) => { const a = (i * A - 90) * Math.PI / 180; return `<circle cx="${R + Math.cos(a) * 192}" cy="${R + Math.sin(a) * 192}" r="4" fill="#fff6c8" stroke="#8a6410"/>`; }).join('');
  return `<svg viewBox="0 0 400 400"><defs><linearGradient id="whg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#d9a52a"/><stop offset="1" stop-color="#8a6410"/></linearGradient></defs>
    <circle cx="200" cy="200" r="199" fill="url(#whg)"/><circle cx="200" cy="200" r="190" fill="#1a0b33"/>
    <g id="wh-rot">${s}${pegs}</g></svg>`;
}

export default {
  rules: `<p>Spin the Fortune Wheel and win the multiplier under the pointer.</p>
    <ul><li><b>Low</b> risk: mostly 1.2×, few losses.</li><li><b>Medium</b>: half the wheel pays up to 3×.</li><li><b>High</b>: one single segment pays <b>29.7×</b>.</li></ul><p class="muted">Every risk level returns 99%.</p>`,

  mount(root, ctx) {
    let risk = 'medium', rot = 0, spinning = false, alive = true;
    root.innerHTML = `
    <div class="wheel-layout">
      <div class="wheel-wrap">
        <svg class="wheel-pointer" viewBox="0 0 60 70"><path d="M30 68 L6 14 A 26 26 0 1 1 54 14 Z" fill="#fff" stroke="#c2185b" stroke-width="4"/><circle cx="30" cy="24" r="9" fill="#ff5c93"/></svg>
        <div class="wheel-svg"></div>
        <div class="wheel-center">?</div>
      </div>
      <div class="panel pad">
        <div class="ctl-group"><div class="ctl-label">Risk</div><div id="risk"></div></div>
        <div class="ctl-group" style="margin-top:14px"><div class="ctl-label">Payouts</div><div class="wheel-legend"></div></div>
      </div>
    </div>
    <div class="controls panel">
      <div class="ctl-bet"></div>
      <div class="ctl-actions"><button class="btn primary big shine" id="spin">SPIN</button></div>
    </div>`;
    const $ = (s) => root.querySelector(s);
    const bet = betControl('wheel', { initial: 100 });
    $('.ctl-bet').appendChild(bet.el);
    const sel = segmented([{ v: 'low', label: 'Low' }, { v: 'medium', label: 'Medium' }, { v: 'high', label: 'High' }], risk, (v) => { risk = v; draw(); });
    $('#risk').appendChild(sel);

    function draw() {
      $('.wheel-svg').innerHTML = wheelSvg(WHEELS[risk]);
      rot = 0;
      const segs = WHEELS[risk];
      const counts = {};
      segs.forEach((m) => (counts[m] = (counts[m] || 0) + 1));
      $('.wheel-legend').innerHTML = Object.entries(counts).sort((a, b) => a[0] - b[0]).map(([m, n]) => `<span style="background:${segColor(+m)};${+m === 0 ? 'color:#cfc6ff' : ''}">${+m === 0 ? '0×' : m + '×'} · ${(n / segs.length * 100).toFixed(1).replace('.0', '')}%</span>`).join('');
      $('.wheel-center').textContent = '?';
    }
    draw();

    async function spin() {
      if (spinning) return;
      const b = bet.value;
      if (!ctx.bet(b)) return;
      spinning = true;
      $('#spin').disabled = true; bet.disable(true); sel.disable(true);
      const segs = WHEELS[risk], n = segs.length, A = 360 / n;
      const i = Math.floor(Math.random() * n);
      const target = rot + 360 * (S.settings.fastMode ? 3 : 5) + (360 - ((i * A + A / 2 + rot) % 360)) + (Math.random() - 0.5) * A * 0.7;
      const g = root.querySelector('#wh-rot');
      const start = rot, dur = S.settings.fastMode ? 2200 : 4200, t0 = performance.now();
      let lastSeg = Math.floor(start / A);
      const ptr = $('.wheel-pointer');
      await new Promise((res) => {
        const frame = (now) => {
          if (!alive) return res();
          const k = Math.min(1, (now - t0) / dur);
          const e = 1 - Math.pow(1 - k, 4);
          rot = start + (target - start) * e;
          g.setAttribute('transform', `rotate(${rot} 200 200)`);
          const seg = Math.floor(rot / A);
          if (seg !== lastSeg) { lastSeg = seg; sfx('tick'); ptr.classList.remove('tick'); void ptr.getBBox?.(); ptr.classList.add('tick'); }
          if (k < 1) requestAnimationFrame(frame); else res();
        };
        requestAnimationFrame(frame);
      });
      if (!alive) return;
      rot = rot % 360;
      const m = segs[i];
      const center = $('.wheel-center');
      center.textContent = m ? m + '×' : '0×';
      center.style.color = segColor(m) === '#2d2148' ? '#ff8aa0' : segColor(m);
      ctx.settle(b, Math.floor(b * m), { anchor: center });
      await sleep(400);
      spinning = false;
      $('#spin').disabled = false; bet.disable(false); sel.disable(false); bet.refresh();
    }
    $('#spin').onclick = spin;
    return () => { alive = false; };
  },
};
