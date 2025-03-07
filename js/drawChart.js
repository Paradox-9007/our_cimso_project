function drawBarChart(labels, data, chartId, label = 'Number of Booking Arrivals', legendPosition = 'top') {
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
                label: label,
                data: data,
                backgroundColor: '#1C4E80',
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    suggestedMax: maxDataValue * 1.2,
                    beginAtZero: true
                }
            },
            plugins: {
                legend: {
                    position: legendPosition,
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

function drawPieChart(labels, data, chartId, chartLabel = 'Number of Booking Arrivals', legendPosition = 'top') {
    const ctx = document.getElementById(chartId).getContext('2d');

    // Destroy existing chart if it exists
    if (window.chartInstances && window.chartInstances[chartId]) {
        window.chartInstances[chartId].destroy();
    }

    // Check if data is an object with backgroundColor and data properties
    const isDataObject = typeof data === 'object' && !Array.isArray(data);
    const chartData = isDataObject ? data.data : data;
    
    // Calculate total for percentages using the actual data
    const total = chartData.reduce((sum, value) => sum + value, 0);

    // Use backgroundColor from data object if available, otherwise use defaults
    const backgroundColor = isDataObject && data.backgroundColor ? data.backgroundColor : [
        '#1C4E80',
        '#4CB5F5',
        '#6AB187',
        '#EA6A47',
        '#D32D41',
        '#DBAE58',
        '#0091D5',
        '#AC3E31',
        '#A5D8DD',
        '#23282D',
        '#F1F1F1',
        '#20283E',
    ];

    // Create a new pie chart
    const newChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: chartLabel,
                data: chartData,
                backgroundColor: backgroundColor,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: legendPosition,
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percentage = ((value / total) * 100).toFixed(2);
                            return `${context.label}: ${percentage}% (${value.toLocaleString()})`;
                        }
                    }
                },
                title: {
                    display: true,
                    text: chartLabel
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

function drawGroupedBarChart(labels, datasets, chartId, labelName = 'Number of Bookings', legendPosition = 'top') {
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
        '#1C4E80',
        '#EA6A47',
    ];
    
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
                    suggestedMax: maxValue * 1.2,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: labelName
                    }
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
                    position: legendPosition,
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
                    backgroundColor: "#A8D5BA",
                    borderColor: "#6AB187",
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
 
    // Check if data is an object with backgroundColor
    const chartData = data.data || data;
    const backgroundColor = data.backgroundColor || [
        'rgb(0, 102, 20)',    // Green
        'rgb(0, 51, 102)',    // Dark blue
        'rgb(204, 0, 0)',     // Red
        'rgb(255, 153, 0)',   // Orange
        'rgb(255, 255, 0)',   // Yellow
        'rgb(153, 51, 255)',  // Purple
    ];

    // Create a new donut chart
    const newChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: chartData,
                backgroundColor: backgroundColor,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            cutout: '50%'
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
            borderColor: dataset1.borderColor || "#1C4E80",
            backgroundColor: 'transparent',
            fill: false,
            yAxisID: "y",
        });
    }
    if (dataset2 && dataset2.data) {
        datasets.push({
            label: dataset2.label,
            data: dataset2.data,
            borderColor: dataset2.borderColor || "#EA6A47",
            backgroundColor: 'transparent',
            fill: false,
            yAxisID: "y",
        });
    }
    if (dataset3 && dataset3.data) {
        datasets.push({
            label: dataset3.label,
            data: dataset3.data,
            borderColor: dataset3.borderColor || "#009105",
            backgroundColor: 'transparent',
            fill: false,
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
              backgroundColor: '#1C4E80',
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
                borderColor: '#1C4E80',
                backgroundColor: 'transparent',
                tension: 0.4,
                fill: true,
                pointStyle: 'circle',
                pointRadius: 3.5,
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
