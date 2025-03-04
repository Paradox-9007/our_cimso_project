// Import required modules
import { generateHourlyBookingData, getMonthlyBookingCounts } from '../js/processData.js';
import { drawGroupedBarChart, drawDonutChart, drawPieChart } from '../js/drawChart.js';
import { generateAiContent } from '../js/apiCaller.js';
import { getCurrentSection } from '../js/responsive.js';

function getCurrentDate() {
    const today = new Date();
    return {
        day: today.getDate(),
        month: today.getMonth(),
        year: today.getFullYear()
    };
}
const currentDate = getCurrentDate();
const datata = generateHourlyBookingData(getCurrentDate());

// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx
let kpi_for_ai = {};
let aiAnalysisTimeout;
let Is_ai_on;

async function updateAIAnalysis() {
    const aiAnalysisElement = document.getElementById('D3-ai-analysis');
    if (!aiAnalysisElement) return;

    for (let retryCount = 0; retryCount < 3; retryCount++) {
        try {
            aiAnalysisElement.innerHTML = 'Generating analysis...';

            // Format data
            const chartDataString = Object.values(kpi_for_ai).filter(Boolean).join('\n');
            const combinedPrompt = `Based on the following booking data:\n${chartDataString}\n
            Please provide analysis in three sections (No more then 250 words):
            1. Booking Arrival vs. Departure Balance and Trend Insights
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
        const isMonthlyStats = getCurrentSection() === "Today's Arrivals/Departures";
        
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
    if (!Is_ai_on && getCurrentSection() === "Today's Arrivals/Departures") {
        Is_ai_on = true;
        await updateAIAnalysis();
    }
}

monitorSection();
// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx
//     updateKpiForAi('1', ` Here are the lables and datasets for barchart for all time: labels- ${labels}, dataset- ${String(data)}`);

updateKpiForAi('1', ` Here are the labels and datasets for hourly bookings on today, ${currentDate.year}-${currentDate.month + 1}-${currentDate.day}: 
    hours- ${datata.labels}, 
    dataset for ${datata.datasets[0].label}- ${datata.datasets[0].data}, 
    dataset for ${datata.datasets[1].label}- ${datata.datasets[1].data}`);
drawGroupedBarChart(datata.labels, datata.datasets, 'chart31');

const totalArrival =  generateHourlyBookingData(getCurrentDate()).datasets[0].data.reduce((sum, value) => sum + value, 0);
const totalDeparture =  generateHourlyBookingData(getCurrentDate()).datasets[1].data.reduce((sum, value) => sum + value, 0);
const donutData = {
    labels: ['Total Arrivals', 'Total Departures'],
    data: [totalArrival, totalDeparture],
    backgroundColor: ['rgb(0, 255, 255)', 'rgb(255, 99, 132)'] // Matching colors with bar chart
};

total_arrival_today.innerHTML = `Total arrival today: ${totalArrival}`;
total_departure_today.innerHTML = `Total departure today: ${totalDeparture}`;

drawDonutChart(donutData.labels, donutData.data, 'chart32');



const totalArrivalCurrentMonth = getMonthlyBookingCounts(getCurrentDate().month + 1, getCurrentDate().year).arrivals;
const pieChartData_Arrival = {
    labels: ['Today\'s Arrivals', 'Other Days\' Arrivals of current month'],
    data: [totalArrival, totalArrivalCurrentMonth - totalArrival],
    backgroundColor: ['rgb(0, 255, 255)', 'rgb(200, 200, 200)'] // Cyan for today, gray for other days
};

drawPieChart(pieChartData_Arrival.labels, pieChartData_Arrival.data, 'chart33');

const totalDepartureCurrentMonth = getMonthlyBookingCounts(getCurrentDate().month + 1, getCurrentDate().year).arrivals;
const pieChartData_Departure = {
    labels: ['Today\'s Arrivals', 'Other Days\' Departure of current month'],
    data: [totalDeparture, totalDepartureCurrentMonth - totalDeparture],
    backgroundColor: ['rgb(0, 255, 255)', 'rgb(200, 200, 200)'] // Cyan for today, gray for other days
};

drawPieChart(pieChartData_Departure.labels, pieChartData_Departure.data, 'chart34');

const arrivalPercentage = Math.round((totalArrival / totalArrivalCurrentMonth) * 100);
const departurePercentage = Math.round((totalDeparture / totalDepartureCurrentMonth) * 100);

arrival_percent.innerHTML = `Today's arrivals are ${arrivalPercentage}% of this month's total arrivals`;
departure_percent.innerHTML = `Today's departures are ${departurePercentage}% of this month's total departures`;

updateKpiForAi('2', ` The number of today's total arrivals are ${totalArrival} and today's departures are ${totalDeparture}`);
updateKpiForAi('3', ` Today's arrivals are ${arrivalPercentage}% of this month's total arrivals and today's departures are ${departurePercentage}% of this month's total departures`);
