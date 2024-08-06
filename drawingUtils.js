import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as vg from "./node_modules/@uwdata/vgplot/dist/vgplot.js";
import { extractDataFromQuery } from "./dataUtils.js";

const colorMap = {resp: 'green', arousal: 'red'};




export function lineChart(minX, maxX, minY, maxY, data, containerId) {
    // Declare the chart dimensions and margins.
    const width = 640;
    const height = 200;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 40;

    // Declare the x (horizontal position) scale.
    const x = d3.scaleLinear()
        .domain([minX, maxX])
        .range([marginLeft, width - marginRight]);

    // Declare the y (vertical position) scale.
    const y = d3.scaleLinear()
        .domain([minY, maxY])
        .range([height - marginBottom, marginTop]);

    const line = d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y));

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "chart");

    // Add the x-axis.
    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x));

    // Add the y-axis.
    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

    svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("d", line(data))

    // Append the SVG element.
    const container = d3.select(containerId);
    container.append(() => svg.node());
}

export function drawHypnogram(minX, maxX, data, containerId) {
    // Declare the chart dimensions and margins.
    const width = 640;
    const height = 400;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 40;

    // Declare the x (horizontal position) scale.
    const x = d3.scaleLinear()
        .domain([minX, maxX])
        .range([marginLeft, width - marginRight]);

    // Declare the y (vertical position) scale.
    const y = d3.scalePoint()
        .domain(['4', '3', '2', '1', 'R', 'W'])
        .range([height - marginBottom, marginTop]);

    const line = d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y));

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "hypno");

    // Add the x-axis.
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x));

    // Add the y-axis.
    const yAxis = svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

    const path = svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("d", line(data));

    // Append the SVG element.
    const container = d3.select(containerId);
    container.append(() => svg.node());

    // Add zooming
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([[marginLeft, marginTop], [width - marginRight, height - marginBottom]])
        .on("zoom", event => {
            const newX = event.transform.rescaleX(x);
            xAxis.call(d3.axisBottom(newX));
            path.attr("d", d3.line()
                .x(d => newX(d.x))
                .y(d => y(d.y))(data));
            updateOtherCharts(newX);
        });

    svg.call(zoom);
}

function updateOtherCharts(newX) {
    const width = 640;
    const height = 200;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 40;
    // Select all charts with the .chart class
    d3.selectAll(".chart").each(function() {
        const chart = d3.select(this);
        const yScale = d3.scaleLinear()
            .domain([0, 100]) // Adjust domain as needed
            .range([height - marginBottom, marginTop]);

        const line = d3.line()
            .x(d => newX(d.x))
            .y(d => yScale(d.y));

        // Update the x-axis
        chart.select(".x-axis").call(d3.axisBottom(newX));

        // Update the path
        chart.select("path").attr("d", line(data));
    });
}

export function toggleEvents(minX, maxX, displayEvents, data, className) {
    displayEvents = !displayEvents;
    if (d3.selectAll('.vertical-line .' + className).size() !== 0){
        d3.selectAll('.vertical-line .' + className).style('opacity', `${displayEvents ? 1 : 0}`);
        return displayEvents;
    }
    const width = 640;
    const height = 400;
    const marginTop = 20;
    const marginRight = 20;
    const marginBottom = 30;
    const marginLeft = 40;
    const x = d3.scaleLinear()
        .domain([minX, maxX])
        .range([marginLeft, width - marginRight]);
    const svg = d3.selectAll('.chart')
        .append('svg')
        .attr('width', width + marginLeft + marginRight)
        .attr('height', height + marginTop + marginBottom)
        .append('g')
        .attr('transform', `translate(${marginLeft},${marginTop})`);

    svg.selectAll('.vertical-line')
        .data(data)
        .enter()
        .append('line')
        .attr('class', 'vertical-line .' + className)
        .attr('x1', d => x(d.x))
        .attr('x2', d => x(d.x))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', colorMap[className])
        .attr('stroke-width', 1);

    return displayEvents;
}