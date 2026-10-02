import { h, sleep, fmt } from '../util.js';
import { betControl, segmented, toast } from '../ui.js';
import { sfx } from '../audio.js';
import { S, partner } from '../state.js';
import { renderWaifu } from '../waifu/render.js';
import { burstAt, rainCoins } from '../fx.js';
import { react } from '../companion.js';
import { SYMS, PAY, SCATTER, LINES, NLINES, FS_MULT, spinGrid, evaluate, randSym } from './slots-math.js';

const LINE_COLORS = ['#ff5c93', '#ffd23a', '#6fe3ff', '#7dffb0', '#b48cff', '#ff9a3c', '#ff6fd8', '#3d7bff', '#f4f1ff', '#3ddc97'];

const G = (id, a, b) => `<defs><radialGradient id="${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
export const SYM_SVG = {
  sakura: `<svg viewBox="0 0 100 100">${G('sk', '#ffe3ef', '#ff5c9a')}${[0, 72, 144, 216, 288].map((a) => `<path d="M50 50 C 34 36, 36 14, 50 10 C 64 14, 66 36, 50 50 Z" fill="url(#sk)" stroke="#c2185b" stroke-width="2" transform="rotate(${a} 50 50)"/>`).join('')}<circle cx="50" cy="50" r="8" fill="#ffd23a" stroke="#c78a12" stroke-width="2"/></svg>`,
  dango: `<svg viewBox="0 0 100 100"><path d="M50 6 L50 96" stroke="#b07a3a" stroke-width="5" stroke-linecap="round"/>${[['#ff9ec7', '#d6417e', 24], ['#fff8ee', '#d6c2a8', 50], ['#9be08a', '#3f8f3a', 76]].map(([a, b, y], i) => `${G('dg' + i, a, b)}<circle cx="50" cy="${y}" r="16" fill="url(#dg${i})" stroke="${b}" stroke-width="2"/><ellipse cx="44" cy="${y - 6}" rx="5" ry="3" fill="#fff" opacity=".7"/>`).join('')}</svg>`,
  bell: `<svg viewBox="0 0 100 100"><defs><linearGradient id="bl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#f2c14e"/><stop offset="1" stop-color="#b8861f"/></linearGradient></defs><path d="M50 12 C 30 12, 24 30, 24 50 C 24 64, 18 70, 12 76 L 88 76 C 82 70, 76 64, 76 50 C 76 30, 70 12, 50 12 Z" fill="url(#bl)" stroke="#8a6410" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="84" r="8" fill="#e0a015" stroke="#8a6410" stroke-width="3"/><path d="M36 30 C 34 40, 34 50, 36 58" stroke="#fff" stroke-width="5" opacity=".6" fill="none" stroke-linecap="round"/><rect x="44" y="5" width="12" height="9" rx="3" fill="#b8861f"/></svg>`,
  ribbon: `<svg viewBox="0 0 100 100">${G('rb', '#ff9ab0', '#c8143c')}<path d="M50 50 L 34 92 L 46 84 L 52 94 L 56 52 Z M50 50 L 66 92 L 56 86 L 50 94 Z" fill="#b0102f" stroke="#6e0a1e" stroke-width="2.5" stroke-linejoin="round"/><path d="M50 50 C 30 18, 2 24, 8 50 C 12 72, 36 66, 50 50 Z" fill="url(#rb)" stroke="#6e0a1e" stroke-width="3"/><path d="M50 50 C 70 18, 98 24, 92 50 C 88 72, 64 66, 50 50 Z" fill="url(#rb)" stroke="#6e0a1e" stroke-width="3"/><ellipse cx="50" cy="50" rx="10" ry="12" fill="#e01e4b" stroke="#6e0a1e" stroke-width="3"/><path d="M18 40 C 22 32, 30 30, 36 34" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/></svg>`,
  star: `<svg viewBox="0 0 100 100"><defs><linearGradient id="st" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbd0"/><stop offset=".5" stop-color="#ffd23a"/><stop offset="1" stop-color="#ff9a00"/></linearGradient></defs><path d="M50 6 L62 36 L94 38 L69 59 L77 92 L50 74 L23 92 L31 59 L6 38 L38 36 Z" fill="url(#st)" stroke="#b86a00" stroke-width="3.5" stroke-linejoin="round"/><path d="M50 22 L56 40" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".7"/><circle cx="42" cy="54" r="3.5" fill="#7a4100"/><circle cx="58" cy="54" r="3.5" fill="#7a4100"/><path d="M45 62 Q 50 67 55 62" stroke="#7a4100" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
  gem: `<svg viewBox="0 0 100 100"><defs><linearGradient id="gm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8ffff"/><stop offset=".5" stop-color="#4fd6ff"/><stop offset="1" stop-color="#1a5bd8"/></linearGradient></defs><path d="M24 14 L76 14 L94 38 L50 92 L6 38 Z" fill="url(#gm)" stroke="#123a8a" stroke-width="3.5" stroke-linejoin="round"/><path d="M6 38 L94 38 M24 14 L36 38 L50 14 L64 38 L76 14 M36 38 L50 92 L64 38" stroke="#123a8a" stroke-width="2" fill="none" opacity=".6"/><path d="M26 22 L32 32" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>`,
  seven: `<svg viewBox="0 0 100 100"><defs><linearGradient id="sv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a9a"/><stop offset=".5" stop-color="#ff1f4b"/><stop offset="1" stop-color="#a00026"/></linearGradient></defs><path d="M18 14 L84 14 L84 28 C 64 46, 52 68, 48 90 L 26 90 C 30 66, 44 44, 60 30 L 18 30 Z" fill="url(#sv)" stroke="#ffd23a" stroke-width="5" stroke-linejoin="round"/><path d="M24 20 L70 20" stroke="#fff" stroke-width="3.5" opacity=".6" stroke-linecap="round"/></svg>`,
  scatter: `<svg viewBox="0 0 100 100"><defs><radialGradient id="sc" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff6c2"/><stop offset=".5" stop-color="#ffcf3a"/><stop offset="1" stop-color="#b8861f"/></radialGradient></defs><circle cx="50" cy="50" r="44" fill="url(#sc)" stroke="#8a6410" stroke-width="4"/><circle cx="50" cy="50" r="34" fill="none" stroke="#8a6410" stroke-width="2" stroke-dasharray="4 4"/><path d="M50 66 C 38 58, 30 50, 30 42 C 30 34, 40 30, 50 40 C 60 30, 70 34, 70 42 C 70 50, 62 58, 50 66 Z" fill="#ff3e7f" stroke="#fff" stroke-width="2.5"/><text x="50" y="86" text-anchor="middle" font-size="13" font-weight="900" fill="#7a4100" font-family="sans-serif">FREE</text></svg>`,
};
export const uri = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.includes('xmlns=') ? svg : svg.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" '));

export default {
  rules: `<p>Spin 5 reels across <b>10 fixed paylines</b>. Your bet is split evenly between the lines.</p>
    <ul><li>Wins pay left-to-right on consecutive reels, starting from reel 1.</li>
    <li>Your partner waifu is the <b>WILD</b> — she substitutes for every symbol except the coin.</li>
    <li>3, 4 or 5 <b>FREE coins</b> anywhere award <b>5 / 10 / 15 free spins</b> and pay 2× / 10× / 50× your bet. All free-spin wins are <b>doubled</b>, and they can retrigger.</li></ul>
    <h3>Paytable (× line bet)</h3>
    <table><tr><th>Symbol</th><th>3</th><th>4</th><th>5</th></tr>
    ${['wild', 'seven', 'gem', 'star', 'ribbon', 'bell', 'dango', 'sakura'].map((s) => `<tr><td>${s === 'wild' ? 'Waifu WILD' : s[0].toUpperCase() + s.slice(1)}</td>${PAY[s].map((p) => `<td>${p}</td>`).join('')}</tr>`).join('')}</table>
    <p class="muted">Theoretical return ≈ 96%.</p>`,

  mount(root, ctx) {
    const p = partner();
    const wildSvg = p ? renderWaifu(p, { expr: 'wink', anim: false }).replace('viewBox="0 -30 400 530"', 'viewBox="96 92 208 208"') : SYM_SVG.star;
    const IMG = Object.fromEntries(Object.entries(SYM_SVG).map(([k, v]) => [k, uri(v)]));
    IMG.wild = uri(wildSvg);
    const symHtml = (s) => `<div class="sym s-${s}"><img src="${IMG[s]}" alt="${s}" draggable="false">${s === 'wild' ? '<span class="wild-tag">WILD</span>' : ''}</div>`;

    root.innerHTML = `
    <div class="slot-machine">
      <div class="slot-marquee">
        <div class="marquee-lights"></div>
        <div class="slot-title">SAKURA ✿ SLOTS</div>
        <div class="slot-display"><span class="sd-label">WIN</span><span class="sd-val" id="win">0</span></div>
        <div class="fs-banner" id="fs" hidden>FREE SPINS <b id="fs-n">0</b> · ×${FS_MULT}</div>
      </div>
      <div class="slot-window">
        <div class="reels">${[0, 1, 2, 3, 4].map((i) => `<div class="reel" data-r="${i}"><div class="strip"></div></div>`).join('')}</div>
        <svg class="paylines" viewBox="0 0 500 300" preserveAspectRatio="none"></svg>
        <div class="line-tags">${LINES.map((_, i) => `<span style="--lc:${LINE_COLORS[i]};top:${[50, 16.7, 83.3, 16.7, 83.3, 16.7, 83.3, 50, 50, 16.7][i]}%">${i + 1}</span>`).join('')}</div>
      </div>
    </div>
    <div class="controls panel">
      <div class="ctl-bet"></div>
      <div class="ctl-actions slot-actions">
        <div class="auto-wrap"><div class="ctl-label">Autoplay</div></div>
        <button class="btn primary big shine spin-btn" id="spin"><span>SPIN</span></button>
      </div>
    </div>`;
    const $ = (s) => root.querySelector(s);
    const reels = [...root.querySelectorAll('.reel')];
    const svg = $('.paylines');
    const bet = betControl('slots', { initial: 100, label: 'Total bet (10 lines)' });
    $('.ctl-bet').appendChild(bet.el);
    let autoLeft = 0;
    const auto = segmented([{ v: 0, label: 'Off' }, { v: 10, label: '10' }, { v: 25, label: '25' }, { v: 100, label: '100' }], 0, (v) => { autoLeft = v; if (v && !spinning) go(); });
    $('.auto-wrap').appendChild(auto);
    const lights = $('.marquee-lights');
    lights.innerHTML = Array.from({ length: 28 }, (_, i) => `<i style="--i:${i}"></i>`).join('');

    let grid = spinGrid();
    let spinning = false, freeSpins = 0, fsTotal = 0, fsBet = 0, alive = true;
    reels.forEach((r, i) => (r.querySelector('.strip').innerHTML = grid[i].map(symHtml).join('')));

    function cellH() { return reels[0].clientHeight / 3; }

    async function spinReels(newGrid) {
      const fast = S.settings.fastMode;
      clearWins();
      const promises = reels.map((reel, i) => {
        const strip = reel.querySelector('.strip');
        const filler = Array.from({ length: 14 + i * 4 }, () => randSym());
        const syms = [...newGrid[i], ...filler, ...grid[i]];
        strip.innerHTML = syms.map(symHtml).join('');
        const ch = cellH();
        const start = -(syms.length - 3) * ch;
        strip.style.transform = `translateY(${start}px)`;
        reel.classList.add('spinning');
        const dur = (fast ? 500 : 900) + i * (fast ? 140 : 260);
        const anim = strip.animate([
          { transform: `translateY(${start}px)`, easing: 'cubic-bezier(.35,0,.6,1)' },
          { transform: `translateY(${ch * 0.18}px)`, offset: 0.9, easing: 'ease-out' },
          { transform: 'translateY(0px)' },
        ], { duration: dur, fill: 'forwards' });
        return anim.finished.then(() => {
          strip.style.transform = 'translateY(0px)';
          anim.cancel();
          strip.innerHTML = newGrid[i].map(symHtml).join('');
          reel.classList.remove('spinning');
          sfx('reelStop');
        });
      });
      // ticking sound while spinning
      let ticking = true;
      (async () => { while (ticking) { sfx('tick'); await sleep(70); } })();
      await Promise.all(promises);
      ticking = false;
      grid = newGrid;
    }

    function clearWins() {
      svg.innerHTML = '';
      root.querySelectorAll('.sym.win').forEach((s) => s.classList.remove('win'));
      root.querySelectorAll('.line-tags span').forEach((s) => s.classList.remove('on'));
    }
    function showWins(ev) {
      let paths = '';
      for (const l of ev.lines) {
        const pts = LINES[l.li].map((row, reel) => [50 + reel * 100, 50 + row * 100]);
        paths += `<polyline points="${pts.map((p) => p.join(',')).join(' ')}" fill="none" stroke="${LINE_COLORS[l.li]}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" opacity=".9" class="pl"/>`;
        LINES[l.li].slice(0, l.count).forEach((row, reel) => reels[reel].querySelectorAll('.sym')[row]?.classList.add('win'));
        root.querySelectorAll('.line-tags span')[l.li].classList.add('on');
      }
      ev.scatterPos.forEach(([reel, row]) => { if (ev.scatters >= 3) reels[reel].querySelectorAll('.sym')[row]?.classList.add('win'); });
      svg.innerHTML = paths;
    }

    async function go() {
      if (spinning || !alive) return;
      const free = freeSpins > 0;
      const b = free ? fsBet : bet.value;
      if (!free && !ctx.bet(b)) { autoLeft = 0; return; }
      spinning = true;
      $('#spin').disabled = true;
      bet.disable(true);
      if (free) { freeSpins--; $('#fs-n').textContent = freeSpins; }
      const ng = spinGrid();
      await spinReels(ng);
      if (!alive) return;
      const ev = evaluate(ng);
      let win = (ev.lineTotal * b) / NLINES;
      let newSpins = 0;
      if (ev.scatters >= 3) {
        const sc = SCATTER[Math.min(5, ev.scatters)];
        win += sc.pay * b;
        newSpins = free ? 5 : sc.spins;
      }
      if (free) win *= FS_MULT;
      win = Math.floor(win);
      showWins(ev);
      const winEl = $('#win');
      winEl.textContent = fmt(win);
      if (win > 0) { winEl.parentElement.classList.remove('flash'); void winEl.offsetWidth; winEl.parentElement.classList.add('flash'); }

      if (free) {
        fsTotal += win;
        if (win > 0) { sfx('coin'); burstAt($('.slot-window'), { n: 20 }); }
      } else {
        ctx.settle(b, win, { anchor: $('.slot-window') });
      }
      if (newSpins) {
        if (!free) { fsBet = b; fsTotal = 0; }
        freeSpins += newSpins;
        ctx.special('freespins');
        $('#fs').hidden = false;
        $('#fs-n').textContent = freeSpins;
        sfx('reveal', 'SSR');
        toast(`<b>${newSpins} FREE SPINS!</b> All wins ×${FS_MULT}`, { type: 'gold', icon: '🎰' });
        react('bigwin', { force: true });
        rainCoins(30);
        await sleep(1200);
      }
      if (free && freeSpins === 0) {
        await sleep(500);
        $('#fs').hidden = true;
        toast(`Free spins finished: <b>+${fmt(fsTotal)}</b>`, { type: 'gold', icon: '🎰' });
        ctx.settle(0, fsTotal, { anchor: $('.slot-window'), multBase: fsBet });
      }
      spinning = false;
      $('#spin').disabled = false;
      bet.disable(false);
      bet.refresh();
      await sleep(win > 0 ? (S.settings.fastMode ? 500 : 900) : 250);
      if (!alive) return;
      if (freeSpins > 0) return go();
      if (autoLeft > 0) {
        autoLeft--;
        if (autoLeft === 0 || S.coins < bet.value) { autoLeft = 0; auto.querySelectorAll('button').forEach((x, i) => x.classList.toggle('on', i === 0)); return; }
        go();
      }
    }

    $('#spin').onclick = () => go();
    const onKey = (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.target.matches('input,button')) { e.preventDefault(); go(); } };
    addEventListener('keydown', onKey);
    return () => { alive = false; autoLeft = 0; removeEventListener('keydown', onKey); };
  },
};
