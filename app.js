import { lineChart, drawHypnogram, toggleEvents } from "./drawingUtils.js";
import { initializeDatabase, initializeData, hypnoAnnotations, measurements, events } from "./dataUtils.js";

initializeDatabase();
await initializeData();

let displayArousalEvents, displayRespEvents = false;

for(let [measurement, value] of Object.entries(measurements)) {
    if (measurement === 'time') {
        continue;
    }
    lineChart(measurements.time.min, measurements.time.max, value.min, value.max, value.values, '#container');
}
drawHypnogram(hypnoAnnotations.samples.min, hypnoAnnotations.samples.max, hypnoAnnotations.annotations, '#container2');

// Prepare EventHandlers
document.getElementById('displayArousalEvents')
    .addEventListener('click', () =>
        displayArousalEvents = toggleEvents(
            measurements.time.min,
            measurements.time.max,
            displayArousalEvents,
            events.arousal.values,
            'arousal')
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