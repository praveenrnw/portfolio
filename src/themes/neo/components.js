const create = (tag, cls, attrs = {}) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
};

export function renderHero(data) {
  const section = create('section', 'neo-hero');
  const box = create('div', 'box hero-box');
  const h1 = create('h1', 'hero-name');
  h1.textContent = data.name;
  const h2 = create('h2', 'hero-title');
  h2.textContent = data.title;
  const p = create('p', 'hero-tagline');
  p.textContent = data.tagline;
  box.appendChild(h1);
  box.appendChild(h2);
  box.appendChild(p);
  section.appendChild(box);
  return section;
}

export function renderAbout(data) {
  const section = create('section', 'neo-about');
  const box = create('div', 'box about-box');
  const h3 = create('h3');
  h3.textContent = 'About';
  const p = create('p');
  p.textContent = data.description;
  box.appendChild(h3);
  box.appendChild(p);
  section.appendChild(box);
  return section;
}

export function renderExperience(items) {
  const section = create('section', 'neo-experience');
  const h3 = create('h3');
  h3.textContent = 'Experience';
  section.appendChild(h3);
  items.forEach((it) => {
    const card = create('article', 'card');
    const head = create('div', 'card-head');
    const role = create('strong');
    role.textContent = it.role;
    const meta = create('div', 'meta');
    meta.textContent = `${it.company} • ${it.duration}`;
    head.appendChild(role);
    head.appendChild(meta);
    const ul = create('ul');
    it.points.forEach((p) => {
      const li = create('li');
      li.textContent = p;
      ul.appendChild(li);
    });
    card.appendChild(head);
    card.appendChild(ul);
    section.appendChild(card);
  });
  return section;
}

export function renderProjects(items) {
  const section = create('section', 'neo-projects');
  const h3 = create('h3');
  h3.textContent = 'Projects';
  section.appendChild(h3);
  const grid = create('div', 'projects-grid');
  items.forEach((p) => {
    const card = create('article', 'project-card card');
    const title = create('strong');
    title.textContent = p.name;
    const desc = create('p');
    desc.textContent = p.description;
    const tech = create('div', 'tech');
    tech.textContent = p.tech.join(' • ');
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(tech);
    grid.appendChild(card);
  });
  section.appendChild(grid);
  return section;
}

export function renderSkills(items) {
  const section = create('section', 'neo-skills');
  const h3 = create('h3');
  h3.textContent = 'Skills';
  section.appendChild(h3);
  const list = create('div', 'skills-list');
  items.forEach((s) => {
    const pill = create('span', 'skill');
    pill.textContent = s;
    list.appendChild(pill);
  });
  section.appendChild(list);
  return section;
}

export function renderContact(data) {
  const section = create('section', 'neo-contact');
  const h3 = create('h3');
  h3.textContent = 'Contact';
  const card = create('div', 'card contact-card');
  const email = create('div');
  email.innerHTML = `<strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a>`;
  const loc = create('div');
  loc.innerHTML = `<strong>Location:</strong> ${data.location}`;
  const btn = create('button', 'game-mode');
  btn.type = 'button';
  btn.textContent = 'Enter Game Mode (Coming Soon)';
  card.appendChild(email);
  card.appendChild(loc);
  card.appendChild(btn);
  section.appendChild(h3);
  section.appendChild(card);
  return section;
}
