import { drawPieChart, drawStackedBarChart } from "../js/drawChart.js";
import { generateBookingStatusChartData, generate_Barchart_dashboard_1_inYears } from "../js/processData.js";
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

// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx

let kpi_for_ai = {};
let aiAnalysisTimeout;
let Is_ai_on;

async function updateAIAnalysis() {
    const aiAnalysisElement = document.getElementById('D7-ai-analysis');
    if (!aiAnalysisElement) return;

    for (let retryCount = 0; retryCount < 3; retryCount++) {
        try {
            aiAnalysisElement.innerHTML = 'Generating analysis...';

            // Format data
            const chartDataString = Object.values(kpi_for_ai).filter(Boolean).join('\n');
            const combinedPrompt = `Based on the following booking data:\n${chartDataString}\n
            Please provide analysis in three sections:
            1. Status Distribution & Trend Analysis
            2. Booking Behavior Insights & Peak Periods
            3. Cancellation Rate & Forecasting`;

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
        const isMonthlyStats = getCurrentSection() === 'Monthly Cancellation Stats';
        
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
    if (!Is_ai_on && getCurrentSection() === 'Monthly Cancellation Stats') {
        Is_ai_on = true;
        await updateAIAnalysis();
    }
}

monitorSection();
// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx



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

    updateKpiForAi("2" , `Total number of each status: ${pieLabels.map((label, index) => `${label}:${pieChartData.data[index]}`).join(', ')}`);

    drawStackedBarChart(
        barChartLabels,
        barChartData.datasets,
        'chart72'
    );

    updateKpiForAi("1" , `Stacked Bar Chart Data for ${periodLabel}: Time periods- ${barChartLabels.join(', ')}, ${barChartData.datasets.map(dataset => `${dataset.label}: ${dataset.data.join(', ')}`).join('; ')}`);
}

// Initialize the dashboard
handleDropdown();
populateMonthDropdown();
// Set the charts for the current month and year by default
updateCharts(currentYear, currentMonth);
