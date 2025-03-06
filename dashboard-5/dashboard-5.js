import { getAllClientBirthdays } from '../js/processData.js';
import { drawBarChart } from '../js/drawChart.js';
import { generateAiContent } from '../js/apiCaller.js';
import { getCurrentSection } from '../js/responsive.js';
// Add global variables
let currentMonth = new Date().getMonth() + 1;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx
let kpi_for_ai = {};
let aiAnalysisTimeout;
let Is_ai_on;

async function updateAIAnalysis() {
    const aiAnalysisElement = document.getElementById('D5-ai-analysis');
    const aiAnalysisElement2 = document.getElementById('D5-ai-analysis-2');
    if (!aiAnalysisElement) return;

    for (let retryCount = 0; retryCount < 3; retryCount++) {
        try {
            aiAnalysisElement.innerHTML = '<div class= "ai-loading"> </div>';
            aiAnalysisElement2.innerHTML = '';

            // Format data
            const chartDataString = Object.values(kpi_for_ai).filter(Boolean).join('\n');
            const combinedPrompt = `Based on the following booking data:\n${chartDataString}\n
            Please provide analysis in three sections:
            1. Birthday Distribution Analysis
            2. Upcoming Birthdays Analysis
            3. And one more of your choice
            write %n% at the end of number one and at the start of number two
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
            .replace(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+\d{1,2}(?:st|nd|rd|th)?\b/gi, '<b>$&</b>')
            const sections = formattedAnalysis.split('%n%');
            const firstSection = sections[0];
            const secondSection = sections.slice(1).join('%n%');
            
            aiAnalysisElement.innerHTML = `<div id="ai-text"> ${firstSection} </div>`;
            if (aiAnalysisElement2) {
                aiAnalysisElement2.innerHTML = `<div id="ai-text"> ${secondSection} </div>`;
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
        const isMonthlyStats = getCurrentSection() === "Guest Birthdays";
        
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
    if (!Is_ai_on && getCurrentSection() === 'Guest Birthdays') {
        Is_ai_on = true;
        await updateAIAnalysis();
    }
}

monitorSection();
// Ai part xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx__________xxxxxxxxxx
//     updateKpiForAi('1', ` Here are the lables and datasets for barchart for all time: labels- ${labels}, dataset- ${String(data)}`);


// Process data for the chart
function getDaysInMonth(month) {
    if (month === 2) { // February
        return 29;
    }
    const year = new Date().getFullYear(); // Current year for February calculation
    return new Date(year, month, 0).getDate();
}

// Process data for the chart
function prepareBirthdayChartData(month) {
    if (!month) {
        // Show total birthdays for each month
        const birthdaysByMonth = new Array(12).fill(0);
        const allBirthdays = getAllClientBirthdays();
        
        allBirthdays.forEach(person => {
            const birthDate = new Date(person.birthDate);
            const month = birthDate.getMonth();
            birthdaysByMonth[month]++;
        });

        return {
            labels: months,
            data: birthdaysByMonth
        };
    }

    // Show daily distribution for selected month
    const birthdays = getAllClientBirthdays(month);
    const totalDays = getDaysInMonth(month);
    
    // Create array for actual days in the month
    const daysInMonth = new Array(totalDays).fill(0);
    
    // Count birthdays for each day
    birthdays.forEach(person => {
        const birthDate = new Date(person.birthDate);
        const day = birthDate.getDate();
        if (day <= totalDays) { // Ensure day is within month's range
            daysInMonth[day - 1]++; // Subtract 1 because array is 0-based
        }
    });

    // Create labels for actual days in month
    const labels = Array.from({length: totalDays}, (_, i) => `Day ${i + 1}`);

    return {
        labels: labels,
        data: daysInMonth
    };
}

function updateKPIs(month = null) {
    const allBirthdays = getAllClientBirthdays();
    const selectedMonthBirthdays = month ? getAllClientBirthdays(month) : [];
    
    // Update total birthdays KPI
    const totalElement = document.getElementById('total-birthdays');
    totalElement.textContent = month ? selectedMonthBirthdays.length : allBirthdays.length;

    // Update percentage KPI
    const percentageElement = document.getElementById('birthday-percentage');
    if (month && allBirthdays.length > 0) {
        const percentage = (selectedMonthBirthdays.length / allBirthdays.length) * 100;
        percentageElement.textContent = `${percentage.toFixed(1)}%`;
    } else {
        percentageElement.textContent = '100%';
    }
    updateKpiForAi("2", ` Total number of Birthday: ${totalElement.textContent}, Birthdays in ${month ? months[month-1] : 'All Months'} is ${percentageElement.textContent}% of the total number of Birthdays. `);
    // Update upcoming birthdays KPI
    updateUpcomingBirthdays();
}

// Update the updateDashboard function to include KPI updates
function updateDashboard(month = null) {
    const { labels, data } = prepareBirthdayChartData(month);
    const periodLabel = month ? `Birthdays Distribution in ${months[month - 1]}` : 'Birthday Distribution by All Months';
    const cleanLabels = month ? labels.map(label => label.replace('Day ', '')) : labels;
    drawBarChart(
        cleanLabels,
        data,
        'chart51',
        periodLabel
    );
    
    updateKPIs(month);
    updateKpiForAi("1", ` ${periodLabel} ,  ${String(cleanLabels)} ,  ${String(data)} `);
}

function populateMonthDropdown() {
    const chooseMonth = document.getElementById("D5-choose_month");

    if (!chooseMonth) {
        console.error("Error: 'D5-choose_month' element not found.");
        return;
    }

    chooseMonth.innerHTML = `<option value="" style="text-align: center;">All Months</option>
        ${months.map((month, index) => `<option value="${index + 1}" style="text-align: center;">${month}</option>`).join('')}`;

    chooseMonth.addEventListener("change", function() {
        const selectedMonth = this.value ? parseInt(this.value) : null;
        updateDashboard(selectedMonth);
    });

    // Set initial month
    chooseMonth.value = currentMonth;
    updateDashboard(currentMonth);
}

function updateUpcomingBirthdays() {
    const upcomingElement = document.getElementById('upcoming-birthdays');
    const tableBody = document.getElementById('upcoming-birthday-list');
    const today = new Date();
    const nextWeek = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    const upcomingBirthdays = getAllClientBirthdays().filter(person => {
        const birthday = new Date(person.birthDate);
        const thisYearBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        return thisYearBirthday >= today && thisYearBirthday <= nextWeek;
    });

    upcomingElement.textContent = upcomingBirthdays.length;
    
    // Sort by upcoming date
    upcomingBirthdays.sort((a, b) => {
        const dateA = new Date(a.birthDate);
        const dateB = new Date(b.birthDate);
        return dateA.getTime() - dateB.getTime();
    });

    // Populate table
    tableBody.innerHTML = upcomingBirthdays.map(person => {
        const birthDate = new Date(person.birthDate);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
        
        return `
            <tr>
                <td>${person.clientId}</td>
                <td>${person.name}</td>
                <td>${birthDate.toLocaleDateString()}</td>
                <td>${daysUntil} day${daysUntil > 0 ? 's' : ''}</td>
            </tr>
        `;
    }).join('');

    const formattedBirthdays = upcomingBirthdays.map(person => {
        const birthDate = new Date(person.birthDate);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
        return `
                    Client ID: ${person.clientId}
                    Name: ${person.name}
                    Birth Date: ${birthDate.toLocaleDateString()}
                    Days Until Birthday: ${daysUntil} day${daysUntil > 0 ? 's' : ''}
                    ----------------------------------------`;
                    }).join('\n');
    updateKpiForAi("3", ` Upcoming Birthdays (next 7 days from ${today.toLocaleDateString()}):\n${formattedBirthdays} `);
}
// Initialize dashboard
populateMonthDropdown();
