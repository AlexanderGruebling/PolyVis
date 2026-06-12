import * as vg from '@uwdata/vgplot';

export const minSamples = 0;
export let maxSamples = null;

export function setMaxSamples(count) {
  maxSamples = count;
  if (count > 0) {
    params.sampleDomain = vg.Param.array([minSamples, count]);
  }
}

export let activePatient = '0000';

export function setActivePatient(id) {
  activePatient = id;
}

export const params = {
  xs: vg.Selection.intersect(),
  dispArou: vg.Param.value(0),
  dispResp: vg.Param.value(0),
  hypnPoint: vg.Param.value(0),
};
