import * as vg from "@uwdata/vgplot";
import { params } from "../state/params.js";

const keys = [
    { name: "EEG", key: "EEG" },
    { name: "SaO2", key: "SaO2" },
    { name: "ECG", key: "ECG" },
    { name: "THOR RES", key: "THOR RES" },
    { name: "ABDO RES", key: "ABDO RES" }
];

export function createSignalPlots() {
    const mainContainer = document.getElementById('container');
    const controls = document.getElementById('controls');

    keys.forEach(key => {
        const row = document.createElement("div");
        row.className = "row";
        row.appendChild(Object.assign(document.createElement("label"), {
            htmlFor: key.key,
            textContent: key.name
        }));
        const checkbox = Object.assign(document.createElement("input"), {
            type: "checkbox",
            id: key.key
        });

        const card = document.createElement("div");
        card.className = "plot-card";
        const cardHeader = document.createElement("div");
        cardHeader.className = "plot-card-header";
        cardHeader.textContent = key.name;
        card.appendChild(cardHeader);
        const cardBody = document.createElement("div");
        cardBody.className = "plot-card-body";
        card.appendChild(cardBody);

        checkbox.addEventListener("click", (event) => {
            if (event.target.checked) {
                mainContainer.appendChild(card);
            } else {
                card.remove();
            }
        });
        row.appendChild(checkbox);
        controls.appendChild(row);

        const plot = vg.plot(
            vg.line(vg.from("signal"), { x: "time", y: key.key }),
            vg.xDomain(params.sampleDomain),
            vg.height(300),
            vg.panZoomX({ x: params.xs }),
        );
        plot.setAttribute("id", `${key.key}_plot`);
        cardBody.appendChild(plot);
    });
}
