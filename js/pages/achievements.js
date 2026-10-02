import { S } from '../state.js';
import { ACHIEVEMENTS } from '../progress.js';
import { coins } from '../ui.js';

export function mount(view) {
  const got = ACHIEVEMENTS.filter((a) => S.achievements[a.id]).length;
  const sorted = [...ACHIEVEMENTS].sort((a, b) => (!!S.achievements[b.id]) - (!!S.achievements[a.id]));
  view.innerHTML = `
  <div class="page">
    <div class="page-head"><h1>Trophies</h1><p class="sub">${got} / ${ACHIEVEMENTS.length} unlocked · rewards are paid out instantly.</p></div>
    <div class="pity-bar" style="height:10px;margin-bottom:18px"><span style="width:${(got / ACHIEVEMENTS.length) * 100}%"></span></div>
    <div class="ach-grid">${sorted.map((a) => {
      const t = S.achievements[a.id];
      return `<div class="ach ${t ? 'got' : ''}"><div class="a-icon">${a.icon}</div><div>
        <div class="a-name">${a.name}</div><div class="a-desc">${a.desc}</div>
        <div class="a-reward">${t ? `<span style="color:var(--green);font-weight:800">✓ ${new Date(t).toLocaleDateString()}</span>` : coins(a.reward)}</div></div></div>`;
    }).join('')}</div>
  </div>`;
}
