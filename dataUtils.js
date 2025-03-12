import * as d3 from "d3";
export function loadData() {
    return new Promise((resolve, reject) => {
        d3.json("data.json").then(data => {
            resolve({
                pulse: processSeries(data, 'pulse'),
                saO2: processSeries(data, 'saO2'),
                abdomen: processSeries(data, 'abdomen'),
                thorax: processSeries(data, 'thorax'),
            });
        }).catch(error => reject(error));
    });
}

function processSeries(data, key) {

    return data.map(d => ({ time: new Date(d.time), value: +d[key] }));

}
