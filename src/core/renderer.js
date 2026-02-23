export function mountRoot(selector = '#app') {
  const root = document.querySelector(selector);
  if (!root) throw new Error('Root element not found: ' + selector);
  root.innerHTML = '';
  const container = document.createElement('div');
  container.id = 'site-root';
  root.appendChild(container);
  return container;
}

export function renderSections(container, components, data) {
  // Clean up any running game instances or attached stop hooks on existing elements
  try {
    // stop hero particle systems attached to hero sections
    const heroes = container.querySelectorAll('.neo-hero');
    heroes.forEach((h) => {
      if (h && h.__heroParticles && typeof h.__heroParticles.stop === 'function') {
        try { h.__heroParticles.stop(); } catch (e) { /* ignore */ }
        h.__heroParticles = null;
      }
    });

    // stop any elements that stored a _stop function (play buttons, canvases, etc.)
    const stoppables = container.querySelectorAll('*');
    stoppables.forEach((el) => {
      if (el && el._stop && typeof el._stop === 'function') {
        try { el._stop(); } catch (e) { /* ignore */ }
        el._stop = null;
      }
    });
  } catch (e) {
    // defensive: ignore cleanup failures
    console.warn('renderSections cleanup error', e);
  }

  container.innerHTML = '';
  const order = [
    { fn: 'renderHero', data: data.hero },
    { fn: 'renderAbout', data: data.about },
    { fn: 'renderExperience', data: data.experience },
    { fn: 'renderProjects', data: data.projects },
    { fn: 'renderSkills', data: data.skills },
    { fn: 'renderContact', data: data.contact }
  ];

  order.forEach((item, idx) => {
    if (typeof components[item.fn] === 'function') {
      const el = components[item.fn](item.data);
      // add simple slide-up animation stagger
      el.classList.add('enter');
      el.style.animationDelay = `${idx * 80}ms`;
      container.appendChild(el);
    }
  });
}
