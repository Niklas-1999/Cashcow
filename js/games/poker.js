import { sleep } from '../util.js';
import { betControl } from '../ui.js';
import { newDeck, cardEl, flip, rankValue } from './cards.js';
import { shuffle } from '../util.js';
import { sfx } from '../audio.js';
import { S } from '../state.js';

const PAYTABLE = [
  ['Royal Flush', 800], ['Straight Flush', 50], ['Four of a Kind', 25], ['Full House', 9], ['Flush', 6],
  ['Straight', 4], ['Three of a Kind', 3], ['Two Pair', 2], ['Jacks or Better', 1],
];

export function evaluate(cards) {
  const vals = cards.map((c) => rankValue(c.r)).sort((a, b) => a - b);
  const counts = {};
  vals.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
  const groups = Object.entries(counts).map(([v, n]) => [+v, n]).sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = cards.every((c) => c.s === cards[0].s);
  const uniq = groups.length === 5;
  const wheel = vals.join() === '2,3,4,5,14';
  const straight = uniq && (vals[4] - vals[0] === 4 || wheel);
  const used = (pred) => cards.map((c, i) => (pred(rankValue(c.r)) ? i : -1)).filter((i) => i >= 0);
  const all = [0, 1, 2, 3, 4];
  if (straight && flush && vals[0] === 10) return { idx: 0, used: all };
  if (straight && flush) return { idx: 1, used: all };
  if (groups[0][1] === 4) return { idx: 2, used: used((v) => v === groups[0][0]) };
  if (groups[0][1] === 3 && groups[1][1] === 2) return { idx: 3, used: all };
  if (flush) return { idx: 4, used: all };
  if (straight) return { idx: 5, used: all };
  if (groups[0][1] === 3) return { idx: 6, used: used((v) => v === groups[0][0]) };
  if (groups[0][1] === 2 && groups[1][1] === 2) return { idx: 7, used: used((v) => v === groups[0][0] || v === groups[1][0]) };
  if (groups[0][1] === 2 && groups[0][0] >= 11) return { idx: 8, used: used((v) => v === groups[0][0]) };
  return null;
}

// simple strategy hint
function suggestHolds(cards) {
  const ev = evaluate(cards);
  if (ev && ev.idx <= 5) return [0, 1, 2, 3, 4];
  if (ev) return ev.used;
  const bySuit = {};
  cards.forEach((c, i) => (bySuit[c.s] ||= []).push(i));
  const four = Object.values(bySuit).find((a) => a.length === 4);
  if (four) return four;
  const counts = {};
  cards.forEach((c, i) => (counts[c.r] ||= []).push(i));
  const pair = Object.values(counts).find((a) => a.length === 2);
  if (pair) return pair;
  return cards.map((c, i) => (rankValue(c.r) >= 11 ? i : -1)).filter((i) => i >= 0).slice(0, 2);
}

export default {
  rules: `<p><b>Jacks or Better</b>, full-pay 9/6. Deal five cards, choose which to <b>hold</b>, then draw replacements once.</p>
    <table><tr><th>Hand</th><th>Pays (× bet)</th></tr>${PAYTABLE.map(([n, p]) => `<tr><td>${n}</td><td>${p}</td></tr>`).join('')}</table>
    <p class="muted">Payouts include your stake. With good play the return is ~99.5%. Use <b>Hint</b> for a quick strategy suggestion. Keyboard: 1–5 hold, Space deal/draw.</p>`,

  mount(root, ctx) {
    root.innerHTML = `
    <table class="vp-paytable">${PAYTABLE.map(([n, p], i) => `<tr data-i="${i}"><td>${n}</td><td>${p}×</td></tr>`).join('')}</table>
    <div class="table vp-table" style="min-height:300px;display:flex;flex-direction:column;justify-content:center;padding-bottom:46px">
      <div class="vp-hand">${[0, 1, 2, 3, 4].map((i) => `<div class="vp-slot" data-i="${i}"><div class="vp-card"></div><div class="held-tag">HELD</div></div>`).join('')}</div>
      <div class="table-msg" id="msg"></div>
      <div class="table-print">JACKS OR BETTER · 9/6 FULL PAY</div>
    </div>
    <div class="controls panel">
      <div class="ctl-bet"></div>
      <div class="ctl-actions">
        <button class="btn ghost" id="hint" disabled>💡 Hint</button>
        <button class="btn primary big shine" id="go">DEAL</button>
      </div>
    </div>`;
    const $ = (s) => root.querySelector(s);
    const bet = betControl('poker', { initial: 100 });
    $('.ctl-bet').appendChild(bet.el);
    const slots = [...root.querySelectorAll('.vp-slot')];
    const msg = $('#msg');
    let deck, hand = [], held = [false, false, false, false, false], phase = 'idle', busy = false, curBet = 0;

    // show 5 face-down cards initially
    slots.forEach((s) => s.querySelector('.vp-card').replaceChildren(cardEl({ r: 'A', s: '♠' }, true)));

    function setHeld(i, v) {
      held[i] = v;
      slots[i].classList.toggle('held', v);
    }
    slots.forEach((s, i) => s.addEventListener('click', () => {
      if (phase !== 'hold' || busy) return;
      setHeld(i, !held[i]); sfx('click');
    }));

    async function dealOrDraw() {
      if (busy) return;
      if (phase === 'hold') return draw();
      const b = bet.value;
      if (!ctx.bet(b)) return;
      curBet = b;
      busy = true;
      bet.disable(true);
      $('#go').disabled = true;
      msg.className = 'table-msg';
      root.querySelectorAll('.vp-paytable tr').forEach((r) => r.classList.remove('hit'));
      deck = shuffle(newDeck());
      hand = [deck.pop(), deck.pop(), deck.pop(), deck.pop(), deck.pop()];
      held = [false, false, false, false, false];
      slots.forEach((s, i) => { setHeld(i, false); const el = s.querySelector('.pcard'); el.classList.remove('winner'); flip(el, false); });
      await sleep(250);
      for (let i = 0; i < 5; i++) {
        const el = cardEl(hand[i], true);
        slots[i].querySelector('.vp-card').replaceChildren(el);
        sfx('card');
        await sleep(S.settings.fastMode ? 50 : 110);
        flip(el, true);
      }
      const ev = evaluate(hand);
      if (ev) { root.querySelector(`.vp-paytable tr[data-i="${ev.idx}"]`).classList.add('hit'); setMsgText(PAYTABLE[ev.idx][0], 'push'); }
      phase = 'hold';
      busy = false;
      $('#go').disabled = false;
      $('#go').textContent = 'DRAW';
      $('#hint').disabled = false;
    }

    function setMsgText(t, cls) { msg.className = `table-msg show ${cls}`; msg.innerHTML = `<span>${t}</span>`; }

    async function draw() {
      busy = true;
      $('#go').disabled = true;
      $('#hint').disabled = true;
      msg.className = 'table-msg';
      for (let i = 0; i < 5; i++) {
        if (held[i]) continue;
        const el = slots[i].querySelector('.pcard');
        flip(el, false);
      }
      await sleep(300);
      for (let i = 0; i < 5; i++) {
        if (held[i]) continue;
        hand[i] = deck.pop();
        const el = cardEl(hand[i], true);
        slots[i].querySelector('.vp-card').replaceChildren(el);
        sfx('card');
        await sleep(S.settings.fastMode ? 60 : 140);
        flip(el, true);
      }
      await sleep(250);
      const ev = evaluate(hand);
      root.querySelectorAll('.vp-paytable tr').forEach((r) => r.classList.remove('hit'));
      let returned = 0;
      if (ev) {
        returned = curBet * PAYTABLE[ev.idx][1];
        root.querySelector(`.vp-paytable tr[data-i="${ev.idx}"]`).classList.add('hit');
        ev.used.forEach((i) => slots[i].querySelector('.pcard').classList.add('winner'));
        setMsgText(PAYTABLE[ev.idx][0] + '!', 'win');
        if (ev.idx === 0) ctx.special('royalflush');
      } else setMsgText('No win', 'lose');
      ctx.settle(curBet, returned, { anchor: msg });
      slots.forEach((s, i) => setHeld(i, false));
      phase = 'idle';
      busy = false;
      bet.disable(false);
      bet.refresh();
      $('#go').disabled = false;
      $('#go').textContent = 'DEAL';
    }

    $('#go').onclick = dealOrDraw;
    $('#hint').onclick = () => {
      if (phase !== 'hold') return;
      const s = suggestHolds(hand);
      for (let i = 0; i < 5; i++) setHeld(i, s.includes(i));
      sfx('pop');
    };
    const onKey = (e) => {
      if (e.target.matches('input')) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); dealOrDraw(); }
      if (phase === 'hold' && /^[1-5]$/.test(e.key)) { const i = +e.key - 1; setHeld(i, !held[i]); sfx('click'); }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  },
};
