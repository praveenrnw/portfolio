// Paper Rocket — roaming, non-interactive decorative animation
// Loads on module import and runs until the page unloads.

const ROCKET_SIZE = 56; // px
const MIN_DURATION = 3000;
const MAX_DURATION = 7000;

function createStyles() {
  const css = `
#paper-rocket-root{position:fixed;inset:0;pointer-events:none;z-index:9999}
.paper-rocket{position:absolute;width:${ROCKET_SIZE}px;height:${ROCKET_SIZE}px;transform-origin:28px 28px;will-change:transform;filter:drop-shadow(0 6px 10px rgba(0,0,0,0.12));}
.paper-rocket svg{width:100%;height:100%;display:block}
`;
  const s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);
}

function makeRocketEl() {
  const el = document.createElement('div');
  el.className = 'paper-rocket';
  el.innerHTML = `
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <g transform="translate(32,32)">
    <path d="M-14 6 L0 -22 L14 6 Z" fill="#f5f5f7" stroke="#c9cdd1" stroke-width="1.5" />
    <path d="M0 -22 L4 -8 L0 -4 L-4 -8 Z" fill="#ffd1a6" opacity="0.95" />
    <circle cx="0" cy="12" r="3" fill="#ff6b6b" />
  </g>
</svg>
`;
  return el;
}

function rand(min, max) { return Math.random() * (max - min) + min; }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOutQuad(t) { return t < 0.5 ? 2*t*t : -1 + (4 - 2*t)*t; }

function startRoaming(rocketEl) {
  let vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  const padding = 24;

  function randPos() {
    const x = rand(padding, Math.max(ROCKET_SIZE, vw - ROCKET_SIZE - padding));
    const y = rand(padding, Math.max(ROCKET_SIZE, vh - ROCKET_SIZE - padding));
    return { x, y };
  }

  let start = randPos();
  let target = randPos();
  let duration = rand(MIN_DURATION, MAX_DURATION);
  let t = 0;
  let last = performance.now();
  let prevPos = { x: start.x, y: start.y };

  function step(now) {
    const dt = now - last; last = now;
    t += dt / duration;
    if (t >= 1) {
      t = 0;
      start = { x: current.x, y: current.y };
      target = randPos();
      duration = rand(MIN_DURATION, MAX_DURATION);
      prevPos = { x: start.x, y: start.y };
    }

    const eased = easeInOutQuad(t);
    const current = { x: lerp(start.x, target.x, eased), y: lerp(start.y, target.y, eased) };

    // compute angle from velocity (current - prevPos)
    const vx = current.x - prevPos.x;
    const vy = current.y - prevPos.y;
    const angle = Math.atan2(vy, vx) * 180 / Math.PI + 90; // +90 to point the nose forward

    rocketEl.style.transform = `translate(${current.x}px, ${current.y}px) rotate(${angle}deg)`;
    prevPos = current;

    raf = requestAnimationFrame(step);
  }

  let raf = requestAnimationFrame(step);

  function onResize() {
    vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  }

  window.addEventListener('resize', onResize, { passive: true });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  };
}

// bootstrap on import
(function init() {
  if (typeof document === 'undefined') return;
  createStyles();
  const root = document.createElement('div');
  root.id = 'paper-rocket-root';
  document.body.appendChild(root);

  const rocket = makeRocketEl();
  // start off-screen center-ish until animation places it
  rocket.style.transform = `translate(-9999px, -9999px)`;
  root.appendChild(rocket);

  const stop = startRoaming(rocket);

  // cleanup on unload
  window.addEventListener('beforeunload', () => stop(), { once: true });
})();
