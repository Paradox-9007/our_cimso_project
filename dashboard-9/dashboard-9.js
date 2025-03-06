import { drawLineChart, drawPieChart } from "../js/drawChart.js";
import { generateRevenueChartData, generate_Barchart_dashboard_1_inYears } from "../js/processData.js";
import { generateAiContent } from '../js/apiCaller.js';
import { getCurrentSection } from '../js/responsive.js';

// Global variables for state management
let globalSelectedYear = '';
let globalSelectedMonth = '';

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const availableYears = generate_Barchart_dashboard_1_inYears()[0];
let bar = true;


// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx
let kpi_for_ai = {};
let aiAnalysisTimeout;
let Is_ai_on;

async function updateAIAnalysis() {
    const aiAnalysisElement = document.getElementById('D9-ai-analysis');
    if (!aiAnalysisElement) return;

    for (let retryCount = 0; retryCount < 3; retryCount++) {
        try {
            aiAnalysisElement.innerHTML = '<div class= "ai-loading"> </div>';

            // Format data
            const chartDataString = Object.values(kpi_for_ai).filter(Boolean).join('\n');
            console.log(Object.values(kpi_for_ai).filter(Boolean).join('\n'));
            const combinedPrompt = `Based on the following booking data:\n${chartDataString}\n
            Please provide analysis in three sections:
            1. Profit Trend & Peak Analysis
            2. Month-over-Month Performance & Anomalies
            3. Profit Distribution & Forecasting`;

            // API call with timeout
            const analysis = await Promise.race([
                generateAiContent(combinedPrompt),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 30000))
            ]);
            
            // Format and display analysis
            const formattedAnalysis = analysis
            .replace(/##\s*(.*?)(?:\n|$)/g, (_, p1) => `<h5 style="text-align: center">${p1.replace(/\s*\([^)]*\)/g, '')}</h5>`)
            .replace(/\*\*(.*?)\*\*/g, '<br><b>$1</b>')
            .replace(/\s\*(?!\*)/g, ' ')
            .replace(/\*(?!\*)/g, ' ')
            .replace(/\n/g, '<br>')
            .replace(/<br><br>/g, '<br>')
            .replace(/([-]?\d+\.?\d*%)/g, '<b>$1</b>')
            .replace(/\$[\d,]+(\.\d{2})?/g, '<b>$&</b>')
            .replace(/\b\d+\b/g, '<b>$&</b>')
            .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, '<b>$&</b>')
            .replace(/(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?\s*,?\s*\d{4}/gi, '<b>$&</b>')
            .replace(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?\b/gi, '<b>$&</b>'); 
                
            aiAnalysisElement.innerHTML = `<div id="ai-text"> ${formattedAnalysis} </div>`;
            return;
        } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            
            if (retryCount === 2) {
                aiAnalysisElement.innerHTML = 'Unable to generate AI analysis. Please try again later.';
            } else {
                await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
            }
        }
    }
}

function updateKpiForAi(key, value) {
    kpi_for_ai[key] = value;
    
    if (Is_ai_on) {
        clearTimeout(aiAnalysisTimeout);
        aiAnalysisTimeout = setTimeout(updateAIAnalysis, 2000);
    }
}

async function monitorSection() {
    const observer = new MutationObserver(async () => {
        const isMonthlyStats = getCurrentSection() === 'Total Income';
        
        if (!Is_ai_on && isMonthlyStats) {
            Is_ai_on = true;
            await updateAIAnalysis();
        }
    });

    observer.observe(document.body, {
        childList: true, subtree: true, 
        attributes: true, characterData: true
    });

    // Initial check
    if (!Is_ai_on && getCurrentSection() === 'Total Income') {
        Is_ai_on = true;
        await updateAIAnalysis();
    }
}

monitorSection();
// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx



function updateKPIs(year, month) {
    const selectedMonth = document.getElementById('D9-choose_month').value;
    const selectedYear = document.getElementById('D9-choose_year').value;

    if (selectedYear === '') {
        // All years view - Calculate total income and year-over-year changes
        const { labels: years, datasets: [{ data: yearlyTotals }] } = generateRevenueChartData();
        const totalIncome = yearlyTotals.reduce((sum, value) => sum + value, 0);

        // Get the most recent two years for comparison
        const lastYear = Math.max(...years.map(Number));
        const lastYearIndex = years.indexOf(lastYear.toString());
        const lastYearTotal = yearlyTotals[lastYearIndex];
        const previousYearTotal = yearlyTotals[lastYearIndex - 1];

        const yearOverYearChange = previousYearTotal === 0 ? 0 : ((lastYearTotal - previousYearTotal) / previousYearTotal * 100);
        const contribution = totalIncome === 0 ? 0 : (lastYearTotal / totalIncome * 100);

        document.getElementById('total-income-value').textContent = `$${totalIncome.toLocaleString()}`;
        document.getElementById('mom-change-value').textContent = ` Nothing to compare`;
        document.getElementById('contribution-value').textContent = `100%`;
        document.getElementById('kpi-trend-1').textContent = `Total Income Across All Years`;
        document.getElementById('kpi-trend-2').textContent = ``;
        document.getElementById('kpi-trend-3').textContent = ``;

        updateKpiForAi('3', `KPI Summary for All Years:
            - Total Income: $${totalIncome.toLocaleString()}
            - Year-over-Year Change: ${yearOverYearChange.toFixed(1)}% Comparison with ${lastYear - 1}
            - Revenue Contribution: ${contribution.toFixed(1)}% of ${lastYear}'s Contribution to Total Revenue`);

    } else if (selectedMonth === 'all') {
        // Monthly view for selected year
        const { datasets: [{ data: yearData }] } = generateRevenueChartData(parseInt(selectedYear));
        const yearlyTotal = yearData.reduce((sum, value) => sum + value, 0);

        const { datasets: [{ data: prevYearData }] } = generateRevenueChartData(parseInt(selectedYear) - 1);
        const previousYearTotal = prevYearData.reduce((sum, value) => sum + value, 0);

        // Get all years data for total calculation
        const { datasets: [{ data: allYearsData }] } = generateRevenueChartData();
        const allYearsTotal = allYearsData.reduce((sum, value) => sum + value, 0);

        const yearOverYearChange = previousYearTotal === 0 ? 0 : ((yearlyTotal - previousYearTotal) / previousYearTotal * 100);
        const contribution = allYearsTotal === 0 ? 0 : (yearlyTotal / allYearsTotal * 100);

        document.getElementById('total-income-value').textContent = `$${yearlyTotal.toLocaleString()}`;
        document.getElementById('mom-change-value').textContent = `${yearOverYearChange.toFixed(1)}%`;
        document.getElementById('contribution-value').textContent = `${contribution.toFixed(1)}%`;
        document.getElementById('kpi-trend-1').textContent = `Total Income for ${selectedYear}`;
        document.getElementById('kpi-trend-2').textContent = `${selectedYear - 1} vs ${selectedYear}`;
        document.getElementById('kpi-trend-3').textContent = `of All-time Revenue`;

        updateKpiForAi('3', `KPI Summary for ${selectedYear}:
            - Total Income: $${yearlyTotal.toLocaleString()} in Year: ${selectedYear}
            - Year-over-Year Change: ${yearOverYearChange.toFixed(1)}% Comparison with ${selectedYear - 1}
            - Revenue Contribution: ${contribution.toFixed(1)}%
            `);

    } else {
        // Daily view for selected month
        const { datasets: [{ data: monthData }] } = generateRevenueChartData(parseInt(selectedYear), parseInt(selectedMonth));
        const totalIncome = monthData.reduce((sum, value) => sum + value, 0);

        const previousMonth = parseInt(selectedMonth) === 1 ? 12 : parseInt(selectedMonth) - 1;
        const previousYear = parseInt(selectedMonth) === 1 ? parseInt(selectedYear) - 1 : parseInt(selectedYear);
        const { datasets: [{ data: prevMonthData }] } = generateRevenueChartData(previousYear, previousMonth);
        const previousMonthTotal = prevMonthData.reduce((sum, value) => sum + value, 0);

        // Get yearly total for contribution calculation
        const { datasets: [{ data: yearData }] } = generateRevenueChartData(parseInt(selectedYear));
        const yearlyTotal = yearData.reduce((sum, value) => sum + value, 0);

        const momChange = previousMonthTotal === 0 ? 0 : ((totalIncome - previousMonthTotal) / previousMonthTotal * 100);
        const contribution = yearlyTotal === 0 ? 0 : (totalIncome / yearlyTotal * 100);

        document.getElementById('total-income-value').textContent = `$${totalIncome.toLocaleString()}`;
        document.getElementById('mom-change-value').textContent = `${momChange.toFixed(1)}%`;
        document.getElementById('contribution-value').textContent = `${contribution.toFixed(1)}%`;
        document.getElementById('kpi-trend-1').textContent = `Total Income for ${months[parseInt(selectedMonth)-1]} ${selectedYear}`;
        document.getElementById('kpi-trend-2').textContent = `vs ${months[previousMonth-1]} ${previousYear}`;
        document.getElementById('kpi-trend-3').textContent = `of ${selectedYear} Revenue`;

        updateKpiForAi('3', `KPI Summary for ${months[parseInt(selectedMonth)-1]} ${selectedYear}:
            - Total Income: $${totalIncome.toLocaleString()} in ${selectedYear}, ${months[parseInt(selectedMonth)-1]}
            - Month-over-Month Change: ${momChange.toFixed(1)}% Comparison with ${months[previousMonth-1]} ${previousYear}
            - Revenue Contribution: ${contribution.toFixed(1)}% Contribution to ${selectedYear} Revenue
            `);
    }
}

function updateCharts(year = currentYear, month = currentMonth) {
    const selectedMonth = document.getElementById('D9-choose_month').value;
    const selectedYear = document.getElementById('D9-choose_year').value;

    // Line Chart Update
    if (selectedYear === '') {
        // All years view
        const { labels, datasets: [{ data }] } = generateRevenueChartData();
        drawLineChart(labels, data, "chart91", "Yearly Revenue Trends");
        updateKpiForAi('1', `This is the profit recorded for All time; years:profits, `);
        updateKpiForAi('2', `${data.map((value, index) => `${labels[index]}: $${value.toLocaleString()}`).join('\n')} `);
        updateKPIs();
        console.log(Object.values(kpi_for_ai).filter(Boolean).join('\n'));

    } else if (selectedMonth === 'all') {
        // Monthly view for selected year
        const { labels, datasets: [{ data }] } = generateRevenueChartData(parseInt(selectedYear));
        drawLineChart(labels, data, "chart91", `Monthly Revenue Trends for ${selectedYear}`);
        updateKpiForAi('1', `This is the profit recorded for each month in ${selectedYear}; month:profits, `);
        updateKpiForAi('2', `${data.map((value, index) => `${labels[index]}: $${value.toLocaleString()}`).join('\n')} `);
        updateKPIs();
        console.log(Object.values(kpi_for_ai).filter(Boolean).join('\n'));

    } else {
        // Daily view for selected month
        const { labels, datasets: [{ data }] } = generateRevenueChartData(parseInt(selectedYear), parseInt(selectedMonth));
        drawLineChart(labels, data, "chart91", `Daily Revenue for ${months[parseInt(selectedMonth)-1]} ${selectedYear}`);
        updateKpiForAi('1', `This is the profit recorded for each day in ${months[parseInt(selectedMonth)-1]}, ${selectedYear}; day:profits, `);
        updateKpiForAi('2', `${data.map((value, index) => `${labels[index]}: $${value.toLocaleString()}`).join('\n')} `);
        updateKPIs();
        console.log(Object.values(kpi_for_ai).filter(Boolean).join('\n'));
    }

    // Pie Chart Update
    let pieChartLabels, pieChartData;
    if (selectedYear === '') {
        // Distribution across years
        const { labels, datasets: [{ data }] } = generateRevenueChartData();
        pieChartLabels = labels;
        pieChartData = data;
    } else {
        // Distribution across months for selected year
        const { labels, datasets: [{ data }] } = generateRevenueChartData(parseInt(selectedYear));
        
        // Filter out months with zero revenue
        const nonZeroData = data.map((value, index) => ({ value, month: labels[index] }))
            .filter(item => item.value > 0);

        pieChartLabels = nonZeroData.map(item => item.month);
        pieChartData = nonZeroData.map(item => item.value);
    }

    drawPieChart(pieChartLabels, pieChartData, "chart92", `Profit distribution of ${globalSelectedYear || 'All time'}`, 'top');
    updateKPIs();
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

