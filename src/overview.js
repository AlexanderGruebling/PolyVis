import { initLoader, q } from './data/loader.js';
import { createHypnogram } from './components/hypnogram.js';
import { getMetrics, severityLabel } from './components/metricsPanel.js';

await initLoader();

createHypnogram({ containerId: "overview-hypnogram", height: 400, clickToZoom: false });

document.getElementById('overview-loading').classList.add('hidden');

const metrics = await getMetrics(q);
const grid = document.getElementById("overview-metrics").querySelector(".overview-metrics-grid");

grid.innerHTML = `
    <div class="overview-metric">
        <div class="overview-metric-label">AHI</div>
        <div class="overview-metric-value">${metrics.ahi.toFixed(1)} <span class="severity">${severityLabel(metrics.ahi)}</span></div>
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