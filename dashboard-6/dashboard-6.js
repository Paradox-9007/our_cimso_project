import { getBookingsByAgeGroup, generate_Barchart_dashboard_1_inYears } from "../js/processData.js";
import { drawMultiLineChart, drawDonutChart, drawPieChart } from "../js/drawChart.js";

// Initialize variables
const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();
const availableYears = generate_Barchart_dashboard_1_inYears()[0];
let globalSelectedYear = currentYear;
let globalSelectedMonth = currentMonth;
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
let bar = true;

// Age group labels
const ageGroupLabels = ["Children (1-17)", "Adult (18-35)", "Middle Age (36-64)", "Elderly (65+)"];

// Function to calculate revenue and profit by age group
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
    const bookingCounts = [
        ageGroupData.summary.childrenCount,
        ageGroupData.summary.adultCount,
        ageGroupData.summary.middleAgeCount,
        ageGroupData.summary.elderlyCount
    ];
    drawDonutChart(ageGroupLabels, bookingCounts, "chart61");

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

    // Update profit KPIs with contribution percentages
    document.getElementById("adult_rev").textContent = 
        `Adult (18-35): $${financials.adult.profit.toLocaleString()} (${contribution.adult}%)`;
    document.getElementById("middleage_rev").textContent = 
        `Middle Age (36-64): $${financials.middleAge.profit.toLocaleString()} (${contribution.middleAge}%)`;
    document.getElementById("elderly_rev").textContent = 
        `Elderly (65+): $${financials.elderly.profit.toLocaleString()} (${contribution.elderly}%)`;

    // Create profit pie chart data
    const profitData = {
        labels: ["Adult (18-35)", "Middle Age (36-64)", "Elderly (65+)"],
        data: [
            financials.adult.profit,
            financials.middleAge.profit,
            financials.elderly.profit
        ],
        backgroundColor: [
            "rgb(58, 176, 255)", // Blue for Adult
            "rgb(150, 0, 176)", // Purple for Middle Age
            "rgb(255, 159, 64)"  // Orange for Elderly
        ]
    };

    // Draw profit pie chart
    drawPieChart(profitData.labels, profitData.data, "chart63");

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
    const sortedDates = Array.from(profitsByDate.keys()).sort();
    dailyLabels = sortedDates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    });

    // Populate the datasets
    sortedDates.forEach(date => {
        const profits = profitsByDate.get(date);
        adultProfitDataset.data.push(profits.adult);
        middleAgeProfitDataset.data.push(profits.middleAge);
        elderlyProfitDataset.data.push(profits.elderly);
    });

    // Draw multi-line chart with aggregated data
    drawMultiLineChart(
        "chart62",
        dailyLabels,
        adultProfitDataset,
        middleAgeProfitDataset,
        elderlyProfitDataset,
        "Daily Profit Trends by Age Group"
    );
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

        drawMultiLineChart(
            "chart62",
            yearlyLabels,
            yearlyAdultProfitDataset,
            yearlyMiddleAgeProfitDataset,
            yearlyElderlyProfitDataset,
            "Yearly Profit Trends by Age Group"
        );
    } else if (globalSelectedMonth) {
        // If a month is selected, show daily data
        drawMultiLineChart(
            "chart62",
            dailyLabels,
            adultProfitDataset,
            middleAgeProfitDataset,
            elderlyProfitDataset,
            "Daily Profit Trends by Age Group"
        );
    } else {
        // If only year is selected, show monthly data
        drawMultiLineChart(
            "chart62",
            monthlyLabels,
            monthlyAdultProfitDataset,
            monthlyMiddleAgeProfitDataset,
            monthlyElderlyProfitDataset,
            "Monthly Profit Trends by Age Group"
        );
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
        if (!this.value) {
            globalSelectedMonth = null;
            chooseMonth.value = '';
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
