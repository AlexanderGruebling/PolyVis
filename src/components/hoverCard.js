import { q } from '../data/loader.js';

let cardEl = null;
let hideTimer = null;
let lastX = 0;
let lastY = 0;
let mouseInside = false;
let updateTimer = null;

const STAGE_LABELS = {
  W: 'Wake',
  R: 'REM',
  1: 'N1',
  2: 'N2',
  3: 'N3',
  4: 'N4',
};

export function initHoverCard() {
  cardEl = document.createElement('div');
  cardEl.className = 'hover-card';
  document.body.appendChild(cardEl);
}

export function trackCursor(x, y) {
  lastX = x;
  lastY = y;
  mouseInside = true;
  clearTimeout(hideTimer);
}

export function cursorLeft() {
  mouseInside = false;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (!mouseInside) cardEl.classList.remove('visible');
  }, 150);
}

export function updateHoverCard(pos) {
  if (!cardEl) return;

  clearTimeout(updateTimer);
  updateTimer = setTimeout(async () => {
    if (!mouseInside) {
      cardEl.classList.remove('visible');
      return;
    }

    try {
      const [stageRows, respRows, arouRows] = await Promise.all([
        q(
          `SELECT Aux FROM hypn WHERE "Sample#" <= ${pos} ORDER BY "Sample#" DESC LIMIT 1`,
        ),
        q(
          `SELECT COUNT(*) AS cnt FROM resp WHERE "Sample#" BETWEEN ${pos - 30} AND ${pos + 30}`,
        ),
        q(
          `SELECT COUNT(*) AS cnt FROM arou WHERE "Sample#" BETWEEN ${pos - 30} AND ${pos + 30}`,
        ),
      ]);

      let desatDepth = null;
      try {
        const desatRows = await q(
          `SELECT depth FROM desats WHERE x1 <= ${pos} AND x2 >= ${pos} LIMIT 1`,
        );
        if (desatRows.length > 0) desatDepth = desatRows[0].depth;
      } catch {
        // desats table may not exist yet
      }

      const stageCode = (stageRows[0] && stageRows[0].Aux) || '—';
      const stageLabel = STAGE_LABELS[stageCode] || stageCode;
      const desatText =
        desatDepth !== null ? `↓${desatDepth}%` : '—';
      const respCount = (respRows[0] && respRows[0].cnt) || 0;
      const arouCount = (arouRows[0] && arouRows[0].cnt) || 0;

      cardEl.innerHTML = `
        <div><span class="label">Stage</span> <span class="stage">${stageLabel}</span></div>
        <div><span class="label">Desat</span> ${desatText}</div>
        <div><span class="label">Resp Events</span> ${respCount}</div>
        <div><span class="label">Arousals</span> ${arouCount}</div>
      `;

      const cardW = 180;
      const cardH = cardEl.offsetHeight || 120;
      let left = lastX + 16;
      let top = lastY - cardH / 2;
      if (left + cardW > window.innerWidth - 12) {
        left = lastX - cardW - 16;
      }
      if (top < 12) top = 12;
      if (top + cardH > window.innerHeight - 12) {
        top = window.innerHeight - cardH - 12;
      }
      cardEl.style.left = `${left}px`;
      cardEl.style.top = `${top}px`;
      cardEl.classList.add('visible');
    } catch {
      cursorLeft();
    }
  }, 30);
}
