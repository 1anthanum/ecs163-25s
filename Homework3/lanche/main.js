// Global variables for interactions
let allData = [];
let currentSelection = [];
let isGenderView = false;
let scatter, bar, pc;
let colorScale, xScatter, yScatter, xBar, yBar;


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

// Add dashboard title with animation
svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "24px")
    .style("font-weight", "bold")
    .style("opacity", 0)
    .text("Interactive Student Mental Health Dashboard")
    .transition()
    .duration(1000)
    .attr("y", 30)
    .style("opacity", 1);

// Initialize the dashboard
function initializeDashboard() {
    d3.csv("Student Mental health.csv").then(data => {
        allData = data;
        
        // Preprocess data (same as above)
        allData.forEach((d, i) => {
            d.id = i;
            d.Age = +d.Age;
            d.Year = +d["Your current year of Study"] || +d.Year;
            
            // Handle different column name variations
            d.Gender = d["Choose your gender"] || d.Gender;
            d.CGPA = d["What is your CGPA?"] || d.CGPA;
            d.Depression = d["Do you have Depression?"] || d.Depression;
            d.Anxiety = d["Do you have Anxiety?"] || d.Anxiety;
            d.Panic_Attack = d["Do you have Panic attack?"] || d.Panic_Attack;
            d.Treatment = d["Did you seek any specialist for a treatment?"] || d.Treatment;
            
            // Convert CGPA to numeric
            const rankList = {
                "2.50 - 2.99": 2.75,
                "3.00 - 3.49": 3.25,
                "3.50 - 4.00": 3.75,
                "2.00 - 2.49": 2.25,
                "Below 2.00": 1.5
            };

            d.CGPA_numeric = rankList[d.CGPA] || null;
            
            // Calculate mental health issues
            d.mental_health_issues = 
                (d.Depression === "Yes" ? 1 : 0) + 
                (d.Anxiety === "Yes" ? 1 : 0) + 
                (d.Panic_Attack === "Yes" ? 1 : 0);
        });

        // Filter valid data
        allData = allData.filter(d => 
            d.Age && d.Age > 0 && d.Age < 100 && 
            d.Gender && 
            d.CGPA_numeric
        );

        console.log(`Loaded ${allData.length} valid records from ar.csv`);

        // Set up color scale
        colorScale = d3.scaleOrdinal()
            .domain(["Male", "Female"])
            .range(["#4a90e2", "#e24a72"]);

        createScatterPlot();
        createBarChart();
        createParallelCoordinates();
        
    }).catch(error => {
        console.error("Error loading ar.csv:", error);
    });
}

// SCATTER PLOT WITH BRUSHING
function createScatterPlot() {
    // Add chart title
    svg.append("text")
        .attr("x", width / 4)
        .attr("y", 60)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Age vs Mental Health Issues (Brushable)");

    scatter = svg.append("g")
        .attr("transform", `translate(${scatterMargin.left},${scatterMargin.top})`);

    // Set up scales
    xScatter = d3.scaleLinear()
        .domain([17, 25])
        .range([0, scatterWidth]);

    yScatter = d3.scaleLinear()
        .domain([0, 3])
        .range([scatterHeight, 0]);

    // Add axis
    scatter.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${scatterHeight})`)
        .call(d3.axisBottom(xScatter));

    scatter.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScatter));

    // Add axis labels
    scatter.append("text")
        .attr("x", scatterWidth / 2)
        .attr("y", scatterHeight + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Age");

    scatter.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -scatterHeight / 2)
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Mental Health Issues Count");

    // Add data points
    updateScatterPlot();

    // ADD BRUSHING FUNCTIONALITY
    const brush = d3.brush()
        .extent([[0, 0], [scatterWidth, scatterHeight]])
        .on("start brush end", brushed);

    scatter.append("g")
        .attr("class", "brush")
        .call(brush);
}

function updateScatterPlot() {
    const circles = scatter.selectAll(".data-point")
        .data(allData, d => d.id);

    // Enter: Add new circles with animation
    circles.enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => xScatter(d.Age))
        .attr("cy", d => yScatter(d.mental_health_issues))
        .attr("r", 0) // Start with radius 0
        .attr("fill", d => colorScale(d.Gender))
        .attr("opacity", 0.7)
        .attr("stroke", "#333")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .on("click", function(event, d) {
            selectPoint(d);
        })
        .transition()
        .duration(800)
        .delay((d, i) => i * 50) // Staggered animation
        .attr("r", 5);

    // Update: Modify existing circles
    circles.transition()
        .duration(500)
        .attr("cx", d => xScatter(d.Age))
        .attr("cy", d => yScatter(d.mental_health_issues))
        .attr("fill", d => colorScale(d.Gender));

    // Exit: Remove circles with animation
    circles.exit()
        .transition()
        .duration(300)
        .attr("r", 0)
        .remove();
}

// BRUSHING FUNCTION - Core interaction technique #1
function brushed(event) {
    const selection = event.selection;
    
    if (selection) {
        // Get points within the brushed area
        const brushedData = allData.filter(d => {
            const x = xScatter(d.Age);
            const y = yScatter(d.mental_health_issues);
            return x >= selection[0][0] && x <= selection[1][0] &&
                   y >= selection[0][1] && y <= selection[1][1];
        });
        
        updateSelection(brushedData);
    } else {
        // Clear selection when brush is cleared
        updateSelection([]);
    }
}

// ============== BAR CHART WITH ANIMATED TRANSITIONS ==============
function createBarChart() {
    // Add chart title
    svg.append("text")
        .attr("x", width * 3/4)
        .attr("y", 60)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Gender Distribution");

    bar = svg.append("g")
        .attr("transform", `translate(${width / 2 + barMargin.left},${barMargin.top})`);

    updateBarChart();
}

function updateBarChart() {
    const genderData = Array.from(d3.rollup(allData, v => v.length, d => d.Gender), 
        ([key, value]) => ({gender: key, count: value}));

    // Set up scales
    xBar = d3.scaleBand()
        .domain(genderData.map(d => d.gender))
        .range([0, barWidth])
        .padding(0.3);

    yBar = d3.scaleLinear()
        .domain([0, d3.max(genderData, d => d.count) * 1.1])
        .range([barHeight, 0]);

    // Update axis
    bar.selectAll(".x-axis").remove();
    bar.selectAll(".y-axis").remove();

    bar.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${barHeight})`)
        .call(d3.axisBottom(xBar));

    bar.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yBar));

    // Update bars with smooth transitions
    const bars = bar.selectAll(".bar-rect")
        .data(genderData, d => d.gender);

    // Enter: Animate bars growing from bottom
    bars.enter()
        .append("rect")
        .attr("class", "bar-rect")
        .attr("x", d => xBar(d.gender))
        .attr("y", barHeight) // Start from bottom
        .attr("width", xBar.bandwidth())
        .attr("height", 0) // Start with 0 height
        .attr("fill", d => colorScale(d.gender))
        .transition()
        .duration(800)
        .attr("y", d => yBar(d.count))
        .attr("height", d => barHeight - yBar(d.count));

    // Update: Smooth transitions for existing bars
    bars.transition()
        .duration(500)
        .attr("x", d => xBar(d.gender))
        .attr("y", d => yBar(d.count))
        .attr("width", xBar.bandwidth())
        .attr("height", d => barHeight - yBar(d.count))
        .attr("fill", d => colorScale(d.gender));

    // Exit: Animate bars shrinking
    bars.exit()
        .transition()
        .duration(300)
        .attr("height", 0)
        .attr("y", barHeight)
        .remove();

    // Add axis labels
    bar.selectAll(".axis-label").remove();
    
    bar.append("text")
        .attr("class", "axis-label")
        .attr("x", barWidth / 2)
        .attr("y", barHeight + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Gender");

    bar.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -barHeight / 2)
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Students");
}

// PARALLEL COORDINATES WITH SELECTION
function createParallelCoordinates() {
    // Add chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2 + 60)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Parallel Coordinates: Student Characteristics");

    pc = svg.append("g")
        .attr("transform", `translate(${pcMargin.left},${pcMargin.top})`);

    updateParallelCoordinates();
}

function updateParallelCoordinates() {
    // Define dimensions for parallel coordinates
    const dimensions = ["Age", "CGPA_numeric", "Depression", "Anxiety", "Panic_Attack"];
    
    // Define scales for each dimension
    const y = {};
    dimensions.forEach(dim => {
        if (dim === "Depression" || dim === "Anxiety" || dim === "Panic_Attack") {
            y[dim] = d3.scalePoint()
                .domain(["No", "Yes"])
                .range([pcHeight, 0]);
        } else {
            y[dim] = d3.scaleLinear()
                .domain(d3.extent(allData, d => +d[dim]))
                .range([pcHeight, 0]);
        }
    });
    
    // X-axis scale for dimensions
    const x = d3.scalePoint()
        .range([0, pcWidth])
        .domain(dimensions);
    
    // Update lines with animations
    const lines = pc.selectAll(".data-line")
        .data(allData, d => d.id);

    // Enter: Add new lines with staggered animation
    lines.enter()
        .append("path")
        .attr("class", "data-line")
        .attr("d", d => d3.line()(dimensions.map(p => [x(p), y[p](d[p])])))
        .attr("fill", "none")
        .attr("stroke", d => colorScale(d.Gender))
        .attr("stroke-opacity", 0) // Start invisible
        .attr("stroke-width", 1.5)
        .style("cursor", "pointer")
        .on("click", function(event, d) {
            selectPoint(d);
        })
        .transition()
        .duration(1000)
        .delay((d, i) => i * 20) // Staggered animation
        .attr("stroke-opacity", 0.6);

    // Update: Smooth color transitions
    lines.transition()
        .duration(500)
        .attr("stroke", d => colorScale(d.Gender));

    // Exit: Fade out lines
    lines.exit()
        .transition()
        .duration(300)
        .attr("stroke-opacity", 0)
        .remove();

    // Add axes for each dimension
    pc.selectAll(".dimension").remove();
    
    dimensions.forEach(dim => {
        let g = pc.append("g")
            .attr("class", "dimension")
            .attr("transform", `translate(${x(dim)},0)`);
        
        let axis = d3.axisLeft(y[dim]);
        if (dim === "CGPA_numeric") {
            axis.tickFormat(d => d.toFixed(2));
        }
        
        g.call(axis);
        
        // Add dimension labels
        const labelText = {
            "Age": "Age",
            "CGPA_numeric": "CGPA",
            "Depression": "Depression", 
            "Anxiety": "Anxiety",
            "Panic_Attack": "Panic Attack"
        }[dim];
        
        g.append("text")
            .attr("y", -10)
            .attr("fill", "#000")
            .style("text-anchor", "middle")
            .style("font-weight", "bold")
            .style("font-size", "12px")
            .text(labelText);
    });
}

// ============== SELECTION FUNCTIONS - Core interaction technique #2 ==============
function selectPoint(d) {
    if (currentSelection.includes(d.id)) {
        // Remove from selection (toggle off)
        currentSelection = currentSelection.filter(id => id !== d.id);
    } else {
        // Add to selection (toggle on)
        currentSelection.push(d.id);
    }
    
    updateSelection(allData.filter(d => currentSelection.includes(d.id)));
}

function updateSelection(selectedData) {
    currentSelection = selectedData.map(d => d.id);
    
    // Update visual feedback across all views
    // Scatter plot
    scatter.selectAll(".data-point")
        .classed("highlighted", d => currentSelection.includes(d.id))
        .classed("dimmed", d => currentSelection.length > 0 && !currentSelection.includes(d.id))
        .transition()
        .duration(300)
        .attr("stroke", d => currentSelection.includes(d.id) ? "#ff6b35" : "#333")
        .attr("stroke-width", d => currentSelection.includes(d.id) ? 3 : 0.5)
        .attr("r", d => currentSelection.includes(d.id) ? 7 : 5)
        .attr("opacity", d => {
            if (currentSelection.length === 0) return 0.7;
            return currentSelection.includes(d.id) ? 1 : 0.2;
        });

    // Parallel coordinates
    pc.selectAll(".data-line")
        .classed("highlighted", d => currentSelection.includes(d.id))
        .classed("dimmed", d => currentSelection.length > 0 && !currentSelection.includes(d.id))
        .transition()
        .duration(300)
        .attr("stroke-width", d => currentSelection.includes(d.id) ? 3 : 1.5)
        .attr("stroke-opacity", d => {
            if (currentSelection.length === 0) return 0.6;
            return currentSelection.includes(d.id) ? 1 : 0.1;
        });
    
    // Update info panel
    updateInfoPanel(selectedData);
}

function updateInfoPanel(selectedData) {
    const infoDiv = d3.select("#selection-info");
    
    if (selectedData.length === 0) {
        infoDiv.html("<strong>Selection Info:</strong> No points selected");
    } else {
        const maleCount = selectedData.filter(d => d.Gender === "Male").length;
        const femaleCount = selectedData.filter(d => d.Gender === "Female").length;
        const avgAge = d3.mean(selectedData, d => d.Age).toFixed(1);
        const depressionCount = selectedData.filter(d => d.Depression === "Yes").length;
        const anxietyCount = selectedData.filter(d => d.Anxiety === "Yes").length;
        
        infoDiv.html(`
            <strong>Selection Info:</strong> ${selectedData.length} students selected<br>
            👥 Gender: ${maleCount} Male, ${femaleCount} Female<br>
            📊 Average Age: ${avgAge}<br>
            🧠 Depression: ${depressionCount} students<br>
            😰 Anxiety: ${anxietyCount} students
        `);
    }
}

// ============== ANIMATION FUNCTIONS - Animated Transitions ==============
function resetSelection() {
    currentSelection = [];
    updateSelection([]);
    
    // Clear brush selection
    scatter.select(".brush").call(d3.brush().clear);
}

function toggleGender() {
    isGenderView = !isGenderView;
    
    if (isGenderView) {
        // Animate to gender-focused view (View Transition)
        scatter.selectAll(".data-point")
            .transition()
            .duration(1000)
            .attr("r", d => d.Gender === "Female" ? 8 : 3)
            .attr("stroke-width", d => d.Gender === "Female" ? 2 : 0.5)
            .attr("opacity", d => d.Gender === "Female" ? 1 : 0.4);
    } else {
        // Return to normal view (View Transition)
        scatter.selectAll(".data-point")
            .transition()
            .duration(1000)
            .attr("r", 5)
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.7);
    }
}

function animateToMentalHealth() {
    // Visualization Change: Highlight students with mental health issues
    scatter.selectAll(".data-point")
        .transition()
        .duration(1500)
        .attr("r", d => d.mental_health_issues > 0 ? 8 : 3)
        .attr("stroke", d => d.mental_health_issues > 0 ? "#ff6b35" : "#333")
        .attr("stroke-width", d => d.mental_health_issues > 0 ? 3 : 0.5)
        .attr("opacity", d => d.mental_health_issues > 0 ? 1 : 0.3);
        
    // Parallel coordinates highlighting
    pc.selectAll(".data-line")
        .transition()
        .duration(1500)
        .attr("stroke-width", d => d.mental_health_issues > 0 ? 3 : 1)
        .attr("stroke-opacity", d => d.mental_health_issues > 0 ? 1 : 0.2);
        
    // Reset after 3 seconds (Timestep transition)
    setTimeout(() => {
        scatter.selectAll(".data-point")
            .transition()
            .duration(1000)
            .attr("r", 5)
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5)
            .attr("opacity", 0.7);
            
        pc.selectAll(".data-line")
            .transition()
            .duration(1000)
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.6);
    }, 3000);
}

// Initialize the dashboard when the page loads
initializeDashboard();