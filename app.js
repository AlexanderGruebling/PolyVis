import * as d3 from "d3";
import * as vg from "@uwdata/vgplot";
import signalsUrl from "/Resources/0000_signals.csv?url";
import hypnUrl from "/Resources/0000_hypn.csv?url";
import arouUrl from "/Resources/0000_arou.csv?url";
import respUrl from "/Resources/0000_resp.csv?url";
import { drawLineChart, updateLineChart } from './drawingUtils.js';
import { loadData } from './dataUtils.js';

console.log(signalsUrl)
vg.coordinator().databaseConnector(vg.wasmConnector());
vg.coordinator().exec(vg.loadCSV("signal", "http://127.0.0.1:5173" + signalsUrl));
vg.coordinator().exec(vg.loadCSV("hypn", "http://127.0.0.1:5173" + hypnUrl));
vg.coordinator().exec(vg.loadCSV("arou", "http://127.0.0.1:5173" + arouUrl));
vg.coordinator().exec(vg.loadCSV("resp", "http://127.0.0.1:5173" + respUrl));

const $xs = vg.Selection.intersect();
const $dispArou = vg.Param.value(0);
const $dispResp = vg.Param.value(0);
const $oxygenThreshold = vg.Param.value(0);
const $point = vg.Param.value(10);
const $hypnPoint = vg.Param.value(0)

document.getElementById('container2').appendChild(
    vg.plot(
        vg.line(
            vg.from("hypn"),
            {x: "Sample#", y: "Aux"}
        ),
        // vg.nearestX({as: $hypnPoint}),
        // vg.ruleX({x: $hypnPoint}),
        // // vg.textX({x: $point, text: $point, frameAnchor: "top", lineAnchor: "bottom"}),
        // vg.height(400)
    )
);

document.getElementById('saO2').appendChild(
        vg.plot(
            vg.line(
                vg.from("signal", {filterBy: $oxygenThreshold}),
                {
                    x: "time",
                    y: "SaO2",
                }
            ),
            // vg.ruleX({x: $point}),
            // vg.textX({x: $point, text: $point, frameAnchor: "top", lineAnchor: "bottom", dy: -7}),
            // vg.ruleX(
            //     vg.from("arou"),
            //     { x: "Sample#", stroke: "#cba6f7", strokeOpacity: $dispArou }
            // ),
            // vg.ruleX(
            //     vg.from("resp"),
            //     { x: "Sample#", stroke: "#a6e3a1", strokeOpacity: $dispResp }
            // ),
            // vg.panZoomX({x: $xs}),
            // vg.nearestX({as: $point})
        )
);

// document.getElementById('saO2').appendChild(vg.slider({ select: "interval", from: "signal", column: "SaO2", as:  $oxygenThreshold}));

// document.getElementById('container').appendChild(
//     vg.plot(
//         vg.line(
//             vg.from("signal"),
//             { x: "time", y: "EEG" }
//         ),
//         vg.ruleX(
//             vg.from("arou"),
//             { x: "Sample#", stroke: "#cba6f7", strokeOpacity: $dispArou }
//         ),
//         vg.ruleX(
//             vg.from("resp"),
//             { x: "Sample#", stroke: "#a6e3a1", strokeOpacity: $dispResp }
//         ),
//         vg.panZoomX({x: $xs})
//     )
// )

// document.getElementById('controls').appendChild(
//     vg.menu({
//         label: "Arousal Events",
//         options: [{value: 0, label: "Hide"}, {value: 1, label: "Show"}], as: $dispArou}
//     )
// )
// document.getElementById('controls').appendChild(
//     vg.menu({
//         label: "Respiratory Events",
//         options: [{value: 0, label: "Hide"}, {value: 1, label: "Show"}], as: $dispResp}
//     )
// )
