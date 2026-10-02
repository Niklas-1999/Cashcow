// Pure slot math (no DOM) so it can be simulated for RTP.
export const SYMS = ['sakura', 'dango', 'bell', 'ribbon', 'star', 'gem', 'seven', 'wild', 'scatter'];
export const WEIGHTS = { sakura: 30, dango: 27, bell: 22, ribbon: 18, star: 13, gem: 9, seven: 6, wild: 3.2, scatter: 3 };
// pays in multiples of LINE bet for 3 / 4 / 5 of a kind
export const PAY = {
  sakura: [9, 22, 70], dango: [9, 26, 85], bell: [15, 42, 130], ribbon: [20, 60, 200],
  star: [30, 100, 320], gem: [50, 160, 600], seven: [80, 320, 1500], wild: [120, 600, 5000],
};
export const SCATTER = { 3: { spins: 5, pay: 2 }, 4: { spins: 10, pay: 10 }, 5: { spins: 15, pay: 50 } }; // pay × total bet
export const LINES = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 0, 1, 0],
];
export const NLINES = LINES.length;
export const FS_MULT = 2;

const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
export function randSym(rng = Math.random) {
  let r = rng() * total;
  for (const s of SYMS) { r -= WEIGHTS[s]; if (r <= 0) return s; }
  return 'sakura';
}
export function spinGrid(rng) {
  return Array.from({ length: 5 }, () => Array.from({ length: 3 }, () => randSym(rng)));
}

// returns { lines:[{li, sym, count, pay}], lineTotal (× line bet), scatters, scatterPos }
export function evaluate(grid) {
  const lines = [];
  let lineTotal = 0;
  LINES.forEach((ln, li) => {
    const s = ln.map((row, reel) => grid[reel][row]);
    // pure wild run
    let wr = 0;
    while (wr < 5 && s[wr] === 'wild') wr++;
    const target = s.find((x) => x !== 'wild');
    let best = { sym: 'wild', count: wr, pay: wr >= 3 ? PAY.wild[wr - 3] : 0 };
    if (target && target !== 'scatter') {
      let c = 0;
      while (c < 5 && (s[c] === target || s[c] === 'wild')) c++;
      const p = c >= 3 ? PAY[target][c - 3] : 0;
      if (p > best.pay) best = { sym: target, count: c, pay: p };
    }
    if (best.pay > 0) { lines.push({ li, ...best }); lineTotal += best.pay; }
  });
  const scatterPos = [];
  grid.forEach((col, reel) => col.forEach((s, row) => { if (s === 'scatter') scatterPos.push([reel, row]); }));
  return { lines, lineTotal, scatters: scatterPos.length, scatterPos };
}
