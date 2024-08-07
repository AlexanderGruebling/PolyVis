import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {lineChart, drawHypnogram, toggleEvents, initializeCommonXAxis, width, height} from "./drawingUtils.js";
import { initializeDatabase, initializeData, hypnoAnnotations, measurements, events } from "./dataUtils.js";

initializeDatabase();
await initializeData();
let polyXAxis = initializeCommonXAxis(measurements.time.min, measurements.time.max);
console.log(polyXAxis);

let displayArousalEvents, displayRespEvents = false;
const polygram = [];

for(let [measurement, value] of Object.entries(measurements)) {
    if (measurement === 'time') {
        continue;
    }
    let svg = lineChart(value.min, value.max, value.values, '#container');
    addBrush(svg, value.values);
}

function addBrush(svg, data) {
    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("end", (event) => {
            if (event.selection) {
                const [x0, x1] = event.selection.map(svg.x.invert);
                const filteredData = data.filter(d => d.x >= x0 && d.x <= x1);
                svg.x.domain([x0, x1]);
                svg.xAxis.transition().duration(500).call(d3.axisBottom(svg.x));
                svg.path.datum(filteredData).transition().duration(500).attr("d", svg.line);
                brushGroup.call(brush.move, null);
            }
        });
    const brushGroup = svg.svg.append("g")
        .attr("class", "brush")
        .call(brush);
}



const hypno = drawHypnogram(hypnoAnnotations.samples.min, hypnoAnnotations.samples.max, hypnoAnnotations.annotations, '#container2');

// Prepare EventHandlers
document.getElementById('displayArousalEvents')
    .addEventListener('click', () => {
            console.log(displayArousalEvents);
            displayArousalEvents = toggleEvents(
                measurements.time.min,
                measurements.time.max,
                displayArousalEvents,
                events.arousal.values,
                'arousal')
        }
    );


document.getElementById('displayRespEvents')
    .addEventListener('click', () =>
        displayRespEvents = toggleEvents(
            measurements.time.min,
            measurements.time.max,
            displayRespEvents,
            events.resp.values,
            'resp')
    );