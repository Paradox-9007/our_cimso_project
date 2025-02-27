function drawBarChart(labels, data, chartId) {
    const ctx = document.getElementById(chartId).getContext('2d');
    const maxDataValue = Math.max(...data);
    // Destroy existing chart if it exists
    if (window.chartInstances && window.chartInstances[chartId]) {
        window.chartInstances[chartId].destroy();
    }

    // Create a new chart
    const newChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Booking Arrivals',
                data: data,
                backgroundColor: 'rgb(0, 255, 255)',
            }]
        },
        options: {
            scales: {
                y: {
                    suggestedMax: maxDataValue * 1.1, // 10% extra spacc above
                    beginAtZero: true
                }
            }
        }
    });

    // Store the new chart instance
    if (!window.chartInstances) {
        window.chartInstances = {};
    }
    window.chartInstances[chartId] = newChart;
}


function drawPieChart(labels, data, chartId) {
    const ctx = document.getElementById(chartId).getContext('2d');

    // Destroy existing chart if it exists
    if (window.chartInstances && window.chartInstances[chartId]) {
        window.chartInstances[chartId].destroy();
    }

    // Create a new pie chart
    const newChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgb(0, 102, 20)',    // Green
                    'rgb(0, 51, 102)',    // Dark blue
                    'rgb(204, 0, 0)',     // Red
                    'rgb(255, 153, 0)',   // Orange
                    'rgb(255, 255, 0)',   // Yellow
                    'rgb(153, 51, 255)',  // Purple
                ],
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
            }
        }
    });

    // Store the new chart instance
    if (!window.chartInstances) {
        window.chartInstances = {};
    }
    window.chartInstances[chartId] = newChart;
}


export { drawBarChart,drawPieChart };
