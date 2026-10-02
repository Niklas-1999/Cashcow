// Procedural anime character renderer (layered SVG bust portrait).
import { shade, shadow, mix } from '../util.js';
import { OUTFITS, ACCESSORIES, star4, star5, heart } from './parts.js';

let UID = 0;

export const SKINS = {
  pale: ['#fff4f2', '#f2cdd0'],
  fair: ['#fff0e6', '#f5c6b4'],
  light: ['#ffe5d4', '#efb79f'],
  tan: ['#f4c7a2', '#d79a74'],
  brown: ['#d9a07a', '#b07450'],
  dark: ['#a8714f', '#7d4e34'],
  ghost: ['#f1f3ff', '#c9cdf0'],
};

export const EXPRESSIONS = {
  neutral: { eyes: 'open', mouth: 'smile', blush: 0.35, brows: 'normal' },
  happy: { eyes: 'happy', mouth: 'grin', blush: 0.8, brows: 'up', fx: ['sparkle'] },
  excited: { eyes: 'star', mouth: 'grin', blush: 1, brows: 'up', fx: ['sparkle', 'hearts'] },
  love: { eyes: 'love', mouth: 'smile', blush: 1, brows: 'up', fx: ['hearts'] },
  sad: { eyes: 'sad', mouth: 'frown', blush: 0.25, brows: 'sad', fx: ['tear'] },
  cry: { eyes: 'cry', mouth: 'wail', blush: 0.6, brows: 'sad', fx: ['tears', 'gloom'] },
  surprised: { eyes: 'surprised', mouth: 'o', blush: 0.3, brows: 'up', fx: ['shock'] },
  shy: { eyes: 'aside', mouth: 'pout', blush: 1, brows: 'sad', fx: ['sweat'] },
  smug: { eyes: 'smug', mouth: 'smirk', blush: 0.3, brows: 'normal' },
  angry: { eyes: 'angry', mouth: 'pout', blush: 0.5, brows: 'angry', fx: ['anger'] },
  wink: { eyes: 'wink', mouth: 'cat', blush: 0.6, brows: 'up', fx: ['sparkle'] },
  sleepy: { eyes: 'sleepy', mouth: 'o', blush: 0.25, brows: 'normal', fx: ['zzz'] },
  determined: { eyes: 'angry', mouth: 'smirk', blush: 0.2, brows: 'angry', fx: ['sparkle'] },
};

const FACE = 'M 130 168 C 130 118, 162 98, 200 98 C 238 98, 270 118, 270 168 C 270 214, 262 248, 244 274 C 230 294, 214 308, 200 312 C 186 308, 170 294, 156 274 C 138 248, 130 214, 130 168 Z';
const CAP = 'M 114 214 C 102 128, 146 66, 200 64 C 254 66, 298 128, 286 214';

// fringe edges (right temple -> left temple); [x, y, isTip]
const BANGS = {
  blunt: [[272, 160, 0], [264, 200, 1], [248, 170, 0], [234, 198, 1], [218, 168, 0], [202, 200, 1], [186, 168, 0], [170, 198, 1], [154, 170, 0], [138, 200, 1], [128, 165, 0]],
  swept: [[276, 156, 0], [268, 192, 1], [254, 142, 0], [236, 198, 1], [226, 142, 0], [196, 208, 1], [190, 148, 0], [160, 214, 1], [156, 158, 0], [134, 210, 1], [126, 170, 0]],
  parted: [[276, 164, 0], [270, 224, 1], [256, 156, 0], [246, 204, 1], [236, 134, 0], [224, 172, 1], [210, 108, 0], [200, 100, 0], [190, 108, 0], [176, 172, 1], [164, 134, 0], [154, 204, 1], [144, 156, 0], [130, 224, 1], [124, 164, 0]],
  messy: [[278, 156, 0], [270, 206, 1], [258, 162, 0], [244, 192, 1], [236, 152, 0], [222, 208, 1], [212, 162, 0], [196, 196, 1], [186, 152, 0], [170, 210, 1], [160, 162, 0], [146, 192, 1], [138, 160, 0], [128, 202, 1], [124, 168, 0]],
  hime: [[276, 156, 0], [272, 194, 1], [258, 187, 0], [246, 195, 1], [232, 187, 0], [220, 195, 1], [206, 187, 0], [194, 195, 1], [180, 187, 0], [168, 195, 1], [154, 187, 0], [142, 195, 1], [128, 170, 0]],
};

function bangsPath(edge) {
  let d = CAP + ` L ${edge[0][0]} ${edge[0][1]}`;
  for (let i = 1; i < edge.length; i++) {
    const [x0, y0, t0] = edge[i - 1], [x1, y1, t1] = edge[i];
    if (t1) d += ` Q ${(x0 + (x1 - x0) * 0.85).toFixed(1)} ${(y0 + (y1 - y0) * 0.25).toFixed(1)} ${x1} ${y1}`;
    else if (t0) d += ` Q ${(x0 + (x1 - x0) * 0.15).toFixed(1)} ${(y1 + (y0 - y1) * 0.25).toFixed(1)} ${x1} ${y1}`;
    else d += ` Q ${(x0 + x1) / 2} ${(y0 + y1) / 2 - 6} ${x1} ${y1}`;
  }
  return d + ' Z';
}

const BACK = {
  long: 'M 200 64 C 128 64, 96 128, 96 210 C 96 300, 84 380, 62 486 Q 78 476 88 498 Q 102 474 118 494 Q 128 470 140 486 L 260 486 Q 272 470 282 494 Q 298 474 312 498 Q 322 476 338 486 C 316 380, 304 300, 304 210 C 304 128, 272 64, 200 64 Z',
  wavy: 'M 200 64 C 124 64, 92 130, 94 210 C 96 260, 78 292, 86 330 C 94 370, 64 400, 72 440 C 78 470, 54 482, 60 500 L 340 500 C 346 482, 322 470, 328 440 C 336 400, 306 370, 314 330 C 322 292, 304 260, 306 210 C 308 130, 276 64, 200 64 Z',
  hime: 'M 200 64 C 126 64, 98 130, 98 210 L 92 482 L 308 482 L 302 210 C 302 130, 274 64, 200 64 Z',
  bob: 'M 200 64 C 122 64, 100 140, 104 220 C 106 270, 102 300, 94 326 Q 112 324 120 312 Q 128 332 146 322 L 254 322 Q 272 332 280 312 Q 288 324 306 326 C 298 300, 294 270, 296 220 C 300 140, 278 64, 200 64 Z',
  short: 'M 200 64 C 120 64, 104 140, 110 220 C 112 250, 116 266, 124 282 L 276 282 C 284 266, 288 250, 290 220 C 296 140, 280 64, 200 64 Z',
  medium: 'M 200 64 C 124 64, 98 136, 100 216 C 102 290, 92 340, 84 392 Q 100 384 110 398 Q 122 380 136 392 L 264 392 Q 278 380 290 398 Q 300 384 316 392 C 308 340, 298 290, 300 216 C 302 136, 276 64, 200 64 Z',
};

const TAIL_L = 'M 128 112 C 70 120, 34 210, 40 310 C 44 380, 30 430, 24 488 Q 46 468 58 446 Q 64 476 82 492 C 82 430, 76 360, 92 290 C 104 236, 116 180, 140 130 Z';
const PONY = 'M 236 76 C 302 48, 354 120, 348 220 C 344 300, 360 360, 340 440 Q 328 410 312 404 Q 314 430 302 446 C 306 380, 302 300, 288 230 C 278 180, 264 130, 236 100 Z';

const LOCKS = { none: 0, short: 262, medium: 306, long: 384, hime: 300 };

function lockPath(len, hime) {
  if (hime) return `M 120 150 C 116 200, 114 250, 114 ${len} L 146 ${len} C 146 250, 146 200, 148 172 Z`;
  return `M 122 150 C 106 206, 102 ${len - 70}, 110 ${len} C 122 ${len - 44}, 130 ${len - 110}, 146 172 Z`;
}

function drill(x, H) {
  let s = `<path d="M ${x + 18} 170 C ${x + 6} 200, ${x} 230, ${x} 254" stroke="url(#${H.u}hair)" stroke-width="22" fill="none" stroke-linecap="round"/>`;
  for (let i = 0; i < 5; i++) {
    const cy = 264 + i * 34, rx = 28 - i * 3.6, ry = 21 - i * 1.2;
    s += `<ellipse cx="${x}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${H.u}hair)" stroke="${H.line}" stroke-width="1.6"/>
      <path d="M ${x - rx * 0.8} ${cy - 4} C ${x - rx * 0.3} ${cy + ry * 0.7}, ${x + rx * 0.4} ${cy + ry * 0.7}, ${x + rx * 0.85} ${cy + 2}" stroke="${H.dark}" stroke-width="1.6" fill="none" opacity=".6"/>
      <path d="M ${x - rx * 0.5} ${cy - ry * 0.55} Q ${x} ${cy - ry * 0.85} ${x + rx * 0.45} ${cy - ry * 0.5}" stroke="${H.shine}" stroke-width="2.4" fill="none" opacity=".7" stroke-linecap="round"/>`;
  }
  return s + `<path d="M ${x - 6} 424 L ${x} 446 L ${x + 6} 424 Z" fill="url(#${H.u}hair)" stroke="${H.line}" stroke-width="1.4"/>`;
}

function hairTie(x, y, c) {
  return `<circle cx="${x}" cy="${y}" r="10" fill="${c}" stroke="${shade(c, -0.5)}" stroke-width="1.4"/><circle cx="${x - 3}" cy="${y - 3}" r="3" fill="#fff" opacity=".6"/>`;
}

// --------------------------------------------------------------------------
// eyes
// --------------------------------------------------------------------------
const EYE_WHITE = 'M -24 -4 C -16 -20, 10 -22, 20 -6 C 23 4, 20 14, 13 20 C 2 26, -14 24, -20 14 C -24 8, -25 2, -24 -4 Z';

function eye(cx, cy, m, kind, E, u, idx) {
  const T = `translate(${cx} ${cy}) scale(${m * 1.1} 1.1)`;
  const id = `${u}e${idx}`;
  const lashC = E.lash;
  if (kind === 'closed') {
    return `<g transform="${T}"><path d="M -25 4 Q -4 -15 20 3" fill="none" stroke="${lashC}" stroke-width="4.6" stroke-linecap="round"/>
      <path d="M -25 4 L -32 0 M -22 0 L -28 -5" stroke="${lashC}" stroke-width="2.4" stroke-linecap="round"/></g>`;
  }
  if (kind === 'cry') {
    return `<g transform="${T}"><path d="M -20 -10 L 14 2 L -20 14" fill="none" stroke="${lashC}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }
  const lids = { sleepy: [4, 4], smug: [-4, 0], angry: [-16, -2], sad: [-4, -18] };
  const lid = lids[kind];
  const irisScale = kind === 'surprised' ? 0.78 : 1;
  const shift = kind === 'aside' ? 7 : 0;
  let pupil;
  if (kind === 'love') pupil = `<path d="${heart(0, 5, 9)}" fill="#ff3d7f" stroke="#fff" stroke-width="1.2"/>`;
  else if (kind === 'star') pupil = `<path d="${star5(0, 4, 10)}" fill="#fff6b8" stroke="${E.darkest}" stroke-width="1"/>`;
  else if (kind === 'surprised') pupil = `<ellipse cx="0" cy="4" rx="3.5" ry="5" fill="${E.darkest}"/>`;
  else pupil = `<ellipse cx="0" cy="4" rx="6.5" ry="9.5" fill="${E.darkest}"/>`;

  const hl = kind === 'star' || kind === 'love' ? '' : `
      <ellipse cx="${-5 * m}" cy="-5" rx="5.2" ry="7" fill="#fff"/>
      <circle cx="${6 * m}" cy="13" r="2.6" fill="#fff" opacity=".9"/>
      <circle cx="${8 * m}" cy="-7" r="1.5" fill="#fff"/>
      ${kind === 'sad' ? `<ellipse cx="${-1 * m}" cy="12" rx="7" ry="3" fill="#fff" opacity=".55"/>` : ''}`;

  let lidClip = '', lash;
  if (lid) {
    const [lo, li] = lid;
    lidClip = `<clipPath id="${id}l"><path d="M -40 ${lo} C -14 ${lo - 6}, 10 ${li - 6}, 34 ${li} L 34 40 L -40 40 Z"/></clipPath>`;
    lash = `<path d="M -29 ${lo + 1} C -14 ${lo - 6}, 10 ${li - 6}, 24 ${li + 1}" fill="none" stroke="${lashC}" stroke-width="4.6" stroke-linecap="round"/>
      <path d="M -29 ${lo + 1} L -36 ${lo - 4}" stroke="${lashC}" stroke-width="2.4" stroke-linecap="round"/>`;
  } else {
    lash = `<path d="M -29 0 C -21 -22, 9 -27, 24 -7 C 25 -4, 23 -2, 21 -4 C 8 -18, -16 -17, -24 3 Z" fill="${lashC}"/>
      <path d="M -26 -4 C -30 -7, -33 -9, -37 -14 M -27 1 C -31 0, -34 0, -38 -2" stroke="${lashC}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M -20 -19 C -8 -28, 8 -28, 18 -19" stroke="${lashC}" stroke-width="1.3" fill="none" opacity=".35"/>`;
  }
  return `<g transform="${T}"><g class="w-blink">
    <defs><clipPath id="${id}c"><path d="${EYE_WHITE}"/></clipPath>${lidClip}</defs>
    <g ${lid ? `clip-path="url(#${id}l)"` : ''}>
      <path d="${EYE_WHITE}" fill="url(#${u}sclera)"/>
      <g clip-path="url(#${id}c)">
        <g transform="translate(${shift * m} 0) translate(0 3) scale(${irisScale}) translate(0 -3)">
          <ellipse cx="0" cy="3" rx="15" ry="19" fill="url(#${u}iris)" stroke="${E.dark}" stroke-width="1.5"/>
          <ellipse cx="0" cy="3" rx="10" ry="13.5" fill="none" stroke="${E.darkest}" stroke-opacity=".3" stroke-width="1.2"/>
          <ellipse cx="0" cy="14" rx="9" ry="5" fill="${E.light}" opacity=".85" filter="url(#${u}soft)"/>
          ${pupil}
          ${hl}
        </g>
        <path d="M -30 -26 L 30 -26 L 30 -3 C 12 -12, -12 -12, -30 -3 Z" fill="${E.darkest}" opacity=".28"/>
      </g>
    </g>
    ${lash}
    <path d="M -16 22 C -6 27, 6 26, 13 21" stroke="${lashC}" stroke-width="1.6" fill="none" opacity=".55" stroke-linecap="round"/>
  </g></g>`;
}

const BROWS = {
  normal: 'M -22 -40 C -12 -47, 6 -48, 18 -43',
  up: 'M -22 -46 C -12 -53, 6 -54, 18 -49',
  sad: 'M -22 -40 C -10 -42, 6 -46, 16 -53',
  angry: 'M -22 -50 C -10 -48, 4 -44, 16 -36',
};

const MOUTHS = {
  smile: (L) => `<path d="M 190 283 Q 200 292 210 283" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>`,
  grin: () => `<path d="M 187 280 Q 200 283 213 280 Q 211 299 200 300 Q 189 299 187 280 Z" fill="#7a1f36"/>
    <path d="M 192 293 Q 200 287 208 293 Q 205 299.5 200 299.5 Q 195 299.5 192 293 Z" fill="#ff8fa3"/>
    <path d="M 188 280.5 Q 200 283.5 212 280.5 L 211.4 284 Q 200 286.5 188.6 284 Z" fill="#fff"/>`,
  o: () => `<ellipse cx="200" cy="288" rx="5.5" ry="6.5" fill="#7a1f36"/><ellipse cx="200" cy="292" rx="3.5" ry="2.2" fill="#ff8fa3"/>`,
  frown: (L) => `<path d="M 191 291 Q 200 283 209 291" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>`,
  wail: () => `<path d="M 185 284 Q 200 277 215 284 Q 213 304 200 304 Q 187 304 185 284 Z" fill="#7a1f36"/><path d="M 191 298 Q 200 292 209 298 Q 205 304 200 304 Q 195 304 191 298 Z" fill="#ff8fa3"/>`,
  pout: (L) => `<path d="M 193 288 Q 196.5 284.5 200 288 Q 203.5 291.5 207 287" fill="none" stroke="${L}" stroke-width="2.3" stroke-linecap="round"/>`,
  cat: (L) => `<path d="M 189 284 Q 194.5 291 200 285 Q 205.5 291 211 284" fill="none" stroke="${L}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`,
  smirk: (L) => `<path d="M 190 287 Q 202 290 211 281" fill="none" stroke="${L}" stroke-width="2.4" stroke-linecap="round"/>`,
};

function fxLayer(list, u) {
  let s = '';
  for (const f of list || []) {
    if (f === 'sparkle') s += `<g class="w-twinkle">${[[316, 132, 13], [86, 168, 10], [300, 92, 7], [104, 112, 6]].map(([x, y, r]) => `<path d="${star4(x, y, r)}" fill="#fff8c4" stroke="#ffd34d" stroke-width="1"/>`).join('')}</g>`;
    if (f === 'hearts') s += `<g class="w-hearts">${[[320, 170, 14], [80, 210, 11], [306, 110, 9]].map(([x, y, r], i) => `<path class="w-heart h${i}" d="${heart(x, y, r)}" fill="#ff5c93" stroke="#fff" stroke-width="1.6"/>`).join('')}</g>`;
    if (f === 'tear') s += `<path class="w-drip" d="M 141 236 C 136 246, 136 254, 141 256 C 146 254, 146 246, 141 236 Z" fill="#9fe0ff" stroke="#5fb4e6" stroke-width="1"/>`;
    if (f === 'tears') s += `<g class="w-drip" opacity=".85"><path d="M 146 236 C 140 260, 146 290, 138 320 L 148 320 C 154 290, 150 262, 156 240 Z M 254 236 C 260 260, 254 290, 262 320 L 252 320 C 246 290, 250 262, 244 240 Z" fill="#a7e4ff"/></g>`;
    if (f === 'gloom') s += `<g clip-path="url(#${u}faceclip)" opacity=".35" stroke="#5368ff" stroke-width="2.5">${[156, 170, 184, 198, 212, 226, 240].map((x, i) => `<path d="M ${x} ${150 + (i % 2) * 6} L ${x} ${196 + (i % 3) * 4}"/>`).join('')}</g>`;
    if (f === 'shock') s += `<g stroke="#2a1838" stroke-width="3.4" stroke-linecap="round"><path d="M 168 40 L 160 18 M 200 34 L 200 10 M 232 40 L 240 18"/></g>`;
    if (f === 'sweat') s += `<path d="M 284 150 C 274 168, 274 180, 284 182 C 294 180, 294 168, 284 150 Z" fill="#bfe9ff" stroke="#5fb4e6" stroke-width="1.6"/><path d="M 280 172 Q 281 177 285 178" stroke="#fff" stroke-width="2" fill="none"/>`;
    if (f === 'anger') s += `<g transform="translate(282 124)" stroke="#ff2e55" stroke-width="4" fill="none" stroke-linecap="round"><path d="M -12 -4 Q -4 -4 -4 -12 M 4 -12 Q 4 -4 12 -4 M 12 4 Q 4 4 4 12 M -4 12 Q -4 4 -12 4"/></g>`;
    if (f === 'zzz') s += `<g class="w-zzz" font-family="'Mochiy Pop One',sans-serif" fill="#a9b6ff" stroke="#fff" stroke-width="1"><text x="296" y="140" font-size="26">Z</text><text x="318" y="112" font-size="20">z</text><text x="334" y="90" font-size="15">z</text></g>`;
  }
  return s;
}

// --------------------------------------------------------------------------
export function renderWaifu(w, opts = {}) {
  const u = 'w' + ++UID + '_';
  const ex = EXPRESSIONS[opts.expr || 'neutral'] || EXPRESSIONS.neutral;
  const outfitId = opts.outfit || w.outfit;
  const accs = [...(w.traits || [])];
  if (opts.acc && !accs.includes(opts.acc)) accs.push(opts.acc);

  const hc = w.hair.color;
  const H = {
    u,
    base: hc,
    light: shade(hc, 0.32),
    dark: shadow(hc, 0.32),
    line: shadow(hc, 0.6),
    shine: shade(hc, 0.75),
    accent: w.palette.accent,
  };
  const [sk, skS] = SKINS[w.skin || 'fair'];
  H.skinLine = shadow(skS, 0.38);
  H.skinShadow = skS;
  const ec = w.eyes;
  const E = {
    base: ec,
    dark: shadow(ec, 0.45),
    darkest: shadow(ec, 0.78),
    light: shade(ec, 0.55),
    lash: mix(shadow(hc, 0.75), '#1e1024', 0.6),
  };
  const P = { ...w.palette, ...(opts.palette || {}) };
  const outfit = (OUTFITS[outfitId] || OUTFITS.sailor)(P, u);
  const hstyle = w.hair;
  const bang = bangsPath(BANGS[hstyle.bangs] || BANGS.blunt);
  const bangBack = bangsPath((BANGS[hstyle.bangs] || BANGS.blunt).map(([x, y, t]) => (t ? [x + (x > 200 ? -10 : 10), y + 7, 1] : [x + (x > 200 ? -6 : 6), y + 10, 0])));
  const ahoge = hstyle.ahoge ? `<path d="M 198 72 C 190 40, 206 18, 232 22 C 246 24, 250 36, 242 42 C 238 32, 226 30, 218 36 C 210 44, 208 58, 210 72 Z" fill="url(#${u}hair)" stroke="${H.line}" stroke-width="1.6" stroke-linejoin="round"/>` : '';

  // ---- accessory layers ----
  const accLayer = { back: '', ears: '', face: '', front: '', headback: '' };
  for (const a of accs) {
    const A = ACCESSORIES[a];
    if (A) accLayer[A.layer] += A.draw(H);
  }

  // ---- back hair ----
  const bk = hstyle.back;
  let backHair = '';
  const hairFill = `fill="url(#${u}hairB)" stroke="${H.line}" stroke-width="1.8" stroke-linejoin="round"`;
  const baseShape = BACK[bk] || (bk === 'twintails' || bk === 'sidetail' || bk === 'buns' || bk === 'ponytail' ? BACK.bob : bk === 'drills' ? BACK.medium : BACK.long);
  if (bk === 'twintails') {
    backHair += `<g class="w-tail-l"><path d="${TAIL_L}" ${hairFill}/><path d="M 116 140 C 80 190, 64 260, 66 340" stroke="${H.shine}" stroke-width="3" opacity=".35" fill="none"/></g>`;
    backHair += `<g transform="translate(400 0) scale(-1 1)"><g class="w-tail-l"><path d="${TAIL_L}" ${hairFill}/><path d="M 116 140 C 80 190, 64 260, 66 340" stroke="${H.shine}" stroke-width="3" opacity=".35" fill="none"/></g></g>`;
  }
  if (bk === 'sidetail') backHair += `<g class="w-tail-l"><path d="${TAIL_L}" ${hairFill} transform="translate(0 -14)"/></g>`;
  if (bk === 'ponytail') backHair += `<g class="w-tail-r"><path d="${PONY}" ${hairFill}/><path d="M 262 90 C 320 110, 330 200, 320 300" stroke="${H.shine}" stroke-width="3" opacity=".35" fill="none"/></g>`;
  if (bk === 'buns') {
    for (const x of [122, 278]) backHair += `<circle cx="${x}" cy="96" r="34" ${hairFill}/><path d="M ${x - 20} 90 C ${x - 10} 70, ${x + 14} 72, ${x + 18} 92 M ${x - 14} 106 C ${x - 2} 112, ${x + 12} 108, ${x + 20} 100" stroke="${H.dark}" stroke-width="2" fill="none" opacity=".6"/>`;
  }
  backHair += `<path d="${baseShape}" ${hairFill}/>`;
  // inner darker shading of back hair (visible behind neck)
  backHair += `<defs><clipPath id="${u}backclip"><path d="${baseShape}"/></clipPath></defs><path clip-path="url(#${u}backclip)" d="M 140 230 C 140 330, 170 380, 200 400 C 230 380, 260 330, 260 230 Z" fill="${H.line}" opacity=".35"/>`;

  // ties
  let ties = '';
  if (bk === 'twintails') ties = hairTie(132, 118, w.palette.accent) + hairTie(268, 118, w.palette.accent);
  if (bk === 'sidetail') ties = hairTie(132, 104, w.palette.accent);
  if (bk === 'ponytail') ties = hairTie(244, 84, w.palette.accent);
  if (bk === 'buns') ties = `<path d="M 100 112 C 112 124, 132 126, 146 118" stroke="${w.palette.accent}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M 300 112 C 288 124, 268 126, 254 118" stroke="${w.palette.accent}" stroke-width="5" fill="none" stroke-linecap="round"/>`;

  // ---- side locks ----
  const lk = hstyle.locks || 'medium';
  let locks = '';
  if (LOCKS[lk]) {
    const d = lockPath(LOCKS[lk], lk === 'hime');
    const one = `<path d="${d}" fill="url(#${u}hair)" stroke="${H.line}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M 128 176 C 118 224, 116 ${LOCKS[lk] - 64}, 120 ${LOCKS[lk] - 22}" stroke="${H.dark}" stroke-width="1.5" fill="none" opacity=".5"/>
      <path d="M 124 170 C 116 196, 114 214, 114 232" stroke="${H.shine}" stroke-width="2.4" fill="none" opacity=".45" stroke-linecap="round"/>`;
    locks = `<g class="w-lock">${one}</g><g transform="translate(400 0) scale(-1 1)"><g class="w-lock">${one}</g></g>`;
  }

  // ---- bangs details ----
  const edge = BANGS[hstyle.bangs] || BANGS.blunt;
  let strands = '';
  for (const [x, y, t] of edge) {
    if (!t) continue;
    const sx = 200 + (x - 200) * 0.35;
    strands += `<path d="M ${sx.toFixed(1)} 96 Q ${((sx + x) / 2 + (x - 200) * 0.15).toFixed(1)} ${(y + 96) / 2} ${x} ${y - 12}" stroke="${H.dark}" stroke-width="1.3" fill="none" opacity=".45"/>`;
  }
  const shine = `<path d="M 118 126 Q 200 90 282 126 L 282 140 L 270 132 L 260 146 L 248 134 L 238 148 L 224 136 L 212 150 L 200 138 L 188 150 L 176 136 L 164 148 L 152 134 L 142 146 L 130 132 L 118 140 Z" fill="${H.shine}" opacity=".55"/>`;

  // ---- eyes / brows ----
  const ek = ex.eyes;
  const L = ek === 'happy' ? 'closed' : ek === 'wink' ? 'open' : ek;
  const R = ek === 'happy' || ek === 'wink' ? 'closed' : ek;
  const blinkable = L === 'open' || L === 'aside';
  const eyes = `<g class="${blinkable ? 'w-eyes' : ''}">${eye(164, 222, 1, L, E, u, 0)}${eye(236, 222, -1, R, E, u, 1)}</g>`;
  const brow = BROWS[ex.brows] || BROWS.normal;
  const brows = `<g stroke="${H.line}" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".85">
    <path transform="translate(164 222)" d="${brow}"/><path transform="translate(236 222) scale(-1 1)" d="${brow}"/></g>`;

  const lip = '#c15673';
  const mouth = (MOUTHS[ex.mouth] || MOUTHS.smile)(lip) + (w.fang && (ex.mouth === 'smile' || ex.mouth === 'grin' || ex.mouth === 'cat') ? `<path d="M 204 ${ex.mouth === 'grin' ? 283 : 285} l 2.5 5 l 2.5 -5.5 Z" fill="#fff" stroke="#c9b6c0" stroke-width=".6"/>` : '');
  const bl = ex.blush;
  const blush = `<g opacity="${(0.25 + bl * 0.55).toFixed(2)}"><ellipse cx="154" cy="258" rx="18" ry="9" fill="#ff6f96" filter="url(#${u}blur)"/><ellipse cx="246" cy="258" rx="18" ry="9" fill="#ff6f96" filter="url(#${u}blur)"/></g>
    ${bl >= 0.75 ? `<g stroke="#ff5c88" stroke-width="1.6" stroke-linecap="round" opacity=".8"><path d="M 146 262 l 5 -8 M 154 262 l 5 -8 M 162 262 l 5 -8 M 236 262 l 5 -8 M 244 262 l 5 -8 M 252 262 l 5 -8"/></g>` : ''}
    <ellipse cx="160" cy="253" rx="3" ry="1.6" fill="#fff" opacity=".6"/><ellipse cx="240" cy="253" rx="3" ry="1.6" fill="#fff" opacity=".6"/>`;

  const ear = `<path d="M 132 204 C 118 194, 112 214, 116 230 C 120 244, 128 248, 136 240 Z" fill="url(#${u}skin)" stroke="${H.skinLine}" stroke-width="1.4"/>`;

  const wingGrad = `<linearGradient id="${u}wing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dfe7ff"/></linearGradient>`;

  const svg = `<svg class="waifu-svg ${opts.anim === false ? '' : 'anim'} ${opts.cls || ''}" viewBox="0 -30 400 530" xmlns="http://www.w3.org/2000/svg" aria-label="${w.name}">
  <defs>
    <linearGradient id="${u}hair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${H.light}"/><stop offset=".55" stop-color="${H.base}"/><stop offset="1" stop-color="${H.dark}"/></linearGradient>
    <linearGradient id="${u}hairB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${H.base}"/><stop offset=".6" stop-color="${H.dark}"/><stop offset="1" stop-color="${shadow(hc, 0.45)}"/></linearGradient>
    <radialGradient id="${u}skin" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="${sk}"/><stop offset=".7" stop-color="${mix(sk, skS, 0.35)}"/><stop offset="1" stop-color="${skS}"/></radialGradient>
    <linearGradient id="${u}iris" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${E.darkest}"/><stop offset=".45" stop-color="${E.base}"/><stop offset="1" stop-color="${E.light}"/></linearGradient>
    <linearGradient id="${u}sclera" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3e0f4"/><stop offset=".45" stop-color="#ffffff"/></linearGradient>
    <linearGradient id="${u}cloth" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${shadow(P.main, 0.25)}"/><stop offset=".3" stop-color="${P.main}"/><stop offset=".7" stop-color="${shade(P.main, 0.08)}"/><stop offset="1" stop-color="${shadow(P.main, 0.25)}"/></linearGradient>
    <linearGradient id="${u}cloth2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(P.accent, 0.1)}"/><stop offset="1" stop-color="${shadow(P.accent, 0.3)}"/></linearGradient>
    <linearGradient id="${u}white" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d9d6ec"/><stop offset=".3" stop-color="#fdfdff"/><stop offset=".7" stop-color="#ffffff"/><stop offset="1" stop-color="#d9d6ec"/></linearGradient>
    <linearGradient id="${u}dark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#140f1c"/><stop offset=".35" stop-color="#2c2438"/><stop offset=".65" stop-color="#2c2438"/><stop offset="1" stop-color="#140f1c"/></linearGradient>
    <linearGradient id="${u}gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#f2c14e"/><stop offset="1" stop-color="#b8861f"/></linearGradient>
    <linearGradient id="${u}metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f7fc"/><stop offset=".45" stop-color="#c3cbd9"/><stop offset=".55" stop-color="#e6ebf3"/><stop offset="1" stop-color="#8994a8"/></linearGradient>
    <linearGradient id="${u}horn" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#5a3a6e"/><stop offset="1" stop-color="#1e0f26"/></linearGradient>
    ${wingGrad}
    <filter id="${u}blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
    <filter id="${u}soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter>
    <filter id="${u}glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <clipPath id="${u}faceclip"><path d="${FACE}"/></clipPath>
    <clipPath id="${u}bangclip"><path d="${bang}"/></clipPath>
  </defs>
  <g class="w-root">
  <g class="w-backacc" transform="translate(0 10)">${outfit.back || ''}${accLayer.back}</g>
  <g class="w-sway"><g transform="translate(0 10)">${backHair}</g></g>
  <g class="w-breath">
    <g class="w-body">
      ${outfit.under || ''}
      <path d="M 178 270 L 178 340 C 178 354, 190 360, 200 360 C 210 360, 222 354, 222 340 L 222 270 Z" fill="url(#${u}skin)" stroke="${H.skinLine}" stroke-width="1.4"/>
      <path d="M 178 300 C 190 328, 210 328, 222 300 L 222 334 C 210 344, 190 344, 178 334 Z" fill="${skS}" opacity=".8"/>
      <path d="${'M 170 346 L 230 346 C 250 356, 296 364, 322 398 C 334 428, 340 466, 344 500 L 56 500 C 60 466, 66 428, 78 398 C 104 364, 150 356, 170 346 Z'}" fill="url(#${u}skin)" stroke="${H.skinLine}" stroke-width="1.4"/>
      ${outfit.body}
      ${outfit.neck || ''}
    </g>
    ${hstyle.back === 'drills' ? `<g class="w-sway"><g transform="translate(0 10)">${drill(104, H)}<g transform="translate(400 0) scale(-1 1)">${drill(104, H)}</g></g></g>` : ''}
    <g class="w-head"><g transform="translate(0 10)">
      ${accLayer.ears}
      ${accLayer.headback}
      ${ear}<g transform="translate(400 0) scale(-1 1)">${ear}</g>
      <path d="${FACE}" fill="url(#${u}skin)" stroke="${H.skinLine}" stroke-width="1.5"/>
      <g clip-path="url(#${u}faceclip)"><path d="${bang}" transform="translate(0 9)" fill="${skS}" opacity=".75"/></g>
      ${blush}
      <path d="M 199 256 Q 202 260 199 263" stroke="${H.skinLine}" stroke-width="1.5" fill="none" opacity=".55" stroke-linecap="round"/>
      ${mouth}
      ${eyes}
      ${accLayer.face}
      ${locks}
      <path d="${bangBack}" fill="${H.dark}" stroke="${H.line}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="${bang}" fill="url(#${u}hair)" stroke="${H.line}" stroke-width="1.8" stroke-linejoin="round"/>
      <g clip-path="url(#${u}bangclip)">${strands}${shine}</g>
      ${ties}
      ${ahoge}
      ${brows}
      ${accLayer.front}
      ${outfit.head || ''}
      ${fxLayer(ex.fx, u)}
    </g></g>
  </g>
  </g>
</svg>`;
  return svg;
}

// Data URI version (used for <img> in slot reels, favicons, etc.)
const uriCache = new Map();
export function waifuDataUri(w, opts = {}) {
  const key = w.id + JSON.stringify(opts);
  if (!uriCache.has(key)) {
    uriCache.set(key, 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(renderWaifu(w, { ...opts, anim: false })));
  }
  return uriCache.get(key);
}
