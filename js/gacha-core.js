// Gacha logic: rates, pity, featured banners.
import { weightedPick, pick } from './util.js';
import { S, addWaifu, perkFor, saveSoon } from './state.js';
import { WAIFUS } from './waifu/data.js';

export const BASE_COST = 1000;
export const RATES = { UR: 1.5, SSR: 6, SR: 22, R: 70.5 };
export const SOFT_PITY = 50; // SSR+ guaranteed within this many pulls
export const HARD_PITY = 120; // UR guaranteed within this many pulls

const URS = WAIFUS.filter((w) => w.rarity === 'UR').map((w) => w.id);
const SSRS = WAIFUS.filter((w) => w.rarity === 'SSR').map((w) => w.id);

export function weekIndex() {
  return Math.floor(Date.now() / (7 * 86400000));
}
export function currentBanner() {
  const wk = weekIndex();
  return {
    ur: URS[wk % URS.length],
    ssr: [SSRS[(wk * 2) % SSRS.length], SSRS[(wk * 2 + 1) % SSRS.length]],
    endsAt: (wk + 1) * 7 * 86400000,
  };
}

export function pullCost(n) {
  const base = n === 10 ? BASE_COST * 9 : BASE_COST * n;
  return Math.floor(base * (1 - perkFor('gacha')));
}

function rollRarity(guaranteeSR) {
  S.gacha.pity++;
  S.gacha.pityUR++;
  let r;
  if (S.gacha.pityUR >= HARD_PITY) r = 'UR';
  else if (S.gacha.pity >= SOFT_PITY) r = Math.random() < RATES.UR / (RATES.UR + RATES.SSR) ? 'UR' : 'SSR';
  else {
    r = weightedPick(Object.keys(RATES), (k) => RATES[k]);
    if (guaranteeSR && r === 'R') r = 'SR';
  }
  if (r === 'UR') { S.gacha.pity = 0; S.gacha.pityUR = 0; }
  if (r === 'SSR') S.gacha.pity = 0;
  return r;
}

function pickWaifu(rarity, banner) {
  if (rarity === 'UR' && Math.random() < 0.5) return banner.ur;
  if (rarity === 'SSR' && Math.random() < 0.5) return pick(banner.ssr);
  return pick(WAIFUS.filter((w) => w.rarity === rarity)).id;
}

export function pull(n) {
  const banner = currentBanner();
  const out = [];
  for (let i = 0; i < n; i++) {
    const guarantee = n === 10 && i === n - 1 && !out.some((o) => o.rarity !== 'R');
    const rarity = rollRarity(guarantee);
    const id = pickWaifu(rarity, banner);
    const res = addWaifu(id);
    out.push({ id, rarity, ...res });
  }
  S.gacha.pulls += n;
  S.gacha.log.unshift(...out.map((o) => ({ id: o.id, r: o.rarity, t: Date.now() })));
  S.gacha.log.length = Math.min(S.gacha.log.length, 60);
  saveSoon();
  return out;
}
