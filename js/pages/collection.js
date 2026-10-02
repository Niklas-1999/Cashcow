import { escapeHtml, fmt } from '../util.js';
import { S, waifu, setPartner, perkValue, owns } from '../state.js';
import { WAIFUS, WAIFU_BY_ID, RARITY, RARITY_ORDER, PERSONALITIES, AFFECTION_LEVELS, affectionLevel, perkText, OUTFIT_BY_ID } from '../waifu/data.js';
import { renderWaifu, EXPRESSIONS } from '../waifu/render.js';
import { modal, stars, segmented } from '../ui.js';
import { sfx } from '../audio.js';
import { say } from '../companion.js';

let filter = 'all';

export function mount(view) {
  const ownedN = Object.keys(S.owned).length;
  view.innerHTML = `
  <div class="page">
    <div class="page-head"><h1>Collection</h1><p class="sub">Every waifu you've met. Tap one to see her profile.</p></div>
    <div class="coll-bar">
      <div class="coll-progress"><div class="ctl-label" style="margin-bottom:6px">${ownedN} / ${WAIFUS.length} collected</div><div class="pity-bar"><span style="width:${(ownedN / WAIFUS.length) * 100}%"></span></div></div>
      <div class="filter"></div>
    </div>
    <div class="coll-grid"></div>
  </div>`;
  const grid = view.querySelector('.coll-grid');
  const draw = () => {
    const list = WAIFUS.filter((w) => filter === 'all' || (filter === 'owned' ? owns(w.id) : w.rarity === filter))
      .sort((a, b) => (owns(b.id) - owns(a.id)) || RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity));
    grid.innerHTML = list.map((w, i) => {
      const o = S.owned[w.id];
      if (!o) return `<button class="wcard locked r-${w.rarity}" data-id="${w.id}" style="--i:${i};--wh:#444">${renderWaifu(w, { anim: false })}<div class="wc-name">??? ${stars(w.rarity)}</div></button>`;
      const lvl = affectionLevel(o.affection);
      return `<button class="wcard r-${w.rarity}" data-id="${w.id}" style="--i:${i};--wh:${w.hair.color}">
        ${renderWaifu({ ...w, outfit: o.outfit }, { anim: false, acc: o.acc })}
        <div class="wc-top">${S.partner === w.id ? '<span class="partner-tag">PARTNER</span>' : '<span></span>'}<span class="wc-aff" title="${AFFECTION_LEVELS[lvl].name}">${AFFECTION_LEVELS[lvl].icon}</span></div>
        <div class="wc-name">${escapeHtml(w.name)}<br>${stars(w.rarity)}${o.stars ? ` <span style="color:var(--gold);font-size:11px">+${o.stars}</span>` : ''}</div>
      </button>`;
    }).join('');
  };
  view.querySelector('.filter').appendChild(segmented([{ v: 'all', label: 'All' }, { v: 'owned', label: 'Owned' }, ...RARITY_ORDER.map((r) => ({ v: r, label: r }))], filter, (v) => { filter = v; draw(); }));
  grid.addEventListener('click', (e) => {
    const c = e.target.closest('[data-id]');
    if (!c) return;
    sfx('pop');
    openProfile(c.dataset.id, draw);
  });
  draw();
}

export function openProfile(id, onChange) {
  const def = WAIFU_BY_ID[id];
  if (!S.owned[id]) {
    modal({
      title: '??? ' + stars(def.rarity), cls: 'small',
      html: `<div class="wd-art r-${def.rarity}" style="--wh:#333;max-width:280px;margin:0 auto">${renderWaifu(def, { anim: false }).replace('class="waifu-svg', 'style="filter:brightness(0) opacity(.5)" class="waifu-svg')}</div>
        <p style="text-align:center">A ${RARITY[def.rarity].name} waifu you haven't met yet.<br><span class="muted">Summon at the shrine to meet her!</span></p>
        <div style="text-align:center"><a class="btn primary" href="#/gacha">Go to Gacha</a></div>`,
    }).el.addEventListener('click', (e) => { if (e.target.closest('a')) e.currentTarget.querySelector('.modal-x')?.click(); });
    return;
  }
  const w = waifu(id);
  const o = w.own;
  const lvl = affectionLevel(o.affection);
  const cur = AFFECTION_LEVELS[lvl], next = AFFECTION_LEVELS[lvl + 1];
  const memLevels = [2, 4, 6];
  const m = modal({
    title: '',
    html: `<div class="wdetail r-${w.rarity}">
      <div>
        <div class="wd-art" style="--wh:${w.hair.color}">${renderWaifu(w, { outfit: w.outfit, acc: w.acc })}</div>
        <div class="wd-exprs">${Object.keys(EXPRESSIONS).map((e) => `<button data-e="${e}">${e}</button>`).join('')}</div>
      </div>
      <div class="wd-info">
        <h2>${escapeHtml(w.name)}</h2>
        <div>${stars(w.rarity)} <span class="muted">${RARITY[w.rarity].name}</span></div>
        <div class="wd-meta">
          <span class="pill">${escapeHtml(w.title)}</span><span class="pill">${PERSONALITIES[w.personality]}</span>
          <span class="pill">💗 Loves ${w.likes.join(' & ')}</span><span class="pill">💔 Dislikes ${w.dislikes.join(', ')}</span>
        </div>
        <div class="wd-bio">${escapeHtml(w.bio)}</div>
        <div class="wd-section"><h3>Partner perk</h3><div class="comp-perk" style="margin:0">✦ ${perkText(w.perk, perkValue(id))}</div></div>
        <div class="wd-section"><h3>Constellation</h3><div class="const-stars">${[1, 2, 3, 4, 5].map((i) => `<span class="${i <= o.stars ? 'on' : 'off'}">★</span>`).join('')}</div>
          <div class="muted" style="font-size:12.5px">Each star (from duplicate summons) boosts her perk by 15%.</div></div>
        <div class="wd-section"><h3>Affection · ${cur.icon} ${cur.name}</h3>
          <div class="aff-bar"><div class="aff-fill" style="width:${next ? ((o.affection - cur.min) / (next.min - cur.min)) * 100 : 100}%"></div></div>
          <div class="aff-label"><span>${o.affection} ♡</span><span>${next ? `Next: ${next.name} at ${next.min}` : 'Max level!'}</span></div></div>
        <div class="wd-section"><h3>Memories</h3>
          ${w.secrets.map((s, i) => (lvl >= memLevels[i] ? `<div class="memory">💭 ${escapeHtml(s)}</div>` : `<div class="memory locked">🔒 Unlocks at ${AFFECTION_LEVELS[memLevels[i]].name}</div>`)).join('')}</div>
        <div class="wd-actions">
          ${S.partner === id ? '<button class="btn" disabled>♡ Current partner</button>' : '<button class="btn primary" data-a="partner">Set as partner ♡</button>'}
          <a class="btn" href="#/wardrobe/${id}">👗 Dress up</a>
        </div>
        <div class="muted" style="font-size:12px;margin-top:10px">Wearing: ${OUTFIT_BY_ID[w.outfit]?.name || w.outfit}. Played ${fmt(o.rounds || 0)} rounds together.</div>
      </div>
    </div>`,
  });
  const art = m.el.querySelector('.wd-art');
  m.el.querySelectorAll('[data-e]').forEach((b) => b.addEventListener('click', () => { art.innerHTML = renderWaifu(w, { expr: b.dataset.e, outfit: w.outfit, acc: w.acc }); sfx('pop'); }));
  m.el.querySelector('[data-a=partner]')?.addEventListener('click', () => { setPartner(id); sfx('heart'); m.close(); onChange?.(); });
  m.el.querySelector('a[href^="#/wardrobe"]').addEventListener('click', () => m.close());
}
