import * as d3 from "d3";
export function loadData() {

    // Sample data fetching logic

    return new Promise((resolve, reject) => {

        d3.json("data.json").then(data => {

            // Assuming data is in a structure with time and multiple series

            // Process data if needed, e.g., parsing dates or filtering

            resolve({

                pulse: processSeries(data, 'pulse'),

                saO2: processSeries(data, 'saO2'),

                abdomen: processSeries(data, 'abdomen'),

                thorax: processSeries(data, 'thorax'),

            });

        }).catch(error => reject(error));

    });

}



// Helper to process each series by key

function processSeries(data, key) {

    return data.map(d => ({ time: new Date(d.time), value: +d[key] }));

}
