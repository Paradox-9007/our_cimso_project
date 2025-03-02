import { drawLineChart, drawPieChart } from "../js/drawChart.js";
import { generateRevenueChartData, generate_Barchart_dashboard_1_inYears } from "../js/processData.js";

// Global variables for state management
let globalSelectedYear = '';
let globalSelectedMonth = '';

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const availableYears = generate_Barchart_dashboard_1_inYears()[0];
let bar = true;

function updateKPIs(year, month) {
    const selectedMonth = document.getElementById('D9-choose_month').value;
    const selectedYear = document.getElementById('D9-choose_year').value;

    if (selectedYear === '') {
        // All years view - Calculate total income and year-over-year changes
        const totalIncome = availableYears.reduce((total, yr) => {
            const yearlyTotal = months.reduce((sum, _, monthIndex) => {
                const { datasets: [{ data: monthData }] } = generateRevenueChartData(yr, monthIndex + 1);
                return sum + (monthData[0] || 0);
            }, 0);
            return total + yearlyTotal;
        }, 0);

        // Get the most recent two years for comparison
        const lastYear = Math.max(...availableYears);
        const lastYearTotal = months.reduce((total, _, monthIndex) => {
            const { datasets: [{ data: monthData }] } = generateRevenueChartData(lastYear, monthIndex + 1);
            return total + (monthData[0] || 0);
        }, 0);

        const previousYearTotal = months.reduce((total, _, monthIndex) => {
            const { datasets: [{ data: monthData }] } = generateRevenueChartData(lastYear - 1, monthIndex + 1);
            return total + (monthData[0] || 0);
        }, 0);

        const yearOverYearChange = previousYearTotal === 0 ? 0 : ((lastYearTotal - previousYearTotal) / previousYearTotal * 100);
        const contribution = totalIncome === 0 ? 0 : (lastYearTotal / totalIncome * 100);

        document.getElementById('total-income-value').textContent = `$${totalIncome.toLocaleString()}`;
        document.getElementById('mom-change-value').textContent = `${yearOverYearChange.toFixed(1)}%`;
        document.getElementById('contribution-value').textContent = `${contribution.toFixed(1)}%`;
        document.getElementById('kpi-trend-1').textContent = `Total Income Across All Years`;
        document.getElementById('kpi-trend-2').textContent = `${lastYear} vs ${lastYear - 1}`;
        document.getElementById('kpi-trend-3').textContent = `${lastYear}'s Contribution to Total Revenue`;

    } else if (selectedMonth === 'all') {
        // Year view - Compare with previous year
        const yearlyTotal = months.reduce((total, _, monthIndex) => {
            const { datasets: [{ data: monthData }] } = generateRevenueChartData(year, monthIndex + 1);
            return total + (monthData[0] || 0);
        }, 0);

        const previousYearTotal = months.reduce((total, _, monthIndex) => {
            const { datasets: [{ data: monthData }] } = generateRevenueChartData(year - 1, monthIndex + 1);
            return total + (monthData[0] || 0);
        }, 0);

        const allYearsTotal = availableYears.reduce((total, yr) => {
            const yearTotal = months.reduce((sum, _, monthIndex) => {
                const { datasets: [{ data: monthData }] } = generateRevenueChartData(yr, monthIndex + 1);
                return sum + (monthData[0] || 0);
            }, 0);
            return total + yearTotal;
        }, 0);

        const yearOverYearChange = previousYearTotal === 0 ? 0 : ((yearlyTotal - previousYearTotal) / previousYearTotal * 100);
        const contribution = allYearsTotal === 0 ? 0 : (yearlyTotal / allYearsTotal * 100);

        document.getElementById('total-income-value').textContent = `$${yearlyTotal.toLocaleString()}`;
        document.getElementById('mom-change-value').textContent = `${yearOverYearChange.toFixed(1)}%`;
        document.getElementById('contribution-value').textContent = `${contribution.toFixed(1)}%`;
        document.getElementById('kpi-trend-1').textContent = `Total Income for ${year}`;
        document.getElementById('kpi-trend-2').textContent = `${year} vs ${year - 1}`;
        document.getElementById('kpi-trend-3').textContent = `${year}'s Contribution to All-time Revenue`;

    } else {
        // Month view - Compare with previous month
        const { datasets: [{ data: currentMonthData }] } = generateRevenueChartData(year, month);
        const totalIncome = currentMonthData[0] || 0;

        const previousMonth = month === 1 ? 12 : month - 1;
        const previousYear = month === 1 ? year - 1 : year;
        const { datasets: [{ data: previousMonthData }] } = generateRevenueChartData(previousYear, previousMonth);
        const previousMonthIncome = previousMonthData[0] || 0;

        const momChange = previousMonthIncome === 0 ? 0 : ((totalIncome - previousMonthIncome) / previousMonthIncome * 100);
        const annualTotal = months.reduce((total, _, monthIndex) => {
            const { datasets: [{ data: monthData }] } = generateRevenueChartData(year, monthIndex + 1);
            return total + (monthData[0] || 0);
        }, 0);

        const contribution = annualTotal === 0 ? 0 : ((totalIncome / annualTotal) * 100);

        document.getElementById('total-income-value').textContent = `$${totalIncome.toLocaleString()}`;
        document.getElementById('mom-change-value').textContent = `${momChange.toFixed(1)}%`;
        document.getElementById('contribution-value').textContent = `${contribution.toFixed(1)}%`;
        document.getElementById('kpi-trend-1').textContent = `Total Income for ${months[month-1]} ${year}`;
        document.getElementById('kpi-trend-2').textContent = `vs ${months[previousMonth-1]} ${previousYear}`;
        document.getElementById('kpi-trend-3').textContent = `Contribution to ${year} Revenue`;
    }
}

function updateCharts(year = currentYear, month = currentMonth) {
    const selectedMonth = document.getElementById('D9-choose_month').value;
    const selectedYear = document.getElementById('D9-choose_year').value;

    // Line Chart Update
    if (selectedYear === '') {
        // All years view
        const labels = availableYears;
        const data = availableYears.map(year => {
            return months.reduce((total, _, monthIndex) => {
                const { datasets: [{ data: monthData }] } = generateRevenueChartData(year, monthIndex + 1);
                return total + (monthData[0] || 0);
            }, 0);
        });
        drawLineChart(labels, data, "chart91", "Yearly Revenue Trends");
    } else if (selectedMonth === 'all') {
        // Monthly view for selected year
        const labels = months;
        const data = months.map((_, index) => {
            const { datasets: [{ data: monthData }] } = generateRevenueChartData(year, index + 1);
            return monthData[0] || 0;
        });
        drawLineChart(labels, data, "chart91", `Monthly Revenue Trends for ${year}`);
    } else {
        // Daily view for selected month
        const { labels: monthlyLabels, datasets: [{ data: monthlyData }] } = generateRevenueChartData(year, month);
        drawLineChart(monthlyLabels, monthlyData, "chart91", `Daily Revenue for ${months[month-1]} ${year}`);
    }

    // Pie Chart Update
    let pieChartLabels, pieChartData;
    if (selectedYear === '') {
        // Distribution across years
        pieChartLabels = availableYears;
        pieChartData = availableYears.map(year => {
            return months.reduce((total, _, monthIndex) => {
                const { datasets: [{ data: monthData }] } = generateRevenueChartData(year, monthIndex + 1);
                return total + (monthData[0] || 0);
            }, 0);
        });
    } else {
        // Distribution across months for selected year
        const monthlyData = months.map((month, index) => {
            const { datasets: [{ data: monthData }] } = generateRevenueChartData(selectedYear, index + 1);
            return monthData[0] || 0;
        });

        const nonZeroMonths = monthlyData.map((value, index) => ({ value, month: months[index] }))
            .filter(item => item.value > 0);

        pieChartLabels = nonZeroMonths.map(item => item.month);
        pieChartData = nonZeroMonths.map(item => item.value);
    }

    drawPieChart(pieChartLabels, pieChartData, "chart92");
    updateKPIs(selectedYear ? parseInt(selectedYear) : null, selectedMonth !== 'all' ? parseInt(selectedMonth) : null);
}

function handleDropdown() {
    const chooseYear = document.getElementById("D9-choose_year");
    const chooseMonth = document.getElementById("D9-choose_month");

    if (!chooseYear || !chooseMonth) {
        console.error("Dropdown elements not found.");
        return;
    }

    chooseYear.innerHTML = `<option value="" style="text-align: center;">All Years</option>
    ${availableYears.map(year => `<option value="${year}" style="text-align: center;">${year}</option>`).join('')}`;
    
    chooseYear.value = currentYear;
    globalSelectedYear = currentYear;

    chooseYear.addEventListener("change", function () {
        globalSelectedYear = this.value;
        globalSelectedMonth = '';
        chooseMonth.value = '';
        chooseMonth.style.display = globalSelectedYear === "" ? "none" : "inline";

        if (globalSelectedYear !== "") {
            populateMonthDropdown();
        }

        updateCharts(parseInt(globalSelectedYear), globalSelectedMonth ? parseInt(globalSelectedMonth) : currentMonth);
    });

    chooseMonth.addEventListener("change", function () {
        globalSelectedMonth = this.value;
        updateCharts(parseInt(globalSelectedYear), parseInt(globalSelectedMonth));
    });
}

function populateMonthDropdown() {
    const chooseMonth = document.getElementById("D9-choose_month");

    if (!chooseMonth) {
        console.error("Error: 'D9-choose_month' element not found.");
        return;
    }

    chooseMonth.innerHTML = `<option value="all" style="text-align: center;">All Months</option>
        ${months.map((month, index) => `<option value="${index + 1}" style="text-align: center;">${month}</option>`).join('')}`;

    if (bar) {
        chooseMonth.value = currentMonth;
        globalSelectedMonth = currentMonth;
        bar = false;
        updateCharts(parseInt(globalSelectedYear), parseInt(globalSelectedMonth));
    }
}

// Initialize the dashboard
handleDropdown();
populateMonthDropdown();
updateCharts(currentYear, currentMonth);

// Helper function to get days in month
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

