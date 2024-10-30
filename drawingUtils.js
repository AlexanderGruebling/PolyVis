import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


export const width = 640;
export const height = 400;
const marginTop = 20;
const marginRight = 20;
const marginBottom = 30;
const marginLeft = 40;

const colorMap = {resp: '#4db6ac', arousal: '#ff8a65'};
let polyXAxis;

export function initializeCommonXAxis(minX, maxX) {
    polyXAxis = d3.scaleLinear()
        .domain([minX, maxX])
        .range([marginLeft, width - marginRight]);
    return polyXAxis;
}

export function lineChart(minY, maxY, data, containerId) {
    const height = 200;
    const originalXDomain = d3.extent(data, d => d.x);
    const originalYDomain = [minY, maxY];

    const x = polyXAxis;

    const y = d3.scaleLinear()
        .domain([minY, maxY])
        .range([height - marginBottom, marginTop]);

    const line = d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y));

    
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("class", "chart");

    
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .call(d3.axisBottom(x));

    
    const yAxis = svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

    
    const path = svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("d", line(data));

    
    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("padding", "6px")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("display", "none");

    
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mousemove", mousemove)
        .on("mouseenter", () => tooltip.style("display", "block"))
        .on("mouseleave", () => tooltip.style("display", "none"));

    function mousemove(event) {
        
        const [mouseX, mouseY] = d3.pointer(event);
        const xValue = x.invert(mouseX);
        const closestData = getClosestData(xValue, data);

        
        tooltip.html(`x: ${closestData.x.toFixed(2)}<br>y: ${closestData.y.toFixed(2)}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`);
    }

    function getClosestData(xValue, data) {
        
        return data.reduce((prev, curr) => (
            Math.abs(curr.x - xValue) < Math.abs(prev.x - xValue) ? curr : prev
        ));
    }

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([[marginLeft, marginTop], [width - marginRight, height - marginBottom]])
        .on("zoom", event => {
            const newX = event.transform.rescaleX(x);
            xAxis.call(d3.axisBottom(newX));

            path.attr("d", d3.line()
                .x(d => newX(d.x))
                .y(d => y(d.y))(data));

            svg.selectAll(".vertical-line")
                .attr('x1', d => newX(d.x))
                .attr('x2', d => newX(d.x))
        });

    svg.call(zoom);

    
    const container = d3.select(containerId);
    container.append(() => svg.node());

    
    svg.on("dblclick", () => {
        x.domain(originalXDomain);
        y.domain(originalYDomain);
        xAxis.transition().duration(500).call(d3.axisBottom(x));
        yAxis.transition().duration(500).call(d3.axisLeft(y));
        path.datum(data).transition().duration(500).attr("d", line);
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
    const x = d3.scaleLinear()
        .domain([minX, maxX])
        .range([marginLeft, width - marginRight]);

    const y = d3.scalePoint()
        .domain(['4', '3', '2', '1', 'R', 'W'])
        .range([height - marginBottom, marginTop]);

    const line = d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y));

    const svg = d3.select(".hypno");

    
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .attr("class", "hypno-x-axis")
        .call(d3.axisBottom(x));

    
    const yAxis = svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

    
    const path = svg.append("path")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("class", "hypno-path")
        .attr("d", line(data));

    
    svg.selectAll(".y-grid-line")
        .data(y.domain())
        .enter()
        .append("line")
        .attr("class", "y-grid-line")
        .attr("x1", marginLeft)
        .attr("x2", width - marginRight)
        .attr("y1", d => y(d))
        .attr("y2", d => y(d))
        .attr("stroke", "gray")
        .attr("stroke-dasharray", "4 4") 
        .attr("stroke-opacity", 0.5); 

    
    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([[marginLeft, marginTop], [width - marginRight, height - marginBottom]])
        .on("zoom", event => {
            const newX = event.transform.rescaleX(x);
            svg.select(".hypno-x-axis").call(d3.axisBottom(newX));

            svg.select(".hypno-path").attr("d", d3.line()
                .x(d => newX(d.x))
                .y(d => y(d.y))(data));
        });

    svg.call(zoom);

    return svg;
}

export function toggleEvents(minX, maxX, displayEvents, data, className) {
    displayEvents = !displayEvents;

    const x = d3.scaleLinear()
        .domain([minX, maxX])
        .range([marginLeft, width - marginRight]);

    const charts = d3.selectAll('.chart');

    charts.each(function() {
        const svg = d3.select(this).select('svg');

        if (svg.empty()) {
            d3.select(this)
                .append('svg')
                .attr('width', width + marginLeft + marginRight)
                .attr('height', height + marginTop + marginBottom)
                .append('g')
                .attr('transform', `translate(${marginLeft},${marginTop})`);
        }

        const lines = svg.selectAll('.vertical-line.' + className);
        if (lines.empty()) {
            svg.selectAll('.vertical-line.' + className)
                .data(data)
                .enter()
                .append('line')
                .attr('class', 'vertical-line ' + className)
                .attr('x1', d => x(d.x))
                .attr('x2', d => x(d.x))
                .attr('y1', 10)
                .attr('y2', height - 50)
                .attr('stroke', colorMap[className])
                .attr('stroke-width', 1);
        }
        
        svg.selectAll('.vertical-line.' + className)
            .style('display', displayEvents ? null : 'none');
    });

    return displayEvents;
}




