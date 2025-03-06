import { generateMemberVsGeneralData, generate_Barchart_dashboard_1_inYears, generateProfitComparisonData} from '../js/processData.js';
import { drawGroupedBarChart, drawMultiLineChart } from '../js/drawChart.js';
import { generateAiContent } from '../js/apiCaller.js';
import { getCurrentSection } from '../js/responsive.js';

let globalSelectedYear = ''; 
let globalSelectedMonth = ''; 

let currentYear = new Date().getFullYear(); 
let currentMonth = new Date().getMonth() + 1;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const availableYears = generate_Barchart_dashboard_1_inYears()[0];
let bar = true;
const Member_Guest_Color = ['#B3C100', '#CED2CC'];

// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx
let kpi_for_ai = {};
let aiAnalysisTimeout;
let Is_ai_on;

async function updateAIAnalysis() {
    const aiAnalysisElement = document.getElementById('D2-ai-analysis');
    const revenueElement = document.getElementById('D2-revenue-analysis');
    if (!aiAnalysisElement) return;

    for (let retryCount = 0; retryCount < 3; retryCount++) {
        try {
            aiAnalysisElement.innerHTML = '<div class= "ai-loading"> </div>';
            revenueElement.innerHTML = '';

            // Format data
            const chartDataString = Object.values(kpi_for_ai).filter(Boolean).join('\n');
            const combinedPrompt = `Based on the following booking data:\n${chartDataString}\n
            Please provide analysis in three sections:
            1. Booking Trends : Identify peak/low booking days, patterns in member vs. general guest bookings.
            2. Revenue Analysis : Compare revenue per booking, profitability differences, and the impact of increasing member bookings.
            3. Growth & Unusual Patterns : Detect booking spikes/drops, trends vs. past months, and anomalies in booking behavior.
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
                .replace(/(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?\s*,?\s*\d{4}/gi, '<b>$&</b>')
                .replace(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?\b/gi, '<b>$&</b>');
                
            // Split analysis into sections
            const sections = formattedAnalysis.split('2. ');
            const firstSection = sections[0];
            const secondSection = '2. ' + sections[1];
            aiAnalysisElement.innerHTML = `<div id="ai-text"> ${firstSection} </div>`;
            if (revenueElement) {
                revenueElement.innerHTML = `<b><div id="ai-text"> ${secondSection} </div>`;
            }
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
        const isMonthlyStats = getCurrentSection() === 'Member & General Arrivals';
        
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
    if (!Is_ai_on && getCurrentSection() === 'Member & General Arrivals') {
        Is_ai_on = true;
        await updateAIAnalysis();
    }
}

monitorSection();
// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx
//     updateKpiForAi('1', ` Here are the lables and datasets for barchart for all time: labels- ${labels}, dataset- ${String(data)}`);

function updateChartForMonth(year, month) {
    const { labels, datasets } = generateMemberVsGeneralData(parseInt(year), parseInt(month));
    datasets[0].backgroundColor = Member_Guest_Color[0];  // Member color
    datasets[1].backgroundColor = Member_Guest_Color[1];  // Guest color
    drawGroupedBarChart(labels, datasets, 'chart21', `Number of Bookings for ${months[month-1]}, ${year}`);
    updateKPIs(datasets);
    updateProfitChart(parseInt(year), parseInt(month));
    updateKpiForAi('1', ` Here are the lables and datasets for group bar chart ${year},${months[month-1]}: days- ${labels}, dataset for ${datasets[0].label}- ${datasets[0].data}, dataset for ${datasets[1].label}- ${datasets[1].data} `);
    
    const totalGeneral = datasets[1].data.reduce((sum, current) => sum + current, 0);
    const totalMembers = datasets[0].data.reduce((sum, current) => sum + current, 0);
    const total = totalMembers + totalGeneral;
    const memberRatio = ((totalMembers / total) * 100).toFixed(2);
    updateKpiForAi('3', ` For the ${year},${months[month-1]}: Total General Guests - ${totalGeneral}, Total Members - ${totalMembers}, Member Ratio - ${memberRatio}`);
}

function updateChartForYear(year) {
    const { labels, datasets } = generateMemberVsGeneralData(parseInt(year));
    datasets[0].backgroundColor = Member_Guest_Color[0];  // Member color
    datasets[1].backgroundColor = Member_Guest_Color[1];  // Guest color
    drawGroupedBarChart(labels, datasets, 'chart21', `Number of Bookings for ${year}`);
    updateKPIs(datasets);
    updateProfitChart(parseInt(year));
    updateKpiForAi('1', ` Here are the lables and datasets for group bar chart ${year}: months- ${labels}, dataset for ${datasets[0].label}- ${datasets[0].data}, dataset for ${datasets[1].label}- ${datasets[1].data} `);

    const totalGeneral = datasets[1].data.reduce((sum, current) => sum + current, 0);
    const totalMembers = datasets[0].data.reduce((sum, current) => sum + current, 0);
    const total = totalMembers + totalGeneral;
    const memberRatio = ((totalMembers / total) * 100).toFixed(2);
    updateKpiForAi('3', ` For the ${year}: Total General Guests - ${totalGeneral}, Total Members - ${totalMembers}, Member Ratio - ${memberRatio}`);
}

function updateChartForYears() {
    const { labels, datasets } = generateMemberVsGeneralData();  // No parameters means get all years
    datasets[0].backgroundColor = Member_Guest_Color[0];  // Member color
    datasets[1].backgroundColor = Member_Guest_Color[1];  // Guest color
    drawGroupedBarChart(labels, datasets, 'chart21' , `Number of Bookings for All years`);
    updateKPIs(datasets);
    updateProfitChart();
    updateKpiForAi('1', ` Here are the lables and datasets for group bar chart for all years: years- ${labels}, dataset for ${datasets[0].label}- ${datasets[0].data}, dataset for ${datasets[1].label}- ${datasets[1].data} `);

    const totalGeneral = datasets[1].data.reduce((sum, current) => sum + current, 0);
    const totalMembers = datasets[0].data.reduce((sum, current) => sum + current, 0);
    const total = totalMembers + totalGeneral;
    const memberRatio = ((totalMembers / total) * 100).toFixed(2);
    updateKpiForAi('3', ` For all years: Total General Guests - ${totalGeneral}, Total Members - ${totalMembers}, Member Ratio - ${memberRatio}`);
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
    datasets[0].borderColor = Member_Guest_Color[0];  // Member color
    datasets[1].borderColor = Member_Guest_Color[1];  // Guest color
    drawMultiLineChart('chart22', labels, datasets[0], datasets[1], title);
    updateKpiForAi('1', ` Here are the lables and datasets for Multiline chart which compare the profits; time labels- ${String(labels)}, dataset for ${String(datasets[0].label)}- ${String(datasets[0].data)}, dataset for ${String(datasets[1].label)}- ${String(datasets[1].data)} `);
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
    updateKpiForAi('4', `Total Member Profits - $${totalMemberProfit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}, Total General Guest Profits - $${totalGeneralProfit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}, Revenue Ratio - ${((totalMemberProfit / totalProfit) * 100).toFixed(2)}% of the total revenue ($${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })})`);
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