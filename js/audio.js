// Fully synthesized sound effects + procedural background music (WebAudio).
import { S } from './state.js';

let ctx, master, sfxBus, musicBus, noiseBuf;

function init() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4;
  master.connect(comp).connect(ctx.destination);
  sfxBus = ctx.createGain();
  musicBus = ctx.createGain();
  sfxBus.connect(master);
  musicBus.connect(master);
  // shared white-noise buffer
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  applyVolumes();
  return ctx;
}

export function applyVolumes() {
  if (!ctx) return;
  master.gain.value = S.settings.volume;
  sfxBus.gain.value = S.settings.sfx ? 0.9 : 0;
  musicBus.gain.value = S.settings.music ? S.settings.musicVolume : 0;
  if (S.settings.music) startMusic(); else stopMusic();
}

export function unlockAudio() {
  init();
  if (ctx && ctx.state === 'suspended') ctx.resume();
  applyVolumes();
}

const now = () => ctx.currentTime;

function tone(freq, { type = 'sine', dur = 0.15, vol = 0.2, attack = 0.005, release, at = 0, slide, dest, detune = 0 } = {}) {
  const t = now() + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  o.detune.value = detune;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + (release ?? dur));
  o.connect(g).connect(dest || sfxBus);
  o.start(t);
  o.stop(t + (release ?? dur) + 0.05);
}

function noise({ dur = 0.1, vol = 0.2, at = 0, filter = 'bandpass', freq = 2000, q = 1, sweep } = {}) {
  const t = now() + at;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = filter; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(sfxBus);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.05);
}

const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // midi -> Hz

const SFX = {
  click() { tone(1200, { type: 'triangle', dur: 0.05, vol: 0.12 }); },
  hover() { tone(2400, { type: 'sine', dur: 0.03, vol: 0.03 }); },
  tab() { tone(880, { type: 'triangle', dur: 0.06, vol: 0.1 }); tone(1320, { type: 'triangle', dur: 0.08, vol: 0.08, at: 0.04 }); },
  chip() { noise({ dur: 0.04, vol: 0.35, freq: 3500, q: 3 }); noise({ dur: 0.05, vol: 0.25, freq: 2600, q: 4, at: 0.035 }); },
  card() { noise({ dur: 0.12, vol: 0.25, freq: 1800, q: 0.7, sweep: 5000 }); },
  flip() { noise({ dur: 0.07, vol: 0.2, freq: 3000, q: 1 }); tone(600, { type: 'triangle', dur: 0.05, vol: 0.05 }); },
  tick() { tone(1800, { type: 'square', dur: 0.015, vol: 0.04 }); },
  reelStop() { tone(140, { type: 'sine', dur: 0.12, vol: 0.3, slide: 70 }); noise({ dur: 0.05, vol: 0.12, freq: 900 }); },
  coin() { tone(N(88), { type: 'square', dur: 0.06, vol: 0.05 }); tone(N(95), { type: 'square', dur: 0.2, vol: 0.05, at: 0.06 }); },
  win() {
    [72, 76, 79, 84].forEach((n, i) => { tone(N(n), { type: 'triangle', dur: 0.25, vol: 0.14, at: i * 0.07 }); tone(N(n + 12), { type: 'sine', dur: 0.2, vol: 0.05, at: i * 0.07 }); });
  },
  bigwin() {
    const seq = [72, 76, 79, 84, 79, 84, 88, 91];
    seq.forEach((n, i) => { tone(N(n), { type: 'square', dur: 0.18, vol: 0.06, at: i * 0.09 }); tone(N(n), { type: 'triangle', dur: 0.3, vol: 0.12, at: i * 0.09 }); });
    [60, 64, 67, 72].forEach((n) => tone(N(n), { type: 'sawtooth', dur: 1.4, vol: 0.035, at: 0.72, attack: 0.05 }));
    for (let i = 0; i < 10; i++) tone(N(96 + (i % 5) * 2), { type: 'sine', dur: 0.08, vol: 0.04, at: 0.75 + i * 0.06 });
  },
  lose() { tone(N(64), { type: 'triangle', dur: 0.18, vol: 0.12 }); tone(N(59), { type: 'triangle', dur: 0.35, vol: 0.12, at: 0.15, slide: N(55) }); },
  push() { tone(N(67), { type: 'triangle', dur: 0.12, vol: 0.1 }); tone(N(67), { type: 'triangle', dur: 0.12, vol: 0.1, at: 0.12 }); },
  pop() { tone(500, { type: 'sine', dur: 0.08, vol: 0.18, slide: 1100 }); },
  error() { tone(160, { type: 'square', dur: 0.15, vol: 0.06 }); tone(130, { type: 'square', dur: 0.2, vol: 0.06, at: 0.1 }); },
  heart() { [79, 84, 88].forEach((n, i) => tone(N(n), { type: 'sine', dur: 0.4, vol: 0.1, at: i * 0.08 })); },
  boom() { noise({ dur: 0.6, vol: 0.6, filter: 'lowpass', freq: 1200, sweep: 80 }); tone(90, { type: 'sine', dur: 0.5, vol: 0.4, slide: 30 }); },
  gem() { [88, 91, 96].forEach((n, i) => tone(N(n), { type: 'sine', dur: 0.15, vol: 0.08, at: i * 0.04 })); },
  whoosh() { noise({ dur: 0.35, vol: 0.2, freq: 400, q: 0.8, sweep: 4000 }); },
  roll() { for (let i = 0; i < 8; i++) noise({ dur: 0.03, vol: 0.25, freq: 2000 + Math.random() * 2000, q: 3, at: i * 0.05 + Math.random() * 0.02 }); },
  shimmer() { for (let i = 0; i < 14; i++) tone(N(84 + ((i * 5) % 17)), { type: 'sine', dur: 0.25, vol: 0.04, at: i * 0.05 }); },
  summon() {
    tone(N(48), { type: 'sawtooth', dur: 2.2, vol: 0.05, attack: 0.6, slide: N(60) });
    tone(N(55), { type: 'sawtooth', dur: 2.2, vol: 0.04, attack: 0.6, slide: N(67) });
    noise({ dur: 2, vol: 0.12, freq: 300, q: 0.6, sweep: 6000 });
  },
  reveal(r = 'R') {
    const chords = { R: [72, 76, 79], SR: [74, 78, 81, 86], SSR: [76, 80, 83, 88, 92], UR: [72, 76, 79, 84, 88, 91, 96] };
    chords[r].forEach((n, i) => { tone(N(n), { type: 'triangle', dur: 0.8, vol: 0.09, at: i * 0.06 }); tone(N(n + 12), { type: 'sine', dur: 0.6, vol: 0.04, at: i * 0.06 }); });
    if (r === 'SSR' || r === 'UR') SFX.shimmer();
  },
  levelup() { [67, 72, 76, 79, 84].forEach((n, i) => tone(N(n), { type: 'square', dur: 0.12, vol: 0.05, at: i * 0.08 })); tone(N(88), { type: 'triangle', dur: 0.6, vol: 0.12, at: 0.42 }); },
  buy() { tone(N(84), { type: 'triangle', dur: 0.08, vol: 0.12 }); tone(N(91), { type: 'triangle', dur: 0.25, vol: 0.12, at: 0.07 }); SFX.coin(); },
  crash() { noise({ dur: 0.8, vol: 0.5, filter: 'lowpass', freq: 3000, sweep: 100 }); tone(400, { type: 'sawtooth', dur: 0.6, vol: 0.08, slide: 60 }); },
  cashout() { [76, 83, 88].forEach((n, i) => tone(N(n), { type: 'square', dur: 0.1, vol: 0.06, at: i * 0.05 })); SFX.coin(); },
  peg() { tone(1400 + Math.random() * 900, { type: 'sine', dur: 0.04, vol: 0.04 }); },
  scratch() { noise({ dur: 0.05, vol: 0.06, freq: 5000, q: 0.5 }); },
};

export function sfx(name, arg) {
  if (!S.settings.sfx) return;
  if (!init()) return;
  if (ctx.state === 'suspended') return;
  try { SFX[name]?.(arg); } catch (e) { /* ignore audio errors */ }
}

// cute "voice" blips while a speech bubble types out
let lastBlip = 0;
export function voiceBlip(pitch = 1) {
  if (!S.settings.sfx || !S.settings.voice || !init() || ctx.state === 'suspended') return;
  const t = performance.now();
  if (t - lastBlip < 55) return;
  lastBlip = t;
  const f = 520 * pitch * (0.9 + Math.random() * 0.25);
  tone(f, { type: 'triangle', dur: 0.05, vol: 0.06, slide: f * 1.15 });
}

// ---------------- procedural music ----------------
let musicTimer = null, step = 0, nextT = 0;
const BPM = 88, STEP = 60 / BPM / 2; // eighth notes
// I - V - vi - IV in F major, with 7ths for a dreamy feel
const PROG = [
  [53, 57, 60, 64], [48, 52, 55, 59], [50, 53, 57, 60], [46, 50, 53, 57],
];
const SCALE = [65, 67, 69, 72, 74, 77, 79, 81];
let melody = [];
function genMelody() {
  melody = [];
  let idx = 3;
  for (let i = 0; i < 64; i++) {
    if (Math.random() < 0.42) { melody.push(null); continue; }
    idx = Math.max(0, Math.min(SCALE.length - 1, idx + Math.floor(Math.random() * 5) - 2));
    melody.push(SCALE[idx]);
  }
}
function schedule() {
  while (nextT < ctx.currentTime + 0.25) {
    const bar = Math.floor(step / 8) % 4;
    const chord = PROG[bar];
    const s8 = step % 8;
    const at = nextT - ctx.currentTime;
    if (s8 === 0) {
      chord.forEach((n) => tone(N(n), { type: 'triangle', dur: STEP * 8, vol: 0.035, attack: 0.25, release: STEP * 8, at, dest: musicBus }));
      tone(N(chord[0] - 12), { type: 'sine', dur: STEP * 3, vol: 0.12, at, dest: musicBus });
    }
    if (s8 === 4) tone(N(chord[0] - 12), { type: 'sine', dur: STEP * 2, vol: 0.09, at, dest: musicBus });
    if (s8 % 2 === 1) tone(N(chord[(s8 >> 1) % 4] + 12), { type: 'sine', dur: STEP, vol: 0.025, at, dest: musicBus });
    const m = melody[step % 64];
    if (m) tone(N(m), { type: 'triangle', dur: STEP * 1.6, vol: 0.05, at, dest: musicBus, detune: 4 });
    // soft hats
    if (s8 % 2 === 0) {
      const src = ctx.createBufferSource(); src.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 8000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.025, nextT); g.gain.exponentialRampToValueAtTime(0.0001, nextT + 0.04);
      src.connect(f).connect(g).connect(musicBus); src.start(nextT, Math.random()); src.stop(nextT + 0.06);
    }
    step++;
    if (step % 64 === 0) genMelody();
    nextT += STEP;
  }
}
function startMusic() {
  if (musicTimer || !ctx) return;
  genMelody();
  step = 0;
  nextT = ctx.currentTime + 0.1;
  musicTimer = setInterval(schedule, 80);
}
function stopMusic() {
  clearInterval(musicTimer);
  musicTimer = null;
}
