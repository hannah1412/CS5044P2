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

const ageLabels = ["16-24","25-34","35-44","45-54","55-64","65+"];

function normalize(s) {
  return s.trim().toLowerCase();
}

function processingData(rows) {
  const countsByRegion = {};
  rows.forEach(row => {
    const region = normalize(row.brk_government_region);
    const age    = normalize(row.cage2);
    if (!countsByRegion[region]) countsByRegion[region] = {};
    deviceColumns.forEach(col => {
      const device = devLabels[col];
      if (!countsByRegion[region][device]) countsByRegion[region][device] = {};
      const yes = row[col].trim().toLowerCase() === 'yes';
      countsByRegion[region][device][age] = 
        (countsByRegion[region][device][age] || 0) + (yes ? 1 : 0);
    });
  });
  // flatten 
  return Object.entries(countsByRegion).flatMap(([region, devs]) =>
    Object.entries(devs).flatMap(([device, ages]) =>
      Object.entries(ages).map(([age, count]) => ({region,device,age,count}))
    )
  );
}

function countsLookUp(records, deviceName, ageGroup) {
  // ageGroup comes in like "65+" so normalize that too:
  const ageNorm = normalize(ageGroup);
  return records
    .filter(r => r.device === deviceName && normalize(r.age) === ageNorm)
    .reduce((acc,r)=>{
      acc[r.region] = r.count;
      return acc;
    }, {});
}

function buildLegend(svg, min, max, color, width, height) {
  const lw=300, lh=10;
  const legendG = svg.select("g.legend")
    .attr("transform",`translate(20,${height-40})`)
    .selectAll("*").remove()  // clear old
  ;
  
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

// --- load everything & draw ---
Promise.all([
  fetch('./GeoJson_uk_regions/EER_England.json').then(r=>r.json()),
  fetch('./GeoJson_uk_regions/EER_Scotland.json').then(r=>r.json()),
  fetch('./GeoJson_uk_regions/EER_Wales.json').then(r=>r.json()),
  d3.csv('./digital_poverty.csv')
]).then(([eng, scot, wales, csvData])=>{
  const records  = processingData(csvData);
  const features = [...eng.features, ...scot.features, ...wales.features];
  const geojson  = {type:"FeatureCollection", features};
  const width=840, height=700;

  // SVG + defs + legend group
  const svg = d3.select("#map").append("svg")
                .attr("width",width).attr("height",height);
  svg.append("defs");
  svg.append("g").attr("class","legend");

  // projection & map paths (give them a class)
  const proj    = d3.geoMercator().fitSize([width,height],geojson);
  const pathGen = d3.geoPath(proj);
  const region = svg.selectAll("path.region")
    .data(features)
    .enter().append("path")
      .attr("class","region")
      .attr("d", pathGen)
      .attr("stroke","#666")
      .attr("fill","#eee");

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
    const devCode = d3.select("#deviceFilter").property("value");
    const ageGrp  = d3.select("#ageFilter").property("value");
    const devName = devLabels[devCode];
    currentCounts = countsLookUp(records, devName, ageGrp);

    const {min, max, color} = updateChoropleth(svg, features, currentCounts);
    buildLegend(svg, min, max, color, width, height);
  }
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

  // defaults + initial draw
  devSelect.property("value","q1_01");
  ageSelect.property("value","65+");
  refresh();
});
