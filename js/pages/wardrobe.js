import { escapeHtml } from '../util.js';
import { S, waifu } from '../state.js';
import { WAIFU_BY_ID, OUTFIT_LIST, ACCESSORY_LIST, AFFECTION_LEVELS, RARITY_ORDER } from '../waifu/data.js';
import { renderWaifu } from '../waifu/render.js';
import { ownsOutfit, buyOutfit, buyAccessory, equip, price } from '../shop-core.js';
import { coins, confirmDialog, toast } from '../ui.js';
import { sfx } from '../audio.js';
import { react } from '../companion.js';
import { burstAt } from '../fx.js';

let tab = 'outfits';

export function mount(view, [paramId]) {
  const ids = Object.keys(S.owned).sort((a, b) => RARITY_ORDER.indexOf(WAIFU_BY_ID[b].rarity) - RARITY_ORDER.indexOf(WAIFU_BY_ID[a].rarity));
  let wid = paramId && S.owned[paramId] ? paramId : S.partner;

  view.innerHTML = `
  <div class="page">
    <div class="page-head"><h1>Wardrobe</h1><p class="sub">Dress up your waifus. Outfits you buy can be worn by everyone.</p></div>
    <div class="wardrobe">
      <div class="wr-stage">
        <div class="wr-art"></div>
        <div class="wr-who">${ids.map((id) => { const w = WAIFU_BY_ID[id]; return `<button data-w="${id}" class="r-${w.rarity}" title="${escapeHtml(w.name)}">${renderWaifu(w, { anim: false, outfit: S.owned[id].outfit })}</button>`; }).join('')}</div>
      </div>
      <div>
        <div class="tabs"><button data-t="outfits">👗 Outfits</button><button data-t="accessories">🎀 Accessories</button><a href="#/shop/gifts">🎁 Gift shop →</a></div>
        <div class="item-grid"></div>
        <p class="preview-note">Tap an owned item to equip it. Locked items can be bought right here.</p>
      </div>
    </div>
  </div>`;
  const art = view.querySelector('.wr-art');
  const grid = view.querySelector('.item-grid');

  function drawStage(expr = 'neutral') {
    const w = waifu(wid);
    art.style.setProperty('--wh', w.hair.color);
    art.innerHTML = renderWaifu(w, { expr, outfit: w.outfit, acc: w.acc });
    view.querySelectorAll('.wr-who button').forEach((b) => b.classList.toggle('on', b.dataset.w === wid));
  }
  function drawItems() {
    const w = waifu(wid);
    view.querySelectorAll('.tabs [data-t]').forEach((b) => b.classList.toggle('on', b.dataset.t === tab));
    if (tab === 'outfits') {
      const list = [OUTFIT_LIST.find((o) => o.id === WAIFU_BY_ID[wid].outfit), ...OUTFIT_LIST.filter((o) => o.id !== WAIFU_BY_ID[wid].outfit)];
      grid.innerHTML = list.map((o) => {
        const sig = o.id === WAIFU_BY_ID[wid].outfit;
        const owned = sig || ownsOutfit(o.id, wid);
        const sub = sig ? 'Signature' : owned ? 'Owned' : o.affection ? `🔒 ${AFFECTION_LEVELS[o.affection].name}` : coins(price(o.price));
        return `<button class="item ${w.outfit === o.id ? 'on' : ''} ${owned ? '' : 'locked'}" data-o="${o.id}">
          ${owned ? '' : `<span class="lock-tag">${o.affection ? '💍' : '🔒'}</span>`}
          <div class="item-art">${renderWaifu({ ...w, outfit: o.id }, { anim: false, outfit: o.id, acc: w.acc })}</div>
          <div class="item-name">${o.name}</div><div class="item-sub ${owned ? '' : 'price'}">${sub}</div></button>`;
      }).join('');
    } else {
      grid.innerHTML = `<button class="item ${!w.acc ? 'on' : ''}" data-a=""><div class="item-art acc">${renderWaifu(w, { anim: false, outfit: w.outfit, acc: null })}</div><div class="item-name">None</div><div class="item-sub">—</div></button>` +
        ACCESSORY_LIST.map((a) => {
          const innate = (w.traits || []).includes(a.id);
          const owned = S.accessories.includes(a.id);
          return `<button class="item ${w.acc === a.id ? 'on' : ''} ${owned || innate ? '' : 'locked'}" data-a="${a.id}" ${innate ? 'disabled title="Already part of her look"' : ''}>
            ${owned ? '' : innate ? '<span class="owned-tag">Innate</span>' : '<span class="lock-tag">🔒</span>'}
            <div class="item-art acc">${renderWaifu(w, { anim: false, outfit: w.outfit, acc: a.id })}</div>
            <div class="item-name">${a.name}</div><div class="item-sub ${owned ? '' : 'price'}">${owned ? 'Owned' : innate ? '—' : coins(price(a.price))}</div></button>`;
        }).join('');
    }
  }

  grid.addEventListener('click', async (e) => {
    const b = e.target.closest('.item');
    if (!b || b.disabled) return;
    const w = waifu(wid);
    if (b.dataset.o !== undefined) {
      const id = b.dataset.o;
      const sig = id === WAIFU_BY_ID[wid].outfit;
      if (!sig && !ownsOutfit(id, wid)) {
        const o = OUTFIT_LIST.find((x) => x.id === id);
        if (o.affection) { sfx('error'); toast(`Reach <b>${AFFECTION_LEVELS[o.affection].name}</b> with ${escapeHtml(w.name.split(' ')[0])} to unlock this gown.`, { icon: '💍' }); return; }
        if (!(await confirmDialog('Buy outfit?', `Buy <b>${o.name}</b> for ${coins(price(o.price))}? All your waifus will be able to wear it.`, 'Buy'))) return;
        if (!buyOutfit(id)) return;
      }
      equip(wid, { outfit: id });
    } else {
      const id = b.dataset.a || null;
      if (id && !S.accessories.includes(id)) {
        const a = ACCESSORY_LIST.find((x) => x.id === id);
        if (!(await confirmDialog('Buy accessory?', `Buy <b>${a.name}</b> for ${coins(price(a.price))}?`, 'Buy'))) return;
        if (!buyAccessory(id)) return;
      }
      equip(wid, { acc: id });
    }
    sfx('pop');
    drawStage('wink');
    burstAt(art, { type: 'star', n: 16, colors: ['#fff', '#ffd23a', '#ff8ac0'], speed: 6, gravity: 0.05 });
    if (wid === S.partner) react('outfit', { force: true });
    drawItems();
    const thumb = view.querySelector(`.wr-who [data-w="${wid}"]`);
    if (thumb) thumb.innerHTML = renderWaifu(waifu(wid), { anim: false });
  });
  view.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]');
    if (!b) return;
    tab = b.dataset.t; sfx('tab'); drawItems();
  });
  view.querySelector('.wr-who').addEventListener('click', (e) => {
    const b = e.target.closest('[data-w]');
    if (!b) return;
    wid = b.dataset.w; sfx('click'); drawStage(); drawItems();
  });
  drawStage();
  drawItems();
}
