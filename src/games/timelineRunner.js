// Simple Timeline Runner: player auto-runs, tap to jump and collect badges
// start(rootSection, canvasElement, cardsArray) -> returns stop()

function rand(min, max) { return Math.random() * (max - min) + min; }

export function start(root, canvasEl, cards = []) {
  if (!root || !canvasEl) return () => {};
  const canvas = canvasEl;
  canvas.width = canvas.clientWidth;
  canvas.height = 100;
  canvas.style.width = '100%';
  canvas.style.height = '100px';
  canvas.style.display = 'block';
  canvas.style.marginTop = '12px';
  canvas.style.zIndex = '40';
  canvas.style.background = 'transparent';

  const ctx = canvas.getContext('2d');
  // make canvas taller so overlay and landing have space
  canvas.style.height = '160px';
  let w = (canvas.width = canvas.clientWidth);
  let h = (canvas.height = 160);

  const groundY = h - 28;

  // player
  const player = { x: 80, y: groundY - 24, vy: 0, vx: 0, w: 28, h: 28, jumping: false };

  // badges spaced across an infinite runner (we generate ahead)
  const badges = [];
  const speed = 4.5; // playable fast mode
  let nextBadgeIdx = 0;
  const baseSpacing = 340; // wider spacing so jumps land on next item
  const spawnAhead = 800; // spawn badges this far ahead of viewport

  function spawnBadges() {
    // create badges up to spawnAhead distance
    let lastX = badges.length ? badges[badges.length - 1].x : w + 80;
    while (lastX < w + spawnAhead) {
      const idx = nextBadgeIdx++ % Math.max(1, cards.length);
      const spacing = baseSpacing + rand(-40, 40);
      const b = { x: lastX + spacing, y: groundY - 18, w: 20, h: 20, idx };
      badges.push(b);
      lastX = b.x;
    }
  }
  spawnBadges();

  let raf = null;
  let running = true;
  let gameOver = false;
  // overlay for game over UI (positioned over the canvas)
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.display = 'none';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = '120';
  overlay.style.pointerEvents = 'none';
  if (canvas.parentNode) {
    canvas.parentNode.style.position = canvas.parentNode.style.position || 'relative';
    canvas.parentNode.appendChild(overlay);
  }

  function updateOverlayBounds() {
    if (!overlay || !canvas || !canvas.parentNode) return;
    const left = canvas.offsetLeft;
    const top = canvas.offsetTop;
    overlay.style.left = left + 'px';
    overlay.style.top = top + 'px';
    overlay.style.width = canvas.clientWidth + 'px';
    overlay.style.height = canvas.clientHeight + 'px';
  }

  function resize() {
    w = canvas.width = canvas.clientWidth;
    h = canvas.height = 160;
    // keep overlay aligned
    updateOverlayBounds();
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    // ground (drawn after background but before sprites)
    ctx.fillStyle = '#000';
    ctx.fillRect(0, groundY, w, 4);

    // store previous vertical position for landing checks
    const prevY = player.y;

    // update player physics (longer jump to clear items)
    player.vy += 1.0; // gravity tuned for a higher arc
    player.y += player.vy;
    // horizontal movement while airborne
    player.x += player.vx;
    // friction / decay for horizontal velocity
    player.vx *= 0.9;
    // clamp player x so it doesn't go too far right
    const maxPlayerX = Math.min(140, w * 0.45);
    if (player.x > maxPlayerX) player.x = maxPlayerX;

    // landing detection with tolerance for ground
    if (player.y >= groundY - player.h - 0.5) {
      player.y = groundY - player.h;
      player.vy = 0;
      player.jumping = false;
      // reduce forward momentum on landing
      player.vx *= 0.5;
    }

    // update badges and detect collisions (platform-like behavior)
    for (let i = badges.length - 1; i >= 0; i--) {
      const b = badges[i];
      b.x -= speed;
      // draw badge
      ctx.fillStyle = '#00C2FF';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.w, b.h);

      // horizontal overlap check
      const hOverlap = b.x < player.x + player.w && b.x + b.w > player.x;
      if (hOverlap) {
        // landing-from-above: previous bottom <= badge top and now overlapping vertically
        if (prevY + player.h <= b.y + 4 && player.y + player.h >= b.y && player.vy >= 0) {
          // land on badge
          player.y = b.y - player.h;
          player.vy = 0;
          player.jumping = false;
          // collect badge
          const idx = b.idx;
          badges.splice(i, 1);
          const card = cards[idx];
          if (card) {
            card.classList.add('highlight');
            setTimeout(() => card.classList.remove('highlight'), 900);
          }
          continue;
        }

        // side collision (not landing) -> game over
        if (player.y < b.y + b.h && player.y + player.h > b.y) {
          running = false;
          gameOver = true;
          showGameOver();
          return; // stop processing
        }
      }
    }

    // keep replenishing badges to maintain an endless stream
    if (!badges.length || badges[badges.length - 1].x < w + spawnAhead) {
      spawnBadges();
    }

    // draw player (rounded body, no face)
    const px = player.x;
    const py = player.y;
    const pw = player.w;
    const ph = player.h;
    const r = 6;
    ctx.fillStyle = '#FF0055';
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.lineTo(px + pw - r, py);
    ctx.quadraticCurveTo(px + pw, py, px + pw, py + r);
    ctx.lineTo(px + pw, py + ph - r);
    ctx.quadraticCurveTo(px + pw, py + ph, px + pw - r, py + ph);
    ctx.lineTo(px + r, py + ph);
    ctx.quadraticCurveTo(px, py + ph, px, py + ph - r);
    ctx.lineTo(px, py + r);
    ctx.quadraticCurveTo(px, py, px + r, py);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.stroke();

    // check bounds for game over
    if (player.y > h + 60 || player.x < -60) {
      running = false;
      gameOver = true;
      showGameOver();
      return;
    }

    raf = requestAnimationFrame(step);
  }

  function onJump() {
    if (!player.jumping) {
      player.vy = -14; // stronger impulse for a higher jump
      // add a stronger forward push so the player can reach the next spaced badge
      player.vx = Math.max(player.vx, 6);
      player.jumping = true;
    }
  }

  function showGameOver() {
    if (!overlay) return;
    overlay.innerHTML = '';
    const box = document.createElement('div');
    box.style.pointerEvents = 'auto';
    box.style.background = 'rgba(255,255,255,0.95)';
    box.style.border = '6px solid #000';
    box.style.padding = '16px';
    box.style.textAlign = 'center';
    const h = document.createElement('div');
    h.textContent = 'Game Over';
    h.style.fontWeight = '900';
    h.style.marginBottom = '8px';
    const btn = document.createElement('button');
    btn.setAttribute('aria-label', 'Retry');
    btn.style.padding = '10px';
    btn.style.borderRadius = '8px';
    btn.style.border = '6px solid #000';
    btn.style.background = '#00C2FF';
    btn.style.cursor = 'pointer';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.width = '48px';
    btn.style.height = '48px';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 6v3l4-4-4-4v3C7 4 4 7 4 11c0 4 3 7 8 7 2 0 3.5-.5 4.8-1.3l-1.6-1.6C14.9 15.9 13.6 16 12 16c-3.3 0-6-2.7-6-6s2.7-6 6-6z" fill="#000"/>
      </svg>
    `;
    btn.addEventListener('click', () => { resetGame(); });
    box.appendChild(h);
    box.appendChild(btn);
    overlay.appendChild(box);
    overlay.style.display = 'flex';
  }

  function resetGame() {
    // clear badges and respawn
    badges.length = 0;
    nextBadgeIdx = 0;
    player.x = 80;
    player.y = groundY - player.h;
    player.vy = 0;
    player.vx = 0;
    player.jumping = false;
    gameOver = false;
    running = true;
    overlay.style.display = 'none';
    spawnBadges();
    // resume loop
    raf = requestAnimationFrame(step);
  }

  function onTouch(e) { e.preventDefault(); onJump(); }
  function onKeyDown(e) {
    if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
      const tgt = e.target;
      if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return;
      e.preventDefault();
      onJump();
    }
  }

  canvas.addEventListener('click', onJump);
  canvas.addEventListener('touchstart', onTouch, { passive: false });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', resize);

  resize();
  step();

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    canvas.removeEventListener('click', onJump);
    canvas.removeEventListener('touchstart', onTouch);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('resize', resize);
    if (canvas.parentNode) {
      canvas.style.display = 'none';
    }
  }

  return stop;
}

export default { start };
