import * as vg from '@uwdata/vgplot';
import { initLoader, loadPatientData, q } from './data/loader.js';
import { initPatientCatalog } from './data/patientCatalog.js';
import {
  minSamples,
  maxSamples,
  setMaxSamples,
  params,
  setActivePatient,
  activePatient,
} from './state/params.js';
import { createHypnogram } from './components/hypnogram.js';
import {
  getMetrics,
  severityLabel,
  severityColor,
} from './components/metricsPanel.js';
import { createSignalPlots } from './components/signalPlots.js';
import { createEventTracks } from './components/eventTracks.js';
import { createControls } from './components/controls.js';
import { createTimelineStrip } from './components/timelineStrip.js';
import { createEventDensity } from './components/eventDensity.js';
import { createTransitionMatrix } from './components/transitionMatrix.js';
import { initHoverCard } from './components/hoverCard.js';
import { createPatientBrowser } from './components/patientBrowser.js';
import { createCohortCompare } from './components/cohortCompare.js';

const base = import.meta.env.BASE_URL;
const rendered = new Set();
const loadingEl = document.getElementById('app-loading');

const routes = {
  '/': 'page-overview',
  '/index.html': 'page-overview',
  '/overview': 'page-overview',
  '/analysis': 'page-analysis',
  '/patients': 'page-patients',
  '/about': 'page-about',
};

const titles = {
  'page-overview': 'Overview — PolyVis',
  'page-analysis': 'Analysis — PolyVis',
  'page-patients': 'Patients — PolyVis',
  'page-about': 'About — PolyVis',
};

function normalizePath(path) {
  if (base !== '/' && path.startsWith(base)) {
    path = '/' + path.slice(base.length);
  }
  return path;
}

function showPage(rawPath) {
  const path = normalizePath(rawPath);
  document
    .querySelectorAll('.page')
    .forEach((p) => p.classList.remove('active'));
  document
    .querySelectorAll('.nav-link')
    .forEach((l) => l.classList.remove('active'));

  const pageId = routes[path] || 'page-overview';
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');

  const link = document.querySelector(`.nav-link[data-route="${path}"]`);
  if (link) link.classList.add('active');

  document.title = titles[pageId] || 'PolyVis';

  if (!rendered.has(pageId)) {
    renderPage(pageId);
    rendered.add(pageId);
  }
}

function clearRenderedPages() {
  rendered.clear();

  document.querySelectorAll('.plot-card').forEach((el) => el.remove());
  document
    .querySelectorAll('#overview-hypnogram > div, #container2 > div')
    .forEach((el) => el.remove());
  document
    .querySelectorAll(
      '#overview-spo2 > div, #overview-event-density > div, #overview-transitions > div',
    )
    .forEach((el) => el.remove());

  document.querySelectorAll('.overview-metrics-grid').forEach((el) => {
    el.innerHTML = '';
  });
  document.querySelectorAll('.timeline-grid').forEach((el) => {
    el.innerHTML = '';
  });

  const arch = document.getElementById('overview-architecture');
  if (arch) arch.innerHTML = '';

  const controls = document.getElementById('controls');
  if (controls) controls.innerHTML = '';
  const eventsContainer = document.getElementById('eventsContainer');
  if (eventsContainer) eventsContainer.innerHTML = '';
  const plotArea = document.getElementById('container');
  if (plotArea) plotArea.innerHTML = '';
}

function renderPage(pageId) {
  switch (pageId) {
    case 'page-overview':
      renderOverview();
      break;
    case 'page-analysis':
      renderAnalysis();
      break;
    case 'page-patients':
      renderPatients();
      break;
    case 'page-about':
      break;
  }
}

function renderOverview() {
  createHypnogram({
    containerId: 'overview-hypnogram',
    height: 400,
    clickToZoom: false,
  });
  createTimelineStrip().catch(() => {});
  createEventDensity().catch(() => {});
  createTransitionMatrix().catch(() => {});
  q(`CREATE OR REPLACE TABLE spo2_hist AS
            SELECT ROUND("SaO2", 0) AS bucket, COUNT(*) AS cnt
            FROM signal WHERE "SaO2" > 0
            GROUP BY bucket ORDER BY bucket`)
    .then(() => {
      document.getElementById('overview-spo2').appendChild(
        vg.plot(
          vg.rectY(vg.from('spo2_hist'), {
            x: 'bucket',
            y: 'cnt',
            fill: '#e6edf3',
          }),
          vg.ruleX({
            x: 90,
            stroke: '#f0883e',
            strokeDash: [4, 3],
            strokeOpacity: 0.8,
          }),
          vg.ruleX({
            x: 88,
            stroke: '#f04040',
            strokeDash: [4, 3],
            strokeOpacity: 0.8,
          }),
          vg.xLabel('SaO₂ (%)'),
          vg.yLabel('Count'),
          vg.height(320),
        ),
      );
    })
    .catch(() => {});
  getMetrics(q)
    .then((metrics) => {
      const grid = document
        .getElementById('overview-metrics')
        .querySelector('.overview-metrics-grid');
      grid.innerHTML = `
                <div class="overview-metric">
                    <div class="overview-metric-label">AHI</div>
                    <div class="overview-metric-value">${metrics.ahi.toFixed(1)} <span class="severity-badge" style="--badge-color:${severityColor(metrics.ahi)}"></span><span class="severity">${severityLabel(metrics.ahi)}</span></div>
                </div>
                <div class="overview-metric">
                    <div class="overview-metric-label">ODI</div>
                    <div class="overview-metric-value">${metrics.odi.toFixed(1)}</div>
                </div>
                <div class="overview-metric">
                    <div class="overview-metric-label">Sleep Time</div>
                    <div class="overview-metric-value">${metrics.sleepHours.toFixed(1)} <span class="severity">hours</span></div>
                </div>
                <div class="overview-metric">
                    <div class="overview-metric-label">Min SaO₂</div>
                    <div class="overview-metric-value">${metrics.minSaO2.toFixed(1)}<span class="severity">%</span></div>
                </div>
                <div class="overview-metric">
                    <div class="overview-metric-label">Mean SaO₂</div>
                    <div class="overview-metric-value">${metrics.avgSaO2.toFixed(1)}<span class="severity">%</span></div>
                </div>
                <div class="overview-metric">
                    <div class="overview-metric-label">Time &lt;88%</div>
                    <div class="overview-metric-value">${metrics.pctBelow88.toFixed(1)}<span class="severity">%</span></div>
                </div>
                <div class="overview-metric">
                    <div class="overview-metric-label">Time &lt;90%</div>
                    <div class="overview-metric-value">${metrics.pctBelow90.toFixed(1)}<span class="severity">%</span></div>
                </div>
                <div class="overview-metric">
                    <div class="overview-metric-label">Resp Events</div>
                    <div class="overview-metric-value">${metrics.respCnt}</div>
                </div>
                <div class="overview-metric">
                    <div class="overview-metric-label">Desats ≥3%</div>
                    <div class="overview-metric-value">${metrics.o2Desats}</div>
                </div>
            `;
    })
    .catch(() => {});
  q(`
    WITH onset AS (
      SELECT MIN("Sample#") AS first_sleep FROM hypn
      WHERE Aux IN ('1','2','3','4','R')
    )
    SELECT
      ROUND(
        SUM(CASE WHEN h.Aux = 'W' AND h."Sample#" >= o.first_sleep THEN 1 ELSE 0 END) * 30.0 / 60.0, 1
      ) AS waso_min,
      ROUND(
        SUM(CASE WHEN h.Aux = '1' THEN 1 ELSE 0 END) * 100.0 /
        NULLIF(SUM(CASE WHEN h.Aux IN ('1','2','3','4','R') THEN 1 ELSE 0 END), 0), 1
      ) AS n1_pct,
      ROUND(
        SUM(CASE WHEN h.Aux IN ('1','2','3','4','R') THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1
      ) AS sleep_efficiency
    FROM hypn h
    CROSS JOIN onset o
  `)
    .then(([arch]) => {
      const el = document.getElementById('overview-architecture');
      el.innerHTML = `
        <div class="arch-stats">
          <div class="arch-stat">
            <div class="arch-stat-label">WASO</div>
            <div class="arch-stat-value">${arch.waso_min} <span class="arch-stat-unit">min</span></div>
          </div>
          <div class="arch-stat">
            <div class="arch-stat-label">N1 %</div>
            <div class="arch-stat-value">${arch.n1_pct}<span class="arch-stat-unit">%</span></div>
          </div>
          <div class="arch-stat">
            <div class="arch-stat-label">Sleep Efficiency</div>
            <div class="arch-stat-value">${arch.sleep_efficiency}<span class="arch-stat-unit">%</span></div>
          </div>
        </div>
      `;
    })
    .catch(() => {});
}

function renderAnalysis() {
  createControls();
  createSignalPlots().catch(() => {});
  createHypnogram({ height: 180, onBrush: zoomToRange });
  createEventTracks();
}

function renderPatients() {
  createPatientBrowser('patient-browser', {
    onSwitchPatient: switchPatient,
  });
}

async function switchPatient(id) {
  if (id === activePatient) return;

  const loadingEl = document.getElementById('app-loading');
  loadingEl.classList.remove('hidden');

  try {
    await loadPatientData(id);
    setActivePatient(id);
    const [{ cnt }] = await q('SELECT COUNT(*) AS cnt FROM signal');
    setMaxSamples(cnt);

    clearRenderedPages();

    loadingEl.classList.add('hidden');
    history.pushState({}, '', '/');
    showPage('/');
  } catch (err) {
    console.warn('Failed to switch patient:', err);
    loadingEl.classList.add('hidden');
  }
}

await initLoader();
await initPatientCatalog();
const [{ cnt }] = await q('SELECT COUNT(*) AS cnt FROM signal');
setMaxSamples(cnt);
loadingEl.classList.add('hidden');
initHoverCard();

const zoomToRange = (range) => {
  const x1 = Math.max(minSamples, Math.min(range[0], maxSamples));
  const x2 = Math.max(minSamples, Math.min(range[1], maxSamples));
  params.sampleDomain.update([x1, x2], { force: true });
  params.xs._resolved = [];
  params.xs.update([x1, x2], { force: true });
};

document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const rawPath = new URL(link.href).pathname;
    history.pushState({}, '', rawPath);
    showPage(rawPath);
  });
});

window.addEventListener('popstate', () => showPage(location.pathname));

function showModal() {
  const modal = document.getElementById('cohort-modal');
  if (modal) modal.style.display = '';
}

function hideModal() {
  const modal = document.getElementById('cohort-modal');
  const body = document.getElementById('cohort-comparison');
  if (modal) modal.style.display = 'none';
  if (body) body.innerHTML = '';
}

document.getElementById('modal-close-btn').addEventListener('click', hideModal);
document.querySelector('.modal-backdrop').addEventListener('click', hideModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideModal();
});

document.addEventListener('compare-patients', (e) => {
  const { ids } = e.detail;
  showModal();
  createCohortCompare('cohort-comparison', ids);
});

const redirect = sessionStorage.getItem('gh-pages-redirect');
if (redirect) {
  sessionStorage.removeItem('gh-pages-redirect');
  history.replaceState({}, '', redirect);
  showPage(redirect);
} else {
  showPage(location.pathname);
}
