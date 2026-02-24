const create = (tag, cls, attrs = {}) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
};

export function renderHero(data) {
  const section = create('section', 'neo-hero');
  // `data` may be the full portfolio object; prefer hero sub-object if present
  const hero = (data && data.hero) ? data.hero : data || {};
  const profile = create('img', 'hero-profile', { src: './assets/profile-a.jpg', alt: `${hero.name} — portrait` });
  profile.dataset.altSrc = './assets/profile-b.jpg';

  // Apply skeuomorphic variant if requested
  if (data && data.variant === 'skeuo') section.classList.add('hero-skeuo');

  const h1 = create('h1', 'hero-name');
  h1.textContent = hero.name || '';
  const h2 = create('h2', 'hero-title');
  h2.textContent = hero.title || '';
  const p = create('p', 'hero-tagline');
  p.textContent = hero.tagline || '';

  const meta = create('div', 'hero-meta');
  const accent = create('span', 'accent-block');
  meta.appendChild(accent);

  // Build hero layout
  const grid = create('div', 'hero-grid');
  const content = create('div', 'hero-content');
  const profileWrap = create('div', 'hero-profile-wrap');

  content.appendChild(h1);
  content.appendChild(h2);
  content.appendChild(p);
  content.appendChild(meta);

  // Merge About description into hero content (remove separate About tile)
  try {
    const aboutText = (data && data.about && data.about.description) ? data.about.description : '';
    if (aboutText) {
      const aboutP = create('p', 'hero-about');
      aboutP.textContent = aboutText;
      content.appendChild(aboutP);
    }
  } catch (e) {
    /* ignore */
  }

  // CTAs removed per layout change

  // TOC chips removed from hero

  profileWrap.appendChild(profile);
  // place profile on the left, content on the right
  grid.appendChild(profileWrap);
  grid.appendChild(content);

  section.appendChild(grid);

  // hover swap for desktop
  profile.addEventListener('mouseenter', () => {
    profile.dataset.prev = profile.src;
    profile.src = profile.dataset.altSrc;
  });
  profile.addEventListener('mouseleave', () => {
    if (profile.dataset.prev) profile.src = profile.dataset.prev;
  });

  // touch behavior: swap briefly on tap
  let touchTimer = null;
  profile.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (touchTimer) clearTimeout(touchTimer);
    profile.dataset.prev = profile.src;
    profile.src = profile.dataset.altSrc;
    touchTimer = setTimeout(() => {
      profile.src = profile.dataset.prev || profile.src;
      touchTimer = null;
    }, 1200);
  });

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
  const list = create('div', 'exp-list');
  items.forEach((it, idx) => {
    const card = create('article', 'card exp-card');
    card.dataset.expIndex = String(idx);
    const head = create('div', 'card-head');
    const left = create('div', 'exp-left');
    const right = create('div', 'exp-right');
    const role = create('strong');
    role.textContent = it.role;
    const meta = create('div', 'meta');
    meta.textContent = `${it.company} • ${it.duration}`;
    left.appendChild(role);
    left.appendChild(meta);
    const ul = create('ul');
    it.points.forEach((p) => {
      const li = create('li');
      li.textContent = p;
      ul.appendChild(li);
    });
    right.appendChild(ul);
    card.appendChild(left);
    card.appendChild(right);
    list.appendChild(card);
  });
  section.appendChild(list);
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
    const techWrap = create('div', 'tech');
    p.tech.forEach((t) => {
      const b = create('span', 'tech-badge');
      // normalize class
      const key = t.toLowerCase().replace(/[^a-z0-9]+/g, '');
      b.classList.add(`tech-${key}`);
      b.textContent = t;
      techWrap.appendChild(b);
    });
    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(techWrap);
    // if this project references Unity, attach the mini-game play button and canvas here
    const isUnityProject = p.tech && p.tech.some((t) => (/unity/i).test(t));
    if (isUnityProject) {
      const playBtn = create('button', 'timeline-play');
      playBtn.type = 'button';
      playBtn.textContent = 'Play Mini Game';
      const runnerCanvas = create('canvas', 'timeline-canvas');
      runnerCanvas.setAttribute('aria-hidden', 'true');
      card.appendChild(playBtn);
      card.appendChild(runnerCanvas);

      playBtn.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        if (!btn.dataset.playing) {
          const mod = await import('../../games/timelineRunner.js');
          btn.dataset.playing = '1';
          btn.textContent = 'Stop Mini Game';
          // add spacing so the canvas doesn't collide with the tile above
          runnerCanvas.style.marginTop = '40px';
          const cards = Array.from(document.querySelectorAll('.exp-card'));
          btn._stop = mod.start(document.querySelector('.neo-experience'), runnerCanvas, cards);
        } else {
          btn.dataset.playing = '';
          btn.textContent = 'Play Mini Game';
          if (btn._stop) btn._stop();
          btn._stop = null;
          runnerCanvas.style.marginTop = '';
        }
      });
    }
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
    const pill = create('button', 'skill');
    pill.type = 'button';
    pill.textContent = s;
    pill.setAttribute('aria-label', `Skill ${s}`);
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
  const copy = create('button', 'game-mode');
  copy.type = 'button';
  copy.textContent = 'Copy Email';
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(data.email);
      copy.textContent = 'Copied!';
      setTimeout(() => (copy.textContent = 'Copy Email'), 1200);
    } catch (e) {
      console.error('copy failed', e);
    }
  });
  card.appendChild(email);
  card.appendChild(loc);
  card.appendChild(copy);
  section.appendChild(h3);
  section.appendChild(card);
  return section;
}
