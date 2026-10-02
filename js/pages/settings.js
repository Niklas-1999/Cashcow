import { escapeHtml } from '../util.js';
import { S, saveSoon, exportSave, importSave, resetAll } from '../state.js';
import { applyVolumes, sfx, unlockAudio } from '../audio.js';
import { confirmDialog, toast, modal } from '../ui.js';

export function mount(view) {
  const st = S.settings;
  const toggle = (k, title, desc) => `<div class="set-row"><div class="sr-text"><b>${title}</b><span>${desc}</span></div><label class="toggle"><input type="checkbox" data-k="${k}" ${st[k] ? 'checked' : ''}><span></span></label></div>`;
  view.innerHTML = `
  <div class="page" style="max-width:820px">
    <div class="page-head"><h1>Settings</h1></div>
    <div class="panel pad">
      <h3>Profile</h3>
      <div class="set-row"><div class="sr-text"><b>Your name</b><span>What your waifus call you.</span></div>
        <input class="text-input" id="name" maxlength="18" style="width:220px;text-align:left" value="${escapeHtml(S.player.name)}"></div>
    </div>
    <div class="panel pad" style="margin-top:16px">
      <h3>Audio</h3>
      ${toggle('sfx', 'Sound effects', 'Chips, cards, reels and fanfares — all synthesized live.')}
      ${toggle('music', 'Background music', 'A procedurally generated lo-fi loop.')}
      ${toggle('voice', 'Waifu voice blips', 'Cute chirps while your partner talks.')}
      <div class="set-row"><div class="sr-text"><b>Master volume</b></div><input type="range" min="0" max="1" step="0.05" id="vol" value="${st.volume}"></div>
      <div class="set-row"><div class="sr-text"><b>Music volume</b></div><input type="range" min="0" max="1" step="0.05" id="mvol" value="${st.musicVolume}"></div>
    </div>
    <div class="panel pad" style="margin-top:16px">
      <h3>Gameplay & display</h3>
      ${toggle('fastMode', 'Fast mode', 'Speeds up reels, cards, dice and wheels.')}
      ${toggle('reduceMotion', 'Reduce motion', 'Disables falling petals and most animations.')}
    </div>
    <div class="panel pad" style="margin-top:16px">
      <h3>Save data</h3>
      <p class="muted" style="font-size:13.5px">Progress is stored in this browser only. Export it to move to another device.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn" id="export">⬇ Export save</button>
        <button class="btn" id="import">⬆ Import save</button>
        <button class="btn danger" id="reset">Reset all progress</button>
      </div>
    </div>
    <div class="panel pad" style="margin-top:16px;font-size:13.5px;line-height:1.6">
      <h3>About</h3>
      <p style="margin:0">Cashcow Waifu Casino is a free fan-made game. <b>All coins are simulated</b> — they cannot be bought, sold or withdrawn, and nothing here involves real money. All characters are original and all art, music and sounds are generated in your browser.</p>
      <p class="muted" style="margin-bottom:0">If gambling ever stops being fun in real life, please reach out to a local support service. ♡</p>
    </div>
  </div>`;
  view.querySelector('#name').addEventListener('change', (e) => { S.player.name = e.target.value.trim().slice(0, 18) || 'Senpai'; saveSoon(); toast('Name saved ♡', { icon: '✏️', duration: 1500 }); });
  view.querySelectorAll('[data-k]').forEach((cb) => cb.addEventListener('change', () => {
    st[cb.dataset.k] = cb.checked;
    if (cb.dataset.k === 'music' && cb.checked && !st.sfx) { st.sfx = true; view.querySelector('[data-k=sfx]').checked = true; }
    if (cb.dataset.k === 'reduceMotion') document.body.classList.toggle('reduce-motion', cb.checked);
    unlockAudio(); applyVolumes(); saveSoon(); sfx('click');
  }));
  view.querySelector('#vol').addEventListener('input', (e) => { st.volume = +e.target.value; applyVolumes(); saveSoon(); });
  view.querySelector('#vol').addEventListener('change', () => sfx('coin'));
  view.querySelector('#mvol').addEventListener('input', (e) => { st.musicVolume = +e.target.value; applyVolumes(); saveSoon(); });
  view.querySelector('#export').onclick = () => {
    const code = exportSave();
    const m = modal({ title: 'Export save', html: `<p class="muted">Copy this code and keep it safe.</p><textarea class="save-box" readonly>${code}</textarea>`, buttons: [{ label: 'Copy', cls: 'primary', onClick: () => { navigator.clipboard?.writeText(code); toast('Copied!', { icon: '📋', duration: 1500 }); return false; } }, { label: 'Close' }] });
    m.el.querySelector('textarea').select();
  };
  view.querySelector('#import').onclick = () => {
    const m = modal({ title: 'Import save', html: `<p class="muted">Paste a save code. This replaces your current progress.</p><textarea class="save-box" id="imp"></textarea>`,
      buttons: [{ label: 'Cancel', cls: 'ghost' }, { label: 'Import', cls: 'primary', onClick: (api) => { try { importSave(api.el.querySelector('#imp').value); } catch (e) { toast('That save code is invalid.', { type: 'warn', icon: '⚠️' }); return false; } } }] });
  };
  view.querySelector('#reset').onclick = async () => {
    if (await confirmDialog('Reset everything?', 'This deletes all coins, waifus, outfits and stats. This cannot be undone.', 'Reset', true)) resetAll();
  };
}
