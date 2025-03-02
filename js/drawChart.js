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
                    suggestedMax: maxDataValue * 1.2, // 10% extra spacc above
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

function drawGroupedBarChart(labels, datasets, chartId) {
    const ctx = document.getElementById(chartId).getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.chartInstances && window.chartInstances[chartId]) {
        window.chartInstances[chartId].destroy();
    }
    
    // Find the maximum value across all datasets for scaling
    let maxValue = 0;
    datasets.forEach(dataset => {
        const datasetMax = Math.max(...dataset.data);
        maxValue = Math.max(maxValue, datasetMax);
    });
    
    // Create color palette for datasets if not provided
    const defaultColors = [
        'rgb(0, 255, 255)',  // Cyan
        'rgb(255, 99, 132)',  // Pink/Red
        'rgb(54, 162, 235)',  // Blue
        'rgb(255, 206, 86)',  // Yellow
        'rgb(75, 192, 192)',  // Teal
        'rgb(153, 102, 255)', // Purple
    ];
    
    // Apply default colors if not specified in datasets
    datasets.forEach((dataset, index) => {
        if (!dataset.backgroundColor) {
            dataset.backgroundColor = defaultColors[index % defaultColors.length];
        }
    });
    
    // Create a new grouped bar chart
    const newChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    suggestedMax: maxValue * 1.2, // 20% extra space above
                    beginAtZero: true
                },
                x: {
                    ticks: {
                        autoSkip: false,
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
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
   
  function drawComboChart(chartId, labels, barData, lineData) {
    const ctx = document.getElementById(chartId).getContext("2d");
   
    // Destroy existing chart if it exists
    if (window.chartInstances && window.chartInstances[chartId]) {
        window.chartInstances[chartId].destroy();
    }
   
    // Calculate max values for both datasets
    const maxBarValue = Math.max(...barData.data);
    const maxLineValue = Math.max(...lineData.data);
   
    const newChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: barData.label,
                    data: barData.data,
                    backgroundColor: "rgba(54, 162, 235, 0.5)",
                    borderColor: "rgb(54, 162, 235)",
                    borderWidth: 1,
                    order: 2,
                    yAxisID: "y",
                },
                {
                    label: lineData.label,
                    data: lineData.data,
                    type: "line",
                    borderColor: "rgb(255, 99, 132)",
                    borderWidth: 2,
                    fill: false,
                    order: 1,
                    yAxisID: "y1",
                },
            ],
        },
        options: {
            responsive: true,
            interaction: {
                mode: "index",
                intersect: false,
            },
            scales: {
                y: {
                    type: "linear",
                    display: true,
                    position: "left",
                    title: {
                        display: true,
                        text: barData.label,
                    },
                    beginAtZero: true,
                    suggestedMax: maxBarValue * 1.2, // Add 20% space above max value
                    grid: {
                        drawOnChartArea: true,
                    },
                },
                y1: {
                    type: "linear",
                    display: true,
                    position: "right",
                    title: {
                        display: true,
                        text: lineData.label,
                    },
                    beginAtZero: true,
                    suggestedMax: maxLineValue * 1.2, // Add 20% space above max value
                    grid: {
                        drawOnChartArea: false,
                    },
                },
            },
        },
    });
   
    // Store the new chart instance
    if (!window.chartInstances) {
        window.chartInstances = {};
    }
    window.chartInstances[chartId] = newChart;
  }
  function drawDonutChart(labels, data, chartId) {
    const ctx = document.getElementById(chartId).getContext('2d');
 
    // Destroy existing chart if it exists
    if (window.chartInstances && window.chartInstances[chartId]) {
        window.chartInstances[chartId].destroy();
    }
 
    // Create a new donut chart
    const newChart = new Chart(ctx, {
        type: 'doughnut',
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
                }
            },
            cutout: '50%' // This makes it a donut chart by creating a hole in the middle
        }
    });
 
    // Store the new chart instance
    if (!window.chartInstances) {
        window.chartInstances = {};
    }
    window.chartInstances[chartId] = newChart;
}

function drawMultiLineChart(chartId, labels, dataset1, dataset2, dataset3, title) {
    const ctx = document.getElementById(chartId).getContext("2d");
    
    // Destroy existing chart if it exists
    if (window.chartInstances && window.chartInstances[chartId]) {
        window.chartInstances[chartId].destroy();
    }

    // Filter out undefined datasets
    const datasets = [];
    if (dataset1 && dataset1.data) {
        datasets.push({
            label: dataset1.label,
            data: dataset1.data,
            borderColor: "rgb(54, 162, 235)", // Blue
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            yAxisID: "y",
        });
    }
    if (dataset2 && dataset2.data) {
        datasets.push({
            label: dataset2.label,
            data: dataset2.data,
            borderColor: "rgb(255, 99, 132)", // Pink
            backgroundColor: "rgba(255, 99, 132, 0.2)",
            yAxisID: "y",
        });
    }
    if (dataset3 && dataset3.data) {
        datasets.push({
            label: dataset3.label,
            data: dataset3.data,
            borderColor: "rgb(75, 192, 192)", // Teal
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            yAxisID: "y",
        });
    }

    // Find max value across all datasets
    const maxDataValue = Math.max(
        ...datasets.flatMap(dataset => dataset.data)
    );

    // Create new chart instance
    const newChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            interaction: {
                mode: "index",
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: title,
                },
            },
            scales: {
                y: {
                    type: "linear",
                    display: true,
                    suggestedMax: maxDataValue * 1.1,
                    beginAtZero: true,
                    position: "left",
                    title: {
                        display: true,
                        text: "Profit ($)",
                    },
                },
            },
        },
    });

    // Store the new chart instance
    if (!window.chartInstances) {
        window.chartInstances = {};
    }
    window.chartInstances[chartId] = newChart;
}

function drawStackedBarChart(labels, datasets, chartId) {
  const ctx = document.getElementById(chartId).getContext('2d');
  
  // Destroy existing chart if it exists
  if (window.chartInstances && window.chartInstances[chartId]) {
      window.chartInstances[chartId].destroy();
  }

  // Calculate stackedMax correctly
  const stackedSums = new Array(labels.length).fill(0);
  datasets.forEach(dataset => {
      dataset.data.forEach((value, index) => {
          stackedSums[index] += value;
      });
  });
  const stackedMax = Math.max(...stackedSums);

  const newChart = new Chart(ctx, {
      type: "bar",
      data: {
          labels: labels,
          datasets: datasets,
      },
      options: {
          responsive: true,
          scales: {
              x: {
                  stacked: true,
                  ticks: {
                      autoSkip: false,
                      maxRotation: 45,
                      minRotation: 0,
                  },
              },
              y: {
                  stacked: true,
                  beginAtZero: true,
                  suggestedMax: stackedMax * 1.1, // 10% extra space above
              },
          },
          plugins: {
              legend: {
                  position: "top",
              },
              tooltip: {
                  mode: "index",
                  intersect: false,
              },
          },
      },
  });

  // Store the new chart instance
  if (!window.chartInstances) {
      window.chartInstances = {};
  }
  window.chartInstances[chartId] = newChart;
}


function drawHorizontalBarChart(labels, data, chartId) {
  const ctx = document.getElementById(chartId).getContext('2d');
  const maxDataValue = Math.max(...data);

  // Destroy existing chart if it exists
  if (window.chartInstances && window.chartInstances[chartId]) {
      window.chartInstances[chartId].destroy();
  }

  // Create a new horizontal bar chart
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
          indexAxis: 'y',  // This makes the bars horizontal
          maintainAspectRatio: true,
          aspectRatio: 2,
          responsive: true,
          scales: {
              x: {
                  suggestedMax: maxDataValue * 1.1, // 10% extra space
                  beginAtZero: true
              },
              y: {
                  ticks: {
                      autoSkip: false,
                      maxRotation: 0
                  }
              }
          },
          plugins: {
              legend: {
                  position: 'top'
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

function drawLineChart(labels, data, chartId) {
    const ctx = document.getElementById(chartId).getContext('2d');
    const maxDataValue = Math.max(...data);
 
    // Destroy existing chart if it exists
    if (window.chartInstances && window.chartInstances[chartId]) {
        window.chartInstances[chartId].destroy();
    }
 
    // Create a new line chart
    const newChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Booking Arrivals',
                data: data,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4,
                fill: true,
                pointStyle: 'circle',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    suggestedMax: maxDataValue * 1.1,
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: 'top'
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

export { drawBarChart,drawPieChart,drawGroupedBarChart , drawComboChart , drawDonutChart, drawMultiLineChart, drawStackedBarChart, drawHorizontalBarChart, drawLineChart};
