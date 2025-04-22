import { displayCharts } from './barChart.js';
import { loadAndProcessData } from './dataProcessor.js';
import { highLevelDataProcessor} from './HighLevelDataProcessor.js'

loadAndProcessData('digital-exclusion-data.csv').then(regionData => {
  document.querySelectorAll(".region").forEach(button => {
    button.addEventListener("click", e => {
      const region = e.target.dataset.region;
      const data = regionData[region];

      if (!data) return;
      displayCharts(region, data);
    });
  });

  document.addEventListener("click", (e) => {
    // Clicking outside the barchart container closes it.
    if (!e.target.closest(".region") && !e.target.closest("#barcharts") && !e.target.closest("#all-categories")) {
      const visContainer = document.getElementById("all-categories");
      visContainer.style.display = "none";

      const chartsContainer = document.getElementById("barcharts");
      chartsContainer.style.display = "none";

      const chartsHeader = document.getElementById("region-title");
      chartsHeader.style.display = "none";

      document.querySelectorAll(".chart").forEach(chart => {
        chart.innerHTML = "";
      });
    }
  });
});


highLevelDataProcessor('./Map/digital_poverty.csv')
  .then(summary => {
    console.log(JSON.stringify(summary, null, 2));
    
    document.body.appendChild(
      document.createElement('pre')
    ).textContent = JSON.stringify(summary, null, 2);
  })
  .catch(err => console.error(err));