import { initLoader, q } from './data/loader.js';
import { createSignalPlots } from './components/signalPlots.js';
import { createHypnogram } from './components/hypnogram.js';
import { createEventTracks } from './components/eventTracks.js';
import { computeMetrics } from './components/metricsPanel.js';
import { createControls } from './components/controls.js';

await initLoader();

createControls();
createSignalPlots();
createHypnogram({});
createEventTracks();

document.getElementById('loading-overlay').classList.add('hidden');

computeMetrics(q);
