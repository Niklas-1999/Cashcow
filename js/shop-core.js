// Purchasing logic shared by the shop + wardrobe pages.
import { bus } from './util.js';
import { S, spend, perkFor, saveSoon } from './state.js';
import { OUTFIT_BY_ID, ACCESSORY_BY_ID, GIFT_BY_ID, affectionLevel } from './waifu/data.js';
import { sfx } from './audio.js';
import { toast, coins } from './ui.js';

export const price = (base) => Math.floor(base * (1 - perkFor('shop')));

function pay(amount) {
  if (!spend(amount)) {
    sfx('error');
    toast(`Not enough coins — you need ${coins(amount)}.`, { type: 'warn', icon: '💸' });
    return false;
  }
  S.stats.coinsSpentShop += amount;
  sfx('buy');
  return true;
}

export function ownsOutfit(id, wid) {
  const o = OUTFIT_BY_ID[id];
  if (!o) return false;
  if (o.affection) return !!S.owned[wid] && affectionLevel(S.owned[wid].affection) >= o.affection;
  return S.outfits.includes(id);
}
export const isSignature = (id, w) => w.outfit === id || w.outfit_default === id;

export function buyOutfit(id) {
  const o = OUTFIT_BY_ID[id];
  if (!o || o.affection || S.outfits.includes(id)) return false;
  if (!pay(price(o.price))) return false;
  S.outfits.push(id);
  saveSoon();
  bus.emit('buy', { type: 'outfit', id });
  toast(`<b>${o.name}</b> added to your wardrobe!`, { type: 'success', icon: '👗' });
  return true;
}
export function buyAccessory(id) {
  const a = ACCESSORY_BY_ID[id];
  if (!a || S.accessories.includes(id)) return false;
  if (!pay(price(a.price))) return false;
  S.accessories.push(id);
  saveSoon();
  bus.emit('buy', { type: 'accessory', id });
  toast(`<b>${a.name}</b> added to your accessories!`, { type: 'success', icon: '🎀' });
  return true;
}
export function buyGift(id, qty = 1) {
  const g = GIFT_BY_ID[id];
  if (!g) return false;
  if (!pay(price(g.price) * qty)) return false;
  S.gifts[id] = (S.gifts[id] || 0) + qty;
  saveSoon();
  bus.emit('buy', { type: 'gift', id, qty });
  return true;
}

export function equip(wid, { outfit, acc } = {}) {
  const o = S.owned[wid];
  if (!o) return;
  if (outfit !== undefined) o.outfit = outfit;
  if (acc !== undefined) o.acc = acc;
  saveSoon();
  bus.emit('wardrobe', wid);
}
