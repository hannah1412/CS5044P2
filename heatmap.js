// heatmap.js

export function drawHeatmap(containerId, dataPath) {
    const margin = { top: 30, right: 30, bottom: 80, left: 120 },
          width = 450 - margin.left - margin.right,
          height = 450 - margin.top - margin.bottom;
  
    // Create container for dropdowns and chart
    const container = d3.select(containerId);
    container.html(""); // Clear any existing content
  
    const controlPanel = container.append("div").attr("id", "controls").style("margin-bottom", "20px");
    controlPanel.html(`
      X-Axis:
      <select id="x-axis-select">
        <option value="cage2">Age</option>
        <option value="q11">Income</option>
        <option value="health">Health Conditions</option>
      </select>
      Y-Axis:
      <select id="y-axis-select">
        <option value="cage2">Age</option>
        <option value="q11">Income</option>
        <option value="health">Health Conditions</option>
      </select>
    `);
  
    const svg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "solid 2px #ccc")
      .style("border-radius", "5px")
      .style("padding", "5px")
      .style("pointer-events", "none")
      .style("opacity", 0);
  
    const healthFields = ["q3_01", "q3_02", "q3_03", "q3_04", "q3_05", "q3_06", "q3_07", "q3_08", "q3_09", "q3_10", "q3_11", "q3_12"];
    const healthLabels = {
      "q3_01": "Hearing problems",
      "q3_02": "Vision problems",
      "q3_03": "Mobility limitations",
      "q3_04": "Dexterity issues",
      "q3_05": "Breathing difficulties",
      "q3_06": "Mental ability issues",
      "q3_07": "Social behavior conditions",
      "q3_08": "Mental health conditions",
      "q3_09": "Other illnesses",
      "q3_10": "No impairments",
      "q3_11": "Prefer not to say",
      "q3_12": "Don't know"
    };
  
    const ageOrder = ["16-24", "25-34", "35-44", "45-54", "55-64", "65+"];
    const incomeMapping = {
      "Up to £199 per week / Up to £10,399 per year": "£0-£10,399",
      "£200 to £299 per week / £10,400 to £15,599 per year": "£10,400-£15,599",
      "£300 to £499 per week / £15,600 to £25,999 per year": "£15,600-£25,999",
      "£500 to v699 per week / £26,000 to £36,399 per year": "£26,000-£36,399",
      "£700 to £999 per week / £36,400 to £51,999 per year": "£36,400-£51,999",
      "£1,000 and above per week / £52,000 and above per year": "£52,000+",
      "Don't know": "Don't know",
      "Prefer not to say": "Prefer not to say"
    };
    const incomeOrder = [
      "£0-£10,399", "£10,400-£15,599", "£15,600-£25,999",
      "£26,000-£36,399", "£36,400-£51,999", "£52,000+",
      "Don't know", "Prefer not to say"
    ];
  
    function getCategories(d, axis) {
      if (axis === "health") {
        return healthFields.filter(field => d[field] && d[field].toLowerCase() === "yes")
                           .map(field => healthLabels[field] || field);
      } else if (axis === "q11") {
        return [incomeMapping[d[axis]] || d[axis]];
      } else {
        return [d[axis]];
      }
    }
  
    function update(data, xAttr, yAttr) {
      const aggregated = {};
      data.forEach(d => {
        const xCats = getCategories(d, xAttr);
        const yCats = getCategories(d, yAttr);
        xCats.forEach(xCat => {
          yCats.forEach(yCat => {
            const key = `${xCat}_${yCat}`;
            aggregated[key] = aggregated[key] || { xCat, yCat, count: 0 };
            aggregated[key].count++;
          });
        });
      });
  
      const xDomain = xAttr === "cage2" ? ageOrder :
                      xAttr === "q11" ? incomeOrder :
                      xAttr === "health" ? healthFields.map(f => healthLabels[f]) :
                      Array.from(new Set(data.flatMap(d => getCategories(d, xAttr))));
  
      const yDomain = yAttr === "cage2" ? ageOrder :
                      yAttr === "q11" ? incomeOrder :
                      yAttr === "health" ? healthFields.map(f => healthLabels[f]) :
                      Array.from(new Set(data.flatMap(d => getCategories(d, yAttr))));
  
      const fullData = [];
      xDomain.forEach(xVal => {
        yDomain.forEach(yVal => {
          const key = `${xVal}_${yVal}`;
          fullData.push(aggregated[key] || { xCat: xVal, yCat: yVal, count: 0 });
        });
      });
  
      svg.selectAll("*").remove();
  
      const x = d3.scaleBand().range([0, width]).domain(xDomain).padding(0.05);
      const y = d3.scaleBand().range([height, 0]).domain(yDomain).padding(0.05);
  
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickSize(0))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");
  
      svg.append("g").call(d3.axisLeft(y).tickSize(0));
  
      const maxCount = d3.max(fullData, d => d.count);
      const color = d3.scaleLinear().domain([1, maxCount]).range(["#CAF0F8", "#023E8A"]);
  
      svg.selectAll()
        .data(fullData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.xCat))
        .attr("y", d => y(d.yCat))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("rx", 4)
        .attr("ry", 4)
        .style("fill", d => color(d.count))
        .style("stroke", "none")
        .style("opacity", 0.8)
        .on("mouseover", function(event, d) {
          tooltip.style("opacity", 1);
          d3.select(this).style("stroke", "black").style("opacity", 1);
        })
        .on("mousemove", function(event, d) {
          tooltip.html(`<strong>${d.xCat} × ${d.yCat}</strong><br/>Count: ${d.count}`)
                 .style("left", `${event.pageX + 10}px`)
                 .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseleave", function() {
          tooltip.style("opacity", 0);
          d3.select(this).style("stroke", "none").style("opacity", 0.8);
        });
    }
  
    d3.csv(dataPath).then(data => {
      // Initial render
      update(data, "cage2", "q11");
  
      // Update when dropdowns change
      d3.select("#x-axis-select").on("change", function() {
        const xAttr = this.value;
        const yAttr = d3.select("#y-axis-select").node().value;
        update(data, xAttr, yAttr);
      });
  
      d3.select("#y-axis-select").on("change", function() {
        const xAttr = d3.select("#x-axis-select").node().value;
        const yAttr = this.value;
        update(data, xAttr, yAttr);
      });
    });
  }
  