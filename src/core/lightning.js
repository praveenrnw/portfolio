/**
 * Rain & Lightning Background Effect
 *
 * Renders continuous falling rain + occasional lightning bolts on a fixed canvas.
 *  – Steady rain with varying drop sizes, speeds, and opacity
 *  – Lightning bolts flash for 4-5 seconds with forked branches
 *  – Randomised bolt interval (~6-12s) so it feels organic
 *  – Respects prefers-reduced-motion (disabled entirely)
 *
 * Usage:
 *   import { startLightning, stopLightning } from './core/lightning.js';
 *   startLightning();
 *   stopLightning();   // cleanup
 */

/* ─── Tunables ─── */
const MIN_INTERVAL  = 6000;   // ms – minimum gap between strikes
const MAX_INTERVAL  = 12000;  // ms – maximum gap
const BOLT_SEGMENTS = 12;     // jagged segments per bolt
const BRANCH_CHANCE = 0.35;   // probability of a fork at each segment
const BRANCH_SEGS   = 5;      // segments per branch
const BOLT_WIDTH    = 2.5;    // main bolt stroke width
const BRANCH_WIDTH  = 1.5;
const FADE_DURATION = 4500;   // ms – bolt lingers 4-5 seconds
const FLASH_ALPHA   = 0.06;   // full-screen flash opacity (subtle)
const GLOW_BLUR     = 18;     // px – glow radius around bolt

/* ─── Rain tunables ─── */
const RAIN_COUNT    = 180;    // number of rain drops
const RAIN_MIN_LEN  = 12;     // shortest drop
const RAIN_MAX_LEN  = 28;     // longest drop
const RAIN_MIN_SPD  = 6;      // slowest speed (px/frame)
const RAIN_MAX_SPD  = 14;     // fastest speed
const RAIN_ANGLE    = 0.08;   // slight slant (radians, ~5°)
const RAIN_COLOR    = 'rgba(174, 194, 224,';  // steel-blue base

/* ─── Bolt colour palette (light, theme-aligned) ─── */
const BOLT_COLORS = [
  'rgba(0, 194, 255, 0.9)',   // blue
  'rgba(255, 214, 10, 0.9)',  // yellow
  'rgba(255, 255, 255, 0.9)', // white
];
const FLASH_COLORS = [
  'rgba(0, 194, 255,',        // blue flash
  'rgba(255, 214, 10,',       // yellow flash
  'rgba(255, 255, 255,',      // white flash
];

/* ─── State ─── */
let canvas    = null;
let ctx       = null;
let W = 0, H  = 0;
let timerId   = null;
let activeBolts = [];
let rafId     = null;
let running   = false;
let raindrops = [];

/* ─── Helpers ─── */
function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

/* ─── Generate a jagged bolt path ─── */
function generateBolt() {
  const colorIdx = Math.floor(Math.random() * BOLT_COLORS.length);
  const color = BOLT_COLORS[colorIdx];
  const flashColor = FLASH_COLORS[colorIdx];

  // Origin: top edge or upper portion of left/right side
  let x0, y0;
  const edge = Math.random();
  if (edge < 0.7) {
    // top edge
    x0 = rand(W * 0.05, W * 0.95);
    y0 = 0;
  } else if (edge < 0.85) {
    // left side, upper half
    x0 = 0;
    y0 = rand(0, H * 0.3);
  } else {
    // right side, upper half
    x0 = W;
    y0 = rand(0, H * 0.3);
  }

  // Target: somewhere in the lower 40–90% of viewport
  const xEnd = rand(W * 0.1, W * 0.9);
  const yEnd = rand(H * 0.4, H * 0.92);

  const segments = buildPath(x0, y0, xEnd, yEnd, BOLT_SEGMENTS);

  // Branches
  const branches = [];
  segments.forEach((pt, i) => {
    if (i > 1 && i < segments.length - 2 && Math.random() < BRANCH_CHANCE) {
      const bxEnd = pt.x + rand(-120, 120);
      const byEnd = pt.y + rand(40, 160);
      branches.push(buildPath(pt.x, pt.y, bxEnd, byEnd, BRANCH_SEGS));
    }
  });

  return {
    segments,
    branches,
    color,
    flashColor,
    born: performance.now(),
    duration: FADE_DURATION + rand(0, 500),  // 4.5–5s total
  };
}

function buildPath(x0, y0, x1, y1, count) {
  const pts = [{ x: x0, y: y0 }];
  for (let i = 1; i <= count; i++) {
    const t = i / count;
    // linear interpolation + random jitter
    const jitterX = rand(-45, 45) * (1 - t * 0.5); // less jitter near end
    const jitterY = rand(-10, 10);
    pts.push({
      x: x0 + (x1 - x0) * t + jitterX,
      y: y0 + (y1 - y0) * t + jitterY,
    });
  }
  return pts;
}

/* ─── Drawing ─── */
function drawBolt(bolt, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;

  // glow
  ctx.shadowColor = bolt.color;
  ctx.shadowBlur = GLOW_BLUR;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // main bolt
  ctx.strokeStyle = bolt.color;
  ctx.lineWidth = BOLT_WIDTH;
  tracePath(bolt.segments);
  ctx.stroke();

  // second pass for brighter core
  ctx.shadowBlur = GLOW_BLUR / 2;
  ctx.strokeStyle = 'rgba(255,255,255,' + (alpha * 0.8) + ')';
  ctx.lineWidth = BOLT_WIDTH * 0.4;
  tracePath(bolt.segments);
  ctx.stroke();

  // branches
  ctx.strokeStyle = bolt.color;
  ctx.lineWidth = BRANCH_WIDTH;
  ctx.shadowBlur = GLOW_BLUR * 0.6;
  bolt.branches.forEach(branch => {
    tracePath(branch);
    ctx.stroke();
  });

  ctx.restore();
}

function tracePath(pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
}

function drawFlash(bolt, alpha) {
  // very subtle full-screen flash
  const flashAlpha = FLASH_ALPHA * alpha;
  if (flashAlpha < 0.005) return;
  ctx.save();
  ctx.fillStyle = bolt.flashColor + flashAlpha + ')';
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/* ─── Rain ─── */
function createDrop() {
  return {
    x: rand(-40, W + 40),
    y: rand(-RAIN_MAX_LEN * 3, -RAIN_MAX_LEN),
    len: rand(RAIN_MIN_LEN, RAIN_MAX_LEN),
    speed: rand(RAIN_MIN_SPD, RAIN_MAX_SPD),
    opacity: rand(0.08, 0.28),
    width: rand(0.8, 1.6),
  };
}

function initRain() {
  raindrops = [];
  for (let i = 0; i < RAIN_COUNT; i++) {
    const drop = createDrop();
    drop.y = rand(0, H); // spread across viewport initially
    raindrops.push(drop);
  }
}

function updateAndDrawRain() {
  const dx = Math.sin(RAIN_ANGLE);
  const dy = Math.cos(RAIN_ANGLE);

  for (let i = 0; i < raindrops.length; i++) {
    const d = raindrops[i];
    d.x += dx * d.speed;
    d.y += dy * d.speed;

    // wrap when past bottom
    if (d.y > H + d.len) {
      d.x = rand(-40, W + 40);
      d.y = rand(-RAIN_MAX_LEN * 3, -RAIN_MAX_LEN);
      d.speed = rand(RAIN_MIN_SPD, RAIN_MAX_SPD);
      d.opacity = rand(0.08, 0.28);
    }

    // draw
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + dx * d.len, d.y + dy * d.len);
    ctx.strokeStyle = RAIN_COLOR + d.opacity + ')';
    ctx.lineWidth = d.width;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

/* ─── Animation loop ─── */
function tick(now) {
  if (!running) return;
  rafId = requestAnimationFrame(tick);

  ctx.clearRect(0, 0, W, H);

  // continuous rain
  updateAndDrawRain();

  // lightning bolts
  activeBolts = activeBolts.filter(bolt => {
    const elapsed = now - bolt.born;
    if (elapsed > bolt.duration) return false;

    // alpha: quick bright flash, hold briefly, then slow fade
    let alpha;
    const t = elapsed / bolt.duration;
    if (t < 0.03) {
      // instant flash in (~135ms)
      alpha = t / 0.03;
    } else if (t < 0.15) {
      // hold bright
      alpha = 1;
    } else {
      // long slow fade out over remaining ~85% of duration
      alpha = 1 - ((t - 0.15) / 0.85);
    }
    alpha = Math.max(0, Math.min(1, alpha));

    drawFlash(bolt, alpha);
    drawBolt(bolt, alpha);
    return true;
  });
}

/* ─── Scheduling ─── */
function scheduleNext() {
  if (!running) return;
  const delay = rand(MIN_INTERVAL, MAX_INTERVAL);
  timerId = setTimeout(() => {
    if (!running) return;
    activeBolts.push(generateBolt());
    // occasionally double-strike (20% chance)
    if (Math.random() < 0.2) {
      setTimeout(() => {
        if (running) activeBolts.push(generateBolt());
      }, rand(60, 180));
    }
    scheduleNext();
  }, delay);
}

/* ─── Resize ─── */
function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

/* ─── Public API ─── */

export function startLightning() {
  if (canvas) return;

  // respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  canvas = document.createElement('canvas');
  canvas.id = 'lightning-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    zIndex: '0',
    pointerEvents: 'none',
  });
  document.body.prepend(canvas);
  ctx = canvas.getContext('2d');

  resize();
  window.addEventListener('resize', resize);

  // initialize rain drops
  initRain();

  running = true;
  rafId = requestAnimationFrame(tick);
  scheduleNext();

  // fire an initial bolt after a short delay for first impression
  setTimeout(() => {
    if (running) activeBolts.push(generateBolt());
  }, 1500);
}

export function stopLightning() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
  if (timerId) clearTimeout(timerId);
  timerId = null;
  window.removeEventListener('resize', resize);
  if (canvas) { canvas.remove(); canvas = null; }
  ctx = null;
  activeBolts = [];
  raindrops = [];
}
