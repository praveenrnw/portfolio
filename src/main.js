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

  // listen for future theme changes and re-render
  themeManager.onThemeChange(() => {
    const comps = themeManager.getComponents();
    renderSections(root, comps, portfolioData);
  });
}

boot().catch((err) => console.error(err));
