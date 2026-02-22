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
