const width = 1200;
const height = 900;

let scatterMargin = {top: 20, right: 30, bottom: 40, left: 70},
    scatterWidth = 550 - scatterMargin.left - scatterMargin.right,
    scatterHeight = 350 - scatterMargin.top - scatterMargin.bottom;

let barMargin = {top: 20, right: 30, bottom: 40, left: 70},
    barWidth = 550 - barMargin.left - barMargin.right,
    barHeight = 350 - barMargin.top - barMargin.bottom;

let sankeyMargin = {top: 400, right: 30, bottom: 30, left: 30},
    sankeyWidth = 1100 - sankeyMargin.left - sankeyMargin.right,
    sankeyHeight = 400 - sankeyMargin.top - sankeyMargin.bottom;

const svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

d3.csv("ds_salaries.csv").then(rawData => {
    rawData.forEach(d => {
        d.salary_in_usd = +d.salary_in_usd;
        d.remote_ratio = +d.remote_ratio;
    });

    // Scatter plot
    const scatter = svg.append("g")
        .attr("transform", `translate(${scatterMargin.left},${scatterMargin.top})`);

    const xScatter = d3.scaleLinear()
        .domain([0, d3.max(rawData, d => d.salary_in_usd)]).nice()
        .range([0, scatterWidth]);

    scatter.append("g")
        .attr("transform", `translate(0,${scatterHeight})`)
        .call(d3.axisBottom(xScatter));

    const yScatter = d3.scaleLinear()
        .domain([0, 100])
        .range([scatterHeight, 0]);

    scatter.append("g")
        .call(d3.axisLeft(yScatter));

    scatter.selectAll("circle")
        .data(rawData)
        .enter().append("circle")
        .attr("cx", d => xScatter(d.salary_in_usd))
        .attr("cy", d => yScatter(d.remote_ratio))
        .attr("r", 4)
        .attr("fill", "#69b3a2");

    scatter.append("text")
        .attr("x", scatterWidth / 2)
        .attr("y", scatterHeight + 35)
        .attr("text-anchor", "middle")
        .text("Salary (USD)");

    scatter.append("text")
        .attr("x", -scatterHeight / 2)
        .attr("y", -50)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Remote Ratio (%)");

    // Bar chart
    const barData = Array.from(d3.rollup(rawData, v => v.length, d => d.experience_level), ([key, value]) => ({experience_level: key, count: value}));

    const bar = svg.append("g")
        .attr("transform", `translate(${barMargin.left + scatterWidth + 100},${barMargin.top})`);

    const xBar = d3.scaleBand()
        .domain(barData.map(d => d.experience_level))
        .range([0, barWidth])
        .padding(0.2);

    bar.append("g")
        .attr("transform", `translate(0,${barHeight})`)
        .call(d3.axisBottom(xBar));

    const yBar = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.count)])
        .range([barHeight, 0]).nice();

    bar.append("g")
        .call(d3.axisLeft(yBar));

    bar.selectAll("rect")
        .data(barData)
        .enter().append("rect")
        .attr("x", d => xBar(d.experience_level))
        .attr("y", d => yBar(d.count))
        .attr("width", xBar.bandwidth())
        .attr("height", d => barHeight - yBar(d.count))
        .attr("fill", "steelblue");

    bar.append("text")
        .attr("x", barWidth / 2)
        .attr("y", barHeight + 35)
        .attr("text-anchor", "middle")
        .text("Experience Level");

    bar.append("text")
        .attr("x", -barHeight / 2)
        .attr("y", -50)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Count");

    // Sankey diagram
    const sankeyData = rawData.map(d => ({source: d.employee_residence, target: d.company_location, value: 1}));

    const sankeyNodes = Array.from(new Set(sankeyData.flatMap(d => [d.source, d.target])), d => ({name: d}));
    const sankeyNodeMap = new Map(sankeyNodes.map((d, i) => [d.name, i]));

    const sankeyLinks = sankeyData.map(d => ({source: sankeyNodeMap.get(d.source), target: sankeyNodeMap.get(d.target), value: d.value}));

    const sankeyGen = d3.sankey().nodeWidth(15).nodePadding(10).extent([[0,0],[sankeyWidth,sankeyHeight]]);
    const {nodes, links} = sankeyGen({nodes: sankeyNodes, links: sankeyLinks});

    const sankey = svg.append("g").attr("transform", `translate(${sankeyMargin.left},${sankeyMargin.top})`);

    sankey.selectAll("rect").data(nodes).enter().append("rect")
        .attr("x", d => d.x0).attr("y", d => d.y0)
        .attr("height", d => d.y1 - d.y0).attr("width", d => d.x1 - d.x0)
        .attr("fill", "#4682b4");

    sankey.selectAll("path").data(links).enter().append("path")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", "#aaa")
        .attr("stroke-width", d => Math.max(1, d.width))
        .attr("fill", "none")
        .attr("opacity", 0.5);
});
