// The partner waifu panel: portrait, reactions, speech bubble, pats, gifts, affection.
import { $, h, bus, fmt, todayKey, escapeHtml } from './util.js';
import { S, partner, addAffection, earn, perkFor, perkValue, saveSoon } from './state.js';
import { renderWaifu } from './waifu/render.js';
import { line, exprFor } from './waifu/dialogue.js';
import { AFFECTION_LEVELS, affectionLevel, MAX_AFFECTION, GIFTS, GIFT_BY_ID, RARITY, PERSONALITIES, perkText } from './waifu/data.js';
import { sfx, voiceBlip } from './audio.js';
import { hearts, burstAt, floatAt } from './fx.js';
import { toast, modal, stars, coins } from './ui.js';

let root, svgWrap, bubble, bubbleText, revertTimer, typeTimer, idleTimer;
let currentExpr = 'neutral';
const firstName = (w) => w.name.split(/[ "]/)[0];

export function initCompanion(el) {
  root = el;
  render();
  bus.on('partner', () => { render(); say('partner'); });
  bus.on('affection', ({ id }) => { if (id === S.partner) updateInfo(); });
  bus.on('wardrobe', () => drawPortrait(currentExpr));
  bus.on('coins', () => checkBroke());
  ['pointerdown', 'keydown'].forEach((ev) => addEventListener(ev, resetIdle, { passive: true }));
  resetIdle();
}

function resetIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { if (partner()) say('idle'); resetIdle(); }, 60000);
}

export function render() {
  const w = partner();
  if (!root) return;
  if (!w) { root.innerHTML = ''; return; }
  root.innerHTML = `
  <div class="comp-card r-${w.rarity}" style="--wc:${w.palette.accent};--wh:${w.hair.color}">
    <button class="comp-collapse" title="Hide / show partner" aria-label="Toggle partner panel">◀</button>
    <div class="comp-bubble"><div class="comp-text"></div><div class="comp-bubble-actions"></div></div>
    <div class="comp-portrait" title="Head pat!">
      <div class="comp-bg"></div>
      <div class="comp-svg"></div>
      <div class="pat-hand">🖐️</div>
    </div>
    <div class="comp-info">
      <div class="comp-name">${escapeHtml(w.name)} ${stars(w.rarity)}</div>
      <div class="comp-title">${escapeHtml(w.title)} · ${PERSONALITIES[w.personality]}</div>
      <div class="aff-wrap">
        <div class="aff-bar"><div class="aff-fill"></div></div>
        <div class="aff-label"></div>
      </div>
      <div class="comp-perk"></div>
    </div>
    <div class="comp-actions">
      <button class="btn small" data-a="pat">🖐️ Pat</button>
      <button class="btn small" data-a="gift">🎁 Gift</button>
      <a class="btn small" href="#/wardrobe">👗 Dress</a>
    </div>
  </div>`;
  svgWrap = root.querySelector('.comp-svg');
  bubble = root.querySelector('.comp-bubble');
  bubbleText = root.querySelector('.comp-text');
  drawPortrait('neutral');
  updateInfo();
  root.querySelector('.comp-portrait').addEventListener('click', pat);
  root.querySelector('[data-a=pat]').addEventListener('click', pat);
  root.querySelector('[data-a=gift]').addEventListener('click', () => openGiftModal());
  root.querySelector('.comp-collapse').addEventListener('click', () => {
    document.body.classList.toggle('comp-hidden');
    sfx('click');
  });
}

function drawPortrait(expr) {
  const w = partner();
  if (!w || !svgWrap) return;
  currentExpr = expr;
  svgWrap.innerHTML = renderWaifu(w, { expr, outfit: w.outfit, acc: w.acc });
}

function updateInfo() {
  const w = partner();
  if (!w || !root) return;
  const aff = w.own.affection;
  const lvl = affectionLevel(aff);
  const cur = AFFECTION_LEVELS[lvl];
  const next = AFFECTION_LEVELS[lvl + 1];
  const pct = next ? ((aff - cur.min) / (next.min - cur.min)) * 100 : 100;
  root.querySelector('.aff-fill').style.width = pct + '%';
  root.querySelector('.aff-label').innerHTML = `<span>${cur.icon} ${cur.name}</span><span>${next ? `${aff}/${next.min}` : 'MAX ♡'}</span>`;
  root.querySelector('.comp-perk').innerHTML = `✦ ${perkText(w.perk, perkValue(w.id))}`;
}

// --------------------------------------------------------------------------
// reactions
export function react(event, { force = false, chance = 1, hold = 3800, vars = {} } = {}) {
  const w = partner();
  if (!w || !root) return;
  const expr = exprFor(w.personality, event);
  drawPortrait(expr);
  const card = root.querySelector('.comp-card');
  const anim = { win: 'hop', bigwin: 'jump', lose: 'droop', streak: 'droop', pat: 'wiggle', giftLove: 'jump', gift: 'hop', levelup: 'jump', greet: 'hop', partner: 'hop' }[event];
  if (anim && !S.settings.reduceMotion) {
    card.classList.remove('hop', 'jump', 'droop', 'wiggle');
    void card.offsetWidth;
    card.classList.add(anim);
  }
  if (force || Math.random() < chance) say(event, vars, false);
  clearTimeout(revertTimer);
  revertTimer = setTimeout(() => drawPortrait('neutral'), hold);
}

export function say(event, vars = {}, setExpr = true) {
  const w = partner();
  if (!w || !bubble) return;
  if (setExpr) {
    drawPortrait(exprFor(w.personality, event));
    clearTimeout(revertTimer);
    revertTimer = setTimeout(() => drawPortrait('neutral'), 4000);
  }
  const text = line(w.personality, event, { name: escapeHtml(S.player.name), w: firstName(w), ...vars });
  showBubble(text);
}

export function showBubble(text, actionsHtml = '') {
  const w = partner();
  if (!bubble) return;
  clearInterval(typeTimer);
  bubble.classList.add('show');
  bubbleText.textContent = '';
  bubble.querySelector('.comp-bubble-actions').innerHTML = actionsHtml;
  let i = 0;
  const pitch = { genki: 1.25, dandere: 1.1, kuudere: 0.85, tsundere: 1.15, gyaru: 1.2, sleepy: 0.8, oneesan: 0.9, chuuni: 1.05, deredere: 1.3, ojou: 1.0, yandere: 1.12, gambler: 0.78 }[w?.personality] || 1;
  typeTimer = setInterval(() => {
    bubbleText.textContent = text.slice(0, ++i);
    if (text[i - 1] && /\w/.test(text[i - 1])) voiceBlip(pitch);
    if (i >= text.length) clearInterval(typeTimer);
  }, 24);
  clearTimeout(bubble._hide);
  bubble._hide = setTimeout(() => bubble.classList.remove('show'), Math.max(4200, text.length * 70) + (actionsHtml ? 6000 : 0));
}

// --------------------------------------------------------------------------
// head pats
let lastPat = 0;
function pat() {
  const w = partner();
  if (!w) return;
  const t = performance.now();
  if (t - lastPat < 900) return;
  lastPat = t;
  const hand = root.querySelector('.pat-hand');
  hand.classList.remove('go'); void hand.offsetWidth; hand.classList.add('go');
  sfx('heart');
  hearts(root.querySelector('.comp-portrait'), 8);
  const o = w.own;
  const today = todayKey();
  if (o.pat.day !== today) { o.pat.day = today; o.pat.n = 0; }
  S.stats.pats++;
  bus.emit('pat');
  if (o.pat.n < 10) {
    o.pat.n++;
    gainAffection(w, 2);
  } else if (o.pat.n === 10) {
    o.pat.n++;
    toast(`${escapeHtml(firstName(w))} loves the pats, but affection from pats is capped for today.`, { icon: '🖐️' });
  }
  saveSoon();
  react('pat', { force: true, hold: 2600 });
}

function gainAffection(w, amt) {
  const r = addAffection(w.id, amt);
  floatAt(root.querySelector('.comp-portrait'), `+${amt} ♡`, 'aff');
  if (r?.levelUp) {
    const L = AFFECTION_LEVELS[r.level];
    setTimeout(() => {
      react('levelup', { force: true, hold: 5000 });
      burstAt(root.querySelector('.comp-portrait'), { type: 'heart', n: 30, colors: ['#ff5c93', '#ff8ab5', '#fff'], speed: 10 });
      sfx('levelup');
      toast(`<b>${escapeHtml(firstName(w))}</b> is now your <b>${L.icon} ${L.name}</b>!${r.level === 6 ? '<br>The <b>Soulmate Gown</b> is now unlocked for her!' : r.level >= 2 ? '<br>A new memory was unlocked in her profile.' : ''}`, { type: 'gold', icon: '💗', duration: 5000 });
    }, 600);
  }
  return r;
}

// Affection from playing (called by casino after each round)
let roundCounter = 0;
export function playAffection(bigWin) {
  const w = partner();
  if (!w) return;
  roundCounter++;
  if (bigWin) gainAffection(w, 3);
  else if (roundCounter % 15 === 0) gainAffection(w, 1);
}

// --------------------------------------------------------------------------
// gifts
export function giftMultiplier(w, g) {
  if (g.tag === 'special') return 2.5;
  if (w.likes.includes(g.tag)) return 2.5;
  if (w.dislikes.includes(g.tag)) return 0.4;
  return 1;
}

export function giveGift(giftId) {
  const w = partner();
  const g = GIFT_BY_ID[giftId];
  if (!w || !g || !(S.gifts[giftId] > 0)) return;
  S.gifts[giftId]--;
  S.stats.giftsGiven++;
  const mult = giftMultiplier(w, g);
  const amt = Math.max(1, Math.round(g.aff * mult * (1 + perkFor('affection'))));
  const ev = mult > 1 ? 'giftLove' : mult < 1 ? 'giftMeh' : 'gift';
  gainAffection(w, amt);
  react(ev, { force: true, hold: 4500 });
  if (mult > 1) hearts(root.querySelector('.comp-portrait'), 24);
  sfx(mult > 1 ? 'heart' : 'pop');
  bus.emit('gift', { id: giftId, love: mult > 1 });
  saveSoon();
}

export function openGiftModal() {
  const w = partner();
  if (!w) return;
  const render = () => {
    const inv = GIFTS.filter((g) => S.gifts[g.id] > 0);
    return `<p class="muted">Give a present to <b>${escapeHtml(w.name)}</b>. She loves <b>${w.likes.join(' & ')}</b> and isn't a fan of <b>${w.dislikes.join(', ')}</b>.</p>
      ${inv.length ? `<div class="gift-grid">${inv.map((g) => {
        const m = giftMultiplier(w, g);
        return `<button class="gift-item ${m > 1 ? 'loved' : m < 1 ? 'meh' : ''}" data-g="${g.id}">
          <span class="gi-icon">${g.icon}</span><span class="gi-name">${g.name}</span>
          <span class="gi-count">×${S.gifts[g.id]}</span>
          <span class="gi-aff">+${Math.round(g.aff * m * (1 + perkFor('affection')))} ♡</span>
          ${m > 1 ? '<span class="gi-tag">Loves!</span>' : ''}</button>`;
      }).join('')}</div>` : `<div class="empty">Your gift bag is empty.<br><a class="btn primary" href="#/shop/gifts">Visit the Gift Shop</a></div>`}`;
  };
  const m = modal({ title: '🎁 Give a Gift', html: render(), cls: 'gift-modal' });
  m.body.addEventListener('click', (e) => {
    const b = e.target.closest('[data-g]');
    if (!b) return;
    giveGift(b.dataset.g);
    m.body.innerHTML = render();
  });
  m.body.addEventListener('click', (e) => { if (e.target.closest('a')) m.close(); });
}

// --------------------------------------------------------------------------
// bankruptcy rescue
const RESCUE_CD = 3 * 60 * 1000;
function checkBroke() {
  const w = partner();
  if (!w || S.coins >= 10) return;
  const ready = Date.now() - S.rescue.last > RESCUE_CD;
  if (!ready) return;
  setTimeout(() => {
    if (S.coins >= 10) return;
    say('broke');
    showBubble(line(w.personality, 'broke', { name: S.player.name, w: firstName(w) }), `<button class="btn small gold" data-rescue>Accept ${coins(1000)}</button>`);
    bubble.querySelector('[data-rescue]').onclick = () => {
      if (Date.now() - S.rescue.last < RESCUE_CD) return;
      S.rescue.last = Date.now();
      S.stats.bankrupt++;
      earn(1000);
      bus.emit('rescue');
      sfx('cashout');
      bubble.classList.remove('show');
      react('pat', { force: false });
    };
  }, 1200);
}
