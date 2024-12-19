import * as vg from "@uwdata/vgplot";
import { Query, min } from "@uwdata/mosaic-sql";
import signalsUrl from "/Resources/0000_signals.csv?url";
import hypnUrl from "/Resources/0000_hypn.csv?url";
import arouUrl from "/Resources/0000_arou.csv?url";
import respUrl from "/Resources/0000_resp.csv?url";

// Helper function for URL concatenation
const getFullUrl = (relativeUrl) => `${window.location.origin}${relativeUrl}`;

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

const keys = [
    { name: "EEG", key: "EEG", display: false, plot: null },
    { name: "SaO2", key: "SaO2", display: false, plot: null },
    { name: "ECG", key: "ECG", display: false, plot: null },
    { name: "THOR RES", key: "THOR RES", display: false, plot: null },
    { name: "ABDO RES", key: "ABDO RES", display: false, plot: null }
];

// console.log(vg.coordinator().exec(vg.from("signal", {y: vg.min("time")})))
// Parameter initializations
const params = {
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

// Cache DOM elements
const container2 = document.getElementById('container2');
const mainContainer = document.getElementById('container');
const controls = document.getElementById('controls');
const resetButton = document.getElementById('resetButton');
const eventsContainer = document.getElementById('eventsContainer');

keys.forEach(key => {
    const plotToggles = document.createElement("div");
    plotToggles.className = "row";
    plotToggles.appendChild(Object.assign(document.createElement("label"), {
        htmlFor: key.key,
        textContent: key.name
    }));
    const checkbox  = Object.assign(document.createElement("input"), {
        type: "checkbox",
        id: key.key
    });
    checkbox.addEventListener("click", (event) => {
        if (event.target.checked) {
            mainContainer.appendChild(key.plot);
        } else {
            document.getElementById(key.plot.getAttribute("id")).remove();
        }
    });
    plotToggles.appendChild(checkbox);
    controls.appendChild(plotToggles);

    key.plot = vg.plot(
        vg.line(vg.from("signal"), { x: "time", y: key.key }),
        vg.xDomain(params.sampleDomain),
        vg.height(300),
        vg.ruleX(vg.from("arou"), { x: "Sample#", stroke: "#cba6f7", strokeOpacity: params.dispArou }),
        vg.ruleX(vg.from("resp"), { x: "Sample#", stroke: "#a6e3a1", strokeOpacity: params.dispResp }),
        vg.panZoomX({ x: params.xs }),
    );
    key.plot.setAttribute("id", `${key.key}_plot`);
})

container2.addEventListener("click", () => {
    params.selectedTimeframe.update(params.hypnPoint.value);
    params.sampleDomain.update([params.hypnPoint.value - 100, params.hypnPoint.value + 100])
});

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
        vg.ruleX({ x: params.selectedTimeframe }),
        vg.textX(
            [{label: "Last Selection"}],
            {
                x: params.selectedTimeframe,
                text: "label",
                frameAnchor: top,
                y: 0,
                strokeOpacity: params.selectedTimeframe.value !== 0 ? 1 : 0
            }
        ),
        vg.height(400)
    )
);

// Slider for oxygen threshold
// saO2Container.appendChild(
//     vg.slider({
//         from: "signal",
//         column: "SaO2",
//         as: params.oxygenThreshold
//     })
// );

// Control menus
const eventControlsWrapper = document.createElement("div");
eventControlsWrapper.className = "row";
eventControlsWrapper.appendChild(
    vg.menu({
        label: "Arousal Events",
        options: [{ value: 0, label: "Hide" }, { value: 1, label: "Show" }],
        as: params.dispArou
    })
);
eventControlsWrapper.appendChild(
    vg.menu({
        label: "Respiratory Events",
        options: [
            { value: 0, label: "Hide" },
            { value: 1, label: "Hypopnea" },
            { value: 2, label: "Ob.A." },
            { value: 3, label: "Cn.A." },
            { value: 4, label: "All" }
        ],
        as: params.dispResp
    })
);
eventsContainer.appendChild(eventControlsWrapper);

resetButton.addEventListener("click", () => {
    params.sampleDomain.update([minSamples, maxSamples]);
})
