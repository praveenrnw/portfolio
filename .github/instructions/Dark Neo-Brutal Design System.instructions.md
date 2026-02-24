# Copilot Custom Instruction — Dark Neo‑Brutal Portfolio

**Goal**

Enforce a single dark Neo‑Brutal theme across HTML/CSS/JS: high contrast, disciplined accent usage, accessible text, predictable theming and minimal, bold visual language.

**Scope**

Applies to UI code under this repository. Theme files live under `src/themes` (use `neo-dark` for the dark theme). Integrate with `src/core/themeManager.js` so components never need per-element hardcoded hex values.

## Color system (tokens required)

Declare these CSS variables in the theme stylesheet `:root` and use them everywhere. Never hardcode hex values in component files.

- `--bg-100` — primary page background (near-black, not pure `#000000`)
- `--surface-200` — panels, cards
- `--border-color` — border & offset shadow color (usually `#FFFFFF`)
- `--text-primary` — main readable text (light)
- `--text-muted` — secondary text
- `--primary-500` — primary cool accent (blue family)
- `--accent-500` — hot accent (pink) — use sparingly

Example values (set in `src/themes/neo-dark/styles.css`):

```
--bg-100: #0D0D0D;
--surface-200: #161616;
--border-color: #FFFFFF;
--text-primary: #F2F2F2;
--text-muted: #B0B0B0;
--primary-500: #0B76B6;
--accent-500: #FF0055;
```

## Dark-first rules

- No light backgrounds or light themes. This project is dark-only.
- Use near-black backgrounds (`--bg-100`) for large areas — avoid pure `#000000` for depth.

## 60-30-10 (dark-adapted)

- 60% → `--bg-100` (primary dark background)
- 30% → `--surface-200` (secondary panels)
- 10% → single accent per section (`--accent-500` or `--primary-500`). Do not mix multiple accents in one section.

## Borders & geometry

- Mandatory bold borders: `border: 6px solid var(--border-color)`.
- Hard offset shadows only: `box-shadow: 8px 8px 0 0 var(--border-color)`.
- No rounded corners by default. No soft or blurred drop shadows.

## Accent usage

- Use `--accent-500` only for small accents: badges, tiny stripes, status chips, hover outlines.
- Project status mapping:
  - On Hold → Yellow (use a named token)
  - In Development → Blue (`--primary-500`)
  - Released → Pink (`--accent-500`)
- Ensure status is not conveyed by color alone: include text and/or icon and `aria-label`.

## Typography & accessibility

- Body and primary text must meet WCAG AA (contrast ≥ 4.5:1) against `--bg-100` or `--surface-200`.
- Use `--text-primary` and `--text-muted` tokens for typographic color.
- Large display text can use lower contrast threshold but still prefer high contrast.

## Gradients & visuals

- Gradients discouraged. If used, stay within the dark family and keep them subtle.
- No mixing hot and cool colors in a single gradient; no neon or rainbow effects.

## Animations & interactions

- Animations should feel sharp and mechanical: short diagonal shifts (≤8px), quick cubic-bezier transitions.
- Avoid bouncy, elastic, or long easing curves. Respect `prefers-reduced-motion`.

## File & component rules

- All theme CSS must live in theme stylesheet files under `src/themes/neo-dark/`.
- No inline `style` attributes in HTML; components should use semantic classes and CSS variables (`btn`, `btn--accent`, `card`, `card--surface`).
- Vendor/tech badges may use brand colors but must maintain text contrast and use the standard border treatment.

## ThemeManager integration

- Ensure all theme styles expose the same token names so `themeManager.setTheme('neo-dark')` swaps styles without modifying components.
- For faster runtime swaps, optionally implement an `applyThemeTokens()` path on the theme manager that sets tokens on `:root` via JS instead of loading multiple full stylesheets.

## Accessibility checklist for PRs

- Run a contrast check for hero, cards, and buttons.
- Ensure focus states are visible (outline or thick border change).
- Buttons and interactive elements are keyboard-operable and focusable.
- Statuses include text or icon plus color.

## Do not

- Introduce a light theme or pastel backgrounds.
- Use soft drop shadows, glass/neumorphism, or rounded corners as default.
- Place hot color backgrounds on large surfaces.

## When editing components

- Replace direct color use with tokens.
- Prefer semantic utility classes for styling rather than per-element color logic.
- Keep JS minimal: toggle classes or tokens; avoid setting many inline colors.

## Developer notes for Copilot suggestions

- Provide small, self-contained diffs that:
  - Add/update `:root` tokens in `src/themes/neo-dark/styles.css`.
  - Replace `--bg`, `--white`, `--blue`, `--pink`, `--yellow` usages with canonical tokens.
  - Update component classes in `src/themes/neo-dark/components.js` to use `btn`, `btn--accent`, `card`.
  - Include a short PR checklist: contrast checks, theme manager compatibility.

---

File generated: COPILOT_CUSTOM_INSTRUCTION.md
