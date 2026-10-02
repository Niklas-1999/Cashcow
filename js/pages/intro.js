import { h, escapeHtml } from '../util.js';
import { S, addWaifu, saveSoon, save } from '../state.js';
import { STARTERS, WAIFU_BY_ID, PERSONALITIES, perkText } from '../waifu/data.js';
import { renderWaifu } from '../waifu/render.js';
import { line } from '../waifu/dialogue.js';
import { sfx, unlockAudio } from '../audio.js';
import { burst, confettiRain } from '../fx.js';
import { render as renderCompanion, react } from '../companion.js';
import { stars, coins } from '../ui.js';

export function mount(view, done) {
  let chosen = null;
  view.innerHTML = `
  <div class="intro">
    <div class="intro-hero">
      <div class="intro-logo">
        <div class="intro-heart">♥</div>
        <h1>CASHCOW</h1>
        <div class="intro-sub">Waifu Casino</div>
      </div>
      <p class="intro-tag">14 casino games · 32 waifus to collect · outfits, gifts & affection<br><span class="muted">Simulated coins only — no real money, ever.</span></p>
    </div>
    <div class="intro-step panel pad">
      <h2>What should your partner call you?</h2>
      <input class="text-input" id="pname" maxlength="18" value="${escapeHtml(S.player.name)}" placeholder="Senpai">
    </div>
    <h2 class="intro-choose">Choose your first partner</h2>
    <div class="starter-grid">
      ${STARTERS.map((id) => {
        const w = WAIFU_BY_ID[id];
        return `<button class="starter-card r-${w.rarity}" data-id="${id}" style="--wc:${w.palette.accent};--wh:${w.hair.color}">
          <div class="starter-art">${renderWaifu(w, { expr: 'neutral' })}</div>
          <div class="starter-info">
            <div class="starter-name">${w.name}</div>
            <div class="muted">${w.title} · ${PERSONALITIES[w.personality]}</div>
            <div class="starter-perk">✦ ${perkText(w.perk)}</div>
            <div class="starter-quote">“${escapeHtml(line(w.personality, 'intro', { name: S.player.name, w: w.name.split(' ')[0] }))}”</div>
          </div>
        </button>`;
      }).join('')}
    </div>
    <div class="intro-go">
      <button class="btn primary big shine" id="go" disabled>Enter the Casino ♥</button>
      <div class="muted small-note">You start with ${coins(S.coins)} — win more to unlock waifus in the Gacha!</div>
    </div>
  </div>`;
  const go = view.querySelector('#go');
  view.querySelectorAll('.starter-card').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      const w = WAIFU_BY_ID[card.dataset.id];
      card.querySelector('.starter-art').innerHTML = renderWaifu(w, { expr: chosen === w.id ? 'love' : 'happy' });
    });
    card.addEventListener('mouseleave', () => {
      const w = WAIFU_BY_ID[card.dataset.id];
      card.querySelector('.starter-art').innerHTML = renderWaifu(w, { expr: chosen === w.id ? 'love' : 'neutral' });
    });
    card.addEventListener('click', () => {
      unlockAudio();
      chosen = card.dataset.id;
      sfx('heart');
      view.querySelectorAll('.starter-card').forEach((c) => {
        c.classList.toggle('chosen', c === card);
        const w = WAIFU_BY_ID[c.dataset.id];
        c.querySelector('.starter-art').innerHTML = renderWaifu(w, { expr: c === card ? 'love' : 'neutral' });
      });
      const r = card.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 3, { type: 'heart', n: 20, colors: ['#ff5c93', '#ff8ab5', '#fff'], speed: 8 });
      go.disabled = false;
    });
  });
  go.addEventListener('click', () => {
    if (!chosen) return;
    const name = view.querySelector('#pname').value.trim().slice(0, 18) || 'Senpai';
    S.player.name = name;
    addWaifu(chosen);
    S.partner = chosen;
    S.seenIntro = true;
    save();
    sfx('bigwin');
    confettiRain(120);
    renderCompanion();
    done();
    setTimeout(() => react('partner', { force: true, hold: 5000 }), 700);
  });
}
