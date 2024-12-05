// Drawing utilities for line charts

export function drawLineChart(element, data, zoom) {

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };

    const width = element.offsetWidth - margin.left - margin.right;

    const height = 200 - margin.top - margin.bottom;



    // Create SVG container

    const svg = d3.select(element)

        .append("svg")

        .attr("width", width + margin.left + margin.right)

        .attr("height", height + margin.top + margin.bottom)

        .append("g")

        .attr("transform", `translate(${margin.left},${margin.top})`)

        .call(zoom);



    // Define scales and axes

    const xScale = d3.scaleTime().range([0, width]);

    const yScale = d3.scaleLinear().range([height, 0]);

    xScale.domain(d3.extent(data, d => d.time));

    yScale.domain(d3.extent(data, d => d.value));



    const xAxis = d3.axisBottom(xScale);

    const yAxis = d3.axisLeft(yScale);



    // Append axes to the chart

    svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`).call(xAxis);

    svg.append("g").attr("class", "y-axis").call(yAxis);



    // Line generator

    const line = d3.line()

        .x(d => xScale(d.time))

        .y(d => yScale(d.value));



    // Draw the line

    svg.append("path")

        .datum(data)

        .attr("class", "line")

        .attr("d", line);



    // Return chart instance for updates

    return { svg, xScale, yScale, xAxis, yAxis, line, data };

}



// Update line chart based on zoom transformation

export function updateLineChart(chart, transform) {

    const newXScale = transform.rescaleX(chart.xScale);

    chart.svg.select(".x-axis").call(chart.xAxis.scale(newXScale));



    chart.svg.select(".line")

        .attr("d", chart.line.x(d => newXScale(d.time)));

}
