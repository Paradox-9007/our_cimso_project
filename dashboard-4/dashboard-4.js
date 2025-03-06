import { getMonthlyOccupancyAndADR, generate_Barchart_dashboard_1_inYears, getTotalRooms } from "../js/processData.js";
import { drawComboChart } from "../js/drawChart.js";
import { generateAiContent } from '../js/apiCaller.js';
import { getCurrentSection } from '../js/responsive.js';
// Get first and last day of current month
const today = new Date();
const currentMonth = today.getMonth() + 1;
const currentYear = today.getFullYear();
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const availableYears = generate_Barchart_dashboard_1_inYears()[0];

// Initialize global variables
let globalSelectedYear = currentYear;
let globalSelectedMonth = currentMonth;


// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx
let kpi_for_ai = {};
let aiAnalysisTimeout;
let Is_ai_on;

async function updateAIAnalysis() {
    const aiAnalysisElement = document.getElementById('D4-ai-analysis');
    if (!aiAnalysisElement) return;

    for (let retryCount = 0; retryCount < 3; retryCount++) {
        try {
            aiAnalysisElement.innerHTML = '<div class= "ai-loading"> </div>';

            // Format data
            const chartDataString = Object.values(kpi_for_ai).filter(Boolean).join('\n');
            const combinedPrompt = `Based on the following booking data:\n${chartDataString}\n
            Please provide analysis in three sections:
            1. Occupancy & Revenue Trend Analysis
            2. Pricing Strategy Optimization
            3. Forecasting & Demand Prediction
    `;

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
        const isMonthlyStats = getCurrentSection() === "Monthly Occupancy & ADR";
        
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
    if (!Is_ai_on && getCurrentSection() === 'Monthly Occupancy & ADR') {
        Is_ai_on = true;
        await updateAIAnalysis();
    }
}

monitorSection();
// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx
//     updateKpiForAi('1', ` Here are the lables and datasets for barchart for all time: labels- ${labels}, dataset- ${String(data)}`);




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

    updateKpiForAi('1', `For average of ${months[month-1]} ${year},  Average Occupancy Rate : ${Math.round(avgOccupancy)}% , Average Daily Rate : $${Math.round(avgADR)}`);
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

    updateKpiForAi('3', ` Today's Occupancy Rate: ${Math.round(todayOccupancy)}%, Today's Revenue: $${Math.round(todayRevenue).toLocaleString()}, Today's ADR: $${Math.round(todayADR).toLocaleString()} `);
}

function updateChartBasedOnSelection() {
    const newChartData = getMonthlyOccupancyAndADR(globalSelectedMonth, globalSelectedYear);
    const dayNumbers = newChartData.labels.map(dateStr => parseInt(dateStr.split(' ')[2]));
    drawComboChart("chart41", dayNumbers, newChartData.occupancyData, newChartData.adrData);
    updateKPIs(globalSelectedMonth, globalSelectedYear);

    updateKpiForAi('2', ` This is the ComboChart data for ${globalSelectedYear}, ${months[globalSelectedMonth - 1]} (Line Chart + Bar Chart): days- ${String(dayNumbers)}, 
    occupancyData- ${String(newChartData.occupancyData.label)}, ${String(newChartData.occupancyData.data)},
    adrData- ${String(newChartData.adrData.label)}, ${String(newChartData.adrData.data)}, `);
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

const dayNumbers = chartData.labels.map(dateStr => parseInt(dateStr.split(' ')[2]));
// Initial chart draw
drawComboChart(
    "chart41",
    dayNumbers,
    chartData.occupancyData,
    chartData.adrData
);


// Initialize dropdowns and KPIs
handleDropdown();
updateKPIs(currentMonth, currentYear);
updateThirdRowKPIs(currentMonth, currentYear);

updateKpiForAi('2', ` This is the ComboChart data for ${currentYear}, ${months[currentMonth-1]} (Line Chart + Bar Chart): days- ${String(dayNumbers)}, 
    occupancyData- ${String(chartData.occupancyData.label)}, ${String(chartData.occupancyData.data)},
    adrData- ${String(chartData.adrData.label)}, ${String(chartData.adrData.data)}, `);
