import { sleep, shuffle, pick, fmt } from '../util.js';
import { betControl } from '../ui.js';
import { sfx } from '../audio.js';
import { S } from '../state.js';
import { SYM_SVG, uri } from './slots.js';

const PRIZES = [
  { sym: 'scatter', mult: 100, p: 0.002 },
  { sym: 'gem', mult: 25, p: 0.006 },
  { sym: 'seven', mult: 10, p: 0.02 },
  { sym: 'star', mult: 5, p: 0.04 },
  { sym: 'bell', mult: 2, p: 0.06 },
  { sym: 'sakura', mult: 1, p: 0.1 },
];
const SYMS = PRIZES.map((p) => p.sym);

function makeTicket() {
  let r = Math.random(), prize = null;
  for (const p of PRIZES) { if (r < p.p) { prize = p; break; } r -= p.p; }
  const cells = [];
  const counts = {};
  const add = (s) => { cells.push(s); counts[s] = (counts[s] || 0) + 1; };
  if (prize) for (let i = 0; i < 3; i++) add(prize.sym);
  while (cells.length < 9) {
    const s = pick(SYMS.filter((x) => x !== prize?.sym && (counts[x] || 0) < 2));
    add(s);
  }
  return { cells: shuffle(cells), prize };
}

export default {
  rules: `<p>Buy a lucky ticket and scratch off the foil. Find <b>three matching symbols</b> to win that prize.</p>
    <table><tr><th>Symbol</th><th>Prize</th></tr>${PRIZES.map((p) => `<tr><td>${p.sym === 'scatter' ? 'Golden heart coin' : p.sym[0].toUpperCase() + p.sym.slice(1)}</td><td>${p.mult}× ticket</td></tr>`).join('')}</table>
    <p class="muted">Drag to scratch, or press Reveal. Return ≈ 97%.</p>`,

  mount(root, ctx) {
    const IMG = Object.fromEntries(SYMS.map((s) => [s, uri(SYM_SVG[s])]));
    root.innerHTML = `
    <div class="scratch-layout">
      <div class="ticket">
        <div class="ticket-head">♡ LUCKY WAIFU ♡</div>
        <div class="ticket-sub">MATCH 3 SYMBOLS TO WIN</div>
        <div class="ticket-area">
          <div class="scratch-grid">${Array.from({ length: 9 }, () => '<div class="scell"></div>').join('')}</div>
          <canvas class="scratch-canvas"></canvas>
        </div>
      </div>
      <div class="panel pad">
        <div class="ctl-label" style="margin-bottom:8px">Prizes</div>
        <table class="prize-list">${PRIZES.map((p) => `<tr><td><img src="${IMG[p.sym]}" alt=""> ×3</td><td>${p.mult}×</td></tr>`).join('')}</table>
      </div>
    </div>
    <div class="controls panel">
      <div class="ctl-bet"></div>
      <div class="ctl-actions">
        <button class="btn ghost" id="reveal" disabled>Reveal all</button>
        <button class="btn primary big shine" id="buy">BUY TICKET</button>
      </div>
    </div>`;
    const $ = (s) => root.querySelector(s);
    const bet = betControl('scratch', { initial: 100, label: 'Ticket price' });
    $('.ctl-bet').appendChild(bet.el);
    const canvas = $('.scratch-canvas'), c = canvas.getContext('2d');
    const cellsEl = [...root.querySelectorAll('.scell')];
    let ticket = null, price = 0, active = false, dpr = 1, moves = 0, settled = false;

    function paintFoil() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.globalCompositeOperation = 'source-over';
      const g = c.createLinearGradient(0, 0, r.width, r.height);
      g.addColorStop(0, '#d9d4e6'); g.addColorStop(0.3, '#f6f2ff'); g.addColorStop(0.5, '#c7bfdc'); g.addColorStop(0.7, '#f2edfb'); g.addColorStop(1, '#b8aed0');
      c.fillStyle = g; c.fillRect(0, 0, r.width, r.height);
      c.globalAlpha = 0.18;
      for (let i = 0; i < 400; i++) { c.fillStyle = Math.random() < 0.5 ? '#fff' : '#8a7fb8'; c.fillRect(Math.random() * r.width, Math.random() * r.height, 2, 2); }
      c.globalAlpha = 1;
      c.fillStyle = '#ff5c93';
      c.font = `900 ${r.width * 0.075}px "Mochiy Pop One", sans-serif`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('SCRATCH ME ♡', r.width / 2, r.height / 2);
      c.font = `${r.width * 0.06}px serif`;
      ['✦', '✧', '✦', '✧'].forEach((s, i) => c.fillText(s, r.width * (0.15 + i * 0.23), r.height * (i % 2 ? 0.22 : 0.8)));
      canvas.classList.remove('gone');
    }

    function newTicket() {
      ticket = makeTicket();
      cellsEl.forEach((el, i) => { el.className = 'scell'; el.innerHTML = `<img src="${IMG[ticket.cells[i]]}" alt="">`; });
      paintFoil();
      active = true; settled = false; moves = 0;
      $('#reveal').disabled = false;
    }

    function scratchAt(e) {
      if (!active) return;
      const r = canvas.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      c.globalCompositeOperation = 'destination-out';
      c.beginPath(); c.arc(x, y, Math.max(18, r.width * 0.06), 0, 7); c.fill();
      if (++moves % 6 === 0) { sfx('scratch'); checkCleared(); }
    }
    function checkCleared() {
      const d = c.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0, tot = 0;
      for (let i = 3; i < d.length; i += 4 * 40) { tot++; if (d[i] < 50) clear++; }
      if (clear / tot > 0.55) finish();
    }
    async function finish() {
      if (!active || settled) return;
      settled = true; active = false;
      canvas.classList.add('gone');
      $('#reveal').disabled = true;
      await sleep(350);
      const m = ticket.prize ? ticket.prize.mult : 0;
      if (ticket.prize) cellsEl.forEach((el, i) => { if (ticket.cells[i] === ticket.prize.sym) el.classList.add('win'); });
      ctx.settle(price, price * m, { anchor: $('.ticket-area') });
    }

    let down = false;
    canvas.addEventListener('pointerdown', (e) => { down = true; canvas.setPointerCapture(e.pointerId); scratchAt(e); });
    canvas.addEventListener('pointermove', (e) => { if (down) scratchAt(e); });
    canvas.addEventListener('pointerup', () => { down = false; if (active) checkCleared(); });

    $('#buy').onclick = async () => {
      if (active) await finish();
      const b = bet.value;
      if (!ctx.bet(b)) return;
      price = b;
      sfx('whoosh');
      $('.ticket').animate([{ transform: 'translateY(-30px) rotate(-3deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.2,1.4,.4,1)' });
      newTicket();
    };
    $('#reveal').onclick = finish;
    // initial dummy ticket under foil
    ticket = makeTicket();
    cellsEl.forEach((el, i) => (el.innerHTML = `<img src="${IMG[ticket.cells[i]]}" alt="">`));
    requestAnimationFrame(paintFoil);
    return () => { if (active) finish(); };
  },
};
