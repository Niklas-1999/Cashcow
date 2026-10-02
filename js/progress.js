// Achievements and daily missions.
import { bus, todayKey, pick, shuffle, fmt } from './util.js';
import { S, earn, saveSoon, ownedIds } from './state.js';
import { WAIFUS, OUTFIT_LIST, ACCESSORY_LIST, affectionLevel, GAME_NAMES } from './waifu/data.js';
import { toast, coins } from './ui.js';
import { sfx } from './audio.js';

const anyAff = (lvl) => Object.values(S.owned).some((o) => affectionLevel(o.affection) >= lvl);

export const ACHIEVEMENTS = [
  { id: 'first_win', icon: '🌸', name: 'First Blossom', desc: 'Win your first round.', reward: 500, test: () => S.stats.wins >= 1 },
  { id: 'wins_100', icon: '🎯', name: 'Lucky Hundred', desc: 'Win 100 rounds.', reward: 5000, test: () => S.stats.wins >= 100 },
  { id: 'wins_1000', icon: '🏆', name: 'Thousand Victories', desc: 'Win 1,000 rounds.', reward: 25000, test: () => S.stats.wins >= 1000 },
  { id: 'rounds_500', icon: '🎲', name: 'Regular', desc: 'Play 500 rounds.', reward: 5000, test: () => S.stats.rounds >= 500 },
  { id: 'wager_100k', icon: '💰', name: 'Spender', desc: 'Wager 100,000 coins in total.', reward: 5000, test: () => S.stats.wagered >= 1e5 },
  { id: 'wager_1m', icon: '💎', name: 'High Roller', desc: 'Wager 1,000,000 coins in total.', reward: 25000, test: () => S.stats.wagered >= 1e6 },
  { id: 'wager_10m', icon: '👑', name: 'Whale', desc: 'Wager 10,000,000 coins in total.', reward: 100000, test: () => S.stats.wagered >= 1e7 },
  { id: 'mult_10', icon: '✨', name: 'Big Win', desc: 'Win at 10× or more.', reward: 2000, test: () => S.stats.bestMult >= 10 },
  { id: 'mult_50', icon: '🌟', name: 'Mega Win', desc: 'Win at 50× or more.', reward: 10000, test: () => S.stats.bestMult >= 50 },
  { id: 'mult_100', icon: '💫', name: 'Legendary Win', desc: 'Win at 100× or more.', reward: 25000, test: () => S.stats.bestMult >= 100 },
  { id: 'rich_100k', icon: '🏦', name: 'Six Figures', desc: 'Hold 100,000 coins at once.', reward: 5000, test: () => S.coins >= 1e5 },
  { id: 'rich_1m', icon: '🏯', name: 'Millionaire', desc: 'Hold 1,000,000 coins at once.', reward: 50000, test: () => S.coins >= 1e6 },
  { id: 'streak_5', icon: '🔥', name: 'On Fire', desc: 'Win 5 rounds in a row.', reward: 3000, test: () => S.stats.maxWinStreak >= 5 },
  { id: 'streak_10', icon: '☄️', name: 'Unstoppable', desc: 'Win 10 rounds in a row.', reward: 15000, test: () => S.stats.maxWinStreak >= 10 },
  { id: 'all_games', icon: '🎪', name: 'Casino Tourist', desc: 'Play every game at least once.', reward: 10000, test: () => Object.keys(GAME_NAMES).every((g) => S.stats.games[g]?.rounds > 0) },
  { id: 'collect_5', icon: '💞', name: 'Harem Beginnings', desc: 'Own 5 waifus.', reward: 3000, test: () => ownedIds().length >= 5 },
  { id: 'collect_15', icon: '💗', name: 'Popular', desc: 'Own 15 waifus.', reward: 15000, test: () => ownedIds().length >= 15 },
  { id: 'collect_all', icon: '💖', name: 'Gotta Love Them All', desc: 'Own every waifu.', reward: 200000, test: () => ownedIds().length >= WAIFUS.length },
  { id: 'first_ssr', icon: '🌠', name: 'Golden Light', desc: 'Pull an SSR waifu.', reward: 5000, test: () => ownedIds().some((id) => WAIFUS.find((w) => w.id === id)?.rarity === 'SSR') },
  { id: 'first_ur', icon: '🌈', name: 'Rainbow Miracle', desc: 'Pull a UR waifu.', reward: 20000, test: () => ownedIds().some((id) => WAIFUS.find((w) => w.id === id)?.rarity === 'UR') },
  { id: 'star_max', icon: '⭐', name: 'Fully Awakened', desc: 'Raise a waifu to 5 constellation stars.', reward: 20000, test: () => Object.values(S.owned).some((o) => o.stars >= 5) },
  { id: 'aff_friend', icon: '🩷', name: 'Friendship', desc: 'Reach Friend with any waifu.', reward: 1000, test: () => anyAff(2) },
  { id: 'aff_crush', icon: '💘', name: 'Doki Doki', desc: 'Reach Crush with any waifu.', reward: 5000, test: () => anyAff(4) },
  { id: 'aff_soulmate', icon: '💍', name: 'Soulmates', desc: 'Reach Soulmate with any waifu.', reward: 50000, test: () => anyAff(6) },
  { id: 'gift_10', icon: '🎁', name: 'Generous', desc: 'Give 10 gifts.', reward: 2000, test: () => S.stats.giftsGiven >= 10 },
  { id: 'gift_love', icon: '💝', name: 'Perfect Present', desc: 'Give a gift your partner loves.', reward: 500, ev: 'giftLove' },
  { id: 'pats_100', icon: '🖐️', name: 'Head Pat Expert', desc: 'Head-pat 100 times.', reward: 3000, test: () => S.stats.pats >= 100 },
  { id: 'outfit_1', icon: '👗', name: 'Fashionista', desc: 'Buy an outfit.', reward: 1000, test: () => S.outfits.length >= 1 },
  { id: 'outfit_all', icon: '👘', name: 'Full Wardrobe', desc: 'Own every purchasable outfit.', reward: 50000, test: () => OUTFIT_LIST.filter((o) => o.price > 0).every((o) => S.outfits.includes(o.id)) },
  { id: 'acc_5', icon: '🎀', name: 'Accessorised', desc: 'Own 5 accessories.', reward: 5000, test: () => S.accessories.length >= 5 },
  { id: 'daily_7', icon: '📅', name: 'Devoted', desc: 'Reach a 7-day login streak.', reward: 10000, test: () => S.daily.streak >= 7 },
  { id: 'level_10', icon: '🥇', name: 'Gold Member', desc: 'Reach player level 10.', reward: 5000, test: () => S.level >= 10 },
  { id: 'level_25', icon: '🎖️', name: 'Platinum Legend', desc: 'Reach player level 25.', reward: 25000, test: () => S.level >= 25 },
  { id: 'gacha_100', icon: '🔮', name: 'Gacha Addict', desc: 'Do 100 gacha pulls.', reward: 10000, test: () => S.gacha.pulls >= 100 },
  { id: 'bj_natural', icon: '🃏', name: 'Natural', desc: 'Get a natural blackjack.', reward: 1000, ev: 'blackjack' },
  { id: 'royal_flush', icon: '👑', name: 'Royal Flush', desc: 'Hit a royal flush in Video Poker.', reward: 50000, ev: 'royalflush' },
  { id: 'roulette_straight', icon: '🎡', name: 'Straight Up', desc: 'Win a single-number roulette bet.', reward: 3000, ev: 'straightup' },
  { id: 'mines_10', icon: '💣', name: 'Minesweeper', desc: 'Cash out Mines at 10× or more.', reward: 5000, ev: 'mines10' },
  { id: 'crash_10', icon: '🚀', name: 'To The Moon', desc: 'Cash out Love Rocket at 10× or more.', reward: 5000, ev: 'crash10' },
  { id: 'keno_7', icon: '🔢', name: 'Number Oracle', desc: 'Hit 7 or more numbers in Keno.', reward: 15000, ev: 'keno7' },
  { id: 'plinko_edge', icon: '🔻', name: 'Edge Lord', desc: 'Land a Plinko ball in an edge bucket.', reward: 5000, ev: 'plinkoEdge' },
  { id: 'free_spins', icon: '🎰', name: 'Free Spinner', desc: 'Trigger free spins in Sakura Slots.', reward: 2000, ev: 'freespins' },
  { id: 'hard_way', icon: '🎲', name: 'The Hard Way', desc: 'Win a point in Craps.', reward: 2000, ev: 'crapsPoint' },
  { id: 'bankrupt', icon: '🥲', name: 'Rock Bottom', desc: 'Go broke and get rescued by your partner.', reward: 500, test: () => S.stats.bankrupt >= 1 },
];

function unlock(a) {
  if (S.achievements[a.id]) return;
  S.achievements[a.id] = Date.now();
  earn(a.reward);
  saveSoon();
  sfx('levelup');
  toast(`<div class="ach-toast"><b>Achievement unlocked!</b><br>${a.icon} ${a.name} <span class="muted">· +${coins(a.reward)}</span></div>`, { type: 'gold', icon: '🏆', duration: 4500 });
  bus.emit('achievement', a.id);
}

function checkAll() {
  for (const a of ACHIEVEMENTS) if (!S.achievements[a.id] && a.test && a.test()) unlock(a);
}

// ---------------- missions ----------------
const GAMES = Object.keys(GAME_NAMES);
const MISSION_POOL = [
  () => ({ type: 'rounds', n: 25, reward: 1500, text: 'Play 25 rounds of any game' }),
  () => ({ type: 'wins', n: 10, reward: 2000, text: 'Win 10 rounds' }),
  () => { const g = pick(GAMES); return { type: 'game', game: g, n: 10, reward: 1500, text: `Play 10 rounds of ${GAME_NAMES[g]}` }; },
  () => { const n = pick([10000, 25000]); return { type: 'wager', n, reward: n === 10000 ? 1500 : 3000, text: `Wager ${fmt(n)} coins in total` }; },
  () => ({ type: 'mult', n: 1, m: 5, reward: 2500, text: 'Win a round at 5× or more' }),
  () => ({ type: 'gift', n: 1, reward: 1000, text: 'Give your partner a gift' }),
  () => ({ type: 'pat', n: 5, reward: 800, text: 'Head-pat your partner 5 times' }),
  () => ({ type: 'gacha', n: 1, reward: 1500, text: 'Do a gacha pull' }),
  () => ({ type: 'variety', n: 3, reward: 2000, text: 'Play 3 different games', seen: [] }),
  () => ({ type: 'profit', n: 3000, reward: 2500, text: 'Win 3,000 coins of profit (total)' }),
];

export function ensureMissions() {
  const today = todayKey();
  if (S.missions.day === today && S.missions.list.length) return;
  const picks = shuffle(MISSION_POOL.map((f, i) => i)).slice(0, 3);
  S.missions = { day: today, list: picks.map((i) => ({ ...MISSION_POOL[i](), p: 0, claimed: false })) };
  saveSoon();
}

function progress(type, amt = 1, extra) {
  ensureMissions();
  let changed = false;
  for (const m of S.missions.list) {
    if (m.claimed || m.p >= m.n || m.type !== type) continue;
    if (type === 'game' && extra !== m.game) continue;
    if (type === 'variety') {
      if (m.seen.includes(extra)) continue;
      m.seen.push(extra);
    }
    m.p = Math.min(m.n, m.p + amt);
    changed = true;
    if (m.p >= m.n) {
      toast(`Mission complete: <b>${m.text}</b><br><span class="muted">Claim your reward on the Daily page.</span>`, { icon: '📜', type: 'success' });
      sfx('gem');
    }
  }
  if (changed) { saveSoon(); bus.emit('missions'); }
}

export function claimMission(i) {
  const m = S.missions.list[i];
  if (!m || m.claimed || m.p < m.n) return false;
  m.claimed = true;
  earn(m.reward);
  saveSoon();
  bus.emit('missions');
  return m.reward;
}
export const missionsReady = () => (S.missions.list || []).filter((m) => !m.claimed && m.p >= m.n).length;

export function initProgress() {
  ensureMissions();
  bus.on('round', (r) => {
    progress('rounds');
    if (r.win) progress('wins');
    progress('game', 1, r.game);
    progress('wager', r.wagered);
    if (r.win && r.mult >= 5) progress('mult');
    progress('variety', 1, r.game);
    if (r.net > 0) progress('profit', r.net);
    checkAll();
  });
  bus.on('gift', (g) => { progress('gift'); if (g.love) unlock(ACHIEVEMENTS.find((a) => a.id === 'gift_love')); checkAll(); });
  bus.on('pat', () => { progress('pat'); checkAll(); });
  bus.on('gacha', (n) => { progress('gacha', n); checkAll(); });
  bus.on('special', (s) => {
    const a = ACHIEVEMENTS.find((x) => x.ev === s.type);
    if (a) unlock(a);
  });
  ['collection', 'affection', 'buy', 'daily', 'levelup', 'rescue'].forEach((ev) => bus.on(ev, () => setTimeout(checkAll, 50)));
  bus.on('coins', () => { if (S.coins >= 1e5) checkAll(); });
  setTimeout(checkAll, 1500);
}
