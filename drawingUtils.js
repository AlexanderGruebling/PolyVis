import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
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
        .attr("height", height);

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

    // Append the SVG element.
    const container = d3.select(containerId);
    container.append(() => svg.node());
}

export function toggleArousalEvents(minX, maxX, displayArousalEvents, data) {
    displayArousalEvents = !displayArousalEvents;
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
        .attr('class', 'vertical-line')
        .attr('x1', d => x(d.x))
        .attr('x2', d => x(d.x))
        .attr('y1', 0)
        .attr('y2', height)
        .attr('stroke', 'green')
        .attr('stroke-width', 1)
        .attr('display', `${displayArousalEvents}`);

    return displayArousalEvents;
}