import { fmt, fmtMult } from '../util.js';
import { S, xpToNext, vipTier } from '../state.js';
import { GAMES } from '../games/registry.js';
import { WAIFUS, affectionLevel, AFFECTION_LEVELS } from '../waifu/data.js';

export function mount(view) {
  const st = S.stats;
  const net = st.won - st.wagered;
  const v = vipTier();
  const tiles = [
    ['Player level', `${S.level} <small style="color:${v.color};font-size:13px">${v.name}</small>`],
    ['XP to next level', `${fmt(xpToNext(S.level) - S.xp)}`],
    ['Rounds played', fmt(st.rounds)],
    ['Win rate', st.rounds ? ((st.wins / st.rounds) * 100).toFixed(1) + '%' : '—'],
    ['Total wagered', fmt(st.wagered)],
    ['Total returned', fmt(st.won)],
    ['Net result', `<span class="${net >= 0 ? 'pos' : 'neg'}">${net >= 0 ? '+' : ''}${fmt(net)}</span>`],
    ['Biggest win', fmt(st.biggestWin)],
    ['Best multiplier', st.bestMult ? fmtMult(st.bestMult) : '—'],
    ['Longest win streak', fmt(st.maxWinStreak)],
    ['Gacha summons', fmt(S.gacha.pulls)],
    ['Waifus collected', `${Object.keys(S.owned).length} / ${WAIFUS.length}`],
    ['Gifts given', fmt(st.giftsGiven)],
    ['Head pats', fmt(st.pats)],
    ['Coins spent (shop & gacha)', fmt(st.coinsSpentShop)],
    ['Times rescued', fmt(st.bankrupt)],
  ];
  const rows = GAMES.map((g) => ({ g, s: st.games[g.id] || { rounds: 0, wagered: 0, won: 0, best: 0 } }));
  const hearts = Object.entries(S.owned).sort((a, b) => b[1].affection - a[1].affection).slice(0, 5);
  view.innerHTML = `
  <div class="page">
    <div class="page-head"><h1>Statistics</h1><p class="sub">Your journey at Cashcow Casino, ${new Date(S.created).toLocaleDateString()} – today.</p></div>
    <div class="stat-grid">${tiles.map(([k, val]) => `<div class="stat"><span>${k}</span><b>${val}</b></div>`).join('')}</div>
    <div class="two-col">
      <div class="panel pad" style="overflow-x:auto">
        <h3>Per game</h3>
        <table class="data-table"><tr><th>Game</th><th class="num">Rounds</th><th class="num">Wagered</th><th class="num">Net</th><th class="num">Best</th></tr>
        ${rows.map(({ g, s }) => { const n = s.won - s.wagered; return `<tr><td>${g.name}</td><td class="num">${fmt(s.rounds)}</td><td class="num">${fmt(s.wagered)}</td><td class="num ${n >= 0 ? 'pos' : 'neg'}">${s.rounds ? (n >= 0 ? '+' : '') + fmt(n) : '—'}</td><td class="num">${s.best ? fmt(s.best) : '—'}</td></tr>`; }).join('')}</table>
      </div>
      <div class="panel pad">
        <h3>Closest bonds</h3>
        <table class="data-table"><tr><th>Waifu</th><th>Bond</th><th class="num">Affection</th></tr>
        ${hearts.map(([id, o]) => { const w = WAIFUS.find((x) => x.id === id); const l = AFFECTION_LEVELS[affectionLevel(o.affection)]; return `<tr><td>${w.name}</td><td>${l.icon} ${l.name}</td><td class="num">${o.affection}</td></tr>`; }).join('')}</table>
      </div>
    </div>
  </div>`;
}
