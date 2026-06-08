import * as vg from "@uwdata/vgplot";
import { initLoader, q } from './data/loader.js';
import { createHypnogram } from './components/hypnogram.js';
import { getMetrics, severityLabel } from './components/metricsPanel.js';

await initLoader();

createHypnogram({ containerId: "overview-hypnogram", height: 400, clickToZoom: false });

document.getElementById('overview-loading').classList.add('hidden');

await q(`CREATE OR REPLACE TABLE spo2_hist AS
    SELECT ROUND("SaO2", 0) AS bucket, COUNT(*) AS cnt
    FROM signal WHERE "SaO2" > 0
    GROUP BY bucket ORDER BY bucket`);

document.getElementById('overview-spo2').appendChild(
    vg.plot(
        vg.rectY(vg.from("spo2_hist"), { x: "bucket", y: "cnt", fill: "#e6edf3" }),
        vg.ruleX({ x: 90, stroke: "#f0883e", strokeDash: [4, 3], strokeOpacity: 0.8 }),
        vg.ruleX({ x: 88, stroke: "#f04040", strokeDash: [4, 3], strokeOpacity: 0.8 }),
        vg.xLabel("SaO₂ (%)"),
        vg.yLabel("Count"),
        vg.height(250),
    )
);

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