import { h, sleep, fmt } from '../util.js';
import { betControl, toast } from '../ui.js';
import { newShoe, deal, flip, shoeEl } from './cards.js';
import { sfx } from '../audio.js';
import { S } from '../state.js';

const val = (r) => (r === 'A' ? 11 : ['J', 'Q', 'K'].includes(r) ? 10 : +r);
export function handValue(cards) {
  let t = 0, aces = 0;
  for (const c of cards) { t += val(c.r); if (c.r === 'A') aces++; }
  while (t > 21 && aces) { t -= 10; aces--; }
  return { total: t, soft: aces > 0 && t <= 21 };
}
const isBJ = (cards) => cards.length === 2 && handValue(cards).total === 21;

export default {
  rules: `<p>Get closer to <b>21</b> than the dealer without going over.</p>
    <ul><li>Number cards are worth their value, J/Q/K are 10, Aces are 1 or 11.</li>
    <li><b>Blackjack</b> (Ace + 10-value on the first two cards) pays <b>3:2</b>.</li>
    <li>Dealer peeks for blackjack and <b>stands on all 17s</b>.</li>
    <li><b>Double</b> on any first two cards (one more card, bet doubled).</li>
    <li><b>Split</b> pairs up to 4 hands. Split aces get one card each.</li>
    <li>Wins pay 1:1, pushes return your bet.</li></ul>
    <p class="muted">Keyboard: <b>H</b> hit · <b>S</b> stand · <b>D</b> double · <b>P</b> split · <b>Space</b> deal</p>`,

  mount(root, ctx) {
    root.innerHTML = `
    <div class="table felt bj-table">
      <div class="bj-top">
        <div class="bj-dealer"><div class="hand-label">Dealer <span class="hand-total" id="d-total"></span></div><div class="hand" id="d-hand"></div></div>
      </div>
      <div class="table-msg" id="msg"><span>Place your bet ♡</span></div>
      <div class="bj-hands" id="p-hands"></div>
      <div class="table-print">BLACKJACK PAYS 3 TO 2 · DEALER STANDS ON ALL 17 · INSURANCE NOT OFFERED</div>
    </div>
    <div class="controls panel">
      <div class="ctl-bet"></div>
      <div class="ctl-actions">
        <button class="btn primary big shine" id="deal">DEAL</button>
        <div class="bj-acts" hidden>
          <button class="btn green" id="hit">Hit <kbd>H</kbd></button>
          <button class="btn danger" id="stand">Stand <kbd>S</kbd></button>
          <button class="btn gold" id="double">Double <kbd>D</kbd></button>
          <button class="btn" id="split">Split <kbd>P</kbd></button>
        </div>
      </div>
    </div>`;
    const shoe = shoeEl();
    root.querySelector('.bj-top').appendChild(shoe);
    const bet = betControl('blackjack', { initial: 100 });
    root.querySelector('.ctl-bet').appendChild(bet.el);
    const $ = (s) => root.querySelector(s);
    const dHand = $('#d-hand'), pHands = $('#p-hands'), msg = $('#msg');
    const dealBtn = $('#deal'), acts = $('.bj-acts');

    let deck = newShoe(6), dealer = [], hands = [], active = 0, busy = false, phase = 'bet', holeEl = null;
    const draw = () => {
      if (deck.length < 60) { deck = newShoe(6); toast('The dealer reshuffles the shoe.', { icon: '🔀' }); }
      return deck.pop();
    };
    const setMsg = (t, cls = '') => { msg.className = 'table-msg show ' + cls; msg.innerHTML = `<span>${t}</span>`; };

    function handHtml(hd, i) {
      return `<div class="hand-wrap" data-i="${i}"><div class="hand"></div><div class="hand-label"><span class="hand-total"></span><span class="hand-bet"></span></div></div>`;
    }
    function updateLabels() {
      hands.forEach((hd, i) => {
        const w = pHands.children[i];
        if (!w) return;
        const v = handValue(hd.cards);
        w.classList.toggle('active', phase === 'play' && i === active && hands.length > 1);
        w.querySelector('.hand-total').textContent = hd.cards.length ? (isBJ(hd.cards) && hands.length === 1 ? 'BLACKJACK' : (v.soft && v.total < 21 ? `${v.total - 10}/${v.total}` : v.total)) : '';
        w.querySelector('.hand-total').className = 'hand-total' + (v.total > 21 ? ' bust' : v.total === 21 ? ' good' : '');
        w.querySelector('.hand-bet').innerHTML = `<i class="coin-i"></i>${fmt(hd.bet)}${hd.result ? ` · <b class="res-${hd.result}">${hd.result.toUpperCase()}</b>` : ''}`;
      });
      const shown = phase === 'dealer' || phase === 'done' ? dealer : dealer.slice(0, 1);
      const dv = handValue(shown);
      $('#d-total').textContent = dealer.length ? dv.total : '';
      $('#d-total').className = 'hand-total' + (dv.total > 21 ? ' bust' : '');
    }
    function updateButtons() {
      const playing = phase === 'play' && !busy;
      dealBtn.hidden = phase === 'play' || phase === 'dealer';
      acts.hidden = !(phase === 'play');
      dealBtn.disabled = busy;
      bet.disable(phase === 'play' || phase === 'dealer' || busy);
      const hd = hands[active];
      $('#hit').disabled = !playing;
      $('#stand').disabled = !playing;
      $('#double').disabled = !playing || !hd || hd.cards.length !== 2 || S.coins < hd.bet;
      $('#split').disabled = !playing || !hd || hd.cards.length !== 2 || val(hd.cards[0].r) !== val(hd.cards[1].r) || hands.length >= 4 || S.coins < hd.bet;
    }

    async function start() {
      if (busy || phase === 'play') return;
      const b = bet.value;
      if (!ctx.bet(b)) return;
      busy = true; phase = 'deal';
      updateButtons();
      dHand.innerHTML = ''; pHands.innerHTML = ''; msg.className = 'table-msg';
      dealer = []; hands = [{ cards: [], bet: b, done: false }]; active = 0;
      pHands.innerHTML = handHtml(hands[0], 0);
      const ph = () => pHands.children[0].querySelector('.hand');
      hands[0].cards.push(draw()); await deal(ph(), hands[0].cards[0], { from: shoe }); updateLabels();
      dealer.push(draw()); await deal(dHand, dealer[0], { from: shoe }); updateLabels();
      hands[0].cards.push(draw()); await deal(ph(), hands[0].cards[1], { from: shoe }); updateLabels();
      dealer.push(draw()); holeEl = await deal(dHand, dealer[1], { from: shoe, faceDown: true });
      updateLabels();
      const up = val(dealer[0].r);
      const dealerBJ = isBJ(dealer), playerBJ = isBJ(hands[0].cards);
      if (up >= 10 || dealerBJ || playerBJ) {
        if (up >= 10 && !playerBJ) { setMsg('Dealer peeks…'); await sleep(700); }
        if (dealerBJ || playerBJ) {
          phase = 'dealer';
          flip(holeEl, true); updateLabels();
          await sleep(400);
          return finish();
        }
        msg.className = 'table-msg';
      }
      phase = 'play'; busy = false;
      updateLabels(); updateButtons();
    }

    async function nextHand() {
      while (active < hands.length && hands[active].done) active++;
      if (active < hands.length) {
        const hd = hands[active];
        if (hd.cards.length === 1) {
          hd.cards.push(draw());
          await deal(pHands.children[active].querySelector('.hand'), hd.cards[1], { from: shoe });
          if (hd.splitAces || handValue(hd.cards).total === 21) { hd.done = true; updateLabels(); return nextHand(); }
        }
        busy = false; updateLabels(); updateButtons();
        return;
      }
      phase = 'dealer';
      updateButtons();
      await dealerPlay();
    }

    async function hit() {
      if (phase !== 'play' || busy) return;
      busy = true; updateButtons();
      const hd = hands[active];
      hd.cards.push(draw());
      await deal(pHands.children[active].querySelector('.hand'), hd.cards[hd.cards.length - 1], { from: shoe });
      const v = handValue(hd.cards).total;
      updateLabels();
      if (v > 21) { hd.done = true; hd.result = 'bust'; sfx('lose'); pHands.children[active].classList.add('busted'); await sleep(300); }
      else if (v === 21) hd.done = true;
      if (hd.done) { active++; return nextHand(); }
      busy = false; updateButtons();
    }
    async function stand() {
      if (phase !== 'play' || busy) return;
      busy = true;
      hands[active].done = true; active++;
      await nextHand();
    }
    async function double() {
      const hd = hands[active];
      if (phase !== 'play' || busy || hd.cards.length !== 2) return;
      if (!ctx.bet(hd.bet)) return;
      hd.bet *= 2; hd.doubled = true;
      updateLabels();
      busy = true; updateButtons();
      hd.cards.push(draw());
      const el = await deal(pHands.children[active].querySelector('.hand'), hd.cards[2], { from: shoe });
      el.classList.add('sideways');
      const v = handValue(hd.cards).total;
      if (v > 21) { hd.result = 'bust'; sfx('lose'); pHands.children[active].classList.add('busted'); }
      hd.done = true; active++;
      updateLabels();
      await sleep(300);
      await nextHand();
    }
    async function split() {
      const hd = hands[active];
      if (phase !== 'play' || busy || hd.cards.length !== 2 || val(hd.cards[0].r) !== val(hd.cards[1].r) || hands.length >= 4) return;
      if (!ctx.bet(hd.bet)) return;
      busy = true; updateButtons();
      const c2 = hd.cards.pop();
      const nh = { cards: [c2], bet: hd.bet, done: false };
      if (hd.cards[0].r === 'A') { hd.splitAces = true; nh.splitAces = true; }
      hands.splice(active + 1, 0, nh);
      // rebuild hands DOM
      pHands.innerHTML = hands.map(handHtml).join('');
      const { cardEl } = await import('./cards.js');
      hands.forEach((x, i) => x.cards.forEach((c) => pHands.children[i].querySelector('.hand').appendChild(cardEl(c))));
      sfx('chip');
      updateLabels();
      hd.cards.push(draw());
      await deal(pHands.children[active].querySelector('.hand'), hd.cards[1], { from: shoe });
      updateLabels();
      if (hd.splitAces || handValue(hd.cards).total === 21) { hd.done = true; active++; return nextHand(); }
      busy = false; updateButtons();
    }

    async function dealerPlay() {
      busy = true;
      flip(holeEl, true);
      updateLabels();
      await sleep(500);
      const anyLive = hands.some((x) => handValue(x.cards).total <= 21);
      if (anyLive) {
        while (handValue(dealer).total < 17) {
          dealer.push(draw());
          await deal(dHand, dealer[dealer.length - 1], { from: shoe });
          updateLabels();
          await sleep(250);
        }
      }
      await finish();
    }

    async function finish() {
      phase = 'done';
      const dv = handValue(dealer).total, dBJ = isBJ(dealer);
      let wagered = 0, returned = 0;
      for (const hd of hands) {
        wagered += hd.bet;
        const pv = handValue(hd.cards).total;
        const pBJ = isBJ(hd.cards) && hands.length === 1;
        let r;
        if (pv > 21) r = 'bust';
        else if (pBJ && !dBJ) { r = 'blackjack'; returned += hd.bet * 2.5; }
        else if (dBJ && !pBJ) r = 'lose';
        else if (pBJ && dBJ) { r = 'push'; returned += hd.bet; }
        else if (dv > 21 || pv > dv) { r = 'win'; returned += hd.bet * 2; }
        else if (pv === dv) { r = 'push'; returned += hd.bet; }
        else r = 'lose';
        hd.result = r;
      }
      updateLabels();
      const net = returned - wagered;
      if (hands.some((x) => x.result === 'blackjack')) { setMsg('BLACKJACK! ♡', 'win'); ctx.special('blackjack'); }
      else if (net > 0) setMsg(dv > 21 ? 'Dealer busts — you win!' : 'You win!', 'win');
      else if (net === 0) setMsg('Push', 'push');
      else setMsg(dBJ ? 'Dealer has Blackjack' : hands.every((x) => x.result === 'bust') ? 'Bust!' : 'Dealer wins', 'lose');
      ctx.settle(wagered, returned, { anchor: msg });
      busy = false;
      updateButtons();
      bet.refresh();
    }

    dealBtn.onclick = start;
    $('#hit').onclick = hit;
    $('#stand').onclick = stand;
    $('#double').onclick = double;
    $('#split').onclick = split;
    const onKey = (e) => {
      if (e.target.matches('input')) return;
      const k = e.key.toLowerCase();
      if (k === 'h') hit(); else if (k === 's') stand(); else if (k === 'd') double(); else if (k === 'p') split();
      else if ((k === ' ' || k === 'enter') && phase !== 'play') { e.preventDefault(); start(); }
    };
    addEventListener('keydown', onKey);
    updateButtons();
    return () => removeEventListener('keydown', onKey);
  },
};
