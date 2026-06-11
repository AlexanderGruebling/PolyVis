import * as vg from '@uwdata/vgplot';
import { params, maxSamples } from '../state/params.js';
import { timeFormat } from '../utils/timeFormat.js';

export function createHypnogram({
  containerId = 'container2',
  height = 400,
  clickToZoom = true,
  onBrush = null,
} = {}) {
  const container = document.getElementById(containerId);

  if (clickToZoom) {
    container.addEventListener('click', () => {
      params.sampleDomain.update([
        params.hypnPoint.value - 100,
        params.hypnPoint.value + 100,
      ]);
    });
  }

  const marks = [
    vg.line(vg.from('hypn'), { x: 'Sample#', y: 'Aux' }),
    vg.nearestX({ as: params.hypnPoint }),
    vg.ruleX({ x: params.hypnPoint }),
    vg.xTickFormat(timeFormat),
    vg.xLabel('HH:MM'),
    vg.height(height),
  ];

  if (onBrush) {
    const brush = vg.Selection.intersect();
    marks.push(
      vg.rectX({ x1: 0, x2: maxSamples, fill: 'transparent' }),
      vg.intervalX({ as: brush }),
    );
    let timer = null;
    brush.addEventListener('value', (range) => {
      if (!range || range[1] - range[0] <= 10) return;
      clearTimeout(timer);
      timer = setTimeout(
        () => onBrush([Math.round(range[0]), Math.round(range[1])]),
        200,
      );
    });
  }

  container.appendChild(vg.plot(...marks));
}
