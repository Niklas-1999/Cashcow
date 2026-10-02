import { escapeHtml, fmt } from '../util.js';
import { S, partner, perkFor } from '../state.js';
import { GIFTS, OUTFIT_LIST, ACCESSORY_LIST } from '../waifu/data.js';
import { renderWaifu } from '../waifu/render.js';
import { buyOutfit, buyAccessory, buyGift, equip, price, ownsOutfit } from '../shop-core.js';
import { coins, toast } from '../ui.js';
import { giftMultiplier, openGiftModal } from '../companion.js';
import { sfx } from '../audio.js';
import { floatAt } from '../fx.js';

export function mount(view, [tabParam]) {
  let tab = ['gifts', 'outfits', 'accessories'].includes(tabParam) ? tabParam : 'gifts';
  const p = partner();
  view.innerHTML = `
  <div class="page">
    <div class="page-head">
      <h1>Boutique</h1><p class="sub">Spoil your partner with gifts, outfits and accessories.</p>
      <div class="spacer"></div>
      ${perkFor('shop') ? `<span class="discount-pill">✦ Partner discount −${(perkFor('shop') * 100).toFixed(1).replace('.0', '')}%</span>` : ''}
    </div>
    <div class="tabs"><a href="#/shop/gifts" data-t="gifts">🎁 Gifts</a><a href="#/shop/outfits" data-t="outfits">👗 Outfits</a><a href="#/shop/accessories" data-t="accessories">🎀 Accessories</a>
      <button class="btn small ghost" id="give" style="margin-left:auto">💝 Give a gift to ${escapeHtml(p.name.split(' ')[0])}</button></div>
    <div class="item-grid"></div>
  </div>`;
  const grid = view.querySelector('.item-grid');
  view.querySelectorAll('.tabs [data-t]').forEach((a) => a.classList.toggle('on', a.dataset.t === tab));
  view.querySelector('#give').onclick = () => openGiftModal();

  function draw() {
    if (tab === 'gifts') {
      grid.innerHTML = GIFTS.map((g) => {
        const m = giftMultiplier(p, g);
        return `<div class="item" data-g="${g.id}" style="cursor:default">
          ${S.gifts[g.id] ? `<span class="count-tag">×${S.gifts[g.id]}</span>` : ''}
          ${m > 1 ? `<span class="owned-tag" style="background:var(--pink);color:#fff">${escapeHtml(p.name.split(' ')[0])} loves!</span>` : ''}
          <div class="item-art gift">${g.icon}</div>
          <div class="item-name">${g.name}</div>
          <div class="item-sub">+${Math.round(g.aff * m * (1 + perkFor('affection')))} ♡ · <span class="price">${coins(price(g.price))}</span></div>
          <div style="display:flex;gap:6px;padding:0 10px 12px;justify-content:center">
            <button class="btn small primary" data-buy="1">Buy</button>
            <button class="btn small" data-buy="5">×5</button>
          </div></div>`;
      }).join('');
    } else if (tab === 'outfits') {
      grid.innerHTML = OUTFIT_LIST.filter((o) => !o.affection).map((o) => {
        const owned = S.outfits.includes(o.id);
        const sig = p.outfit === o.id && !owned && o.id === p.outfit;
        return `<div class="item ${owned ? '' : 'locked'}" data-o="${o.id}">
          ${owned ? '<span class="owned-tag">Owned</span>' : ''}
          <div class="item-art">${renderWaifu(p, { anim: false, outfit: o.id, acc: p.acc })}</div>
          <div class="item-name">${o.name}</div><div class="item-sub">${o.desc}</div>
          <div style="padding:0 10px 12px">${owned ? `<button class="btn small" data-wear>Wear</button>` : `<button class="btn small primary" data-buyo>${coins(price(o.price))}</button>`}</div></div>`;
      }).join('') + `<div class="item locked" style="cursor:default"><span class="lock-tag">💍</span><div class="item-art">${renderWaifu(p, { anim: false, outfit: 'bride', acc: p.acc })}</div><div class="item-name">Soulmate Gown</div><div class="item-sub">Not for sale — earned by reaching Soulmate affection.</div></div>`;
    } else {
      grid.innerHTML = ACCESSORY_LIST.map((a) => {
        const owned = S.accessories.includes(a.id);
        return `<div class="item ${owned ? '' : 'locked'}" data-a="${a.id}">
          ${owned ? '<span class="owned-tag">Owned</span>' : ''}
          <div class="item-art acc">${renderWaifu(p, { anim: false, outfit: p.outfit, acc: a.id })}</div>
          <div class="item-name">${a.name}</div>
          <div style="padding:6px 10px 12px">${owned ? `<button class="btn small" data-weara>Wear</button>` : `<button class="btn small primary" data-buya>${coins(price(a.price))}</button>`}</div></div>`;
      }).join('');
    }
  }

  grid.addEventListener('click', (e) => {
    const item = e.target.closest('.item');
    if (!item) return;
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.buy) {
      const qty = +btn.dataset.buy;
      if (buyGift(item.dataset.g, qty)) { floatAt(btn, `+${qty}`, 'aff'); toast(`Bought ${qty}× ${GIFTS.find((g) => g.id === item.dataset.g).icon}. Give it from your partner panel!`, { icon: '🎁', duration: 2200 }); draw(); }
    } else if (btn.hasAttribute('data-buyo')) {
      if (buyOutfit(item.dataset.o)) { equip(S.partner, { outfit: item.dataset.o }); draw(); }
    } else if (btn.hasAttribute('data-wear')) {
      equip(S.partner, { outfit: item.dataset.o }); sfx('pop'); toast('Outfit equipped!', { icon: '👗', duration: 1500 });
    } else if (btn.hasAttribute('data-buya')) {
      if (buyAccessory(item.dataset.a)) { equip(S.partner, { acc: item.dataset.a }); draw(); }
    } else if (btn.hasAttribute('data-weara')) {
      equip(S.partner, { acc: item.dataset.a }); sfx('pop'); toast('Accessory equipped!', { icon: '🎀', duration: 1500 });
    }
  });
  draw();
}
