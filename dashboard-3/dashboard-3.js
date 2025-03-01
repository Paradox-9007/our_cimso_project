// Import required modules
import { } from '../js/processData.js';
import { drawGroupedBarChart, drawDonutChart, drawPieChart } from '../js/drawChart.js';

// Sample data for 24-hour arrivals and departures
const hours = [...Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`), '23:59'];
const arrivalData = [5, 3, 2, 1, 2, 8, 15, 25, 45, 60, 50, 40, 35, 30, 25, 20, 15, 10, 8, 12, 18, 15, 10, 7, 7];
const departureData = [8, 4, 2, 1, 1, 3, 10, 35, 55, 45, 35, 30, 40, 45, 35, 25, 20, 15, 10, 8, 12, 15, 12, 10, 10];

// Create datasets for the grouped bar chart
const datasets = [
    {
        label: 'Arrivals',
        data: arrivalData,
        backgroundColor: 'rgb(0, 255, 255)', // Cyan for arrivals
    },
    {
        label: 'Departures',
        data: departureData,
        backgroundColor: 'rgb(255, 99, 132)', // Pink for departures
    }
];

// Draw the grouped bar chart when the page loads

    drawGroupedBarChart(hours, datasets, 'chart31');

// Calculate total arrivals and departures
const totalArrivals = arrivalData.reduce((sum, value) => sum + value, 0);
const totalDepartures = departureData.reduce((sum, value) => sum + value, 0);

// Create dataset for the donut chart
const donutData = {
    labels: ['Total Arrivals', 'Total Departures'],
    data: [totalArrivals, totalDepartures],
    backgroundColor: ['rgb(0, 255, 255)', 'rgb(255, 99, 132)'] // Matching colors with bar chart
};

// Draw the donut chart
drawDonutChart(donutData.labels, donutData.data, 'chart32');

// Sample data for monthly totals
const monthlyArrivals = 1500;
const monthlyDepartures = 1800;

// Calculate today's totals (from the existing hourly data)
const todayTotalArrivals = arrivalData.reduce((sum, value) => sum + value, 0);
const todayTotalDepartures = departureData.reduce((sum, value) => sum + value, 0);

// Create dataset for today vs monthly arrivals pie chart
const arrivalsPieData = {
    labels: ['Today\'s Arrivals', 'Rest of Month Arrivals'],
    data: [todayTotalArrivals, monthlyArrivals - todayTotalArrivals],
    backgroundColor: ['rgb(0, 255, 255)', 'rgb(200, 255, 255)'] // Cyan theme
};

// Create dataset for today vs monthly departures pie chart
const departuresPieData = {
    labels: ['Today\'s Departures', 'Rest of Month Departures'],
    data: [todayTotalDepartures, monthlyDepartures - todayTotalDepartures],
    backgroundColor: ['rgb(255, 99, 132)', 'rgb(255, 200, 200)'] // Pink theme
};

// Draw the pie charts
drawPieChart(arrivalsPieData.labels, arrivalsPieData.data, 'chart33');
drawPieChart(departuresPieData.labels, departuresPieData.data, 'chart34');
