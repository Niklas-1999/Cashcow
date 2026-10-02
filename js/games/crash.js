import { h, fmt, fmtMult, rand, pick, shuffle } from '../util.js';
import { betControl, toast } from '../ui.js';
import { sfx } from '../audio.js';
import { S } from '../state.js';
import { burst } from '../fx.js';
import { WAIFUS } from '../waifu/data.js';

const RATE = 0.12; // m(t) = e^(RATE * t)
const crashPoint = () => {
  const u = Math.random();
  return Math.max(1, Math.floor(99 / (1 - u)) / 100);
};

export default {
  rules: `<p>The Love Rocket takes off and its multiplier climbs. <b>Cash out</b> before it crashes to win your bet × the multiplier.</p>
    <ul><li>Place your bet during the countdown — it joins the next flight.</li>
    <li>Set an <b>auto cash-out</b> to bank automatically at your target.</li>
    <li>The rocket can crash at any moment — even at 1.00×.</li></ul><p class="muted">Return ≈ 99%. Other passengers are friendly waifus, just for fun.</p>`,

  mount(root, ctx) {
    root.innerHTML = `
    <div class="crash-stage"><canvas></canvas><div class="crash-mult">1.00×</div><div class="crash-status"></div><div class="crash-players"></div></div>
    <div class="crash-hist"></div>
    <div class="controls panel">
      <div class="ctl-bet"></div>
      <div class="ctl-group"><div class="ctl-label">Auto cash-out</div><input class="small-input" id="auto" type="text" inputmode="decimal" placeholder="off" value="2.00"></div>
      <div class="ctl-group"><div class="ctl-label">Auto bet</div><label class="toggle"><input type="checkbox" id="autobet"><span></span></label></div>
      <div class="ctl-actions"><button class="btn primary big shine" id="act">BET</button></div>
    </div>`;
    const $ = (s) => root.querySelector(s);
    const canvas = $('canvas'), c = canvas.getContext('2d');
    const multEl = $('.crash-mult'), status = $('.crash-status'), act = $('#act');
    const bet = betControl('crash', { initial: 100 });
    $('.ctl-bet').appendChild(bet.el);

    let phase = 'wait', t0 = performance.now(), cp = 1, m = 1, alive = true;
    let myBet = 0, queued = 0, cashedAt = 0;
    let W, H, dpr;
    const trail = [], stars = Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), s: rand(0.5, 2) }));
    let bots = [];
    const history = [];

    function resize() {
      dpr = Math.min(2, devicePixelRatio || 1);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const ro = new ResizeObserver(resize); ro.observe(canvas); resize();

    function newRound() {
      phase = 'wait'; t0 = performance.now(); cp = crashPoint(); m = 1; cashedAt = 0; trail.length = 0;
      multEl.className = 'crash-mult'; multEl.textContent = '1.00×';
      bots = shuffle(WAIFUS.slice()).slice(0, 6).map((w) => ({ name: w.name.split(/[ "]/)[0], bet: Math.round(rand(1, 50)) * 100, target: Math.max(1.05, +(1 / (1 - Math.random() * 0.93)).toFixed(2)), out: 0 }));
      if (!myBet && $('#autobet').checked && !queued) queued = bet.value;
      updateButton();
    }
    function startFlight() {
      phase = 'fly'; t0 = performance.now();
      if (queued) {
        if (ctx.bet(queued)) myBet = queued;
        queued = 0;
      }
      sfx('whoosh');
      updateButton();
    }
    function doCrash() {
      phase = 'crashed'; t0 = performance.now();
      multEl.textContent = fmtMult(cp);
      multEl.className = 'crash-mult crashed';
      sfx('crash');
      const r = canvas.getBoundingClientRect();
      const [px, py] = point(Math.log(cp) / RATE, cp);
      burst(r.left + px, r.top + py, { n: 60, speed: 10, colors: ['#ff5c93', '#ffd23a', '#ff9a3c', '#fff'] });
      if (myBet) { ctx.settle(myBet, 0, { anchor: multEl }); myBet = 0; }
      history.unshift(cp);
      $('.crash-hist').innerHTML = history.slice(0, 16).map((x) => `<span class="${x >= 10 ? 'great' : x >= 2 ? 'good' : 'bad'}">${fmtMult(x)}</span>`).join('');
      updateButton();
    }
    function cashOut() {
      if (phase !== 'fly' || !myBet) return;
      cashedAt = m;
      const ret = Math.floor(myBet * m);
      multEl.className = 'crash-mult cashed';
      sfx('cashout');
      ctx.settle(myBet, ret, { anchor: multEl });
      if (m >= 10) ctx.special('crash10');
      toast(`Cashed out at <b>${fmtMult(m)}</b> · +${fmt(ret - myBet)}`, { type: 'success', icon: '🚀', duration: 2200 });
      myBet = 0;
      updateButton();
    }
    function updateButton() {
      if (phase === 'fly' && myBet) { act.className = 'btn gold big shine'; act.innerHTML = `CASH OUT <span class="sub">${fmt(myBet * m)}</span>`; act.disabled = false; }
      else if (queued) { act.className = 'btn ghost big'; act.innerHTML = `CANCEL BET <span class="sub">next round</span>`; act.disabled = false; }
      else { act.className = 'btn primary big shine'; act.innerHTML = phase === 'wait' ? 'BET' : 'BET <span class="sub">next round</span>'; act.disabled = false; }
      bet.disable(!!myBet || !!queued);
    }
    act.onclick = () => {
      if (phase === 'fly' && myBet) return cashOut();
      if (queued) { queued = 0; sfx('click'); return updateButton(); }
      if (bet.value > S.coins) { sfx('error'); toast('Not enough coins.', { type: 'warn', icon: '💸' }); return; }
      queued = bet.value; sfx('chip'); updateButton();
    };

    function point(t, mm) {
      const pad = 40;
      const tMax = Math.max(8, t * 1.15), mMax = Math.max(2, mm * 1.2);
      return [pad + (t / tMax) * (W - pad * 2), H - pad - ((mm - 1) / (mMax - 1)) * (H - pad * 2)];
    }

    function drawRocket(x, y, ang) {
      c.save(); c.translate(x, y); c.rotate(ang);
      // flame
      const f = 10 + Math.random() * 8;
      const g = c.createLinearGradient(-30 - f, 0, -12, 0);
      g.addColorStop(0, 'rgba(255,90,140,0)'); g.addColorStop(0.5, '#ff9a3c'); g.addColorStop(1, '#fff6a8');
      c.fillStyle = g;
      c.beginPath(); c.moveTo(-12, -6); c.quadraticCurveTo(-30 - f, 0, -12, 6); c.fill();
      // body
      const bg = c.createLinearGradient(0, -12, 0, 12);
      bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#ffc2dc');
      c.fillStyle = bg; c.strokeStyle = '#c2185b'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(22, 0); c.quadraticCurveTo(12, -12, -12, -9); c.lineTo(-12, 9); c.quadraticCurveTo(12, 12, 22, 0); c.fill(); c.stroke();
      // fins
      c.fillStyle = '#ff5c93';
      c.beginPath(); c.moveTo(-6, -9); c.lineTo(-16, -17); c.lineTo(-12, -6); c.fill();
      c.beginPath(); c.moveTo(-6, 9); c.lineTo(-16, 17); c.lineTo(-12, 6); c.fill();
      // heart window
      c.fillStyle = '#ff3e7f';
      c.beginPath(); c.moveTo(4, 4); c.bezierCurveTo(-4, -1, 0, -7, 4, -3); c.bezierCurveTo(8, -7, 12, -1, 4, 4); c.fill();
      c.restore();
    }

    function frame(now) {
      if (!alive) return;
      const el = (now - t0) / 1000;
      c.clearRect(0, 0, W, H);
      // stars
      const speed = phase === 'fly' ? 0.0004 * m : 0.00005;
      c.fillStyle = '#fff';
      for (const s of stars) {
        s.x -= speed * s.s; if (s.x < 0) { s.x = 1; s.y = Math.random(); }
        c.globalAlpha = 0.3 + s.s * 0.25;
        c.fillRect(s.x * W, s.y * H, s.s, s.s);
      }
      c.globalAlpha = 1;
      // grid
      c.strokeStyle = 'rgba(255,255,255,0.06)'; c.lineWidth = 1;
      for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(0, (H / 6) * i); c.lineTo(W, (H / 6) * i); c.stroke(); }

      if (phase === 'wait') {
        const left = Math.max(0, 5 - el);
        status.textContent = `Next launch in ${left.toFixed(1)}s`;
        multEl.textContent = '1.00×';
        if (left <= 0) startFlight();
        const [x, y] = point(0, 1);
        drawRocket(x, y + Math.sin(now / 200) * 2, -0.5);
      } else {
        const tt = phase === 'fly' ? el : Math.log(cp) / RATE;
        const mm = phase === 'fly' ? Math.exp(RATE * tt) : cp;
        if (phase === 'fly') {
          m = mm;
          if (m >= cp) { m = cp; doCrash(); }
          else {
            multEl.textContent = fmtMult(m);
            const auto = parseFloat($('#auto').value);
            if (myBet && auto >= 1.01 && m >= auto) cashOut();
            else if (myBet) act.querySelector('.sub').textContent = fmt(myBet * m);
            bots.forEach((b) => { if (!b.out && m >= b.target) b.out = m; });
          }
          status.textContent = cashedAt ? `You cashed out at ${fmtMult(cashedAt)}!` : myBet ? 'Flying… cash out anytime!' : '';
        } else {
          status.textContent = `Crashed at ${fmtMult(cp)}`;
          if (el > 2.6) newRound();
        }
        // curve
        const grad = c.createLinearGradient(0, H, W, 0);
        grad.addColorStop(0, '#ff8ac0'); grad.addColorStop(1, '#ffd23a');
        c.beginPath();
        const steps = 60;
        for (let i = 0; i <= steps; i++) {
          const ti = (tt * i) / steps;
          const [x, y] = pointScaled(ti, Math.exp(RATE * ti), tt, mm);
          i ? c.lineTo(x, y) : c.moveTo(x, y);
        }
        const [ex, ey] = pointScaled(tt, mm, tt, mm);
        c.strokeStyle = phase === 'crashed' ? '#ff4d6d' : grad; c.lineWidth = 5; c.lineCap = 'round';
        c.shadowColor = '#ff5c93'; c.shadowBlur = 16; c.stroke(); c.shadowBlur = 0;
        c.lineTo(ex, H - 40); c.lineTo(40, H - 40); c.closePath();
        const fill = c.createLinearGradient(0, ey, 0, H);
        fill.addColorStop(0, phase === 'crashed' ? 'rgba(255,77,109,0.25)' : 'rgba(255,92,147,0.3)'); fill.addColorStop(1, 'rgba(255,92,147,0)');
        c.fillStyle = fill; c.fill();
        if (phase === 'fly') {
          const [px, py] = pointScaled(tt * 0.97, Math.exp(RATE * tt * 0.97), tt, mm);
          drawRocket(ex, ey, Math.atan2(ey - py, ex - px));
        } else {
          c.font = '40px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText('💥', ex, ey);
        }
      }
      // bots list
      $('.crash-players').innerHTML = bots.map((b) => `<div class="${b.out ? 'out' : phase === 'crashed' ? 'lost' : ''}"><span>${b.name}</span><span>${b.out ? fmtMult(b.out) : fmt(b.bet)}</span></div>`).join('');
      requestAnimationFrame(frame);
    }
    function pointScaled(t, mm, tNow, mNow) {
      const pad = 40;
      const tMax = Math.max(8, tNow * 1.15), mMax = Math.max(2, mNow * 1.2);
      return [pad + (t / tMax) * (W - pad * 2), H - pad - ((mm - 1) / (mMax - 1)) * (H - pad * 2)];
    }

    newRound();
    requestAnimationFrame(frame);
    const onKey = (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.target.matches('input,button')) { e.preventDefault(); act.click(); } };
    addEventListener('keydown', onKey);
    return () => {
      alive = false; ro.disconnect(); removeEventListener('keydown', onKey);
      if (phase === 'fly' && myBet) cashOut();
    };
  },
};
