import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import {
    lineChart,
    drawHypnogram,
    toggleEvents,
    initializeCommonXAxis,
    width,
    height
} from "./drawingUtils.js";
import {
    initializeDatabase,
    initializeData,
    hypnoAnnotations,
    measurements,
    events
} from "./dataUtils.js";

// Initialize database and data
initializeDatabase();
await initializeData();

// Initialize a common x-axis scale for polygrams
let polyXAxis = initializeCommonXAxis(measurements.time.min, measurements.time.max);
let displayArousalEvents = false, displayRespEvents = false;
const polygram = [];

// Create line charts for each measurement (excluding 'time')
Object.entries(measurements).forEach(([measurement, value]) => {
    if (measurement !== 'time') {
        let title = document.createElement('h4');
        title.innerText = value.title
        document.getElementById('container').appendChild(title);
        let svg = lineChart(value.min, value.max, value.values, '#container');
        polygram.push(svg);
    }
});


// Draw the hypnogram in a separate container
let title = document.createElement("h4");
title.innerText = "Hypnogram";
document.getElementById('container2').insertAdjacentElement('afterbegin', title);
const hypno = drawHypnogram(
    hypnoAnnotations.samples.min,
    hypnoAnnotations.samples.max,
    hypnoAnnotations.annotations,
    '#container2'
);

// Set up event handlers for toggling event displays
setupEventHandlers();

function setupEventHandlers() {
    document.getElementById('displayArousalEvents')
        .addEventListener('click', () => {
            displayArousalEvents = toggleEvents(
                measurements.time.min,
                measurements.time.max,
                displayArousalEvents,
                events.arousal.values,
                'arousal'
            );
        });

    document.getElementById('displayRespEvents')
        .addEventListener('click', () => {
            displayRespEvents = toggleEvents(
                measurements.time.min,
                measurements.time.max,
                displayRespEvents,
                events.resp.values,
                'resp'
            );
        });
}
