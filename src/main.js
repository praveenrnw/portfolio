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
      // placeholder: future theme switching
      // themeManager.setTheme('mario') // when implemented
    });
  }

  // listen for future theme changes and re-render
  themeManager.onThemeChange(() => {
    const comps = themeManager.getComponents();
    renderSections(root, comps, portfolioData);
  });
}

boot().catch((err) => console.error(err));
