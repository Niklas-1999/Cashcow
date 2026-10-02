// Shared UI components: toasts, modals, bet selector, small render helpers.
import { h, fmt, fmtShort, clamp, escapeHtml } from './util.js';
import { S, canAfford } from './state.js';
import { sfx } from './audio.js';
import { RARITY } from './waifu/data.js';

export const coinIcon = '<i class="coin-i"></i>';
export const coins = (n) => `<span class="coins-inline">${coinIcon}${fmt(n)}</span>`;
export const stars = (r, filled = RARITY[r].stars) => `<span class="stars r-${r}">${'★'.repeat(filled)}</span>`;
export const rarityBadge = (r) => `<span class="rarity-badge r-${r}">${r}</span>`;

// ---------------- toasts ----------------
export function toast(html, { type = 'info', icon = '', duration = 3200 } = {}) {
  let wrap = document.getElementById('toasts');
  const el = h(`<div class="toast t-${type}">${icon ? `<span class="toast-icon">${icon}</span>` : ''}<div class="toast-body">${html}</div></div>`);
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  setTimeout(() => {
    el.classList.remove('in');
    el.classList.add('out');
    setTimeout(() => el.remove(), 400);
  }, duration);
  while (wrap.children.length > 5) wrap.firstChild.remove();
}

// ---------------- modals ----------------
const stack = [];
export function modal({ title = '', html = '', cls = '', onClose, closable = true, buttons } = {}) {
  const el = h(`<div class="modal-back ${cls}">
    <div class="modal" role="dialog" aria-modal="true">
      ${closable ? '<button class="modal-x" aria-label="Close">✕</button>' : ''}
      ${title ? `<h2 class="modal-title">${title}</h2>` : ''}
      <div class="modal-body">${html}</div>
      ${buttons ? `<div class="modal-actions">${buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-i="${i}">${b.label}</button>`).join('')}</div>` : ''}
    </div></div>`);
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('in'));
  sfx('pop');
  let closed = false;
  const close = (v) => {
    if (closed) return;
    closed = true;
    el.classList.remove('in');
    el.classList.add('out');
    setTimeout(() => el.remove(), 300);
    const i = stack.indexOf(api); if (i >= 0) stack.splice(i, 1);
    onClose?.(v);
  };
  const api = { el, close, body: el.querySelector('.modal-body') };
  stack.push(api);
  if (closable) {
    el.querySelector('.modal-x').onclick = () => close();
    el.addEventListener('pointerdown', (e) => { if (e.target === el) close(); });
  }
  buttons?.forEach((b, i) => {
    el.querySelector(`.modal-actions [data-i="${i}"]`).onclick = () => {
      const r = b.onClick?.(api);
      if (r !== false) close(b.value);
    };
  });
  return api;
}
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && stack.length) stack[stack.length - 1].close();
});

export function confirmDialog(title, html, okLabel = 'Confirm', danger = false) {
  return new Promise((res) => {
    modal({
      title, html, cls: 'small', onClose: (v) => res(!!v),
      buttons: [{ label: 'Cancel', cls: 'ghost', value: false }, { label: okLabel, cls: danger ? 'danger' : 'primary', value: true }],
    });
  });
}

// ---------------- bet selector ----------------
const lastBets = {};
export function betControl(game, { min = 10, max = 1000000, initial = 100, onChange, label = 'Bet' } = {}) {
  let value = lastBets[game] ?? initial;
  const el = h(`<div class="bet-control">
    <div class="bet-label">${label}</div>
    <div class="bet-row">
      <button class="bet-btn" data-a="half" title="Half">½</button>
      <button class="bet-btn" data-a="minus" title="Decrease">−</button>
      <div class="bet-input-wrap">${coinIcon}<input class="bet-input" type="text" inputmode="numeric" aria-label="Bet amount"></div>
      <button class="bet-btn" data-a="plus" title="Increase">+</button>
      <button class="bet-btn" data-a="double" title="Double">2×</button>
      <button class="bet-btn max" data-a="max" title="Max">MAX</button>
    </div>
    <div class="bet-quick">${[10, 50, 100, 500, 1000, 5000, 25000].map((v) => `<button class="chip-btn" data-v="${v}">${fmtShort(v)}</button>`).join('')}</div>
  </div>`);
  const input = el.querySelector('.bet-input');
  const steps = [10, 20, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
  const set = (v, silent) => {
    v = Math.floor(Number(String(v).replace(/[^\d]/g, '')) || 0);
    value = clamp(v, min, Math.max(min, Math.min(max, S.coins || min)));
    if (S.coins < min) value = min;
    input.value = fmt(value);
    lastBets[game] = value;
    el.classList.toggle('too-much', !canAfford(value));
    if (!silent) onChange?.(value);
  };
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    sfx('chip');
    const a = b.dataset.a;
    if (b.dataset.v) set(+b.dataset.v);
    else if (a === 'half') set(value / 2);
    else if (a === 'double') set(value * 2);
    else if (a === 'max') set(Math.min(max, S.coins));
    else if (a === 'plus') set(steps.find((s) => s > value) ?? value);
    else if (a === 'minus') set([...steps].reverse().find((s) => s < value) ?? min);
  });
  input.addEventListener('change', () => set(input.value));
  input.addEventListener('focus', () => input.select());
  set(value, true);
  return {
    el,
    get value() { return value; },
    set value(v) { set(v); },
    refresh() { set(value, true); },
    disable(d) { el.classList.toggle('disabled', d); el.querySelectorAll('button,input').forEach((b) => (b.disabled = d)); },
  };
}

// Generic segmented selector
export function segmented(options, value, onChange) {
  const el = h(`<div class="segmented">${options.map((o) => `<button data-v="${escapeHtml(o.v)}" class="${o.v == value ? 'on' : ''}">${o.label}</button>`).join('')}</div>`);
  el.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    sfx('click');
    el.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    onChange(isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v);
  });
  el.disable = (d) => el.querySelectorAll('button').forEach((b) => (b.disabled = d));
  return el;
}

export function helpButton(title, html) {
  const b = h(`<button class="btn ghost small help-btn" title="How to play">? Rules</button>`);
  b.onclick = () => modal({ title, html: `<div class="rules">${html}</div>` });
  return b;
}
