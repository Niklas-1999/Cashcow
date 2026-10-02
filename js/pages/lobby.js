import { h, escapeHtml, fmt } from '../util.js';
import { S, partner, dailyStatus, perkValue } from '../state.js';
import { GAMES, CATS } from '../games/registry.js';
import { GAME_ART } from '../icons.js';
import { renderWaifu } from '../waifu/render.js';
import { WAIFU_BY_ID, PERSONALITIES } from '../waifu/data.js';
import { currentBanner } from '../gacha-core.js';
import { stars, coins, segmented } from '../ui.js';
import { sfx } from '../audio.js';

let cat = 'all';

export function mount(view) {
  const p = partner();
  const banner = currentBanner();
  const ur = WAIFU_BY_ID[banner.ur];
  const ds = dailyStatus();
  const hour = new Date().getHours();
  const greet = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const net = S.stats.won - S.stats.wagered;

  view.innerHTML = `
  <div class="page lobby">
    <section class="lobby-hero">
      <div class="hero-welcome panel">
        <div class="hw-text">
          <div class="hw-greet">${greet},</div>
          <h1 class="hw-name">${escapeHtml(S.player.name)} <span class="wave">♡</span></h1>
          <p class="muted">${p ? `${escapeHtml(p.name.split(' ')[0])} is by your side today. Her perk is active in every game.` : ''}</p>
          <div class="hw-stats">
            <div><b>${fmt(S.stats.rounds)}</b><span>Rounds</span></div>
            <div><b>${Object.keys(S.owned).length}/32</b><span>Waifus</span></div>
            <div><b class="${net >= 0 ? 'pos' : 'neg'}">${net >= 0 ? '+' : ''}${fmt(net)}</b><span>Net</span></div>
          </div>
          ${ds.available ? `<a class="btn gold shine" href="#/daily">🎁 Claim daily bonus</a>` : `<a class="btn ghost" href="#/daily">📜 Daily missions</a>`}
        </div>
      </div>
      <a class="hero-banner" href="#/gacha" style="--wc:${ur.palette.accent};--wh:${ur.hair.color}">
        <div class="hb-bg"></div>
        <div class="hb-art">${renderWaifu(ur, { expr: 'wink' })}</div>
        <div class="hb-info">
          <div class="hb-label">✦ LIMITED RATE-UP ✦</div>
          <div class="hb-name">${ur.name}</div>
          <div class="hb-title">${ur.title} ${stars('UR')}</div>
          <div class="btn primary small shine">Summon now →</div>
        </div>
      </a>
    </section>

    <div class="lobby-games-head">
      <h2>Games</h2>
      <div class="cat-wrap"></div>
    </div>
    <div class="game-grid"></div>
  </div>`;

  const grid = view.querySelector('.game-grid');
  const draw = () => {
    const perk = p?.perk;
    grid.innerHTML = GAMES.filter((g) => cat === 'all' || g.cat === cat).map((g, i) => {
      const boosted = perk && ((perk.type === 'win' && perk.game === g.id) || perk.type === 'allwin');
      const played = S.stats.games[g.id]?.rounds || 0;
      return `<a class="game-card" href="#/game/${g.id}" style="--c1:${g.c1};--c2:${g.c2};--i:${i}">
        <div class="gc-art">${GAME_ART[g.id]}</div>
        ${g.tag ? `<span class="gc-tag">${g.tag}</span>` : ''}
        ${boosted ? `<span class="gc-perk" title="Partner perk active">✦ +${perkValue(p.id).toFixed(1).replace(/\.0$/, '')}%</span>` : ''}
        <div class="gc-info">
          <div class="gc-name">${g.name}</div>
          <div class="gc-desc">${g.desc}</div>
          ${played ? `<div class="gc-played">${fmt(played)} rounds played</div>` : ''}
        </div>
        <div class="gc-play">PLAY</div>
      </a>`;
    }).join('');
  };
  view.querySelector('.cat-wrap').appendChild(segmented(CATS.map((c) => ({ v: c.id, label: c.label })), cat, (v) => { cat = v; draw(); }));
  draw();
}
