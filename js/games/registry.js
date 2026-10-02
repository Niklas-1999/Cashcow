export const GAMES = [
  { id: 'slots', name: 'Sakura Slots', cat: 'slots', desc: '5 reels, 10 paylines, wild waifus & free spins.', c1: '#ff7aa8', c2: '#8a0f45', tag: 'HOT' },
  { id: 'blackjack', name: 'Blackjack', cat: 'table', desc: 'Beat the dealer to 21. Split, double, 3:2 naturals.', c1: '#2bb673', c2: '#0b4a33' },
  { id: 'roulette', name: 'Roulette', cat: 'table', desc: 'European single-zero wheel with a full betting board.', c1: '#e2264d', c2: '#4a0a1a' },
  { id: 'poker', name: 'Video Poker', cat: 'table', desc: 'Jacks or Better, 9/6 full pay. Hunt the royal flush.', c1: '#3d7bff', c2: '#0e2560' },
  { id: 'baccarat', name: 'Baccarat', cat: 'table', desc: 'Player, Banker or Tie — the high-roller classic.', c1: '#c9a227', c2: '#4a3500' },
  { id: 'craps', name: 'Craps', cat: 'table', desc: 'Pass line, field and prop bets with real dice physics.', c1: '#18a058', c2: '#063a20' },
  { id: 'plinko', name: 'Plinko', cat: 'instant', desc: 'Drop balls through the pegs. Up to 1000×!', c1: '#ff7ccf', c2: '#5a1048', tag: 'NEW' },
  { id: 'mines', name: 'Mines', cat: 'instant', desc: 'Find gems, avoid bombs, cash out anytime.', c1: '#7b5cff', c2: '#22125a' },
  { id: 'crash', name: 'Love Rocket', cat: 'instant', desc: 'Ride the multiplier — cash out before it crashes.', c1: '#ff5c93', c2: '#3a0a2a', tag: 'HOT' },
  { id: 'wheel', name: 'Fortune Wheel', cat: 'slots', desc: 'Spin the wheel. Choose your risk level.', c1: '#ffd23a', c2: '#7a4a00' },
  { id: 'hilo', name: 'Hi-Lo', cat: 'instant', desc: 'Higher or lower? Build a streak multiplier.', c1: '#3dd6c4', c2: '#0b4a45' },
  { id: 'keno', name: 'Keno', cat: 'instant', desc: 'Pick up to 10 numbers and watch the draw.', c1: '#9d6bff', c2: '#2a1460' },
  { id: 'scratch', name: 'Scratch Cards', cat: 'slots', desc: 'Scratch the foil — match 3 to win.', c1: '#ff9a3c', c2: '#6a2a00' },
  { id: 'dice', name: 'Dice', cat: 'instant', desc: 'Roll over or under your target. You set the odds.', c1: '#6fe3ff', c2: '#0b3a5a' },
];
export const GAME_BY_ID = Object.fromEntries(GAMES.map((g) => [g.id, g]));
export const CATS = [
  { id: 'all', label: 'All Games' },
  { id: 'table', label: 'Table & Cards' },
  { id: 'slots', label: 'Slots & Wheels' },
  { id: 'instant', label: 'Instant Games' },
];
