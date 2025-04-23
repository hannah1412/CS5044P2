const deviceColumns = ["q1_01","q1_02","q1_03","q1_04","q1_05","q1_06","q1_07","q1_08","q1_09","q1_10"];
const devLabels = {
    q1_01: "Smart TV",
    q1_02: "TV",
    q1_03: "Games console / handheld",
    q1_04: "Desktop computer", 
    q1_05: "Laptop", 
    q1_06: "Tablet",
    q1_07: "Smartphone", 
    q1_08: "Non‑smart mobile phone",
    q1_09: "Landline telephone", 
    q1_10: "None of these"
};

const usageCols= [
  "q2_01","q2_02", "q2_03", "q2_04", "q2_05", "q2_06","q2_07","q2_08", "q2_09","q2_10","q2_11", "q2_12","q2_13",
  "q2_14", "q2_15","q2_16","q2_17","q2_18", "q2_19"
]
const usageLabels = {
  q2_01: "Sending and receiving emails",
  q2_02: "Looking up information about personal interests",
  q2_03: "Researching information about products",
  q2_04: "Online grocery shopping",
  q2_05: "Other types of online shopping (excluding groceries)",
  q2_06: "Online banking or financial transactions",
  q2_07: "Searching for a job",
  q2_08: "Playing online games",
  q2_09: "Online gaming for money",
  q2_10: "Downloading/streaming music or podcasts",
  q2_11: "Downloading/streaming",
  q2_12: "Using an online dating service",
  q2_13: "Making voice or video calls ",
  q2_14: "Using social networking, blogs, or vlogs",
  q2_15: "Applying for benefits",
  q2_16: "Accessing public services online",
  q2_17: "Using online messaging services",
  q2_18: "Other internet activities",
  q2_19: "None of these"
}

const ageLabels = ["16-24","25-34","35-44","45-54","55-64","65+"];

let currentMode = 'type'; 

function normalize(s) {
  return s.trim().toLowerCase();
}

/**
 * Generalised function to 
 * @param {*} rows 
 * @param {*} columns 
 * @param {*} labels 
 * @returns 
 */
function processingData(rows, columns, labels) {
  const countsByRegion = {};
  rows.forEach(row => {
    const region = normalize(row.brk_government_region);
    const age    = normalize(row.cage2);
    if (!countsByRegion[region]) countsByRegion[region] = {};
    columns.forEach(col => {
      const category = labels[col];
      if (!countsByRegion[region][category]) 
        countsByRegion[region][category] = {};
      const yes = row[col].trim().toLowerCase() === 'yes';
      countsByRegion[region][category][age] = 
        (countsByRegion[region][category][age] || 0) + (yes ? 1 : 0);
    });
  });

  return Object.entries(countsByRegion).flatMap(([region, cats]) =>
    Object.entries(cats).flatMap(([category, ages]) =>
      Object.entries(ages).map(([age, count]) => 
        ({ region, category, age, count }))
    )
  );
}


function countsLookUp(records, categoryName, ageGroup) {
  const ageNorm = normalize(ageGroup);
  return records
    .filter(r => r.category === categoryName && normalize(r.age) === ageNorm)
    .reduce((acc, r) => {
      acc[r.region] = r.count;
      return acc;
    }, {});
}

function buildLegend(svg, min, max, color, width, height) {
  const lw=300, lh=10;
  const legendG =svg.select("g.legend")
                    .attr("transform", `translate(20,${height-40})` );
  
          // clear out the old contents
          legendG.selectAll("*").remove();
  
  // create gradient
  const defs = svg.select("defs");
  const grad = defs.selectAll("#legend-gradient").data([0])
    .join("linearGradient")
      .attr("id","legend-gradient")
      .attr("x1","0%").attr("y1","0%")
      .attr("x2","100%").attr("y2","0%");
  grad.selectAll("stop").remove();
  grad.append("stop").attr("offset","0%").attr("stop-color",color(min));
  grad.append("stop").attr("offset","100%").attr("stop-color",color(max));

  // draw legend bar + axis
  legendG.append("rect")
    .attr("width",lw).attr("height",lh)
    .attr("fill","url(#legend-gradient)");
  
  const scale = d3.scaleLinear().domain([min,max]).range([0,lw]);
  legendG.append("g")
    .attr("transform",`translate(0,${lh})`)
    .call(d3.axisBottom(scale).ticks(5));
}

function updateChoropleth(svg, features, counts) {
  // normalize feature names:
  const cnt = {};
  Object.entries(counts).forEach(([r,c]) => cnt[normalize(r)] = c);
  // get values array
  const vals = features.map(f => cnt[normalize(f.properties.EER13NM)] || 0);
  let [min, max] = d3.extent(vals);
  if (min === max) { min = 0; } 
  const color = d3.scaleSequential(d3.interpolateBlues).domain([min, max]);
  // only update the region‑paths
  svg.selectAll("path.region")
     .transition().duration(600)
     .attr("fill", d => {
       const val = cnt[normalize(d.properties.EER13NM)] || 0;
       return color(val);
     });
  return {min, max, color};
}

function populateCategoryFilter() {
  const sel = d3.select("#deviceFilter");
  const cols  = currentMode === 'type' ? deviceColumns : usageCols;
  const labels= currentMode === 'type' ? devLabels      : usageLabels;

  sel.selectAll("option").remove();
  sel.selectAll("option")
     .data(cols)
     .enter().append("option")
       .attr("value", d => d)
       .text(d => labels[d]);
}


// --- load everything & draw ---
Promise.all([
  fetch('./data/GeoJson_uk_regions/EER_England.json').then(r=>r.json()),
  fetch('./data/GeoJson_uk_regions/EER_Scotland.json').then(r=>r.json()),
  fetch('./data/GeoJson_uk_regions/EER_Wales.json').then(r=>r.json()),
  d3.csv('./data/digital-exclusion-data.csv')
]).then(([eng, scot, wales, csvData])=>{

  // Load records
  const deviceRecords = processingData(csvData, deviceColumns, devLabels);
  const usageRecords  = processingData(csvData, usageCols,  usageLabels);

  const features = [...eng.features, ...scot.features, ...wales.features];

  // Fixing to match the the region in CSV file
  features.forEach(f => {
    if (f.properties.EER13NM === "Eastern") {
      f.properties.EER13NM = "East of England";
    }
  });


  const geojson  = {type:"FeatureCollection", features};
  const width=840, height=700;

  // SVG + defs 
  const svg = d3.select("#map").append("svg")
                .attr("width",width).attr("height",height);
  svg.append("defs");

  svg.append("g.legend")
     .attr("class", "legend");

  // projection & map paths (give them a class)
  const proj    = d3.geoMercator().fitSize([width,height],geojson);
  const pathGen = d3.geoPath(proj);


  // tooltip (unchanged)
  const tooltip = d3.select("body").append("div")
    .attr("class","tooltip")
    .style("position","absolute")
    .style("pointer-events","none")
    .style("padding","4px 8px")
    .style("background","rgba(0,0,0,0.7)")
    .style("color","#fff")
    .style("border-radius","4px")
    .style("visibility","hidden");

  let currentCounts = {};

  function refresh() {
    // 1) which code was selected?
    const code   = d3.select("#deviceFilter").property("value");
    const ageGrp = d3.select("#ageFilter").property("value");
  
    // 2) pick data & labels
    const records = currentMode === 'type' ? deviceRecords : usageRecords;
    const labels  = currentMode === 'type' ? devLabels       : usageLabels;
    const categoryName = labels[code];
  
    // 3) get counts and redraw
    currentCounts = countsLookUp(records, categoryName, ageGrp);
    const {min, max, color} = updateChoropleth(svg, features, currentCounts);
    buildLegend(svg, min, max, color, width, height);

  }
  svg.select("g.legend").raise();

  const region = svg.selectAll("path.region")
  .data(features)
  .enter().append("path")
    .attr("class","region")
    .attr("d", pathGen)
    .attr("stroke","#666")
    .attr("fill","#eee");

  region
    .on("mouseover",(e,d)=>{
        const rawName = d.properties.EER13NM;
        const normName = normalize(rawName);
        const count    = currentCounts[normName] || 0;
    
        tooltip
          .html(`<strong>${rawName}</strong><br/>Count: ${count}`)
          .style("visibility","visible");
    })
    .on("mousemove", e=>{
      tooltip
        .style("top", (e.pageY+12)+"px")
        .style("left",(e.pageX+12)+"px");
    })
    .on("mouseout",()=>{
      tooltip.style("visibility","hidden");
    });


    // RADIO to switch filter 
    const modeRadios = document.querySelectorAll('input[name="mode"]');


    modeRadios.forEach(radio =>
      radio.addEventListener('change', () => {
        currentMode = radio.value; 
        populateCategoryFilter();
        refresh();
      })
    );
    const catSelect = d3.select("#deviceFilter");
    catSelect.on("change", refresh);


  // populate dropdowns
  const devSelect = d3.select("#deviceFilter");
  devSelect.selectAll("option").data(deviceColumns)
    .join("option")
      .attr("value", d=>d)
      .text(d=>devLabels[d]);
  const ageSelect = d3.select("#ageFilter");
  ageSelect.selectAll("option").data(ageLabels)
    .join("option")
      .attr("value", d=>d)
      .text(d=>d);

  // wire up listeners
  devSelect.on("change", refresh);
  ageSelect.on("change", refresh);

  populateCategoryFilter();

  // defaults + initial draw
  d3.select("#deviceFilter").property("value","q1_01");
  d3.select("#ageFilter").property("value","16-24");
  refresh();
});