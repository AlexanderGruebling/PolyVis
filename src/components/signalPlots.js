import * as vg from '@uwdata/vgplot';
import { params } from '../state/params.js';
import { timeFormat } from '../utils/timeFormat.js';
import { q } from '../data/loader.js';
import { getDesaturationIntervals } from './metricsPanel.js';
import { trackCursor, cursorLeft } from './hoverCard.js';

const keys = [
  { name: 'EEG', channel: 'EEG' },
  { name: 'SaO2', channel: 'SaO2' },
  { name: 'ECG', channel: 'ECG' },
  { name: 'THOR RES', channel: 'THOR RES' },
  { name: 'ABDO RES', channel: 'ABDO RES' },
  { name: 'AIRFLOW', channel: 'AIRFLOW' },
  { name: 'EMG', channel: 'EMG' },
  { name: 'EOG(L)', channel: 'EOG(L)' },
  { name: 'EOG(R)', channel: 'EOG(R)' },
];

export async function createSignalPlots() {
  const mainContainer = document.getElementById('container');
  const controls = document.getElementById('controls');

  const desatIntervals = await getDesaturationIntervals(q);
  if (desatIntervals.length > 0) {
    const rows = desatIntervals
      .map((r) => `(${r.start}, ${r.end}, ${r.depth})`)
      .join(',');
    await q(
      `CREATE OR REPLACE TABLE desats AS SELECT * FROM (VALUES ${rows}) AS t(x1, x2, depth)`,
    );
  } else {
    await q(
      `CREATE OR REPLACE TABLE desats AS SELECT 0::DOUBLE AS x1, 0::DOUBLE AS x2, 0::DOUBLE AS depth WHERE FALSE`,
    );
  }

  const availableChannels = await getAvailableChannels();

  const activeKeys = keys.filter((k) => availableChannels.has(k.channel));

  activeKeys.forEach((key) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.appendChild(
      Object.assign(document.createElement('label'), {
        htmlFor: key.channel,
        textContent: key.name,
      }),
    );
    const checkbox = Object.assign(document.createElement('input'), {
      type: 'checkbox',
      id: key.channel,
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

    const marks = [
      vg.line(vg.from('signal', { filter: `channel = '${key.channel}'` }), {
        x: 'time',
        y: 'value',
      }),
    ];

    if (key.channel === 'SaO2') {
      marks.unshift(
        vg.rectX(vg.from('desats'), {
          x1: 'x1',
          x2: 'x2',
          fill: '#ff4060',
          fillOpacity: 0.8,
        }),
      );
      marks.push(vg.nearestX({ as: params.hypnPoint }));
      cardBody.addEventListener('mousemove', (e) => {
        trackCursor(e.clientX, e.clientY);
      });
      cardBody.addEventListener('mouseleave', () => {
        cursorLeft();
      });
    }

    const plot = vg.plot(
      ...marks,
      vg.xDomain(params.sampleDomain),
      vg.height(300),
      vg.panZoomX({ x: params.xs }),
      vg.xTickFormat(timeFormat),
      vg.xLabel('HH:MM'),
    );
    plot.setAttribute('id', `${key.channel}_plot`);
    cardBody.appendChild(plot);
  });
}

async function getAvailableChannels() {
  try {
    const rows = await q(
      `SELECT DISTINCT channel FROM signal ORDER BY channel`,
    );
    return new Set(rows.map((r) => r.channel));
  } catch {
    return new Set();
  }
}
