import * as vg from '@uwdata/vgplot';
import { params } from '../state/params.js';
import { timeFormat } from '../utils/timeFormat.js';

const TRACKS = [
  {
    title: 'Arousal Events',
    source: 'arou',
    color: '#cba6f7',
    opacity: params.dispArou,
  },
  {
    title: 'Respiratory Events',
    source: 'resp',
    color: '#a6e3a1',
    opacity: params.dispResp,
  },
];

function createPlotCard(title, plot) {
  const card = document.createElement('div');
  card.className = 'plot-card';
  const header = document.createElement('div');
  header.className = 'plot-card-header';
  header.textContent = title;
  card.appendChild(header);
  const body = document.createElement('div');
  body.className = 'plot-card-body';
  body.appendChild(plot);
  card.appendChild(body);
  return card;
}

export function createEventTracks() {
  const mainContainer = document.getElementById('container');

  TRACKS.forEach((track) => {
    const plot = vg.plot(
      vg.ruleX(vg.from(track.source), {
        x: 'Sample#',
        stroke: track.color,
        strokeWidth: 4,
        strokeOpacity: track.opacity,
      }),
      vg.xDomain(params.sampleDomain),
      vg.yDomain([0, 1]),
      vg.height(24),
      vg.panZoomX({ x: params.xs }),
      vg.xTickFormat(timeFormat),
      vg.xLabel('HH:MM'),
    );
    mainContainer.appendChild(createPlotCard(track.title, plot));
  });
}
