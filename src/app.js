import * as vg from '@uwdata/vgplot';
import { initLoader, q } from './data/loader.js';
import {
  minSamples,
  maxSamples,
  setMaxSamples,
  params,
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

const rendered = new Set();
const loadingEl = document.getElementById('app-loading');

const routes = {
  '/': 'page-overview',
  '/index.html': 'page-overview',
  '/overview': 'page-overview',
  '/analysis': 'page-analysis',
  '/about': 'page-about',
};

const titles = {
  'page-overview': 'Overview — PolyVis',
  'page-analysis': 'Analysis — PolyVis',
  'page-about': 'About — PolyVis',
};

function showPage(path) {
  document
    .querySelectorAll('.page')
    .forEach((p) => p.classList.remove('active'));
  document
    .querySelectorAll('.nav-link')
    .forEach((l) => l.classList.remove('active'));

  const pageId = routes[path] || 'page-overview';
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');

  const link = document.querySelector(`.nav-link[href="${path}"]`);
  if (link) link.classList.add('active');

  document.title = titles[pageId] || 'PolyVis';

  if (!rendered.has(pageId)) {
    renderPage(pageId);
    rendered.add(pageId);
  }
}

function renderPage(pageId) {
  switch (pageId) {
    case 'page-overview':
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
      break;
    case 'page-analysis':
      createControls();
      createSignalPlots().catch(() => {});
      createHypnogram({ height: 180, onBrush: zoomToRange });
      createEventTracks();
      break;
    case 'page-about':
      break;
  }
}

await initLoader();
const [{ cnt }] = await q('SELECT COUNT(*) AS cnt FROM signal');
setMaxSamples(cnt);
loadingEl.classList.add('hidden');

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
    const path = new URL(link.href).pathname;
    history.pushState({}, '', path);
    showPage(path);
  });
});

window.addEventListener('popstate', () => showPage(location.pathname));

showPage(location.pathname);
