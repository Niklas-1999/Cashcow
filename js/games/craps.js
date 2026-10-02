import { h, sleep, fmt, fmtShort, randInt } from '../util.js';
import { sfx } from '../audio.js';
import { S, earn } from '../state.js';
import { toast } from '../ui.js';

const CHIPS = [[10, '#8a8fa8'], [50, '#e2264d'], [100, '#2b6dff'], [500, '#18a058'], [1000, '#1d1830'], [5000, '#9d4dff'], [25000, '#e0a015']];
const PIPS = { 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };
const ROT = { 1: [0, 0], 6: [0, 180], 2: [0, -90], 5: [0, 90], 3: [-90, 0], 4: [90, 0] };
const BETS = [
  { k: 'pass', name: 'PASS LINE', pay: '1 : 1', wide: true },
  { k: 'dp', name: "DON'T PASS", pay: '1 : 1 · 12 pushes' },
  { k: 'field', name: 'FIELD', pay: '2,3,4,9,10,11,12 · 2&12 pay double/triple' },
  { k: 'seven', name: 'ANY 7', pay: '4 : 1 · one roll' },
  { k: 'craps', name: 'ANY CRAPS', pay: '7 : 1 · 2, 3 or 12' },
  { k: 'yo', name: 'YO 11', pay: '15 : 1 · one roll' },
];

function dieHtml() {
  const face = (n) => `<div class="face f${n}">${Array.from({ length: 9 }, (_, i) => (PIPS[n].includes(i + 1) ? '<i></i>' : '<span></span>')).join('')}</div>`;
  return `<div class="die3d">${[1, 2, 3, 4, 5, 6].map(face).join('')}</div>`;
}

export default {
  rules: `<p>Roll two dice. Bets are placed with chips and resolved automatically.</p>
    <ul><li><b>Pass Line</b> (come-out roll only): 7 or 11 wins, 2/3/12 loses. Any other number becomes the <b>point</b> — roll it again before a 7 to win.</li>
    <li><b>Don't Pass</b>: the opposite. 2 or 3 wins, 12 pushes, 7/11 loses; after a point, a 7 before the point wins.</li>
    <li><b>Field</b> (one roll): wins on 2, 3, 4, 9, 10, 11, 12. Pays 1:1, 2 pays 2:1, 12 pays 3:1.</li>
    <li><b>Any 7</b> 4:1 · <b>Any Craps</b> (2, 3, 12) 7:1 · <b>Yo</b> (11) 15:1 — all one-roll bets.</li></ul>
    <p class="muted">Line bets cannot be placed or removed while a point is on. Leaving the table refunds open line bets.</p>`,

  mount(root, ctx) {
    root.innerHTML = `
    <div class="table felt craps-table">
      <div class="craps-top">
        <div class="puck off" id="puck">OFF</div>
        <div class="dice-zone">${dieHtml()}${dieHtml()}</div>
        <div class="hand-total" id="sum" style="font-size:26px;padding:6px 16px"></div>
      </div>
      <div class="table-msg" id="msg"></div>
      <div class="craps-bets">${BETS.map((b) => `<div class="cbet ${b.wide ? 'wide' : ''}" data-k="${b.k}"><div class="cb-name">${b.name}</div><div class="cb-pay">${b.pay}</div><div class="cb-amt"></div></div>`).join('')}</div>
      <div class="table-print">CASHCOW CRAPS · POINT ${'&nbsp;'}<span id="pt">—</span></div>
    </div>
    <div class="controls panel">
      <div class="ctl-group"><div class="ctl-label">Chip value</div><div class="chip-select">${CHIPS.map(([v, c], i) => `<button data-v="${v}" style="--cc:${c}" class="${i === 2 ? 'on' : ''}">${fmtShort(v)}</button>`).join('')}</div></div>
      <div class="ctl-actions">
        <button class="btn ghost small" id="clear">Clear new bets</button>
        <button class="btn primary big shine" id="roll">ROLL 🎲</button>
      </div>
    </div>`;
    const $ = (s) => root.querySelector(s);
    const dice = [...root.querySelectorAll('.die3d')];
    const rot = [[0, 0], [0, 0]];
    let chip = 100, bets = {}, pending = {}, point = null, busy = false;
    const msg = $('#msg');
    const setMsg = (t, cls) => { msg.className = `table-msg show ${cls}`; msg.innerHTML = `<span>${t}</span>`; };

    function drawBets() {
      root.querySelectorAll('.cbet').forEach((el) => {
        const k = el.dataset.k;
        const v = (bets[k] || 0) + (pending[k] || 0);
        el.classList.toggle('has', v > 0);
        el.classList.toggle('locked', point !== null && (k === 'pass' || k === 'dp'));
        el.querySelector('.cb-amt').innerHTML = v ? `<i class="coin-i"></i>${fmt(v)}` : '';
      });
      const puck = $('#puck');
      puck.className = 'puck ' + (point ? 'on' : 'off');
      puck.innerHTML = point ? `ON<br>${point}` : 'OFF';
      $('#pt').textContent = point || '—';
    }
    const pendingTotal = () => Object.values(pending).reduce((a, b) => a + b, 0);
    root.querySelectorAll('.cbet').forEach((el) => el.addEventListener('click', () => {
      const k = el.dataset.k;
      if (busy) return;
      if (point !== null && (k === 'pass' || k === 'dp')) { sfx('error'); toast('Line bets are locked while the point is on.', { icon: '🔒' }); return; }
      if (pendingTotal() + chip > S.coins) { sfx('error'); toast('Not enough coins.', { type: 'warn', icon: '💸' }); return; }
      pending[k] = (pending[k] || 0) + chip;
      sfx('chip'); drawBets();
    }));
    $('.chip-select').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      chip = +b.dataset.v; sfx('chip');
      root.querySelectorAll('.chip-select button').forEach((x) => x.classList.toggle('on', x === b));
    });
    $('#clear').onclick = () => { if (!busy) { pending = {}; drawBets(); } };

    async function roll() {
      if (busy) return;
      const add = pendingTotal();
      const hasAny = add > 0 || Object.values(bets).some((v) => v > 0);
      if (!hasAny) { sfx('error'); toast('Place a bet first — try the Pass Line!', { icon: '🎲' }); return; }
      if (add && !ctx.bet(add)) return;
      for (const k in pending) bets[k] = (bets[k] || 0) + pending[k];
      pending = {};
      busy = true;
      root.querySelectorAll('.controls button').forEach((b) => (b.disabled = true));
      msg.className = 'table-msg';
      root.querySelectorAll('.cbet.won').forEach((x) => x.classList.remove('won'));
      drawBets();
      const d = [randInt(1, 6), randInt(1, 6)];
      sfx('roll');
      dice.forEach((el, i) => {
        const [bx, by] = ROT[d[i]];
        rot[i][0] = Math.ceil(rot[i][0] / 360) * 360 + 720 + bx;
        rot[i][1] = Math.ceil(rot[i][1] / 360) * 360 + 1080 + by;
        el.style.transform = `rotateX(${rot[i][0]}deg) rotateY(${rot[i][1]}deg)`;
      });
      await sleep(S.settings.fastMode ? 700 : 1150);
      const sum = d[0] + d[1];
      $('#sum').textContent = sum;
      sfx('reelStop');

      let wagered = 0, returned = 0;
      const resolve = (k, mult) => { wagered += bets[k]; returned += bets[k] * mult; if (mult > 1) root.querySelector(`.cbet[data-k="${k}"]`).classList.add('won'); delete bets[k]; };
      // one-roll bets
      if (bets.field) resolve('field', sum === 2 ? 3 : sum === 12 ? 4 : [3, 4, 9, 10, 11].includes(sum) ? 2 : 0);
      if (bets.seven) resolve('seven', sum === 7 ? 5 : 0);
      if (bets.craps) resolve('craps', [2, 3, 12].includes(sum) ? 8 : 0);
      if (bets.yo) resolve('yo', sum === 11 ? 16 : 0);
      // line bets
      let text;
      if (point === null) {
        if (sum === 7 || sum === 11) { if (bets.pass) resolve('pass', 2); if (bets.dp) resolve('dp', 0); text = `${sum} — Natural!`; }
        else if ([2, 3, 12].includes(sum)) { if (bets.pass) resolve('pass', 0); if (bets.dp) resolve('dp', sum === 12 ? 1 : 2); text = `${sum} — Craps!`; }
        else { point = sum; text = `Point is ${sum}`; sfx('chip'); }
      } else if (sum === point) {
        if (bets.pass) { resolve('pass', 2); ctx.special('crapsPoint'); }
        if (bets.dp) resolve('dp', 0);
        text = `${sum} — Point made!`;
        point = null;
      } else if (sum === 7) {
        if (bets.pass) resolve('pass', 0);
        if (bets.dp) resolve('dp', 2);
        text = 'Seven out!';
        point = null;
      } else text = `Rolled ${sum}`;
      drawBets();
      setMsg(text, returned > wagered ? 'win' : wagered && returned < wagered ? 'lose' : 'push');
      if (wagered > 0) ctx.settle(wagered, returned, { anchor: msg });
      busy = false;
      root.querySelectorAll('.controls button').forEach((b) => (b.disabled = false));
    }
    $('#roll').onclick = roll;
    drawBets();
    return () => {
      const open = Object.values(bets).reduce((a, b) => a + b, 0);
      if (open > 0) { earn(open); toast(`Open craps bets refunded: ${fmt(open)} coins`, { icon: '🎲' }); }
    };
  },
};
