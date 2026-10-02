import { sleep, shuffle } from '../util.js';
import { betControl, toast } from '../ui.js';
import { sfx } from '../audio.js';
import { S } from '../state.js';
import { KENO_PAY } from './keno-math.js';

export default {
  rules: `<p>Pick between <b>1 and 10</b> numbers from 1–40. The machine then draws <b>10</b> numbers. The more of your picks it hits, the more you win.</p>
    <p>The paytable on the right updates for the number of picks you've made.</p><p class="muted">Return ≈ 99% for every pick count.</p>`,

  mount(root, ctx) {
    let picks = new Set(), busy = false;
    root.innerHTML = `
    <div class="keno-layout">
      <div class="keno-grid">${Array.from({ length: 40 }, (_, i) => `<button class="kn" data-n="${i + 1}">${i + 1}</button>`).join('')}</div>
      <div class="panel pad">
        <div class="ctl-label" style="margin-bottom:8px">Paytable · <span id="pc">0</span> picks</div>
        <table class="keno-pay"></table>
        <div style="display:flex;gap:8px;margin-top:14px">
          <button class="btn ghost small" id="auto">🎲 Random 10</button>
          <button class="btn ghost small" id="clear">Clear</button>
        </div>
      </div>
    </div>
    <div class="controls panel">
      <div class="ctl-bet"></div>
      <div class="ctl-actions"><button class="btn primary big shine" id="play">DRAW</button></div>
    </div>`;
    const $ = (s) => root.querySelector(s);
    const bet = betControl('keno', { initial: 100 });
    $('.ctl-bet').appendChild(bet.el);
    const cells = [...root.querySelectorAll('.kn')];

    function drawPay(hits = -1) {
      const k = picks.size;
      $('#pc').textContent = k;
      if (!k) { $('.keno-pay').innerHTML = '<tr><td class="muted">Pick some numbers ♡</td><td></td></tr>'; return; }
      $('.keno-pay').innerHTML = KENO_PAY[k].map((m, x) => (m > 0 ? `<tr class="${x === hits ? 'hit' : ''}"><td>${x} hit${x === 1 ? '' : 's'}</td><td>${m}×</td></tr>` : '')).reverse().join('');
    }
    function clearDraw() { cells.forEach((c) => c.classList.remove('drawn')); }
    function toggle(n) {
      if (busy) return;
      clearDraw();
      if (picks.has(n)) picks.delete(n);
      else if (picks.size < 10) picks.add(n);
      else { sfx('error'); return; }
      cells[n - 1].classList.toggle('pick', picks.has(n));
      sfx('click');
      drawPay();
    }
    cells.forEach((c) => c.addEventListener('click', () => toggle(+c.dataset.n)));
    $('#clear').onclick = () => { if (busy) return; picks.clear(); cells.forEach((c) => c.classList.remove('pick', 'drawn')); drawPay(); };
    $('#auto').onclick = () => {
      if (busy) return;
      clearDraw();
      picks = new Set(shuffle([...Array(40).keys()].map((i) => i + 1)).slice(0, 10));
      cells.forEach((c) => c.classList.toggle('pick', picks.has(+c.dataset.n)));
      sfx('shimmer');
      drawPay();
    };

    async function play() {
      if (busy) return;
      if (!picks.size) { sfx('error'); toast('Pick at least one number.', { icon: '🔢' }); return; }
      const b = bet.value;
      if (!ctx.bet(b)) return;
      busy = true;
      $('#play').disabled = true; bet.disable(true);
      clearDraw();
      drawPay();
      const drawn = shuffle([...Array(40).keys()].map((i) => i + 1)).slice(0, 10);
      let hits = 0;
      for (const n of drawn) {
        await sleep(S.settings.fastMode ? 70 : 170);
        const c = cells[n - 1];
        c.classList.add('drawn');
        if (picks.has(n)) { hits++; sfx('gem'); drawPay(hits); } else sfx('tick');
      }
      const k = picks.size;
      const m = KENO_PAY[k][hits] || 0;
      drawPay(hits);
      ctx.settle(b, Math.floor(b * m), { anchor: $('.keno-grid') });
      if (hits >= 7) ctx.special('keno7');
      busy = false;
      $('#play').disabled = false; bet.disable(false); bet.refresh();
    }
    $('#play').onclick = play;
    drawPay();
  },
};
