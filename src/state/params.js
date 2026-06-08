import * as vg from "@uwdata/vgplot";

export const minSamples = 0;
export const maxSamples = 32398.0;

export const params = {
    xs: vg.Selection.intersect(),
    dispArou: vg.Param.value(0),
    dispResp: vg.Param.value(0),
    oxygenThreshold: vg.Param.value(0),
    point: vg.Param.value(10),
    hypnPoint: vg.Param.value(0),
    sampleDomain: vg.Param.array([minSamples, maxSamples]),
    selectedTimeframe: vg.Param.value(0),
    selectedTimeframeOpacity: vg.Param.value(0),
};
