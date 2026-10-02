// Shared playing-card helpers: decks, card elements, deal / flip animations.
import { h, shuffle, sleep } from '../util.js';
import { sfx } from '../audio.js';
import { S } from '../state.js';

export const SUITS = ['♠', '♥', '♦', '♣'];
export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
export const isRed = (s) => s === '♥' || s === '♦';
export const rankValue = (r) => (r === 'A' ? 14 : r === 'K' ? 13 : r === 'Q' ? 12 : r === 'J' ? 11 : +r);

export function newDeck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) d.push({ r, s });
  return d;
}
export function newShoe(decks = 6) {
  let d = [];
  for (let i = 0; i < decks; i++) d = d.concat(newDeck());
  return shuffle(d);
}

const FACE = {
  K: (c) => `<svg viewBox="0 0 60 60"><path d="M10 44 L8 18 L20 30 L30 12 L40 30 L52 18 L50 44 Z" fill="url(#pcg)" stroke="#8a6410" stroke-width="2" stroke-linejoin="round"/><rect x="10" y="44" width="40" height="7" rx="2" fill="url(#pcg)" stroke="#8a6410" stroke-width="2"/><circle cx="30" cy="34" r="4" fill="${c}"/><circle cx="8" cy="18" r="3" fill="${c}"/><circle cx="30" cy="12" r="3" fill="${c}"/><circle cx="52" cy="18" r="3" fill="${c}"/></svg>`,
  Q: (c) => `<svg viewBox="0 0 60 60"><path d="M30 50 C 18 42, 8 34, 8 24 C 8 16, 14 11, 20 11 C 25 11, 28 14, 30 18 C 32 14, 35 11, 40 11 C 46 11, 52 16, 52 24 C 52 34, 42 42, 30 50 Z" fill="${c}" stroke="#fff" stroke-width="2.5"/><path d="M18 8 L22 2 L26 7 L30 0 L34 7 L38 2 L42 8 Z" fill="url(#pcg)" stroke="#8a6410" stroke-width="1.5"/><path d="M20 20 Q 22 16 26 16" stroke="#fff" stroke-width="2.5" fill="none" opacity=".7"/></svg>`,
  J: (c) => `<svg viewBox="0 0 60 60"><path d="M30 4 L35 22 L54 22 L39 33 L45 52 L30 41 L15 52 L21 33 L6 22 L25 22 Z" fill="${c}" stroke="url(#pcg)" stroke-width="3" stroke-linejoin="round"/><circle cx="30" cy="28" r="5" fill="url(#pcg)"/></svg>`,
};

let defsAdded = false;
function ensureDefs() {
  if (defsAdded) return;
  defsAdded = true;
  document.body.appendChild(h(`<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="pcg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#f2c14e"/><stop offset="1" stop-color="#b8861f"/></linearGradient></defs></svg>`));
}

const PIPS = {
  2: [[50, 18], [50, 82]], 3: [[50, 18], [50, 50], [50, 82]], 4: [[30, 20], [70, 20], [30, 80], [70, 80]],
  5: [[30, 20], [70, 20], [50, 50], [30, 80], [70, 80]], 6: [[30, 20], [70, 20], [30, 50], [70, 50], [30, 80], [70, 80]],
  7: [[30, 20], [70, 20], [50, 35], [30, 50], [70, 50], [30, 80], [70, 80]], 8: [[30, 20], [70, 20], [50, 35], [30, 50], [70, 50], [50, 65], [30, 80], [70, 80]],
  9: [[30, 18], [70, 18], [30, 39], [70, 39], [50, 50], [30, 61], [70, 61], [30, 82], [70, 82]],
  10: [[30, 18], [70, 18], [50, 29], [30, 40], [70, 40], [30, 60], [70, 60], [50, 71], [30, 82], [70, 82]],
};

export function cardEl(card, faceDown = false) {
  ensureDefs();
  const red = isRed(card.s);
  const col = red ? '#e2264d' : '#1d1830';
  let center;
  if (FACE[card.r]) center = `<div class="pc-face">${FACE[card.r](col)}</div>`;
  else if (card.r === 'A') center = `<div class="pc-ace">${card.s}</div>`;
  else center = `<div class="pc-pips">${PIPS[card.r].map(([x, y]) => `<span style="left:${x}%;top:${y}%" class="${y > 55 ? 'flipped' : ''}">${card.s}</span>`).join('')}</div>`;
  return h(`<div class="pcard ${red ? 'red' : ''} ${faceDown ? 'down' : ''}" data-r="${card.r}" data-s="${card.s}">
    <div class="pc-inner">
      <div class="pc-front">
        <div class="pc-corner tl"><b>${card.r}</b><i>${card.s}</i></div>
        ${center}
        <div class="pc-corner br"><b>${card.r}</b><i>${card.s}</i></div>
      </div>
      <div class="pc-back"><div class="pc-back-art"><span>♥</span></div></div>
    </div>
  </div>`);
}

export function flip(el, up = true) {
  el.classList.toggle('down', !up);
  sfx('flip');
}

// Animate a card from `fromEl` (shoe) into `container`.
export async function deal(container, card, { from, faceDown = false, flipDelay = 0 } = {}) {
  const el = cardEl(card, true);
  container.appendChild(el);
  sfx('card');
  const fast = S.settings.fastMode;
  if (from && !S.settings.reduceMotion) {
    const a = from.getBoundingClientRect(), b = el.getBoundingClientRect();
    const dx = a.left + a.width / 2 - (b.left + b.width / 2), dy = a.top + a.height / 2 - (b.top + b.height / 2);
    el.animate([
      { transform: `translate(${dx}px, ${dy}px) rotate(-30deg) scale(.7)`, opacity: 0.4 },
      { transform: 'none', opacity: 1 },
    ], { duration: fast ? 220 : 380, easing: 'cubic-bezier(.2,.8,.25,1)' });
  }
  await sleep(fast ? 160 : 300);
  if (!faceDown) {
    if (flipDelay) await sleep(flipDelay);
    flip(el, true);
    await sleep(fast ? 120 : 220);
  }
  return el;
}

export function shoeEl() {
  return h(`<div class="shoe"><div class="shoe-cards"></div><span>SHOE</span></div>`);
}
