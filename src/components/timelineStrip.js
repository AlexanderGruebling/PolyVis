import * as vg from '@uwdata/vgplot';
import { q } from '../data/loader.js';
import { getDesaturationIntervals } from './metricsPanel.js';
import { timeFormat } from '../utils/timeFormat.js';
import { params, maxSamples } from '../state/params.js';

const TRACKS = [
  { key: 'desats', label: 'Desats ≥3%', color: '#ff4060' },
  { key: 'arou', label: 'Arousals', color: '#cba6f7' },
  { key: 'hyp', label: 'Hypopnea', color: '#a6e3a1' },
  { key: 'ob', label: 'Obstructive Apnea', color: '#f38ba8' },
  { key: 'cn', label: 'Central Apnea', color: '#89b4fa' },
];

export async function createTimelineStrip() {
  const container = document.getElementById('overview-timeline');
  container.innerHTML = '';

  // Prepare sub-tables for each event type
  await q(
    `CREATE OR REPLACE TABLE tl_arou AS SELECT "Sample#"::DOUBLE AS x FROM arou`,
  );
  await q(
    `CREATE OR REPLACE TABLE tl_hyp  AS SELECT "Sample#"::DOUBLE AS x FROM resp WHERE Aux = 'Hyp'`,
  );
  await q(
    `CREATE OR REPLACE TABLE tl_ob   AS SELECT "Sample#"::DOUBLE AS x FROM resp WHERE Aux = 'Ob.A'`,
  );
  await q(
    `CREATE OR REPLACE TABLE tl_cn   AS SELECT "Sample#"::DOUBLE AS x FROM resp WHERE Aux = 'Cn.A'`,
  );

  // Desaturation events (use onset time for a tick like other event types)
  const desatIntervals = await getDesaturationIntervals(q);
  if (desatIntervals.length > 0) {
    const rows = desatIntervals.map((r) => `(${r.start})`).join(',');
    await q(
      `CREATE OR REPLACE TABLE tl_desats AS SELECT * FROM (VALUES ${rows}) AS t(x)`,
    );
  } else {
    await q(
      `CREATE OR REPLACE TABLE tl_desats AS SELECT 0::DOUBLE AS x WHERE FALSE`,
    );
  }

  const domain = [0, maxSamples];
  const isLast = (i) => i === TRACKS.length - 1;

  const grid = document.createElement('div');
  grid.className = 'timeline-grid';

  TRACKS.forEach((track, i) => {
    const label = document.createElement('div');
    label.className = 'timeline-label';
    label.innerHTML = `<span class="timeline-dot" style="background:${track.color}"></span>${track.label}`;
    grid.appendChild(label);

    const marks = [
      vg.ruleX(vg.from(`tl_${track.key}`), {
        x: 'x',
        stroke: track.color,
        strokeWidth: 3,
      }),
    ];

    const plotMarks = [
      ...marks,
      vg.ruleX({
        x: params.hypnPoint,
        stroke: '#ffffff',
        strokeOpacity: 0.5,
        strokeWidth: 1,
      }),
      vg.xDomain(domain),
      vg.yDomain([0, 1]),
      vg.height(14),
      vg.marginTop(1),
      vg.marginBottom(1),
      vg.yTickFormat(() => ''),
      vg.yLabel(null),
    ];

    if (isLast(i)) {
      plotMarks.push(vg.xTickFormat(timeFormat), vg.xLabel('HH:MM'));
    } else {
      plotMarks.push(
        vg.xTickFormat(() => ''),
        vg.xLabel(null),
      );
    }

    const plot = vg.plot(...plotMarks);
    plot.className = 'timeline-plot';
    grid.appendChild(plot);
  });

  container.appendChild(grid);
}
