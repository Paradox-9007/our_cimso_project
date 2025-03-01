import { generateMemberVsGeneralData, generate_Barchart_dashboard_1_inYears, generateProfitComparisonData} from '../js/processData.js';
import { drawGroupedBarChart, drawMultiLineChart } from '../js/drawChart.js';

let globalSelectedYear = ''; 
let globalSelectedMonth = ''; 

let currentYear = new Date().getFullYear(); 
let currentMonth = new Date().getMonth() + 1;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const availableYears = generate_Barchart_dashboard_1_inYears()[0];
let bar = true;



function updateChartForMonth(year, month) {
    const { labels, datasets } = generateMemberVsGeneralData(parseInt(year), parseInt(month));
    drawGroupedBarChart(labels, datasets, 'chart21');
    updateKPIs(datasets);
    updateProfitChart(parseInt(year), parseInt(month));
}

function updateChartForYear(year) {
    const { labels, datasets } = generateMemberVsGeneralData(parseInt(year));
    drawGroupedBarChart(labels, datasets, 'chart21');
    updateKPIs(datasets);
    updateProfitChart(parseInt(year));
}

function updateChartForYears() {
    const { labels, datasets } = generateMemberVsGeneralData();  // No parameters means get all years
    drawGroupedBarChart(labels, datasets, 'chart21');
    updateKPIs(datasets);
    updateProfitChart();
}

function updateKPIs(datasets) {
    const kpiOne = document.getElementById("kpi-one");
    const kpiTwo = document.getElementById("kpi-two");
    const kpiThree = document.getElementById("kpi-three");

    // Calculate totals from datasets
    const totalGeneral = datasets[1].data.reduce((sum, current) => sum + current, 0);
    const totalMembers = datasets[0].data.reduce((sum, current) => sum + current, 0);
    
    const total = totalMembers + totalGeneral;
    const memberRatio = ((totalMembers / total) * 100).toFixed(2);

    // Update KPI displays
    kpiOne.innerHTML = `
        <p>Total General Guests : </p>
        <p>${totalGeneral}</p>
    `;
    
    kpiTwo.innerHTML = `
        <p>Total Members :</p>
        <p>${totalMembers}</p>
    `;
    
    kpiThree.innerHTML = `
        <p>Member to Guest Ratio</p>
        <p>${memberRatio}% of bookings is from member.</p>
    `;
}

function updateProfitChart(year, month = null) {
    const { labels, datasets, title } = generateProfitComparisonData(year, month);
    drawMultiLineChart('chart22', labels, datasets[0], datasets[1], title);

    const totalMemberProfit = datasets[0].data.reduce((sum, current) => sum + current, 0);
    const totalGeneralProfit = datasets[1].data.reduce((sum, current) => sum + current, 0);
    const totalProfit = totalMemberProfit + totalGeneralProfit;

    const kpiFour = document.getElementById("kpi-four");
    const kpiFive = document.getElementById("kpi-five");
    const kpiSix = document.getElementById("kpi-six");

    kpiFour.innerHTML = `
        <p>Total Member Profits</p>
        <p>$${totalMemberProfit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
    `;
    
    kpiFive.innerHTML = `
        <p>Total General Guest Profits</p>
        <p>$${totalGeneralProfit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
    `;

    kpiSix.innerHTML = `
        <p>Revenue Ratio</p>
        <p>Members generate ${((totalMemberProfit / totalProfit) * 100).toFixed(2)}% of the total revenue ($${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}).</p>
    `;
    
}
// Also update updateChartBasedOnSelection to include the all years view
function updateChartBasedOnSelection() {
    if (globalSelectedYear === '' && globalSelectedMonth === '') {
        updateChartForYears();  // Show data for all years if neither year nor month is selected
    } else if (globalSelectedYear !== '' && globalSelectedMonth === '') {
        updateChartForYear(globalSelectedYear);
    } else {
        updateChartForMonth(globalSelectedYear, globalSelectedMonth);
    }
}
function handleDropdown() {
    const chooseYear = document.getElementById("D2-choose_year");
    const chooseMonth = document.getElementById("D2-choose_month");

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

        updateChartBasedOnSelection();  // Add this line to update chart when year changes
    });

    // Add month change event listener
    chooseMonth.addEventListener("change", function () {
        globalSelectedMonth = this.value;
        if (this.value === "") {
            globalSelectedMonth = '';
        }
        updateChartBasedOnSelection();  // Update chart when month changes
    });
}


function populateMonthDropdown() {
    const chooseMonth = document.getElementById("D2-choose_month");

    if (!chooseMonth) {
        console.error("Error: 'choose_month' element not found.");
        return;
    }

    // Populate the month dropdown
    chooseMonth.innerHTML = `<option value="" style="text-align: center;">All Months</option>
        ${months.map((month, index) => `<option value="${index + 1}" style="text-align: center;">${month}</option>`).join('')}`;

    if (bar) {
        chooseMonth.value = currentMonth;
        globalSelectedMonth = currentMonth;
        bar = false;
        updateChartBasedOnSelection();  // Add this line to update chart on initial load
    }
}


// Initialize the dashboard
handleDropdown();
populateMonthDropdown();
// Set the chart for the current month and year by default
updateChartForMonth(currentYear, currentMonth);





