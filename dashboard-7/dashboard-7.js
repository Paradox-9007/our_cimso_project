import { drawPieChart, drawStackedBarChart } from "../js/drawChart.js";
import { generateBookingStatusChartData, generate_Barchart_dashboard_1_inYears } from "../js/processData.js";

// Global variables for state management
let globalSelectedYear = '';
let globalSelectedMonth = '';

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const availableYears = generate_Barchart_dashboard_1_inYears()[0];
let bar = true;

// Define status code mappings
const statusLabels = {
  'Q': 'Quote',
  'E': 'Quote Rejected',
  'W': 'Waiting List',
  'I': 'Internet',
  'P': 'Provisional',
  'C': 'Confirmed',
  'D': 'Deposit Paid',
  'U': 'Fully Paid',
  'A': 'Active',
  'L': 'Left',
  'N': 'No Show',
  'F': 'Faulty',
  'X': 'Cancelled',
  'O': 'Closed',
  'R': 'Restricted'
};

function handleDropdown() {
    const chooseYear = document.getElementById("D7-choose_year");
    const chooseMonth = document.getElementById("D7-choose_month");

    if (!chooseYear || !chooseMonth) {
        console.error("Dropdown elements not found.");
        return;
    }

    // Create dropdown for selecting a year
    chooseYear.innerHTML = `<option value="" style="text-align: center;">All Years</option>
    ${availableYears.map(year => `<option value="${year}" style="text-align: center;">${year}</option>`).join('')}`;
    
    chooseYear.value = currentYear;  // Set current year as default
    globalSelectedYear = currentYear;  // Set global selected year to current year

    chooseYear.addEventListener("change", function () {
        globalSelectedYear = this.value;

        // Reset month selection when a new year is selected
        globalSelectedMonth = '';
        chooseMonth.value = ''; 
        chooseMonth.style.display = globalSelectedYear === "" ? "none" : "inline";

        if (globalSelectedYear !== "") {
            populateMonthDropdown();
        }

        updateCharts(parseInt(globalSelectedYear), globalSelectedMonth ? parseInt(globalSelectedMonth) : null);
    });

    // Handle month selection change
    chooseMonth.addEventListener("change", function () {
        globalSelectedMonth = this.value;
        if (this.value === "") {
            globalSelectedMonth = '';  // Reset to empty string for "All Months"
        }

        updateCharts(parseInt(globalSelectedYear), parseInt(globalSelectedMonth));
    });
}

function populateMonthDropdown() {
    const chooseMonth = document.getElementById("D7-choose_month");

    if (!chooseMonth) {
        console.error("Error: 'D7-choose_month' element not found.");
        return;
    }

    // Populate the month dropdown
    chooseMonth.innerHTML = `<option value="" style="text-align: center;">All Months</option>
        ${months.map((month, index) => `<option value="${index + 1}" style="text-align: center;">${month}</option>`).join('')}`;

    if (bar) {
        chooseMonth.value = currentMonth;
        globalSelectedMonth = currentMonth;
        bar = false;
        updateCharts(parseInt(globalSelectedYear), parseInt(globalSelectedMonth));
    }
}

function getDaysInMonth(year, month) {
    // For all years view or year-only view, return 31 days
    if (!month) return 31;
    return new Date(year, month, 0).getDate();
}

function updateCharts(year = currentYear, month = currentMonth) {
    let pieChartData, barChartData;
    let periodLabel = '';
    let barChartLabels = [];

    if (!globalSelectedYear) {
        // All Years view
        pieChartData = generateBookingStatusChartData();
        barChartData = generateBookingStatusChartData(null, null, statusLabels);
        periodLabel = 'All Years';
        barChartLabels = availableYears;
    } else if (!globalSelectedMonth) {
        // Specific year view
        pieChartData = generateBookingStatusChartData(parseInt(globalSelectedYear));
        barChartData = generateBookingStatusChartData(parseInt(globalSelectedYear), null, statusLabels);
        periodLabel = `Year ${globalSelectedYear}`;
        barChartLabels = months;
    } else {
        // Specific month view
        pieChartData = generateBookingStatusChartData(parseInt(globalSelectedYear), parseInt(globalSelectedMonth));
        barChartData = generateBookingStatusChartData(parseInt(globalSelectedYear), parseInt(globalSelectedMonth), statusLabels);
        periodLabel = `${months[parseInt(globalSelectedMonth) - 1]} ${globalSelectedYear}`;
        const daysInMonth = getDaysInMonth(globalSelectedYear, globalSelectedMonth);
        barChartLabels = Array.from({length: daysInMonth}, (_, i) => i + 1);
    }

    // Transform pie chart labels to include descriptions
    const pieLabels = pieChartData.labels.map(label => `${label} - ${statusLabels[label] || label}`);

    // Calculate totals for KPIs
    const totalBookings = pieChartData.data.reduce((sum, count) => sum + count, 0);
    const activeBookings = pieChartData.labels.reduce((sum, label, index) => {
        if (['A', 'D', 'U', 'P', 'C'].includes(label)) {
            return sum + pieChartData.data[index];
        }
        return sum;
    }, 0);
    const completedBookings = pieChartData.labels.reduce((sum, label, index) => {
        if (['L', 'O'].includes(label)) {
            return sum + pieChartData.data[index];
        }
        return sum;
    }, 0);

    // Update KPIs
    document.getElementById('Canceled').textContent = 
        `Cancelled Bookings: ${pieChartData.labels.reduce((sum, label, index) => {
            if (['X'].includes(label)) {
                return sum + pieChartData.data[index];
            }
            return sum;
        }, 0).toLocaleString()} (${periodLabel})`;
    document.getElementById('Pending').textContent = 
        `Pending Bookings: ${pieChartData.labels.reduce((sum, label, index) => {
            if (['Q', 'W', 'I', 'P'].includes(label)) {
                return sum + pieChartData.data[index];
            }
            return sum;
        }, 0).toLocaleString()}`;
    document.getElementById('Accpeted').textContent = 
        `Accepted Bookings: ${pieChartData.labels.reduce((sum, label, index) => {
            if (['C', 'D', 'U', 'A'].includes(label)) {
                return sum + pieChartData.data[index];
            }
            return sum;
        }, 0).toLocaleString()}`;

    // Draw the charts
    drawPieChart(pieLabels, pieChartData.data, 'chart71');
    
    drawStackedBarChart(
        barChartLabels,
        barChartData.datasets,
        'chart72'
    );
}

// Initialize the dashboard
handleDropdown();
populateMonthDropdown();
// Set the charts for the current month and year by default
updateCharts(currentYear, currentMonth);
