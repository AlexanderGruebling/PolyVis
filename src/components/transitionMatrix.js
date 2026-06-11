import * as vg from '@uwdata/vgplot';
import { q } from '../data/loader.js';

const stageOrder = ['Wake', 'REM', 'N1', 'N2', 'N3', 'N4'];

export async function createTransitionMatrix() {
  const container = document.getElementById('overview-transitions');
  container.innerHTML = '';

  await q(`
    CREATE OR REPLACE TABLE stage_transitions AS
    WITH mapped AS (
      SELECT
        CASE Aux
          WHEN 'W' THEN 'Wake'
          WHEN 'R' THEN 'REM'
          WHEN '1' THEN 'N1'
          WHEN '2' THEN 'N2'
          WHEN '3' THEN 'N3'
          WHEN '4' THEN 'N4'
        END AS stage,
        CASE LAG(Aux) OVER (ORDER BY "Sample#")
          WHEN 'W' THEN 'Wake'
          WHEN 'R' THEN 'REM'
          WHEN '1' THEN 'N1'
          WHEN '2' THEN 'N2'
          WHEN '3' THEN 'N3'
          WHEN '4' THEN 'N4'
        END AS prev_stage
      FROM hypn
    )
    SELECT prev_stage, stage AS curr_stage, COUNT(*)::INT AS cnt
    FROM mapped
    WHERE prev_stage IS NOT NULL
    GROUP BY prev_stage, stage
    ORDER BY prev_stage, stage
  `);

  container.appendChild(
    vg.plot(
      vg.rect(vg.from('stage_transitions'), {
        x: 'prev_stage',
        y: 'curr_stage',
        fill: 'cnt',
        inset: 2,
      }),
      vg.text(vg.from('stage_transitions'), {
        x: 'prev_stage',
        y: 'curr_stage',
        text: 'cnt',
        fill: '#0d1117',
        fontSize: 11,
      }),
      vg.xDomain(stageOrder),
      vg.yDomain(stageOrder),
      vg.colorScheme('oranges'),
      vg.xLabel('From Stage'),
      vg.yLabel('To Stage'),
      vg.height(320),
    ),
  );
}
