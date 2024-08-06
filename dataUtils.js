import * as vg from "./node_modules/@uwdata/vgplot/dist/vgplot.js";

export let measurements = {
    time: {
        min: 0,
        max: 0
    },
    oxygen: {
        min: 0,
        max: 0,
        values: []
    },
    eeg: {
        min: 0,
        max: 0,
        values: []
    },
    thorRes: {
        min: 0,
        max: 0,
        values: []
    },
    abdoRes: {
        min: 0,
        max: 0,
        values: []
    },
};
export let events = {
    arousal: {
        values: []
    },
    resp: {
        values: []
    }
}
export let hypnoAnnotations = {
    sleepStages: {
        values: []
    },
    samples: {
        min: 0,
        max: 0,
        values: []
    },
    annotations: []
};

export function initializeDatabase() {
    // Prepare Database
    vg.coordinator().databaseConnector(vg.wasmConnector());
    vg.coordinator().exec(vg.loadCSV("poly", "http://127.0.0.1:8080/Resources/0000_signals.csv"));
    vg.coordinator().exec(vg.loadCSV("hypn", "http://127.0.0.1:8080/Resources/0000_hypn.csv"));
    vg.coordinator().exec(vg.loadCSV("arou", "http://127.0.0.1:8080/Resources/0000_arou.csv"));
    vg.coordinator().exec(vg.loadCSV("resp", "http://127.0.0.1:8080/Resources/0000_resp.csv"));
}

export async function initializeData() {
    // Prepare time
    let time = [];
    await vg.coordinator().query(vg.Query.from("poly").select("time")).then(res => time = extractDataFromQuery(res));
    measurements.time.min = Math.min.apply(Math, time);
    measurements.time.max = Math.max.apply(Math, time);

    // Prepare SaO2
    let saO2 = [];
    await vg.coordinator().query(vg.Query.from("poly").select("SaO2")).then(res => saO2 = extractDataFromQuery(res));
    measurements.oxygen.min = Math.min.apply(Math, saO2);
    measurements.oxygen.max = Math.max.apply(Math, saO2);

    // Prepare EEG
    let eeg = [];
    await vg.coordinator().query(vg.Query.from("poly").select("EEG")).then(res => eeg = extractDataFromQuery(res));
    measurements.eeg.min = Math.min.apply(Math, eeg);
    measurements.eeg.max = Math.max.apply(Math, eeg);

    // Prepare THOR RES
    let thorRes = [];
    await vg.coordinator().query(vg.Query.from("poly").select("THOR RES")).then(res => thorRes = extractDataFromQuery(res));
    measurements.thorRes.min = Math.min.apply(Math, thorRes);
    measurements.thorRes.max = Math.max.apply(Math, thorRes);

    // Prepare ABDO RES
    let abdoRes = [];
    await vg.coordinator().query(vg.Query.from("poly").select("ABDO RES")).then(res => abdoRes = extractDataFromQuery(res));
    measurements.abdoRes.min = Math.min.apply(Math, abdoRes);
    measurements.abdoRes.max = Math.max.apply(Math, abdoRes);

    for(let i = 0; i < time.length; i++) {
        measurements.oxygen.values.push({x: time[i], y: saO2[i]});
        measurements.eeg.values.push({x: time[i], y: eeg[i]});
        measurements.thorRes.values.push({x: time[i], y: thorRes[i]});
        measurements.abdoRes.values.push({x: time[i], y:abdoRes[i]});
    }

    // Prepare Events
    let arousals = [];
    await vg.coordinator().query(vg.Query.from("arou").select("Sample#"))
        .then(res => arousals = extractDataFromQuery(res)
            .map(sample => Number(sample)));

    let respEvents = [];
    await vg.coordinator().query(vg.Query.from("resp").select("Sample#"))
        .then(res => respEvents = extractDataFromQuery(res)
            .map(sample => Number(sample)));

    for (let i = 0; i < arousals.length; i++) {
        events.arousal.values.push({x: arousals[i]});
    }
    for (let i = 0; i < respEvents.length; i++) {
        events.resp.values.push({x: respEvents[i]});
    }

    await vg.coordinator().query(vg.Query.from("hypn").select("Aux"))
        .then(res => hypnoAnnotations.sleepStages.values = extractDataFromQuery(res)
            .map(stage => String.fromCharCode(stage)));
    await vg.coordinator().query(vg.Query.from("hypn").select("Sample#"))
        .then(res => hypnoAnnotations.samples.values = extractDataFromQuery(res)
            .map(sample => Number(sample)));
    hypnoAnnotations.samples.min = Math.min.apply(Math, hypnoAnnotations.samples.values);
    hypnoAnnotations.samples.max = Math.max.apply(Math, hypnoAnnotations.samples.values);
    for (let i = 0; i < hypnoAnnotations.samples.values.length; i++) {
        hypnoAnnotations.annotations.push({
            x: hypnoAnnotations.samples.values[i],
            y: hypnoAnnotations.sleepStages.values[i]
        });
    }
}

export function extractDataFromQuery(queryResult) {
    let result = [];
    for(let batch of queryResult.batches) {
        for(let child of batch.data.children) {
            result.push(...child.values);
        }
    }
    return result
}