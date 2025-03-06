import { getBookingsByAgeGroup, generate_Barchart_dashboard_1_inYears } from "../js/processData.js";
import { drawMultiLineChart, drawDonutChart, drawPieChart } from "../js/drawChart.js";
import { generateAiContent } from '../js/apiCaller.js';
import { getCurrentSection } from '../js/responsive.js';
// Initialize variables
const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();
const availableYears = generate_Barchart_dashboard_1_inYears()[0];
let globalSelectedYear = currentYear;
let globalSelectedMonth = currentMonth;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const full_months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let bar = true;

// Age group labels
const ageGroupLabels = ["Children (1-17)", "Adult (18-35)", "Middle Age (36-64)", "Elderly (65+)"];
const ageGroupColors = ['#4CB5F5','#6AB187','#DBAE58','#AC3E31']



// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx
let kpi_for_ai = {};
let aiAnalysisTimeout;
let Is_ai_on;

async function updateAIAnalysis() {
    const aiAnalysisElement = document.getElementById('D6-ai-analysis');
    const aiAnalysisElement2 = document.getElementById('D6-ai-analysis-2');
    if (!aiAnalysisElement || !aiAnalysisElement2) return;

    for (let retryCount = 0; retryCount < 3; retryCount++) {
        try {
            aiAnalysisElement.innerHTML = 'Generating analysis...';
            aiAnalysisElement2.innerHTML = 'Generating analysis...';

            // Format data
            const chartDataString = Object.values(kpi_for_ai).filter(Boolean).join('\n');
            const combinedPrompt = `Based on the following booking data:\n${chartDataString}\n
            Please provide analysis in three sections:
            1. Age Group Distribution Analysis
            2. Profit Contribution and Trends
            3. Correlation Between Arrival & Revenue
            write %n% at the end of number two and at the start of number three.
            Each analysis should have at least words count of 400`;

            // API call with timeout
            const analysis = await Promise.race([
                generateAiContent(combinedPrompt),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), 30000))
            ]);

            // Format the entire analysis first
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
            
            // Split the formatted analysis into two parts
            const [firstPart, secondPart] = formattedAnalysis.split('%n%');
            
            aiAnalysisElement.innerHTML = `<div id="ai-text"> ${firstPart} </div>`;
            aiAnalysisElement2.innerHTML = `<div id="ai-text"> ${secondPart} </div>`;
            return;
        } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed:`, error);
            
            if (retryCount === 2) {
                aiAnalysisElement.innerHTML = 'Unable to generate AI analysis. Please try again later.';
                aiAnalysisElement2.innerHTML = 'Unable to generate AI analysis. Please try again later.';
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
        const isMonthlyStats = getCurrentSection() === 'Arrival Age Groups';
        
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
    if (!Is_ai_on && getCurrentSection() === 'Arrival Age Groups') {
        Is_ai_on = true;
        await updateAIAnalysis();
    }
}

monitorSection();
// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx




function calculateRevenueAndProfit(bookings) {
    const result = {
        adult: { revenue: 0, profit: 0 },
        middleAge: { revenue: 0, profit: 0 },
        elderly: { revenue: 0, profit: 0 }
    };

    Object.entries(bookings).forEach(([group, groupBookings]) => {
        const totalRevenue = groupBookings.reduce((sum, booking) => {
            return sum + (booking.totalCharge || 0);
        }, 0);

        switch(group) {
            case "Adult (18-35)":
                result.adult.revenue = totalRevenue;
                result.adult.profit = totalRevenue * 0.3;
                break;
            case "Middle Age (36-64)":
                result.middleAge.revenue = totalRevenue;
                result.middleAge.profit = totalRevenue * 0.3;
                break;
            case "Elderly (65+)":
                result.elderly.revenue = totalRevenue;
                result.elderly.profit = totalRevenue * 0.3;
                break;
        }
    });

    return result;
}

// Function to calculate contribution percentages
function calculateContributionPercentages(data) {
    const totalBookings = data.adultCount + data.middleAgeCount + data.elderlyCount;
    return {
        adult: ((data.adultCount / totalBookings) * 100).toFixed(1),
        middleAge: ((data.middleAgeCount / totalBookings) * 100).toFixed(1),
        elderly: ((data.elderlyCount / totalBookings) * 100).toFixed(1)
    };
}

// Function to update charts and KPIs
function updateChartsAndKPIs() {
    const ageGroupData = getBookingsByAgeGroup(
        globalSelectedYear || null,
        globalSelectedMonth || null
    );

    // Update donut chart with booking counts
    const bookingCounts = {
        labels: ageGroupLabels,
        data: [
            ageGroupData.summary.childrenCount,
            ageGroupData.summary.adultCount,
            ageGroupData.summary.middleAgeCount,
            ageGroupData.summary.elderlyCount
        ],
        backgroundColor: ageGroupColors
    };
    drawDonutChart(bookingCounts.labels, bookingCounts, "chart61");
    updateKpiForAi("1" , `The following are the Arrival Age Group data for ${globalSelectedYear ? globalSelectedYear : 'all time'}${globalSelectedMonth ? `, ${months[globalSelectedMonth - 1]}` : ''} `)
    updateKpiForAi("2" , `This is the Arrival Age Group data from donut chart: ${ageGroupLabels[0]}= ${ageGroupData.summary.childrenCount}, ${ageGroupLabels[1]}= ${ageGroupData.summary.adultCount}, ${ageGroupLabels[2]}= ${ageGroupData.summary.middleAgeCount}, ${ageGroupLabels[3]}= ${ageGroupData.summary.elderlyCount} `);
    
    // Calculate revenue and profit
    const financials = calculateRevenueAndProfit(ageGroupData.bookings);
    
    // Calculate contribution percentages
    const contribution = calculateContributionPercentages(ageGroupData.summary);

    // Update KPIs
    document.getElementById("kid_total").textContent = 
        `Children (1-17): ${ageGroupData.summary.childrenCount.toLocaleString()}`;
    document.getElementById("adult_total").textContent = 
        `Adults (18-35): ${ageGroupData.summary.adultCount.toLocaleString()}`;
    document.getElementById("middleage_total").textContent = 
        `Middle Age (36-64): ${ageGroupData.summary.middleAgeCount.toLocaleString()}`;
    document.getElementById("elderly_total").textContent = 
        `Elderly (65+): ${ageGroupData.summary.elderlyCount.toLocaleString()}`;

    
    document.getElementById("adult_rev").textContent = 
        `Adult (18-35): $${financials.adult.profit.toLocaleString()}`;
    document.getElementById("middleage_rev").textContent = 
        `Middle Age (36-64): $${financials.middleAge.profit.toLocaleString()}`;
    document.getElementById("elderly_rev").textContent = 
        `Elderly (65+): $${financials.elderly.profit.toLocaleString()}`;
    // Update profit KPIs with contribution percentages
    // document.getElementById("adult_rev").textContent = 
    //     `Adult (18-35): $${financials.adult.profit.toLocaleString()} (${contribution.adult}%)`;
    // document.getElementById("middleage_rev").textContent = 
    //     `Middle Age (36-64): $${financials.middleAge.profit.toLocaleString()} (${contribution.middleAge}%)`;
    // document.getElementById("elderly_rev").textContent = 
    //     `Elderly (65+): $${financials.elderly.profit.toLocaleString()} (${contribution.elderly}%)`;

    updateKpiForAi("4" , `  The following are the Revenue Contribution by each age group during the provide period: Adult (18-35): $${financials.adult.profit.toLocaleString()} (${contribution.adult}%) , Middle Age (36-64): $${financials.middleAge.profit.toLocaleString()} (${contribution.middleAge}%) , Elderly (65+): $${financials.elderly.profit.toLocaleString()} (${contribution.elderly}%)`)
    // Create profit pie chart data
    const profitData = {
        labels: ["Adult (18-35)", "Middle Age (36-64)", "Elderly (65+)"],
        data: [
            financials.adult.profit,
            financials.middleAge.profit,
            financials.elderly.profit
        ],
        backgroundColor: [ageGroupColors[1], ageGroupColors[2], ageGroupColors[3]]  // Fixed color indices
    };

    // Draw profit pie chart
    drawPieChart(profitData.labels, profitData, "chart63",
        !globalSelectedYear ? 'Revenue Contribution by Age Group - All Time' :
        !globalSelectedMonth ? `Revenue Contribution by Age Group - ${globalSelectedYear}` :
        `Revenue Contribution by Age Group - ${full_months[globalSelectedMonth-1]} ${globalSelectedYear}`, 
        'top');

    // Create daily profit trends
    let dailyLabels = [];
    let adultProfitDataset = { label: "Adult (18-35)", data: [] };
    let middleAgeProfitDataset = { label: "Middle Age (36-64)", data: [] };
    let elderlyProfitDataset = { label: "Elderly (65+)", data: [] };

    // Create a map to store profits by date
    const profitsByDate = new Map();

    // Process all bookings to aggregate profits by date
    Object.entries(ageGroupData.bookings).forEach(([group, bookings]) => {
        bookings.forEach(booking => {
            const arrivalDate = new Date(booking.arrivalDay);
            // Only process dates within selected year/month if specified
            if ((!globalSelectedYear || arrivalDate.getFullYear() === globalSelectedYear) &&
                (!globalSelectedMonth || arrivalDate.getMonth() + 1 === globalSelectedMonth)) {
                // Add one day to the date key to fix alignment
                arrivalDate.setDate(arrivalDate.getDate() + 1);
                const dateKey = arrivalDate.toISOString().split('T')[0];
                
                if (!profitsByDate.has(dateKey)) {
                    profitsByDate.set(dateKey, {
                        adult: 0,
                        middleAge: 0,
                        elderly: 0
                    });
                }

                const profit = (booking.totalCharge || 0) * 0.3;
                const profits = profitsByDate.get(dateKey);

                switch(group) {
                    case "Adult (18-35)":
                        profits.adult += profit;
                        break;
                    case "Middle Age (36-64)":
                        profits.middleAge += profit;
                        break;
                    case "Elderly (65+)":
                        profits.elderly += profit;
                        break;
                }
            }
        });
    });

    // Convert the map to sorted arrays
    const sortedDates = Array.from(profitsByDate.keys())
        .filter(date => {
            if (globalSelectedMonth) {
                const d = new Date(date);
                return d.getMonth() + 1 === globalSelectedMonth;
            }
            return true;
        })
        .sort();

    // Get the number of days in the selected month
    const getDaysInMonth = (year, month) => {
        return new Date(year, month, 0).getDate();
    };

    // Create array with all days in month
    let allDatesMap = new Map();
    
    if (globalSelectedMonth && globalSelectedYear) {
        const totalDays = getDaysInMonth(globalSelectedYear, globalSelectedMonth);
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${globalSelectedYear}-${String(globalSelectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            dailyLabels.push(day.toString());
            allDatesMap.set(dateStr, {
                adult: 0,
                middleAge: 0,
                elderly: 0
            });
        }
        
        // Merge existing profit data into the complete dates map
        sortedDates.forEach(date => {
            allDatesMap.set(date, profitsByDate.get(date));
        });

        // Populate datasets with all days
        adultProfitDataset.data = Array.from(allDatesMap.values()).map(profit => profit.adult);
        middleAgeProfitDataset.data = Array.from(allDatesMap.values()).map(profit => profit.middleAge);
        elderlyProfitDataset.data = Array.from(allDatesMap.values()).map(profit => profit.elderly);
    } else {
        dailyLabels = sortedDates.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString("en-US", {day: "numeric" });
        });
        
        // Use existing data for non-monthly view
        sortedDates.forEach(date => {
            const profits = profitsByDate.get(date);
            adultProfitDataset.data.push(profits.adult);
            middleAgeProfitDataset.data.push(profits.middleAge);
            elderlyProfitDataset.data.push(profits.elderly);
        });
    }

    // Draw multi-line chart with aggregated data
    drawMultiLineChart(
        "chart62",
        dailyLabels,
        adultProfitDataset,
        middleAgeProfitDataset,
        elderlyProfitDataset,
        "Daily Profit Trends by Age Group"
    );
    updateKpiForAi("3" , `This is the Profit generated by different Arrival Age Group from MultiLine Chart: days-${dailyLabels}, Profit by adult- ${adultProfitDataset.data}, Profit by Middle-Ages- ${middleAgeProfitDataset.data}, Profit by Elderly- ${elderlyProfitDataset.data} `);
    // Create monthly profit trends
    const monthlyLabels = months;
    const monthlyAdultProfitDataset = { label: "Adult (18-35)", data: Array(12).fill(0) };
    const monthlyMiddleAgeProfitDataset = { label: "Middle Age (36-64)", data: Array(12).fill(0) };
    const monthlyElderlyProfitDataset = { label: "Elderly (65+)", data: Array(12).fill(0) };

    // Process all bookings to aggregate profits by month
    Object.entries(ageGroupData.bookings).forEach(([group, bookings]) => {
        bookings.forEach(booking => {
            const arrivalDate = new Date(booking.arrivalDay);
            const monthIndex = arrivalDate.getMonth();
            const profit = (booking.totalCharge || 0) * 0.3;

            switch(group) {
                case "Adult (18-35)":
                    monthlyAdultProfitDataset.data[monthIndex] += profit;
                    break;
                case "Middle Age (36-64)":
                    monthlyMiddleAgeProfitDataset.data[monthIndex] += profit;
                    break;
                case "Elderly (65+)":
                    monthlyElderlyProfitDataset.data[monthIndex] += profit;
                    break;
            }
        });
    });

    // Draw multi-line chart with either daily or monthly data based on selection
    if (!globalSelectedYear) {
        // If no year is selected, show yearly data
        const yearlyLabels = availableYears;
        const yearlyAdultProfitDataset = { label: "Adult (18-35)", data: Array(availableYears.length).fill(0) };
        const yearlyMiddleAgeProfitDataset = { label: "Middle Age (36-64)", data: Array(availableYears.length).fill(0) };
        const yearlyElderlyProfitDataset = { label: "Elderly (65+)", data: Array(availableYears.length).fill(0) };

        // Process all bookings to aggregate profits by year
        Object.entries(ageGroupData.bookings).forEach(([group, bookings]) => {
            bookings.forEach(booking => {
                const arrivalDate = new Date(booking.arrivalDay);
                const yearIndex = availableYears.indexOf(arrivalDate.getFullYear());
                const profit = (booking.totalCharge || 0) * 0.3;

                switch(group) {
                    case "Adult (18-35)":
                        yearlyAdultProfitDataset.data[yearIndex] += profit;
                        break;
                    case "Middle Age (36-64)":
                        yearlyMiddleAgeProfitDataset.data[yearIndex] += profit;
                        break;
                    case "Elderly (65+)":
                        yearlyElderlyProfitDataset.data[yearIndex] += profit;
                        break;
                }
            });
        });

        yearlyAdultProfitDataset.borderColor = ageGroupColors[1];     // Adults
        yearlyAdultProfitDataset.backgroundColor = "rgba(28, 78, 128, 0.2)";
        
        yearlyMiddleAgeProfitDataset.borderColor = ageGroupColors[2];  // Middle age
        yearlyMiddleAgeProfitDataset.backgroundColor = "rgba(219, 174, 88, 0.2)";
        
        yearlyElderlyProfitDataset.borderColor = ageGroupColors[3];    // Elderly
        yearlyElderlyProfitDataset.backgroundColor = "rgba(106, 177, 135, 0.2)";

        drawMultiLineChart(
            "chart62",
            yearlyLabels,
            yearlyAdultProfitDataset,
            yearlyMiddleAgeProfitDataset,
            yearlyElderlyProfitDataset,
            "Yearly Profit Trends by Age Group"
        );
        updateKpiForAi("3" , `This is the Profit generated by different Arrival Age Group from MultiLine Chart: years-${yearlyLabels}, Profit by adult- ${yearlyAdultProfitDataset.data}, Profit by Middle-Ages- ${yearlyMiddleAgeProfitDataset.data}, Profit by Elderly- ${yearlyElderlyProfitDataset.data} `);
    } else if (globalSelectedMonth) {
        adultProfitDataset.borderColor = ageGroupColors[1];     // Adults
        adultProfitDataset.backgroundColor = "rgba(28, 78, 128, 0.2)";
        
        middleAgeProfitDataset.borderColor = ageGroupColors[2];  // Middle age
        middleAgeProfitDataset.backgroundColor = "rgba(219, 174, 88, 0.2)";
        
        elderlyProfitDataset.borderColor = ageGroupColors[3];    // Elderly
        elderlyProfitDataset.backgroundColor = "rgba(106, 177, 135, 0.2)";
        drawMultiLineChart(
            "chart62",
            dailyLabels,
            adultProfitDataset,
            middleAgeProfitDataset,
            elderlyProfitDataset,
            "Daily Profit Trends by Age Group"
        );
        updateKpiForAi("3" , `This is the Profit generated by different Arrival Age Group from MultiLine Chart: days-${dailyLabels}, Profit by adult- ${adultProfitDataset.data}, Profit by Middle-Ages- ${middleAgeProfitDataset.data}, Profit by Elderly- ${elderlyProfitDataset.data} `);
    } else {
        monthlyAdultProfitDataset.borderColor = ageGroupColors[1];     // Adults
        monthlyAdultProfitDataset.backgroundColor = "rgba(28, 78, 128, 0.2)";
        
        monthlyMiddleAgeProfitDataset.borderColor = ageGroupColors[2];  // Middle age
        monthlyMiddleAgeProfitDataset.backgroundColor = "rgba(219, 174, 88, 0.2)";
        
        monthlyElderlyProfitDataset.borderColor = ageGroupColors[3];    // Elderly
        monthlyElderlyProfitDataset.backgroundColor = "rgba(106, 177, 135, 0.2)";
        drawMultiLineChart(
            "chart62",
            monthlyLabels,
            monthlyAdultProfitDataset,
            monthlyMiddleAgeProfitDataset,
            monthlyElderlyProfitDataset,
            "Monthly Profit Trends by Age Group"
        );
        updateKpiForAi("3" , `This is the Profit generated by different Arrival Age Group from MultiLine Chart: months-${monthlyLabels}, Profit by adult- ${monthlyAdultProfitDataset.data}, Profit by Middle-Ages- ${monthlyMiddleAgeProfitDataset.data}, Profit by Elderly- ${monthlyElderlyProfitDataset.data} `);
    }
}

// Handle year dropdown changes
function handleDropdown() {
    const chooseYear = document.getElementById("D6-choose_year");
    const chooseMonth = document.getElementById("D6-choose_month");

    if (!chooseYear || !chooseMonth) {
        console.error("Dropdown elements not found.");
        return;
    }

    // Create year dropdown
    chooseYear.innerHTML = `<option value="" style="text-align: center;">All Years</option>
        ${availableYears.map(year => `<option value="${year}" style="text-align: center;">${year}</option>`).join('')}`;
    
    chooseYear.value = currentYear;
    chooseMonth.style.display = "inline";

    chooseYear.addEventListener("change", function() {
        globalSelectedYear = this.value ? parseInt(this.value) : null;
        globalSelectedMonth = null; // Reset month selection whenever year changes
        chooseMonth.value = '';
        
        if (!this.value) {
            chooseMonth.style.display = "none";
        } else {
            chooseMonth.style.display = "inline";
            populateMonthDropdown();
        }
        updateChartsAndKPIs();
    });

    chooseMonth.addEventListener("change", function() {
        globalSelectedMonth = this.value ? parseInt(this.value) : null;
        updateChartsAndKPIs();
    });
}

// Populate month dropdown
function populateMonthDropdown() {
    const chooseMonth = document.getElementById("D6-choose_month");

    if (!chooseMonth) {
        console.error("Error: 'D6-choose_month' element not found.");
        return;
    }

    chooseMonth.innerHTML = `<option value="" style="text-align: center;">All Months</option>
        ${months.map((month, index) => `<option value="${index + 1}" style="text-align: center;">${month}</option>`).join('')}`;

    if (bar) {
        chooseMonth.value = currentMonth;
        bar = false;
    }
}

// Initialize the dashboard
handleDropdown();
populateMonthDropdown();
updateChartsAndKPIs();
