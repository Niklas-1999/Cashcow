// Visual effects: animated background, particle bursts, floating text, big-win overlay.
import { rand, pick, fmt, clamp, h } from './util.js';
import { S } from './state.js';
import { sfx } from './audio.js';

const reduce = () => S.settings.reduceMotion;

// ---------------- background (petals + bokeh) ----------------
export function startBackground(canvas) {
  const c = canvas.getContext('2d');
  let W, H, dpr;
  const petals = [], bokeh = [];
  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.width = innerWidth * dpr;
    H = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
  }
  resize();
  addEventListener('resize', resize);
  const N = innerWidth < 700 ? 18 : 34;
  for (let i = 0; i < N; i++) petals.push(newPetal(true));
  for (let i = 0; i < 16; i++) bokeh.push({ x: Math.random(), y: Math.random(), r: rand(30, 110), a: rand(0.03, 0.09), hue: pick([320, 280, 45, 200]), sp: rand(0.00002, 0.00006), ph: Math.random() * 6 });
  function newPetal(init) {
    return { x: Math.random() * innerWidth, y: init ? Math.random() * innerHeight : -20, s: rand(5, 11), vy: rand(0.35, 1), vx: rand(-0.3, 0.6), rot: Math.random() * 6, vr: rand(-0.03, 0.03), sw: rand(0.6, 1.6), ph: Math.random() * 6, op: rand(0.45, 0.9) };
  }
  let last = performance.now();
  function frame(t) {
    const dt = Math.min(50, t - last) / 16.67;
    last = t;
    if (!document.hidden) {
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, W, H);
      c.scale(dpr, dpr);
      for (const b of bokeh) {
        const x = (b.x * innerWidth + Math.sin(t * b.sp * 20 + b.ph) * 40);
        const y = (b.y * innerHeight + Math.cos(t * b.sp * 15 + b.ph) * 30);
        const g = c.createRadialGradient(x, y, 0, x, y, b.r);
        g.addColorStop(0, `hsla(${b.hue},90%,70%,${b.a})`);
        g.addColorStop(1, `hsla(${b.hue},90%,70%,0)`);
        c.fillStyle = g;
        c.beginPath(); c.arc(x, y, b.r, 0, 7); c.fill();
      }
      if (!reduce()) {
        for (let i = 0; i < petals.length; i++) {
          const p = petals[i];
          p.y += p.vy * dt; p.x += (p.vx + Math.sin(t / 900 + p.ph) * p.sw * 0.5) * dt; p.rot += p.vr * dt;
          if (p.y > innerHeight + 20 || p.x > innerWidth + 30) petals[i] = newPetal(false);
          drawPetal(c, p.x, p.y, p.s, p.rot, p.op, Math.sin(t / 400 + p.ph));
        }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function drawPetal(c, x, y, s, rot, op, flip) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(1, 0.55 + Math.abs(flip) * 0.45);
  c.globalAlpha = op;
  const g = c.createLinearGradient(0, -s, 0, s);
  g.addColorStop(0, '#ffe3ef'); g.addColorStop(1, '#ff9ec7');
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, s);
  c.bezierCurveTo(s * 0.9, s * 0.3, s * 0.7, -s * 0.8, 0.15 * s, -s * 0.7);
  c.lineTo(0, -s * 0.45);
  c.lineTo(-0.15 * s, -s * 0.7);
  c.bezierCurveTo(-s * 0.7, -s * 0.8, -s * 0.9, s * 0.3, 0, s);
  c.fill();
  c.restore();
}

// ---------------- particle overlay ----------------
let pc, pctx, parts = [], running = false;
export function initParticles(canvas) {
  pc = canvas;
  pctx = canvas.getContext('2d');
  const resize = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    pc.width = innerWidth * dpr; pc.height = innerHeight * dpr;
    pc.style.width = innerWidth + 'px'; pc.style.height = innerHeight + 'px';
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize);
}

const CONFETTI = ['#ff5c93', '#ffd23a', '#6fd6ff', '#b48cff', '#7dffb0', '#ffffff', '#ff9a3c'];

function loop() {
  if (!parts.length) { running = false; pctx.clearRect(0, 0, innerWidth, innerHeight); return; }
  running = true;
  pctx.clearRect(0, 0, innerWidth, innerHeight);
  const next = [];
  for (const p of parts) {
    p.life -= 1;
    if (p.life <= 0) continue;
    p.vy += p.g; p.vx *= p.drag; p.vy *= p.drag;
    p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    const a = Math.min(1, p.life / 25);
    pctx.save();
    pctx.globalAlpha = a;
    pctx.translate(p.x, p.y);
    pctx.rotate(p.rot);
    drawParticle(p);
    pctx.restore();
    next.push(p);
  }
  parts = next;
  requestAnimationFrame(loop);
}

function drawParticle(p) {
  const c = pctx, s = p.s;
  if (p.t === 'confetti') {
    c.scale(1, Math.sin(p.life * 0.2 + p.ph));
    c.fillStyle = p.col;
    c.fillRect(-s / 2, -s / 4, s, s / 2);
  } else if (p.t === 'coin') {
    c.scale(Math.cos(p.life * 0.15 + p.ph), 1);
    const g = c.createRadialGradient(-s * 0.3, -s * 0.3, 0, 0, 0, s);
    g.addColorStop(0, '#fff6c2'); g.addColorStop(0.5, '#ffcf3a'); g.addColorStop(1, '#c78a12');
    c.fillStyle = g;
    c.beginPath(); c.arc(0, 0, s, 0, 7); c.fill();
    c.strokeStyle = '#a06c00'; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = '#b57c0b';
    c.font = `bold ${s * 1.1}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('¥', 0, 1);
  } else if (p.t === 'heart') {
    c.fillStyle = p.col;
    c.beginPath();
    c.moveTo(0, s * 0.5);
    c.bezierCurveTo(-s, -s * 0.1, -s * 0.6, -s, 0, -s * 0.45);
    c.bezierCurveTo(s * 0.6, -s, s, -s * 0.1, 0, s * 0.5);
    c.fill();
  } else if (p.t === 'star') {
    c.fillStyle = p.col;
    c.beginPath();
    c.moveTo(0, -s); c.quadraticCurveTo(0, 0, s, 0); c.quadraticCurveTo(0, 0, 0, s); c.quadraticCurveTo(0, 0, -s, 0); c.quadraticCurveTo(0, 0, 0, -s);
    c.fill();
  } else if (p.t === 'petal') {
    drawPetal(c, 0, 0, s, 0, 1, Math.sin(p.life * 0.1));
  }
}

function add(p) {
  parts.push({ drag: 0.985, g: 0.25, vr: rand(-0.2, 0.2), rot: rand(0, 6), ph: rand(0, 6), ...p });
  if (!running) requestAnimationFrame(loop);
}

export function burst(x, y, { type = 'confetti', n = 40, speed = 9, spread = Math.PI * 2, angle = -Math.PI / 2, colors = CONFETTI, size = [6, 12], life = [60, 110], gravity = 0.25 } = {}) {
  if (!pctx) return;
  if (reduce()) n = Math.ceil(n / 4);
  for (let i = 0; i < n; i++) {
    const a = angle + rand(-spread / 2, spread / 2);
    const v = rand(speed * 0.35, speed);
    add({ t: type, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: rand(size[0], size[1]), col: pick(colors), life: rand(life[0], life[1]), g: gravity });
  }
}

export function rainCoins(n = 60) {
  if (!pctx) return;
  if (reduce()) n = 12;
  for (let i = 0; i < n; i++) {
    add({ t: 'coin', x: rand(0, innerWidth), y: rand(-200, -20), vx: rand(-1, 1), vy: rand(2, 7), s: rand(8, 15), life: 160, g: 0.18, drag: 0.995 });
  }
}

export function confettiRain(n = 120) {
  if (!pctx) return;
  if (reduce()) n = 20;
  for (let i = 0; i < n; i++) add({ t: 'confetti', x: rand(0, innerWidth), y: rand(-300, -10), vx: rand(-2, 2), vy: rand(1, 5), s: rand(7, 13), col: pick(CONFETTI), life: 220, g: 0.06, drag: 0.995 });
}

export function elCenter(el) {
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}

export function burstAt(el, opts) {
  const [x, y] = elCenter(el);
  burst(x, y, opts);
}

export function hearts(el, n = 14) {
  const [x, y] = elCenter(el);
  burst(x, y - 30, { type: 'heart', n, speed: 6, colors: ['#ff5c93', '#ff8ab5', '#ffc2d8'], size: [8, 14], gravity: -0.08, life: [50, 80] });
}

// Flying coins from an element towards the coin counter
export function coinFly(fromEl, n = 10) {
  const target = document.querySelector('#coin-counter .coin-icon');
  if (!target || !fromEl || reduce()) return;
  const [fx, fy] = elCenter(fromEl);
  const [tx, ty] = elCenter(target);
  n = clamp(n, 3, 18);
  for (let i = 0; i < n; i++) {
    const c = h(`<div class="fly-coin"></div>`);
    document.body.appendChild(c);
    const sx = fx + rand(-60, 60), sy = fy + rand(-40, 40);
    c.style.left = sx + 'px'; c.style.top = sy + 'px';
    const midx = (sx + tx) / 2 + rand(-120, 120), midy = Math.min(sy, ty) - rand(40, 160);
    const anim = c.animate([
      { transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 },
      { transform: `translate(calc(-50% + ${midx - sx}px), calc(-50% + ${midy - sy}px)) scale(1.1)`, opacity: 1, offset: 0.45 },
      { transform: `translate(calc(-50% + ${tx - sx}px), calc(-50% + ${ty - sy}px)) scale(.6)`, opacity: 0.9 },
    ], { duration: 700 + i * 40, delay: i * 35, easing: 'cubic-bezier(.5,0,.5,1)', fill: 'forwards' });
    anim.onfinish = () => {
      c.remove();
      if (i % 3 === 0) sfx('coin');
      target.parentElement.classList.remove('bump'); void target.offsetWidth; target.parentElement.classList.add('bump');
    };
  }
}

export function floatText(x, y, text, cls = '') {
  const el = h(`<div class="float-text ${cls}">${text}</div>`);
  el.style.left = x + 'px'; el.style.top = y + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}
export function floatAt(el, text, cls) {
  const [x, y] = elCenter(el);
  floatText(x, y, text, cls);
}

export function countUp(el, from, to, dur = 800, format = fmt) {
  const t0 = performance.now();
  cancelAnimationFrame(el._cu);
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = format(from + (to - from) * e);
    if (k < 1) el._cu = requestAnimationFrame(step);
  };
  el._cu = requestAnimationFrame(step);
}

export function shake(el, cls = 'shake') {
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 600);
}

// ---------------- big win overlay ----------------
export function bigWin(amount, mult) {
  const tier = mult >= 50 ? ['LEGENDARY WIN', 'legend'] : mult >= 20 ? ['MEGA WIN', 'mega'] : ['BIG WIN', 'big'];
  const el = h(`<div class="bigwin ${tier[1]}">
    <div class="bw-rays"></div>
    <div class="bw-inner">
      <div class="bw-title">${tier[0].split('').map((ch, i) => `<span style="--i:${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('')}</div>
      <div class="bw-amount">+<span>0</span></div>
      <div class="bw-mult">${mult.toFixed(mult >= 100 ? 0 : 2)}×</div>
      <div class="bw-hint">tap to continue</div>
    </div></div>`);
  document.body.appendChild(el);
  sfx('bigwin');
  rainCoins(tier[1] === 'legend' ? 140 : tier[1] === 'mega' ? 90 : 60);
  confettiRain(tier[1] === 'big' ? 60 : 140);
  countUp(el.querySelector('.bw-amount span'), 0, amount, 1800);
  return new Promise((res) => {
    const close = () => { el.classList.add('out'); setTimeout(() => { el.remove(); res(); }, 400); };
    el.addEventListener('click', close);
    setTimeout(close, 4200);
  });
}
