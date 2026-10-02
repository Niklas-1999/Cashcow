import { sleep, clamp } from '../util.js';
import { betControl, segmented } from '../ui.js';
import { sfx } from '../audio.js';
import { S } from '../state.js';

export default {
  rules: `<p>Pick a target and whether the roll must land <b>over</b> or <b>under</b> it. A number from 0.00 to 99.99 is rolled.</p>
    <ul><li>The smaller your win chance, the bigger the multiplier: <b>multiplier = 99 ÷ win chance</b>.</li>
    <li>Drag the slider, or type a multiplier / win chance directly.</li></ul><p class="muted">Return = 99%.</p>`,

  mount(root, ctx) {
    let target = 50, over = true, busy = false, autoN = 0, alive = true;
    root.innerHTML = `
    <div class="dice-panel">
      <div class="dice-result" id="res">50.00</div>
      <div class="dice-track">
        <div class="zone" id="zl"></div><div class="zone" id="zw"></div>
        <div class="dice-handle" id="handle"></div>
        <div class="dice-marker" id="marker" hidden></div>
        <input type="range" min="2" max="98" step="1" value="50" aria-label="Target">
      </div>
      <div class="dice-ticks"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
      <div class="dice-stats">
        <label>Multiplier<input id="mul" type="text" inputmode="decimal"></label>
        <label><span>Roll <span id="ou">over</span></span><input id="tg" type="text" inputmode="decimal"></label>
        <label>Win chance %<input id="ch" type="text" inputmode="decimal"></label>
      </div>
    </div>
    <div class="controls panel">
      <div class="ctl-bet"></div>
      <div class="ctl-group"><div class="ctl-label">Mode</div><div id="mode"></div></div>
      <div class="ctl-group"><div class="ctl-label">Auto rolls</div><div id="auto"></div></div>
      <div class="ctl-actions"><button class="btn primary big shine" id="roll">ROLL</button></div>
    </div>`;
    const $ = (s) => root.querySelector(s);
    const bet = betControl('dice', { initial: 100 });
    $('.ctl-bet').appendChild(bet.el);
    const range = $('input[type=range]');
    const mode = segmented([{ v: 'over', label: 'Roll Over' }, { v: 'under', label: 'Roll Under' }], 'over', (v) => { over = v === 'over'; update(); });
    $('#mode').appendChild(mode);
    const auto = segmented([{ v: 0, label: 'Off' }, { v: 10, label: '10' }, { v: 50, label: '50' }], 0, (v) => { autoN = v; if (v && !busy) roll(); });
    $('#auto').appendChild(auto);

    const chance = () => (over ? 100 - target : target);
    const mult = () => 99 / chance();
    function update() {
      range.value = target;
      const ch = chance();
      $('#zl').style.cssText = over ? `left:0;width:${target}%;background:linear-gradient(90deg,#ff4d6d,#ff6b81)` : `left:${target}%;right:0;background:linear-gradient(90deg,#ff6b81,#ff4d6d)`;
      $('#zw').style.cssText = over ? `left:${target}%;right:0;background:linear-gradient(90deg,#3ddc97,#2bb673)` : `left:0;width:${target}%;background:linear-gradient(90deg,#2bb673,#3ddc97)`;
      $('#handle').style.left = target + '%';
      $('#handle').textContent = target;
      $('#mul').value = mult().toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
      $('#tg').value = target.toFixed(2);
      $('#ch').value = ch.toFixed(2);
      $('#ou').textContent = over ? 'over' : 'under';
    }
    range.addEventListener('input', () => { target = +range.value; sfx('tick'); update(); });
    $('#mul').addEventListener('change', () => { const m = clamp(parseFloat($('#mul').value) || 2, 1.0102, 49.5); const ch = 99 / m; target = Math.round(over ? 100 - ch : ch); target = clamp(target, 2, 98); update(); });
    $('#ch').addEventListener('change', () => { const ch = clamp(parseFloat($('#ch').value) || 50, 2, 98); target = Math.round(over ? 100 - ch : ch); update(); });
    $('#tg').addEventListener('change', () => { target = clamp(Math.round(parseFloat($('#tg').value) || 50), 2, 98); update(); });
    update();

    async function roll() {
      if (busy || !alive) return;
      const b = bet.value;
      if (!ctx.bet(b)) { autoN = 0; return; }
      busy = true;
      $('#roll').disabled = true; bet.disable(true);
      const result = Math.floor(Math.random() * 10000) / 100;
      const res = $('#res');
      res.className = 'dice-result';
      sfx('roll');
      const n = S.settings.fastMode ? 6 : 12;
      for (let i = 0; i < n; i++) { res.textContent = (Math.random() * 100).toFixed(2); await sleep(35); }
      res.textContent = result.toFixed(2);
      const win = over ? result > target : result < target;
      res.className = 'dice-result ' + (win ? 'win' : 'lose');
      const mk = $('#marker');
      mk.hidden = false;
      mk.style.left = result + '%';
      mk.style.background = win ? '#2bb673' : '#e2264d';
      mk.style.borderColor = win ? '#2bb673' : '#e2264d';
      mk.textContent = result.toFixed(2);
      ctx.settle(b, win ? Math.floor(b * mult()) : 0, { anchor: res, quiet: autoN > 0 && !win });
      await sleep(autoN ? 450 : 200);
      busy = false;
      $('#roll').disabled = false; bet.disable(false); bet.refresh();
      if (autoN > 0 && alive) {
        autoN--;
        if (autoN > 0 && S.coins >= bet.value) roll();
        else { autoN = 0; auto.querySelectorAll('button').forEach((x, i) => x.classList.toggle('on', i === 0)); }
      }
    }
    $('#roll').onclick = roll;
    const onKey = (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.target.matches('input,button')) { e.preventDefault(); roll(); } };
    addEventListener('keydown', onKey);
    return () => { alive = false; autoN = 0; removeEventListener('keydown', onKey); };
  },
};
