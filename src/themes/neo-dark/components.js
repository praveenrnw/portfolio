/* ═══════════════════════════════════════════════════════
   Royal Purple + Gold — Theme Components
   ═══════════════════════════════════════════════════════ */

const create = (tag, cls, attrs = {}) => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
};

/* ── Hero ── */
export function renderHero(data) {
  const section = create('section', 'neo-hero');
  const hero = (data && data.hero) ? data.hero : data || {};
  const profile = create('img', 'hero-profile', {
    src: './assets/profile-a.jpg',
    alt: `${hero.name || ''} — portrait`,
  });
  profile.dataset.altSrc = './assets/profile-b.jpg';

  if (data && data.variant === 'skeuo') section.classList.add('hero-skeuo');

  const h1 = create('h1', 'hero-name');
  h1.textContent = hero.name || '';

  const h2 = create('h2', 'hero-title');
  h2.textContent = hero.title || '';

  const p = create('p', 'hero-tagline');
  p.textContent = hero.tagline || '';

  const meta = create('div', 'hero-meta');
  const accent = create('span', 'accent-block');
  accent.addEventListener('click', () => {
    accent.classList.add('accent-nudge');
    setTimeout(() => accent.classList.remove('accent-nudge'), 500);
  });
  accent.style.cursor = 'pointer';
  meta.appendChild(accent);

  const grid = create('div', 'hero-grid');
  const content = create('div', 'hero-content');
  const profileWrap = create('div', 'hero-profile-wrap');

  content.appendChild(h1);
  content.appendChild(h2);
  content.appendChild(p);
  content.appendChild(meta);

  // Merge About description into hero
  try {
    const aboutText = (data && data.about && data.about.description) ? data.about.description : '';
    if (aboutText) {
      const aboutP = create('p', 'hero-about');
      aboutP.textContent = aboutText;
      content.appendChild(aboutP);
    }
  } catch (_) { /* ignore */ }

  profileWrap.appendChild(profile);
  grid.appendChild(profileWrap);
  grid.appendChild(content);
  section.appendChild(grid);

  // Hover swap
  profile.addEventListener('mouseenter', () => {
    profile.dataset.prev = profile.src;
    profile.src = profile.dataset.altSrc;
  });
  profile.addEventListener('mouseleave', () => {
    if (profile.dataset.prev) profile.src = profile.dataset.prev;
  });

  // Mobile tap toggle
  let showingAlt = false;
  profile.addEventListener('touchstart', (e) => {
    e.preventDefault();
    showingAlt = !showingAlt;
    profile.src = showingAlt ? './assets/profile-b.jpg' : './assets/profile-a.jpg';
  });

  return section;
}

/* ── About ── */
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

/* ── Experience (compact) ── */
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

/* ── Terminal (Experience + Skills) ── */
export function renderTerminal(data) {
  const section = create('section', 'terminal-section');
  const grid = create('div', 'terminal-grid');
  const leftWrap = create('div', 'terminal-left');
  const rightWrap = create('div', 'terminal-right-skills');

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
  const experiences = (data && data.experience) ? data.experience : data;

  const miniBody = create('div', 'terminal-body terminal-mini-body');
  miniBody.style.display = 'none';

  experiences.forEach((it) => {
    const entry = create('div', 'term-entry');
    const title = create('div', 'term-title');
    title.textContent = `${it.role} — ${it.company} (${it.duration})`;
    entry.appendChild(title);
    const pts = create('ul', 'term-points');
    it.points.forEach((pt) => {
      const li = create('li');
      li.textContent = pt;
      pts.appendChild(li);
    });
    entry.appendChild(pts);
    body.appendChild(entry);

    const miniEntry = create('div', 'term-entry term-entry-mini');
    const miniTitle = create('div', 'term-title');
    miniTitle.textContent = `${it.role} — ${it.company}`;
    miniEntry.appendChild(miniTitle);
    miniBody.appendChild(miniEntry);
  });

  card.appendChild(body);
  card.appendChild(miniBody);

  // Minimize toggle
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

  // Close: shrink → re-pop
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

  // Skills
  const skillsWrap = create('div', 'skills-nodes');
  const skills = (data && data.skills) ? data.skills : [];
  skillsWrap.style.minHeight = '360px';

  skills.forEach((s) => {
    const node = create('div', 'skill-node');
    const key = s.toLowerCase().replace(/[^a-z0-9]+/g, '');
    node.classList.add(`tech-${key}`);
    node.textContent = s;
    node.setAttribute('title', s);
    node.style.cursor = 'pointer';

    // Blast particles on click
    node.addEventListener('click', () => {
      if (node.classList.contains('skill-blasting')) return;
      const rect = node.getBoundingClientRect();
      const container = skillsWrap.getBoundingClientRect();
      const cx = rect.left - container.left + rect.width / 2;
      const cy = rect.top - container.top + rect.height / 2;
      const colors = ['#7B2FBE', '#9B59D0', '#FFD166', '#FFE08A', '#39FF14'];
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

/* ── Projects ── */
export function renderProjects(items) {
  const section = create('section', 'neo-projects');
  const h3 = create('h3');
  h3.textContent = 'Projects';
  section.appendChild(h3);

  // Themed anime avatars with purple/gold tones
  const animeAvatars = {
    flutter: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="30" r="20" fill="#35c0ff"/><circle cx="40" cy="30" r="18" fill="#1A0E30"/><circle cx="34" cy="26" r="5" fill="#9B59D0"/><circle cx="46" cy="26" r="5" fill="#9B59D0"/><circle cx="35" cy="25" r="2" fill="#FFD166"/><circle cx="47" cy="25" r="2" fill="#FFD166"/><path d="M34 36 Q40 42 46 36" stroke="#FFD166" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="22" y="52" width="36" height="24" rx="6" fill="#35c0ff"/></svg>`,
    unity: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="30" r="20" fill="#555"/><circle cx="40" cy="30" r="18" fill="#1A0E30"/><circle cx="34" cy="26" r="5" fill="#9B59D0"/><circle cx="46" cy="26" r="5" fill="#9B59D0"/><circle cx="35" cy="25" r="2" fill="#FFD166"/><circle cx="47" cy="25" r="2" fill="#FFD166"/><path d="M36 36 L44 36" stroke="#FFD166" stroke-width="2" stroke-linecap="round"/><rect x="22" y="52" width="36" height="24" rx="6" fill="#444"/><path d="M34 60 L40 56 L46 60 L40 64 Z" fill="#9B59D0" opacity="0.6"/></svg>`,
    javascript: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="30" r="20" fill="#f7df1e"/><circle cx="40" cy="30" r="18" fill="#1A0E30"/><circle cx="34" cy="26" r="5" fill="#9B59D0"/><circle cx="46" cy="26" r="5" fill="#9B59D0"/><circle cx="35" cy="25" r="2" fill="#FFD166"/><circle cx="47" cy="25" r="2" fill="#FFD166"/><path d="M34 36 Q40 44 46 36" stroke="#FFD166" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="26" y="8" width="28" height="10" rx="4" fill="#f7df1e"/><text x="40" y="16" text-anchor="middle" font-size="8" font-weight="900" fill="#1A0E30">JS</text><rect x="22" y="52" width="36" height="24" rx="6" fill="#f7df1e"/></svg>`,
    default: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="30" r="20" fill="#7B2FBE"/><circle cx="40" cy="30" r="18" fill="#1A0E30"/><circle cx="34" cy="26" r="5" fill="#9B59D0"/><circle cx="46" cy="26" r="5" fill="#9B59D0"/><circle cx="35" cy="25" r="2" fill="#FFD166"/><circle cx="47" cy="25" r="2" fill="#FFD166"/><path d="M35 36 Q40 41 45 36" stroke="#FFD166" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="22" y="52" width="36" height="24" rx="6" fill="#7B2FBE"/></svg>`,
  };

  function getAvatar(tech) {
    if (!tech || !tech.length) return animeAvatars.default;
    const k = tech[0].toLowerCase();
    if (k.includes('flutter') || k.includes('dart')) return animeAvatars.flutter;
    if (k.includes('unity') || k.includes('c#')) return animeAvatars.unity;
    if (k.includes('javascript') || k.includes('html') || k.includes('canvas')) return animeAvatars.javascript;
    return animeAvatars.default;
  }

  const scroll = create('div', 'projects-scroll');
  items.forEach((p) => {
    const card = create('article', 'project-card card project-card-horizontal project-card-3d');

    const avatarWrap = create('div', 'project-avatar-wrap');
    const avatar = create('div', 'project-avatar');
    avatar.innerHTML = getAvatar(p.tech);
    if (p.tech && p.tech.length) {
      const key = p.tech[0].toLowerCase().replace(/[^a-z0-9]+/g, '');
      avatar.classList.add(`tech-${key}`);
    }
    avatarWrap.appendChild(avatar);

    const cardBody = create('div', 'project-card-body');
    const title = create('strong', 'project-title');
    title.textContent = p.name;
    const desc = create('p', 'project-desc');
    desc.textContent = p.description;

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

    // 3D tilt
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });

    scroll.appendChild(card);
  });

  section.appendChild(scroll);
  return section;
}

/* ── Skills (standalone) ── */
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

/* ── Contact ── */
export function renderContact(data) {
  const section = create('section', 'neo-contact');
  const h3 = create('h3');
  h3.textContent = 'Get In Touch';

  const card = create('div', 'contact-card');

  // Envelope icon with theme colors
  const iconWrap = create('div', 'contact-icon');
  iconWrap.innerHTML = `<svg viewBox="0 0 64 44" width="52" height="36" aria-hidden="true">
    <rect x="2" y="2" width="60" height="40" rx="6" fill="none" stroke="#7B2FBE" stroke-width="3"/>
    <path d="M2 2 L32 24 L62 2" fill="none" stroke="#7B2FBE" stroke-width="3" stroke-linejoin="round"/>
  </svg>`;
  card.appendChild(iconWrap);

  // Email row
  const emailRow = create('div', 'contact-row');
  const emailLabel = create('span', 'contact-label');
  emailLabel.textContent = '✉ Email';
  const emailVal = create('span', 'contact-value');
  const emailLink = create('a', '', { href: `mailto:${data.email || ''}` });
  emailLink.textContent = data.email || '';
  emailVal.appendChild(emailLink);
  emailRow.appendChild(emailLabel);
  emailRow.appendChild(emailVal);
  card.appendChild(emailRow);

  // Location row
  if (data.location) {
    const locRow = create('div', 'contact-row');
    const locLabel = create('span', 'contact-label');
    locLabel.textContent = '📍 Location';
    const locVal = create('span', 'contact-value');
    locVal.textContent = data.location;
    locRow.appendChild(locLabel);
    locRow.appendChild(locVal);
    card.appendChild(locRow);
  }

  const divider = create('hr', 'contact-divider');
  card.appendChild(divider);

  // Actions
  const actions = create('div', 'contact-actions');
  const copyBtn = create('button', 'contact-btn contact-btn--copy');
  copyBtn.type = 'button';
  copyBtn.textContent = '📋 Copy Email';
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(data.email || '');
      copyBtn.textContent = '✅ Copied!';
      copyBtn.classList.add('contact-btn--success');
      setTimeout(() => {
        copyBtn.textContent = '📋 Copy Email';
        copyBtn.classList.remove('contact-btn--success');
      }, 1500);
    } catch (e) { console.error('copy failed', e); }
  });
  const sendBtn = create('a', 'contact-btn contact-btn--send', { href: `mailto:${data.email || ''}` });
  sendBtn.textContent = '🚀 Say Hello';
  actions.appendChild(copyBtn);
  actions.appendChild(sendBtn);
  card.appendChild(actions);

  section.appendChild(h3);
  section.appendChild(card);
  return section;
}
