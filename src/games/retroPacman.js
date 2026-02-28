/**
 * Retro Pac-Man — arcade-cabinet mini-game
 *
 * Renders a pixel-art arcade machine frame (CRT bezel, joystick, buttons)
 * and runs a classic Pac-Man maze inside the "screen".
 *
 * Usage:
 *   import { mountArcade, unmountArcade } from './retroPacman.js';
 *   const cleanup = mountArcade(containerElement);
 *   // later: cleanup();
 */

/* ════════════════════════════════════════════
   Constants
   ════════════════════════════════════════════ */

const TILE   = 16;       // px per tile — scales with CSS transform
const COLS   = 19;
const ROWS   = 21;
const W      = COLS * TILE;
const H      = ROWS * TILE;
const FPS    = 7;         // neutral retro speed
const DOT_R  = 2;
const POWER_R = 5;

// Directions
const DIR = { NONE: 0, UP: 1, DOWN: 2, LEFT: 3, RIGHT: 4 };
const DELTA = {
  [DIR.NONE]:  { dx: 0,  dy: 0  },
  [DIR.UP]:    { dx: 0,  dy: -1 },
  [DIR.DOWN]:  { dx: 0,  dy: 1  },
  [DIR.LEFT]:  { dx: -1, dy: 0  },
  [DIR.RIGHT]: { dx: 1,  dy: 0  },
};

// 0 = wall, 1 = dot, 2 = power pellet, 3 = empty, 4 = ghost-house
const MAP_TEMPLATE = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
  [0,2,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,2,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,1,0],
  [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
  [0,0,0,0,1,0,0,0,3,0,3,0,0,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,3,3,3,3,3,3,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,0,0,4,0,0,3,0,1,0,0,0,0],
  [3,3,3,3,1,3,3,0,4,4,4,0,3,3,1,3,3,3,3],
  [0,0,0,0,1,0,3,0,0,0,0,0,3,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,3,3,3,3,3,3,0,1,0,0,0,0],
  [0,0,0,0,1,0,3,0,0,0,0,0,3,0,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,0,0,1,0,1,0,0,0,1,0,0,1,0],
  [0,2,1,0,1,1,1,1,1,3,1,1,1,1,1,0,1,2,0],
  [0,0,1,0,1,0,1,0,0,0,0,0,1,0,1,0,1,0,0],
  [0,1,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,1,0],
  [0,1,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

/* ════════════════════════════════════════════
   Game State Factory
   ════════════════════════════════════════════ */

function createState() {
  // deep-clone map
  const map = MAP_TEMPLATE.map(r => [...r]);

  let totalDots = 0;
  map.forEach(row => row.forEach(c => { if (c === 1 || c === 2) totalDots++; }));

  return {
    map,
    pacman: { x: 9, y: 15, dir: DIR.LEFT, nextDir: DIR.LEFT, mouthOpen: true },
    ghosts: [
      { x: 9,  y: 9,  dir: DIR.UP,   color: '#FF0000', scared: false, home: true, homeTimer: 0 },
      { x: 8,  y: 9,  dir: DIR.UP,   color: '#FFB8FF', scared: false, home: true, homeTimer: 30 },
      { x: 10, y: 9,  dir: DIR.UP,   color: '#00FFFF', scared: false, home: true, homeTimer: 60 },
      { x: 9,  y: 8,  dir: DIR.DOWN, color: '#FFB852', scared: false, home: true, homeTimer: 90 },
    ],
    score: 0,
    totalDots,
    dotsEaten: 0,
    lives: 3,
    level: 1,
    powerTimer: 0,
    gameOver: false,
    win: false,
    tick: 0,
    paused: false,
    started: false,
  };
}

/* ════════════════════════════════════════════
   Helpers
   ════════════════════════════════════════════ */

function canMove(map, x, y) {
  if (y < 0 || y >= ROWS) return false;
  // tunnel wrap
  if (x < 0 || x >= COLS) return true;
  const t = map[y][x];
  return t !== 0;
}

function wrap(x, y) {
  if (x < 0) x = COLS - 1;
  if (x >= COLS) x = 0;
  return { x, y };
}

function randDir() {
  return [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT][Math.floor(Math.random() * 4)];
}

/* ════════════════════════════════════════════
   Update Logic
   ════════════════════════════════════════════ */

function update(s) {
  if (s.gameOver || s.win || s.paused || !s.started) return;
  s.tick++;
  s.pacman.mouthOpen = s.tick % 2 === 0;

  // try nextDir first
  const nd = DELTA[s.pacman.nextDir];
  const nx = s.pacman.x + nd.dx;
  const ny = s.pacman.y + nd.dy;
  if (canMove(s.map, nx, ny)) {
    s.pacman.dir = s.pacman.nextDir;
  }

  // move pacman
  const d = DELTA[s.pacman.dir];
  const px = s.pacman.x + d.dx;
  const py = s.pacman.y + d.dy;
  if (canMove(s.map, px, py)) {
    const w = wrap(px, py);
    s.pacman.x = w.x;
    s.pacman.y = w.y;
  }

  // eat dot
  const tile = s.map[s.pacman.y]?.[s.pacman.x];
  if (tile === 1) {
    s.map[s.pacman.y][s.pacman.x] = 3;
    s.score += 10;
    s.dotsEaten++;
  } else if (tile === 2) {
    s.map[s.pacman.y][s.pacman.x] = 3;
    s.score += 50;
    s.dotsEaten++;
    s.powerTimer = 50;  // ~5 sec at 10fps
    s.ghosts.forEach(g => { if (!g.home) g.scared = true; });
  }

  // power timer
  if (s.powerTimer > 0) {
    s.powerTimer--;
    if (s.powerTimer <= 0) {
      s.ghosts.forEach(g => g.scared = false);
    }
  }

  // win check
  if (s.dotsEaten >= s.totalDots) {
    s.win = true;
    return;
  }

  // move ghosts
  s.ghosts.forEach(g => {
    if (g.home) {
      g.homeTimer--;
      if (g.homeTimer <= 0) {
        g.home = false;
        g.x = 9;
        g.y = 7;
        g.dir = DIR.UP;
      }
      return;
    }

    // simple chase / scatter AI
    const dirs = [DIR.UP, DIR.DOWN, DIR.LEFT, DIR.RIGHT];
    const opposite = { [DIR.UP]: DIR.DOWN, [DIR.DOWN]: DIR.UP, [DIR.LEFT]: DIR.RIGHT, [DIR.RIGHT]: DIR.LEFT };
    const valid = dirs.filter(dd => {
      if (dd === opposite[g.dir]) return false;
      const { dx, dy } = DELTA[dd];
      return canMove(s.map, g.x + dx, g.y + dy);
    });

    if (valid.length === 0) {
      // reverse as last resort
      const { dx, dy } = DELTA[opposite[g.dir]];
      if (canMove(s.map, g.x + dx, g.y + dy)) {
        g.dir = opposite[g.dir];
      }
    } else if (valid.length === 1) {
      g.dir = valid[0];
    } else {
      // if scared → random; otherwise rough chase toward pacman
      if (g.scared) {
        g.dir = valid[Math.floor(Math.random() * valid.length)];
      } else {
        // pick direction that minimises distance to pacman
        let best = valid[0];
        let bestDist = Infinity;
        valid.forEach(dd => {
          const { dx, dy } = DELTA[dd];
          const tx = g.x + dx;
          const ty = g.y + dy;
          const dist = Math.abs(tx - s.pacman.x) + Math.abs(ty - s.pacman.y);
          if (dist < bestDist) { bestDist = dist; best = dd; }
        });
        g.dir = best;
      }
    }

    const { dx, dy } = DELTA[g.dir];
    const gx = g.x + dx;
    const gy = g.y + dy;
    if (canMove(s.map, gx, gy)) {
      const w = wrap(gx, gy);
      g.x = w.x;
      g.y = w.y;
    }
  });

  // collision check
  s.ghosts.forEach(g => {
    if (g.home) return;
    if (g.x === s.pacman.x && g.y === s.pacman.y) {
      if (g.scared) {
        // eat ghost → send home
        g.home = true;
        g.homeTimer = 30;
        g.scared = false;
        g.x = 9; g.y = 9;
        s.score += 200;
      } else {
        // lose a life
        s.lives--;
        if (s.lives <= 0) {
          s.gameOver = true;
        } else {
          // reset positions
          s.pacman.x = 9; s.pacman.y = 15; s.pacman.dir = DIR.LEFT; s.pacman.nextDir = DIR.LEFT;
          s.ghosts.forEach(gg => {
            gg.home = true;
            gg.homeTimer = gg === s.ghosts[0] ? 0 : 30 * (s.ghosts.indexOf(gg));
            gg.scared = false;
          });
          s.powerTimer = 0;
        }
      }
    }
  });
}

/* ════════════════════════════════════════════
   Draw
   ════════════════════════════════════════════ */

function draw(ctx, s) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  // map
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const t = s.map[r][c];
      const cx = c * TILE + TILE / 2;
      const cy = r * TILE + TILE / 2;
      if (t === 0) {
        ctx.fillStyle = '#1a1aff';
        ctx.fillRect(c * TILE + 1, r * TILE + 1, TILE - 2, TILE - 2);
      } else if (t === 1) {
        ctx.fillStyle = '#ffb8ae';
        ctx.beginPath();
        ctx.arc(cx, cy, DOT_R, 0, Math.PI * 2);
        ctx.fill();
      } else if (t === 2) {
        ctx.fillStyle = '#ffb8ae';
        ctx.beginPath();
        ctx.arc(cx, cy, POWER_R, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // pacman
  const px = s.pacman.x * TILE + TILE / 2;
  const py = s.pacman.y * TILE + TILE / 2;
  ctx.fillStyle = '#FFFF00';
  ctx.beginPath();
  if (s.pacman.mouthOpen) {
    const angles = {
      [DIR.RIGHT]: [0.25, 1.75],
      [DIR.LEFT]:  [1.25, 0.75],
      [DIR.UP]:    [1.75, 1.25],
      [DIR.DOWN]:  [0.75, 0.25],
      [DIR.NONE]:  [0.25, 1.75],
    };
    const [sa, ea] = angles[s.pacman.dir] || angles[DIR.RIGHT];
    ctx.arc(px, py, TILE / 2 - 1, sa * Math.PI, ea * Math.PI);
    ctx.lineTo(px, py);
  } else {
    ctx.arc(px, py, TILE / 2 - 1, 0, Math.PI * 2);
  }
  ctx.fill();

  // ghosts
  s.ghosts.forEach(g => {
    if (g.home) return;
    const gx = g.x * TILE + TILE / 2;
    const gy = g.y * TILE + TILE / 2;
    ctx.fillStyle = g.scared ? (s.powerTimer < 15 && s.tick % 2 ? '#FFF' : '#0000FF') : g.color;
    // body
    ctx.beginPath();
    ctx.arc(gx, gy - 2, TILE / 2 - 1, Math.PI, 0);
    ctx.lineTo(gx + TILE / 2 - 1, gy + TILE / 2 - 1);
    // wavy bottom
    const segs = 3;
    const segW = (TILE - 2) / segs;
    for (let i = segs - 1; i >= 0; i--) {
      const bx = gx - TILE / 2 + 1 + i * segW;
      ctx.lineTo(bx + segW / 2, gy + TILE / 2 - 5);
      ctx.lineTo(bx, gy + TILE / 2 - 1);
    }
    ctx.fill();
    // eyes
    if (!g.scared) {
      ctx.fillStyle = '#FFF';
      ctx.beginPath(); ctx.arc(gx - 3, gy - 3, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(gx + 3, gy - 3, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(gx - 2, gy - 2, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(gx + 4, gy - 2, 1.5, 0, Math.PI * 2); ctx.fill();
    }
  });

  // HUD
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 11px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(`SCORE ${String(s.score).padStart(5, '0')}`, 4, 2);
  // lives
  for (let i = 0; i < s.lives; i++) {
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(W - 18 - i * 18, 10, 6, 0.25 * Math.PI, 1.75 * Math.PI);
    ctx.lineTo(W - 18 - i * 18, 10);
    ctx.fill();
  }

  // overlays
  if (!s.started) {
    drawOverlay(ctx, 'PRESS START', '#FFD60A');
  } else if (s.gameOver) {
    drawOverlay(ctx, 'GAME  OVER', '#FF0055');
  } else if (s.win) {
    drawOverlay(ctx, 'YOU  WIN!', '#00FF00');
  } else if (s.paused) {
    drawOverlay(ctx, 'PAUSED', '#00C2FF');
  }
}

function drawOverlay(ctx, text, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, H / 2 - 24, W, 48);
  ctx.fillStyle = color;
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, H / 2);
  ctx.textAlign = 'start';
}

/* ════════════════════════════════════════════
   Arcade Machine DOM  — retro cabinet look
   ════════════════════════════════════════════ */

function buildCabinetHTML() {
  return `
<div class="arcade-cabinet">
  <!-- Marquee / Header -->
  <div class="arcade-marquee">
    <span class="arcade-marquee-text">PAC-MAN</span>
  </div>

  <!-- CRT Screen Bezel -->
  <div class="arcade-bezel">
    <div class="arcade-screen-wrap">
      <canvas class="arcade-screen" width="${W}" height="${H}"></canvas>
      <div class="arcade-scanlines"></div>
      <div class="arcade-crt-curve"></div>
    </div>
  </div>

  <!-- Control Panel -->
  <div class="arcade-controls">
    <div class="arcade-joystick-area">
      <div class="arcade-joystick-base">
        <div class="arcade-joystick-stick"></div>
      </div>
      <div class="arcade-dpad">
        <button class="dpad-btn dpad-up"    data-dir="up"    aria-label="Up">▲</button>
        <button class="dpad-btn dpad-left"  data-dir="left"  aria-label="Left">◀</button>
        <button class="dpad-btn dpad-center"></button>
        <button class="dpad-btn dpad-right" data-dir="right" aria-label="Right">▶</button>
        <button class="dpad-btn dpad-down"  data-dir="down"  aria-label="Down">▼</button>
      </div>
    </div>
    <div class="arcade-buttons-area">
      <button class="arcade-btn arcade-btn-start">START</button>
      <button class="arcade-btn arcade-btn-pause">PAUSE</button>
    </div>
  </div>

  <!-- Coin Slot -->
  <div class="arcade-coin-slot">
    <div class="coin-slot-hole"></div>
    <span class="coin-label">INSERT COIN</span>
  </div>

  <!-- Base / Stand -->
  <div class="arcade-base"></div>
</div>`;
}

/* ════════════════════════════════════════════
   Mount / Unmount API
   ════════════════════════════════════════════ */

export function mountArcade(container) {
  // inject styles (once)
  if (!document.getElementById('retro-pacman-css')) {
    const style = document.createElement('style');
    style.id = 'retro-pacman-css';
    style.textContent = ARCADE_CSS;
    document.head.appendChild(style);
  }

  // build DOM
  const wrapper = document.createElement('div');
  wrapper.className = 'arcade-wrapper';
  wrapper.innerHTML = buildCabinetHTML();
  container.appendChild(wrapper);

  const canvas = wrapper.querySelector('.arcade-screen');
  const ctx = canvas.getContext('2d');

  let state = createState();

  // — input ———————————————————————————————
  const keyMap = {
    ArrowUp: DIR.UP, ArrowDown: DIR.DOWN, ArrowLeft: DIR.LEFT, ArrowRight: DIR.RIGHT,
    w: DIR.UP, s: DIR.DOWN, a: DIR.LEFT, d: DIR.RIGHT,
    W: DIR.UP, S: DIR.DOWN, A: DIR.LEFT, D: DIR.RIGHT,
  };

  function onKey(e) {
    if (keyMap[e.key] !== undefined) {
      e.preventDefault();
      if (!state.started) state.started = true;
      state.pacman.nextDir = keyMap[e.key];
    }
    if (e.key === 'p' || e.key === 'P') {
      state.paused = !state.paused;
    }
  }
  document.addEventListener('keydown', onKey);

  // D-pad buttons (touch + click)
  const dirBtns = wrapper.querySelectorAll('.dpad-btn[data-dir]');
  dirBtns.forEach(btn => {
    const dirName = btn.dataset.dir;
    const dirVal = { up: DIR.UP, down: DIR.DOWN, left: DIR.LEFT, right: DIR.RIGHT }[dirName];
    const handler = (e) => {
      e.preventDefault();
      if (!state.started) state.started = true;
      state.pacman.nextDir = dirVal;
    };
    btn.addEventListener('pointerdown', handler);
  });

  // Start / Pause buttons
  const startBtn = wrapper.querySelector('.arcade-btn-start');
  const pauseBtn = wrapper.querySelector('.arcade-btn-pause');

  startBtn.addEventListener('click', () => {
    if (state.gameOver || state.win) {
      state = createState();
      state.started = true;
    } else if (!state.started) {
      state.started = true;
    }
  });

  pauseBtn.addEventListener('click', () => {
    if (state.started && !state.gameOver && !state.win) {
      state.paused = !state.paused;
    }
  });

  // — touch swipe on canvas ——————————————
  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  canvas.addEventListener('touchend', (e) => {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      // tap → start
      if (!state.started) state.started = true;
      return;
    }
    if (!state.started) state.started = true;
    if (Math.abs(dx) > Math.abs(dy)) {
      state.pacman.nextDir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
    } else {
      state.pacman.nextDir = dy > 0 ? DIR.DOWN : DIR.UP;
    }
    touchStart = null;
  }, { passive: true });

  // — game loop ——————————————————————————
  let loopId = null;
  let lastTime = 0;
  const interval = 1000 / FPS;

  function loop(ts) {
    loopId = requestAnimationFrame(loop);
    if (ts - lastTime < interval) return;
    lastTime = ts;
    update(state);
    draw(ctx, state);
  }
  loopId = requestAnimationFrame(loop);

  // — cleanup ————————————————————————————
  return function cleanup() {
    if (loopId) cancelAnimationFrame(loopId);
    document.removeEventListener('keydown', onKey);
    wrapper.remove();
  };
}

/* ════════════════════════════════════════════
   CSS — injected at runtime
   ════════════════════════════════════════════ */

const ARCADE_CSS = `
/* ─── Arcade Wrapper ─── */
.arcade-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

/* ─── Cabinet ─── */
.arcade-cabinet {
  --cab-bg: #1a1a2e;
  --cab-bezel: #0f0f23;
  --cab-accent: #e94560;
  --cab-yellow: #f7d716;
  --cab-panel: #16213e;
  --cab-btn: #e94560;
  --cab-btn2: #533483;

  width: 340px;
  background: var(--cab-bg);
  border: 6px solid #000;
  border-radius: 18px 18px 4px 4px;
  box-shadow: 10px 10px 0 #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
  font-family: 'Press Start 2P', 'Courier New', monospace;
  user-select: none;
  -webkit-user-select: none;
}

/* ─── Marquee ─── */
.arcade-marquee {
  width: 100%;
  background: linear-gradient(180deg, #e94560 0%, #c32148 100%);
  border-bottom: 5px solid #000;
  text-align: center;
  padding: 14px 0 10px;
  position: relative;
  overflow: hidden;
}
.arcade-marquee::before,
.arcade-marquee::after {
  content: '●';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: var(--cab-yellow);
  text-shadow: 0 0 6px var(--cab-yellow);
  animation: marquee-blink 1s infinite alternate;
}
.arcade-marquee::before { left: 14px; }
.arcade-marquee::after  { right: 14px; }
@keyframes marquee-blink {
  0%   { opacity: 1; }
  100% { opacity: 0.3; }
}
.arcade-marquee-text {
  font-size: 22px;
  font-weight: 900;
  color: var(--cab-yellow);
  letter-spacing: 6px;
  text-shadow:
    0 0 10px var(--cab-yellow),
    0 0 30px var(--cab-accent),
    2px 2px 0 #000;
}

/* ─── Bezel ─── */
.arcade-bezel {
  background: var(--cab-bezel);
  border: 5px solid #000;
  border-radius: 8px;
  margin: 14px 14px 10px;
  padding: 10px;
  box-shadow:
    inset 0 0 20px rgba(0,0,0,0.8),
    0 0 8px rgba(0,0,0,0.6);
}

.arcade-screen-wrap {
  position: relative;
  width: ${W}px;
  height: ${H}px;
  overflow: hidden;
  border-radius: 4px;
  border: 3px solid #333;
}

.arcade-screen {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

/* CRT scanlines */
.arcade-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0,0,0,0.12) 0px,
    rgba(0,0,0,0.12) 1px,
    transparent 1px,
    transparent 3px
  );
  pointer-events: none;
  border-radius: 4px;
}

/* CRT curve reflection */
.arcade-crt-curve {
  position: absolute;
  inset: 0;
  border-radius: 4px;
  background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.07) 0%, transparent 60%);
  pointer-events: none;
}

/* ─── Controls ─── */
.arcade-controls {
  width: 100%;
  background: var(--cab-panel);
  border-top: 5px solid #000;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Joystick visual */
.arcade-joystick-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.arcade-joystick-base {
  width: 50px;
  height: 50px;
  background: radial-gradient(circle, #333 40%, #111 100%);
  border-radius: 50%;
  border: 3px solid #555;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.1), 0 4px 8px rgba(0,0,0,0.5);
}
.arcade-joystick-stick {
  width: 18px;
  height: 18px;
  background: radial-gradient(circle at 35% 35%, #888 0%, #333 100%);
  border-radius: 50%;
  border: 2px solid #555;
  box-shadow: 0 2px 3px rgba(0,0,0,0.6);
}

/* D-Pad */
.arcade-dpad {
  display: grid;
  grid-template-columns: repeat(3, 32px);
  grid-template-rows: repeat(3, 32px);
  gap: 2px;
}
.dpad-btn {
  background: #2a2a4a;
  border: 2px solid #444;
  border-radius: 4px;
  color: #ccc;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 80ms;
  -webkit-tap-highlight-color: transparent;
}
.dpad-btn:active, .dpad-btn:hover {
  background: var(--cab-accent);
  color: #fff;
}
.dpad-center {
  background: #1a1a2e;
  border-color: #222;
  cursor: default;
  pointer-events: none;
}
.dpad-up    { grid-column: 2; grid-row: 1; }
.dpad-left  { grid-column: 1; grid-row: 2; }
.dpad-center{ grid-column: 2; grid-row: 2; }
.dpad-right { grid-column: 3; grid-row: 2; }
.dpad-down  { grid-column: 2; grid-row: 3; }

/* Action buttons */
.arcade-buttons-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.arcade-btn {
  padding: 10px 16px;
  border: 3px solid #000;
  border-radius: 24px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 2px;
  cursor: pointer;
  text-transform: uppercase;
  box-shadow: 0 4px 0 #000;
  transition: transform 60ms, box-shadow 60ms;
  -webkit-tap-highlight-color: transparent;
}
.arcade-btn:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 #000;
}
.arcade-btn-start {
  background: var(--cab-accent);
  color: #fff;
}
.arcade-btn-pause {
  background: var(--cab-btn2);
  color: #fff;
}

/* ─── Coin Slot ─── */
.arcade-coin-slot {
  width: 100%;
  background: #111;
  border-top: 4px solid #000;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.coin-slot-hole {
  width: 44px;
  height: 8px;
  background: #000;
  border: 2px solid #444;
  border-radius: 4px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.8);
}
.coin-label {
  font-size: 8px;
  color: #888;
  letter-spacing: 2px;
}

/* ─── Base ─── */
.arcade-base {
  width: 100%;
  height: 16px;
  background: linear-gradient(180deg, #0a0a1a 0%, #000 100%);
  border-radius: 0 0 4px 4px;
}

/* ─── Responsive ─── */
@media (max-width: 400px) {
  .arcade-cabinet {
    width: 98vw;
    max-width: 340px;
  }
  .arcade-screen-wrap {
    width: clamp(260px, 80vw, ${W}px);
    height: auto;
    aspect-ratio: ${W} / ${H};
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .arcade-marquee::before,
  .arcade-marquee::after { animation: none; }
}
`;
