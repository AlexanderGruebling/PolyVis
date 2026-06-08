import { initLoader, q } from './data/loader.js';
import { createHypnogram } from './components/hypnogram.js';
import { computeMetrics } from './components/metricsPanel.js';

await initLoader();

createHypnogram({ containerId: "overview-hypnogram", height: 400, clickToZoom: false });

document.getElementById('overview-loading').classList.add('hidden');

// compute metrics and render into grid cards
const metricsContent = document.getElementById("overview-metrics").querySelector(".overview-metrics-grid");

const epochSeconds = 30;
const sleepRows = await q("SELECT COUNT(*) AS cnt FROM hypn WHERE Aux IN ('1','2','3','4')");
const sleepHours = Number(sleepRows[0].cnt) * epochSeconds / 3600;

const respRows = await q("SELECT COUNT(*) AS cnt FROM resp");
const respCnt = Number(respRows[0].cnt);
const ahi = sleepHours > 0 ? (respCnt / sleepHours) : 0;

const saO2Rows = await q(`SELECT MIN("SaO2") AS m, AVG("SaO2") AS a FROM signal WHERE "SaO2" > 0`);
const minSaO2 = Number(saO2Rows[0].m);
const avgSaO2 = Number(saO2Rows[0].a);

const pct88Rows = await q(
    `SELECT COUNT(*) * 100.0 / (SELECT COUNT(*) FROM signal WHERE "SaO2" > 0) AS v FROM signal WHERE "SaO2" > 0 AND "SaO2" < 88`
);
const pct90Rows = await q(
    `SELECT COUNT(*) * 100.0 / (SELECT COUNT(*) FROM signal WHERE "SaO2" > 0) AS v FROM signal WHERE "SaO2" > 0 AND "SaO2" < 90`
);
const pctBelow88 = Number(pct88Rows[0].v);
const pctBelow90 = Number(pct90Rows[0].v);

const allSaO2 = await q(`SELECT "SaO2" FROM signal WHERE "SaO2" > 0 ORDER BY time`);
const values = allSaO2.map(r => Number(r.SaO2));
let o2Desats = 0;
let inDesat = false;
const baselineWindow = 10;
for (let i = baselineWindow; i < values.length; i++) {
    const baseline = values.slice(i - baselineWindow, i).reduce((a, b) => a + b, 0) / baselineWindow;
    if (baseline - values[i] >= 3) {
        if (!inDesat) { o2Desats++; inDesat = true; }
    } else {
        inDesat = false;
    }
}
const odi = sleepHours > 0 ? (o2Desats / sleepHours) : 0;

function severityLabel(v) {
    if (v < 5) return "(normal)";
    if (v < 15) return "(mild)";
    if (v < 30) return "(moderate)";
    return "(severe)";
}

metricsContent.innerHTML = `
    <div class="overview-metric">
        <div class="overview-metric-label">AHI</div>
        <div class="overview-metric-value">${ahi.toFixed(1)} <span class="severity">${severityLabel(ahi)}</span></div>
    </div>
    <div class="overview-metric">
        <div class="overview-metric-label">ODI</div>
        <div class="overview-metric-value">${odi.toFixed(1)}</div>
    </div>
    <div class="overview-metric">
        <div class="overview-metric-label">Sleep Time</div>
        <div class="overview-metric-value">${sleepHours.toFixed(1)} <span class="severity">hours</span></div>
    </div>
    <div class="overview-metric">
        <div class="overview-metric-label">Min SaO₂</div>
        <div class="overview-metric-value">${minSaO2.toFixed(1)}<span class="severity">%</span></div>
    </div>
    <div class="overview-metric">
        <div class="overview-metric-label">Mean SaO₂</div>
        <div class="overview-metric-value">${avgSaO2.toFixed(1)}<span class="severity">%</span></div>
    </div>
    <div class="overview-metric">
        <div class="overview-metric-label">Time &lt;88%</div>
        <div class="overview-metric-value">${pctBelow88.toFixed(1)}<span class="severity">%</span></div>
    </div>
    <div class="overview-metric">
        <div class="overview-metric-label">Time &lt;90%</div>
        <div class="overview-metric-value">${pctBelow90.toFixed(1)}<span class="severity">%</span></div>
    </div>
    <div class="overview-metric">
        <div class="overview-metric-label">Resp Events</div>
        <div class="overview-metric-value">${respCnt}</div>
    </div>
    <div class="overview-metric">
        <div class="overview-metric-label">Desats ≥3%</div>
        <div class="overview-metric-value">${o2Desats}</div>
    </div>
`;
