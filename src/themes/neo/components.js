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

  // Animated animals running away from the red accent block
  const animals = ['🐇', '🦊', '🐈', '🐕', '🐿️'];
  const runway = create('div', 'animal-runway');
  animals.forEach((emoji, i) => {
    const a = create('span', 'running-animal');
    a.textContent = emoji;
    a.style.animationDelay = `${i * 1.8}s`;
    runway.appendChild(a);
  });
  meta.appendChild(runway);

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
  const list = create('div', 'exp-list compact');
  items.forEach((it, idx) => {
    const card = create('article', 'card exp-card compact-card');
    card.dataset.expIndex = String(idx);
    const left = create('div', 'exp-left');
    const role = create('strong');
    role.textContent = it.role;
    const meta = create('div', 'meta');
    meta.textContent = it.company;
    left.appendChild(role);
    left.appendChild(meta);
    card.appendChild(left);
    list.appendChild(card);
  });
  section.appendChild(list);
  return section;
}

// Terminal-style card that contains the full experience details
export function renderTerminal(data) {
  // data is the full portfolioData object so we can access experience and skills
  const section = create('section', 'terminal-section');
  const grid = create('div', 'terminal-grid');
  const leftWrap = create('div', 'terminal-left');
  const rightWrap = create('div', 'terminal-right-skills');

  // Terminal card (left)
  const card = create('div', 'terminal-card');
  const header = create('div', 'terminal-header');
  const controls = create('div', 'term-controls');
  const btnMin = create('span', 'term-btn term-min');
  btnMin.textContent = '-';
  const btnClose = create('span', 'term-btn term-close');
  btnClose.textContent = 'x';
  controls.appendChild(btnMin);
  controls.appendChild(btnClose);
  header.appendChild(controls);
  card.appendChild(header);

  const body = create('div', 'terminal-body');
  // render full experience details inside the terminal
  const experiences = (data && data.experience) ? data.experience : data;

  // Build a minimised summary (company names only)
  const miniBody = create('div', 'terminal-body terminal-mini-body');
  miniBody.style.display = 'none';

  experiences.forEach((it) => {
    const entry = create('div', 'term-entry');
    const title = create('div', 'term-title');
    title.textContent = `${it.role} — ${it.company} (${it.duration})`;
    entry.appendChild(title);
    const pts = create('ul', 'term-points');
    it.points.forEach((p) => {
      const li = create('li');
      li.textContent = p;
      pts.appendChild(li);
    });
    entry.appendChild(pts);
    body.appendChild(entry);

    // mini version: just company + role
    const miniEntry = create('div', 'term-entry term-entry-mini');
    const miniTitle = create('div', 'term-title');
    miniTitle.textContent = `${it.role} — ${it.company}`;
    miniEntry.appendChild(miniTitle);
    miniBody.appendChild(miniEntry);
  });

  card.appendChild(body);
  card.appendChild(miniBody);

  // Minimize: toggle between full body and compact company-only view
  let minimized = false;
  btnMin.style.cursor = 'pointer';
  btnMin.addEventListener('click', () => {
    minimized = !minimized;
    if (minimized) {
      body.style.display = 'none';
      miniBody.style.display = 'block';
      card.classList.add('terminal-minimized');
      btnMin.textContent = '+';
    } else {
      body.style.display = '';
      miniBody.style.display = 'none';
      card.classList.remove('terminal-minimized');
      btnMin.textContent = '-';
    }
  });

  // Close: shrink away then re-pop after 1 second
  btnClose.style.cursor = 'pointer';
  btnClose.addEventListener('click', () => {
    card.classList.add('terminal-closing');
    setTimeout(() => {
      card.classList.remove('terminal-closing');
      card.classList.add('terminal-popping');
      setTimeout(() => card.classList.remove('terminal-popping'), 400);
    }, 1000);
  });

  leftWrap.appendChild(card);

  // Skills tiles (right) — positioned randomly
  const skillsWrap = create('div', 'skills-nodes');
  const skills = (data && data.skills) ? data.skills : [];
  // give the skills area a fixed height so absolute positioned tiles have a space
  skillsWrap.style.minHeight = '360px';

  skills.forEach((s) => {
    const node = create('div', 'skill-node');
    // create normalized class for color theming
    const key = s.toLowerCase().replace(/[^a-z0-9]+/g, '');
    node.classList.add(`tech-${key}`);
    node.textContent = s;
    node.setAttribute('title', s);
    node.style.cursor = 'pointer';

    // Blast animation on click
    node.addEventListener('click', () => {
      if (node.classList.contains('skill-blasting')) return;
      // Spawn burst particles
      const rect = node.getBoundingClientRect();
      const container = skillsWrap.getBoundingClientRect();
      const cx = rect.left - container.left + rect.width / 2;
      const cy = rect.top - container.top + rect.height / 2;
      const colors = ['#FF0055', '#00C2FF', '#FFD60A', '#ff6b6b', '#00ff88'];
      for (let i = 0; i < 12; i++) {
        const p = create('span', 'skill-particle');
        const angle = (Math.PI * 2 / 12) * i;
        const dist = 40 + Math.random() * 30;
        p.style.left = cx + 'px';
        p.style.top = cy + 'px';
        p.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
        p.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
        p.style.background = colors[i % colors.length];
        skillsWrap.appendChild(p);
        setTimeout(() => p.remove(), 600);
      }
      // Hide node, then re-appear
      node.classList.add('skill-blasting');
      setTimeout(() => {
        node.classList.remove('skill-blasting');
        node.classList.add('skill-reappear');
        setTimeout(() => node.classList.remove('skill-reappear'), 400);
      }, 700);
    });

    skillsWrap.appendChild(node);
  });

  const skillsHeader = create('h3', 'terminal-skills-title');
  skillsHeader.textContent = 'Skills';
  const skillsFrame = create('div', 'skills-frame');
  skillsFrame.appendChild(skillsHeader);
  skillsFrame.appendChild(skillsWrap);
  rightWrap.appendChild(skillsFrame);
  grid.appendChild(leftWrap);
  grid.appendChild(rightWrap);
  section.appendChild(grid);
  return section;
}

export function renderProjects(items) {
  const section = create('section', 'neo-projects');
  const h3 = create('h3');
  h3.textContent = 'Projects';
  section.appendChild(h3);

  // Anime-style SVG avatars per tech category
  const animeAvatars = {
    flutter: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="30" r="20" fill="#35c0ff"/><circle cx="40" cy="30" r="18" fill="#e8f4fd"/><circle cx="34" cy="26" r="5" fill="#222"/><circle cx="46" cy="26" r="5" fill="#222"/><circle cx="35" cy="25" r="2" fill="#fff"/><circle cx="47" cy="25" r="2" fill="#fff"/><path d="M34 36 Q40 42 46 36" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M20 14 Q30 4 40 10" stroke="#35c0ff" stroke-width="3" fill="none"/><path d="M60 14 Q50 4 40 10" stroke="#35c0ff" stroke-width="3" fill="none"/><rect x="22" y="52" width="36" height="24" rx="6" fill="#35c0ff"/><path d="M30 52 L30 70" stroke="#e8f4fd" stroke-width="2"/></svg>`,
    unity: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="30" r="20" fill="#333"/><circle cx="40" cy="30" r="18" fill="#f0f0f0"/><circle cx="34" cy="26" r="5" fill="#222"/><circle cx="46" cy="26" r="5" fill="#222"/><circle cx="35" cy="25" r="2" fill="#fff"/><circle cx="47" cy="25" r="2" fill="#fff"/><path d="M36 36 L44 36" stroke="#222" stroke-width="2" stroke-linecap="round"/><path d="M18 18 L26 10" stroke="#333" stroke-width="3" stroke-linecap="round"/><path d="M62 18 L54 10" stroke="#333" stroke-width="3" stroke-linecap="round"/><rect x="22" y="52" width="36" height="24" rx="6" fill="#222"/><path d="M34 60 L40 56 L46 60 L40 64 Z" fill="#fff" opacity="0.6"/></svg>`,
    javascript: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="30" r="20" fill="#f7df1e"/><circle cx="40" cy="30" r="18" fill="#fffbe6"/><circle cx="34" cy="26" r="5" fill="#222"/><circle cx="46" cy="26" r="5" fill="#222"/><circle cx="35" cy="25" r="2" fill="#fff"/><circle cx="47" cy="25" r="2" fill="#fff"/><path d="M34 36 Q40 44 46 36" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="26" y="8" width="28" height="10" rx="4" fill="#f7df1e"/><text x="40" y="16" text-anchor="middle" font-size="8" font-weight="900" fill="#222">JS</text><rect x="22" y="52" width="36" height="24" rx="6" fill="#f7df1e"/></svg>`,
    default: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="30" r="20" fill="#FF0055"/><circle cx="40" cy="30" r="18" fill="#ffe0eb"/><circle cx="34" cy="26" r="5" fill="#222"/><circle cx="46" cy="26" r="5" fill="#222"/><circle cx="35" cy="25" r="2" fill="#fff"/><circle cx="47" cy="25" r="2" fill="#fff"/><path d="M35 36 Q40 41 45 36" stroke="#222" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="22" y="52" width="36" height="24" rx="6" fill="#FF0055"/></svg>`,
  };

  function getAvatar(tech) {
    if (!tech || !tech.length) return animeAvatars.default;
    const k = tech[0].toLowerCase();
    if (k.includes('flutter') || k.includes('dart')) return animeAvatars.flutter;
    if (k.includes('unity') || k.includes('c#')) return animeAvatars.unity;
    if (k.includes('javascript') || k.includes('html') || k.includes('canvas')) return animeAvatars.javascript;
    return animeAvatars.default;
  }

  // horizontally scrollable projects row
  const scroll = create('div', 'projects-scroll');
  items.forEach((p) => {
    const card = create('article', 'project-card card project-card-horizontal project-card-3d');

    // anime avatar
    const avatarWrap = create('div', 'project-avatar-wrap');
    const avatar = create('div', 'project-avatar');
    avatar.innerHTML = getAvatar(p.tech);
    if (p.tech && p.tech.length) {
      const key = p.tech[0].toLowerCase().replace(/[^a-z0-9]+/g, '');
      avatar.classList.add(`tech-${key}`);
    }
    avatarWrap.appendChild(avatar);

    // card body (grows to push footer down)
    const cardBody = create('div', 'project-card-body');
    const title = create('strong', 'project-title');
    title.textContent = p.name;
    const desc = create('p', 'project-desc');
    desc.textContent = p.description;

    // language / tech badges
    const techWrap = create('div', 'project-techs');
    p.tech.forEach((t) => {
      const b = create('span', 'tech-badge');
      const key = t.toLowerCase().replace(/[^a-z0-9]+/g, '');
      b.classList.add(`tech-${key}`);
      b.textContent = t;
      techWrap.appendChild(b);
    });

    cardBody.appendChild(avatarWrap);
    cardBody.appendChild(title);
    cardBody.appendChild(desc);
    cardBody.appendChild(techWrap);
    card.appendChild(cardBody);

    // card footer pinned to bottom
    const cardFooter = create('div', 'project-card-footer');
    if (p.links) {
      const linkWrap = create('div', 'project-links');
      if (p.links.demo) {
        const a = create('a', 'project-link project-link--demo');
        a.href = p.links.demo;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = '▶ Play';
        linkWrap.appendChild(a);
      }
      if (p.links.github) {
        const a = create('a', 'project-link project-link--repo');
        a.href = p.links.github;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = '⌂ Repo';
        linkWrap.appendChild(a);
      }
      cardFooter.appendChild(linkWrap);
    }
    const view = create('a', 'project-btn');
    view.href = p.url || '#projects';
    view.textContent = 'View More';
    cardFooter.appendChild(view);
    card.appendChild(cardFooter);

    // 3D tilt on mouse move
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });

    scroll.appendChild(card);
  });

  section.appendChild(scroll);
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

  // Build a form-like input field with an attached copy button (no .card wrapper)
  const fieldRow = create('div', 'contact-field');
  const input = create('input', 'contact-field-input', { type: 'text', readonly: 'true' });
  input.value = data.email || '';
  input.setAttribute('aria-label', 'Email address');
  const btn = create('button', 'contact-field-btn');
  btn.type = 'button';
  btn.textContent = 'Copy';
  btn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(input.value || '');
      btn.textContent = 'Copied!';
      setTimeout(() => (btn.textContent = 'Copy'), 1200);
    } catch (e) {
      console.error('copy failed', e);
    }
  });
  fieldRow.appendChild(input);
  fieldRow.appendChild(btn);

  // Optional supplemental info below the field
  const infoWrap = create('div', 'contact-info');
  if (data.location) {
    const loc = create('div', 'contact-info-row');
    loc.innerHTML = `<strong>Location:</strong> ${data.location}`;
    infoWrap.appendChild(loc);
  }
  if (data.phone) {
    const ph = create('div', 'contact-info-row');
    ph.innerHTML = `<strong>Phone:</strong> <a href="tel:${data.phone}">${data.phone}</a>`;
    infoWrap.appendChild(ph);
  }

  section.appendChild(h3);
  section.appendChild(fieldRow);
  section.appendChild(infoWrap);
  return section;
}
