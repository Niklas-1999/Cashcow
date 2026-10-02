import { sleep, fmt, fmtMult, pick } from '../util.js';
import { betControl } from '../ui.js';
import { cardEl, flip, SUITS, RANKS } from './cards.js';
import { sfx } from '../audio.js';

const EDGE = 0.97;
const rv = (r) => RANKS.indexOf(r) + 1; // A=1 … K=13
const randCard = () => ({ r: pick(RANKS), s: pick(SUITS) });

function options(v) {
  if (v === 1) return { hi: { p: 12 / 13, label: 'Higher', test: (x) => x > v }, lo: { p: 1 / 13, label: 'Same', test: (x) => x === v } };
  if (v === 13) return { hi: { p: 1 / 13, label: 'Same', test: (x) => x === v }, lo: { p: 12 / 13, label: 'Lower', test: (x) => x < v } };
  return { hi: { p: (14 - v) / 13, label: 'Higher or Same', test: (x) => x >= v }, lo: { p: v / 13, label: 'Lower or Same', test: (x) => x <= v } };
}

export default {
  rules: `<p>Guess whether the next card will be <b>higher</b> or <b>lower</b> than the current one. Aces are low, Kings are high.</p>
    <ul><li>Each correct guess multiplies your win by the odds of that guess (with a 3% edge).</li>
    <li><b>Cash out</b> after any correct guess, or <b>skip</b> a card you don't like for free.</li>
    <li>One wrong guess loses the round.</li></ul>`,

  mount(root, ctx) {
    root.innerHTML = `
    <div class="table felt purple hilo-table">
      <div class="hilo-stats"><div><b id="mult">1.00×</b><span>Multiplier</span></div><div><b id="win">0</b><span>Current win</span></div><div><b id="streak">0</b><span>Streak</span></div></div>
      <div class="hilo-main">
        <div class="hilo-card"></div>
        <div class="hilo-choice">
          <button class="btn green big" id="hi" disabled>▲ <span class="lbl">Higher</span><span class="sub"></span></button>
          <button class="btn danger big" id="lo" disabled>▼ <span class="lbl">Lower</span><span class="sub"></span></button>
          <button class="btn ghost" id="skip" disabled>Skip card ↷</button>
        </div>
      </div>
      <div class="hilo-hist"></div>
      <div class="table-msg" id="msg"></div>
    </div>
    <div class="controls panel">
      <div class="ctl-bet"></div>
      <div class="ctl-actions">
        <button class="btn primary big shine" id="start">START</button>
        <button class="btn gold big" id="cash" hidden>CASH OUT</button>
      </div>
    </div>`;
    const $ = (s) => root.querySelector(s);
    const bet = betControl('hilo', { initial: 100 });
    $('.ctl-bet').appendChild(bet.el);
    let cur = randCard(), mult = 1, active = false, busy = false, curBet = 0, streak = 0;
    $('.hilo-card').replaceChildren(cardEl(cur));
    const msg = $('#msg');

    function refresh() {
      const o = options(rv(cur.r));
      $('#hi .lbl').textContent = o.hi.label;
      $('#lo .lbl').textContent = o.lo.label;
      $('#hi .sub').textContent = `${(o.hi.p * 100).toFixed(1)}% · ${fmtMult(mult * EDGE / o.hi.p)}`;
      $('#lo .sub').textContent = `${(o.lo.p * 100).toFixed(1)}% · ${fmtMult(mult * EDGE / o.lo.p)}`;
      $('#mult').textContent = fmtMult(mult);
      $('#win').textContent = active ? fmt(curBet * mult) : '0';
      $('#streak').textContent = streak;
      ['#hi', '#lo', '#skip'].forEach((s) => ($(s).disabled = !active || busy));
      $('#cash').disabled = !active || busy || streak === 0;
      $('#cash').innerHTML = `CASH OUT <span class="sub">${active && streak ? fmt(curBet * mult) : ''}</span>`;
    }

    async function showNext(card) {
      const el = cardEl(card, true);
      const holder = $('.hilo-card');
      const old = holder.firstChild;
      if (old) { old.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(-60px) rotate(-10deg)', opacity: 0 }], { duration: 250, fill: 'forwards' }); }
      await sleep(200);
      holder.replaceChildren(el);
      sfx('card');
      await sleep(60);
      flip(el, true);
      await sleep(320);
    }
    function addHist(card, cls = '') {
      const el = cardEl(card);
      if (cls) el.style.opacity = '.5';
      $('.hilo-hist').appendChild(el);
      while ($('.hilo-hist').children.length > 14) $('.hilo-hist').firstChild.remove();
    }

    async function start() {
      if (active) return;
      const b = bet.value;
      if (!ctx.bet(b)) return;
      curBet = b; active = true; mult = 1; streak = 0; busy = true;
      msg.className = 'table-msg';
      $('.hilo-hist').innerHTML = '';
      $('#start').hidden = true; $('#cash').hidden = false; bet.disable(true);
      cur = randCard();
      await showNext(cur);
      addHist(cur);
      busy = false;
      refresh();
    }

    async function guess(which) {
      if (!active || busy) return;
      busy = true; refresh();
      const o = options(rv(cur.r))[which];
      const next = randCard();
      await showNext(next);
      addHist(next);
      cur = next;
      if (o.test(rv(next.r))) {
        mult *= EDGE / o.p;
        streak++;
        sfx('gem');
        busy = false;
        refresh();
      } else {
        sfx('lose');
        msg.className = 'table-msg show lose'; msg.innerHTML = '<span>Wrong guess!</span>';
        end(0);
      }
    }
    function end(m) {
      active = false; busy = false;
      ctx.settle(curBet, Math.floor(curBet * m), { anchor: $('.hilo-card') });
      if (m > 0) { msg.className = 'table-msg show win'; msg.innerHTML = `<span>Cashed out ${fmtMult(m)}</span>`; }
      $('#start').hidden = false; $('#cash').hidden = true; bet.disable(false); bet.refresh();
      refresh();
    }

    $('#start').onclick = start;
    $('#hi').onclick = () => guess('hi');
    $('#lo').onclick = () => guess('lo');
    $('#skip').onclick = async () => {
      if (!active || busy) return;
      busy = true; refresh();
      cur = randCard();
      await showNext(cur);
      addHist(cur, 'skip');
      busy = false; refresh();
    };
    $('#cash').onclick = () => { if (active && streak && !busy) { sfx('cashout'); end(mult); } };
    refresh();
    return () => { if (active) { if (streak) end(mult); else { active = false; ctx.settle(curBet, curBet, { quiet: true }); } } };
  },
};
