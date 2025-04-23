// heatmap.js
// Modular heatmap implementation with HighLevelDataProcessor integration (D3 v7)
import { highLevelDataProcessor } from './HighLevelDataProcessor.js';

export function drawHeatmap(containerId, dataPath, regionFilter = 'Scotland') {
  const margin = { top: 30, right: 30, bottom: 80, left: 80 },
        width  = 450 - margin.left - margin.right,
        height = 450 - margin.top  - margin.bottom;

  // Select and clear container
  const container = d3.select(containerId);
  container.selectAll('*').remove();

  // Controls for axis selection
  const controls = container.append('div')
    .attr('id', 'controls')
    .style('margin-bottom', '20px');
  controls.html(`
    X-Axis:
    <select id="x-axis-select">
      <option value="age">Age</option>
      <option value="income">Income</option>
      <option value="health">Health Conditions</option>
    </select>
    Y-Axis:
    <select id="y-axis-select">
      <option value="age">Age</option>
      <option value="income">Income</option>
      <option value="health">Health Conditions</option>
    </select>
  `);

  d3.select('#x-axis-select').property('value', 'health');
  d3.select('#y-axis-select').property('value', 'age');

  // SVG setup
  const svg = container.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Tooltip div
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('background-color', 'white')
    .style('border', 'solid 2px #ccc')
    .style('border-radius', '5px')
    .style('padding', '5px')
    .style('pointer-events', 'none')
    .style('opacity', 0);

  // Static mappings and orders
  const healthLabels = {
    q3_01: 'Hearing problems', q3_02: 'Vision problems', q3_03: 'Mobility limitations',
    q3_04: 'Dexterity issues', q3_05: 'Breathing difficulties', q3_06: 'Mental ability issues',
    q3_07: 'Social behavior conditions', q3_08: 'Mental health conditions', q3_09: 'Other illnesses',
    q3_10: 'No impairments', q3_11: 'Prefer not to say', q3_12: "Don't know"
  };
  const ageOrder = ['16-24','25-34','35-44','45-54','55-64','65+'];
  const incomeLabels = {
    'Up to £199 per week / Up to £10,399 per year': '£0-£10,399',
    '£200 to £299 per week / £10,400 to £15,599 per year': '£10,400-£15,599',
    '£300 to £499 per week / £15,600 to £25,999 per year': '£15,600-£25,999',
    '£500 to v699 per week / £26,000 to £36,399 per year': '£26,000-£36,399',
    '£700 to £999 per week / £36,400 to £51,999 per year': '£36,400-£51,999',
    '£1,000 and above per week / £52,000 and above per year': '£52,000+' ,
    'Don\'t know': 'Don\'t know', 'Prefer not to say': 'Prefer not to say'
  };
  const incomeOrder = ['£0-£10,399','£10,400-£15,599','£15,600-£25,999',
                       '£26,000-£36,399','£36,400-£51,999','£52,000+',
                       'Don\'t know','Prefer not to say'];

  // Label helper
  function getLabel(attr, key) {
    if (attr === 'income') return incomeLabels[key] || key;
    if (attr === 'health') return healthLabels[key]   || key;
    return key;
  }

  // Main update using summary
  function update(summary, xAttr, yAttr, region) {
    const regionData = summary[region] || {};
    const sourceX = regionData[xAttr] || {};
    const sourceY = regionData[yAttr] || {};

    // Domains
    const xDomain = xAttr === 'age'    ? ageOrder
                  : xAttr === 'income' ? incomeOrder
                  : xAttr === 'health' ? Object.keys(sourceX).map(k => healthLabels[k]||k)
                  : Object.keys(sourceX);
    const yDomain = yAttr === 'age'    ? ageOrder
                  : yAttr === 'income' ? incomeOrder
                  : yAttr === 'health' ? Object.keys(sourceY).map(k => healthLabels[k]||k)
                  : Object.keys(sourceY);

    // Build grid
    const fullData = [];
    xDomain.forEach(x => {
      yDomain.forEach(y => {
        const rawX = Object.keys(sourceX).find(k => getLabel(xAttr,k) === x);
        const rawY = Object.keys(sourceY).find(k => getLabel(yAttr,k) === y);
        const valX = sourceX[rawX] || 0;
        const valY = sourceY[rawY] || 0;
        const count = (xAttr===yAttr && rawX===rawY) ? valX : Math.min(valX,valY);
        fullData.push({ xCat:x, yCat:y, count });
      });
    });

    // Draw
    svg.selectAll('*').remove();
    const xScale = d3.scaleBand().domain(xDomain).range([0,width]).padding(0.05);
    const yScale = d3.scaleBand().domain(yDomain).range([height,0]).padding(0.05);

    svg.append('g').attr('transform',`translate(0,${height})`).call(d3.axisBottom(xScale).tickSize(0))
       .selectAll('text').style('text-anchor','end').attr('dx','-.8em').attr('dy','.15em').attr('transform','rotate(-45)');
    svg.append('g').call(d3.axisLeft(yScale).tickSize(0));

    const maxCount = d3.max(fullData,d=>d.count);
    const color = d3.scaleLinear().domain([0,maxCount]).range(['#CAF0F8','#03045E']);

    svg.selectAll('rect').data(fullData).enter().append('rect')
      .attr('x',d=>xScale(d.xCat)).attr('y',d=>yScale(d.yCat))
      .attr('width',xScale.bandwidth()).attr('height',yScale.bandwidth())
      .attr('rx',4).attr('ry',4)
      .style('fill',d=>color(d.count)).style('opacity',0.8)
      .on('mouseover',(event,d)=>{tooltip.style('opacity',1);d3.select(event.currentTarget).style('stroke','black').style('opacity',1);})
      .on('mousemove',(event,d)=>{tooltip.html(`<strong>${d.xCat} × ${d.yCat}</strong><br/>Count: ${d.count}`)
        .style('left',`${event.pageX+10}px`).style('top',`${event.pageY-28}px`);})
      .on('mouseleave',()=>{tooltip.style('opacity',0);svg.selectAll('rect').style('stroke','none').style('opacity',0.8);});
  }

  // Process & render
  highLevelDataProcessor(dataPath).then(summary=>{
    update(summary,'health','age',regionFilter);
    d3.select('#x-axis-select').on('change',function(){update(summary,this.value,d3.select('#y-axis-select').node().value,regionFilter);});
    d3.select('#y-axis-select').on('change',function(){update(summary,d3.select('#x-axis-select').node().value,this.value,regionFilter);});
  });
}
