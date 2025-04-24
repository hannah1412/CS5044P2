import { displayCharts } from './barChart.js';
import { highLevelDataProcessor } from './HighLevelDataProcessor.js'

highLevelDataProcessor('./data/digital-exclusion-data.csv').then(regionData => {
  document.querySelectorAll(".region").forEach(button => {
    button.addEventListener("click", e => {
      const selectedMode = document.querySelector('input[name="mode"]:checked').value;
      var ylabel = "";
      if (selectedMode == "usage") {
        ylabel = "Number of Device Usage Reasons"
      } else {
        ylabel = "Number of Devices Owned"
      }

      const regionFeature = e.target.__data__;
      const regionName = regionFeature?.properties?.EER13NM;

      const data = regionData[regionName];

      if (!data) return;
      displayCharts(regionName, data, ylabel);
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