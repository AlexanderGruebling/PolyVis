export async function computeMetrics(q, containerId = "metrics-content") {
    const metricsContent = document.getElementById(containerId);

    const epochSeconds = 30;
    const sleepRows = await q("SELECT COUNT(*) AS cnt FROM hypn WHERE Aux IN ('1','2','3','4')");
    const sleepHours = Number(sleepRows[0].cnt) * epochSeconds / 3600;

    const respRows = await q("SELECT COUNT(*) AS cnt FROM resp");
    const respCnt = Number(respRows[0].cnt);
    const ahi = sleepHours > 0 ? (respCnt / sleepHours).toFixed(1) : "—";

    const saO2Rows = await q(`SELECT MIN("SaO2") AS m, AVG("SaO2") AS a FROM signal WHERE "SaO2" > 0`);
    const minSaO2 = Number(saO2Rows[0].m).toFixed(1);
    const avgSaO2 = Number(saO2Rows[0].a).toFixed(1);

    const pct88Rows = await q(
        `SELECT COUNT(*) * 100.0 / (SELECT COUNT(*) FROM signal WHERE "SaO2" > 0) AS v FROM signal WHERE "SaO2" > 0 AND "SaO2" < 88`
    );
    const pct90Rows = await q(
        `SELECT COUNT(*) * 100.0 / (SELECT COUNT(*) FROM signal WHERE "SaO2" > 0) AS v FROM signal WHERE "SaO2" > 0 AND "SaO2" < 90`
    );
    const pctBelow88 = Number(pct88Rows[0].v).toFixed(1);
    const pctBelow90 = Number(pct90Rows[0].v).toFixed(1);

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
    const odi = sleepHours > 0 ? (o2Desats / sleepHours).toFixed(1) : "—";

    function severityLabel(ahi) {
        if (ahi === "—") return "";
        const v = parseFloat(ahi);
        if (v < 5) return "(normal)";
        if (v < 15) return "(mild)";
        if (v < 30) return "(moderate)";
        return "(severe)";
    }

    metricsContent.innerHTML = `
        <div class="metric-row"><span class="metric-label">AHI</span><span class="metric-value">${ahi} ${severityLabel(ahi)}</span></div>
        <div class="metric-row"><span class="metric-label">ODI</span><span class="metric-value">${odi}</span></div>
        <div class="metric-row"><span class="metric-label">Sleep</span><span class="metric-value">${sleepHours.toFixed(1)} h</span></div>
        <hr>
        <div class="metric-row"><span class="metric-label">Min SaO₂</span><span class="metric-value">${minSaO2}%</span></div>
        <div class="metric-row"><span class="metric-label">Mean SaO₂</span><span class="metric-value">${avgSaO2}%</span></div>
        <div class="metric-row"><span class="metric-label">Time &lt;88%</span><span class="metric-value">${pctBelow88}%</span></div>
        <div class="metric-row"><span class="metric-label">Time &lt;90%</span><span class="metric-value">${pctBelow90}%</span></div>
        <hr>
        <div class="metric-row"><span class="metric-label">Resp events</span><span class="metric-value">${respCnt}</span></div>
        <div class="metric-row"><span class="metric-label">Desats ≥3%</span><span class="metric-value">${o2Desats}</span></div>
    `;
}
