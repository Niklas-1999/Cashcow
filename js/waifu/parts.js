// Procedural SVG parts: outfits + accessories.
// Coordinate system: viewBox "0 -30 400 530". Head centre x=200, chin y≈312,
// neck 178–222, shoulders ≈ y 360–400, frame bottom y=500.
import { shade, mix, cubicPoint } from '../util.js';

// Torso silhouette; `neck` is a path fragment running from (170,346) to (230,346).
export const torso = (neck) =>
  `M 170 346 ${neck} C 250 356, 296 364, 322 398 C 334 428, 340 466, 344 500 L 56 500 C 60 466, 66 428, 78 398 C 104 364, 150 356, 170 346 Z`;

const mirror = (inner) => `<g transform="translate(400 0) scale(-1 1)">${inner}</g>`;
const both = (inner) => inner + mirror(inner);

const arms = (c) =>
  `<path d="M 106 404 C 100 436, 96 468, 94 500 M 294 404 C 300 436, 304 468, 306 500" fill="none" stroke="${c}" stroke-width="2" opacity=".45" stroke-linecap="round"/>`;

// soft fold shading across chest
const folds = (c) =>
  `<path d="M 150 452 C 175 462, 225 462, 250 452" fill="none" stroke="${c}" stroke-width="2" opacity=".18" stroke-linecap="round"/>`;

export function star5(cx, cy, r, rot = -90) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = ((rot + i * 36) * Math.PI) / 180;
    const rr = i % 2 ? r * 0.45 : r;
    d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1) + ' ';
  }
  return d + 'Z';
}
export const star4 = (x, y, s) =>
  `M ${x} ${y - s} Q ${x + s * 0.18} ${y - s * 0.18} ${x + s} ${y} Q ${x + s * 0.18} ${y + s * 0.18} ${x} ${y + s} Q ${x - s * 0.18} ${y + s * 0.18} ${x - s} ${y} Q ${x - s * 0.18} ${y - s * 0.18} ${x} ${y - s} Z`;
export const heart = (x, y, s) =>
  `M ${x} ${y + s * 0.55} C ${x - s * 0.1} ${y + s * 0.45}, ${x - s} ${y - s * 0.05}, ${x - s} ${y - s * 0.45} C ${x - s} ${y - s * 0.95}, ${x - s * 0.2} ${y - s * 1.05}, ${x} ${y - s * 0.5} C ${x + s * 0.2} ${y - s * 1.05}, ${x + s} ${y - s * 0.95}, ${x + s} ${y - s * 0.45} C ${x + s} ${y - s * 0.05}, ${x + s * 0.1} ${y + s * 0.45}, ${x} ${y + s * 0.55} Z`;

function sakura(x, y, r, fill, center = '#ffe28a', op = 1) {
  let s = `<g opacity="${op}">`;
  for (let i = 0; i < 5; i++) {
    const a = i * 72;
    s += `<ellipse cx="${x}" cy="${y - r * 0.55}" rx="${r * 0.42}" ry="${r * 0.6}" fill="${fill}" transform="rotate(${a} ${x} ${y})"/>`;
  }
  return s + `<circle cx="${x}" cy="${y}" r="${r * 0.22}" fill="${center}"/></g>`;
}

function bow(x, y, s, c, line) {
  const k = s / 20;
  return `<g transform="translate(${x} ${y}) scale(${k})">
    <path d="M 0 0 L -8 22 L -2 18 L 2 26 L 4 2 Z M 0 0 L 10 22 L 4 19 L 0 26 Z" fill="${shade(c, -0.15)}" stroke="${line}" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M 0 0 C -10 -16, -28 -14, -26 0 C -24 12, -10 10, 0 0 Z" fill="${c}" stroke="${line}" stroke-width="1.2"/>
    <path d="M 0 0 C 10 -16, 28 -14, 26 0 C 24 12, 10 10, 0 0 Z" fill="${c}" stroke="${line}" stroke-width="1.2"/>
    <path d="M -20 -4 C -16 -8, -10 -7, -6 -3" stroke="#fff" stroke-width="1.6" fill="none" opacity=".55" stroke-linecap="round"/>
    <ellipse cx="0" cy="0" rx="5" ry="6" fill="${shade(c, -0.1)}" stroke="${line}" stroke-width="1.2"/>
  </g>`;
}

// frill made of little circles along a cubic bezier
function frill(p0, p1, p2, p3, n, r, fill, stroke) {
  let s = '';
  for (let i = 0; i <= n; i++) {
    const [x, y] = cubicPoint(p0, p1, p2, p3, i / n);
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
  }
  return s;
}

function scallopLine(x0, x1, y, step, depth, fill, stroke) {
  let d = `M ${x0} ${y}`;
  for (let x = x0; x < x1; x += step) d += ` q ${step / 2} ${depth} ${step} 0`;
  return `<path d="${d} L ${x1} ${y - 4} L ${x0} ${y - 4} Z" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
}

const goldFill = (u) => `url(#${u}gold)`;

// ---------------------------------------------------------------------------
// OUTFITS. Each returns {under?, body, head?, back?}; P = palette with main/accent/trim
// ---------------------------------------------------------------------------
export const OUTFITS = {
  sailor(P, u) {
    const shirt = '#fbfbff', line = shade(P.main, -0.5);
    return {
      body: `
      <path d="${torso('L 200 404 L 230 346')}" fill="url(#${u}white)" stroke="#a9a6c4" stroke-width="1.6"/>
      ${arms('#9c98bd')}
      ${both(`<path d="M 170 346 L 200 404 L 192 412 L 136 420 C 128 400, 116 384, 102 371 C 128 360, 150 354, 170 346 Z" fill="${P.main}" stroke="${line}" stroke-width="1.6" stroke-linejoin="round"/>
        <path d="M 112 374 C 124 388, 134 402, 140 413 L 188 405" fill="none" stroke="${shirt}" stroke-width="2.6"/>
        <path d="M 108 368 C 118 368, 140 356, 168 350" fill="none" stroke="${shade(P.main, 0.25)}" stroke-width="2" opacity=".5"/>`)}
      <path d="M 192 416 L 172 474 L 186 469 L 196 482 L 201 418 Z" fill="${P.accent}" stroke="${shade(P.accent, -0.45)}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M 208 416 L 228 474 L 214 469 L 204 482 L 199 418 Z" fill="${shade(P.accent, -0.1)}" stroke="${shade(P.accent, -0.45)}" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M 186 398 Q 200 394 214 398 L 210 420 Q 200 424 190 420 Z" fill="${P.accent}" stroke="${shade(P.accent, -0.45)}" stroke-width="1.4"/>
      <path d="M 191 402 Q 200 400 208 402" stroke="#fff" stroke-width="1.6" opacity=".5" fill="none"/>
      ${folds('#7d7aa0')}`,
    };
  },

  blazer(P, u) {
    const line = shade(P.main, -0.55);
    return {
      body: `
      <path d="${torso('C 186 356, 214 356, 230 346')}" fill="url(#${u}white)" stroke="#a9a6c4" stroke-width="1.5"/>
      <path d="${torso('L 196 478 L 204 478 L 230 346')}" fill="url(#${u}cloth)" stroke="${line}" stroke-width="1.6" stroke-linejoin="round"/>
      ${arms(line)}
      ${both(`<path d="M 170 346 L 196 476 L 188 476 L 158 398 L 172 388 L 154 372 Z" fill="${shade(P.main, -0.18)}" stroke="${line}" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M 172 342 L 200 370 L 186 384 L 164 352 Z" fill="#fff" stroke="#a9a6c4" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M 112 470 L 156 466" stroke="${line}" stroke-width="1.6" opacity=".6"/>`)}
      ${bow(200, 374, 18, P.accent, shade(P.accent, -0.5))}
      <circle cx="140" cy="430" r="10" fill="${goldFill(u)}" stroke="#a87b1d" stroke-width="1.2"/>
      <path d="${star5(140, 431, 6)}" fill="${P.main}"/>
      <circle cx="200" cy="490" r="4.5" fill="${goldFill(u)}" stroke="#a87b1d"/>`,
    };
  },

  maid(P, u) {
    const dress = '#2a2338', line = '#120d1a';
    return {
      body: `
      <path d="${torso('C 184 362, 216 362, 230 346')}" fill="url(#${u}dark)" stroke="${line}" stroke-width="1.6"/>
      ${both(`<ellipse cx="96" cy="394" rx="32" ry="25" fill="${dress}" stroke="${line}" stroke-width="1.5"/>
        <path d="M 74 386 C 84 376, 100 372, 112 376" stroke="#5a4e70" stroke-width="2" fill="none" opacity=".7"/>
        <path d="M 140 362 L 158 404 L 170 404 L 154 359 Z" fill="#fff" stroke="#b9b3cc" stroke-width="1.2"/>`)}
      <path d="M 158 402 Q 200 412 242 402 L 240 500 L 160 500 Z" fill="url(#${u}white)" stroke="#b9b3cc" stroke-width="1.3"/>
      ${frill([156, 402], [180, 412], [220, 412], [244, 402], 10, 4.6, '#fff', '#c9c3da')}
      <path d="M 172 430 L 172 500 M 200 432 L 200 500 M 228 430 L 228 500" stroke="#ddd8ea" stroke-width="1.4"/>
      <path d="M 170 346 C 156 362, 160 380, 182 382 C 194 382, 198 374, 200 368 C 202 374, 206 382, 218 382 C 240 380, 244 362, 230 346 C 216 352, 184 352, 170 346 Z" fill="#fff" stroke="#b9b3cc" stroke-width="1.3"/>
      ${bow(200, 366, 16, P.accent, shade(P.accent, -0.5))}`,
      head: `
      <path d="M 120 122 C 146 80, 254 80, 280 122" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round"/>
      ${frill([118, 118], [144, 70], [256, 70], [282, 118], 12, 6.5, '#fff', '#c9c3da')}
      <path d="M 124 118 C 148 84, 252 84, 276 118" fill="none" stroke="${P.accent}" stroke-width="3" opacity=".8"/>`,
    };
  },

  dealer(P, u) {
    const vest = P.accent, vl = shade(vest, -0.55);
    return {
      body: `
      <path d="${torso('C 186 356, 214 356, 230 346')}" fill="url(#${u}white)" stroke="#a9a6c4" stroke-width="1.5"/>
      ${arms('#9c98bd')}
      ${both(`<path d="M 172 342 L 200 368 L 186 380 L 164 352 Z" fill="#fff" stroke="#a9a6c4" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M 64 452 Q 84 462 102 456" stroke="#222" stroke-width="6" fill="none" stroke-linecap="round"/>`)}
      <path d="M 148 362 L 186 366 L 200 444 L 214 366 L 252 362 C 264 402, 266 452, 272 500 L 128 500 C 134 452, 136 402, 148 362 Z" fill="url(#${u}cloth2)" stroke="${vl}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M 186 366 L 200 444 L 214 366" fill="none" stroke="${goldFill(u)}" stroke-width="2.4"/>
      <path d="M 200 444 L 200 500" stroke="${vl}" stroke-width="1.4"/>
      <circle cx="200" cy="458" r="3.6" fill="${goldFill(u)}"/><circle cx="200" cy="476" r="3.6" fill="${goldFill(u)}"/><circle cx="200" cy="494" r="3.6" fill="${goldFill(u)}"/>
      <path d="M 150 444 Q 172 462 192 450" stroke="${goldFill(u)}" stroke-width="1.8" fill="none"/>
      <path d="${heart(164, 402, 7)}" fill="${goldFill(u)}"/>
      <path d="M 200 368 L 182 358 L 180 378 Z M 200 368 L 218 358 L 220 378 Z" fill="#1d1a24" stroke="#000" stroke-width="1" stroke-linejoin="round"/>
      <circle cx="200" cy="368" r="4" fill="#2e2a38"/>`,
    };
  },

  kimono(P, u) {
    const line = shade(P.main, -0.55);
    let flowers = '';
    [[108, 420, 9], [292, 410, 10], [142, 384, 6], [270, 448, 7], [96, 470, 7], [240, 386, 6], [312, 472, 8]].forEach(
      ([x, y, r]) => (flowers += sakura(x, y, r, P.trim, '#ffe28a', 0.85))
    );
    return {
      body: `
      <path d="${torso('L 205 408 L 230 346')}" fill="url(#${u}cloth)" stroke="${line}" stroke-width="1.6"/>
      ${arms(line)}
      ${flowers}
      <path d="M 230 346 L 240 348 L 211 410 L 205 408 Z" fill="${P.trim}" stroke="${line}" stroke-width="1"/>
      <path d="M 170 346 L 158 350 L 233 476 L 246 468 Z" fill="#fff" stroke="${line}" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M 162 349 L 238 472" stroke="${P.accent}" stroke-width="3"/>
      <path d="M 62 458 C 140 468, 260 468, 338 458 L 343 500 L 57 500 Z" fill="url(#${u}cloth2)" stroke="${shade(P.accent, -0.5)}" stroke-width="1.5"/>
      <path d="M 62 458 C 140 468, 260 468, 338 458" stroke="${P.trim}" stroke-width="4" fill="none"/>
      <path d="M 60 482 C 140 492, 260 492, 340 482" stroke="${goldFill(u)}" stroke-width="3.5" fill="none"/>
      <circle cx="200" cy="489" r="6" fill="${goldFill(u)}" stroke="#a87b1d"/>`,
    };
  },

  idol(P, u) {
    const line = shade(P.main, -0.5);
    let stars = '';
    [[120, 430], [282, 440], [150, 476], [250, 486], [100, 470], [300, 470]].forEach(([x, y]) => (stars += `<path d="${star4(x, y, 5)}" fill="#fff" opacity=".85"/>`));
    return {
      body: `
      <path d="${torso('C 186 368, 214 368, 230 346')}" fill="url(#${u}cloth)" stroke="${line}" stroke-width="1.6"/>
      ${arms(line)}
      ${stars}
      ${both(`<ellipse cx="94" cy="394" rx="36" ry="28" fill="${shade(P.main, 0.3)}" stroke="${line}" stroke-width="1.5"/>
        <path d="M 66 392 C 80 410, 108 414, 124 404" stroke="${P.accent}" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M 74 380 C 84 372, 100 370, 112 374" stroke="#fff" stroke-width="2.4" fill="none" opacity=".6"/>`)}
      ${frill([164, 348], [180, 374], [220, 374], [236, 348], 9, 6, '#fff', shade(P.main, -0.2))}
      <path d="M 70 470 C 140 478, 260 478, 330 470 L 334 500 L 66 500 Z" fill="${P.accent}" stroke="${shade(P.accent, -0.5)}" stroke-width="1.4"/>
      <path d="${heart(160, 486, 6)} ${heart(200, 488, 6)} ${heart(240, 486, 6)}" fill="#fff" opacity=".9"/>
      ${bow(200, 408, 30, P.accent, shade(P.accent, -0.5))}
      <path d="${star5(200, 408, 9)}" fill="${goldFill(u)}" stroke="#a87b1d" stroke-width="1"/>`,
      head: `<path d="${star5(266, 112, 11, -70)}" fill="${goldFill(u)}" stroke="#a87b1d" stroke-width="1.2"/>`,
    };
  },

  witch(P, u) {
    const robe = shade(P.main, -0.55), line = shade(P.main, -0.8);
    return {
      under: both(`<path d="M 104 372 C 116 330, 140 300, 168 294 L 176 350 Z" fill="${P.accent}" stroke="${line}" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M 112 370 C 124 336, 144 312, 166 304" stroke="${shade(P.accent, 0.3)}" stroke-width="2" fill="none" opacity=".6"/>`),
      body: `
      <path d="${torso('C 186 356, 214 356, 230 346')}" fill="url(#${u}white)" stroke="#a9a6c4" stroke-width="1.4"/>
      <path d="M 192 360 L 192 430 M 208 360 L 208 430" stroke="#ccc8de" stroke-width="1.2"/>
      <path d="${torso('L 186 420 L 214 420 L 230 346')}" fill="${robe}" stroke="${line}" stroke-width="1.6" stroke-linejoin="round"/>
      ${arms(shade(P.main, -0.2))}
      ${both(`<path d="M 170 346 L 186 420 L 178 420 L 160 360 Z" fill="${shade(P.main, -0.35)}" stroke="${line}" stroke-width="1"/>`)}
      <path d="M 186 420 L 214 420" stroke="${goldFill(u)}" stroke-width="2"/>
      <circle cx="200" cy="370" r="11" fill="${goldFill(u)}" stroke="#8a6410" stroke-width="1.2"/>
      <circle cx="200" cy="370" r="6" fill="${P.accent}"/>
      <path d="M 196 366 Q 198 364 201 365" stroke="#fff" stroke-width="1.5" fill="none"/>
      <path d="${star5(134, 452, 7)} ${star5(266, 462, 6)}" fill="${goldFill(u)}" opacity=".9"/>`,
      head: `
      <g transform="rotate(-8 200 100)">
        <path d="M 138 98 C 158 44, 186 6, 224 -16 C 246 -28, 262 -18, 256 -6 C 238 -6, 232 30, 262 96 Z" fill="${robe}" stroke="${line}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M 170 40 C 186 14, 206 -4, 226 -12" stroke="${shade(P.main, -0.2)}" stroke-width="3" fill="none" opacity=".6"/>
        <ellipse cx="200" cy="100" rx="128" ry="26" fill="${robe}" stroke="${line}" stroke-width="1.8"/>
        <path d="M 80 100 C 120 112, 280 112, 322 98" stroke="${shade(P.main, -0.25)}" stroke-width="3" fill="none" opacity=".7"/>
        <path d="M 142 92 C 180 104, 228 104, 260 88 L 257 72 C 228 86, 180 88, 146 76 Z" fill="${P.accent}" stroke="${line}" stroke-width="1.4"/>
        <rect x="190" y="80" width="18" height="18" rx="3" fill="none" stroke="${goldFill(u)}" stroke-width="3.5"/>
        <path d="${star5(250, 28, 8)}" fill="${goldFill(u)}"/>
      </g>`,
    };
  },

  gothic(P, u) {
    const line = '#07050a';
    let lace = '';
    for (let y = 410; y < 500; y += 12) lace += `<path d="M 188 ${y} L 212 ${y + 12} M 212 ${y} L 188 ${y + 12}" stroke="#f3e9f3" stroke-width="1.4"/><circle cx="187" cy="${y}" r="2" fill="#d4c6d8"/><circle cx="213" cy="${y}" r="2" fill="#d4c6d8"/>`;
    return {
      body: `
      <path d="${torso('C 184 362, 216 362, 230 346')}" fill="url(#${u}dark)" stroke="${line}" stroke-width="1.6"/>
      ${arms('#4a3e58')}
      <path d="M 172 398 L 228 398 L 236 500 L 164 500 Z" fill="url(#${u}cloth2)" stroke="${shade(P.accent, -0.6)}" stroke-width="1.4"/>
      ${lace}
      <path d="M 170 346 C 150 366, 156 392, 180 392 C 194 392, 198 380, 200 372 C 202 380, 206 392, 220 392 C 244 392, 250 366, 230 346 C 216 354, 184 354, 170 346 Z" fill="#f6eef6" stroke="#2a2030" stroke-width="1.4"/>
      ${frill([154, 366], [160, 400], [240, 400], [246, 366], 12, 4, '#1a1320', '#000')}
      ${both(bow(118, 376, 14, P.accent, shade(P.accent, -0.6)))}
      ${bow(200, 376, 15, '#1a1320', '#000')}`,
      neck: `<path d="M 178 324 Q 200 334 222 324" stroke="#16101c" stroke-width="7" fill="none" stroke-linecap="round"/>
      <ellipse cx="200" cy="335" rx="7" ry="8" fill="${goldFill(u)}"/><ellipse cx="200" cy="335" rx="4.5" ry="5.5" fill="${P.accent}"/>`,
      head: `
      <path d="M 122 120 C 148 84, 252 84, 278 120" fill="none" stroke="#16101c" stroke-width="10" stroke-linecap="round"/>
      ${frill([120, 116], [146, 72], [254, 72], [280, 116], 12, 6, '#1d1424', '#000')}
      ${sakura(262, 98, 13, P.accent, '#2a0a12')}`,
    };
  },

  hoodie(P, u) {
    const line = shade(P.main, -0.5);
    return {
      under: `<path d="M 122 380 C 116 336, 154 316, 200 316 C 246 316, 284 336, 278 380 Z" fill="${shade(P.main, -0.22)}" stroke="${line}" stroke-width="1.6"/>`,
      body: `
      <path d="${torso('C 184 366, 216 366, 230 346')}" fill="url(#${u}cloth)" stroke="${line}" stroke-width="1.6"/>
      ${arms(line)}
      <path d="M 164 342 C 172 378, 228 378, 236 342" stroke="${shade(P.main, -0.12)}" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M 186 370 C 184 400, 182 420, 181 442 M 214 370 C 216 400, 218 424, 219 448" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
      <rect x="177" y="440" width="8" height="12" rx="2" fill="${P.accent}"/><rect x="215" y="446" width="8" height="12" rx="2" fill="${P.accent}"/>
      <path d="${heart(250, 438, 14)}" fill="${P.accent}" stroke="${shade(P.accent, -0.4)}" stroke-width="1.2"/>
      <path d="M 240 432 Q 244 428 248 430" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>`,
    };
  },

  sweater(P, u) {
    const line = shade(P.main, -0.45), rib = shade(P.main, -0.15);
    let ribs = '';
    for (let x = 178; x <= 222; x += 6) ribs += `<path d="M ${x} 306 L ${x + (x - 200) * 0.12} 352" stroke="${rib}" stroke-width="1.5"/>`;
    const cable = (cx) => {
      let d = '';
      for (let y = 380; y < 500; y += 20) d += `<path d="M ${cx - 8} ${y} C ${cx + 8} ${y + 6}, ${cx + 8} ${y + 14}, ${cx - 8} ${y + 20} M ${cx + 8} ${y} C ${cx - 8} ${y + 6}, ${cx - 8} ${y + 14}, ${cx + 8} ${y + 20}" stroke="${rib}" stroke-width="2.4" fill="none"/>`;
      return d;
    };
    return {
      body: `
      <path d="${torso('C 186 352, 214 352, 230 346')}" fill="url(#${u}cloth)" stroke="${line}" stroke-width="1.6"/>
      ${arms(line)}
      ${cable(150)}${cable(250)}
      <path d="M 200 380 L 200 500" stroke="${rib}" stroke-width="1.4" stroke-dasharray="3 5"/>
      <path d="M 174 300 C 190 308, 210 308, 226 300 L 232 350 C 212 362, 188 362, 168 350 Z" fill="${shade(P.main, 0.08)}" stroke="${line}" stroke-width="1.6"/>
      ${ribs}`,
    };
  },

  miko(P, u) {
    const red = '#d8263f', rl = '#6e0f1e';
    return {
      body: `
      <path d="${torso('L 205 408 L 230 346')}" fill="url(#${u}white)" stroke="#aaa6c0" stroke-width="1.6"/>
      ${arms('#a49fbd')}
      <path d="M 230 346 L 240 348 L 211 410 L 205 408 Z" fill="${red}" stroke="${rl}" stroke-width="1"/>
      <path d="M 170 346 L 158 350 L 233 476 L 246 468 Z" fill="#fff" stroke="#aaa6c0" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M 165 349 L 239 472" stroke="${red}" stroke-width="2.4"/>
      ${both(`<path d="M 96 384 C 112 400, 112 420, 104 440" stroke="${red}" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="104" cy="442" r="4" fill="${red}"/>`)}
      <path d="M 58 474 C 140 482, 260 482, 342 474 L 344 500 L 56 500 Z" fill="${red}" stroke="${rl}" stroke-width="1.4"/>
      ${bow(200, 482, 18, red, rl)}`,
      head: `<path d="M 246 94 L 286 82 L 276 106 Z" fill="#fff" stroke="#bbb" stroke-width="1"/>${bow(262, 100, 12, '#d8263f', '#6e0f1e')}`,
    };
  },

  qipao(P, u) {
    const line = shade(P.main, -0.55);
    const peony = (x, y, r) => `<g opacity=".9">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="${x}" cy="${y - r * 0.5}" rx="${r * 0.5}" ry="${r * 0.62}" fill="${P.trim}" stroke="${shade(P.trim, -0.3)}" stroke-width=".8" transform="rotate(${a} ${x} ${y})"/>`).join('')}<circle cx="${x}" cy="${y}" r="${r * 0.3}" fill="${goldFill(u)}"/></g>`;
    return {
      body: `
      <path d="${torso('C 186 352, 214 352, 230 346')}" fill="url(#${u}cloth)" stroke="${line}" stroke-width="1.6"/>
      ${arms(line)}
      ${peony(122, 446, 16)}${peony(276, 476, 14)}${peony(96, 486, 10)}
      <path d="M 202 350 C 222 362, 252 372, 276 380" stroke="${goldFill(u)}" stroke-width="3" fill="none"/>
      <path d="M 176 312 C 190 320, 210 320, 224 312 L 228 346 C 212 354, 188 354, 172 346 Z" fill="${P.main}" stroke="${line}" stroke-width="1.6"/>
      <path d="M 174 344 C 190 352, 210 352, 226 344" stroke="${goldFill(u)}" stroke-width="2.4" fill="none"/>
      ${[[222, 362], [248, 372]].map(([x, y]) => `<path d="M ${x - 8} ${y} q 4 -6 8 0 q 4 6 8 0" stroke="${goldFill(u)}" stroke-width="2.6" fill="none"/><circle cx="${x}" cy="${y}" r="2.6" fill="${goldFill(u)}"/>`).join('')}`,
    };
  },

  knight(P, u) {
    return {
      under: `<path d="M 66 410 C 86 370, 140 350, 200 350 C 260 350, 314 370, 334 410 L 364 500 L 36 500 Z" fill="${P.main}" stroke="${shade(P.main, -0.55)}" stroke-width="1.6"/>
        <path d="M 40 496 C 46 460, 54 430, 66 410" stroke="${shade(P.main, -0.3)}" stroke-width="3" fill="none"/>`,
      body: `
      <path d="${torso('C 186 354, 214 354, 230 346')}" fill="#4b5068" stroke="#262a38" stroke-width="1.6"/>
      <path d="M 132 376 C 160 366, 240 366, 268 376 C 276 420, 272 470, 264 500 L 136 500 C 128 470, 124 420, 132 376 Z" fill="url(#${u}metal)" stroke="#5d6680" stroke-width="1.8"/>
      <path d="M 132 376 C 160 366, 240 366, 268 376" stroke="${goldFill(u)}" stroke-width="3.5" fill="none"/>
      <path d="M 200 372 L 200 500" stroke="#8e98ad" stroke-width="2"/>
      <path d="M 150 384 C 156 430, 156 470, 150 500" stroke="#fff" stroke-width="3" opacity=".5" fill="none"/>
      <path d="M 200 410 L 210 428 L 200 452 L 190 428 Z" fill="${P.accent}" stroke="${goldFill(u)}" stroke-width="2"/>
      <path d="M 172 330 C 190 340, 210 340, 228 330 L 236 360 C 212 370, 188 370, 164 360 Z" fill="url(#${u}metal)" stroke="#5d6680" stroke-width="1.6"/>
      ${both(`<path d="M 66 402 C 68 370, 102 350, 142 358 C 150 380, 144 402, 128 414 C 106 420, 84 416, 66 402 Z" fill="url(#${u}metal)" stroke="#5d6680" stroke-width="1.8"/>
        <path d="M 70 400 C 90 410, 112 410, 130 404" stroke="${goldFill(u)}" stroke-width="3" fill="none"/>
        <path d="M 84 372 C 96 362, 114 358, 132 362" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>
        <path d="M 72 418 C 92 430, 114 430, 132 420 L 128 432 C 110 440, 90 440, 74 430 Z" fill="url(#${u}metal)" stroke="#5d6680" stroke-width="1.4"/>`)}`,
    };
  },

  princess(P, u) {
    const line = shade(P.main, -0.5);
    return {
      body: `
      <path d="${torso('L 166 388 C 190 394, 210 394, 234 388 L 230 346')}" fill="url(#${u}cloth)" stroke="${line}" stroke-width="1.6" stroke-linejoin="round"/>
      ${arms(line)}
      ${frill([164, 388], [186, 396], [214, 396], [236, 388], 10, 4, '#fff', shade(P.main, -0.15))}
      ${both(`<ellipse cx="92" cy="390" rx="38" ry="31" fill="${shade(P.main, 0.25)}" stroke="${line}" stroke-width="1.6"/>
        <path d="M 70 380 C 84 400, 86 410, 82 418 M 92 362 C 96 386, 98 404, 96 420 M 114 368 C 112 390, 110 404, 112 416" stroke="${shade(P.main, -0.12)}" stroke-width="1.8" fill="none"/>
        <path d="M 72 372 C 82 364, 96 362, 108 364" stroke="#fff" stroke-width="2.4" fill="none" opacity=".6"/>`)}
      <path d="M 200 404 C 190 430, 186 470, 180 500 M 200 404 C 210 430, 214 470, 220 500" stroke="${goldFill(u)}" stroke-width="2" fill="none"/>
      <path d="M 200 420 c -8 -8 -16 0 -8 6 M 200 420 c 8 -8 16 0 8 6 M 200 452 c -8 -8 -16 0 -8 6 M 200 452 c 8 -8 16 0 8 6" stroke="${goldFill(u)}" stroke-width="1.6" fill="none"/>`,
      neck: `<path d="M 178 330 Q 200 356 222 330" stroke="${goldFill(u)}" stroke-width="1.6" fill="none"/>
        <path d="M 200 352 L 207 360 L 200 370 L 193 360 Z" fill="${P.accent}" stroke="${goldFill(u)}" stroke-width="1.6"/>`,
      head: `
      <path d="M 158 100 C 180 84, 220 84, 242 100 L 238 107 C 216 93, 184 93, 162 107 Z" fill="${goldFill(u)}" stroke="#8a6410" stroke-width="1.2"/>
      <path d="M 176 94 L 182 76 L 190 90 L 200 66 L 210 90 L 218 76 L 224 94 Z" fill="${goldFill(u)}" stroke="#8a6410" stroke-width="1.2" stroke-linejoin="round"/>
      <path d="M 200 78 L 205 86 L 200 94 L 195 86 Z" fill="${P.accent}"/>
      <circle cx="182" cy="79" r="2.4" fill="#fff"/><circle cx="218" cy="79" r="2.4" fill="#fff"/>`,
    };
  },

  sundress(P, u) {
    const line = shade(P.main, -0.45);
    let dots = '';
    [[150, 430], [178, 462], [222, 440], [252, 470], [200, 486], [140, 486], [262, 426], [196, 418]].forEach(([x, y]) => (dots += sakura(x, y, 5, '#fff', P.accent, 0.9)));
    return {
      body: `
      ${arms('#d79f8a')}
      <path d="M 138 394 C 170 408, 230 408, 262 394 C 272 432, 278 470, 282 500 L 118 500 C 122 470, 128 432, 138 394 Z" fill="url(#${u}cloth)" stroke="${line}" stroke-width="1.6"/>
      ${frill([136, 395], [168, 410], [232, 410], [264, 395], 12, 4, P.main, line)}
      ${dots}
      ${both(`<path d="M 144 397 L 151 397 L 160 358 L 153 357 Z" fill="${P.main}" stroke="${line}" stroke-width="1.2"/>`)}
      <path d="M 124 470 C 170 478, 230 478, 276 470" stroke="${P.accent}" stroke-width="7" fill="none"/>
      ${bow(236, 474, 14, P.accent, shade(P.accent, -0.5))}`,
      head: `
      <g transform="rotate(-6 200 90)">
        <path d="M 140 92 C 140 40, 260 40, 260 92 Z" fill="#f2d48c" stroke="#a9853a" stroke-width="1.6"/>
        <ellipse cx="200" cy="94" rx="132" ry="28" fill="#f6dc98" stroke="#a9853a" stroke-width="1.6"/>
        <path d="M 90 96 C 140 108, 260 108, 310 96 M 110 86 C 150 96, 250 96, 290 86" stroke="#d7b46a" stroke-width="1.4" fill="none"/>
        <path d="M 141 78 C 180 90, 220 90, 259 78 L 260 92 C 220 102, 180 102, 140 92 Z" fill="${P.accent}"/>
        ${bow(250, 88, 14, P.accent, shade(P.accent, -0.5))}
        ${sakura(156, 84, 10, '#fff', '#ffd65a')}
      </g>`,
    };
  },

  pajama(P, u) {
    const line = shade(P.main, -0.45);
    let dots = '';
    for (let y = 380; y < 500; y += 22) for (let x = 80 + ((y / 22) % 2) * 11; x < 330; x += 22) dots += `<circle cx="${x}" cy="${y}" r="3.2"/>`;
    return {
      body: `
      <defs><clipPath id="${u}pj"><path d="${torso('C 184 362, 216 362, 230 346')}"/></clipPath></defs>
      <path d="${torso('C 184 362, 216 362, 230 346')}" fill="url(#${u}cloth)" stroke="${line}" stroke-width="1.6"/>
      <g clip-path="url(#${u}pj)" fill="#fff" opacity=".55">${dots}</g>
      ${arms(line)}
      ${both(`<path d="M 170 346 C 160 362, 168 384, 190 384 L 200 366 Z" fill="${P.trim}" stroke="${line}" stroke-width="1.3" stroke-linejoin="round"/>`)}
      <path d="M 200 366 L 200 500" stroke="${line}" stroke-width="1.4"/>
      <circle cx="207" cy="400" r="4" fill="${P.accent}"/><circle cx="207" cy="432" r="4" fill="${P.accent}"/><circle cx="207" cy="464" r="4" fill="${P.accent}"/>`,
      head: `
      <path d="M 124 124 C 124 62, 196 30, 262 48 C 304 62, 334 108, 344 160 L 330 166 C 320 128, 300 100, 272 96 C 232 92, 168 102, 124 124 Z" fill="url(#${u}cloth)" stroke="${line}" stroke-width="1.6"/>
      <path d="M 120 126 C 160 98, 240 92, 282 104" stroke="#fff" stroke-width="12" stroke-linecap="round" fill="none"/>
      <circle cx="338" cy="168" r="14" fill="#fff" stroke="#d7d0e6" stroke-width="1.4"/>
      <path d="${star5(220, 70, 9)}" fill="#fff6a8" opacity=".9"/>`,
    };
  },

  bride(P, u) {
    let lace = '';
    for (let y = 352; y < 400; y += 9) for (let x = 140; x < 262; x += 9) lace += `<circle cx="${x + ((y / 9) % 2) * 4.5}" cy="${y}" r="1.5"/>`;
    return {
      back: `<path d="M 118 92 C 54 170, 34 330, 26 500 L 374 500 C 366 330, 346 170, 282 92 Z" fill="#fff" opacity=".42" stroke="#fff" stroke-width="2"/>
        <path d="M 60 300 C 54 380, 50 440, 48 500 M 340 300 C 346 380, 350 440, 352 500" stroke="#fff" stroke-width="1.4" opacity=".6"/>`,
      body: `
      <defs><clipPath id="${u}lc"><path d="${torso('C 186 352, 214 352, 230 346')}"/></clipPath></defs>
      <path d="${torso('C 186 352, 214 352, 230 346')}" fill="#fff" opacity=".35" stroke="#e8e2f0" stroke-width="1.2"/>
      <g clip-path="url(#${u}lc)" fill="#fff" opacity=".8">${lace}</g>
      <path d="${torso('L 176 394 C 186 380, 198 386, 200 396 C 202 386, 214 380, 224 394 L 230 346')}" fill="url(#${u}white)" stroke="#c9c1da" stroke-width="1.6" stroke-linejoin="round"/>
      ${arms('#c9c1da')}
      ${frill([168, 396], [180, 382], [194, 386], [200, 398], 4, 3.2, '#fff', '#d8d0e6')}
      ${frill([200, 398], [206, 386], [220, 382], [232, 396], 4, 3.2, '#fff', '#d8d0e6')}
      <path d="M 200 400 C 194 430, 186 470, 182 500 M 200 400 C 206 430, 214 470, 218 500" stroke="#e1dbec" stroke-width="2" fill="none"/>
      ${sakura(200, 440, 9, '#fff', '#ffd6e4')}`,
      neck: `<path d="M 178 330 Q 200 346 222 330" stroke="#fff" stroke-width="3" stroke-dasharray=".1 5" stroke-linecap="round" fill="none"/>`,
      head: [
        [140, 116], [158, 100], [178, 92], [200, 89], [222, 92], [242, 100], [260, 116],
      ].map(([x, y], i) => sakura(x, y, i % 2 ? 9 : 11, i % 2 ? '#ffd9e6' : '#fff', '#ffe28a')).join('') +
        `<path d="M 150 106 l -10 -6 l 2 10 Z M 250 106 l 10 -6 l -2 10 Z" fill="#8fd18f"/>`,
    };
  },

  cyber(P, u) {
    const neon = P.accent;
    return {
      body: `
      <path d="${torso('C 186 356, 214 356, 230 346')}" fill="#1a1d2c" stroke="#05060c" stroke-width="1.6"/>
      ${arms('#3c4260')}
      <path d="M 200 360 L 200 500" stroke="#3b4060" stroke-width="5"/>
      <g stroke="${neon}" stroke-width="2.6" fill="none" filter="url(#${u}glow)" stroke-linecap="round" stroke-linejoin="round">
        <path d="M 200 362 L 200 500"/>
        <path d="M 112 404 L 144 424 L 144 476 L 132 492 M 288 404 L 256 424 L 256 476 L 268 492"/>
        <path d="M 84 420 L 98 470 M 316 420 L 302 470"/>
      </g>
      ${both(`<path d="M 162 318 L 176 312 L 182 352 L 154 364 Z" fill="#262b40" stroke="#05060c" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M 74 396 C 84 372, 110 362, 136 366 L 130 396 C 112 398, 92 404, 74 396 Z" fill="#2d334c" stroke="#05060c" stroke-width="1.4"/>`)}
      <path d="M 226 430 l 10 -6 l 10 6 l 0 12 l -10 6 l -10 -6 Z" fill="none" stroke="${neon}" stroke-width="2" filter="url(#${u}glow)"/>`,
      head: `<path d="M 128 196 C 120 150, 130 120, 150 102" stroke="${neon}" stroke-width="3" fill="none" filter="url(#${u}glow)"/>
        <rect x="114" y="196" width="18" height="34" rx="6" fill="#262b40" stroke="${neon}" stroke-width="1.6"/>`,
    };
  },
};

// ---------------------------------------------------------------------------
// ACCESSORIES. layer: back | ears | face | front
// ---------------------------------------------------------------------------
export const ACCESSORIES = {
  catEars: {
    layer: 'ears',
    draw: (H) => both(`<path d="M 128 134 C 120 100, 116 70, 118 42 C 146 52, 170 72, 186 98 Z" fill="url(#${H.u}hair)" stroke="${H.line}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M 134 118 C 130 98, 126 78, 126 60 C 144 70, 158 84, 168 98 Z" fill="#ffb7cb"/>
      <path d="M 130 90 L 140 92 M 132 100 L 142 98" stroke="${H.light}" stroke-width="1.4"/>`),
  },
  foxEars: {
    layer: 'ears',
    draw: (H) => both(`<path d="M 124 140 C 106 98, 98 54, 106 18 C 142 34, 172 66, 188 100 Z" fill="url(#${H.u}hair)" stroke="${H.line}" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M 132 120 C 120 92, 114 64, 116 40 C 140 54, 160 76, 172 100 Z" fill="#fff4e4"/>
      <path d="M 106 18 C 116 22, 126 28, 134 36 C 122 36, 112 34, 108 40 Z" fill="#fff"/>`),
  },
  bunnyEars: {
    layer: 'ears',
    draw: () => `<g transform="rotate(-10 168 90)"><ellipse cx="168" cy="20" rx="20" ry="62" fill="#fff" stroke="#c8c0d8" stroke-width="1.8"/><ellipse cx="168" cy="26" rx="10" ry="46" fill="#ffc4d4"/></g>
      <g transform="rotate(18 236 90)"><path d="M 222 90 C 210 40, 214 0, 236 -12 C 252 -4, 258 20, 254 40 C 268 46, 280 58, 286 72 C 270 66, 258 62, 250 64 C 250 74, 250 82, 250 92 Z" fill="#fff" stroke="#c8c0d8" stroke-width="1.8" stroke-linejoin="round"/><ellipse cx="236" cy="30" rx="8" ry="30" fill="#ffc4d4"/></g>`,
  },
  elfEars: {
    layer: 'headback',
    draw: (H) => both(`<path d="M 134 206 C 114 196, 94 178, 74 164 C 86 194, 104 228, 136 246 Z" fill="url(#${H.u}skin)" stroke="${H.skinLine}" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M 128 214 C 112 204, 98 192, 86 182 C 98 204, 112 222, 130 234" stroke="${H.skinShadow}" stroke-width="2" fill="none"/>`),
  },
  horns: {
    layer: 'front',
    draw: (H) => both(`<path d="M 152 96 C 140 64, 116 44, 88 42 C 108 52, 124 72, 134 104 Z" fill="url(#${H.u}horn)" stroke="#1d0f22" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M 140 82 L 132 88 M 128 66 L 120 72 M 114 54 L 108 60" stroke="#6b4a7a" stroke-width="2"/>`),
  },
  halo: {
    layer: 'back',
    draw: (H) => `<g class="w-float"><ellipse cx="200" cy="34" rx="64" ry="15" fill="none" stroke="#fff3b0" stroke-width="10" opacity=".35" filter="url(#${H.u}glow)"/>
      <ellipse cx="200" cy="34" rx="64" ry="15" fill="none" stroke="url(#${H.u}gold)" stroke-width="6"/></g>`,
  },
  bow: {
    layer: 'front',
    draw: (H) => bow(260, 92, 30, H.accent, shade(H.accent, -0.5)),
  },
  flower: {
    layer: 'front',
    draw: (H) => sakura(262, 118, 18, '#ffb3cf', '#ffe066') + sakura(282, 140, 11, '#ffd1e3', '#ffe066'),
  },
  glasses: {
    layer: 'face',
    draw: () => `<g fill="rgba(210,225,255,.16)" stroke="#3b2f4a" stroke-width="3">
      <rect x="134" y="198" width="60" height="48" rx="18"/><rect x="206" y="198" width="60" height="48" rx="18"/></g>
      <path d="M 194 214 Q 200 208 206 214 M 134 212 L 124 206 M 266 212 L 276 206" stroke="#3b2f4a" stroke-width="3" fill="none"/>
      <path d="M 142 206 L 152 202 M 214 206 L 224 202" stroke="#fff" stroke-width="2.5" opacity=".7" stroke-linecap="round"/>`,
  },
  headphones: {
    layer: 'front',
    draw: (H) => `<path d="M 116 206 C 100 86, 300 86, 284 206" fill="none" stroke="#2a2335" stroke-width="12" stroke-linecap="round"/>
      <path d="M 116 206 C 100 86, 300 86, 284 206" fill="none" stroke="${H.accent}" stroke-width="4" stroke-linecap="round"/>
      ${both(`<rect x="96" y="182" width="30" height="54" rx="14" fill="#2a2335"/><rect x="100" y="188" width="22" height="42" rx="10" fill="${H.accent}"/><path d="M 106 196 L 106 220" stroke="#fff" stroke-width="2.6" opacity=".6" stroke-linecap="round"/>`)}`,
  },
  crown: {
    layer: 'front',
    draw: (H) => `<g transform="rotate(10 236 70)"><path d="M 206 82 L 208 48 L 222 64 L 236 38 L 250 64 L 264 48 L 266 82 Z" fill="url(#${H.u}gold)" stroke="#8a6410" stroke-width="1.6" stroke-linejoin="round"/>
      <circle cx="236" cy="70" r="5" fill="#ff3b6b"/><circle cx="218" cy="74" r="3.5" fill="#3bb7ff"/><circle cx="254" cy="74" r="3.5" fill="#3bb7ff"/>
      <circle cx="208" cy="48" r="3" fill="#fff6c8"/><circle cx="236" cy="38" r="3.4" fill="#fff6c8"/><circle cx="264" cy="48" r="3" fill="#fff6c8"/></g>`,
  },
  starClips: {
    layer: 'front',
    draw: (H) => `<path d="${star5(146, 150, 11, -80)}" fill="url(#${H.u}gold)" stroke="#8a6410" stroke-width="1.2"/><path d="${star5(166, 134, 8, -100)}" fill="#fff3a0" stroke="#8a6410" stroke-width="1.2"/>`,
  },
  moonPin: {
    layer: 'front',
    draw: (H) => `<path d="M 270 112 A 16 16 0 1 0 270 144 A 12 12 0 1 1 270 112 Z" fill="url(#${H.u}gold)" stroke="#8a6410" stroke-width="1.2"/><path d="${star4(282, 112, 6)}" fill="#fff6c8"/>`,
  },
  beret: {
    layer: 'front',
    draw: (H) => `<path d="M 118 116 C 116 64, 240 34, 294 86 C 304 100, 288 112, 258 106 C 214 100, 162 108, 126 124 Z" fill="${H.accent}" stroke="${shade(H.accent, -0.5)}" stroke-width="1.6"/>
      <path d="M 150 82 C 180 62, 230 56, 262 66" stroke="#fff" stroke-width="3" opacity=".35" fill="none"/><circle cx="208" cy="54" r="5" fill="${shade(H.accent, -0.2)}"/>`,
  },
  eyepatch: {
    layer: 'face',
    draw: () => `<path d="M 134 196 L 276 206 M 140 258 L 210 236" stroke="#1d1625" stroke-width="3"/>
      <path d="M 210 200 C 250 194, 266 214, 262 236 C 258 254, 228 258, 214 246 C 202 236, 200 212, 210 200 Z" fill="#251b30" stroke="#0a060f" stroke-width="1.6"/>
      <path d="${star5(236, 226, 8)}" fill="#c21e56"/>`,
  },
  angelWings: {
    layer: 'back',
    draw: (H) => both(`<g class="w-wing"><path d="M 160 380 C 120 330, 60 270, 6 252 C 18 284, 12 316, 28 338 C 26 358, 38 380, 56 392 C 60 410, 82 426, 104 428 C 124 432, 144 420, 160 400 Z" fill="url(#${H.u}wing)" stroke="#b8c6e6" stroke-width="1.6"/>
      <path d="M 28 338 C 70 344, 110 362, 150 384 M 56 392 C 90 392, 120 398, 152 394 M 104 428 C 120 418, 136 408, 156 398" stroke="#c7d3ee" stroke-width="1.6" fill="none"/></g>`),
  },
  demonWings: {
    layer: 'back',
    draw: () => both(`<g class="w-wing"><path d="M 160 372 C 120 300, 70 248, 14 226 C 26 256, 38 280, 30 302 C 48 302, 62 312, 66 332 C 84 328, 98 338, 100 356 C 116 354, 130 364, 132 380 Z" fill="#3a1d4a" stroke="#14081c" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M 160 372 L 30 302 M 160 372 L 66 332 M 160 372 L 100 356" stroke="#6b3a85" stroke-width="2" fill="none"/></g>`),
  },
  sakuraPin: {
    layer: 'front',
    draw: () => sakura(144, 152, 12, '#ffb3cf', '#ffe066') + sakura(160, 140, 8, '#ffd1e3', '#ffe066'),
  },
};
