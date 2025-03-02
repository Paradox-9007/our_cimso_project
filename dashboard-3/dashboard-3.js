// Import required modules
import { generateHourlyBookingData, getMonthlyBookingCounts } from '../js/processData.js';
import { drawGroupedBarChart, drawDonutChart, drawPieChart } from '../js/drawChart.js';

function getCurrentDate() {
    const today = new Date();
    return {
        day: today.getDate(),
        month: today.getMonth(),
        year: today.getFullYear()
    };
}

const datata = generateHourlyBookingData(getCurrentDate());
// const data = generateHourlyBookingData({
//     day: 1,
//     month: 2,
//     year: 2025,
// });

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
// Calculate total arrivals and departures
// const totalArrivals = arrivalData.reduce((sum, value) => sum + value, 0);
// const totalDepartures = departureData.reduce((sum, value) => sum + value, 0);

// // Create dataset for the donut chart
// const donutData = {
//     labels: ['Total Arrivals', 'Total Departures'],
//     data: [totalArrivals, totalDepartures],
//     backgroundColor: ['rgb(0, 255, 255)', 'rgb(255, 99, 132)'] // Matching colors with bar chart
// };

// // Draw the donut chart
// drawDonutChart(donutData.labels, donutData.data, 'chart32');




// // Draw the pie charts
// drawPieChart(arrivalsPieData.labels, arrivalsPieData.data, 'chart33');
// drawPieChart(departuresPieData.labels, departuresPieData.data, 'chart34');
