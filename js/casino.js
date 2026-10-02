// Round settlement shared by every game: wallet, perks, stats, XP, effects, reactions.
import { bus, fmt, fmtMult } from './util.js';
import { S, spend, earn, addXp, perkFor, saveSoon } from './state.js';
import { sfx } from './audio.js';
import { coinFly, floatAt, bigWin, burstAt } from './fx.js';
import { react, playAffection } from './companion.js';
import { toast, coins } from './ui.js';

export function makeCtx(gameId) {
  return {
    id: gameId,
    // take a wager; returns false (and complains) if unaffordable
    bet(amount) {
      amount = Math.floor(amount);
      if (amount <= 0) return false;
      if (!spend(amount)) {
        sfx('error');
        toast(`Not enough coins for that bet. You have ${coins(S.coins)}.`, { type: 'warn', icon: '💸' });
        return false;
      }
      sfx('chip');
      return true;
    },
    settle(wagered, returned, opts = {}) {
      return settle(gameId, wagered, returned, opts);
    },
    special(type, data) {
      bus.emit('special', { type, game: gameId, ...data });
    },
  };
}

function settle(game, wagered, returned, { anchor, quiet = false, noBig = false, multBase } = {}) {
  wagered = Math.floor(wagered);
  returned = Math.floor(returned);
  let bonus = 0, cashback = 0;
  if (returned > wagered) {
    const pct = perkFor('win', game) + perkFor('allwin');
    bonus = Math.floor((returned - wagered) * pct);
  } else if (returned < wagered) {
    cashback = Math.floor((wagered - returned) * perkFor('cashback'));
  }
  const total = returned + bonus + cashback;
  if (total > 0) earn(total);
  const net = total - wagered;
  const base = multBase || wagered;
  const mult = base > 0 ? returned / base : 0;

  // ---- stats ----
  const st = S.stats;
  const g = (st.games[game] ||= { rounds: 0, wagered: 0, won: 0, best: 0 });
  st.rounds++; g.rounds++;
  st.wagered += wagered; g.wagered += wagered;
  st.won += total; g.won += total;
  if (net > st.biggestWin) st.biggestWin = net;
  if (net > g.best) g.best = net;
  if (mult > st.bestMult && net > 0) st.bestMult = mult;
  const win = returned > wagered, push = returned === wagered;
  if (win) { st.wins++; st.winStreak++; st.lossStreak = 0; st.maxWinStreak = Math.max(st.maxWinStreak, st.winStreak); }
  else if (!push) { st.losses++; st.lossStreak++; st.winStreak = 0; }
  const own = S.partner && S.owned[S.partner];
  if (own) own.rounds = (own.rounds || 0) + 1;
  addXp(Math.max(1, Math.round(wagered / 10)));
  saveSoon();

  // ---- feedback ----
  const isBig = !noBig && win && mult >= 10 && (net >= 1000 || mult >= 50);
  if (!quiet) {
    if (win) {
      if (anchor) {
        floatAt(anchor, `+${fmt(net)}`, 'win');
        coinFly(anchor, Math.ceil(Math.log2(Math.max(2, mult)) * 4));
        if (mult >= 3) burstAt(anchor, { n: 40 });
      }
      if (bonus > 0) setTimeout(() => toast(`Partner perk bonus: +${coins(bonus)}`, { type: 'gold', icon: '✦', duration: 2200 }), 400);
      if (!isBig) sfx('win');
      if (isBig) bigWin(net, mult);
      react(isBig ? 'bigwin' : 'win', { chance: isBig ? 1 : 0.55 });
    } else if (push) {
      sfx('push');
      if (anchor) floatAt(anchor, 'PUSH', 'push');
      react('push', { chance: 0.4 });
    } else {
      sfx('lose');
      if (anchor) floatAt(anchor, `−${fmt(wagered - returned)}`, 'lose');
      if (cashback > 0) setTimeout(() => toast(`Cashback perk: +${coins(cashback)}`, { type: 'gold', icon: '✦', duration: 2000 }), 300);
      react(st.lossStreak >= 4 && st.lossStreak % 4 === 0 ? 'streak' : 'lose', { chance: st.lossStreak >= 4 ? 1 : 0.45 });
    }
  }
  playAffection(isBig);
  bus.emit('round', { game, wagered, returned, total, net, mult, win, push, bonus });
  return { total, net, mult, bonus, cashback, win, push };
}

export { fmtMult };
