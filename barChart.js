export function createBarChart({ containerId, data, xKey, yKey, xLabel, yLabel }) {
  d3.select(`#${containerId}`).html("");

  const container = document.getElementById(containerId);
  const fullWidth = container.clientWidth;
  const fullHeight = container.clientHeight;

  // https://d3-graph-gallery.com/graph/barplot_horizontal.html
  const margin = { top: 20, right: 20, bottom: 50, left: 50 };
  const width = fullWidth - margin.left - margin.right;
  const height = fullHeight - margin.top - margin.bottom;

  const svg = d3.select(`#${containerId}`)
    .append("svg")
    .attr("width", fullWidth)
    .attr("height", fullHeight)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const y = d3.scaleBand()
    .range([0, height])
    .domain(data.map(d => d[yKey]))
    .padding(0.2);

  svg.append("g")
    .call(d3.axisLeft(y))
    .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(45)")
      .style("text-anchor", "end");

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[xKey])])
    .nice()
    .range([0, width]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
      .attr("transform", "translate(-10,0)rotate(-45)")
      .style("text-anchor", "end");

  svg.selectAll("rect")
    .data(data)
    .enter()
    .append("rect")
    .attr("y", d => y(d[yKey]))
    .attr("x", 0)
    .attr("height", y.bandwidth())
    .attr("width", d => x(d[xKey]));

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .style("text-anchor", "middle")
    .text(xLabel);

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -40)
    .style("text-anchor", "middle")
    .text(yLabel);
}

export function displayCharts(region, data) {
  const regionTitle = document.getElementById("region-title");
  regionTitle.textContent = `Data for ${region}`;
  regionTitle.style.display = "block";

  const visContainer = document.getElementById("all-categories");
  visContainer.style.display = "flex";
  visContainer.style.flexDirection = "column";

  const chartsContainer = document.getElementById("barcharts");
  chartsContainer.style.display = "flex";
  chartsContainer.style.flexDirection = "row";

  createBarChart({
    containerId: "age",
    data: data.age,
    yKey: "category",
    xKey: "value",
    yLabel: "Age group",
    xLabel: "# of devices owned"
  });

  createBarChart({
    containerId: "income",
    data: data.income,
    yKey: "category",
    xKey: "value",
    yLabel: "Income band",
    xLabel: "# of devices owned"
  });

  createBarChart({
    containerId: "health",
    data: data.health,
    yKey: "category",
    xKey: "value",
    yLabel: "Health issues",
    xLabel: "# of devices owned"
  });
}