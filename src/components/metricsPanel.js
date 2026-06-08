export async function getMetrics(q) {
    const epochSeconds = 30;
    const sleepRows = await q("SELECT COUNT(*) AS cnt FROM hypn WHERE Aux IN ('1','2','3','4','R')");
    const sleepHours = Number(sleepRows[0].cnt) * epochSeconds / 3600;

    const respRows = await q("SELECT COUNT(*) AS cnt FROM resp");
    const respCnt = Number(respRows[0].cnt);
    const ahi = sleepHours > 0 ? respCnt / sleepHours : 0;

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
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
        if (i >= 10) sum -= values[i - 10];
        sum += values[i];
        if (i >= 9) {
            const baseline = sum / 10;
            if (baseline - values[i] >= 3) {
                if (!inDesat) { o2Desats++; inDesat = true; }
            } else {
                inDesat = false;
            }
        }
    }
    const odi = sleepHours > 0 ? o2Desats / sleepHours : 0;

    return { ahi, odi, sleepHours, minSaO2, avgSaO2, pctBelow88, pctBelow90, respCnt, o2Desats };
}

export async function getDesaturationIntervals(q) {
    const allSaO2 = await q(`SELECT time, "SaO2" FROM signal WHERE "SaO2" > 0 ORDER BY time`);
    const vals = allSaO2.map(r => ({ time: Number(r.time), value: Number(r.SaO2) }));
    const intervals = [];
    let start = null;
    let sum = 0;
    for (let i = 0; i < vals.length; i++) {
        if (i >= 10) sum -= vals[i - 10].value;
        sum += vals[i].value;
        if (i >= 9) {
            const baseline = sum / 10;
            if (baseline - vals[i].value >= 3) {
                if (start === null) start = vals[Math.max(0, i - 10)].time;
            } else {
                if (start !== null) { intervals.push({ start, end: vals[i].time }); start = null; }
            }
        }
    }
    if (start !== null) intervals.push({ start, end: vals[vals.length - 1].time });
    return intervals;
}

export function severityLabel(v) {
    if (v < 5) return "(normal)";
    if (v < 15) return "(mild)";
    if (v < 30) return "(moderate)";
    return "(severe)";
}

export async function computeMetrics(q, containerId = "metrics-content") {
    const el = document.getElementById(containerId);
    if (!el) return;
    const { ahi, odi, sleepHours, minSaO2, avgSaO2, pctBelow88, pctBelow90, respCnt, o2Desats } = await getMetrics(q);
    el.innerHTML = `
        <div class="metric-row"><span class="metric-label">AHI</span><span class="metric-value">${ahi.toFixed(1)} ${severityLabel(ahi)}</span></div>
        <div class="metric-row"><span class="metric-label">ODI</span><span class="metric-value">${odi.toFixed(1)}</span></div>
        <div class="metric-row"><span class="metric-label">Sleep</span><span class="metric-value">${sleepHours.toFixed(1)} h</span></div>
        <hr>
        <div class="metric-row"><span class="metric-label">Min SaO₂</span><span class="metric-value">${minSaO2.toFixed(1)}%</span></div>
        <div class="metric-row"><span class="metric-label">Mean SaO₂</span><span class="metric-value">${avgSaO2.toFixed(1)}%</span></div>
        <div class="metric-row"><span class="metric-label">Time &lt;88%</span><span class="metric-value">${pctBelow88.toFixed(1)}%</span></div>
        <div class="metric-row"><span class="metric-label">Time &lt;90%</span><span class="metric-value">${pctBelow90.toFixed(1)}%</span></div>
        <hr>
        <div class="metric-row"><span class="metric-label">Resp events</span><span class="metric-value">${respCnt}</span></div>
        <div class="metric-row"><span class="metric-label">Desats ≥3%</span><span class="metric-value">${o2Desats}</span></div>
    `;
}