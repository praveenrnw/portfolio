/**
 * Shared arcade cabinet base CSS.
 * All arcade games (Pac-Man, Snake, Space Shooter) share this base styling.
 * Each game injects its own color-override CSS on top.
 */

const ARCADE_BASE_CSS_ID = 'arcade-base-css';

export function injectBaseArcadeCSS() {
  if (document.getElementById(ARCADE_BASE_CSS_ID)) return;
  const style = document.createElement('style');
  style.id = ARCADE_BASE_CSS_ID;
  style.textContent = BASE_CSS;
  document.head.appendChild(style);
}

const BASE_CSS = `
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
    height: auto;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .arcade-marquee::before,
  .arcade-marquee::after { animation: none; }
}
`;
