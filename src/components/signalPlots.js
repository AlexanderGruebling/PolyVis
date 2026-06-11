import * as vg from '@uwdata/vgplot';
import { params } from '../state/params.js';
import { timeFormat } from '../utils/timeFormat.js';
import { q } from '../data/loader.js';
import { getDesaturationIntervals } from './metricsPanel.js';

const keys = [
  { name: 'EEG', key: 'EEG' },
  { name: 'SaO2', key: 'SaO2' },
  { name: 'ECG', key: 'ECG' },
  { name: 'THOR RES', key: 'THOR RES' },
  { name: 'ABDO RES', key: 'ABDO RES' },
];

export async function createSignalPlots() {
  const mainContainer = document.getElementById('container');
  const controls = document.getElementById('controls');

  const desatIntervals = await getDesaturationIntervals(q);
  if (desatIntervals.length > 0) {
    const rows = desatIntervals
      .map((r) => `(${r.start}, ${r.end}, ${r.depth}, '↓${r.depth}%')`)
      .join(',');
    await q(
      `CREATE OR REPLACE TABLE desats AS SELECT * FROM (VALUES ${rows}) AS t(x1, x2, depth, label)`,
    );
  } else {
    await q(
      `CREATE OR REPLACE TABLE desats AS SELECT 0::DOUBLE AS x1, 0::DOUBLE AS x2, 0::DOUBLE AS depth, '' AS label WHERE FALSE`,
    );
  }

  keys.forEach((key) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.appendChild(
      Object.assign(document.createElement('label'), {
        htmlFor: key.key,
        textContent: key.name,
      }),
    );
    const checkbox = Object.assign(document.createElement('input'), {
      type: 'checkbox',
      id: key.key,
    });

    const card = document.createElement('div');
    card.className = 'plot-card';
    const cardHeader = document.createElement('div');
    cardHeader.className = 'plot-card-header';
    cardHeader.textContent = key.name;
    card.appendChild(cardHeader);
    const cardBody = document.createElement('div');
    cardBody.className = 'plot-card-body';
    card.appendChild(cardBody);

    checkbox.addEventListener('click', (event) => {
      if (event.target.checked) {
        mainContainer.appendChild(card);
      } else {
        card.remove();
      }
    });
    row.appendChild(checkbox);
    controls.appendChild(row);

    const marks = [vg.line(vg.from('signal'), { x: 'time', y: key.key })];

    if (key.key === 'SaO2') {
      marks.unshift(
        vg.rectX(vg.from('desats'), {
          x1: 'x1',
          x2: 'x2',
          fill: '#ff4060',
          fillOpacity: 0.8,
        }),
      );
    }

    const plot = vg.plot(
      ...marks,
      vg.xDomain(params.sampleDomain),
      vg.height(300),
      vg.panZoomX({ x: params.xs }),
      vg.xTickFormat(timeFormat),
      vg.xLabel('HH:MM'),
    );
    plot.setAttribute('id', `${key.key}_plot`);
    cardBody.appendChild(plot);
  });
}
