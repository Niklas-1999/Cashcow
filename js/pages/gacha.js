import { h, sleep, fmt, bus, escapeHtml } from '../util.js';
import { S, spend, perkFor } from '../state.js';
import { WAIFU_BY_ID, RARITY, RARITY_ORDER, PERSONALITIES } from '../waifu/data.js';
import { renderWaifu } from '../waifu/render.js';
import { line } from '../waifu/dialogue.js';
import { currentBanner, pullCost, pull, RATES, SOFT_PITY, HARD_PITY } from '../gacha-core.js';
import { sfx } from '../audio.js';
import { burst, confettiRain } from '../fx.js';
import { react } from '../companion.js';
import { stars, coins, toast } from '../ui.js';

const ORB = { R: '#6fb6ff', SR: '#c77dff', SSR: '#ffcf4d', UR: '#ff6fd8' };

function timeLeft(ms) {
  const d = Math.floor(ms / 86400000), hh = Math.floor((ms % 86400000) / 3600000), mm = Math.floor((ms % 3600000) / 60000);
  return `${d}d ${hh}h ${mm}m`;
}

export function mount(view) {
  const banner = currentBanner();
  const ur = WAIFU_BY_ID[banner.ur];
  const [s1, s2] = banner.ssr.map((id) => WAIFU_BY_ID[id]);
  const render = () => {
    view.innerHTML = `
    <div class="page gacha-page">
      <div class="page-head"><h1>Summoning Shrine</h1><p class="sub">Spend coins to summon new waifus. Duplicates awaken constellation stars.</p></div>
      <div class="banner-stage" style="--wc:${ur.palette.accent};--wh:${ur.hair.color}">
        <div class="bs-bg"></div>
        <div class="bs-art">
          <div class="bs-side l">${renderWaifu(s1, { expr: 'smug' })}</div>
          <div class="bs-side r">${renderWaifu(s2, { expr: 'wink' })}</div>
          <div class="bs-main">${renderWaifu(ur, { expr: 'happy' })}</div>
        </div>
        <div class="bs-info">
          <div class="bs-label">✦ LIMITED RATE-UP BANNER ✦</div>
          <div class="bs-name">${ur.name}</div>
          <div>${stars('UR')} <span class="muted">${ur.title} · ${PERSONALITIES[ur.personality]}</span></div>
          <div class="bs-desc">50% of UR summons are <b>${ur.name}</b>. 50% of SSR summons are <b>${s1.name.split(' ')[0]}</b> or <b>${s2.name.split(' ')[0]}</b>.</div>
          <div class="bs-timer">Banner rotates in ${timeLeft(banner.endsAt - Date.now())}</div>
          <div class="pull-row">
            <button class="btn primary big pull-btn" data-n="1">Summon ×1<span class="sub">${coins(pullCost(1))}</span></button>
            <button class="btn gold big pull-btn shine" data-n="10">Summon ×10<span class="sub">${coins(pullCost(10))} · SR+ guaranteed</span></button>
          </div>
          ${perkFor('gacha') ? `<div class="discount-pill" style="align-self:flex-start">✦ Partner discount −${(perkFor('gacha') * 100).toFixed(1).replace('.0', '')}%</div>` : ''}
          <div class="pity">
            <span>SSR+ guaranteed in ${SOFT_PITY - S.gacha.pity} summons</span><div class="pity-bar"><span style="width:${(S.gacha.pity / SOFT_PITY) * 100}%"></span></div>
            <span>UR guaranteed in ${HARD_PITY - S.gacha.pityUR} summons</span><div class="pity-bar"><span style="width:${(S.gacha.pityUR / HARD_PITY) * 100}%"></span></div>
          </div>
        </div>
      </div>
      <div class="gacha-lower">
        <div class="panel pad">
          <h3>Summon rates</h3>
          <table class="rates-table">${RARITY_ORDER.slice().reverse().map((r) => `<tr><td>${stars(r)} ${RARITY[r].name}</td><td>${RATES[r]}%</td></tr>`).join('')}</table>
          <p class="muted" style="font-size:13px;line-height:1.5;margin-bottom:0">Duplicates add a constellation star (max 5★), boosting her perk by 15% each. Beyond 5★, duplicates are converted into coins.</p>
        </div>
        <div class="panel pad">
          <h3>Recent summons</h3>
          ${S.gacha.log.length ? `<div class="pull-log">${S.gacha.log.slice(0, 30).map((l) => `<div class="mini" style="--rc:${ORB[l.r]}" title="${escapeHtml(WAIFU_BY_ID[l.id]?.name || '')}">${renderWaifu(WAIFU_BY_ID[l.id], { anim: false })}</div>`).join('')}</div>` : '<p class="muted">No summons yet — your destiny awaits ♡</p>'}
        </div>
      </div>
    </div>`;
    view.querySelectorAll('.pull-btn').forEach((b) => (b.onclick = () => doPull(+b.dataset.n)));
  };

  async function doPull(n) {
    const cost = pullCost(n);
    if (!spend(cost)) { sfx('error'); toast(`You need ${coins(cost)} to summon. Win some games first!`, { type: 'warn', icon: '💸' }); return; }
    S.stats.coinsSpentShop += cost;
    const results = pull(n);
    bus.emit('gacha', n);
    await summonAnimation(results);
    render();
  }

  render();
}

// ---------------------------------------------------------------------------
async function summonAnimation(results) {
  const best = results.reduce((a, r) => (RARITY_ORDER.indexOf(r.rarity) > RARITY_ORDER.indexOf(a) ? r.rarity : a), 'R');
  const ov = h(`<div class="summon r-${best}" style="--oc:${ORB[best]}">
    <div class="summon-circle"><svg viewBox="0 0 400 400">
      <g class="ring1"><circle cx="200" cy="200" r="190" fill="none" stroke="${ORB[best]}" stroke-width="2" class="draw" opacity=".9"/>
        ${Array.from({ length: 24 }, (_, i) => `<text x="200" y="22" transform="rotate(${i * 15} 200 200)" text-anchor="middle" fill="${ORB[best]}" font-size="14" opacity=".8">${'✦♡✧☆'[i % 4]}</text>`).join('')}</g>
      <g class="ring2"><circle cx="200" cy="200" r="150" fill="none" stroke="#fff" stroke-width="1.5" stroke-dasharray="6 8" opacity=".6"/>
        <rect x="94" y="94" width="212" height="212" fill="none" stroke="${ORB[best]}" stroke-width="2.5" class="draw"/><rect x="94" y="94" width="212" height="212" fill="none" stroke="${ORB[best]}" stroke-width="2.5" class="draw" transform="rotate(45 200 200)"/></g>
      <circle cx="200" cy="200" r="100" fill="none" stroke="#fff" stroke-width="1" class="draw" opacity=".7"/>
    </svg></div>
    <div class="summon-orb"></div>
    <div class="summon-flash"></div>
    <button class="btn ghost small summon-skip">Skip ⏭</button>
  </div>`);
  document.body.appendChild(ov);
  sfx('summon');
  let skipped = false;
  ov.querySelector('.summon-skip').onclick = () => (skipped = true);
  for (let t = 0; t < 3300 && !skipped; t += 100) await sleep(100);
  sfx('reveal', best);
  ov.querySelector('.summon-circle').style.opacity = '.25';
  ov.querySelector('.summon-orb')?.remove();
  ov.querySelector('.summon-skip').remove();

  const stage = h(`<div class="reveal-stage">
    <div class="reveal-grid ${results.length === 1 ? 'single' : ''}">${results.map((r, i) => {
      const w = WAIFU_BY_ID[r.id];
      return `<div class="rcard r-${r.rarity}" data-i="${i}" style="--rc:${ORB[r.rarity]};--wh:${w.hair.color}">
        <div class="rcard-inner">
          <div class="rcard-face">${r.isNew ? '<span class="new-tag">NEW!</span>' : `<span class="dupe-tag">${r.refund ? '+' + fmt(r.refund) + ' coins' : `★ ${r.stars}/5`}</span>`}
            ${renderWaifu(w, { expr: r.rarity === 'SSR' || r.rarity === 'UR' ? 'happy' : 'neutral', anim: false })}
            <div class="rcard-name">${escapeHtml(w.name)}${stars(r.rarity)}</div></div>
          <div class="rcard-back"></div>
        </div></div>`;
    }).join('')}</div>
    <div style="display:flex;gap:10px"><button class="btn ghost" id="rv-all">Reveal all</button><button class="btn primary" id="rv-done" hidden>Done ♡</button></div>
  </div>`);
  ov.appendChild(stage);
  const hint = h('<div class="summon-hint">tap the cards to reveal</div>');
  ov.appendChild(hint);
  const cards = [...stage.querySelectorAll('.rcard')];
  let opened = 0;
  let queue = Promise.resolve();
  const open = (card) => {
    if (card.classList.contains('open')) return;
    card.classList.add('open');
    opened++;
    const r = results[+card.dataset.i];
    sfx(r.rarity === 'R' ? 'flip' : 'reveal', r.rarity);
    const rect = card.getBoundingClientRect();
    if (r.rarity !== 'R') burst(rect.left + rect.width / 2, rect.top + rect.height / 2, { n: r.rarity === 'SR' ? 16 : 50, colors: [ORB[r.rarity], '#fff'], speed: r.rarity === 'SR' ? 6 : 11 });
    if ((r.rarity === 'SSR' || r.rarity === 'UR') && r.isNew) queue = queue.then(() => showcase(r));
    if (opened === cards.length) { stage.querySelector('#rv-all').hidden = true; stage.querySelector('#rv-done').hidden = false; hint.remove(); }
  };
  cards.forEach((c) => c.addEventListener('click', () => open(c)));
  stage.querySelector('#rv-all').onclick = async () => {
    for (const c of cards) { if (!c.classList.contains('open')) { open(c); await sleep(120); } }
  };
  await new Promise((res) => (stage.querySelector('#rv-done').onclick = res));
  await queue;
  ov.classList.add('out');
  setTimeout(() => ov.remove(), 400);
  const top = results.find((r) => r.rarity === 'UR' || r.rarity === 'SSR');
  if (top) react('bigwin', { force: true });
  const news = results.filter((r) => r.isNew).length;
  if (news) toast(`${news} new waifu${news > 1 ? 's' : ''} joined your collection!`, { type: 'success', icon: '💞' });
}

function showcase(r) {
  const w = WAIFU_BY_ID[r.id];
  return new Promise((res) => {
    const el = h(`<div class="showcase" style="--rc:${ORB[r.rarity]};--wh:${w.hair.color}">
      <div class="sc-rays"></div>
      <div class="sc-inner">
        <div class="sc-art">${renderWaifu(w, { expr: 'happy' })}</div>
        <div class="sc-text">
          <div class="sc-rarity" style="color:${ORB[r.rarity]}">${r.rarity}</div>
          ${stars(r.rarity)}
          <div class="sc-name">${escapeHtml(w.name)}</div>
          <div class="sc-title">${escapeHtml(w.title)} · ${PERSONALITIES[w.personality]}</div>
          <div class="sc-quote">“${escapeHtml(line(w.personality, 'intro', { name: S.player.name, w: w.name.split(/[ "]/)[0] }))}”</div>
          <div class="bw-hint">tap to continue</div>
        </div>
      </div></div>`);
    document.body.appendChild(el);
    sfx('bigwin');
    confettiRain(r.rarity === 'UR' ? 160 : 90);
    el.onclick = () => { el.classList.add('out'); setTimeout(() => { el.remove(); res(); }, 350); };
  });
}
