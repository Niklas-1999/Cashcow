import { GAME_BY_ID } from '../games/registry.js';
import { makeCtx } from '../casino.js';
import { helpButton } from '../ui.js';
import { partner, perkValue } from '../state.js';

export async function mount(view, [id]) {
  const g = GAME_BY_ID[id];
  if (!g) { location.hash = '#/lobby'; return; }
  const p = partner();
  const perk = p && ((p.perk.type === 'win' && p.perk.game === id) || p.perk.type === 'allwin') ? perkValue(p.id) : 0;
  view.innerHTML = `
  <div class="page game-page game-${id}" style="--c1:${g.c1};--c2:${g.c2}">
    <div class="game-head">
      <a class="btn ghost small" href="#/lobby">← Lobby</a>
      <h1>${g.name}</h1>
      ${perk ? `<span class="perk-pill" title="Your partner boosts this game">✦ Partner bonus +${perk.toFixed(1).replace(/\.0$/, '')}% winnings</span>` : ''}
      <div class="spacer"></div>
      <div class="game-head-actions"></div>
    </div>
    <div class="game-root"><div class="game-loading">Shuffling the deck…</div></div>
  </div>`;
  const mod = (await import(`../games/${id}.js`)).default;
  const root = view.querySelector('.game-root');
  root.innerHTML = '';
  view.querySelector('.game-head-actions').appendChild(helpButton(g.name, mod.rules));
  return mod.mount(root, makeCtx(id));
}
