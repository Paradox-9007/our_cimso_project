import { getMonthlyOccupancyAndADR, generate_Barchart_dashboard_1_inYears, getTotalRooms } from "../js/processData.js";
import { drawComboChart } from "../js/drawChart.js";

// Get first and last day of current month
const today = new Date();
const currentMonth = today.getMonth() + 1;
const currentYear = today.getFullYear();
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const availableYears = generate_Barchart_dashboard_1_inYears()[0];

// Initialize global variables
let globalSelectedYear = currentYear;
let globalSelectedMonth = currentMonth;

function updateKPIs(month, year) {
    const monthData = getMonthlyOccupancyAndADR(month, year);
    
    // Calculate averages
    const avgOccupancy = monthData.occupancyData.data.reduce((a, b) => a + b, 0) / monthData.occupancyData.data.length;
    const avgADR = monthData.adrData.data.reduce((a, b) => a + b, 0) / monthData.adrData.data.length;
    
    // Update KPI elements
    document.getElementById('kpi-1').innerHTML = `
        <h5>Average Occupancy Rate</h5>
        <p>${Math.round(avgOccupancy)}%</p>
        <small>${months[month-1]} ${year}</small>
    `;
    
    document.getElementById('kpi-2').innerHTML = `
        <h5>Average Daily Rate</h5>
        <p>$${Math.round(avgADR)}</p>
        <small>${months[month-1]} ${year}</small>
    `;
}

function updateThirdRowKPIs(month, year) {
    const monthData = getMonthlyOccupancyAndADR(month, year);
    const TOTAL_ROOMS = getTotalRooms(); // Get actual total rooms
    // Get today's data
    const todayIndex = today.getDate() - 1;
    const todayADR = monthData.adrData.data[todayIndex] || 0;
    const todayOccupancy = monthData.occupancyData.data[todayIndex] || 0;
    
    // Calculate today's revenue
    // Revenue = ADR × Number of Occupied Rooms
    const occupiedRooms = Math.round(TOTAL_ROOMS * (todayOccupancy / 100));
    const todayRevenue = todayADR * occupiedRooms;

    // Update KPI displays
    document.getElementById('kpi-3').innerHTML = `
        <h5>Today's Occupancy Rate</h5>
        <p>${Math.round(todayOccupancy)}%</p>
        <small>${today.getDate()} ${months[month-1]} ${year}</small>
    `;
    
    document.getElementById('kpi-4').innerHTML = `
        <h5>Today's Revenue</h5>
        <p>$${Math.round(todayRevenue).toLocaleString()}</p>
        <small>${today.getDate()} ${months[month-1]} ${year}</small>
    `;
    
    document.getElementById('kpi-5').innerHTML = `
        <h5>Today's ADR</h5>
        <p>$${Math.round(todayADR).toLocaleString()}</p>
        <small>${today.getDate()} ${months[month-1]} ${year}</small>
    `;
}

function updateChartBasedOnSelection() {
    const newChartData = getMonthlyOccupancyAndADR(globalSelectedMonth, globalSelectedYear);
    drawComboChart("chart41", newChartData.labels, newChartData.occupancyData, newChartData.adrData);
    updateKPIs(globalSelectedMonth, globalSelectedYear);
    updateThirdRowKPIs(globalSelectedMonth, globalSelectedYear);
}

function handleDropdown() {
    const chooseYear = document.getElementById("D4-choose_year");
    const chooseMonth = document.getElementById("D4-choose_month");

    if (!chooseYear || !chooseMonth) {
        console.error("Dropdown elements not found.");
        return;
    }

    // Create dropdown for selecting a year
    chooseYear.innerHTML = availableYears
        .map(year => `<option value="${year}" style="text-align: center;">${year}</option>`)
        .join('');
    
    chooseYear.value = currentYear.toString();
    globalSelectedYear = currentYear;

    // Create initial month dropdown
    chooseMonth.innerHTML = months
        .map((month, index) => `<option value="${index + 1}" style="text-align: center;">${month}</option>`)
        .join('');
    
    chooseMonth.value = currentMonth.toString();
    globalSelectedMonth = currentMonth;

    // Year change event
    chooseYear.addEventListener("change", function() {
        globalSelectedYear = parseInt(this.value);
        updateChartBasedOnSelection();
    });

    // Month change event
    chooseMonth.addEventListener("change", function() {
        globalSelectedMonth = parseInt(this.value);
        updateChartBasedOnSelection();
    });
}

// Get initial chart data for current month
const chartData = getMonthlyOccupancyAndADR(currentMonth, currentYear);

// Initial chart draw
drawComboChart(
    "chart41",
    chartData.labels,
    chartData.occupancyData,
    chartData.adrData
);

// Initialize dropdowns and KPIs
handleDropdown();
updateKPIs(currentMonth, currentYear);
updateThirdRowKPIs(currentMonth, currentYear);
    