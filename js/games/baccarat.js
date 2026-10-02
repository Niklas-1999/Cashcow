import { h, sleep, fmt, fmtShort } from '../util.js';
import { newShoe, deal } from './cards.js';
import { sfx } from '../audio.js';
import { S } from '../state.js';
import { toast } from '../ui.js';

const CHIPS = [[10, '#8a8fa8'], [50, '#e2264d'], [100, '#2b6dff'], [500, '#18a058'], [1000, '#1d1830'], [5000, '#9d4dff'], [25000, '#e0a015']];
const bv = (c) => (c.r === 'A' ? 1 : ['10', 'J', 'Q', 'K'].includes(c.r) ? 0 : +c.r);
const score = (cards) => cards.reduce((a, c) => a + bv(c), 0) % 10;

export default {
  rules: `<p>Bet on which hand finishes closest to <b>9</b>: Player, Banker, or a Tie. Card values: A = 1, 2–9 face value, 10/J/Q/K = 0. Only the last digit of the total counts.</p>
    <ul><li><b>Player</b> pays 1:1 · <b>Banker</b> pays 0.95:1 (5% commission) · <b>Tie</b> pays 8:1.</li>
    <li>On a tie, Player and Banker bets are returned.</li>
    <li>A total of 8 or 9 on two cards is a <b>natural</b> — no more cards are drawn.</li>
    <li>Third-card rules are applied automatically (Player draws on 0–5; Banker follows the standard tableau).</li></ul>`,

  mount(root, ctx) {
    root.innerHTML = `
    <div class="table felt red bac-table">
      <div class="bac-sides">
        <div class="bac-side player"><h3>PLAYER</h3><div class="bac-score" id="ps"></div><div class="hand" id="ph"></div></div>
        <div class="bac-side banker"><h3>BANKER</h3><div class="bac-score" id="bs"></div><div class="hand" id="bh"></div></div>
      </div>
      <div class="table-msg" id="msg"></div>
      <div class="bac-bets">
        <div class="bac-spot p" data-k="P"><div class="bs-name">PLAYER</div><div class="bs-pay">1 : 1</div><div class="bs-amt"></div></div>
        <div class="bac-spot t" data-k="T"><div class="bs-name">TIE</div><div class="bs-pay">8 : 1</div><div class="bs-amt"></div></div>
        <div class="bac-spot b" data-k="B"><div class="bs-name">BANKER</div><div class="bs-pay">0.95 : 1</div><div class="bs-amt"></div></div>
      </div>
      <div class="table-print">BANKER PAYS 0.95 TO 1 · TIE PAYS 8 TO 1</div>
    </div>
    <div class="controls panel">
      <div class="ctl-group"><div class="ctl-label">Chip value</div><div class="chip-select">${CHIPS.map(([v, c], i) => `<button data-v="${v}" style="--cc:${c}" class="${i === 2 ? 'on' : ''}">${fmtShort(v)}</button>`).join('')}</div></div>
      <div class="ctl-group" style="flex:1;min-width:200px"><div class="ctl-label">Bead road</div><div class="bead-road"></div></div>
      <div class="ctl-actions">
        <button class="btn ghost small" id="clear">Clear</button>
        <button class="btn ghost small" id="rebet">Rebet</button>
        <button class="btn primary big shine" id="deal">DEAL</button>
      </div>
    </div>`;
    const $ = (s) => root.querySelector(s);
    const shoeAnchor = h('<div class="shoe" style="right:50%;transform:translateX(50%);top:-80px;opacity:0"></div>');
    $('.bac-table').appendChild(shoeAnchor);
    let chip = 100, bets = {}, last = {}, busy = false, deck = newShoe(8);
    const road = [];
    const total = () => Object.values(bets).reduce((a, b) => a + b, 0);
    const drawCard = () => { if (deck.length < 30) { deck = newShoe(8); toast('New shoe shuffled.', { icon: '🔀' }); } return deck.pop(); };
    const msg = $('#msg');
    const setMsg = (t, cls) => { msg.className = `table-msg show ${cls}`; msg.innerHTML = `<span>${t}</span>`; };

    function drawBets() {
      root.querySelectorAll('.bac-spot').forEach((s) => {
        const v = bets[s.dataset.k] || 0;
        s.classList.toggle('has', v > 0);
        s.querySelector('.bs-amt').innerHTML = v ? `<i class="coin-i"></i>${fmt(v)}` : '';
      });
    }
    root.querySelectorAll('.bac-spot').forEach((s) => s.addEventListener('click', () => {
      if (busy) return;
      if (total() + chip > S.coins) { sfx('error'); toast('Not enough coins.', { type: 'warn', icon: '💸' }); return; }
      bets[s.dataset.k] = (bets[s.dataset.k] || 0) + chip;
      sfx('chip');
      drawBets();
    }));
    $('.chip-select').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      chip = +b.dataset.v; sfx('chip');
      root.querySelectorAll('.chip-select button').forEach((x) => x.classList.toggle('on', x === b));
    });
    $('#clear').onclick = () => { if (!busy) { bets = {}; drawBets(); } };
    $('#rebet').onclick = () => { if (busy) return; const t = Object.values(last).reduce((a, b) => a + b, 0); if (!t || t > S.coins) { sfx('error'); return; } bets = { ...last }; sfx('chip'); drawBets(); };

    function drawRoad() {
      $('.bead-road').innerHTML = road.slice(-60).map((r) => `<div class="bead ${r}">${r}</div>`).join('');
      $('.bead-road').scrollLeft = 99999;
    }

    async function play() {
      if (busy) return;
      const t = total();
      if (!t) { sfx('error'); toast('Place a bet on Player, Banker or Tie.', { icon: '🃏' }); return; }
      if (!ctx.bet(t)) return;
      busy = true; last = { ...bets };
      root.querySelectorAll('.controls button').forEach((b) => (b.disabled = true));
      msg.className = 'table-msg';
      root.querySelectorAll('.bac-side').forEach((s) => s.classList.remove('won'));
      const ph = $('#ph'), bh = $('#bh');
      ph.innerHTML = ''; bh.innerHTML = ''; $('#ps').textContent = ''; $('#bs').textContent = '';
      const P = [], B = [];
      const give = async (arr, el, sc) => {
        const c = drawCard(); arr.push(c);
        const cel = await deal(el, c, { from: shoeAnchor });
        if (arr.length === 3) cel.classList.add('sideways');
        $(sc).textContent = score(arr);
        sfx('tick');
      };
      await give(P, ph, '#ps'); await give(B, bh, '#bs'); await give(P, ph, '#ps'); await give(B, bh, '#bs');
      let ps = score(P), bs = score(B);
      if (ps < 8 && bs < 8) {
        let p3 = null;
        if (ps <= 5) { await sleep(300); await give(P, ph, '#ps'); p3 = bv(P[2]); }
        bs = score(B);
        let bankerDraws;
        if (p3 === null) bankerDraws = bs <= 5;
        else if (bs <= 2) bankerDraws = true;
        else if (bs === 3) bankerDraws = p3 !== 8;
        else if (bs === 4) bankerDraws = p3 >= 2 && p3 <= 7;
        else if (bs === 5) bankerDraws = p3 >= 4 && p3 <= 7;
        else if (bs === 6) bankerDraws = p3 === 6 || p3 === 7;
        else bankerDraws = false;
        if (bankerDraws) { await sleep(300); await give(B, bh, '#bs'); }
      }
      ps = score(P); bs = score(B);
      const winner = ps > bs ? 'P' : bs > ps ? 'B' : 'T';
      road.push(winner); drawRoad();
      let returned = 0;
      if (winner === 'P') returned += (bets.P || 0) * 2;
      if (winner === 'B') returned += (bets.B || 0) * 1.95;
      if (winner === 'T') returned += (bets.T || 0) * 9 + (bets.P || 0) + (bets.B || 0);
      if (winner !== 'T') root.querySelector(winner === 'P' ? '.bac-side.player' : '.bac-side.banker').classList.add('won');
      setMsg(winner === 'T' ? `Tie ${ps}–${bs}` : `${winner === 'P' ? 'Player' : 'Banker'} wins ${Math.max(ps, bs)}–${Math.min(ps, bs)}`, returned > t ? 'win' : returned === t ? 'push' : 'lose');
      ctx.settle(t, Math.floor(returned), { anchor: msg });
      await sleep(900);
      bets = {}; drawBets();
      busy = false;
      root.querySelectorAll('.controls button').forEach((b) => (b.disabled = false));
    }
    $('#deal').onclick = play;
    drawBets();
  },
};
