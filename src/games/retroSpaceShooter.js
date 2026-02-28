/**
 * Retro Space Shooter — arcade-cabinet mini-game
 *
 * Same arcade cabinet aesthetic as Pac-Man & Snake.
 * Vertical scrolling space shooter: dodge enemies, shoot lasers, survive waves.
 *
 * Usage:
 *   import { mountArcade } from './retroSpaceShooter.js';
 *   const cleanup = mountArcade(containerElement);
 *   // later: cleanup();
 */

import { injectBaseArcadeCSS } from './arcadeBase.js';

/* ════════════════════════════════════════════
   Constants
   ════════════════════════════════════════════ */

const W   = 304;
const H   = 340;
const FPS = 30;

const SHIP_W  = 24;
const SHIP_H  = 20;
const BULLET_W = 3;
const BULLET_H = 10;
const BULLET_SPEED = 6;
const ENEMY_W = 20;
const ENEMY_H = 16;
const STAR_COUNT = 60;

/* ════════════════════════════════════════════
   Game State Factory
   ════════════════════════════════════════════ */

function createState() {
  const stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 0.5 + Math.random() * 2,
      size: Math.random() < 0.3 ? 2 : 1,
    });
  }

  return {
    ship: { x: W / 2 - SHIP_W / 2, y: H - 40 },
    bullets: [],
    enemies: [],
    particles: [],
    stars,
    score: 0,
    lives: 3,
    wave: 1,
    enemySpawnTimer: 0,
    enemySpawnInterval: 45, // frames between spawns
    shootCooldown: 0,
    gameOver: false,
    started: false,
    paused: false,
    tick: 0,
    keys: { left: false, right: false, up: false, down: false, shoot: false },
  };
}

/* ════════════════════════════════════════════
   Update Logic
   ════════════════════════════════════════════ */

function update(s) {
  if (s.gameOver || s.paused || !s.started) return;
  s.tick++;

  // move ship
  const spd = 4;
  if (s.keys.left  && s.ship.x > 0) s.ship.x -= spd;
  if (s.keys.right && s.ship.x < W - SHIP_W) s.ship.x += spd;
  if (s.keys.up    && s.ship.y > 0) s.ship.y -= spd;
  if (s.keys.down  && s.ship.y < H - SHIP_H) s.ship.y += spd;

  // shooting
  if (s.shootCooldown > 0) s.shootCooldown--;
  if (s.keys.shoot && s.shootCooldown <= 0) {
    s.bullets.push({ x: s.ship.x + SHIP_W / 2 - BULLET_W / 2, y: s.ship.y - BULLET_H });
    s.shootCooldown = 8;
  }

  // move bullets
  s.bullets.forEach(b => b.y -= BULLET_SPEED);
  s.bullets = s.bullets.filter(b => b.y + BULLET_H > 0);

  // move stars
  s.stars.forEach(st => {
    st.y += st.speed;
    if (st.y > H) { st.y = 0; st.x = Math.random() * W; }
  });

  // spawn enemies
  s.enemySpawnTimer++;
  if (s.enemySpawnTimer >= s.enemySpawnInterval) {
    s.enemySpawnTimer = 0;
    const cols = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < cols; i++) {
      s.enemies.push({
        x: Math.random() * (W - ENEMY_W),
        y: -ENEMY_H - Math.random() * 30,
        speed: 1.2 + Math.random() * 1.5 + s.wave * 0.15,
        hp: 1,
        type: Math.random() < 0.2 ? 1 : 0, // type 1 = tough
      });
    }
    // increase difficulty over time
    if (s.tick % 300 === 0) {
      s.wave++;
      s.enemySpawnInterval = Math.max(15, s.enemySpawnInterval - 3);
    }
  }

  // move enemies
  s.enemies.forEach(e => {
    e.y += e.speed;
    // slight horizontal drift
    e.x += Math.sin(e.y * 0.05) * 0.5;
  });

  // bullet-enemy collision
  s.bullets = s.bullets.filter(b => {
    let hit = false;
    s.enemies.forEach(e => {
      if (e.hp <= 0) return;
      if (b.x < e.x + ENEMY_W && b.x + BULLET_W > e.x &&
          b.y < e.y + ENEMY_H && b.y + BULLET_H > e.y) {
        e.hp--;
        hit = true;
        if (e.hp <= 0) {
          s.score += e.type === 1 ? 30 : 10;
          // explosion particles
          for (let p = 0; p < 6; p++) {
            s.particles.push({
              x: e.x + ENEMY_W / 2,
              y: e.y + ENEMY_H / 2,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              life: 15 + Math.random() * 10,
              color: ['#FF0055', '#FFD60A', '#FF6B00', '#FFF'][Math.floor(Math.random() * 4)],
            });
          }
        }
      }
    });
    return !hit;
  });

  // remove dead enemies
  s.enemies = s.enemies.filter(e => e.hp > 0 && e.y < H + 20);

  // enemy-ship collision
  s.enemies = s.enemies.filter(e => {
    if (e.x < s.ship.x + SHIP_W && e.x + ENEMY_W > s.ship.x &&
        e.y < s.ship.y + SHIP_H && e.y + ENEMY_H > s.ship.y) {
      s.lives--;
      // explosion
      for (let p = 0; p < 10; p++) {
        s.particles.push({
          x: s.ship.x + SHIP_W / 2,
          y: s.ship.y + SHIP_H / 2,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 20 + Math.random() * 10,
          color: ['#00C2FF', '#FF0055', '#FFF'][Math.floor(Math.random() * 3)],
        });
      }
      if (s.lives <= 0) s.gameOver = true;
      // reset ship position
      s.ship.x = W / 2 - SHIP_W / 2;
      s.ship.y = H - 40;
      return false;
    }
    return true;
  });

  // enemies that pass off-screen bottom = lose a life
  const passed = s.enemies.filter(e => e.y >= H);
  if (passed.length > 0) {
    // just remove them, no life penalty for passing (walls only via collision)
    s.enemies = s.enemies.filter(e => e.y < H);
  }

  // update particles
  s.particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
  });
  s.particles = s.particles.filter(p => p.life > 0);
}

/* ════════════════════════════════════════════
   Draw
   ════════════════════════════════════════════ */

function draw(ctx, s) {
  // background
  ctx.fillStyle = '#020010';
  ctx.fillRect(0, 0, W, H);

  // stars
  s.stars.forEach(st => {
    ctx.fillStyle = `rgba(255,255,255,${0.3 + st.speed * 0.3})`;
    ctx.fillRect(st.x, st.y, st.size, st.size);
  });

  // bullets
  ctx.fillStyle = '#00C2FF';
  s.bullets.forEach(b => {
    ctx.fillRect(b.x, b.y, BULLET_W, BULLET_H);
    // glow
    ctx.fillStyle = 'rgba(0,194,255,0.3)';
    ctx.fillRect(b.x - 2, b.y - 1, BULLET_W + 4, BULLET_H + 2);
    ctx.fillStyle = '#00C2FF';
  });

  // enemies
  s.enemies.forEach(e => {
    if (e.type === 1) {
      // tough enemy — diamond shape
      ctx.fillStyle = '#FF6B00';
      ctx.beginPath();
      ctx.moveTo(e.x + ENEMY_W / 2, e.y);
      ctx.lineTo(e.x + ENEMY_W, e.y + ENEMY_H / 2);
      ctx.lineTo(e.x + ENEMY_W / 2, e.y + ENEMY_H);
      ctx.lineTo(e.x, e.y + ENEMY_H / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFD60A';
      ctx.fillRect(e.x + ENEMY_W / 2 - 2, e.y + ENEMY_H / 2 - 2, 4, 4);
    } else {
      // regular enemy — invader shape
      ctx.fillStyle = '#FF0055';
      ctx.fillRect(e.x + 2, e.y, ENEMY_W - 4, ENEMY_H - 4);
      ctx.fillRect(e.x, e.y + 4, ENEMY_W, ENEMY_H - 8);
      // eyes
      ctx.fillStyle = '#FFF';
      ctx.fillRect(e.x + 4, e.y + 4, 4, 4);
      ctx.fillRect(e.x + ENEMY_W - 8, e.y + 4, 4, 4);
      // antenna
      ctx.fillStyle = '#FF0055';
      ctx.fillRect(e.x + 4, e.y - 4, 2, 4);
      ctx.fillRect(e.x + ENEMY_W - 6, e.y - 4, 2, 4);
    }
  });

  // particles
  s.particles.forEach(p => {
    const alpha = p.life / 25;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.fillRect(p.x - 1, p.y - 1, 3, 3);
  });
  ctx.globalAlpha = 1;

  // ship
  if (!s.gameOver) {
    const sx = s.ship.x;
    const sy = s.ship.y;
    // body
    ctx.fillStyle = '#00C2FF';
    ctx.beginPath();
    ctx.moveTo(sx + SHIP_W / 2, sy);
    ctx.lineTo(sx + SHIP_W, sy + SHIP_H);
    ctx.lineTo(sx, sy + SHIP_H);
    ctx.closePath();
    ctx.fill();
    // cockpit
    ctx.fillStyle = '#0060AA';
    ctx.beginPath();
    ctx.moveTo(sx + SHIP_W / 2, sy + 6);
    ctx.lineTo(sx + SHIP_W / 2 + 5, sy + SHIP_H - 2);
    ctx.lineTo(sx + SHIP_W / 2 - 5, sy + SHIP_H - 2);
    ctx.closePath();
    ctx.fill();
    // engine glow
    if (s.tick % 4 < 2) {
      ctx.fillStyle = '#FFD60A';
      ctx.fillRect(sx + SHIP_W / 2 - 3, sy + SHIP_H, 6, 4);
      ctx.fillStyle = '#FF6B00';
      ctx.fillRect(sx + SHIP_W / 2 - 2, sy + SHIP_H + 3, 4, 3);
    }
  }

  // HUD
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 11px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.fillText(`SCORE ${String(s.score).padStart(5, '0')}`, 4, 2);
  ctx.fillText(`WAVE ${s.wave}`, W / 2 - 24, 2);
  // lives
  for (let i = 0; i < s.lives; i++) {
    const lx = W - 20 - i * 16;
    ctx.fillStyle = '#00C2FF';
    ctx.beginPath();
    ctx.moveTo(lx + 5, 4);
    ctx.lineTo(lx + 10, 14);
    ctx.lineTo(lx, 14);
    ctx.closePath();
    ctx.fill();
  }

  // overlays
  if (!s.started) {
    drawOverlay(ctx, 'PRESS START', '#00C2FF');
  } else if (s.gameOver) {
    drawOverlay(ctx, 'GAME  OVER', '#FF0055');
  } else if (s.paused) {
    drawOverlay(ctx, 'PAUSED', '#FFD60A');
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
<div class="arcade-cabinet arcade-cabinet--space">
  <div class="arcade-marquee arcade-marquee--space">
    <span class="arcade-marquee-text">SPACE  SHOOT</span>
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
        <button class="dpad-btn dpad-center dpad-fire" data-dir="fire" aria-label="Fire" style="cursor:pointer;pointer-events:auto;background:#e94560;border-color:#e94560;color:#fff">●</button>
        <button class="dpad-btn dpad-right" data-dir="right" aria-label="Right">▶</button>
        <button class="dpad-btn dpad-down"  data-dir="down"  aria-label="Down">▼</button>
      </div>
    </div>
    <div class="arcade-buttons-area">
      <button class="arcade-btn arcade-btn-start">START</button>
      <button class="arcade-btn arcade-btn-pause">PAUSE</button>
      <button class="arcade-btn arcade-btn-fire">FIRE</button>
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

  // inject Space Shooter-specific overrides (once)
  if (!document.getElementById('retro-space-css')) {
    const style = document.createElement('style');
    style.id = 'retro-space-css';
    style.textContent = SPACE_CSS;
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
  const keyActions = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
    W: 'up', S: 'down', A: 'left', D: 'right',
    ' ': 'shoot', z: 'shoot', Z: 'shoot',
  };

  function onKeyDown(e) {
    const action = keyActions[e.key];
    if (action) {
      e.preventDefault();
      if (!state.started) state.started = true;
      if (action === 'shoot') state.keys.shoot = true;
      else state.keys[action] = true;
    }
    if (e.key === 'p' || e.key === 'P') state.paused = !state.paused;
  }
  function onKeyUp(e) {
    const action = keyActions[e.key];
    if (action) {
      if (action === 'shoot') state.keys.shoot = false;
      else state.keys[action] = false;
    }
  }
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  // D-pad buttons
  const dirBtns = wrapper.querySelectorAll('.dpad-btn[data-dir]');
  dirBtns.forEach(btn => {
    const dir = btn.dataset.dir;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!state.started) state.started = true;
      if (dir === 'fire') state.keys.shoot = true;
      else state.keys[dir] = true;
    });
    btn.addEventListener('pointerup', () => {
      if (dir === 'fire') state.keys.shoot = false;
      else state.keys[dir] = false;
    });
    btn.addEventListener('pointerleave', () => {
      if (dir === 'fire') state.keys.shoot = false;
      else state.keys[dir] = false;
    });
  });

  // Fire button
  const fireBtn = wrapper.querySelector('.arcade-btn-fire');
  if (fireBtn) {
    fireBtn.addEventListener('pointerdown', () => {
      if (!state.started) state.started = true;
      state.keys.shoot = true;
    });
    fireBtn.addEventListener('pointerup', () => state.keys.shoot = false);
    fireBtn.addEventListener('pointerleave', () => state.keys.shoot = false);
  }

  // Start / Pause buttons
  wrapper.querySelector('.arcade-btn-start').addEventListener('click', () => {
    if (state.gameOver) {
      state = createState();
      state.started = true;
    } else if (!state.started) {
      state.started = true;
    }
  });
  wrapper.querySelector('.arcade-btn-pause').addEventListener('click', () => {
    if (state.started && !state.gameOver) state.paused = !state.paused;
  });

  // — touch swipe on canvas ——————————————
  let touchStart = null;
  canvas.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
    if (!state.started) state.started = true;
    state.keys.shoot = true;
  }, { passive: true });
  canvas.addEventListener('touchmove', (e) => {
    if (!touchStart) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    state.keys.left = dx < -8;
    state.keys.right = dx > 8;
    state.keys.up = dy < -8;
    state.keys.down = dy > 8;
  }, { passive: true });
  canvas.addEventListener('touchend', () => {
    state.keys.left = false;
    state.keys.right = false;
    state.keys.up = false;
    state.keys.down = false;
    state.keys.shoot = false;
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

  return function cleanup() {
    if (loopId) cancelAnimationFrame(loopId);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    wrapper.remove();
  };
}

/* ════════════════════════════════════════════
   CSS — injected at runtime
   ════════════════════════════════════════════ */

const SPACE_CSS = `
.arcade-cabinet--space {
  --cab-bg: #050520;
  --cab-bezel: #020015;
  --cab-accent: #00C2FF;
  --cab-yellow: #00C2FF;
  --cab-panel: #0a0a3a;
  --cab-btn: #00C2FF;
  --cab-btn2: #6a0dad;
}
.arcade-marquee--space {
  background: linear-gradient(180deg, #0a0a3a 0%, #050520 100%);
}
.arcade-marquee--space .arcade-marquee-text {
  color: #00C2FF;
  text-shadow:
    0 0 10px #00C2FF,
    0 0 30px #0066FF,
    2px 2px 0 #000;
}
.arcade-cabinet--space .arcade-btn-start {
  background: #00C2FF;
  color: #000;
}
.arcade-cabinet--space .arcade-btn-pause {
  background: #6a0dad;
  color: #fff;
}
.arcade-cabinet--space .arcade-btn-fire {
  background: #FF0055;
  color: #fff;
}
.arcade-cabinet--space .dpad-btn:active,
.arcade-cabinet--space .dpad-btn:hover {
  background: #00C2FF;
  color: #000;
}
`;
