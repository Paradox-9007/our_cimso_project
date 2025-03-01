import { generate_Combochart_dashboard_4_occupancy_rate_adr } from "../js/processData.js";
import { drawComboChart } from "../js/drawChart.js";

// Get first and last day of current month
const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

// Get chart data for current month
const chartData = generate_Combochart_dashboard_4_occupancy_rate_adr(
  firstDay,
  lastDay
);

// Draw the combo chart with the ADR as bars and Occupancy Rate as a line
drawComboChart(
  "chart41",
  chartData.labels,
  chartData.adrData,
  chartData.occupancyData
);
