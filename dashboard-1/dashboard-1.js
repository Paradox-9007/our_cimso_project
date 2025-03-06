import { generate_Barchart_dashboard_1_inMonth, generate_Barchart_dashboard_1_inYear, generate_Barchart_dashboard_1_inYears,count_total_bookings} from '../js/processData.js';
import { drawBarChart, drawPieChart } from '../js/drawChart.js';
import { generateAiContent } from '../js/apiCaller.js';
import { getCurrentSection } from '../js/responsive.js';


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
    const aiAnalysisElement = document.getElementById('D1-ai-analysis');
    if (!aiAnalysisElement) return;

    for (let retryCount = 0; retryCount < 3; retryCount++) {
        try {
            aiAnalysisElement.innerHTML = 'Generating analysis...';

            // Format data
            const chartDataString = Object.values(kpi_for_ai).filter(Boolean).join('\n');
            const combinedPrompt = `Based on the following booking data:\n${chartDataString}\n
            Please provide analysis in three sections:
            1. Analyze booking trends
            2. Compare booking growth rates between periods
            3. Identify any unusual booking patterns in the data`;

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
        const isMonthlyStats = getCurrentSection() === 'Monthly Arrival Stats';
        
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
    if (!Is_ai_on && getCurrentSection() === 'Monthly Arrival Stats') {
        Is_ai_on = true;
        await updateAIAnalysis();
    }
}

monitorSection();
// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx


function updateChartForYears() {
    const [labels, data] = generate_Barchart_dashboard_1_inYears();
    drawBarChart(labels, data, "chart1", `Number of Arrivals across All years`);
    updateKpiForAi('1', ` Here are the lables and datasets for barchart for all time: labels- ${labels}, dataset- ${String(data)}`);
}

function updateChartForYear(year) {
    const [labels, data] = generate_Barchart_dashboard_1_inYear(parseInt(year));
    drawBarChart(labels, data, "chart1", `Number of Arrivals in ${year}`);
    updateKpiForAi('1', ` Here are the lables and datasets for barchart for ${year} labels- ${labels}, dataset- ${String(data)}`);
}

function updateChartForMonth(year, month) {
    const daysInMonth = getDaysInMonth(year, month);
    console.log(`Updating chart for ${year}-${month}, Total Days: ${daysInMonth}`);

    // Ensure correct 0-based month index
    const [labels, data] = generate_Barchart_dashboard_1_inMonth(parseInt(month), parseInt(year));
    drawBarChart(labels, data, "chart1", `Number of Arrivals in ${months[month-1]}, ${year}`);
    updateKpiForAi('1', ` Here are the lables and datasets for barchart for ${year}, ${months[month-1]}: labels- ${labels}, dataset- ${String(data)}`);
}

function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate(); // Month is 1-based, so this works correctly
}


function handleDropdown() {
    const chooseYear = document.getElementById("choose_year");
    const chooseMonth = document.getElementById("choose_month");

    if (!chooseYear || !chooseMonth) {
        console.error("Dropdown elements not found.");
        return;
    }

    // Get years from Dashboard function
    

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

        updateChartBasedOnSelection();  // Update chart based on new selections
        const totalBookings = update_kpi_total_number_of_bookings(globalSelectedYear, globalSelectedMonth);
        console.log("Total Bookings in" + totalBookings + "hhh" + globalSelectedYear);
    });

    // Handle month selection change
    chooseMonth.addEventListener("change", function () {
        globalSelectedMonth = this.value;
        if (this.value === "") {
            globalSelectedMonth = '';  // Reset to empty string for "All Months"
        }

        updateChartBasedOnSelection();  // Update chart based on new selections
        const totalBookings = update_kpi_total_number_of_bookings(globalSelectedYear, globalSelectedMonth);
        console.log("Total Bookings in" + totalBookings + "sgfsd" + globalSelectedYear);
    });
}

function populateMonthDropdown() {
    
    const chooseMonth = document.getElementById("choose_month");

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
        
        const totalBookings = update_kpi_total_number_of_bookings(globalSelectedYear, globalSelectedMonth);
        console.log("Total Bookings in" + totalBookings + "sdfsdfd" + globalSelectedYear);
    }

}

function updateChartBasedOnSelection() {
    if (globalSelectedYear === '' && globalSelectedMonth === '') {
        updateChartForYears();  // Show data for all years if neither year nor month is selected
    } else if (globalSelectedYear !== '' && globalSelectedMonth === '') {
        updateChartForYear(globalSelectedYear);  // Show data for selected year
    } else if (globalSelectedYear !== '' && globalSelectedMonth !== '') {
        updateChartForMonth(globalSelectedYear, globalSelectedMonth);  // Show data for selected year and month
    }
}



function update_kpi_total_number_of_bookings(year, month = '') {
    const kpi_totalArrivalElement = document.getElementById("total-arrival-this-month");
    let kpi_context = 'There seem to be no data to process :(';
    if (year && month) {
        kpi_context = `Total Arrivals of ${months[month-1]}, ${year} : ${  count_total_bookings(parseInt(year), parseInt(month)) }`; // Get total bookings for the selected month in a year
    } else if (year) {
        kpi_context = `Total Arrivals of ${year} : ${  count_total_bookings(parseInt(year)) }`; // Get total bookings for the selected year
    } else {
        // If no year is selected, calculate the total bookings across all available years
        const totalBookingsForAllYears = availableYears.reduce((total, year) => {
            return total + count_total_bookings(parseInt(year)); // Sum the bookings for each year in availableYears
        }, 0);
        kpi_context = `Total Arrivals of All time: ${  totalBookingsForAllYears }`;
    }
    kpi_totalArrivalElement.textContent = kpi_context;
    update_kpi_total_number_of_bookings_compared_to_last_period(year,month);
    update_kpi_booking_volume_difference(year,month);
    update_kpi_booking_percentage_of_total(year,month);
    updateKpiForAi('2', ` ${kpi_context}`);
}

function update_kpi_total_number_of_bookings_compared_to_last_period(year, month = '') {
    const kpi_growthRateElement = document.getElementById("total-growth-rate");
    let kpi_context = 'There seem to be no data to process :(';
    let currentTotal, previousTotal, growthRate;
    
    if (year && month) {
        // Monthly comparison
        currentTotal = count_total_bookings(parseInt(year), parseInt(month));
        
        // Calculate previous month (handle January case by going to previous year December)
        let prevYear = parseInt(year);
        let prevMonth = parseInt(month) - 1;
        
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        }
        
        previousTotal = count_total_bookings(prevYear, prevMonth);
        
        if (previousTotal > 0) {
            growthRate = ((currentTotal - previousTotal) / previousTotal) * 100;
            kpi_context = `Growth compared to ${months[prevMonth-1]}, ${prevYear}: ${growthRate.toFixed(2)}%`;
            updateKpiForAi('3', `${months[month-1]}'s ${kpi_context}`);
        } else {
            kpi_context = `No comparable data for ${months[prevMonth-1]}, ${prevYear}`;
        }
        
    } else if (year) {
        // Yearly comparison
        currentTotal = count_total_bookings(parseInt(year));
        previousTotal = count_total_bookings(parseInt(year) - 1);
        
        if (previousTotal > 0) {
            growthRate = ((currentTotal - previousTotal) / previousTotal) * 100;
            kpi_context = `Growth compared to ${parseInt(year) - 1}: ${growthRate.toFixed(2)}%`;
            updateKpiForAi('3', `${parseInt(year)}'s ${kpi_context}`);
        } else {
            kpi_context = `No comparable data for ${parseInt(year) - 1}`;
        }
        
    } else {
        // All time - not really applicable for growth rate
        kpi_context = "Growth rate requires specific time period selection";
    }
    
    kpi_growthRateElement.textContent = kpi_context;
}

function update_kpi_booking_volume_difference(year, month = '') {
    const kpi_volumeDifferenceElement = document.getElementById("booking-volume-difference");
    let kpi_context = 'There seem to be no data to process :(';
    let currentTotal, previousTotal, difference;
    
    if (year && month) {
        // Monthly comparison
        currentTotal = count_total_bookings(parseInt(year), parseInt(month));
        
        // Calculate previous month (handle January case by going to previous year December)
        let prevYear = parseInt(year);
        let prevMonth = parseInt(month) - 1;
        
        if (prevMonth === 0) {
            prevMonth = 12;
            prevYear -= 1;
        }
        
        previousTotal = count_total_bookings(prevYear, prevMonth);
        
        if (previousTotal !== undefined) {
            difference = currentTotal - previousTotal;
            const changeDirection = difference >= 0 ? "increase" : "decrease";
            kpi_context = `${Math.abs(difference)} booking ${changeDirection} from ${months[prevMonth-1]}, ${prevYear}`;
        } else {
            kpi_context = `No comparable data for ${months[prevMonth-1]}, ${prevYear}`;
        }
        
    } else if (year) {
        // Yearly comparison
        currentTotal = count_total_bookings(parseInt(year));
        previousTotal = count_total_bookings(parseInt(year) - 1);
        
        if (previousTotal !== undefined) {
            difference = currentTotal - previousTotal;
            const changeDirection = difference >= 0 ? "increase" : "decrease";
            kpi_context = `${Math.abs(difference)} booking ${changeDirection} from ${parseInt(year) - 1}`;
        } else {
            kpi_context = `No comparable data for ${parseInt(year) - 1}`;
        }
        
    } else {
        // All time - not applicable for volume difference
        kpi_context = "Volume difference requires specific time period selection";
    }
    
    kpi_volumeDifferenceElement.textContent = kpi_context;
    updateKpiForAi('4', `In ${year}${month ? `, ${months[month-1]}` : ''}, ${kpi_context}`);
}

function update_kpi_booking_percentage_of_total(year, month = '') {
    const kpi_percentageElement = document.getElementById("booking-percentage");
    let kpi_context = 'There seem to be no data to process :(';
    let periodTotal, overallTotal, percentage;
    
    if (year && month) {
        // Monthly percentage of yearly total
        periodTotal = count_total_bookings(parseInt(year), parseInt(month));
        overallTotal = count_total_bookings(parseInt(year)); // Total for the year
        
        if (overallTotal > 0) {
            percentage = (periodTotal / overallTotal) * 100;
            kpi_context = `${months[month-1]} represents ${percentage.toFixed(2)}% of all ${year} bookings`;
        } else {
            kpi_context = `No booking data available for ${year}`;
        }
        
    } else if (year) {
        // Yearly percentage of all-time total
        periodTotal = count_total_bookings(parseInt(year));
        
        // Calculate total bookings across all available years
        overallTotal = availableYears.reduce((total, yr) => {
            return total + count_total_bookings(parseInt(yr));
        }, 0);
        
        if (overallTotal > 0) {
            percentage = (periodTotal / overallTotal) * 100;
            kpi_context = `${year} represents ${percentage.toFixed(2)}% of all-time bookings`;
        } else {
            kpi_context = `No booking data available`;
        }
        
    } else {
        // No specific period selected
        kpi_context = "Please select a specific period for percentage calculation";
    }
    
    kpi_percentageElement.textContent = kpi_context;
    update_monthly_distribution_pie_chart(year);
    updateKpiForAi('5', `${kpi_context}`);
}



function update_monthly_distribution_pie_chart(year) {
    const chartId = "chart2";
    let labels = [];
    let data = [];
    
    if (!year) {
        // No year selected, compare all available years
        availableYears.forEach(yr => {
            const yearTotal = count_total_bookings(parseInt(yr));
            if (yearTotal > 0) {
                labels.push(yr.toString());
                data.push(yearTotal);
            }
        });
        
        if (labels.length > 0) {
            drawPieChart(labels, data, chartId, `Percentage of Booking Arrivals across All years `, 'top');
        } else {
            drawPieChart(["No Data Available"], [1], chartId);
        }
        return;
    }
    
    // Populate data for all months in the selected year
    for (let month = 1; month <= 12; month++) {
        const monthlyTotal = count_total_bookings(parseInt(year), month);
        
        // Only add months that have data
        if (monthlyTotal > 0) {
            labels.push(months[month-1]); // month-1 because array is 0-indexed
            data.push(monthlyTotal);
        }
    }
    
    if (data.length > 0) {
        drawPieChart(labels, data, chartId,  `Percentage of Booking Arrivals with in ${year} `, 'top');
    } else {
        // No data for any month in this year
        drawPieChart([`No Data for ${year}`], [1], chartId);
    }
}


handleDropdown();
populateMonthDropdown();
// Set the chart for the current month and year by default
updateChartForMonth(currentYear, currentMonth);
