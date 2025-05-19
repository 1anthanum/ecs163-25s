// Get SVG element and set view dimensions
const svg = d3.select("svg");
const width = window.innerWidth;
const height = window.innerHeight;
svg.attr("width", width).attr("height", height);

// Define chart dimensions and positions
let scatterMargin = {top: 80, right: 50, bottom: 60, left: 80},
    scatterWidth = width / 2 - scatterMargin.left - scatterMargin.right,
    scatterHeight = height / 2 - scatterMargin.top - scatterMargin.bottom;

let barMargin = {top: 80, right: 50, bottom: 60, left: 80},
    barWidth = width / 2 - barMargin.left - barMargin.right,
    barHeight = height / 2 - barMargin.top - barMargin.bottom;

let pcMargin = {top: height / 2 + 80, right: 50, bottom: 40, left: 50},
    pcWidth = width - pcMargin.left - pcMargin.right,
    pcHeight = height / 2 - 120;

// Add dashboard title
svg.append("text")
    .attr("x", width / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .text("Data Science Salary Dashboard");

// Add chart titles
svg.append("text")
    .attr("x", width / 4)
    .attr("y", 60)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Salary vs Remote Work Ratio");

svg.append("text")
    .attr("x", width * 3/4)
    .attr("y", 60)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Experience Level Distribution");

svg.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2 + 60)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Parallel Coordinates Plot of Data Dimensions");

// Load and process data
d3.csv("ds_salaries.csv").then(data => {
    // Preprocess data
    data.forEach(d => {
        d.salary_in_usd = +d.salary_in_usd;
        d.remote_ratio = +d.remote_ratio;
    });

    // 1. Scatter Plot
    const scatter = svg.append("g")
        .attr("transform", `translate(${scatterMargin.left},${scatterMargin.top})`);

    const xScatter = d3.scaleLinear()
        .domain([0, Math.ceil(d3.max(data, d => d.salary_in_usd) / 50000) * 50000]).nice()
        .range([0, scatterWidth]);

    scatter.append("g")
        .attr("transform", `translate(0,${scatterHeight})`)
        .call(d3.axisBottom(xScatter)
            .tickFormat(d => d === 0 ? "0" : (d / 1000) + ",000"))
        .selectAll("text")
        .style("font-size", "12px");

    const yScatter = d3.scaleLinear()
        .domain([0, 100])
        .range([scatterHeight, 0]);

    scatter.append("g")
        .call(d3.axisLeft(yScatter))
        .selectAll("text")
        .style("font-size", "12px");

    scatter.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => xScatter(d.salary_in_usd))
        .attr("cy", d => yScatter(d.remote_ratio))
        .attr("r", 4)
        .attr("fill", "#69b3a2")
        .attr("opacity", 0.7);

    scatter.append("text")
        .attr("x", scatterWidth / 2)
        .attr("y", scatterHeight + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Salary (USD)");

    scatter.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -scatterHeight / 2)
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Remote Work Ratio (%)");

    // 2. Bar Chart
    const barData = Array.from(d3.rollup(data, v => v.length, d => d.experience_level), 
        ([key, value]) => ({experience_level: key, count: value}));

    const bar = svg.append("g")
        .attr("transform", `translate(${width / 2 + barMargin.left},${barMargin.top})`);

    const xBar = d3.scaleBand()
        .domain(barData.map(d => d.experience_level))
        .range([0, barWidth])
        .padding(0.2);

    bar.append("g")
        .attr("transform", `translate(0,${barHeight})`)
        .call(d3.axisBottom(xBar))
        .selectAll("text")
        .style("font-size", "12px");

    const yBar = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.count) * 1.1]).nice()
        .range([barHeight, 0]);

    bar.append("g")
        .call(d3.axisLeft(yBar)
            .tickFormat(d => d === 0 ? "0" : d))
        .selectAll("text")
        .style("font-size", "12px");

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
        .attr("y", barHeight + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Experience Level");

    bar.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -barHeight / 2)
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Count");

    // 3. Parallel Coordinates Plot
    const pc = svg.append("g")
        .attr("transform", `translate(${pcMargin.left},${pcMargin.top})`);
    
    // Define dimensions for parallel coordinates
    const dimensions = ["salary_in_usd", "experience_level", "remote_ratio", "company_size"];
    
    // Define scales for each dimension
    const y = {};
    dimensions.forEach(dim => {
        if (dim === "experience_level" || dim === "company_size") {
            y[dim] = d3.scalePoint()
                .domain([...new Set(data.map(d => d[dim]))])
                .range([pcHeight, 0]);
        } else {
            y[dim] = d3.scaleLinear()
                .domain(d3.extent(data, d => +d[dim])).nice()
                .range([pcHeight, 0]);
        }
    });
    
    // X-axis scale for dimensions
    const x = d3.scalePoint()
        .range([0, pcWidth])
        .domain(dimensions);
    
    // Draw the lines
    pc.selectAll("path.data-line")
        .data(data)
        .join("path")
        .attr("class", "data-line")
        .attr("d", d => d3.line()(dimensions.map(p => [x(p), y[p](d[p])])))
        .attr("fill", "none")
        .attr("stroke", "#4682b4")
        .attr("stroke-opacity", 0.4);
    
    // Add axes for each dimension
    dimensions.forEach(dim => {
        let g = pc.append("g")
            .attr("transform", `translate(${x(dim)},0)`);
        
        let axis = d3.axisLeft(y[dim]);
        
        if (dim === "salary_in_usd") {
            axis.tickFormat(d => d === 0 ? "0" : (d / 1000) + "k");
        }
        
        g.call(axis)
            .selectAll("text")
            .style("font-size", "10px");
            
        // Add dimension labels
        let labelText;
        switch(dim) {
            case "salary_in_usd":
                labelText = "Salary";
                break;
            case "experience_level":
                labelText = "Experience Level";
                break;
            case "remote_ratio":
                labelText = "Remote Ratio";
                break;
            case "company_size":
                labelText = "Company Size";
                break;
            default:
                labelText = dim;
        }
        
        g.append("text")
            .attr("y", -10)
            .attr("fill", "#000")
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("font-size", "12px")
            .text(labelText);
    });
});