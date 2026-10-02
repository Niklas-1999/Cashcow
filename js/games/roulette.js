import { h, sleep, fmt, fmtShort } from '../util.js';
import { sfx } from '../audio.js';
import { S } from '../state.js';
import { toast } from '../ui.js';

const ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const color = (n) => (n === 0 ? 'green' : REDS.has(n) ? 'red' : 'black');
const STEP = 360 / 37;
const CHIPS = [[10, '#8a8fa8'], [50, '#e2264d'], [100, '#2b6dff'], [500, '#18a058'], [1000, '#1d1830'], [5000, '#9d4dff'], [25000, '#e0a015']];

const PAYS = (key, n) => {
  if (key.startsWith('n')) return +key.slice(1) === n ? 36 : 0;
  if (n === 0) return 0;
  switch (key) {
    case 'red': return REDS.has(n) ? 2 : 0;
    case 'black': return !REDS.has(n) ? 2 : 0;
    case 'odd': return n % 2 ? 2 : 0;
    case 'even': return n % 2 === 0 ? 2 : 0;
    case 'low': return n <= 18 ? 2 : 0;
    case 'high': return n >= 19 ? 2 : 0;
    case 'd1': return n <= 12 ? 3 : 0;
    case 'd2': return n > 12 && n <= 24 ? 3 : 0;
    case 'd3': return n > 24 ? 3 : 0;
    case 'c1': return n % 3 === 1 ? 3 : 0;
    case 'c2': return n % 3 === 2 ? 3 : 0;
    case 'c3': return n % 3 === 0 ? 3 : 0;
  }
  return 0;
};

function wheelSvg() {
  const R = 200, rOut = 176, rIn = 128;
  let pockets = '';
  ORDER.forEach((n, i) => {
    const a0 = ((i - 0.5) * STEP - 90) * Math.PI / 180, a1 = ((i + 0.5) * STEP - 90) * Math.PI / 180;
    const p = (r, a) => `${(R + Math.cos(a) * r).toFixed(2)} ${(R + Math.sin(a) * r).toFixed(2)}`;
    const fill = n === 0 ? '#14a060' : REDS.has(n) ? '#d11d3c' : '#17121f';
    pockets += `<path d="M ${p(rOut, a0)} A ${rOut} ${rOut} 0 0 1 ${p(rOut, a1)} L ${p(rIn, a1)} A ${rIn} ${rIn} 0 0 0 ${p(rIn, a0)} Z" fill="${fill}" stroke="#d9b45a" stroke-width="1.2"/>`;
    const am = i * STEP;
    pockets += `<text x="${R}" y="${R - 158}" transform="rotate(${am} ${R} ${R})" text-anchor="middle" font-size="15" font-weight="900" fill="#fff" font-family="sans-serif">${n}</text>`;
  });
  return `<svg viewBox="0 0 400 400">
    <defs>
      <radialGradient id="rwWood" cx=".5" cy=".5" r=".5"><stop offset=".85" stop-color="#6b3418"/><stop offset=".95" stop-color="#3a1608"/><stop offset="1" stop-color="#1e0a02"/></radialGradient>
      <linearGradient id="rwGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#d9a52a"/><stop offset="1" stop-color="#8a6410"/></linearGradient>
      <radialGradient id="rwCone" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#8a4a22"/><stop offset="1" stop-color="#3a1608"/></radialGradient>
      <radialGradient id="rwBall" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#e6e6ee"/><stop offset="1" stop-color="#9a9aaa"/></radialGradient>
    </defs>
    <circle cx="200" cy="200" r="199" fill="url(#rwWood)"/>
    <circle cx="200" cy="200" r="186" fill="#2a1206" stroke="url(#rwGold)" stroke-width="3"/>
    <g id="rw-wheel">
      ${pockets}
      <circle cx="200" cy="200" r="128" fill="url(#rwCone)" stroke="url(#rwGold)" stroke-width="3"/>
      <circle cx="200" cy="200" r="96" fill="none" stroke="#d9b45a" stroke-width="1" opacity=".5"/>
      ${[0, 90, 180, 270].map((a) => `<g transform="rotate(${a} 200 200)"><path d="M 196 200 L 196 128 Q 200 118 204 128 L 204 200 Z" fill="url(#rwGold)"/><circle cx="200" cy="124" r="7" fill="url(#rwGold)"/></g>`).join('')}
      <circle cx="200" cy="200" r="22" fill="url(#rwGold)" stroke="#8a6410" stroke-width="2"/>
      <circle cx="200" cy="200" r="9" fill="#fff6c8"/>
    </g>
    <g id="rw-ball"><circle cx="200" cy="18" r="8" fill="url(#rwBall)" stroke="#777" stroke-width=".8" id="rw-ballc"/></g>
  </svg>`;
}

export default {
  rules: `<p>European single-zero roulette. Choose a chip value and click the table to place bets, then spin.</p>
    <table><tr><th>Bet</th><th>Pays</th></tr>
    <tr><td>Straight number (0–36)</td><td>35 : 1</td></tr>
    <tr><td>Dozen / Column</td><td>2 : 1</td></tr>
    <tr><td>Red / Black, Odd / Even, 1–18 / 19–36</td><td>1 : 1</td></tr></table>
    <p class="muted">Outside bets lose on 0. Right-click (or long-press) a spot to remove one chip. House edge 2.7%.</p>`,

  mount(root, ctx) {
    let cells = `<div class="rl-cell green" data-k="n0" style="grid-row:1/4;grid-column:1">0</div>`;
    for (let n = 1; n <= 36; n++) {
      const col = 2 + Math.floor((n - 1) / 3), row = 3 - ((n - 1) % 3);
      cells += `<div class="rl-cell ${color(n)}" data-k="n${n}" style="grid-row:${row};grid-column:${col}">${n}</div>`;
    }
    cells += ['c3', 'c2', 'c1'].map((k, i) => `<div class="rl-cell out" data-k="${k}" style="grid-row:${i + 1};grid-column:14">2:1</div>`).join('');
    cells += ['1st 12', '2nd 12', '3rd 12'].map((t, i) => `<div class="rl-cell out" data-k="d${i + 1}" style="grid-row:4;grid-column:${2 + i * 4}/span 4">${t}</div>`).join('');
    cells += [['low', '1–18'], ['even', 'EVEN'], ['red', '◆'], ['black', '◆'], ['odd', 'ODD'], ['high', '19–36']].map(([k, t], i) =>
      `<div class="rl-cell out ${k === 'red' ? 'red' : k === 'black' ? 'black' : ''}" data-k="${k}" style="grid-row:5;grid-column:${2 + i * 2}/span 2">${t}</div>`).join('');

    root.innerHTML = `
    <div class="rl-layout">
      <div class="rl-wheel-wrap">${wheelSvg()}<div class="rl-result"></div></div>
      <div class="rl-info panel pad">
        <div class="ctl-label">Last numbers</div>
        <div class="rl-hist"></div>
        <div class="rl-stats"></div>
      </div>
    </div>
    <div class="rl-board-scroll"><div class="rl-board felt table">${cells}</div></div>
    <div class="controls panel">
      <div class="ctl-group"><div class="ctl-label">Chip value</div><div class="chip-select">${CHIPS.map(([v, c], i) => `<button data-v="${v}" style="--cc:${c}" class="${i === 2 ? 'on' : ''}">${fmtShort(v)}</button>`).join('')}</div></div>
      <div class="ctl-group"><div class="ctl-label">Total bet</div><div class="bet-total"><i class="coin-i"></i><span id="tot">0</span></div></div>
      <div class="ctl-actions">
        <button class="btn ghost small" id="undo">↶ Undo</button>
        <button class="btn ghost small" id="clear">Clear</button>
        <button class="btn ghost small" id="dbl">2×</button>
        <button class="btn ghost small" id="rebet">Rebet</button>
        <button class="btn primary big shine" id="spin">SPIN</button>
      </div>
    </div>`;
    const $ = (s) => root.querySelector(s);
    const board = $('.rl-board');
    const wheel = root.querySelector('#rw-wheel'), ballG = root.querySelector('#rw-ball'), ballC = root.querySelector('#rw-ballc');
    let chip = 100, bets = {}, history = [], last = {}, spinning = false, wheelAngle = 0, alive = true;
    const past = [];
    const total = () => Object.values(bets).reduce((a, b) => a + b, 0);
    const chipColor = (v) => (CHIPS.slice().reverse().find(([cv]) => v >= cv) || CHIPS[0])[1];

    function drawChips() {
      board.querySelectorAll('.rl-chip').forEach((c) => c.remove());
      for (const [k, v] of Object.entries(bets)) {
        const cell = board.querySelector(`[data-k="${k}"]`);
        cell.appendChild(h(`<div class="rl-chip" style="--cc:${chipColor(v)}">${fmtShort(v)}</div>`));
      }
      $('#tot').textContent = fmt(total());
    }
    function place(k, amt) {
      if (spinning) return;
      if (total() + amt > S.coins) { sfx('error'); toast('Not enough coins for that chip.', { type: 'warn', icon: '💸' }); return; }
      bets[k] = (bets[k] || 0) + amt;
      history.push([k, amt]);
      sfx('chip');
      drawChips();
    }
    board.addEventListener('click', (e) => { const c = e.target.closest('[data-k]'); if (c) place(c.dataset.k, chip); });
    board.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const c = e.target.closest('[data-k]');
      if (!c || spinning || !bets[c.dataset.k]) return;
      bets[c.dataset.k] = Math.max(0, bets[c.dataset.k] - chip);
      if (!bets[c.dataset.k]) delete bets[c.dataset.k];
      sfx('chip'); drawChips();
    });
    $('.chip-select').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      chip = +b.dataset.v; sfx('chip');
      root.querySelectorAll('.chip-select button').forEach((x) => x.classList.toggle('on', x === b));
    });
    $('#undo').onclick = () => { if (spinning) return; const l = history.pop(); if (!l) return; bets[l[0]] -= l[1]; if (bets[l[0]] <= 0) delete bets[l[0]]; sfx('chip'); drawChips(); };
    $('#clear').onclick = () => { if (spinning) return; bets = {}; history = []; drawChips(); };
    $('#dbl').onclick = () => { if (spinning) return; if (total() * 2 > S.coins) { sfx('error'); return; } for (const k in bets) { history.push([k, bets[k]]); bets[k] *= 2; } sfx('chip'); drawChips(); };
    $('#rebet').onclick = () => { if (spinning || !Object.keys(last).length) return; const t = Object.values(last).reduce((a, b) => a + b, 0); if (t > S.coins) { sfx('error'); return; } bets = { ...last }; history = Object.entries(bets); sfx('chip'); drawChips(); };

    function setBall(angle, r) {
      ballG.setAttribute('transform', `rotate(${angle} 200 200)`);
      ballC.setAttribute('cy', 200 - r);
    }
    setBall(0, 182);

    async function spin() {
      if (spinning) return;
      const t = total();
      if (!t) { sfx('error'); toast('Place a bet on the table first.', { icon: '🎡' }); return; }
      if (!ctx.bet(t)) return;
      spinning = true;
      last = { ...bets };
      root.querySelectorAll('.controls button').forEach((b) => (b.disabled = true));
      $('.rl-result').classList.remove('show');
      board.querySelectorAll('.hit').forEach((c) => c.classList.remove('hit'));
      const result = Math.floor(Math.random() * 37);
      const idx = ORDER.indexOf(result);
      const fast = S.settings.fastMode;
      const dur = fast ? 2600 : 5200;
      const w0 = wheelAngle, w1 = w0 + 360 * (fast ? 1.5 : 2.5) + Math.random() * 360;
      const bFinal = w1 + idx * STEP;
      const b0 = bFinal + 360 * (fast ? 4 : 7);
      sfx('whoosh');
      const t0 = performance.now();
      let lastTick = 0;
      await new Promise((res) => {
        const frame = (now) => {
          if (!alive) return res();
          const k = Math.min(1, (now - t0) / dur);
          const ew = 1 - Math.pow(1 - k, 3);
          const eb = 1 - Math.pow(1 - k, 2.4);
          const wa = w0 + (w1 - w0) * ew;
          const ba = b0 + (bFinal - b0) * eb;
          let r = 182;
          if (k > 0.55) {
            const q = (k - 0.55) / 0.45;
            r = 182 - 30 * Math.min(1, q * 1.4) + Math.abs(Math.sin(q * 14)) * 8 * (1 - q);
          }
          wheel.setAttribute('transform', `rotate(${wa} 200 200)`);
          setBall(ba, r);
          const tickEvery = 40 + k * 260;
          if (now - lastTick > tickEvery && k < 0.97) { sfx('tick'); lastTick = now; }
          if (k < 1) requestAnimationFrame(frame); else res();
        };
        requestAnimationFrame(frame);
      });
      if (!alive) return;
      wheelAngle = w1 % 360;
      wheel.setAttribute('transform', `rotate(${wheelAngle} 200 200)`);
      setBall(bFinal % 360, 152);
      sfx('reelStop');
      const res = $('.rl-result');
      res.className = `rl-result show bg-${color(result)}`;
      res.textContent = result;
      const hs = $('.rl-hist');
      if (!past.length) hs.innerHTML = '';
      hs.prepend(h(`<span class="bg-${color(result)}">${result}</span>`));
      while (hs.children.length > 18) hs.lastChild.remove();
      past.push(result);
      renderStats();
      // payout
      let returned = 0, straight = false;
      for (const [k, v] of Object.entries(bets)) {
        const m = PAYS(k, result);
        if (m) { returned += v * m; board.querySelector(`[data-k="${k}"]`).classList.add('hit'); if (k.startsWith('n')) straight = true; }
      }
      board.querySelector(`[data-k="n${result}"]`).classList.add('hit');
      ctx.settle(t, returned, { anchor: $('.rl-wheel-wrap') });
      if (straight) ctx.special('straightup');
      await sleep(1400);
      bets = {}; history = [];
      drawChips();
      spinning = false;
      root.querySelectorAll('.controls button').forEach((b) => (b.disabled = false));
    }
    function renderStats() {
      const cnt = (f) => past.filter(f).length;
      if (!past.length) $('.rl-hist').innerHTML = '<span class="muted" style="width:auto;font-size:13px;font-weight:700">No spins yet — place your chips ♡</span>';
      $('.rl-stats').innerHTML = `<div><b class="c-red">${cnt((n) => color(n) === 'red')}</b><span>Red</span></div><div><b>${cnt((n) => color(n) === 'black')}</b><span>Black</span></div><div><b class="c-green">${cnt((n) => n === 0)}</b><span>Zero</span></div><div><b>${past.length}</b><span>Spins</span></div>`;
    }
    $('#spin').onclick = spin;
    renderStats();
    drawChips();
    return () => { alive = false; };
  },
};
