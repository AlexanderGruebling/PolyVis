import { initLoader } from './data/loader.js';
import { createSignalPlots } from './components/signalPlots.js';
import { createHypnogram } from './components/hypnogram.js';
import { createEventTracks } from './components/eventTracks.js';
import { createControls } from './components/controls.js';

await initLoader();

createControls();
await createSignalPlots();
createHypnogram({});
createEventTracks();

document.getElementById('analysis-loading').classList.add('hidden');
