# Portfolio — Code Structure & Architecture Guide

A comprehensive breakdown of every module, how they connect, and the logic driving this interactive portfolio site.

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Project File Map](#2-project-file-map)
3. [Boot Sequence](#3-boot-sequence)
4. [Module Deep-Dives](#4-module-deep-dives)
   - [index.html](#41-indexhtml--entry-point)
   - [main.js](#42-mainjs--bootstrap)
   - [renderer.js](#43-rendererjs--dom-orchestrator)
   - [themeManager.js](#44-thememanagerjs--theme-loader)
   - [portfolioData.js](#45-portfoliodatajs--data-layer)
   - [components.js (neo theme)](#46-componentsjs--neo-theme-components)
   - [styles.css (neo theme)](#47-stylescss--neo-theme-styles)
5. [Games & Interactions](#5-games--interactions)
   - [heroParticles.js](#51-heroparticlesjs)
   - [memoryMosaic.js](#52-memorymosaicjs)
   - [paperRocket.js](#53-paperrocketjs)
   - [timelineRunner.js](#54-timelinerunnerjs)
   - [retroPacman.js](#55-retropacmanjs)
6. [Data Flow](#6-data-flow)
7. [Theme System](#7-theme-system)
8. [Rendering Pipeline](#8-rendering-pipeline)
9. [Game Lifecycle Pattern](#9-game-lifecycle-pattern)
10. [CSS Architecture](#10-css-architecture)
11. [Key Design Decisions](#11-key-design-decisions)
12. [UI Refinements (refine-ui)](#12-ui-refinements-refine-ui-branch)

---

## 1. High-Level Architecture

The site is a **static single-page application** built with **vanilla JavaScript ES modules** — no build tools, no bundler, no framework. The browser loads native `<script type="module">` directly.

```mermaid
graph TB
    subgraph Browser
        HTML["index.html<br/>(entry point)"]
        MAIN["main.js<br/>(bootstrap)"]
        TM["themeManager.js<br/>(theme loader)"]
        REN["renderer.js<br/>(DOM orchestrator)"]
        DATA["portfolioData.js<br/>(content data)"]
        COMP["components.js<br/>(neo theme)"]
        CSS["styles.css<br/>(neo theme)"]

        HTML -->|"&lt;script module&gt;"| MAIN
        MAIN --> TM
        MAIN --> REN
        MAIN --> DATA
        TM -->|"dynamic import()"| COMP
        TM -->|"injects &lt;link&gt;"| CSS
        REN -->|"calls render*()"| COMP
        REN -->|"reads"| DATA
    end

    subgraph Games ["Games (lazy-loaded)"]
        HP["heroParticles.js"]
        MM["memoryMosaic.js"]
        PR["paperRocket.js"]
        TR["timelineRunner.js"]
        RP["retroPacman.js"]
    end

    MAIN -.->|"import() on toggle"| HP
    COMP -.->|"import() on play"| TR
    COMP -.->|"import() on play"| RP
    HTML -->|"&lt;script module&gt;"| PR

    style HTML fill:#fdf6e3,stroke:#000,stroke-width:2px
    style MAIN fill:#ff0055,color:#fff,stroke:#000,stroke-width:2px
    style TM fill:#00c2ff,color:#fff,stroke:#000
    style REN fill:#00c2ff,color:#fff,stroke:#000
    style DATA fill:#ffd60a,stroke:#000
    style COMP fill:#ffd60a,stroke:#000
    style CSS fill:#ffd60a,stroke:#000
```

---

## 2. Project File Map

```mermaid
graph LR
    subgraph Root
        IDX["index.html"]
        CNAME["CNAME"]
        README["README.md"]
        DOCS["ARCHITECTURE.md"]
    end

    subgraph assets
        PA["profile-a.jpg"]
        PB["profile-b.jpg"]
    end

    subgraph src
        MJS["main.js"]

        subgraph core
            RJS["renderer.js"]
            TMJS["themeManager.js"]
        end

        subgraph data
            PD["portfolioData.js"]
        end

        subgraph games
            HP["heroParticles.js"]
            MM["memoryMosaic.js"]
            PR["paperRocket.js"]
            TR["timelineRunner.js"]
            RP["retroPacman.js"]
        end

        subgraph themes
            subgraph neo
                NC["components.js"]
                NS["styles.css"]
            end
            subgraph neo-dark
                ND["(empty — planned)"]
            end
        end
    end

    style IDX fill:#fdf6e3,stroke:#000
    style MJS fill:#ff0055,color:#fff,stroke:#000
```

**Why this layout?**

| Folder | Purpose |
|--------|---------|
| `src/core/` | Framework-level modules that don't change per theme |
| `src/data/` | Pure data — no DOM, no logic |
| `src/themes/<name>/` | Each theme is a self-contained folder with its own `components.js` + `styles.css` |
| `src/games/` | Self-contained interactive modules, lazy-loaded when needed |
| `assets/` | Static images |

---

## 3. Boot Sequence

What happens from the moment the browser loads `index.html`:

```mermaid
sequenceDiagram
    participant B as Browser
    participant H as index.html
    participant PR as paperRocket.js
    participant M as main.js
    participant TM as themeManager
    participant R as renderer
    participant C as components.js
    participant CSS as styles.css

    B->>H: Load HTML
    H->>B: Parse DOM (header, #app, footer)
    H->>PR: <script module> paperRocket.js
    PR->>B: Create floating rocket canvas, start rAF loop
    H->>M: <script module> main.js
    M->>M: boot() called
    M->>R: mountRoot('#app')
    R->>B: Clear #app, create #site-root container
    M->>TM: setTheme('neo')
    TM->>B: Inject <link> for neo/styles.css
    TM->>C: dynamic import() neo/components.js
    TM-->>M: Returns component functions
    M->>R: renderSections(root, comps, data)
    R->>R: Cleanup any existing game loops
    R->>B: Clear container innerHTML
    loop For each section
        R->>C: Call render*(data)
        C->>B: Create DOM elements
        R->>B: Append with staggered animation
    end
    M->>B: Listen for theme-toggle click
    M->>TM: Register onThemeChange callback
    Note over B: Site is now interactive
```

### Step-by-step:

1. **HTML parsed** → static header + empty `<main id="app">` + footer
2. **paperRocket.js** loads immediately (non-deferred `<script module>`), creates a full-viewport canvas, and starts animating a bouncing paper rocket emoji
3. **main.js** loads, calls `boot()`
4. `boot()` creates the root container inside `#app`
5. Asks `themeManager` to load the `'neo'` theme — this dynamically imports `components.js` and injects the CSS `<link>`
6. Calls `renderSections()` which iterates through a fixed order array and calls each component function
7. Wires the header "Game Mode" toggle button

---

## 4. Module Deep-Dives

### 4.1 `index.html` — Entry Point

```
┌──────────────────────────────────────┐
│  <head>                              │
│    • Meta tags (viewport, desc)      │
│    • Google Fonts (Inter)            │
│    • Favicon link                    │
│  </head>                             │
│                                      │
│  <body>                              │
│    ┌──── Skip Link ────┐             │
│    │  <a href="#site-root">          │
│    └───────────────────┘             │
│                                      │
│    ┌──── Header (static) ──────┐     │
│    │  Site title + Game Mode   │     │
│    │  toggle button            │     │
│    └───────────────────────────┘     │
│                                      │
│    ┌──── <main id="app"> ──────┐     │
│    │  (empty — JS fills this)  │     │
│    └───────────────────────────┘     │
│                                      │
│    ┌──── Footer (static) ──────┐     │
│    │  © Praveen Ramesh         │     │
│    └───────────────────────────┘     │
│                                      │
│    <script> paperRocket.js           │
│    <script> main.js                  │
│  </body>                             │
└──────────────────────────────────────┘
```

Key points:
- **No build step** — raw `.js` files served as ES modules
- Header is **outside** `#app`, so it's never re-rendered
- The `skip-link` targets `#site-root` which is created dynamically by the renderer

---

### 4.2 `main.js` — Bootstrap

```mermaid
flowchart TD
    BOOT["boot()"] --> MOUNT["mountRoot('#app')"]
    MOUNT --> SET["setTheme('neo')"]
    SET --> GET["getComponents()"]
    GET --> RENDER["renderSections(root, comps, data)"]
    RENDER --> WIRE["Wire toggle button"]
    WIRE --> LISTEN["onThemeChange callback"]

    WIRE --> CLICK{"Toggle clicked?"}
    CLICK -->|"Start"| IMPORT["import heroParticles.js"]
    IMPORT --> START["startGame(heroSection, simple)"]
    CLICK -->|"Stop"| STOP["stopGame()"]
```

**What it does:**
1. Imports static data + core modules
2. Mounts the root DOM container
3. Loads the default theme
4. Renders all sections
5. Wires the "Game Mode" header button to toggle hero particles
6. Registers a theme-change listener for future hot-swapping

---

### 4.3 `renderer.js` — DOM Orchestrator

Two exported functions:

#### `mountRoot(selector)`
- Finds `<main id="app">`
- Clears it
- Creates a `<div id="site-root">` container
- Returns the container

#### `renderSections(container, components, data)`

```mermaid
flowchart TD
    START["renderSections()"] --> CLEAN["Cleanup Phase"]
    CLEAN --> C1["Find .neo-hero elements<br/>Stop __heroParticles"]
    CLEAN --> C2["Find ALL elements<br/>Stop any ._stop functions"]
    CLEAN --> CLEAR["container.innerHTML = ''"]
    CLEAR --> LOOP["Iterate section order array"]

    LOOP --> S1["renderHero(data.hero)"]
    LOOP --> S2["renderAbout(data.about)"]
    LOOP --> S3["renderExperience(data.experience)"]
    LOOP --> S4["renderProjects(data.projects)"]
    LOOP --> S5["renderSkills(data.skills)"]
    LOOP --> S6["renderArcade()"]
    LOOP --> S7["renderContact(data.contact)"]

    S1 --> ANIM["Add .enter class<br/>+ staggered delay"]
    S2 --> ANIM
    S3 --> ANIM
    S4 --> ANIM
    S5 --> ANIM
    S6 --> ANIM
    S7 --> ANIM
    ANIM --> APPEND["Append to container"]
```

**Section order** is defined as a fixed array:
```js
const order = [
  { fn: 'renderHero',       data: data.hero },
  { fn: 'renderAbout',      data: data.about },
  { fn: 'renderExperience', data: data.experience },
  { fn: 'renderProjects',   data: data.projects },
  { fn: 'renderSkills',     data: data.skills },
  { fn: 'renderArcade',     data: null },
  { fn: 'renderContact',    data: data.contact },
];
```

Each component function returns a DOM `<section>` element. The renderer adds an `.enter` CSS class for slide-up animation with staggered delays (80ms apart).

**Cleanup logic** before re-rendering:
- Scans for hero particle systems (`__heroParticles`)
- Scans ALL elements for `_stop` function references (game loops, etc.)
- Calls each stop function to prevent orphaned `requestAnimationFrame` loops

---

### 4.4 `themeManager.js` — Theme Loader

```mermaid
flowchart TD
    SET["setTheme(name)"] --> CHECK{"CSS already<br/>injected?"}
    CHECK -->|No| INJECT["Create <link> element<br/>href = themes/name/styles.css"]
    INJECT --> APPEND["Append to <head>"]
    CHECK -->|Yes| SKIP["Skip CSS injection"]
    SKIP --> IMPORT["dynamic import()<br/>themes/name/components.js"]
    APPEND --> IMPORT
    IMPORT --> STORE["Store component<br/>functions internally"]
    STORE --> NOTIFY["Call onChange listeners"]

    GET["getComponents()"] --> RETURN["Return stored<br/>component functions"]
    ON["onThemeChange(cb)"] --> PUSH["Add to listeners array"]
```

**How theme swapping works:**
1. `setTheme('neo')` → injects `<link>` for `themes/neo/styles.css` + `import()` for `themes/neo/components.js`
2. Components module exports named functions: `renderHero`, `renderAbout`, etc.
3. These functions are stored and returned via `getComponents()`
4. Any registered `onThemeChange` callbacks fire, triggering a full re-render

The `neo-dark` theme folder exists but is empty — it's a placeholder for a future dark theme.

---

### 4.5 `portfolioData.js` — Data Layer

Pure static data object with zero logic:

```mermaid
classDiagram
    class portfolioData {
        +hero: HeroData
        +about: AboutData
        +experience: Experience[]
        +projects: Project[]
        +skills: string[]
        +contact: ContactData
    }

    class HeroData {
        +name: string
        +title: string
        +tagline: string
    }

    class AboutData {
        +description: string
    }

    class Experience {
        +role: string
        +company: string
        +duration: string
        +points: string[]
    }

    class Project {
        +name: string
        +description: string
        +tech: string[]
        +links?: Links
    }

    class Links {
        +demo?: string
        +github?: string
    }

    class ContactData {
        +email: string
        +location: string
    }

    portfolioData --> HeroData
    portfolioData --> AboutData
    portfolioData --> Experience
    portfolioData --> Project
    portfolioData --> ContactData
    Project --> Links
```

**Projects with links:**
- **Auto Sprint** → `https://praveenramesh.itch.io/auto-sprint`
- **The Lone Ranger JD** → `https://praveenramesh.itch.io/the-lone-ranger-jd`

---

### 4.6 `components.js` — Neo Theme Components

Each function follows the same pattern:

```mermaid
flowchart LR
    INPUT["data object"] --> FN["render*()"]
    FN --> CREATE["create() helper<br/>builds DOM elements"]
    CREATE --> ASSEMBLE["Nest & append<br/>child elements"]
    ASSEMBLE --> EVENTS["Attach event<br/>listeners (if any)"]
    EVENTS --> RETURN["Return <section>"]
```

#### `create(tag, cls, attrs)` helper
A tiny DOM factory:
```js
const el = document.createElement(tag);
if (cls) el.className = cls;
Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
return el;
```

#### Component Registry

| Function | Section | Key Features |
|----------|---------|--------------|
| `renderHero(data)` | Hero banner | Profile image with hover/touch swap, deco block |
| `renderAbout(data)` | About paragraph | Simple text section |
| `renderExperience(items)` | Work timeline | Cards with role, company, duration, bullet points |
| `renderProjects(items)` | Project grid | Cards with tech badges, project links, optional mini-game |
| `renderSkills(items)` | Skill pills | Styled buttons with skill names |
| `renderArcade()` | Arcade game | Lazy-loads retro Pac-Man in an arcade cabinet |
| `renderContact(data)` | Contact card | Email link, location, copy-to-clipboard button |

#### `renderHero` — Profile Image Swap

```mermaid
stateDiagram-v2
    [*] --> ProfileA: Page load

    ProfileA --> ProfileB: mouseenter / touchstart
    ProfileB --> ProfileA: mouseleave / timeout(1200ms)

    state ProfileA {
        [*]: profile-a.jpg
    }
    state ProfileB {
        [*]: profile-b.jpg
    }
```

#### `renderProjects` — Card Structure

```mermaid
flowchart TD
    CARD["article.project-card"] --> TITLE["strong — project name"]
    CARD --> DESC["p — description"]
    CARD --> TECH["div.tech"]
    TECH --> B1["span.tech-badge"]
    TECH --> B2["span.tech-badge"]
    CARD --> LINKS["div.project-links"]
    LINKS --> DEMO["a.project-link--demo<br/>'▶ Play'"]
    LINKS --> REPO["a.project-link--repo<br/>'⌂ Repo'"]
    CARD --> PLAYBTN["button.timeline-play<br/>(Unity projects only)"]
    CARD --> CANVAS["canvas.timeline-canvas<br/>(Unity projects only)"]
```

#### `renderArcade` — Lazy Game Loading

```mermaid
sequenceDiagram
    participant U as User
    participant BTN as Insert Coin Button
    participant MOD as retroPacman.js
    participant HOST as .arcade-host div

    U->>BTN: Click "▶ Insert Coin"
    BTN->>MOD: dynamic import()
    MOD->>HOST: mountArcade(host)
    MOD-->>BTN: Returns cleanup function
    BTN->>BTN: Label → "✖ Close Arcade"

    U->>BTN: Click "✖ Close Arcade"
    BTN->>MOD: cleanup()
    MOD->>HOST: Remove cabinet DOM
    MOD->>MOD: Cancel rAF loop
    BTN->>BTN: Label → "▶ Insert Coin"
```

---

### 4.7 `styles.css` — Neo Theme Styles

```mermaid
graph TD
    subgraph "CSS Variables (root)"
        BG["--bg: #FDF6E3"]
        BK["--black: #000"]
        PK["--pink: #FF0055"]
        BL["--blue: #00C2FF"]
        YL["--yellow: #FFD60A"]
        WH["--white: #FFF"]
        BD["--border: 6px solid black"]
    end

    subgraph "Neo-Brutalism Patterns"
        BOX["Bold borders (6px solid)"]
        SHADOW["Solid box-shadows<br/>(8px 8px 0 0 black)"]
        HOVER["Hover: translateY(-8px)<br/>rotate(-0.6deg)"]
        ANIM["Enter animation:<br/>slide-up + fade-in"]
    end

    BG --> BOX
    BK --> SHADOW
    BD --> HOVER
```

**Key style categories:**

| Category | Classes | Description |
|----------|---------|-------------|
| Layout | `.container`, `#site-root` | Max-width 1100px centered |
| Cards | `.box`, `.card` | Bold border + shadow pattern |
| Hero | `.neo-hero`, `.hero-*` | Profile image positioning, deco block |
| Projects | `.projects-grid`, `.project-card` | CSS Grid, 1col → 2col at 720px |
| Tech Badges | `.tech-badge`, `.tech-*` | Color-coded per technology |
| Project Links | `.project-link`, `--demo`, `--repo` | Styled anchor buttons |
| Skills | `.skills-list`, `.skill` | Flexbox wrap of pill buttons |
| Games | `.timeline-*` | Canvas + play button styling |
| Arcade | `.neo-arcade`, `.arcade-*` | Arcade section styles |
| Animation | `.enter`, `@keyframes enter` | Staggered entrance effects |
| Accessibility | `@media prefers-reduced-motion` | Disables animations |
| Responsive | `@media (min-width: 720px)` | Grid + sizing breakpoints |

---

## 5. Games & Interactions

### 5.1 `heroParticles.js`

**What:** A canvas-based particle game overlaid on the hero section. Colorful particles float around; the user clicks/taps to remove them.

```mermaid
flowchart TD
    START["startGame(heroEl, options)"] --> MODE{"simple mode?"}
    MODE -->|Yes| SIMPLE["No UI, no timer<br/>tap removes particle"]
    MODE -->|No| FULL["Timer + score counter<br/>Click to collect"]

    SIMPLE --> CANVAS["Create <canvas><br/>position: absolute<br/>over hero section"]
    FULL --> CANVAS

    CANVAS --> SPAWN["Spawn 15-20 particles<br/>random positions + colors"]
    SPAWN --> LOOP["requestAnimationFrame loop"]

    LOOP --> PHYSICS["Update each particle:<br/>• Move toward mouse<br/>• Accel = 0.5<br/>• Friction = 0.97<br/>• Bounce off edges"]
    PHYSICS --> DRAW["Draw circles on canvas"]
    DRAW --> LOOP

    LOOP --> CLICK{"User clicks<br/>near particle?"}
    CLICK -->|Yes| SPLICE["Remove particle<br/>from array"]
    CLICK -->|No| LOOP

    START --> RETURN["Returns stop()"]
    RETURN --> CLEANUP["Remove canvas<br/>Cancel rAF<br/>Remove listeners"]
```

**Particle physics:**
- Each particle has `x, y, vx, vy, radius, color`
- Velocity moves toward cursor with `acceleration = 0.5`
- `friction = 0.97` damps velocity
- Bounces off canvas edges

---

### 5.2 `memoryMosaic.js`

**What:** A memory card matching game. Flip cards to find pairs.

```mermaid
flowchart TD
    START["start(container)"] --> GRID["Create 4x4 grid<br/>of face-down cards"]
    GRID --> PAIR["8 emoji pairs shuffled"]

    PAIR --> WAIT["Wait for click"]
    WAIT --> FLIP1["Flip first card"]
    FLIP1 --> FLIP2["Flip second card"]
    FLIP2 --> CHECK{"Cards match?"}
    CHECK -->|Yes| KEEP["Keep face-up<br/>Score += 1"]
    CHECK -->|No| HIDE["Flip both back<br/>after 600ms"]
    KEEP --> WIN{"All matched?"}
    WIN -->|Yes| DONE["Show win overlay"]
    WIN -->|No| WAIT
    HIDE --> WAIT
```

---

### 5.3 `paperRocket.js`

**What:** A decorative floating paper rocket (🚀) that bounces around the full viewport. Purely cosmetic — no interaction needed.

```mermaid
flowchart TD
    LOAD["Module loads<br/>(via script tag)"] --> CANVAS["Create full-viewport canvas<br/>position: fixed, z-index: 9999"]
    CANVAS --> INIT["Pick random start & target<br/>positions on screen"]
    INIT --> LOOP["requestAnimationFrame"]

    LOOP --> LERP["Interpolate position<br/>start → target<br/>t += 0.003"]
    LERP --> DRAW["Draw 🚀 emoji at<br/>current (x, y)"]
    DRAW --> CHECK{"t >= 1?"}
    CHECK -->|Yes| NEW["New random target<br/>t = 0"]
    CHECK -->|No| LOOP
    NEW --> LOOP

    LOAD --> UNLOAD["window.beforeunload<br/>→ cancel rAF"]
```

**Known bug:** `current` is referenced before declaration inside the `step()` function when `t >= 1` — this causes a `ReferenceError` on the first segment completion.

---

### 5.4 `timelineRunner.js`

**What:** A side-scrolling runner mini-game attached to the Unity project card. The player jumps over obstacles that represent experience cards.

```mermaid
flowchart TD
    START["start(expSection, canvas, cards)"] --> SETUP["Size canvas to parent<br/>Create player at left"]
    SETUP --> OVERLAY["Create overlay div<br/>for game-over / badges"]

    OVERLAY --> LOOP["requestAnimationFrame<br/>game loop"]
    LOOP --> INPUT["Listen for:<br/>Space / tap = jump"]
    INPUT --> PHYSICS["Player physics:<br/>gravity, jump velocity"]
    PHYSICS --> SCROLL["Scroll obstacles<br/>left at speed"]
    SCROLL --> COLLIDE{"Hit obstacle?"}
    COLLIDE -->|Yes| OVER["Game Over<br/>Show retry overlay"]
    COLLIDE -->|No| PASS{"Passed obstacle?"}
    PASS -->|Yes| HIGHLIGHT["Highlight exp-card<br/>in the DOM"]
    PASS -->|No| LOOP
    HIGHLIGHT --> LOOP

    OVER --> RETRY["Click overlay<br/>to restart"]
    RETRY --> LOOP
```

---

### 5.5 `retroPacman.js`

**What:** A full retro Pac-Man game rendered inside an arcade cabinet UI.

```mermaid
flowchart TD
    MOUNT["mountArcade(container)"] --> CSS["Inject arcade CSS<br/>(if not already)"]
    CSS --> DOM["Build cabinet DOM:<br/>marquee, bezel, screen,<br/>controls, coin slot"]
    DOM --> CANVAS["Get canvas context"]
    CANVAS --> STATE["createState()"]

    STATE --> MAP["Clone 19×21 tile map<br/>walls, dots, power pellets"]
    MAP --> PAC["Pacman at (9,15)<br/>dir = LEFT"]
    PAC --> GHOSTS["4 ghosts in house<br/>staggered release timers"]

    STATE --> INPUT["Input handlers"]
    INPUT --> KEYS["Keyboard: arrows / WASD"]
    INPUT --> DPAD["D-pad buttons: pointer"]
    INPUT --> SWIPE["Canvas: touch swipe"]
    INPUT --> BTNS["Start / Pause buttons"]

    STATE --> LOOP["rAF game loop<br/>@ 10 FPS (retro feel)"]
    LOOP --> UPDATE["update(state)"]
    LOOP --> DRAW["draw(ctx, state)"]

    UPDATE --> MOVEPAC["Move Pac-Man<br/>in current direction"]
    MOVEPAC --> EAT{"Tile type?"}
    EAT -->|Dot| SCORE["+10 points"]
    EAT -->|Power| POWER["+50 + scare ghosts"]
    EAT -->|Empty| SKIP["Continue"]

    UPDATE --> MOVEGH["Move ghosts"]
    MOVEGH --> AI{"Ghost scared?"}
    AI -->|Yes| RANDOM["Random direction"]
    AI -->|No| CHASE["Chase Pac-Man<br/>(minimize distance)"]

    UPDATE --> HIT{"Collision?"}
    HIT -->|Scared ghost| EATGHOST["Eat ghost → +200<br/>Send to house"]
    HIT -->|Normal ghost| LIFE["Lose life"]
    LIFE --> DEAD{"Lives = 0?"}
    DEAD -->|Yes| GAMEOVER["GAME OVER"]
    DEAD -->|No| RESET["Reset positions"]

    UPDATE --> WINCHECK{"All dots eaten?"}
    WINCHECK -->|Yes| WIN["YOU WIN!"]
```

#### Arcade Cabinet DOM Structure

```mermaid
graph TD
    CAB["div.arcade-cabinet"] --> MARQUEE["div.arcade-marquee<br/>'PAC-MAN' title<br/>with LED blink"]
    CAB --> BEZEL["div.arcade-bezel"]
    BEZEL --> WRAP["div.arcade-screen-wrap"]
    WRAP --> SCREEN["canvas.arcade-screen<br/>304×336 game area"]
    WRAP --> SCAN["div.arcade-scanlines<br/>CRT effect overlay"]
    WRAP --> CURVE["div.arcade-crt-curve<br/>reflection highlight"]
    CAB --> CTRL["div.arcade-controls"]
    CTRL --> JOY["div.arcade-joystick-area"]
    JOY --> BASE["div.arcade-joystick-base<br/>+ stick visual"]
    JOY --> DPAD["div.arcade-dpad<br/>▲ ◀ ● ▶ ▼ buttons"]
    CTRL --> ABTN["div.arcade-buttons-area"]
    ABTN --> START["button START"]
    ABTN --> PAUSE["button PAUSE"]
    CAB --> COIN["div.arcade-coin-slot<br/>+ 'INSERT COIN' label"]
    CAB --> FOOT["div.arcade-base"]
```

#### Game Map Layout (19×21 tiles)

```
0 = wall (blue)    1 = dot    2 = power pellet    3 = empty    4 = ghost house

Row  0: ███████████████████
Row  1: █·····   ·   · · ·█
Row  2: █○██·███·█·███·██○█
Row  3: █·················█
Row  4: █·██·█·███·█·██·█·█
Row  5: █····█···█···█····█
Row  6: ████·███ █ ███·████
Row  7: ████·█       █·████
Row  8: ████·█ ██G██ █·████
Row  9:     ·  █GGG█  ·     ← tunnel
Row 10: ████·█ █████ █·████
Row 11: ████·█       █·████
Row 12: ████·█ █████ █·████
Row 13: █·················█
Row 14: █·██·███·█·███·██·█
Row 15: █○·█·····P·····█·○█  ← Pac-Man start
Row 16: ██·█·█·███·█·█·█·██
Row 17: █····█···█···█····█
Row 18: █·██████·█·██████·█
Row 19: █·················█
Row 20: ███████████████████
```

---

## 6. Data Flow

How data moves through the system from source to screen:

```mermaid
flowchart LR
    subgraph Data Source
        PD["portfolioData.js<br/>(static export)"]
    end

    subgraph Bootstrap
        MAIN["main.js<br/>imports data"]
    end

    subgraph Renderer
        RS["renderSections()<br/>maps data → components"]
    end

    subgraph Components
        RH["renderHero(data.hero)"]
        RA["renderAbout(data.about)"]
        RE["renderExperience(data.experience)"]
        RP["renderProjects(data.projects)"]
        RSK["renderSkills(data.skills)"]
        RAR["renderArcade()"]
        RC["renderContact(data.contact)"]
    end

    subgraph DOM
        D1["section.neo-hero"]
        D2["section.neo-about"]
        D3["section.neo-experience"]
        D4["section.neo-projects"]
        D5["section.neo-skills"]
        D6["section.neo-arcade"]
        D7["section.neo-contact"]
    end

    PD --> MAIN --> RS
    RS --> RH --> D1
    RS --> RA --> D2
    RS --> RE --> D3
    RS --> RP --> D4
    RS --> RSK --> D5
    RS --> RAR --> D6
    RS --> RC --> D7
```

---

## 7. Theme System

```mermaid
flowchart TD
    subgraph ThemeManager
        SET["setTheme(name)"]
        GET["getComponents()"]
        ON["onThemeChange(cb)"]
        STORE["Internal state:<br/>• currentTheme<br/>• components map<br/>• listeners array"]
    end

    subgraph Theme Folder ["themes/neo/"]
        C["components.js<br/>exports: renderHero,<br/>renderAbout, etc."]
        S["styles.css<br/>neo-brutalism design"]
    end

    subgraph Theme Folder 2 ["themes/neo-dark/"]
        C2["(planned)"]
        S2["(planned)"]
    end

    SET -->|"import('./themes/neo/components.js')"| C
    SET -->|"inject <link href='styles.css'>"| S
    C --> STORE
    GET --> STORE
    ON --> STORE
```

**Adding a new theme:**

1. Create `src/themes/my-theme/components.js` — export the same function names
2. Create `src/themes/my-theme/styles.css` — define styles for the same class names
3. Call `themeManager.setTheme('my-theme')` — it auto-discovers the files by convention

---

## 8. Rendering Pipeline

```mermaid
flowchart TD
    TRIGGER["Trigger:<br/>• Initial boot<br/>• Theme change"] --> CLEANUP["Cleanup Phase"]

    subgraph Cleanup
        CLEANUP --> HERO_STOP["Stop hero particle<br/>systems"]
        CLEANUP --> ALL_STOP["Stop ALL elements<br/>with _stop()"]
        CLEANUP --> CLEAR["innerHTML = ''"]
    end

    CLEAR --> BUILD["Build Phase"]

    subgraph Build ["For each section in order"]
        BUILD --> CALL["components.renderX(data)"]
        CALL --> DOM["Returns <section> element"]
        DOM --> ANIMATE["Add .enter class<br/>delay = index × 80ms"]
        ANIMATE --> APPEND["Append to #site-root"]
    end

    APPEND --> DONE["Rendering complete"]
```

---

## 9. Game Lifecycle Pattern

All games follow a consistent pattern:

```mermaid
stateDiagram-v2
    [*] --> Idle: Module not loaded

    Idle --> Loading: User clicks trigger
    Loading --> Running: import() resolves
    Running --> Running: rAF loop
    Running --> Paused: Pause action
    Paused --> Running: Resume
    Running --> Stopped: User stops / cleanup called

    Stopped --> Idle: DOM removed

    state Running {
        [*] --> Update
        Update --> Draw
        Draw --> WaitFrame
        WaitFrame --> Update: next rAF
    }
```

**Pattern:**
```js
// Every game module exports a start function
export function startGame(container, options) {
  // 1. Create canvas/DOM
  // 2. Initialize state
  // 3. Setup input listeners
  // 4. Start rAF loop

  return function stop() {
    // 5. Cancel rAF
    // 6. Remove event listeners
    // 7. Remove DOM elements
  };
}
```

The returned `stop()` function is stored by the caller (button handler or renderer cleanup) and called when the game needs to be torn down. This prevents orphaned animation frames and memory leaks.

---

## 10. CSS Architecture

```mermaid
graph TD
    subgraph Global ["index.html (no global CSS)"]
        GF["Google Fonts: Inter"]
    end

    subgraph Theme CSS ["themes/neo/styles.css"]
        VARS["CSS Variables<br/>--bg, --black, --pink, etc."]
        RESET["Box-sizing reset<br/>Body margin/padding"]
        LAYOUT["Layout classes<br/>.container, #site-root"]
        COMPS["Component classes<br/>.neo-hero, .card, etc."]
        BADGES["Tech badge colors<br/>.tech-flutter, etc."]
        LINKS["Project link styles<br/>.project-link, etc."]
        ANIM["Animations<br/>.enter, @keyframes"]
        A11Y["Accessibility<br/>prefers-reduced-motion"]
        RESP["Responsive<br/>@media min-width: 720px"]
    end

    subgraph Game CSS ["Injected at runtime"]
        PACMAN["retroPacman.js<br/>injects #retro-pacman-css"]
    end

    GF --> VARS
    VARS --> RESET --> LAYOUT --> COMPS --> BADGES --> LINKS --> ANIM --> A11Y --> RESP
```

**Neo-Brutalism design tokens:**
- **Bold borders:** 6px solid black on everything
- **Solid shadows:** `8px 8px 0 0 black` (no blur)
- **Bright accent colors:** Pink `#FF0055`, Blue `#00C2FF`, Yellow `#FFD60A`
- **Hover effect:** `translateY(-8px) rotate(-0.6deg)` — elements "lift" and tilt
- **Entrance animation:** `translateY(12px) → 0` with opacity fade

---

## 11. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **No build tools** | Simplicity — native ES modules work in all modern browsers. Zero config, zero dependencies. |
| **Dynamic `import()`** for games | Games are heavy; lazy-loading keeps initial page load fast. Code only downloads when the user interacts. |
| **Theme as folder convention** | Each theme is self-contained. Adding a theme = adding a folder with 2 files. No config needed. |
| **`_stop()` cleanup pattern** | Prevents memory leaks from `requestAnimationFrame` loops when sections re-render or games close. |
| **CSS variables for design tokens** | Makes future theme variants easy — override variables without rewriting selectors. |
| **`create()` helper vs innerHTML** | DOM API is safer (no XSS risk) and gives typed references for event listeners. |
| **7 FPS for Pac-Man** | Neutral retro game feel — reduced from 10 FPS for a more relaxed play speed. |
| **Arcade CSS injected by JS** | The arcade game is optional; its styles only load when the module is imported. Avoids bloating the theme CSS. |
| **Profile orbit animation** | CSS `@keyframes profileOrbit` rotates an icon 360° around the hero profile image in 4s loop. |

---

## 12. UI Refinements (refine-ui branch)

This section documents the 8 UI/UX refinements applied in the `refine-ui` branch.

### 12.1 Arcade moved to header

The bottom arcade section (`renderArcade`) was removed. Instead, a small retro arcade-machine SVG icon sits in the header next to "Praveen Ramesh". Clicking it opens a full-screen overlay that dynamically imports and mounts the Pac-Man game.

```mermaid
sequenceDiagram
    participant U as User
    participant H as Header Icon
    participant O as Overlay
    participant P as retroPacman.js

    U->>H: Click arcade icon
    H->>O: Create .arcade-overlay (full-screen)
    O->>P: Dynamic import() + mountArcade()
    P-->>O: Game renders inside overlay
    U->>O: Click ✕ close
    O->>P: stopFn() cleanup
    O->>O: Remove overlay from DOM
```

### 12.2 Animated animals from accent block

Below the hero meta section, a row of animal emojis (🐇🦊🐈🐕🐿️) run rightward from the red accent block in a staggered infinite loop using CSS `@keyframes animalRun`. Each animal has an increasing `animation-delay` (1.8s apart).

### 12.3 Terminal minimize / close animations

The experience terminal gained window-control buttons:
- **Minimize (−):** Toggles between the full terminal body and a compact view showing only company names and durations.
- **Close (×):** Shrinks the terminal to zero scale and opacity, then pops it back open after 1 second using `@keyframes terminalPop`.

### 12.4 Skill blast animation

Clicking any skill node triggers:
1. 12 radial particles burst outward from the node's center (`@keyframes skillParticleBurst`)
2. The node itself disappears (`skill-blasting` class)
3. After 700ms, the node reappears with a scale pop effect (`skill-reappear` class)

### 12.5 Project cards — anime avatars, 3D tilt, consistent layout

```mermaid
graph LR
    subgraph Card["project-card-3d"]
        BODY["project-card-body"]
        FOOTER["project-card-footer"]
    end

    BODY --> A["Anime SVG Avatar"]
    BODY --> T["Title"]
    BODY --> D["Description"]
    BODY --> TB["Tech Badges"]

    FOOTER --> L["Play / Repo links"]
    FOOTER --> V["View More btn"]
```

- **Anime-style SVG avatars** replace letter-initial circles. Four variants matched by tech: Flutter (blue character), Unity (dark character), JavaScript (yellow character with JS hat), and a default pink character.
- **3D perspective tilt** on `mousemove` — calculates cursor position relative to card and applies `perspective(600px) rotateY() rotateX() scale(1.02)`. Resets on `mouseleave`.
- **Consistent footer layout** — cards now use `project-card-body` (flex-grow, pushes content up) and `project-card-footer` (pinned to bottom via `margin-top:auto`) so Play buttons and View More align across all cards regardless of content height.

### 12.6 Bottom arcade removed

`renderArcade()` function deleted from `components.js`. The `{ fn: 'renderArcade', data: null }` entry removed from `renderer.js` section order array. The arcade is accessible only via the header icon now.

### 12.7 Kite removed, profile orbit + mobile tap toggle

- **Paper rocket (kite) removed:** `<script>` tag for `paperRocket.js` removed from `index.html`. The floating decorative rocket no longer appears.
- **Profile orbit:** An ⚡ icon orbits the hero profile image using `@keyframes profileOrbit` (4s linear infinite rotation). The orbit wrap is absolutely positioned over the profile.
- **Mobile tap toggle:** On touch devices, tapping the profile image now toggles between `profile-a.jpg` and `profile-b.jpg` (sticky toggle instead of the previous auto-revert after 1.2s).

### 12.8 Refined contact section

The contact section was redesigned as a neo-brutal card:
- Envelope SVG icon at the top
- Labeled rows for Email (clickable mailto link) and Location
- Horizontal divider
- Two action buttons: "📋 Copy Email" (clipboard API with ✅ success state) and "🚀 Say Hello" (mailto link)
- Hover lift + box-shadow effect on buttons
- Mobile-responsive: buttons stack vertically on small screens

---

*Updated for the `refine-ui` branch — Feb 2026*
