import * as vg from '@uwdata/vgplot';
import { coordExec, q } from '../data/loader.js';
import { isCatalogEnabled } from '../data/patientCatalog.js';

export async function createCohortCompare(containerId, patientIds) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'cohort-header';
  header.innerHTML = '<h2>Cohort Comparison</h2>';
  container.appendChild(header);

  const body = document.createElement('div');
  body.className = 'cohort-body';
  container.appendChild(body);

  await renderComparison(body, patientIds);
}

async function renderComparison(container, ids) {
  const patients = await q(`
    SELECT * FROM patients WHERE id IN (${ids.map((id) => `'${id}'`).join(',')})
  `);

  const metricsTable = document.createElement('div');
  metricsTable.className = 'cohort-metrics';
  let html = '<table class="cohort-table"><thead><tr><th>Metric</th>';
  patients.forEach((p) => {
    html += `<th>${p.id}</th>`;
  });
  html += '</tr></thead><tbody>';

  const metricRows = [
    { label: 'Age', key: 'age', fmt: (v) => v ?? '—' },
    { label: 'Sex', key: 'sex', fmt: (v) => v ?? '—' },
    {
      label: 'BMI',
      key: 'bmi',
      fmt: (v) => (v != null ? Number(v).toFixed(1) : '—'),
    },
    {
      label: 'AHI',
      key: 'ahi',
      fmt: (v) => (v != null ? Number(v).toFixed(1) : '—'),
    },
    {
      label: 'WASO (min)',
      key: 'waso',
      fmt: (v) => (v != null ? Number(v).toFixed(0) : '—'),
    },
    {
      label: 'N1 %',
      key: 'n1_pct',
      fmt: (v) => (v != null ? Number(v).toFixed(1) : '—'),
    },
    {
      label: 'N2 %',
      key: 'n2_pct',
      fmt: (v) => (v != null ? Number(v).toFixed(1) : '—'),
    },
    {
      label: 'N3/4 %',
      key: 'n34_pct',
      fmt: (v) => (v != null ? Number(v).toFixed(1) : '—'),
    },
    {
      label: 'REM %',
      key: 'rem_pct',
      fmt: (v) => (v != null ? Number(v).toFixed(1) : '—'),
    },
    {
      label: 'Sleep latency',
      key: 'sleep_latency',
      fmt: (v) => (v != null ? `${Number(v).toFixed(0)} min` : '—'),
    },
  ];

  metricRows.forEach((row) => {
    html += `<tr><td class="cohort-metric-label">${row.label}</td>`;
    patients.forEach((p) => {
      html += `<td>${row.fmt(p[row.key])}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  metricsTable.innerHTML = html;
  container.appendChild(metricsTable);

  if (isCatalogEnabled()) {
    await renderScatterPlot(container, ids);
    await renderPercentileRanks(container, ids);
  }
}

let scatterSeq = 0;

async function renderScatterPlot(container, ids) {
  if (ids.length === 0) return;

  const section = document.createElement('div');
  section.className = 'cohort-section';
  section.innerHTML = '<h3>AHI vs BMI (Full Cohort)</h3>';
  const plotDiv = document.createElement('div');
  plotDiv.id = 'cohort-scatter';
  section.appendChild(plotDiv);
  container.appendChild(section);

  scatterSeq++;
  const tableName = `cohort_selected_${scatterSeq}`;

  await coordExec(`
    CREATE TABLE "${tableName}" AS
    SELECT * FROM patients
    WHERE id IN (${ids.map((id) => `'${id}'`).join(',')})
  `);

  for (let i = Math.max(1, scatterSeq - 10); i < scatterSeq; i++) {
    await coordExec(`DROP TABLE IF EXISTS "cohort_selected_${i}"`).catch(
      () => {},
    );
  }

  const layers = [
    vg.dot(vg.from('patients'), {
      x: 'bmi',
      y: 'ahi',
      fill: '#30363d',
      r: 2,
      opacity: 0.4,
    }),
    vg.dot(vg.from(tableName), {
      x: 'bmi',
      y: 'ahi',
      fill: '#58a6ff',
      r: 6,
      stroke: '#e6edf3',
      strokeWidth: 1,
    }),
  ];

  plotDiv.appendChild(
    vg.plot(...layers, vg.xLabel('BMI'), vg.yLabel('AHI'), vg.height(320)),
  );
}

async function renderPercentileRanks(container, ids) {
  const section = document.createElement('div');
  section.className = 'cohort-section';
  section.innerHTML = '<h3>Percentile Ranks</h3>';
  container.appendChild(section);

  for (const id of ids) {
    const patient = (
      await q(`SELECT ahi, bmi FROM patients WHERE id = '${id}'`)
    )[0];
    if (!patient || patient.ahi == null) continue;

    const [ahiRank] = await q(`
      SELECT ROUND(
        SUM(CASE WHEN ahi < ${patient.ahi} THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1
      ) AS pct
      FROM patients WHERE ahi IS NOT NULL
    `);

    const [bmiRank] = await q(`
      SELECT ROUND(
        SUM(CASE WHEN bmi < ${patient.bmi} THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1
      ) AS pct
      FROM patients WHERE bmi IS NOT NULL
    `);

    const rankDiv = document.createElement('div');
    rankDiv.className = 'cohort-rank';
    rankDiv.innerHTML = `
      <strong>${id}</strong>:
      AHI ${patient.ahi.toFixed(1)} — ${ahiRank.pct}th percentile
      &nbsp;|&nbsp;
      BMI ${patient.bmi.toFixed(1)} — ${bmiRank.pct}th percentile
    `;
    section.appendChild(rankDiv);
  }
}
