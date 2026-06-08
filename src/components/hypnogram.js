import * as vg from "@uwdata/vgplot";
import { params } from "../state/params.js";
import { timeFormat } from "../utils/timeFormat.js";

export function createHypnogram({ containerId = "container2", height = 400, clickToZoom = true } = {}) {
    const container = document.getElementById(containerId);

    if (clickToZoom) {
        container.addEventListener("click", () => {
            params.sampleDomain.update([params.hypnPoint.value - 100, params.hypnPoint.value + 100]);
        });
    }

    container.appendChild(
        vg.plot(
            vg.line(vg.from("hypn"), { x: "Sample#", y: "Aux" }),
            vg.nearestX({ as: params.hypnPoint }),
            vg.ruleX({ x: params.hypnPoint }),
            vg.textX(vg.from("hypn"), {
                x: params.hypnPoint,
                text: "Aux",
                frameAnchor: "top",
                dy: -8,
                select: "nearestX"
            }),
            vg.xTickFormat(timeFormat),
            vg.xLabel("HH:MM"),
            vg.height(height)
        )
    );
}
