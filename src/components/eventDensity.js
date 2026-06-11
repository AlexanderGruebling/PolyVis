import * as vg from '@uwdata/vgplot';
import { q } from '../data/loader.js';

export async function createEventDensity() {
  const container = document.getElementById('overview-event-density');
  container.innerHTML = '';

  await q(`
        CREATE OR REPLACE TABLE event_density AS
        SELECT h.Aux AS stage, 'Respiratory' AS type, COUNT(*)::INT AS cnt
        FROM resp r
        JOIN hypn h ON r."Sample#" >= h."Sample#" AND r."Sample#" < h."Sample#" + 30
        WHERE h.Aux IN ('1','2','3','4','R')
        GROUP BY h.Aux
        UNION ALL
        SELECT h.Aux AS stage, 'Arousal' AS type, COUNT(*)::INT AS cnt
        FROM arou a
        JOIN hypn h ON a."Sample#" >= h."Sample#" AND a."Sample#" < h."Sample#" + 30
        WHERE h.Aux IN ('1','2','3','4','R')
        GROUP BY h.Aux
    `);

  container.appendChild(
    vg.plot(
      vg.barY(vg.from('event_density'), {
        x: 'stage',
        y: 'cnt',
        fill: 'type',
      }),
      vg.xDomain(['1', '2', '3', '4', 'R']),
      vg.colorDomain(['Respiratory', 'Arousal']),
      vg.colorRange(['#a6e3a1', '#cba6f7']),
      vg.xLabel('Sleep Stage'),
      vg.yLabel('Event Count'),
      vg.height(320),
    ),
  );
}
