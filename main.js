import { displayCharts } from './barChart.js';
import { highLevelDataProcessor } from './HighLevelDataProcessor.js'

highLevelDataProcessor('./data/digital-exclusion-data.csv').then(regionData => {
  console.log(regionData["Scotland"])
  document.querySelectorAll(".region").forEach(button => {
    button.addEventListener("click", e => {
      const regionFeature = e.target.__data__;
      const regionName = regionFeature?.properties?.EER13NM;
      console.log(regionName)
      if (!regionName) {
        console.warn("No region name found on clicked element");
        return;
      }

      const data = regionData[regionName];

      if (!data) return;
      displayCharts(regionName, data);
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