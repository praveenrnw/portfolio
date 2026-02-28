/**
 * Retro Snake — arcade-cabinet mini-game
 *
 * Same arcade cabinet aesthetic as Pac-Man: CRT bezel, joystick, buttons.
 * Classic snake gameplay: eat food, grow longer, avoid walls & yourself.
 *
 * Usage:
 *   import { mountArcade } from './retroSnake.js';
 *   const cleanup = mountArcade(containerElement);
 *   // later: cleanup();
 */

import { injectBaseArcadeCSS } from './arcadeBase.js';

/* ════════════════════════════════════════════
   Constants
   ════════════════════════════════════════════ */

const TILE = 16;
const COLS = 20;
const ROWS = 20;
const W    = COLS * TILE;
const H    = ROWS * TILE;
const FPS  = 8;

const DIR = { NONE: 0, UP: 1, DOWN: 2, LEFT: 3, RIGHT: 4 };
const DELTA = {
  [DIR.NONE]:  { dx: 0,  dy: 0  },
  [DIR.UP]:    { dx: 0,  dy: -1 },
  [DIR.DOWN]:  { dx: 0,  dy: 1  },
  [DIR.LEFT]:  { dx: -1, dy: 0  },
  [DIR.RIGHT]: { dx: 1,  dy: 0  },
};
const OPPOSITE = {
  [DIR.UP]: DIR.DOWN, [DIR.DOWN]: DIR.UP,
  [DIR.LEFT]: DIR.RIGHT, [DIR.RIGHT]: DIR.LEFT,
};

/* ════════════════════════════════════════════
   Game State Factory
   ════════════════════════════════════════════ */

function createState() {
  const cx = Math.floor(COLS / 2);
  const cy = Math.floor(ROWS / 2);
  const snake = [
    { x: cx, y: cy },
    { x: cx + 1, y: cy },
    { x: cx + 2, y: cy },
  ];
  const state = {
    snake,
    dir: DIR.LEFT,
    nextDir: DIR.LEFT,
    food: null,
    score: 0,
    highScore: 0,
    gameOver: false,
    started: false,
    paused: false,
    tick: 0,
  };
  state.food = spawnFood(state);
  return state;
}

function spawnFood(s) {
  const occupied = new Set(s.snake.map(p => `${p.x},${p.y}`));
  let x, y;
  do {
    x = Math.floor(Math.random() * COLS);
    y = Math.floor(Math.random() * ROWS);
  } while (occupied.has(`${x},${y}`));
  return { x, y };
}

/* ════════════════════════════════════════════
   Update Logic
   ════════════════════════════════════════════ */

function update(s) {
  if (s.gameOver || s.paused || !s.started) return;
  s.tick++;

  // prevent 180° turn
  if (OPPOSITE[s.nextDir] !== s.dir) {
    s.dir = s.nextDir;
  }

  const head = s.snake[0];
  const d = DELTA[s.dir];
  const nx = head.x + d.dx;
  const ny = head.y + d.dy;

  // wall collision
  if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) {
    s.gameOver = true;
    return;
  }

  // self collision
  if (s.snake.some(p => p.x === nx && p.y === ny)) {
    s.gameOver = true;
    return;
  }

  s.snake.unshift({ x: nx, y: ny });

  // food check
  if (s.food && nx === s.food.x && ny === s.food.y) {
    s.score += 10;
    if (s.score > s.highScore) s.highScore = s.score;
    s.food = spawnFood(s);
    // don't pop tail → snake grows
  } else {
    s.snake.pop();
  }
}

/* ════════════════════════════════════════════
   Draw
   ════════════════════════════════════════════ */

function draw(ctx, s) {
  // background grid
  ctx.fillStyle = '#0a1a0a';
  ctx.fillRect(0, 0, W, H);

  // grid lines
  ctx.strokeStyle = 'rgba(0,255,0,0.06)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath(); ctx.moveTo(x * TILE, 0); ctx.lineTo(x * TILE, H); ctx.stroke();
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath(); ctx.moveTo(0, y * TILE); ctx.lineTo(W, y * TILE); ctx.stroke();
  }

  // food
  if (s.food) {
    const fx = s.food.x * TILE + TILE / 2;
    const fy = s.food.y * TILE + TILE / 2;
    ctx.fillStyle = '#FF0055';
    ctx.beginPath();
    ctx.arc(fx, fy, TILE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    // apple highlight
    ctx.fillStyle = '#FF4488';
    ctx.beginPath();
    ctx.arc(fx - 2, fy - 2, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // snake
  s.snake.forEach((seg, i) => {
    const sx = seg.x * TILE;
    const sy = seg.y * TILE;
    if (i === 0) {
      // head
      ctx.fillStyle = '#00FF41';
      ctx.fillRect(sx + 1, sy + 1, TILE - 2, TILE - 2);
      // eyes
      ctx.fillStyle = '#000';
      const d = DELTA[s.dir];
      if (d.dx === 0 && d.dy === -1) { // up
        ctx.fillRect(sx + 3, sy + 3, 3, 3);
        ctx.fillRect(sx + TILE - 6, sy + 3, 3, 3);
      } else if (d.dx === 0 && d.dy === 1) { // down
        ctx.fillRect(sx + 3, sy + TILE - 6, 3, 3);
        ctx.fillRect(sx + TILE - 6, sy + TILE - 6, 3, 3);
      } else if (d.dx === -1) { // left
        ctx.fillRect(sx + 3, sy + 3, 3, 3);
        ctx.fillRect(sx + 3, sy + TILE - 6, 3, 3);
      } else { // right
        ctx.fillRect(sx + TILE - 6, sy + 3, 3, 3);
        ctx.fillRect(sx + TILE - 6, sy + TILE - 6, 3, 3);
      }
    } else {
      // body — gradient
      const brightness = Math.max(0.3, 1 - i * 0.04);
      ctx.fillStyle = `rgba(0,${Math.floor(255 * brightness)},65,1)`;
      ctx.fillRect(sx + 1, sy + 1, TILE - 2, TILE - 2);
    }
  });

  // HUD
  ctx.fillStyle = '#00FF41';
  ctx.font = 'bold 11px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${String(s.score).padStart(5, '0')}`, 4, 2);
  ctx.textAlign = 'right';
  ctx.fillText(`HI ${String(s.highScore).padStart(5, '0')}`, W - 4, 2);
  ctx.textAlign = 'left';

  // overlays
  if (!s.started) {
    drawOverlay(ctx, 'PRESS START', '#00FF41');
  } else if (s.gameOver) {
    drawOverlay(ctx, 'GAME  OVER', '#FF0055');
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
   Arcade Machine DOM
   ════════════════════════════════════════════ */

function buildCabinetHTML() {
  return `
<div class="arcade-cabinet arcade-cabinet--snake">
  <div class="arcade-marquee arcade-marquee--snake">
    <span class="arcade-marquee-text">S N A K E</span>
  </div>
  <div class="arcade-bezel">
    <div class="arcade-screen-wrap" style="width:${W}px;height:${H}px">
      <canvas class="arcade-screen" width="${W}" height="${H}"></canvas>
      <div class="arcade-scanlines"></div>
      <div class="arcade-crt-curve"></div>
    </div>
  </div>
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
  <div class="arcade-coin-slot">
    <div class="coin-slot-hole"></div>
    <span class="coin-label">INSERT COIN</span>
  </div>
  <div class="arcade-base"></div>
</div>`;
}

/* ════════════════════════════════════════════
   Mount / Unmount API
   ════════════════════════════════════════════ */

export function mountArcade(container) {
  // inject shared base arcade cabinet CSS
  injectBaseArcadeCSS();

  // inject Snake-specific overrides (once)
  if (!document.getElementById('retro-snake-css')) {
    const style = document.createElement('style');
    style.id = 'retro-snake-css';
    style.textContent = SNAKE_CSS;
    document.head.appendChild(style);
  }

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
      state.nextDir = keyMap[e.key];
    }
    if (e.key === 'p' || e.key === 'P') {
      state.paused = !state.paused;
    }
  }
  document.addEventListener('keydown', onKey);

  // D-pad buttons
  const dirBtns = wrapper.querySelectorAll('.dpad-btn[data-dir]');
  dirBtns.forEach(btn => {
    const dirName = btn.dataset.dir;
    const dirVal = { up: DIR.UP, down: DIR.DOWN, left: DIR.LEFT, right: DIR.RIGHT }[dirName];
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!state.started) state.started = true;
      state.nextDir = dirVal;
    });
  });

  // Start / Pause buttons
  const startBtn = wrapper.querySelector('.arcade-btn-start');
  const pauseBtn = wrapper.querySelector('.arcade-btn-pause');

  startBtn.addEventListener('click', () => {
    if (state.gameOver) {
      const hi = state.highScore;
      state = createState();
      state.highScore = hi;
      state.started = true;
    } else if (!state.started) {
      state.started = true;
    }
  });

  pauseBtn.addEventListener('click', () => {
    if (state.started && !state.gameOver) {
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
      if (!state.started) state.started = true;
      return;
    }
    if (!state.started) state.started = true;
    if (Math.abs(dx) > Math.abs(dy)) {
      state.nextDir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
    } else {
      state.nextDir = dy > 0 ? DIR.DOWN : DIR.UP;
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
   CSS — injected at runtime (extends base arcade)
   ════════════════════════════════════════════ */

const SNAKE_CSS = `
.arcade-cabinet--snake {
  --cab-bg: #0a1a0a;
  --cab-bezel: #061206;
  --cab-accent: #00FF41;
  --cab-yellow: #00FF41;
  --cab-panel: #0d2b0d;
  --cab-btn: #00FF41;
  --cab-btn2: #007a1f;
}
.arcade-marquee--snake {
  background: linear-gradient(180deg, #0d3d0d 0%, #061a06 100%);
}
.arcade-marquee--snake .arcade-marquee-text {
  color: #00FF41;
  text-shadow:
    0 0 10px #00FF41,
    0 0 30px #00FF41,
    2px 2px 0 #000;
}
.arcade-cabinet--snake .arcade-btn-start {
  background: #00FF41;
  color: #000;
}
.arcade-cabinet--snake .arcade-btn-pause {
  background: #007a1f;
  color: #fff;
}
.arcade-cabinet--snake .dpad-btn:active,
.arcade-cabinet--snake .dpad-btn:hover {
  background: #00FF41;
  color: #000;
}
`;
