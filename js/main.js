// App bootstrap + hash router + top bar.
import { $, $$, h, bus, fmt, fmtShort } from './util.js';
import { S, xpToNext, vipTier, dailyStatus, partner } from './state.js';
import { unlockAudio, sfx, applyVolumes } from './audio.js';
import { startBackground, initParticles, countUp } from './fx.js';
import { initCompanion, react } from './companion.js';
import { initProgress, missionsReady } from './progress.js';
import { NAV_ICONS } from './icons.js';
import { toast, coins } from './ui.js';

const PAGES = {
  lobby: () => import('./pages/lobby.js'),
  game: () => import('./pages/game.js'),
  gacha: () => import('./pages/gacha.js'),
  collection: () => import('./pages/collection.js'),
  wardrobe: () => import('./pages/wardrobe.js'),
  shop: () => import('./pages/shop.js'),
  daily: () => import('./pages/daily.js'),
  achievements: () => import('./pages/achievements.js'),
  stats: () => import('./pages/stats.js'),
  settings: () => import('./pages/settings.js'),
};

const NAV = [
  ['lobby', 'Lobby'], ['gacha', 'Gacha'], ['collection', 'Collection'], ['wardrobe', 'Wardrobe'],
  ['shop', 'Shop'], ['daily', 'Daily'], ['achievements', 'Trophies'], ['stats', 'Stats'], ['settings', 'Settings'],
];

let view, cleanup = null, navToken = 0;

function buildShell() {
  const app = $('#app');
  app.innerHTML = `
  <header class="topbar">
    <button class="icon-btn nav-toggle" aria-label="Menu">${NAV_ICONS.menu}</button>
    <a class="logo" href="#/lobby" aria-label="Cashcow Waifu Casino home">
      <span class="logo-mark">♥</span>
      <span class="logo-text"><b>CASHCOW</b><small>Waifu Casino</small></span>
    </a>
    <div class="top-right">
      <a class="player-chip" href="#/stats" title="Player level">
        <span class="lvl-badge">Lv <b id="lvl">1</b></span>
        <span class="lvl-info"><span class="vip" id="vip">Bronze</span><span class="xp-bar"><span id="xp-fill"></span></span></span>
      </a>
      <div id="coin-counter" title="Your coins"><span class="coin-icon"></span><span id="coin-amt">0</span></div>
      <a class="icon-btn daily-btn" href="#/daily" title="Daily rewards">${NAV_ICONS.gift}<span class="badge" id="daily-badge"></span></a>
      <button class="icon-btn" id="sound-btn" title="Sound on/off">${NAV_ICONS.sound}</button>
    </div>
  </header>
  <nav class="sidenav">
    ${NAV.map(([id, label]) => `<a href="#/${id}" data-nav="${id}"><span class="nav-ic">${NAV_ICONS[id]}</span><span class="nav-label">${label}</span>${id === 'daily' ? '<span class="badge" id="nav-daily-badge"></span>' : ''}</a>`).join('')}
    <div class="nav-foot">Simulated currency only.<br>No real money. ♡</div>
  </nav>
  <main id="view" class="view"></main>
  <aside id="companion" class="companion"></aside>
  <nav class="bottomnav">
    ${[['lobby', 'Lobby'], ['gacha', 'Gacha'], ['collection', 'Waifus'], ['shop', 'Shop'], ['daily', 'Daily']].map(([id, label]) => `<a href="#/${id}" data-nav="${id}">${NAV_ICONS[id]}<span>${label}</span></a>`).join('')}
  </nav>`;
  view = $('#view');

  $('.nav-toggle').onclick = () => { document.body.classList.toggle('nav-open'); sfx('click'); };
  $('.sidenav').addEventListener('click', (e) => { if (e.target.closest('a')) document.body.classList.remove('nav-open'); });
  $('#sound-btn').onclick = () => {
    S.settings.sfx = !S.settings.sfx;
    if (!S.settings.sfx) S.settings.music = false;
    applyVolumes();
    updateSoundBtn();
    sfx('click');
  };
  updateSoundBtn();
  updateTop(true);
  bus.on('coins', () => updateTop());
  bus.on('xp', () => updateTop());
  bus.on('daily', updateBadges);
  bus.on('missions', updateBadges);
  bus.on('levelup', ({ level, reward }) => {
    sfx('levelup');
    toast(`<b>Level up!</b> You reached <b>Lv ${level}</b> · +${coins(reward)}`, { type: 'gold', icon: '⬆️', duration: 4000 });
    const b = $('.lvl-badge'); b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse');
  });
  updateBadges();
}

function updateSoundBtn() {
  $('#sound-btn').innerHTML = S.settings.sfx ? NAV_ICONS.sound : NAV_ICONS.mute;
}

let shownCoins = 0;
function updateTop(instant) {
  const amt = $('#coin-amt');
  if (instant) { amt.textContent = fmt(S.coins); shownCoins = S.coins; }
  else if (shownCoins !== S.coins) {
    countUp(amt, shownCoins, S.coins, 600);
    const up = S.coins > shownCoins;
    const cc = $('#coin-counter');
    cc.classList.remove('up', 'down'); void cc.offsetWidth; cc.classList.add(up ? 'up' : 'down');
    shownCoins = S.coins;
  }
  $('#lvl').textContent = S.level;
  const v = vipTier();
  $('#vip').textContent = v.name;
  $('#vip').style.color = v.color;
  $('#xp-fill').style.width = Math.min(100, (S.xp / xpToNext(S.level)) * 100) + '%';
}

export function updateBadges() {
  const n = (dailyStatus().available ? 1 : 0) + missionsReady();
  for (const id of ['#daily-badge', '#nav-daily-badge']) {
    const b = $(id);
    if (!b) continue;
    b.textContent = n || '';
    b.classList.toggle('on', n > 0);
  }
}

// ---------------- router ----------------
async function route() {
  const token = ++navToken;
  const hash = location.hash.replace(/^#\/?/, '');
  const [page = 'lobby', ...params] = hash.split('/');
  const key = PAGES[page] ? page : 'lobby';
  if (!S.partner && key !== 'intro') return showIntro();

  $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === key || (key === 'game' && a.dataset.nav === 'lobby')));
  document.body.dataset.page = key;
  view.classList.add('leaving');
  const modP = PAGES[key]();
  await new Promise((r) => setTimeout(r, 140));
  let mod;
  try { mod = await modP; } catch (e) { console.error(e); view.innerHTML = `<div class="page"><h1>Oops</h1><p>Failed to load page.</p></div>`; return; }
  if (token !== navToken) return;
  try { cleanup?.(); } catch (e) { console.error(e); }
  cleanup = null;
  view.innerHTML = '';
  view.scrollTop = 0;
  window.scrollTo(0, 0);
  try { cleanup = (await mod.mount(view, params)) || null; } catch (e) { console.error(e); view.innerHTML = `<div class="page"><h1>Oops</h1><p>${e.message}</p></div>`; }
  view.classList.remove('leaving');
  view.classList.remove('entering'); void view.offsetWidth; view.classList.add('entering');
  updateBadges();
}

async function showIntro() {
  const mod = await import('./pages/intro.js');
  document.body.dataset.page = 'intro';
  view.innerHTML = '';
  cleanup?.();
  cleanup = (await mod.mount(view, () => { location.hash = '#/lobby'; route(); })) || null;
}

// ---------------- boot ----------------
function boot() {
  buildShell();
  startBackground($('#bg'));
  initParticles($('#particles'));
  initCompanion($('#companion'));
  initProgress();
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => addEventListener(ev, unlockAudio, { once: false, passive: true }));
  addEventListener('hashchange', route);
  // subtle UI click + hover sounds
  document.addEventListener('pointerover', (e) => { if (e.target.closest?.('.game-card,.nav-label')) sfx('hover'); });
  document.addEventListener('click', (e) => { if (e.target.closest?.('.sidenav a,.bottomnav a')) sfx('tab'); });
  if (S.settings.reduceMotion) document.body.classList.add('reduce-motion');
  route().then(() => {
    const l = $('#loader');
    l.classList.add('done');
    setTimeout(() => l.remove(), 800);
    if (partner()) setTimeout(() => react('greet', { force: true }), 900);
  });
}

boot();
