import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

// Default settings to be overwritten in functions
export const width = 640;
export const height = 400;
const marginTop = 20;
const marginRight = 20;
const marginBottom = 30;
const marginLeft = 40;

const colorMap = {resp: 'green', arousal: 'red'};
let polyXAxis;

export function initializeCommonXAxis(minX, maxX) {
    polyXAxis = d3.scaleLinear()
        .domain([minX, maxX])
        .range([marginLeft, width - marginRight]);
    return polyXAxis;
}

export function lineChart(minY, maxY, data, containerId) {
    const height = 200;

    // Original domains for resetting.
    const originalXDomain = d3.extent(data, d => d.x);
    const originalYDomain = [minY, maxY];

    // Declare the x (horizontal position) scale.
    const x = polyXAxis;

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

    svg.on("dblclick", () => {
        // Reset the x scale domain to the original domain.
        x.domain(originalXDomain);

        // Reset the y scale domain to the original domain.
        y.domain(originalYDomain);

        // Update the x-axis.
        xAxis.transition().duration(500).call(d3.axisBottom(x));

        // Update the y-axis.
        yAxis.transition().duration(500).call(d3.axisLeft(y));

        // Update the line path with the full data.
        path.datum(data).transition().duration(500).attr("d", line);

        // Clear the brush selection.
        brushGroup.call(brush.move, null);
    });

    return {
        svg: svg,
        path: path,
        x: x,
        xAxis: xAxis,
        line: line
    }
}

export function drawHypnogram(minX, maxX, data, containerId) {
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

    // Get the SVG container.
    const svg = d3.select(".hypno");

    // Add the x-axis.
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .attr("class", "hypno-x-axis")
        .call(d3.axisBottom(x));

    // Add the y-axis.
    const yAxis = svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

    const path = svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("class", "hypno-path")
        .attr("d", line(data));

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([[marginLeft, marginTop], [width - marginRight, height - marginBottom]])
        .on("zoom", event => {
            const newX = event.transform.rescaleX(x);
            svg.select(".hypno-x-axis").call(d3.axisBottom(newX));
            svg.select(".hypno-path").attr("d", d3.line()
                .x(d => newX(d.x))
                .y(d => y(d.y))(data));
            // updateOtherCharts(newX);
        });

    svg.call(zoom);

    return svg;
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

    const x = d3.scaleLinear()
        .domain([minX, maxX])
        .range([marginLeft, width - marginRight]);

    const svg = d3.select('.chart')
        .select('svg');

    if (svg.empty()) {
        // If the SVG does not exist, create it
        d3.select('.chart')
            .append('svg')
            .attr('width', width + marginLeft + marginRight)
            .attr('height', height + marginTop + marginBottom)
            .append('g')
            .attr('transform', `translate(${marginLeft},${marginTop})`);
    }

    const lines = svg.selectAll('.vertical-line.' + className);

    if (lines.empty()) {
        // If the lines do not exist, create them
        svg.selectAll('.vertical-line.' + className)
            .data(data)
            .enter()
            .append('line')
            .attr('class', 'vertical-line ' + className)
            .attr('x1', d => x(d.x))
            .attr('x2', d => x(d.x))
            .attr('y1', 0)
            .attr('y2', height)
            .attr('stroke', colorMap[className])
            .attr('stroke-width', 1);
    }

    // Toggle the visibility of the lines
    svg.selectAll('.vertical-line.' + className)
        .style('display', displayEvents ? null : 'none');

    return displayEvents;
}


