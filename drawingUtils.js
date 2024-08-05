import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

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
        .attr("d", line(data));

    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("brush end", brushed);

    const brushGroup = svg.append("g")
        .attr("class", "brush")
        .call(brush);

    // Append the SVG element.
    const container = d3.select(containerId);
    container.append(() => svg.node());
}

function brushed(event) {
    if (event.selection) {
        const [x0, x1] = event.selection.map(d3.selectAll(".chart").x.invert);
        updateSecondChart(x0, x1);
    }
}

function updateSecondChart(x0, x1) {
    const filteredData = d3.selectAll(".chart").data.filter(d => d.time >= x0 && d.time <= x1);
    updateChart2(filteredData);
}

function updateChart2(filteredData) {
    xScale2.domain(d3.extent(filteredData, d => d.date));

    svg2.selectAll(".line")
        .datum(filteredData)
        .attr("d", line2);

    svg2.select(".x-axis").call(d3.axisBottom(xScale2));
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