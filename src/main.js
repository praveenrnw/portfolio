import { portfolioData } from './data/portfolioData.js';
import { themeManager } from './core/themeManager.js';
import { mountRoot, renderSections } from './core/renderer.js';

async function boot() {
  const root = mountRoot('#app');
  // load initial theme
  await themeManager.setTheme('neo');
  const comps = themeManager.getComponents();

  // render all sections
  renderSections(root, comps, portfolioData);

  // wire header theme toggle
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const pressed = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!pressed));
      btn.animate([
        { transform: 'translateY(0) rotate(0)' },
        { transform: 'translateY(-6px) rotate(-2deg)' },
        { transform: 'translateY(0) rotate(0)' }
      ], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
      // toggle Hero particles game mode
      if (!btn.dataset.gameActive) {
        // start game
        const mod = await import('./games/heroParticles.js');
        btn.dataset.gameActive = '1';
        btn.textContent = 'Exit Game Mode';
        // start collect game on the hero section (simple mode: no UI/timer)
        btn._stopGame = mod.startGame(document.querySelector('.neo-hero'), { simple: true });
      } else {
        // stop game
        btn.dataset.gameActive = '';
        btn.textContent = 'Enter Game Mode (Coming Soon)';
        if (btn._stopGame) btn._stopGame();
        btn._stopGame = null;
      }
    });
  }

  // listen for future theme changes and re-render
  themeManager.onThemeChange(() => {
    const comps = themeManager.getComponents();
    renderSections(root, comps, portfolioData);
  });
}

boot().catch((err) => console.error(err));
