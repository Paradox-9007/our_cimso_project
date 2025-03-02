import { getAllClientBirthdays } from '../js/processData.js';
import { drawBarChart, drawPieChart } from '../js/drawChart.js';

// Add global variables
let globalSelectedMonth = '';
let currentMonth = new Date().getMonth() + 1;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

    // Update upcoming birthdays KPI
    updateUpcomingBirthdays();
}

// Update the updateDashboard function to include KPI updates
function updateDashboard(month = null) {
    const { labels, data } = prepareBirthdayChartData(month);
    const periodLabel = month ? `Birthdays in ${months[month - 1]}` : 'Birthday Distribution by Month';
    
    drawBarChart(
        labels,
        data,
        'chart51',
        periodLabel
    );
    
    updateKPIs(month);
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
                <td>${daysUntil} day${daysUntil > 1 ? 's' : ''}</td>
            </tr>
        `;
    }).join('');
}
// Initialize dashboard
populateMonthDropdown();