// Waifu roster, outfits, accessories, gifts, affection tiers.

export const RARITY = {
  R: { name: 'Rare', stars: 3, color: '#6fb6ff', glow: '#3d8bff', dupeRefund: 300 },
  SR: { name: 'Super Rare', stars: 4, color: '#c77dff', glow: '#9d4dff', dupeRefund: 1200 },
  SSR: { name: 'Super Super Rare', stars: 5, color: '#ffcf4d', glow: '#ffae00', dupeRefund: 6000 },
  UR: { name: 'Ultra Rare', stars: 6, color: '#ff6fd8', glow: '#ff3ec9', dupeRefund: 25000 },
};
export const RARITY_ORDER = ['R', 'SR', 'SSR', 'UR'];

export const PERSONALITIES = {
  genki: 'Genki', dandere: 'Dandere', kuudere: 'Kuudere', tsundere: 'Tsundere', gyaru: 'Gyaru',
  sleepy: 'Sleepyhead', oneesan: 'Onee-san', chuuni: 'Chuunibyou', deredere: 'Deredere',
  ojou: 'Ojou-sama', yandere: 'Yandere', gambler: 'Gambler',
};

export const GAME_NAMES = {
  slots: 'Sakura Slots', blackjack: 'Blackjack', roulette: 'Roulette', poker: 'Video Poker', baccarat: 'Baccarat',
  craps: 'Craps', plinko: 'Plinko', mines: 'Mines', crash: 'Love Rocket', wheel: 'Fortune Wheel', hilo: 'Hi-Lo',
  keno: 'Keno', scratch: 'Scratch Cards', dice: 'Dice',
};

// perk types: win (game bonus % on profit), allwin, cashback (% of losses back), daily (% bonus),
// gacha (% discount), shop (% discount), affection (% more affection from gifts)
export function perkText(p, val) {
  const v = (val ?? p.v).toFixed(1).replace(/\.0$/, '');
  switch (p.type) {
    case 'win': return `+${v}% winnings in ${GAME_NAMES[p.game]}`;
    case 'allwin': return `+${v}% winnings in every game`;
    case 'cashback': return `${v}% cashback on losses`;
    case 'daily': return `+${v}% daily login bonus`;
    case 'gacha': return `${v}% off gacha pulls`;
    case 'shop': return `${v}% off shop items`;
    case 'affection': return `+${v}% affection from gifts`;
  }
  return '';
}

const W = (o) => o;
export const WAIFUS = [
  // ---------------- R ----------------
  W({ id: 'hana', name: 'Hana Sakuragi', title: 'Sunny Sakura', rarity: 'R', personality: 'genki', skin: 'fair', eyes: '#3fbf7f', hair: { color: '#ff9ec7', back: 'twintails', bangs: 'blunt', locks: 'short' }, outfit: 'sailor', palette: { main: '#2c3e8c', accent: '#ff4f7b', trim: '#ffd1e0' }, fang: true, likes: ['sweets', 'cute'], dislikes: ['books'], perk: { type: 'win', game: 'slots', v: 3 }, bio: 'An endlessly upbeat first-year who believes every spin is THE lucky one. She practices victory poses in the mirror.' , secrets: ['She keeps a scrapbook of every jackpot she has ever seen.', 'Her twin tails are tied with ribbons her grandma sewed.', 'She once cried for an hour because a slot machine was "lonely".'] }),
  W({ id: 'mio', name: 'Mio Aoyama', title: 'Quiet Bookmark', rarity: 'R', personality: 'dandere', skin: 'pale', eyes: '#5a7bd8', hair: { color: '#5b7fd1', back: 'bob', bangs: 'hime', locks: 'hime' }, traits: ['glasses'], outfit: 'blazer', palette: { main: '#3a3f6b', accent: '#5aa0ff', trim: '#cfe0ff' }, likes: ['books', 'tea'], dislikes: ['games'], perk: { type: 'daily', v: 10 }, bio: 'The library committee president. Speaks in whispers, but secretly calculates house edges in her head.', secrets: ['She has memorised a full basic-strategy chart.', 'Her favourite novel is a romance she would never admit to reading.', 'She practises saying "good morning" to you every day.'] }),
  W({ id: 'rin', name: 'Rin Kurosawa', title: 'Cold Black Lily', rarity: 'R', personality: 'kuudere', skin: 'pale', eyes: '#d23a52', hair: { color: '#2a2433', back: 'hime', bangs: 'hime', locks: 'hime' }, outfit: 'blazer', palette: { main: '#1d1b2b', accent: '#c4243c', trim: '#f2d0d6' }, likes: ['tea', 'flowers'], dislikes: ['sweets'], perk: { type: 'win', game: 'blackjack', v: 3 }, bio: 'Calm, analytical, and terrifyingly good at counting cards. She shows emotion roughly once per lunar cycle.', secrets: ['She smiles when she thinks nobody is looking.', 'Her lily hairpin was a gift from her late mother.', 'She practises card tricks to calm down.'] }),
  W({ id: 'natsu', name: 'Natsu Hinata', title: 'Summer Sprinter', rarity: 'R', personality: 'genki', skin: 'tan', eyes: '#ff8a2a', hair: { color: '#ff8f3a', back: 'short', bangs: 'messy', locks: 'short' }, outfit: 'hoodie', palette: { main: '#ff7a3a', accent: '#2bc4ff', trim: '#fff1d8' }, fang: true, likes: ['food', 'games'], dislikes: ['fancy'], perk: { type: 'win', game: 'plinko', v: 3 }, bio: 'Track club ace who treats every Plinko ball like a relay baton. Has never once walked anywhere.', secrets: ['She holds the school record for the 100m dash.', 'She is scared of thunderstorms.', 'She wants to run a marathon together with you.'] }),
  W({ id: 'yuzu', name: 'Yuzu Kobayashi', title: 'Glitter Gyaru', rarity: 'R', personality: 'gyaru', skin: 'tan', eyes: '#c27b2f', hair: { color: '#ffd76a', back: 'wavy', bangs: 'swept', locks: 'long' }, traits: ['starClips'], outfit: 'sweater', palette: { main: '#ffb7d0', accent: '#ff5ca8', trim: '#fff' }, likes: ['fancy', 'sweets'], dislikes: ['weapons'], perk: { type: 'shop', v: 5 }, bio: 'Fashion-obsessed and fabulous. Knows every sale in the city and will absolutely get you a discount.', secrets: ['Her nails take two hours every weekend.', 'She is secretly a straight-A student.', 'She designed her own outfit line in middle school.'] }),
  W({ id: 'momo', name: 'Momo Fujiwara', title: 'Pillow Princess of Naps', rarity: 'R', personality: 'sleepy', skin: 'fair', eyes: '#d77fb4', hair: { color: '#ffc4dd', back: 'long', bangs: 'messy', locks: 'long' }, outfit: 'pajama', palette: { main: '#c7b8ff', accent: '#ff8fbf', trim: '#fff' }, likes: ['cozy', 'sweets'], dislikes: ['weapons'], perk: { type: 'cashback', v: 1 }, bio: 'Sleeps through most of the day and still somehow wins. Losses don\'t bother her — she was napping anyway.', secrets: ['She can fall asleep standing up.', 'She dreams in full colour about cake.', 'She stays awake on purpose when you visit.'] }),
  W({ id: 'kaede', name: 'Kaede Mori', title: 'Autumn Big Sister', rarity: 'R', personality: 'oneesan', skin: 'light', eyes: '#9a6b3f', hair: { color: '#8a5a3c', back: 'ponytail', bangs: 'parted', locks: 'medium' }, outfit: 'sundress', palette: { main: '#ffcf8a', accent: '#d9534f', trim: '#fff' }, likes: ['flowers', 'tea'], dislikes: ['games'], perk: { type: 'affection', v: 10 }, bio: 'Runs a café near the casino and keeps an eye on everyone. Will pat your head whether you win or lose.', secrets: ['She bakes a new cake every Sunday.', 'She keeps a photo of you in her apron pocket.', 'She was a champion kendo player.'] }),
  W({ id: 'chiyo', name: 'Chiyo Takahashi', title: 'Crimson Spitfire', rarity: 'R', personality: 'tsundere', skin: 'fair', eyes: '#e0a13a', hair: { color: '#e8394f', back: 'sidetail', bangs: 'swept', locks: 'short' }, outfit: 'sailor', palette: { main: '#26232f', accent: '#ffcf3a', trim: '#ffe7a8' }, fang: true, likes: ['sweets', 'cute'], dislikes: ['books'], perk: { type: 'win', game: 'roulette', v: 3 }, bio: 'It\'s not like she wants to watch you play roulette or anything. She just happens to be standing there. Every day.', secrets: ['She practises compliments in her diary.', 'She has a stuffed bear named "Not-Your-Business".', 'She always bets on red because it matches her hair.'] }),
  W({ id: 'sora', name: 'Sora Amane', title: 'Dark Flame Master', rarity: 'R', personality: 'chuuni', skin: 'pale', eyes: '#9b5cff', hair: { color: '#cfd3e6', back: 'short', bangs: 'messy', locks: 'medium' }, traits: ['eyepatch'], outfit: 'witch', palette: { main: '#4b2a7a', accent: '#c21e56', trim: '#ffd' }, likes: ['books', 'weapons'], dislikes: ['cute'], perk: { type: 'win', game: 'mines', v: 3 }, bio: 'Claims her sealed eye can see where the mines are. It cannot. Probably.', secrets: ['Her eyepatch is just a fashion accessory.', 'Her real name is "Sorako" and she hates it.', 'She writes epic poems about your gambling sessions.'] }),
  W({ id: 'nene', name: 'Nene Ishikawa', title: 'Diligent Maid', rarity: 'R', personality: 'deredere', skin: 'fair', eyes: '#c48a4f', hair: { color: '#c79a6a', back: 'buns', bangs: 'blunt', locks: 'short' }, outfit: 'maid', palette: { main: '#2a2338', accent: '#ff6f91', trim: '#fff' }, likes: ['tea', 'sweets'], dislikes: ['weapons'], perk: { type: 'affection', v: 15 }, bio: 'Welcome home, Master! Nene keeps your chips polished and your tea warm.', secrets: ['She practises latte art in secret.', 'She has a notebook full of your favourite things.', 'She once beat the dealer at poker and apologised to him.'] }),

  // ---------------- SR ----------------
  W({ id: 'luna', name: 'Luna Tsukimiya', title: 'Moonlit Silence', rarity: 'SR', personality: 'kuudere', skin: 'ghost', eyes: '#9f7bff', hair: { color: '#dfe3f5', back: 'long', bangs: 'blunt', locks: 'long' }, traits: ['moonPin'], outfit: 'gothic', palette: { main: '#1e1b2e', accent: '#7b5cff', trim: '#dcd3ff' }, likes: ['books', 'flowers'], dislikes: ['food'], perk: { type: 'win', game: 'crash', v: 5 }, bio: 'Only appears at night. She cashes out at exactly the right moment, every time, and never explains how.', secrets: ['She talks to the moon about you.', 'She is allergic to sunlight... or claims to be.', 'She keeps every chip you have ever handed her.'] }),
  W({ id: 'akane', name: 'Akane Hoshino', title: 'Center Stage Idol', rarity: 'SR', personality: 'genki', skin: 'fair', eyes: '#ff4f6d', hair: { color: '#ff5a6e', back: 'twintails', bangs: 'swept', locks: 'medium' }, traits: ['starClips'], outfit: 'idol', palette: { main: '#ffb3c6', accent: '#ff2e63', trim: '#fff' }, fang: true, likes: ['cute', 'sweets'], dislikes: ['books'], perk: { type: 'win', game: 'wheel', v: 5 }, bio: 'Top idol of the Cashcow Stage. Spins the Fortune Wheel during her concerts for luck.', secrets: ['She practises 6 hours a day.', 'Her first fan letter was from you.', 'She gets stage fright but hides it with a wink.'] }),
  W({ id: 'shizuku', name: 'Shizuku Mizuhara', title: 'Raindrop Poet', rarity: 'SR', personality: 'dandere', skin: 'pale', eyes: '#3fb6c7', hair: { color: '#6fd6d8', back: 'wavy', bangs: 'parted', locks: 'long' }, traits: ['flower'], outfit: 'kimono', palette: { main: '#3a8fb7', accent: '#1f4f7a', trim: '#e4f6ff' }, likes: ['tea', 'flowers'], dislikes: ['games'], perk: { type: 'win', game: 'keno', v: 5 }, bio: 'Writes haiku about every keno draw. They are surprisingly good.', secrets: ['She can predict rain by the smell.', 'She collects glass marbles.', 'She wrote a haiku about you. She will not show it.'] }),
  W({ id: 'kirara', name: 'Kirara Hoshizora', title: 'High Roller Gyaru', rarity: 'SR', personality: 'gyaru', skin: 'tan', eyes: '#ff7fd0', hair: { color: '#ffb0d8', back: 'sidetail', bangs: 'swept', locks: 'long' }, traits: ['bow'], outfit: 'dealer', palette: { main: '#222', accent: '#a0153e', trim: '#ffd' }, likes: ['fancy', 'games'], dislikes: ['books'], perk: { type: 'win', game: 'poker', v: 5 }, bio: 'Part-time dealer, full-time icon. Reads poker hands like gossip.', secrets: ['She has a perfect poker face — except around you.', 'She learnt cards from her grandpa.', 'She keeps your lucky chip in her phone case.'] }),
  W({ id: 'miyu', name: 'Miyu Nekomura', title: 'Lucky Cat', rarity: 'SR', personality: 'genki', skin: 'fair', eyes: '#ffc43a', hair: { color: '#f4f1ff', back: 'short', bangs: 'messy', locks: 'short' }, traits: ['catEars'], outfit: 'hoodie', palette: { main: '#ffd23a', accent: '#ff6f91', trim: '#fff' }, fang: true, likes: ['food', 'cute'], dislikes: ['tea'], perk: { type: 'win', game: 'scratch', v: 5 }, bio: 'A maneki-neko who wandered out of a shrine. Her claws are perfect for scratch cards. Nya!', secrets: ['She purrs when you scratch behind her ears.', 'She is 300 years old in cat years.', 'She hides fish snacks in your coat.'] }),
  W({ id: 'tsubaki', name: 'Tsubaki Kagura', title: 'Golden Ojou-sama', rarity: 'SR', personality: 'ojou', skin: 'fair', eyes: '#3b82f6', hair: { color: '#ffd45a', back: 'drills', bangs: 'parted', locks: 'none' }, outfit: 'princess', palette: { main: '#ffb3cf', accent: '#ff3e7f', trim: '#fff' }, likes: ['fancy', 'tea'], dislikes: ['food'], perk: { type: 'win', game: 'baccarat', v: 5 }, bio: 'Ohohoho! Heiress of the Kagura conglomerate. Baccarat is the only game worthy of her.', secrets: ['Her drills take 40 minutes to curl.', 'She has never touched a vending machine.', 'She secretly loves cheap convenience-store snacks.'] }),
  W({ id: 'ayame', name: 'Ayame Shinonome', title: 'Violet Blade', rarity: 'SR', personality: 'kuudere', skin: 'light', eyes: '#8a5cd6', hair: { color: '#5b3a8a', back: 'ponytail', bangs: 'swept', locks: 'long' }, outfit: 'knight', palette: { main: '#5b2a8a', accent: '#c9a2ff', trim: '#fff' }, likes: ['weapons', 'tea'], dislikes: ['sweets'], perk: { type: 'win', game: 'hilo', v: 5 }, bio: 'A knight-errant sworn to protect your bankroll. Higher or lower? Her blade decides.', secrets: ['She names all her swords.', 'She sleeps with a plushie she will never admit to owning.', 'She has sworn an oath to you. Literally.'] }),
  W({ id: 'ruri', name: 'Ruri Kitsune', title: 'Shrine Fox', rarity: 'SR', personality: 'oneesan', skin: 'fair', eyes: '#ffb03a', hair: { color: '#ff9a3c', back: 'long', bangs: 'parted', locks: 'long' }, traits: ['foxEars'], outfit: 'miko', palette: { main: '#fff', accent: '#d8263f', trim: '#ffd' }, likes: ['food', 'flowers'], dislikes: ['weapons'], perk: { type: 'gacha', v: 5 }, bio: 'A nine-tailed fox spirit who guards the gacha shrine. Offer fried tofu and she might bless your pulls.', secrets: ['She is actually 900 years old.', 'She can turn into a tiny fox.', 'Her blessings work better on people she likes.'] }),
  W({ id: 'hikari', name: 'Hikari Asahi', title: 'Dawn Tsundere', rarity: 'SR', personality: 'tsundere', skin: 'fair', eyes: '#ff9f43', hair: { color: '#ffcd45', back: 'ponytail', bangs: 'blunt', locks: 'medium' }, outfit: 'blazer', palette: { main: '#c0392b', accent: '#ffd23a', trim: '#fff' }, fang: true, likes: ['sweets', 'games'], dislikes: ['books'], perk: { type: 'win', game: 'dice', v: 5 }, bio: 'Student council vice president. Rolls dice to make decisions and refuses to admit it.', secrets: ['She has a crush on... no! Nobody!', 'She is terrible at cooking but tries anyway.', 'She keeps the dice you gave her in her pocket.'] }),
  W({ id: 'ema', name: 'Ema Kurenai', title: 'Devoted Crimson', rarity: 'SR', personality: 'yandere', skin: 'pale', eyes: '#ff2d55', hair: { color: '#8e1b34', back: 'long', bangs: 'blunt', locks: 'long' }, outfit: 'maid', palette: { main: '#2a2338', accent: '#ff2d55', trim: '#fff' }, likes: ['cute', 'flowers'], dislikes: ['fancy'], perk: { type: 'cashback', v: 3 }, bio: 'Sweet, attentive, and VERY committed. She will make sure you never lose too much. She is always watching. Lovingly.', secrets: ['She knows your schedule better than you do.', 'She hand-writes you a letter every day but never sends them.', 'She only smiles like that for you.'] }),

  // ---------------- SSR ----------------
  W({ id: 'seraphina', name: 'Seraphina', title: 'Angel of Fortune', rarity: 'SSR', personality: 'deredere', skin: 'pale', eyes: '#4fc3ff', hair: { color: '#fff1c4', back: 'wavy', bangs: 'parted', locks: 'long' }, traits: ['halo', 'angelWings'], outfit: 'princess', palette: { main: '#e9f3ff', accent: '#7ab8ff', trim: '#fff' }, likes: ['flowers', 'sweets'], dislikes: ['weapons'], perk: { type: 'daily', v: 50 }, bio: 'Descended from heaven to spread luck — and she decided you need the most of it.', secrets: ['Her halo dims when she is sad.', 'She lost a feather the day she met you and kept it.', 'She is not allowed to gamble, technically.'] }),
  W({ id: 'lilith', name: 'Lilith Nightshade', title: 'Demon Princess', rarity: 'SSR', personality: 'ojou', skin: 'pale', eyes: '#ff3b8d', hair: { color: '#4a2a6e', back: 'long', bangs: 'swept', locks: 'long' }, traits: ['horns', 'demonWings'], outfit: 'gothic', palette: { main: '#1b1024', accent: '#c2185b', trim: '#ffd6f0' }, fang: true, likes: ['fancy', 'sweets'], dislikes: ['flowers'], perk: { type: 'allwin', v: 3 }, bio: 'Heiress to the underworld casino empire. She made a contract with you. The fine print is... affectionate.', secrets: ['She is terrified of puppies.', 'Her wings get bigger when she is happy.', 'She signed the contract in heart-shaped ink.'] }),
  W({ id: 'elaria', name: 'Elaria Silverleaf', title: 'Elven Archer', rarity: 'SSR', personality: 'oneesan', skin: 'fair', eyes: '#4bd18f', hair: { color: '#9be6b4', back: 'long', bangs: 'parted', locks: 'long' }, traits: ['elfEars', 'flower'], outfit: 'knight', palette: { main: '#2f7a52', accent: '#f6d06a', trim: '#fff' }, likes: ['flowers', 'tea'], dislikes: ['food'], perk: { type: 'allwin', v: 2 }, bio: 'A 600-year-old elf who wandered into the casino and has not left since. "Just one more spin, child."', secrets: ['She has seen the rise and fall of three kingdoms.', 'She still cannot use a smartphone.', 'She finds you endearing, like a sapling.'] }),
  W({ id: 'meilin', name: 'Mei Lin', title: 'Dragon Fortune', rarity: 'SSR', personality: 'genki', skin: 'light', eyes: '#e0405a', hair: { color: '#1f1a2a', back: 'buns', bangs: 'blunt', locks: 'medium' }, outfit: 'qipao', palette: { main: '#d7263d', accent: '#ffd23a', trim: '#ffe0a8' }, fang: true, likes: ['food', 'weapons'], dislikes: ['books'], perk: { type: 'win', game: 'slots', v: 8 }, bio: 'Kung-fu prodigy and lucky-number fanatic. Every 8 that lands on the reels makes her do a backflip.', secrets: ['She can break a brick with one finger.', 'She eats twelve dumplings for breakfast.', 'Her lucky number is the date you met.'] }),
  W({ id: 'yuki', name: 'Yuki Shirayuki', title: 'Snow Maiden', rarity: 'SSR', personality: 'kuudere', skin: 'ghost', eyes: '#7fd3ff', hair: { color: '#bfe6ff', back: 'hime', bangs: 'hime', locks: 'hime' }, traits: ['sakuraPin'], outfit: 'sweater', palette: { main: '#e8f4ff', accent: '#5bb7ff', trim: '#fff' }, likes: ['sweets', 'tea'], dislikes: ['food'], perk: { type: 'win', game: 'blackjack', v: 8 }, bio: 'A yuki-onna with an ice-cold poker face. The dealer sweats when she sits down.', secrets: ['She loves hot chocolate even though it melts her a little.', 'She builds tiny snowmen of you.', 'Her hands are always cold — hold them?'] }),
  W({ id: 'aria', name: 'Aria Melody', title: 'Virtual Diva', rarity: 'SSR', personality: 'deredere', skin: 'pale', eyes: '#56f0d2', hair: { color: '#b48cff', back: 'twintails', bangs: 'blunt', locks: 'long' }, traits: ['headphones'], outfit: 'cyber', palette: { main: '#7a5cff', accent: '#3dfcd2', trim: '#fff' }, likes: ['games', 'cute'], dislikes: ['weapons'], perk: { type: 'affection', v: 30 }, bio: 'A virtual idol who escaped her concert stream to cheer for you in person. Her voice synthesizes pure serotonin.', secrets: ['She runs on 99% love and 1% electricity.', 'She composed a song about you (track 7).', 'She sometimes glitches when flustered.'] }),
  W({ id: 'kuroha', name: 'Kuroha', title: 'The Degenerate Gambler', rarity: 'SSR', personality: 'gambler', skin: 'pale', eyes: '#ff3b3b', hair: { color: '#1b1820', back: 'long', bangs: 'messy', locks: 'long' }, outfit: 'dealer', palette: { main: '#111', accent: '#7a0f1f', trim: '#ffd' }, fang: true, likes: ['games', 'food'], dislikes: ['flowers'], perk: { type: 'win', game: 'crash', v: 8 }, bio: 'Lives for the thrill. Bet it all? She already did. Twice. Her eyes glow red when the stakes rise.', secrets: ['She has never once quit while ahead.', 'She actually keeps a secret savings account for you.', 'She gets nervous at low stakes. Weird.'] }),
  W({ id: 'rosalind', name: 'Rosalind Victoria', title: 'Rose Queen', rarity: 'SSR', personality: 'ojou', skin: 'fair', eyes: '#c2185b', hair: { color: '#ff6f9f', back: 'drills', bangs: 'swept', locks: 'none' }, traits: ['crown'], outfit: 'princess', palette: { main: '#c2185b', accent: '#ffd23a', trim: '#fff' }, likes: ['fancy', 'flowers'], dislikes: ['games'], perk: { type: 'shop', v: 15 }, bio: 'Queen of a small, extremely wealthy rose-kingdom. She owns the boutique, so naturally you get a discount.', secrets: ['She grows 400 varieties of roses.', 'She has never lost an argument.', 'She named a rose after you.'] }),

  // ---------------- UR ----------------
  W({ id: 'sol', name: 'Amaterasu "Sol"', title: 'Sun Goddess', rarity: 'UR', personality: 'oneesan', skin: 'light', eyes: '#ff8a00', hair: { color: '#ffb347', back: 'wavy', bangs: 'parted', locks: 'long' }, traits: ['halo', 'crown'], outfit: 'kimono', palette: { main: '#ff7a2f', accent: '#b5122c', trim: '#ffe28a' }, likes: ['food', 'fancy'], dislikes: ['cozy'], perk: { type: 'allwin', v: 6 }, bio: 'The sun herself, on vacation. Every coin she touches shines a little brighter.', secrets: ['She can make it sunny on demand.', 'She has a soft spot for mortals who never give up.', 'She hid in a cave once because she was embarrassed. It caused an eclipse.'] }),
  W({ id: 'nyx', name: 'Nyx', title: 'Goddess of Night', rarity: 'UR', personality: 'kuudere', skin: 'ghost', eyes: '#c6a8ff', hair: { color: '#2c2f7a', back: 'long', bangs: 'blunt', locks: 'long' }, traits: ['starClips', 'moonPin'], outfit: 'witch', palette: { main: '#3a2f8a', accent: '#9d7bff', trim: '#e6dcff' }, likes: ['books', 'sweets'], dislikes: ['food'], perk: { type: 'cashback', v: 8 }, bio: 'Primordial night goddess. Losses simply vanish into her starry hair. She finds your luck fascinating.', secrets: ['Her hair contains actual stars.', 'She is older than time but younger at heart.', 'She dims the lights when she is shy.'] }),
  W({ id: 'sakura', name: 'Sakura-hime', title: 'Princess of Fortune', rarity: 'UR', personality: 'deredere', skin: 'fair', eyes: '#ffc12e', hair: { color: '#ff8cc6', back: 'wavy', bangs: 'swept', locks: 'long' }, traits: ['bunnyEars', 'sakuraPin'], outfit: 'dealer', palette: { main: '#2a1530', accent: '#ff3e9a', trim: '#ffd' }, fang: true, likes: ['sweets', 'flowers'], dislikes: ['weapons'], perk: { type: 'gacha', v: 20 }, bio: 'The legendary mascot of Cashcow Casino. They say whoever wins her heart will never run out of luck.', secrets: ['She founded the casino with a single coin.', 'Her bunny ears twitch when a jackpot is near.', 'She has been waiting for you specifically.'] }),
  W({ id: 'freya', name: 'Freya', title: 'Valkyrie of Victory', rarity: 'UR', personality: 'tsundere', skin: 'fair', eyes: '#3ba7ff', hair: { color: '#f2f0ff', back: 'ponytail', bangs: 'swept', locks: 'long' }, traits: ['angelWings'], outfit: 'knight', palette: { main: '#2050a8', accent: '#ffd23a', trim: '#fff' }, likes: ['weapons', 'food'], dislikes: ['cute'], perk: { type: 'allwin', v: 5 }, bio: 'Chooser of the slain — and of the lucky. She chose you. Don\'t make it weird.', secrets: ['She has a cat named Thunder.', 'She brought you to Valhalla once. You were asleep.', 'She writes your name on her shield.'] }),
];

export const WAIFU_BY_ID = Object.fromEntries(WAIFUS.map((w) => [w.id, w]));

export const STARTERS = ['hana', 'mio', 'chiyo'];

// ---------------- outfits ----------------
export const OUTFIT_LIST = [
  { id: 'sailor', name: 'Sailor Uniform', price: 3000, desc: 'Classic seifuku with a crisp scarf.' },
  { id: 'blazer', name: 'Academy Blazer', price: 3500, desc: 'Prestigious academy blazer with ribbon.' },
  { id: 'hoodie', name: 'Comfy Hoodie', price: 2500, desc: 'Oversized and cosy, drawstrings included.' },
  { id: 'sweater', name: 'Cable-Knit Turtleneck', price: 4000, desc: 'Warm winter knit, perfect for snow days.' },
  { id: 'sundress', name: 'Summer Sundress', price: 5000, desc: 'Floral dress with a straw hat.' },
  { id: 'pajama', name: 'Polka Pajamas', price: 3000, desc: 'Sleepy-time pajamas and nightcap.' },
  { id: 'maid', name: 'Maid Uniform', price: 8000, desc: 'Frilly apron and headdress. Welcome home!' },
  { id: 'dealer', name: 'Casino Dealer', price: 8000, desc: 'Vest, bow-tie and gold buttons.' },
  { id: 'miko', name: 'Shrine Maiden', price: 9000, desc: 'Traditional miko robes with red hakama.' },
  { id: 'kimono', name: 'Sakura Kimono', price: 12000, desc: 'Silk kimono with a golden obi.' },
  { id: 'qipao', name: 'Silk Qipao', price: 12000, desc: 'High-collar qipao with peony embroidery.' },
  { id: 'idol', name: 'Idol Stage Outfit', price: 15000, desc: 'Puffy sleeves, giant bow, star power.' },
  { id: 'witch', name: 'Starlight Witch', price: 15000, desc: 'Robe, brooch and an enormous hat.' },
  { id: 'gothic', name: 'Gothic Lolita', price: 18000, desc: 'Lace, corset ribbons and a cameo choker.' },
  { id: 'cyber', name: 'Neon Techwear', price: 20000, desc: 'Glowing cyberpunk jacket and comm-link.' },
  { id: 'knight', name: 'Valiant Armor', price: 25000, desc: 'Polished plate armour with a royal cape.' },
  { id: 'princess', name: 'Royal Ball Gown', price: 30000, desc: 'Puff sleeves, lace and a tiara.' },
  { id: 'bride', name: 'Soulmate Gown', price: 0, desc: 'Unlocks for a waifu who reaches Soulmate affection.', affection: 6 },
];
export const OUTFIT_BY_ID = Object.fromEntries(OUTFIT_LIST.map((o) => [o.id, o]));

export const ACCESSORY_LIST = [
  { id: 'bow', name: 'Big Ribbon', price: 1500 },
  { id: 'flower', name: 'Sakura Hair Flowers', price: 1500 },
  { id: 'sakuraPin', name: 'Blossom Pins', price: 1200 },
  { id: 'starClips', name: 'Star Clips', price: 1800 },
  { id: 'moonPin', name: 'Crescent Pin', price: 2000 },
  { id: 'glasses', name: 'Round Glasses', price: 2500 },
  { id: 'beret', name: 'Artist Beret', price: 3500 },
  { id: 'headphones', name: 'Studio Headphones', price: 4500 },
  { id: 'catEars', name: 'Cat Ears', price: 6000 },
  { id: 'foxEars', name: 'Fox Ears', price: 7000 },
  { id: 'bunnyEars', name: 'Bunny Ears', price: 7000 },
  { id: 'eyepatch', name: 'Chuuni Eyepatch', price: 3000 },
  { id: 'crown', name: 'Little Crown', price: 15000 },
  { id: 'horns', name: 'Demon Horns', price: 12000 },
  { id: 'halo', name: 'Angel Halo', price: 20000 },
  { id: 'angelWings', name: 'Angel Wings', price: 35000 },
  { id: 'demonWings', name: 'Demon Wings', price: 35000 },
];
export const ACCESSORY_BY_ID = Object.fromEntries(ACCESSORY_LIST.map((o) => [o.id, o]));

// ---------------- gifts ----------------
export const GIFTS = [
  { id: 'coffee', name: 'Canned Coffee', icon: '☕', price: 150, aff: 3, tag: 'food' },
  { id: 'dango', name: 'Hanami Dango', icon: '🍡', price: 200, aff: 4, tag: 'sweets' },
  { id: 'fish', name: 'Premium Tuna', icon: '🐟', price: 300, aff: 6, tag: 'food' },
  { id: 'choco', name: 'Chocolate Box', icon: '🍫', price: 400, aff: 8, tag: 'sweets' },
  { id: 'capsule', name: 'Capsule Toy', icon: '🎁', price: 450, aff: 8, tag: 'cute' },
  { id: 'tea', name: 'Ceremonial Matcha', icon: '🍵', price: 600, aff: 10, tag: 'tea' },
  { id: 'flower', name: 'Sakura Bouquet', icon: '💐', price: 700, aff: 12, tag: 'flowers' },
  { id: 'pillow', name: 'Fluffy Pillow', icon: '🛏️', price: 800, aff: 12, tag: 'cozy' },
  { id: 'cake', name: 'Strawberry Shortcake', icon: '🍰', price: 1000, aff: 16, tag: 'sweets' },
  { id: 'book', name: 'Leather Grimoire', icon: '📕', price: 1000, aff: 16, tag: 'books' },
  { id: 'plush', name: 'Giant Bear Plush', icon: '🧸', price: 1500, aff: 22, tag: 'cute' },
  { id: 'console', name: 'Handheld Console', icon: '🎮', price: 4000, aff: 45, tag: 'games' },
  { id: 'sword', name: 'Polished Katana', icon: '🗡️', price: 4500, aff: 45, tag: 'weapons' },
  { id: 'perfume', name: 'Rose Perfume', icon: '🌹', price: 3000, aff: 35, tag: 'fancy' },
  { id: 'feast', name: 'Royal Feast', icon: '🍱', price: 2500, aff: 30, tag: 'food' },
  { id: 'necklace', name: 'Diamond Necklace', icon: '💎', price: 12000, aff: 120, tag: 'fancy' },
  { id: 'ring', name: 'Promise Ring', icon: '💍', price: 50000, aff: 320, tag: 'special' },
];
export const GIFT_BY_ID = Object.fromEntries(GIFTS.map((g) => [g.id, g]));

export const AFFECTION_LEVELS = [
  { min: 0, name: 'Stranger', icon: '🤍' },
  { min: 40, name: 'Acquaintance', icon: '🩷' },
  { min: 120, name: 'Friend', icon: '💗' },
  { min: 250, name: 'Close Friend', icon: '💖' },
  { min: 420, name: 'Crush', icon: '💘' },
  { min: 650, name: 'Sweetheart', icon: '💞' },
  { min: 1000, name: 'Soulmate', icon: '💍' },
];
export const MAX_AFFECTION = 1000;

export function affectionLevel(aff) {
  let lvl = 0;
  AFFECTION_LEVELS.forEach((l, i) => { if (aff >= l.min) lvl = i; });
  return lvl;
}
