// Simple Memory Mosaic: Widget Match (4x4)
// Usage: import('./src/games/memoryMosaic.js').then(m=>m.start());

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function start(root = document.body, opts = {}) {
  const cards = [
    'Container', 'Row', 'Column', 'ListView',
    'IconButton', 'Scaffold', 'StatefulWidget', 'StatelessWidget'
  ];
  const pairs = cards.concat(cards).slice(0, 16);
  shuffle(pairs);

  // overlay
  const overlay = document.createElement('div');
  overlay.className = 'mm-overlay';
  overlay.innerHTML = `
    <div class="mm-board" role="application" aria-label="Widget Match">
      <header class="mm-header">
        <strong>Widget Match</strong>
        <button class="mm-close" aria-label="Close">✕</button>
      </header>
      <div class="mm-grid" role="grid"></div>
      <footer class="mm-footer">
        <button class="mm-retry">Retry</button>
      </footer>
    </div>`;

  const style = document.createElement('style');
  style.textContent = `
    .mm-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:200}
    .mm-board{width:min(520px,92vw);background:#fff;border:6px solid #000;padding:12px;box-shadow:10px 10px 0 #000}
    .mm-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
    .mm-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
    .mm-card{position:relative;padding-top:100%;background:#eee;border:4px solid #000;cursor:pointer;overflow:hidden}
    .mm-card button{position:absolute;inset:0;border:0;background:transparent;font-weight:800;display:flex;align-items:center;justify-content:center;transform:translateY(8px);}
    .mm-card.flipped{background:#00C2FF;color:#000}
    .mm-footer{display:flex;justify-content:center;margin-top:10px}
    .mm-retry{border:6px solid #000;background:#FFD60A;padding:8px 12px;font-weight:800}
    .mm-close{border:4px solid #000;background:#FF0055;color:#fff;padding:6px 8px}
  `;

  document.head.appendChild(style);
  document.body.appendChild(overlay);

  const grid = overlay.querySelector('.mm-grid');
  const closeBtn = overlay.querySelector('.mm-close');
  const retryBtn = overlay.querySelector('.mm-retry');

  let first = null;
  let second = null;
  let lock = false;
  let matched = 0;

  function makeCard(text, index) {
    const wrap = document.createElement('div');
    wrap.className = 'mm-card';
    wrap.dataset.idx = String(index);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'card');
    btn.textContent = '';
    wrap.appendChild(btn);
    wrap.addEventListener('click', () => onFlip(wrap, text));
    return wrap;
  }

  function onFlip(el, text) {
    if (lock) return;
    if (el.classList.contains('flipped')) return;
    el.classList.add('flipped');
    el.querySelector('button').textContent = text;
    if (!first) {
      first = { el, text };
      return;
    }
    if (!second) {
      second = { el, text };
      lock = true;
      setTimeout(checkMatch, 600);
    }
  }

  function checkMatch() {
    if (first.text === second.text) {
      matched += 1;
      // keep flipped
      first.el.classList.add('matched');
      second.el.classList.add('matched');
      first.el.removeEventListener('click', onFlip);
      second.el.removeEventListener('click', onFlip);
      if (matched === pairs.length / 2) {
        showWin();
      }
    } else {
      first.el.classList.remove('flipped');
      second.el.classList.remove('flipped');
      first.el.querySelector('button').textContent = '';
      second.el.querySelector('button').textContent = '';
    }
    first = null;
    second = null;
    lock = false;
  }

  function showWin() {
    const msg = document.createElement('div');
    msg.textContent = 'You Win!';
    msg.style.fontWeight = '900';
    msg.style.marginTop = '8px';
    overlay.querySelector('.mm-footer').appendChild(msg);
  }

  function resetBoard() {
    first = second = null;
    lock = false;
    matched = 0;
    // reshuffle
    shuffle(pairs);
    grid.innerHTML = '';
    pairs.forEach((p, i) => grid.appendChild(makeCard(p, i)));
  }

  function onClose() { stop(); }

  retryBtn.addEventListener('click', resetBoard);
  closeBtn.addEventListener('click', onClose);
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') stop();
  });

  // init
  resetBoard();
  // focus for keyboard
  overlay.tabIndex = -1;
  overlay.focus();

  function stop() {
    retryBtn.removeEventListener('click', resetBoard);
    closeBtn.removeEventListener('click', onClose);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    if (style.parentNode) style.parentNode.removeChild(style);
  }

  return stop;
}

export default { start };
