import { generateUnitPerformanceData,generate_Barchart_dashboard_1_inYears } from '../js/processData.js';
import { drawHorizontalBarChart } from '../js/drawChart.js';
import { generateAiContent } from '../js/apiCaller.js';
import { getCurrentSection } from '../js/responsive.js';
// Add these global variables at the top
let globalSelectedYear = '';
let globalSelectedMonth = '';
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth() + 1;
const availableYears = generate_Barchart_dashboard_1_inYears()[0];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let bar = true;



// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx
let kpi_for_ai = {};
let aiAnalysisTimeout;
let Is_ai_on;

async function updateAIAnalysis() {
    const aiAnalysisElement = document.getElementById('D8-ai-analysis');
    if (!aiAnalysisElement) return;

    for (let retryCount = 0; retryCount < 3; retryCount++) {
        try {
            aiAnalysisElement.innerHTML = '<div class= "ai-loading"> </div>';

            // Format data
            const chartDataString = Object.values(kpi_for_ai).filter(Boolean).join('\n');
            const combinedPrompt = `Based on the following booking data:\n${chartDataString}\n
            Please provide analysis in three sections:
            1. Booking Frequency & Revenue Correlation Analysis/Report
            2. Stay Duration vs. Revenue Efficiency Analysis/Report
            3. Forecasting & Recommendations for Future Pricing & Promotion Strategies`;

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
        const isMonthlyStats = getCurrentSection() === 'Most Booked Units';
        
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
    if (!Is_ai_on && getCurrentSection() === 'Most Booked Units') {
        Is_ai_on = true;
        await updateAIAnalysis();
    }
}

monitorSection();
// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx


// Function to update revenue KPIs
function updateRevenueKPIs(sortedByRevenue, periodLabel = '') {
    // Get only top 10 units
    const top10Units = sortedByRevenue.slice(0, 10);
    
    // Update KPIs for all possible positions (1-10)
    let kpiDataForAI = [];
    for (let i = 0; i < 10; i++) {
        const element = document.getElementById(`top${i + 1}`);
        if (element) {
            if (i < top10Units.length) {
                const unit = top10Units[i];
                element.innerHTML = `
                    <div class="unit-kpi" style="padding: 10px; border-radius: 8px; background-color: #f8f9fa; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="color: #0066cc; font-size: 1em; margin-bottom: 5px;"><b>Top ${i + 1}</b></div>
                        <div style="color: #333; font-size: 1.1em; margin-bottom: 8px;"><strong>${unit.label}</strong></div>
                        <div style="color: #28a745; margin-bottom: 4px;">Revenue: <span style="font-weight: bold;">$${unit.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                        <div style="color: #6c757d; margin-bottom: 4px;">Stay Duration: <span style="font-weight: bold;">${unit.days} days</span></div>
                        <div style="color: #17a2b8; margin-bottom: 4px;">Total Bookings: <span style="font-weight: bold;">${unit.bookings} times</span></div>
                        ${periodLabel ? `<div style="color: #6c757d; font-size: 0.7em; margin-top: 5px;"><small>${periodLabel}</small></div>` : ''}
                    </div>
                `;
                // Collect data for AI analysis
                kpiDataForAI.push(`Unit ${unit.label}: Revenue $${unit.revenue.toFixed(2)}, Stay Duration ${unit.days} days, Total Bookings ${unit.bookings} times`);
            } else {
                element.innerHTML = `
                    <div class="unit-kpi" style="padding: 10px; border-radius: 8px; background-color: #f8f9fa; margin-bottom: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="color: #6c757d; text-align: center; font-style: italic;">No data available</div>
                    </div>
                `;
            }
        }
    }
    // Update AI analysis with detailed KPI data
    updateKpiForAi("2", `Detailed performance metrics for top units: \n${kpiDataForAI.join('\n')}`);
}

// Function to update the chart
function updatePerformanceChart(top10Units) {
    const labels = top10Units.map(unit => unit.label);
    const data = top10Units.map(unit => unit.bookings);
    drawHorizontalBarChart(labels, data, 'chart81');

    updateKpiForAi("1", `This is the top ten Most Frequently booked units within ${globalSelectedYear ? globalSelectedYear : 'all time'}${globalSelectedMonth ? `, ${months[globalSelectedMonth - 1]}` : ''}. The ID of the Room Units- ${labels} , the number of times the Unites being booked- ${data}`);
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
        .sort((a, b) => {
            // First, compare by number of bookings
            if (b.bookings !== a.bookings) {
                return b.bookings - a.bookings;
            }
            // If bookings are equal, compare by revenue
            return b.revenue - a.revenue;
        })
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
        
    }
}

// Initialize dashboard
handleDropdown();
populateMonthDropdown();
updateDashboard(currentYear, currentMonth); // Initial load with current date

