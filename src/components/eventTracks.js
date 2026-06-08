import * as vg from "@uwdata/vgplot";
import { params } from "../state/params.js";
import { timeFormat } from "../utils/timeFormat.js";

function createTrackCard(title, track) {
    const card = document.createElement("div");
    card.className = "plot-card";
    const header = document.createElement("div");
    header.className = "plot-card-header";
    header.textContent = title;
    card.appendChild(header);
    const body = document.createElement("div");
    body.className = "plot-card-body";
    body.appendChild(track);
    card.appendChild(body);
    return card;
}

export function createEventTracks() {
    const mainContainer = document.getElementById('container');

    const arouTrack = vg.plot(
        vg.ruleX(vg.from("arou"), {
            x: "Sample#",
            stroke: "#cba6f7",
            strokeWidth: 4,
            strokeOpacity: params.dispArou
        }),
        vg.xDomain(params.sampleDomain),
        vg.yDomain([0, 1]),
        vg.height(24),
        vg.panZoomX({ x: params.xs }),
        vg.xTickFormat(timeFormat),
        vg.xLabel("HH:MM"),
    );

    const respTrack = vg.plot(
        vg.ruleX(vg.from("resp"), {
            x: "Sample#",
            stroke: "#a6e3a1",
            strokeWidth: 4,
            strokeOpacity: params.dispResp
        }),
        vg.xDomain(params.sampleDomain),
        vg.yDomain([0, 1]),
        vg.height(24),
        vg.panZoomX({ x: params.xs }),
        vg.xTickFormat(timeFormat),
        vg.xLabel("HH:MM"),
    );

    mainContainer.appendChild(createTrackCard("Arousal Events", arouTrack));
    mainContainer.appendChild(createTrackCard("Respiratory Events", respTrack));
}
