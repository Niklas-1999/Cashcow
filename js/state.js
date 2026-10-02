// Persistent game state (localStorage) + core economy helpers.
import { bus, todayKey, debounce, clamp } from './util.js';
import { WAIFU_BY_ID, RARITY, affectionLevel, MAX_AFFECTION } from './waifu/data.js';

const KEY = 'cashcow-waifu-casino-v1';
export const START_COINS = 10000;

const fresh = () => ({
  v: 1,
  created: Date.now(),
  player: { name: 'Senpai' },
  coins: START_COINS,
  xp: 0,
  level: 1,
  partner: null,
  owned: {},
  outfits: [],
  accessories: [],
  gifts: {},
  gacha: { pity: 0, pityUR: 0, pulls: 0, log: [] },
  stats: { rounds: 0, wagered: 0, won: 0, biggestWin: 0, bestMult: 0, wins: 0, losses: 0, lossStreak: 0, winStreak: 0, maxWinStreak: 0, games: {}, giftsGiven: 0, pats: 0, coinsSpentShop: 0, bankrupt: 0 },
  daily: { last: null, streak: 0 },
  missions: { day: null, list: [] },
  achievements: {},
  settings: { sfx: true, music: false, volume: 0.6, musicVolume: 0.35, voice: true, reduceMotion: false, fastMode: false },
  rescue: { last: 0 },
  seenIntro: false,
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const data = JSON.parse(raw);
    return deepMerge(fresh(), data);
  } catch (e) {
    console.warn('save load failed', e);
    return fresh();
  }
}
function deepMerge(base, over) {
  for (const k in over) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) base[k] = deepMerge(base[k], over[k]);
    else base[k] = over[k];
  }
  return base;
}

export const S = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ }
}
export const saveSoon = debounce(save, 300);
window.addEventListener('beforeunload', save);

export function resetAll() {
  try { localStorage.removeItem(KEY); } catch {}
  location.hash = '';
  location.reload();
}
export function exportSave() {
  return btoa(unescape(encodeURIComponent(JSON.stringify(S))));
}
export function importSave(str) {
  const data = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
  if (!data || typeof data !== 'object' || data.v !== 1) throw new Error('Invalid save');
  localStorage.setItem(KEY, JSON.stringify(data));
  location.reload();
}

// ---------------- wallet ----------------
export const canAfford = (n) => S.coins >= n;
export function spend(n) {
  n = Math.floor(n);
  if (n < 0 || S.coins < n) return false;
  S.coins -= n;
  bus.emit('coins', { delta: -n });
  saveSoon();
  return true;
}
export function earn(n, opts = {}) {
  n = Math.floor(n);
  if (n <= 0) return;
  S.coins += n;
  bus.emit('coins', { delta: n, ...opts });
  saveSoon();
}

// ---------------- waifus ----------------
export const owns = (id) => !!S.owned[id];
export const ownedIds = () => Object.keys(S.owned);

export function addWaifu(id) {
  const def = WAIFU_BY_ID[id];
  if (!def) return null;
  if (S.owned[id]) {
    const o = S.owned[id];
    if (o.stars < 5) {
      o.stars++;
      saveSoon();
      return { isNew: false, stars: o.stars, refund: 0 };
    }
    const refund = RARITY[def.rarity].dupeRefund;
    earn(refund);
    return { isNew: false, stars: 5, refund };
  }
  S.owned[id] = { stars: 0, affection: 0, outfit: def.outfit, acc: null, got: Date.now(), pat: { day: null, n: 0 }, talked: null };
  if (!S.partner) S.partner = id;
  saveSoon();
  bus.emit('collection', id);
  return { isNew: true, stars: 0, refund: 0 };
}

export function waifu(id) {
  const def = WAIFU_BY_ID[id];
  const o = S.owned[id];
  if (!def) return null;
  return { ...def, own: o, outfit: o?.outfit || def.outfit, acc: o?.acc || null };
}
export function partner() {
  return S.partner ? waifu(S.partner) : null;
}
export function setPartner(id) {
  if (!S.owned[id]) return;
  S.partner = id;
  saveSoon();
  bus.emit('partner', id);
}

export function addAffection(id, amt) {
  const o = S.owned[id];
  if (!o) return null;
  const before = affectionLevel(o.affection);
  o.affection = clamp(Math.round(o.affection + amt), 0, MAX_AFFECTION);
  const after = affectionLevel(o.affection);
  saveSoon();
  bus.emit('affection', { id, amt, level: after, levelUp: after > before });
  return { levelUp: after > before, level: after };
}

// Perk strength scales with dupes (stars) and affection level.
export function perkValue(id) {
  const def = WAIFU_BY_ID[id];
  const o = S.owned[id];
  if (!def || !o) return 0;
  return def.perk.v * (1 + 0.15 * o.stars) * (1 + 0.08 * affectionLevel(o.affection));
}
export function activePerk() {
  const p = partner();
  if (!p) return null;
  return { ...p.perk, value: perkValue(p.id) };
}
export function perkFor(type, game) {
  const p = activePerk();
  if (!p || p.type !== type) return 0;
  if (type === 'win' && p.game !== game) return 0;
  return p.value / 100;
}

// ---------------- levels ----------------
export const xpToNext = (lvl) => Math.floor(300 * Math.pow(lvl, 1.5));
export const VIP = [
  { lvl: 1, name: 'Bronze', color: '#d58b5b' },
  { lvl: 5, name: 'Silver', color: '#c9d3e6' },
  { lvl: 10, name: 'Gold', color: '#ffcf4d' },
  { lvl: 20, name: 'Platinum', color: '#9ff3ff' },
  { lvl: 35, name: 'Diamond', color: '#8ab8ff' },
  { lvl: 50, name: 'Sakura Royalty', color: '#ff7ccf' },
];
export const vipTier = (lvl = S.level) => [...VIP].reverse().find((v) => lvl >= v.lvl);

export function addXp(n) {
  S.xp += n;
  let leveled = false;
  while (S.xp >= xpToNext(S.level)) {
    S.xp -= xpToNext(S.level);
    S.level++;
    leveled = true;
    const reward = 250 * S.level;
    earn(reward);
    bus.emit('levelup', { level: S.level, reward });
  }
  bus.emit('xp');
  saveSoon();
  return leveled;
}

// ---------------- daily ----------------
export const DAILY_REWARDS = [1000, 1500, 2000, 2500, 3000, 4000, 7500];
export function dailyStatus() {
  const today = todayKey();
  if (S.daily.last === today) return { available: false, streak: S.daily.streak };
  let streak = S.daily.streak;
  if (S.daily.last) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (S.daily.last !== todayKey(y)) streak = 0;
  }
  return { available: true, streak, day: streak % 7 };
}
export function claimDaily() {
  const st = dailyStatus();
  if (!st.available) return null;
  const base = DAILY_REWARDS[st.day];
  const bonus = Math.floor(base * perkFor('daily'));
  S.daily.last = todayKey();
  S.daily.streak = st.streak + 1;
  earn(base + bonus);
  saveSoon();
  bus.emit('daily', { base, bonus, streak: S.daily.streak });
  return { base, bonus, streak: S.daily.streak };
}
