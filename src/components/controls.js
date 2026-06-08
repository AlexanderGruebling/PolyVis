import * as vg from "@uwdata/vgplot";
import { params, minSamples, maxSamples } from "../state/params.js";

export function createControls() {
    const eventsContainer = document.getElementById('eventsContainer');
    const resetButton = document.getElementById('resetButton');

    const wrapper = document.createElement("div");
    wrapper.className = "row";

    wrapper.appendChild(
        vg.menu({
            label: "Arousal Events",
            options: [{ value: 0, label: "Hide" }, { value: 1, label: "Show" }],
            as: params.dispArou
        })
    );
    wrapper.appendChild(
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
    eventsContainer.appendChild(wrapper);

    resetButton.addEventListener("click", () => {
        params.sampleDomain.update([minSamples, maxSamples], { force: true });
        params.xs._resolved = [];
        params.xs.update([minSamples, maxSamples], { force: true });
    });
}
