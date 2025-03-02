import { generateUnitPerformanceData,generate_Barchart_dashboard_1_inYears } from '../js/processData.js';
import { drawHorizontalBarChart } from '../js/drawChart.js';

// Add these global variables at the top
let globalSelectedYear = '';
let globalSelectedMonth = '';
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
const availableYears = generate_Barchart_dashboard_1_inYears()[0];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let bar = true;

// Function to update revenue KPIs
function updateRevenueKPIs(sortedByRevenue, periodLabel = '') {
    // Get only top 10 units
    const top10Units = sortedByRevenue.slice(0, 10);
    
    // Update KPIs for all top 10 units
    top10Units.forEach((unit, index) => {
        document.getElementById(`top${index + 1}`).innerHTML = `
            <div class="unit-kpi">
                <strong>${unit.label}</strong><br>
                Revenue: $${unit.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
                Stay Duration: ${unit.days} days<br>
                Total Bookings: ${unit.bookings} times
                ${periodLabel ? `<br><small>${periodLabel}</small>` : ''}
            </div>
        `;
    });
}

// Function to update the chart
function updatePerformanceChart(top10Units) {
    const labels = top10Units.map(unit => unit.label);
    const data = top10Units.map(unit => unit.bookings);
    drawHorizontalBarChart(labels, data, 'chart81');
}

// Function to sort and prepare data
function prepareData(unitData) {
    return [...unitData.labels]
        .map((label, index) => ({
            label,
            revenue: unitData.datasets[0].data[index],
            bookings: unitData.datasets[1].data[index],
            days: unitData.datasets[2].data[index]
        }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 10); // Get only top 10
}

// Main function to update dashboard
function updateDashboard(year = null, month = null) {
    const unitData = generateUnitPerformanceData(
        year ? parseInt(year) : null,
        month ? parseInt(month) : null
    );
    const sortedByRevenue = prepareData(unitData);
    updateRevenueKPIs(sortedByRevenue);
    updatePerformanceChart(sortedByRevenue);
}

function handleDropdown() {
    const chooseYear = document.getElementById("D8-choose_year");
    const chooseMonth = document.getElementById("D8-choose_month");

    if (!chooseYear || !chooseMonth) {
        console.error("Dropdown elements not found.");
        return;
    }

    // Create dropdown for selecting a year
    chooseYear.innerHTML = `<option value="" style="text-align: center;">All Years</option>
    ${availableYears.map(year => `<option value="${year}" style="text-align: center;">${year}</option>`).join('')}`;
    
    chooseYear.value = currentYear;
    globalSelectedYear = currentYear;

    chooseYear.addEventListener("change", function () {
        globalSelectedYear = this.value;
        
        // Reset month selection when a new year is selected
        globalSelectedMonth = '';
        chooseMonth.value = '';
        chooseMonth.style.display = globalSelectedYear === "" ? "none" : "inline";

        if (globalSelectedYear !== "") {
            populateMonthDropdown();
        }

        // Update dashboard with new data
        updateDashboard(
            globalSelectedYear || null,
            globalSelectedMonth || null
        );
    });

    chooseMonth.addEventListener("change", function () {
        globalSelectedMonth = this.value;
        if (this.value === "") {
            globalSelectedMonth = '';
        }

        // Update dashboard with new data
        updateDashboard(
            globalSelectedYear || null,
            globalSelectedMonth || null
        );
    });
}

function populateMonthDropdown() {
    const chooseMonth = document.getElementById("D8-choose_month");

    if (!chooseMonth) {
        console.error("Error: 'D8-choose_month' element not found.");
        return;
    }

    chooseMonth.innerHTML = `<option value="" style="text-align: center;">All Months</option>
        ${months.map((month, index) => `<option value="${index + 1}" style="text-align: center;">${month}</option>`).join('')}`;

    if (bar) {
        chooseMonth.value = currentMonth;
        globalSelectedMonth = currentMonth;
        bar = false;
        
        // Initial update with current month
        updateDashboard(
            globalSelectedYear || null,
            globalSelectedMonth || null
        );
    }
}

// Initialize dashboard
handleDropdown();
populateMonthDropdown();
updateDashboard(currentYear, currentMonth); // Initial load with current date

// Add this at the bottom of your file
handleDropdown();
populateMonthDropdown();

