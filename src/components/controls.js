import * as vg from "@uwdata/vgplot";
import { params, minSamples, maxSamples } from "../state/params.js";

function resetZoom() {
    params.sampleDomain.update([minSamples, maxSamples], { force: true });
    params.xs._resolved = [];
    params.xs.update([minSamples, maxSamples], { force: true });
}

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

    resetButton.addEventListener("click", resetZoom);

    document.addEventListener("keydown", (e) => {
        const tag = document.activeElement?.tagName;
        if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

        if (e.key === "r" || e.key === "R" || e.key === "Escape") {
            resetZoom();
            return;
        }

        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            const [curMin, curMax] = params.sampleDomain.value;
            const shift = (curMax - curMin) * 0.25;
            if (e.key === "ArrowLeft") {
                const newMin = Math.max(minSamples, curMin - shift);
                const newMax = Math.max(minSamples, curMax - shift);
                params.sampleDomain.update([newMin, newMax], { force: true });
                params.xs._resolved = [];
                params.xs.update([newMin, newMax], { force: true });
            } else {
                const newMin = Math.min(maxSamples, curMin + shift);
                const newMax = Math.min(maxSamples, curMax + shift);
                params.sampleDomain.update([newMin, newMax], { force: true });
                params.xs._resolved = [];
                params.xs.update([newMin, newMax], { force: true });
            }
        }
    });
}
