import * as d3 from "d3";
import * as vg from "@uwdata/vgplot";
import { Query, min } from "@uwdata/mosaic-sql";
import signalsUrl from "/Resources/0000_signals.csv?url";
import hypnUrl from "/Resources/0000_hypn.csv?url";
import arouUrl from "/Resources/0000_arou.csv?url";
import respUrl from "/Resources/0000_resp.csv?url";
import { drawLineChart, updateLineChart } from './drawingUtils.js';
import { loadData } from './dataUtils.js';

// Helper function for URL concatenation
const getFullUrl = (relativeUrl) => `http://localhost:5173${relativeUrl}`;

// Load CSV data
vg.coordinator().databaseConnector(vg.wasmConnector());
const datasets = [
    { name: "signal", url: getFullUrl(signalsUrl) },
    { name: "hypn", url: getFullUrl(hypnUrl) },
    { name: "arou", url: getFullUrl(arouUrl) },
    { name: "resp", url: getFullUrl(respUrl) }
];
await datasets.forEach(dataset => vg.coordinator().exec(vg.loadCSV(dataset.name, dataset.url)));
let minSamples = 0;
let maxSamples = 32398.0;

// console.log(vg.coordinator().exec(vg.from("signal", {y: vg.min("time")})))
// Parameter initializations
const params = {
    xs: vg.Selection.intersect(),
    dispArou: vg.Param.value(0),
    dispResp: vg.Param.value(0),
    oxygenThreshold: vg.Param.value(0),
    point: vg.Param.value(10),
    hypnPoint: vg.Param.value(0),
    sampleDomain: vg.Param.array([minSamples, maxSamples])
};

// Cache DOM elements
const container2 = document.getElementById('container2');
const saO2Container = document.getElementById('saO2');
const mainContainer = document.getElementById('container');
const controls = document.getElementById('controls');

container2.addEventListener("click", () => {
    console.log(params.hypnPoint.value)
    params.sampleDomain.update([params.hypnPoint.value - 100, params.hypnPoint.value + 100])
})

// Plot for hypnogram
container2.appendChild(
    vg.plot(
        vg.line(vg.from("hypn"), { x: "Sample#", y: "Aux" }),
        vg.nearestX({ as: params.hypnPoint }),
        vg.ruleX({ x: params.hypnPoint }),
        vg.textX(
            vg.from("hypn"),
            {
                x: params.hypnPoint,
                text: "Aux",
                frameAnchor: "top",
                dy: -8,
                select: "nearestX"
            }
        ),
        vg.height(400)
    )
);

// Plot for SaO2 with additional overlays
saO2Container.appendChild(
    vg.plot(
        vg.line(vg.from("signal"), { x: "time", y: "SaO2" }),
        vg.xDomain(params.sampleDomain),
        vg.nearestX({ as: params.point }),
        vg.ruleX({ x: params.point }),
        vg.ruleX(vg.from("arou"), { x: "Sample#", stroke: "#cba6f7", strokeOpacity: params.dispArou }),
        vg.ruleX(vg.from("resp"), { x: "Sample#", stroke: "#a6e3a1", strokeOpacity: params.dispResp }),
        vg.panZoomX({ x: params.xs })
    )
);

// Slider for oxygen threshold
saO2Container.appendChild(
    vg.slider({
        from: "signal",
        column: "SaO2",
        as: params.oxygenThreshold
    })
);

// Main signal plot (e.g., EEG)
mainContainer.appendChild(
    vg.plot(
        vg.line(vg.from("signal"), { x: "time", y: "EEG" }),
        vg.xDomain(params.sampleDomain),
        vg.ruleX(vg.from("arou"), { x: "Sample#", stroke: "#cba6f7", strokeOpacity: params.dispArou }),
        vg.ruleX(vg.from("resp"), { x: "Sample#", stroke: "#a6e3a1", strokeOpacity: params.dispResp }),
        vg.panZoomX({ x: params.xs })
    )
);

// Control menus
controls.appendChild(
    vg.menu({
        label: "Arousal Events",
        options: [{ value: 0, label: "Hide" }, { value: 1, label: "Show" }],
        as: params.dispArou
    })
);
controls.appendChild(
    vg.menu({
        label: "Respiratory Events",
        options: [{ value: 0, label: "Hide" }, { value: 1, label: "Show" }],
        as: params.dispResp
    })
);
