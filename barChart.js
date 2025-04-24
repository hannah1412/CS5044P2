export function createBarChart({ containerId, data, xKey, yKey, xLabel, yLabel }) {
  d3.select(`#${containerId}`).html("");

  const container = document.getElementById(containerId);
  const fullWidth = container.clientWidth;
  const fullHeight = container.clientHeight;

  // https://d3-graph-gallery.com/graph/barplot_horizontal.html
  const margin = { top: 20, right: 20, bottom: 50, left: 200 };
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
    .attr("transform", "translate(-10,0)")
    .style("text-anchor", "end");

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[xKey])])
    .nice()
    .range([0, width]);

  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)")
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
    .attr("y", -150)
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
  chartsContainer.style.flexDirection = "column";

  // Want to remap key to labels.
  const healthLabels = {
    q3_01: 'Hearing problems', q3_02: 'Vision problems',
    q3_03: 'Mobility limitations', q3_04: 'Dexterity issues',
    q3_05: 'Breathing difficulties', q3_06: 'Mental ability issues',
    q3_07: 'Social behavior conditions', q3_08: 'Mental health conditions',
    q3_09: 'Other illnesses', q3_10: 'No impairments',
    q3_11: 'Prefer not to say', q3_12: "Don't know"
  };
  const ageOrder = ['16-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  const incomeLabels = {
    'Up to �199 per week / Up to �10,399 per year': '£0-£10,399',
    '�200 to �299 per week / �10,400 to �15,599 per year': '£10,400-£15,599',
    '�300 to �499 per week / �15,600 to �25,999 per year': '£15,600-£25,999',
    '�500 to v699 per week / �26,000 to �36,399 per year': '£26,000-£36,399',
    '�700 to �999 per week / �36,400 to �51,999 per year': '£36,400-£51,999',
    '�1,000 and above per week / �52,000 and above per year': '£52,000+',
    "Don't know": "Don't know", "Prefer not to say": "Prefer not to say"
  };
  const incomeOrder = [
    '£0-£10,399', '£10,400-£15,599', '£15,600-£25,999',
    '£26,000-£36,399', '£36,400-£51,999', '£52,000+',
    "Don't know", "Prefer not to say"
  ];

  createBarChart({
    containerId: "age",
    data: Object.entries(data.age).map(([key, value]) => ({ category: key, value })),
    yKey: "category",
    xKey: "value",
    yLabel: "Age group",
    xLabel: "# of devices owned"
  });

  createBarChart({
    containerId: "income",
    data: Object.entries(data.income).map(([key, value]) => ({ category: incomeLabels[key], value })),
    yKey: "category",
    xKey: "value",
    yLabel: "Income band",
    xLabel: "# of devices owned"
  });

  createBarChart({
    containerId: "health",
    data: Object.entries(data.health).map(([key, value]) => ({ category: healthLabels[key], value })),
    yKey: "category",
    xKey: "value",
    yLabel: "Health issues",
    xLabel: "# of devices owned"
  });

}