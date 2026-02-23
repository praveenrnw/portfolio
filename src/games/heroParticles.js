// Simple particle signature for the hero section
// Usage: import and call start(container) -> returns stop() function

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// core particle system builder
function createParticleSystem(root, opts = {}) {
  const { count = 28, interactive = false } = opts;
  if (!root) return null;
  if (root.__heroParticles) return root.__heroParticles;

  const canvas = document.createElement('canvas');
  canvas.className = 'hp-canvas';
  canvas.style.position = 'absolute';
  canvas.style.left = '0';
  canvas.style.top = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = interactive ? 'auto' : 'none';
  canvas.style.zIndex = '10';
  root.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let w = (canvas.width = canvas.clientWidth);
  let h = (canvas.height = canvas.clientHeight);

  const colors = ['#FF0055', '#00C2FF', '#FFD60A', '#000000'];
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: rand(0, w),
      y: rand(0, h),
      r: rand(3, 7),
      vx: rand(-0.3, 0.3),
      vy: rand(-0.3, 0.3),
      c: colors[i % colors.length],
    });
  }

  let pointer = { x: w / 2, y: h / 2, down: false };
  let raf = null;

  function resize() {
    w = canvas.width = canvas.clientWidth;
    h = canvas.height = canvas.clientHeight;
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p) => {
      const dx = pointer.x - p.x;
      const dy = pointer.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
      // continuous inverse-distance attraction so particles are always pulled
      const baseFactor = pointer.down ? 1.6 : 0.9;
      // force falls off with distance but never zero; tuned for snappy follow
      const force = baseFactor * (120 / (dist + 20));
      const accel = 0.5; // tuned responsiveness 
      p.vx += (dx / dist) * force * accel;
      p.vy += (dy / dist) * force * accel;
      // moderate damping to avoid excessive jitter
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    raf = requestAnimationFrame(step);
  }

  function onPointerMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    pointer.x = x;
    pointer.y = y;
  }
  function onPointerDown() {
    pointer.down = true;
  }
  function onPointerUp() {
    pointer.down = false;
  }

  window.addEventListener('resize', resize);
  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('touchmove', onPointerMove, { passive: true });
  canvas.addEventListener('touchstart', onPointerDown, { passive: true });
  canvas.addEventListener('touchend', onPointerUp);
  canvas.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mouseup', onPointerUp);

  resize();
  step();

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('mousemove', onPointerMove);
    canvas.removeEventListener('touchmove', onPointerMove);
    canvas.removeEventListener('touchstart', onPointerDown);
    canvas.removeEventListener('touchend', onPointerUp);
    canvas.removeEventListener('mousedown', onPointerDown);
    window.removeEventListener('mouseup', onPointerUp);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    root.__heroParticles = null;
  }

  function getState() {
    return { canvas, ctx, particles, pointer };
  }

  root.__heroParticles = { stop, getState };
  return root.__heroParticles;
}

// non-game visual start
export function start(root = document.querySelector('.neo-hero')) {
  const sys = createParticleSystem(root, { interactive: false });
  return sys ? sys.stop : () => {};
}

// Game: collect particles by clicking/tapping them within a time limit
export function startGame(root = document.querySelector('.neo-hero'), opts = {}) {
  // opts.simple: boolean - if true, no UI, no timer; just allow tapping particles to remove them
  const { duration = 20, simple = false } = opts;
  const sys = createParticleSystem(root, { interactive: true });
  if (!sys) return () => {};
  const { canvas, particles } = sys.getState();

  // helper
  function distance(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onClick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    // find nearest particle under threshold
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (distance(x, y, p.x, p.y) <= p.r + 8) {
        // collect (simply remove)
        particles.splice(i, 1);
        break;
      }
    }
  }

  canvas.addEventListener('click', onClick);
  canvas.addEventListener('touchstart', onClick, { passive: true });

  if (simple) {
    // simple mode: no overlay, no timer — game runs until stopped
    function stop() {
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('touchstart', onClick);
      sys.stop();
    }
    return stop;
  }

  // non-simple mode: add overlay UI and timer
  const overlay = document.createElement('div');
  overlay.className = 'hp-overlay';
  overlay.style.position = 'absolute';
  overlay.style.left = '12px';
  overlay.style.top = '12px';
  overlay.style.zIndex = '60';
  overlay.style.background = 'var(--white)';
  overlay.style.border = '6px solid var(--black)';
  overlay.style.padding = '8px 10px';
  overlay.style.fontWeight = '700';
  overlay.style.display = 'flex';
  overlay.style.gap = '8px';
  overlay.style.alignItems = 'center';
  overlay.innerHTML = `<span class="hp-timer">${duration}s</span><span class="hp-count">0</span>`;
  root.appendChild(overlay);

  let count = 0;
  const timerEl = overlay.querySelector('.hp-timer');
  const countEl = overlay.querySelector('.hp-count');

  // click handler for counting
  function onClickCount(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      if (distance(x, y, p.x, p.y) <= p.r + 8) {
        particles.splice(i, 1);
        count += 1;
        countEl.textContent = String(count);
        break;
      }
    }
  }

  canvas.addEventListener('click', onClickCount);
  canvas.addEventListener('touchstart', onClickCount, { passive: true });

  // countdown
  let remaining = duration;
  timerEl.textContent = `${remaining}s`;
  const iv = setInterval(() => {
    remaining -= 1;
    timerEl.textContent = `${remaining}s`;
    if (remaining <= 0) {
      clearInterval(iv);
      finish();
    }
  }, 1000);

  function finish() {
    canvas.removeEventListener('click', onClickCount);
    canvas.removeEventListener('touchstart', onClickCount);
    const msg = document.createElement('div');
    msg.className = 'hp-result';
    msg.style.position = 'absolute';
    msg.style.left = '50%';
    msg.style.top = '50%';
    msg.style.transform = 'translate(-50%,-50%)';
    msg.style.zIndex = '70';
    msg.style.padding = '18px';
    msg.style.background = 'var(--white)';
    msg.style.border = '6px solid var(--black)';
    msg.style.fontWeight = '900';
    msg.textContent = `Collected ${count}`;
    root.appendChild(msg);
    setTimeout(() => {
      if (msg.parentNode) msg.parentNode.removeChild(msg);
    }, 2000);
  }

  function stop() {
    clearInterval(iv);
    canvas.removeEventListener('click', onClickCount);
    canvas.removeEventListener('touchstart', onClickCount);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    sys.stop();
  }

  return stop;
}

export default { start, startGame };
