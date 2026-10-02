import { sleep, fmt, fmtMult, shuffle } from '../util.js';
import { betControl, segmented } from '../ui.js';
import { sfx } from '../audio.js';
import { burstAt, shake } from '../fx.js';

export const minesMult = (m, k) => {
  let x = 0.99;
  for (let i = 0; i < k; i++) x *= (25 - i) / (25 - m - i);
  return x;
};

export default {
  rules: `<p>A 5×5 field hides gems and bombs. Pick how many bombs (1–24), place your bet and start revealing tiles.</p>
    <ul><li>Every gem raises your multiplier. More bombs = faster growth.</li>
    <li><b>Cash out</b> any time to bank the current multiplier.</li>
    <li>Hit a bomb and the round is lost.</li></ul><p class="muted">Return ≈ 99%. Leaving mid-round cashes out automatically.</p>`,

  mount(root, ctx) {
    let mines = 3, active = false, bomb = new Set(), opened = new Set(), curBet = 0, busy = false;
    root.innerHTML = `
    <div class="mines-layout">
      <div class="mines-grid">${Array.from({ length: 25 }, (_, i) => `<button class="tile" data-i="${i}" disabled aria-label="Tile ${i + 1}"></button>`).join('')}</div>
      <div class="mines-side panel pad">
        <div class="mult-display"><span>CURRENT MULTIPLIER</span><b id="mult">1.00×</b><div class="next-mult" id="next"></div></div>
        <div class="ctl-bet"></div>
        <div class="ctl-group"><div class="ctl-label">Bombs</div><div id="mines-sel"></div></div>
        <button class="btn primary big shine wide" id="start">START</button>
        <button class="btn gold big wide" id="cash" hidden>CASH OUT</button>
        <button class="btn ghost wide" id="rand" hidden>🎲 Random tile</button>
      </div>
    </div>`;
    const $ = (s) => root.querySelector(s);
    const tiles = [...root.querySelectorAll('.tile')];
    const bet = betControl('mines', { initial: 100 });
    $('.ctl-bet').appendChild(bet.el);
    const sel = segmented([1, 3, 5, 10, 15, 20, 24].map((v) => ({ v, label: v })), mines, (v) => { mines = v; updateInfo(); });
    $('#mines-sel').appendChild(sel);

    function updateInfo() {
      const k = opened.size;
      $('#mult').textContent = fmtMult(active ? minesMult(mines, k) : 1);
      const left = 25 - mines - k;
      $('#next').textContent = left > 0 ? `Next gem: ${fmtMult(minesMult(mines, k + 1))} · ${(left / (25 - k) * 100).toFixed(0)}% safe` : '';
      $('#cash').innerHTML = `CASH OUT <span class="sub">${active && k ? fmt(curBet * minesMult(mines, k)) : ''}</span>`;
      $('#cash').disabled = !active || k === 0;
    }

    function start() {
      if (active) return;
      const b = bet.value;
      if (!ctx.bet(b)) return;
      curBet = b; active = true;
      bomb = new Set(shuffle([...Array(25).keys()]).slice(0, mines));
      opened = new Set();
      tiles.forEach((t) => { t.className = 'tile'; t.disabled = false; });
      $('#start').hidden = true; $('#cash').hidden = false; $('#rand').hidden = false;
      bet.disable(true); sel.disable(true);
      sfx('whoosh');
      updateInfo();
    }

    async function reveal(i) {
      if (!active || busy || opened.has(i)) return;
      const t = tiles[i];
      if (bomb.has(i)) {
        busy = true;
        t.classList.add('revealed', 'bomb', 'hit');
        sfx('boom');
        shake(root.querySelector('.mines-grid'));
        await sleep(400);
        end(false);
        busy = false;
        return;
      }
      opened.add(i);
      t.classList.add('revealed', 'gem');
      t.disabled = true;
      sfx('gem');
      burstAt(t, { n: 10, speed: 5, colors: ['#5ff5ff', '#ffffff', '#b48cff'] });
      updateInfo();
      if (opened.size === 25 - mines) end(true);
    }

    function end(cashed) {
      active = false;
      tiles.forEach((t, i) => {
        t.disabled = true;
        if (!t.classList.contains('revealed')) { t.classList.add('revealed', bomb.has(i) ? 'bomb' : 'gem', 'dim'); }
      });
      const k = opened.size;
      const m = cashed ? minesMult(mines, k) : 0;
      ctx.settle(curBet, Math.floor(curBet * m), { anchor: $('.mines-grid') });
      if (cashed && m >= 10) ctx.special('mines10');
      if (cashed) sfx('cashout');
      $('#start').hidden = false; $('#cash').hidden = true; $('#rand').hidden = true;
      bet.disable(false); sel.disable(false); bet.refresh();
      $('#mult').textContent = fmtMult(m);
    }

    tiles.forEach((t, i) => t.addEventListener('click', () => reveal(i)));
    $('#start').onclick = start;
    $('#cash').onclick = () => { if (active && opened.size) end(true); };
    $('#rand').onclick = () => {
      const free = tiles.map((_, i) => i).filter((i) => !opened.has(i));
      reveal(free[Math.floor(Math.random() * free.length)]);
    };
    updateInfo();
    return () => {
      if (!active) return;
      if (opened.size) end(true);
      else { active = false; ctx.settle(curBet, curBet, { quiet: true }); }
    };
  },
};
