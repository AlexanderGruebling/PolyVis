export async function getMetrics(q) {
  const epochSeconds = 30;
  const sleepRows = await q(
    "SELECT COUNT(*) AS cnt FROM hypn WHERE Aux IN ('1','2','3','4','R')",
  );
  const sleepHours = (Number(sleepRows[0].cnt) * epochSeconds) / 3600;

  const respRows = await q('SELECT COUNT(*) AS cnt FROM resp');
  const respCnt = Number(respRows[0].cnt);
  const ahi = sleepHours > 0 ? respCnt / sleepHours : 0;

  const saO2Rows = await q(
    `SELECT MIN("SaO2") AS m, AVG("SaO2") AS a FROM signal WHERE "SaO2" > 0`,
  );
  const minSaO2 = Number(saO2Rows[0].m);
  const avgSaO2 = Number(saO2Rows[0].a);

  const pct88Rows = await q(
    `SELECT COUNT(*) * 100.0 / (SELECT COUNT(*) FROM signal WHERE "SaO2" > 0) AS v FROM signal WHERE "SaO2" > 0 AND "SaO2" < 88`,
  );
  const pct90Rows = await q(
    `SELECT COUNT(*) * 100.0 / (SELECT COUNT(*) FROM signal WHERE "SaO2" > 0) AS v FROM signal WHERE "SaO2" > 0 AND "SaO2" < 90`,
  );
  const pctBelow88 = Number(pct88Rows[0].v);
  const pctBelow90 = Number(pct90Rows[0].v);

  const intervals = await getDesaturationIntervals(q);
  const o2Desats = intervals.length;
  const odi = sleepHours > 0 ? o2Desats / sleepHours : 0;

  return {
    ahi,
    odi,
    sleepHours,
    minSaO2,
    avgSaO2,
    pctBelow88,
    pctBelow90,
    respCnt,
    o2Desats,
  };
}

let desatCache = null;

export async function getDesaturationIntervals(q) {
  if (desatCache) return desatCache;

  const allSaO2 = await q(
    `SELECT time, "SaO2" FROM signal WHERE "SaO2" > 0 ORDER BY time`,
  );
  const vals = allSaO2.map((r) => ({
    time: Number(r.time),
    value: Number(r.SaO2),
  }));
  const intervals = [];
  let start = null;
  let maxDrop = 0;
  let sum = 0;
  for (let i = 0; i < vals.length; i++) {
    if (i >= 10) sum -= vals[i - 10].value;
    sum += vals[i].value;
    if (i >= 9) {
      const baseline = sum / 10;
      const drop = baseline - vals[i].value;
      if (drop >= 3) {
        if (start === null) start = vals[Math.max(0, i - 10)].time;
        if (drop > maxDrop) maxDrop = drop;
      } else {
        if (start !== null) {
          intervals.push({
            start,
            end: vals[i].time,
            depth: Math.round(maxDrop * 10) / 10,
          });
          start = null;
          maxDrop = 0;
        }
      }
    }
  }
  if (start !== null)
    intervals.push({
      start,
      end: vals[vals.length - 1].time,
      depth: Math.round(maxDrop * 10) / 10,
    });

  desatCache = intervals;
  return intervals;
}

export function severityLabel(v) {
  if (v < 5) return 'normal';
  if (v < 15) return 'mild';
  if (v < 30) return 'moderate';
  return 'severe';
}

export function severityColor(v) {
  if (v < 5) return '#3fb950';
  if (v < 15) return '#d29922';
  if (v < 30) return '#f0883e';
  return '#f04040';
}
