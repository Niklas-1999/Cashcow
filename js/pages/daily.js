import { fmt, bus } from '../util.js';
import { S, dailyStatus, claimDaily, DAILY_REWARDS, perkFor } from '../state.js';
import { ensureMissions, claimMission } from '../progress.js';
import { coins, toast } from '../ui.js';
import { sfx } from '../audio.js';
import { coinFly, burstAt, rainCoins } from '../fx.js';
import { react } from '../companion.js';

const ICONS = ['🍡', '🍫', '🌸', '🍰', '🎀', '💎', '👑'];
const MICONS = { rounds: '🎲', wins: '🏆', game: '🎮', wager: '💰', mult: '✨', gift: '🎁', pat: '🖐️', gacha: '🔮', variety: '🎪', profit: '📈' };

export function mount(view) {
  let timer;
  const render = () => {
    ensureMissions();
    const ds = dailyStatus();
    const streakDay = ds.available ? ds.day : (S.daily.streak - 1) % 7;
    const bonusPct = perkFor('daily');
    view.innerHTML = `
    <div class="page">
      <div class="page-head"><h1>Daily Rewards</h1><p class="sub">Log in every day to build your streak. Missions refresh at midnight.</p></div>
      <div class="panel pad">
        <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
          <div><h3 style="margin:0">Login streak: ${S.daily.streak} day${S.daily.streak === 1 ? '' : 's'} 🔥</h3>
          <div class="muted" style="font-size:13px">${bonusPct ? `Your partner adds <b style="color:var(--gold)">+${(bonusPct * 100).toFixed(0)}%</b> to daily rewards.` : 'Miss a day and the streak resets.'}</div></div>
          <div style="margin-left:auto">${ds.available ? `<button class="btn gold big shine" id="claim">Claim ${coins(Math.floor(DAILY_REWARDS[ds.day] * (1 + bonusPct)))}</button>` : `<button class="btn" disabled>Come back tomorrow · <span id="cd"></span></button>`}</div>
        </div>
        <div class="daily-grid">${DAILY_REWARDS.map((r, i) => `<div class="dday ${ds.available ? (i < ds.day ? 'done' : i === ds.day ? 'today' : '') : i <= streakDay ? 'done' : ''}">
          <div class="dd-n">DAY ${i + 1}</div><div class="dd-icon">${ICONS[i]}</div><div class="dd-amt">${fmt(r)}</div></div>`).join('')}</div>
      </div>
      <div class="panel pad" style="margin-top:18px">
        <h3>Daily missions</h3>
        ${S.missions.list.map((m, i) => `<div class="mission ${m.claimed ? 'claimed' : m.p >= m.n ? 'done' : ''}">
          <div class="m-icon">${MICONS[m.type] || '📜'}</div>
          <div class="m-body"><div class="m-text">${m.text}</div><div class="pity-bar"><span style="width:${(m.p / m.n) * 100}%"></span></div>
          <div class="m-prog">${fmt(m.p)} / ${fmt(m.n)} · reward ${coins(m.reward)}</div></div>
          ${m.claimed ? '<button class="btn small" disabled>Claimed ✓</button>' : `<button class="btn small ${m.p >= m.n ? 'gold shine' : ''}" data-m="${i}" ${m.p >= m.n ? '' : 'disabled'}>Claim</button>`}
        </div>`).join('')}
      </div>
    </div>`;
    view.querySelector('#claim')?.addEventListener('click', (e) => {
      const r = claimDaily();
      if (!r) return;
      sfx('bigwin');
      coinFly(e.currentTarget, 16);
      rainCoins(40);
      toast(`Daily bonus: +${coins(r.base)}${r.bonus ? ` + ${coins(r.bonus)} partner bonus` : ''}`, { type: 'gold', icon: '🎁' });
      react('win', { force: true });
      render();
    });
    view.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => {
      const amt = claimMission(+b.dataset.m);
      if (!amt) return;
      sfx('cashout');
      coinFly(b, 10);
      burstAt(b, { n: 30 });
      toast(`Mission reward: +${coins(amt)}`, { type: 'gold', icon: '📜' });
      render();
    }));
    const cd = view.querySelector('#cd');
    if (cd) {
      const tick = () => {
        const now = new Date(), mid = new Date(now); mid.setHours(24, 0, 0, 0);
        const s = Math.floor((mid - now) / 1000);
        cd.textContent = `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}m ${String(s % 60).padStart(2, '0')}s`;
      };
      tick();
      clearInterval(timer);
      timer = setInterval(tick, 1000);
    }
  };
  render();
  const off = bus.on('missions', render);
  return () => { clearInterval(timer); off(); };
}
