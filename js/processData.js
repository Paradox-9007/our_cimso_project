import { fetchClientRequest, fetchBookingsRequest } from './apiCaller.js';


const bookingsData = await fetchBookingsRequest();
const clientData = await fetchClientRequest();
const FullDate = new Date();
const currentDate = FullDate.toDateString();
const currentDate_inEdate = NormalDate_to_ExcelDate(currentDate);
const Months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const currentYear = FullDate.getFullYear();

function findCurrentMonth() {
    return Months[FullDate.getMonth()];  // Work with both currentDate and currentDate_inEdate somehow
}




function ExcelDate_to_NormalDate(excelDate) {
    const excelStartDate = new Date(1900, 0, 0);
    const normalDate = new Date(excelStartDate.getTime() + (excelDate - 1) * 86400000);

    // Adjust to GMT+07:00, Bangkok Time Code
    const adjustedDate = new Date(normalDate);
    adjustedDate.setHours(adjustedDate.getHours());

    
    return adjustedDate.toDateString(); // From 45714 to  Wed Feb 26 2025
}



function NormalDate_to_ExcelDate(normalDate) {
    if (typeof normalDate === "string") {
        normalDate = new Date(normalDate);
    }
    const adjustedDate = new Date(normalDate);
    adjustedDate.setHours(adjustedDate.getHours());
    const excelStartDate = new Date(1900, 0, 0);
    
    const timeDiff = adjustedDate - excelStartDate;

    const excelDate = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 2;  // "Wed Feb 26 2025" or "Wed Feb 26 2025" to ExcelDate, 45714

    return excelDate;
}

function filter_bookingsData_byArrival(bookingsData, startDate_inEdate, endDate_inEdate) { // get bookings json and return json
    const filteredBookings = bookingsData.filter(booking => {
        const arrivalDate = parseInt(booking["Arrival Day"]);
        return arrivalDate >= startDate_inEdate && arrivalDate <= endDate_inEdate;
    });
    return filteredBookings;
}

function filter_bookingsData_byDeparture(bookingsData, startDate_inEdate, endDate_inEdate) { // get bookings json and return json
  const filteredBookings = bookingsData.filter(booking => {
      const arrivalDate = parseInt(booking["Departure Day"]);
      return arrivalDate >= startDate_inEdate && arrivalDate <= endDate_inEdate;
  });
  return filteredBookings;
}

function convertEminutesToNormalminute(minutes) {
  const baseDate = new Date(1900, 0, 0, 0, 0, 0); // 1 Jan 1900, 00:00
  
  baseDate.setMinutes(baseDate.getMinutes() + minutes);
  
  let day = baseDate.getDate() - 1;
  let month = baseDate.getMonth() + 1; // Months are 0-based in JS
  let year = baseDate.getFullYear();
  
  let hours = baseDate.getHours();
  let minutesPart = baseDate.getMinutes();
  
  // Format hours and minutes to always have 2 digits
  let formattedHours = hours.toString().padStart(2, '0');
  let formattedMinutes = minutesPart.toString().padStart(2, '0');
  
  return {
      day: day,
      month: month,
      year: year,
      time: {
          hours: formattedHours,
          minutes: formattedMinutes
      }};
}

function convertNormalminuteToEminutes(dateObj) {
  // Create base date (30 Dec 1899, 00:00)
  const baseDate = new Date(1899, 11, 30, 0, 0, 0);
  
  // Create target date from the input object
  const targetDate = new Date(
      dateObj.year,
      dateObj.month - 1, // Convert back to 0-based month
      dateObj.day
  );

  // Set the time
  let hours = dateObj.time.hours;
  if (dateObj.time.period === 'PM' && hours !== 12) {
      hours += 12;
  } else if (dateObj.time.period === 'AM' && hours === 12) {
      hours = 0;
  }
  
  targetDate.setHours(hours);
  targetDate.setMinutes(parseInt(dateObj.time.minutes));

  const diffInMinutes = Math.floor((targetDate - baseDate) / (1000 * 60) + 18);
  
  return diffInMinutes;
}

function generate_Barchart_dashboard_1_inMonth(month, year) {
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    
    const labels = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
    
    const data = labels.map(day => {
        const startDate = new Date(year, month - 1, day);
        const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
        
        // Count bookings with arrivals on this exact day
        return filter_bookingsData_byArrival(bookingsData, startDate_inEdate, startDate_inEdate).length;
    });
    
    return [labels, data];
}

function generateHourlyBookingData(dateObj) {
  // Convert the date object to Excel date format
  const targetDate = new Date(dateObj.year, dateObj.month , dateObj.day);
  const targetDay = NormalDate_to_ExcelDate(targetDate);
  
  // Initialize arrays for each hour (0-23) plus the last minute of the day
  const hours = [...Array.from({length: 24}, (_, i) => `${String(i).padStart(2, '0')}:00`), '23:59'];
  const arrivalCounts = new Array(25).fill(0);  // 24 hours + 23:59
  const departureCounts = new Array(25).fill(0);

  // Get bookings for the day
  const dayBookings = bookingsData.filter(booking => {
      const arrivalDay = parseInt(booking["Arrival Day"]);
      const departureDay = parseInt(booking["Departure Day"]);
      return targetDay === arrivalDay || targetDay === departureDay;
  });

  // Count arrivals and departures for each hour
  dayBookings.forEach(booking => {
      const arrivalDay = parseInt(booking["Arrival Day"]);
      const departureDay = parseInt(booking["Departure Day"]);

      if (arrivalDay === targetDay) {
          const arrivalTime = convertEminutesToNormalminute(parseInt(booking["Arrival Minute"]));
          const hourIndex = parseInt(arrivalTime.time.hours);
          if (hourIndex === 23 && arrivalTime.time.minutes === '59') {
              arrivalCounts[24]++; // Last minute of the day
          } else {
              arrivalCounts[hourIndex]++;
          }
      }

      if (departureDay === targetDay) {
          const departureTime = convertEminutesToNormalminute(parseInt(booking["Departure Minute"]));
          const hourIndex = parseInt(departureTime.time.hours);
          if (hourIndex === 23 && departureTime.time.minutes === '59') {
              departureCounts[24]++; // Last minute of the day
          } else {
              departureCounts[hourIndex]++;
          }
      }
  });

  return {
      labels: hours,
      datasets: [
          {
              label: 'Arrivals',
              data: arrivalCounts,
              backgroundColor: 'rgb(0, 255, 255)', // Cyan for arrivals
          },
          {
              label: 'Departures',
              data: departureCounts,
              backgroundColor: 'rgb(255, 99, 132)', // Pink for departures
          }
      ]
  };
}

function getMonthlyArrivalCount(bookingsData, month, year) {
  const startDate = new Date(year, month - 1, 1); // month is 1-based
  const endDate = new Date(year, month, 0); // Get last day of the month
  
  const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
  const endDate_inEdate = NormalDate_to_ExcelDate(endDate);
  
  const monthlyBookings = filter_bookingsData_byArrival(bookingsData, startDate_inEdate, endDate_inEdate);
  
  return monthlyBookings.length;
}

function getMonthlyDepartureCount(bookingsData, month, year) {
  const startDate = new Date(year, month - 1, 1); // month is 1-based
  const endDate = new Date(year, month, 0); // Get last day of the month
  
  const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
  const endDate_inEdate = NormalDate_to_ExcelDate(endDate);
  
  const monthlyBookings = filter_bookingsData_byDeparture(bookingsData, startDate_inEdate, endDate_inEdate);
  
  return monthlyBookings.length;
}

function getMonthlyBookingCounts(month, year) {
  return {
    arrivals: getMonthlyArrivalCount(bookingsData, month, year),
    departures: getMonthlyDepartureCount(bookingsData, month, year)
  };
}

function generate_Barchart_dashboard_1_inYear(year) {
    const labels = Array.from({ length: 12 }, (_, i) => 
        new Date(year, i).toLocaleString('en-US', { month: 'short' })
    );
    
    const data = labels.map((_, index) => {
        const startDate = new Date(year, index, 1);
        const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
        
        const endDate = new Date(year, index + 1, 0);
        const endDate_inEdate = NormalDate_to_ExcelDate(endDate);
        
        return filter_bookingsData_byArrival(bookingsData, startDate_inEdate, endDate_inEdate).length;
    });
    
    return [labels, data];
}


function generate_Barchart_dashboard_1_inYears() {
    const years = [...new Set(
        bookingsData.map(booking => 
            new Date(ExcelDate_to_NormalDate(booking["Arrival Day"])).getFullYear()
        )
    )].sort((a, b) => a - b);
    
    const data = years.map(year => {
        const startDate = new Date(year, 0, 1);
        const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
        
        const endDate = new Date(year, 11, 31);
        const endDate_inEdate = NormalDate_to_ExcelDate(endDate);
        
        return filter_bookingsData_byArrival(bookingsData, startDate_inEdate, endDate_inEdate).length;
    });

    const labels = years;

    return [labels, data];
}


function filter_bookingsData_byUniqueUnit(bookingsData) {
    const seenUnitIds = new Set();
    const uniqueUnits = bookingsData.filter((booking) => {
      const unitId = booking["Booking Unit ID"];
      if (!seenUnitIds.has(unitId)) {
        seenUnitIds.add(unitId);
        return true;
      }
      return false;
    });
   
    return {
      totalUniqueUnits: uniqueUnits.length,
      uniqueUnits: uniqueUnits,
    };
}

function getTotalRooms() {
  return filter_bookingsData_byUniqueUnit(bookingsData).totalUniqueUnits;
}

function count_total_bookings(year, month = null) {
    if (!year) {
        console.error("Year is required for fetching total bookings.");
        return 0;
    }

    if (month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
        const endDate_inEdate = NormalDate_to_ExcelDate(endDate);
        
        return filter_bookingsData_byArrival(bookingsData, startDate_inEdate, endDate_inEdate).length;
    } else {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        
        const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
        const endDate_inEdate = NormalDate_to_ExcelDate(endDate);
        
        return filter_bookingsData_byArrival(bookingsData, startDate_inEdate, endDate_inEdate).length;
    }
}

function getOccupiedUnits(bookingsData, date) {
    const targetDay =
      typeof date === "number" ? date : NormalDate_to_ExcelDate(date);
    const occupiedUnits = bookingsData.filter((booking) => {
      const arrivalDay = parseInt(booking["Arrival Day"]);
      const departureDay = parseInt(booking["Departure Day"]);
      return targetDay >= arrivalDay && targetDay < departureDay;
    });
    return {
      totalOccupiedUnits: occupiedUnits.length,
      occupiedUnits: occupiedUnits,
    };
}

function getAverageDailyRate(bookingsData, date) {
    const occupiedUnitsData = getOccupiedUnits(bookingsData, date);
    const dailyRates = occupiedUnitsData.occupiedUnits.map(
      (booking) => parseInt(booking["Effective Average Daily Rate"]) / 100
    );
   
    //   const totalDailyRate =
    //     dailyRates.length > 0
    //       ? dailyRates.reduce((a, b) => a + b, 0) /
    //         occupiedUnitsData.totalOccupiedUnits
    //       : 0;
   
    const totalDailyRate =
      dailyRates.length > 0 ? dailyRates.reduce((a, b) => a + b, 0) : 0;
   
    return Math.round(totalDailyRate);
}

function getOccupancyAndADR(startDate, endDate) {
  // Convert dates to Excel format if they're not already
  const startDate_inEdate = typeof startDate === "number" ? startDate : NormalDate_to_ExcelDate(startDate);
  const endDate_inEdate = typeof endDate === "number" ? endDate : NormalDate_to_ExcelDate(endDate);
 
  // Get total number of units available
  const totalUnits = filter_bookingsData_byUniqueUnit(bookingsData).totalUniqueUnits;
 
  // Initialize arrays for the chart data
  const dates = [];
  const occupancyRates = [];
  const averageDailyRates = [];
 
  // Calculate data for each day in the range
  for (let currentDate = startDate_inEdate; currentDate <= endDate_inEdate; currentDate++) {
      // Get occupied units and calculate occupancy rate
      const occupiedUnitsData = getOccupiedUnits(bookingsData, currentDate);
      const occupancyRate = (occupiedUnitsData.totalOccupiedUnits / totalUnits) * 100;
 
      // Get average daily rate
      const averageDailyRate = getAverageDailyRate(bookingsData, currentDate);
 
      // Add data to arrays
      dates.push(ExcelDate_to_NormalDate(currentDate));
      occupancyRates.push(Math.round(occupancyRate));
      averageDailyRates.push(averageDailyRate);
  }
 
  return {
      labels: dates,
      occupancyData: {
          label: "Occupancy Rate (%)",
          data: occupancyRates,
      },
      adrData: {
          label: "Average Daily Rate ($)",
          data: averageDailyRates,
      }
  };
}

function getMonthlyOccupancyAndADR(month, year) {
  // Calculate start and end dates for the month
  const startDate = new Date(year, month - 1, 1); // month is 1-based
  const endDate = new Date(year, month, 0); // Get last day of the month
  
  // Use the first function to get the data
  return getOccupancyAndADR(startDate, endDate);
}


function isBookedByMember(bookingId) {
  // Find the booking with the given ID
  const booking = bookingsData.find(booking => booking["Booking ID"] === bookingId);
  if (!booking) {
      console.error("Booking not found");
      return false;
  }

  // Get the client ID from the booking's Guest ID
  const guestId = booking["Guest ID"];
  
  // Find the client with matching ID
  const client = clientData.find(client => client["Client ID"] === guestId);
  if (!client) {
      console.error("Client not found");
      return false;
  }

  // Check if the client has any memberships
  return client["Membership List"] && client["Membership List"].length > 0;
}

function generateMemberVsGeneralData(year = null, month = null) {
  let labels = [];
  let memberData = [];
  let generalData = [];

  if (!year) {
      // All years view - when no parameters are provided
      const years = [...new Set(
          bookingsData.map(booking => 
              new Date(ExcelDate_to_NormalDate(booking["Arrival Day"])).getFullYear()
          )
      )].sort((a, b) => a - b);
      
      labels = years.map(year => year.toString());
      
      years.forEach(year => {
          const startDate = new Date(year, 0, 1);
          const endDate = new Date(year, 11, 31);
          const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
          const endDate_inEdate = NormalDate_to_ExcelDate(endDate);
          
          const bookings = filter_bookingsData_byArrival(bookingsData, startDate_inEdate, endDate_inEdate);
          
          let memberCount = 0;
          let generalCount = 0;
          
          bookings.forEach(booking => {
              if (isBookedByMember(booking["Booking ID"])) {
                  memberCount++;
              } else {
                  generalCount++;
              }
          });
          
          memberData.push(memberCount);
          generalData.push(generalCount);
      });
  } else if (year && month) {
      // Monthly view - show daily data when both year and month are provided
      const daysInMonth = new Date(year, month, 0).getDate();
      labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
      
      for (let day = 1; day <= daysInMonth; day++) {
          const startDate = new Date(year, month - 1, day);
          const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
          const bookings = filter_bookingsData_byArrival(bookingsData, startDate_inEdate, startDate_inEdate);
          
          let memberCount = 0;
          let generalCount = 0;
          
          bookings.forEach(booking => {
              if (isBookedByMember(booking["Booking ID"])) {
                  memberCount++;
              } else {
                  generalCount++;
              }
          });
          
          memberData.push(memberCount);
          generalData.push(generalCount);
      }
  } else if (year) {
      // Yearly view - show monthly data when only year is provided
      labels = Months;
      
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const startDate = new Date(year, monthIndex, 1);
          const endDate = new Date(year, monthIndex + 1, 0);
          const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
          const endDate_inEdate = NormalDate_to_ExcelDate(endDate);
          
          const bookings = filter_bookingsData_byArrival(bookingsData, startDate_inEdate, endDate_inEdate);
          
          let memberCount = 0;
          let generalCount = 0;
          
          bookings.forEach(booking => {
              if (isBookedByMember(booking["Booking ID"])) {
                  memberCount++;
              } else {
                  generalCount++;
              }
          });
          
          memberData.push(memberCount);
          generalData.push(generalCount);
      }
  }

  return {
      labels,
      datasets: [
          {
              label: 'Member Bookings',
              data: memberData,
          },
          {
              label: 'General Guest Bookings',
              data: generalData,
          }
      ]
  };
}

function calculateTotalActualCharge(bookings) {
  return bookings.reduce((total, booking) => {
      const charge = parseInt(booking["Total Actual Charge"]) / 100;
      return total + charge;
  }, 0);
}
function generateProfitComparisonData(year = null, month = null) {
  const { labels, datasets } = generateMemberVsGeneralData(year, month);
  const memberProfits = [];
  const generalProfits = [];

  // For each period in the data, calculate profits
  datasets[0].data.forEach((memberCount, index) => {
      const generalCount = datasets[1].data[index];
      
      // Get the corresponding bookings for this period
      let startDate, endDate;
      
      if (!year) {
          // All years view
          startDate = new Date(labels[index], 0, 1);
          endDate = new Date(labels[index], 11, 31);
      } else if (month) {
          // Monthly view (daily data)
          startDate = new Date(year, month - 1, parseInt(labels[index]));
          endDate = new Date(year, month - 1, parseInt(labels[index]));
      } else {
          // Yearly view (monthly data)
          startDate = new Date(year, index, 1);
          endDate = new Date(year, index + 1, 0);
      }

      const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
      const endDate_inEdate = NormalDate_to_ExcelDate(endDate);
      
      const periodBookings = filter_bookingsData_byArrival(bookingsData, startDate_inEdate, endDate_inEdate);
      
      // Split bookings into member and general
      const memberBookings = periodBookings.filter(booking => isBookedByMember(booking["Booking ID"]));
      const generalBookings = periodBookings.filter(booking => !isBookedByMember(booking["Booking ID"]));
      
      // Calculate profits
      memberProfits.push(calculateTotalActualCharge(memberBookings));
      generalProfits.push(calculateTotalActualCharge(generalBookings));
  });

  return {
      labels,
      datasets: [
          {
              label: 'Member Profits ($)',
              data: memberProfits
          },
          {
              label: 'General Guest Profits ($)',
              data: generalProfits
          }
      ],
      title: 'Profit Comparison: Members vs General Guests'
  };
}

function calculateUnitStatistics(bookingsData, startDate, endDate) {
    // Convert dates to Excel format if they're not already
    const startDate_inEdate = typeof startDate === "number" ? startDate : NormalDate_to_ExcelDate(startDate);
    const endDate_inEdate = typeof endDate === "number" ? endDate : NormalDate_to_ExcelDate(endDate);
    
    // Initialize statistics object
    const unitStats = {};
    
    // Filter bookings within the date range
    const relevantBookings = bookingsData.filter(booking => {
        const arrivalDay = parseInt(booking["Arrival Day"]);
        const departureDay = parseInt(booking["Departure Day"]);
        return (arrivalDay <= endDate_inEdate && departureDay >= startDate_inEdate);
    });
    
    // Calculate statistics for each booking
    relevantBookings.forEach(booking => {
        const unitId = booking["Booking Unit ID"];
        const arrivalDay = parseInt(booking["Arrival Day"]);
        const departureDay = parseInt(booking["Departure Day"]);
        const totalCharge = parseInt(booking["Total Actual Charge"]) / 100; // Convert to dollars
        
        // Calculate actual days stayed within the date range
        const effectiveStartDay = Math.max(arrivalDay, startDate_inEdate);
        const effectiveEndDay = Math.min(departureDay, endDate_inEdate);
        const daysStayed = effectiveEndDay - effectiveStartDay;
        
        // Initialize unit in statistics if not exists
        if (!unitStats[unitId]) {
            unitStats[unitId] = {
                total_money: 0,
                booking_count: 0,
                days_stayed: 0
            };
        }
        
        // Update statistics
        unitStats[unitId].total_money += totalCharge;
        unitStats[unitId].booking_count += 1;
        unitStats[unitId].days_stayed += daysStayed;
    });
    
    return unitStats;
}

function generateUnitPerformanceData(year = null, month = null) {
    let startDate, endDate;
    let periodLabel = 'All Time';
    
    if (!year) {
        // All years view
        startDate = new Date(Math.min(...bookingsData.map(booking => 
            new Date(ExcelDate_to_NormalDate(booking["Arrival Day"])))));
        endDate = new Date(Math.max(...bookingsData.map(booking => 
            new Date(ExcelDate_to_NormalDate(booking["Departure Day"])))));
    } else if (month) {
        // Monthly view
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0);
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        periodLabel = `${monthNames[month - 1]} ${year}`;
    } else {
        // Yearly view
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
        periodLabel = `Year ${year}`;
    }

    const unitStats = calculateUnitStatistics(bookingsData, startDate, endDate);
    
    // Convert the stats into arrays for the chart
    const units = Object.keys(unitStats);
    const moneyData = units.map(unit => {
        const value = unitStats[unit].total_money;
        return parseFloat(value.toFixed(2)); // Ensure 2 decimal places for currency
    });
    const bookingData = units.map(unit => unitStats[unit].booking_count);
    const stayData = units.map(unit => unitStats[unit].days_stayed);

    // Sort units by revenue in descending order
    const sortedIndices = moneyData
        .map((value, index) => ({ value, index }))
        .sort((a, b) => b.value - a.value)
        .map(item => item.index);

    // Reorder all arrays based on revenue sorting
    const sortedUnits = sortedIndices.map(i => units[i]);
    const sortedMoneyData = sortedIndices.map(i => moneyData[i]);
    const sortedBookingData = sortedIndices.map(i => bookingData[i]);
    const sortedStayData = sortedIndices.map(i => stayData[i]);

    return {
        labels: sortedUnits.map(unit => `Unit ${unit}`),
        periodLabel: periodLabel,
        datasets: [
            {
                label: 'Total Revenue ($)',
                data: sortedMoneyData,
                backgroundColor: 'rgb(0, 255, 255)', // Cyan
            },
            {
                label: 'Number of Bookings',
                data: sortedBookingData,
                backgroundColor: 'rgb(255, 99, 132)', // Pink
            },
            {
                label: 'Days Occupied',
                data: sortedStayData,
                backgroundColor: 'rgb(75, 192, 192)', // Teal
            }
        ]
    };
}

function getAllClientBirthdays(month = null) {
    // Get all clients with their birthday info
    const clientBirthdays = clientData.map(client => {
        const birthDate = new Date(ExcelDate_to_NormalDate(client["Birth Date"]));
        return {
            clientId: client["Client ID"],
            name: `${client["First Name"]} ${client["Surname"]}`,
            birthDate: ExcelDate_to_NormalDate(client["Birth Date"]),
            birthMonth: birthDate.getMonth() + 1, // 1-12 format
            age: calculateAge(client["Birth Date"])
        };
    });

    // If no month specified, return all birthdays
    if (!month) {
        return clientBirthdays;
    }

    // Filter clients whose birthdays are in the specified month
    return clientBirthdays.filter(client => client.birthMonth === month);
}

// Helper function to calculate age from Excel date
function calculateAge(birthDateExcel) {
    const birthDate = new Date(ExcelDate_to_NormalDate(birthDateExcel));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

function getBookingsByAgeGroup(year = null, month = null) {
    // Initialize age group counters
    const ageGroupBookings = {
      "Children (1-17)": [],
      "Adult (18-35)": [],
      "Middle Age (36-64)": [],
      "Elderly (65+)": [],
    };

    // Get relevant bookings based on period
    let relevantBookings;
    if (year && month) {
      // Monthly view - Create dates in local timezone
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      // Set time to start of day for consistent comparison
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
      const endDate_inEdate = NormalDate_to_ExcelDate(endDate);
      relevantBookings = filter_bookingsData_byArrival(
        bookingsData,
        startDate_inEdate,
        endDate_inEdate
      );
    } else if (year) {
        // Yearly view - Create dates in local timezone
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        // Set time to start/end of day for consistent comparison
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
        const endDate_inEdate = NormalDate_to_ExcelDate(endDate);
        relevantBookings = filter_bookingsData_byArrival(
          bookingsData,
          startDate_inEdate,
          endDate_inEdate
        );
      } else {
        // All time view
        relevantBookings = bookingsData;
      }

    // Process each booking
    relevantBookings.forEach((booking) => {
      // Process main guest
      const client = clientData.find(
        (client) => client["Client ID"] === booking["Guest ID"]
      );
      if (!client) return;

      // Calculate client's age
      const currentDate = new Date();
      const birthDate = ExcelDate_to_NormalDate(client["Birth Date"]);
      const birthDateObj = new Date(birthDate);
      let age = currentDate.getFullYear() - birthDateObj.getFullYear();
  
      // Adjust age if birthday hasn't occurred this year
      const monthDiff = currentDate.getMonth() - birthDateObj.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && currentDate.getDate() < birthDateObj.getDate())
      ) {
        age--;
      }
  
      // Create booking info object for main guest
      const bookingInfo = {
        bookingId: booking["Booking ID"],
        clientName: `${client["First Name"]} ${client["Surname"]}`,
        clientAge: age,
        arrivalDay: ExcelDate_to_NormalDate(booking["Arrival Day"]),
        departureDay: ExcelDate_to_NormalDate(booking["Departure Day"]),
        totalCharge: parseInt(booking["Total Actual Charge"]) / 100,
        isMainGuest: true
      };
  
      // Categorize main guest
      if (age >= 18 && age <= 35) {
        ageGroupBookings["Adult (18-35)"].push(bookingInfo);
      } else if (age >= 36 && age <= 64) {
        ageGroupBookings["Middle Age (36-64)"].push(bookingInfo);
      } else if (age >= 65) {
        ageGroupBookings["Elderly (65+)"].push(bookingInfo);
      } else if (age >= 1 && age <= 17) {
        ageGroupBookings["Children (1-17)"].push(bookingInfo);
      }

      const adultCount = parseInt(booking["Adult Count"]);
      if (adultCount > 1) {
        // Create additional adult entries (adultCount - 1 because main guest is already counted)
        for (let i = 0; i < adultCount - 1; i++) {
          const additionalAdultInfo = {
            bookingId: booking["Booking ID"],
            clientName: `Additional Adult ${i + 1}`,
            clientAge: 30, // Assume additional adults are in the Adult (18-35) category
            arrivalDay: ExcelDate_to_NormalDate(booking["Arrival Day"]),
            departureDay: ExcelDate_to_NormalDate(booking["Departure Day"]),
            isMainGuest: false
          };
          ageGroupBookings["Adult (18-35)"].push(additionalAdultInfo);
        }
      }    
  
      // Process children if present
      if (booking["Child Ages"] && Array.isArray(booking["Child Ages"])) {
        booking["Child Ages"].forEach((childAge, index) => {
          if (childAge >= 1 && childAge <= 17) {
            const childInfo = {
              bookingId: booking["Booking ID"],
              clientName: `Child ${index + 1}`,
              clientAge: childAge,
              arrivalDay: ExcelDate_to_NormalDate(booking["Arrival Day"]),
              departureDay: ExcelDate_to_NormalDate(booking["Departure Day"]),
              isMainGuest: false
            };
            ageGroupBookings["Children (1-17)"].push(childInfo);
          }
        });
      }
    });
  // Add summary statistics
  const summary = {
    totalBookings: relevantBookings.length,
    childrenCount: ageGroupBookings["Children (1-17)"].length,
    adultCount: ageGroupBookings["Adult (18-35)"].length,
    middleAgeCount: ageGroupBookings["Middle Age (36-64)"].length,
    elderlyCount: ageGroupBookings["Elderly (65+)"].length,
  };
  
  return {
    summary,
    bookings: ageGroupBookings,
  };
}


// Add to exports
function getBookingsByStatus(bookingsData, startDate, endDate) {
    // Convert input dates to Excel date format
    const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
    const endDate_inEdate = NormalDate_to_ExcelDate(endDate);
    
    // Filter bookings within the date range
    const filteredBookings = filter_bookingsData_byArrival(bookingsData, startDate_inEdate, endDate_inEdate);
    
    // Initialize object to store bookings by status
    const bookingsByStatus = {};
    
    // Categorize bookings by their status
    filteredBookings.forEach(booking => {
        const status = booking["Booking Status"];
        if (!bookingsByStatus[status]) {
            bookingsByStatus[status] = [];
        }
        bookingsByStatus[status].push(booking);
    });
    
    // Add count for each status
    const result = {};
    for (const status in bookingsByStatus) {
        result[status] = {
            bookings: bookingsByStatus[status],
            count: bookingsByStatus[status].length
        };
    }
    
    return result;
}


function generateBookingStatusChartData(year = null, month = null, statusLabels = null) {
    let startDate, endDate;

    if (year && month) {
        // For specific month
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0);
    } else if (year) {
        // For specific year
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
    } else {
        // For all time
        const years = [...new Set(bookingsData.map(booking => 
            new Date(ExcelDate_to_NormalDate(booking["Arrival Day"])).getFullYear()
        ))].sort((a, b) => a - b);
        
        startDate = new Date(years[0], 0, 1);
        endDate = new Date(years[years.length - 1], 11, 31);
    }

    const bookingsByStatus = getBookingsByStatus(bookingsData, startDate, endDate);
    
    if (!statusLabels) {
        // For pie chart data
        const labels = [];
        const data = [];

        for (const status in bookingsByStatus) {
            labels.push(status);
            data.push(bookingsByStatus[status].count);
        }

        return { labels, data };
    } else {
        // For stacked bar chart data
        const datasets = [];
        const statuses = Object.keys(bookingsByStatus);

        // Initialize datasets with proper colors
        const colors = {
            'Q': 'rgba(255, 206, 86, 0.7)',  // Yellow for Quote
            'E': 'rgba(255, 99, 132, 0.7)',   // Red for Quote Rejected
            'W': 'rgba(153, 102, 255, 0.7)',  // Purple for Waiting List
            'I': 'rgba(75, 192, 192, 0.7)',   // Teal for Internet
            'P': 'rgba(54, 162, 235, 0.7)',   // Blue for Provisional
            'C': 'rgba(255, 159, 64, 0.7)',   // Orange for Confirmed
            'D': 'rgba(201, 203, 207, 0.7)',  // Grey for Deposit Paid
            'U': 'rgba(0, 255, 0, 0.7)',      // Green for Fully Paid
            'A': 'rgba(0, 128, 0, 0.7)',      // Dark Green for Active
            'L': 'rgba(128, 128, 128, 0.7)',  // Grey for Left
            'N': 'rgba(139, 69, 19, 0.7)',    // Brown for No Show
            'F': 'rgba(255, 0, 0, 0.7)',      // Red for Faulty
            'X': 'rgba(220, 20, 60, 0.7)',    // Crimson for Cancelled
            'O': 'rgba(0, 0, 139, 0.7)',      // Dark Blue for Closed
            'R': 'rgba(128, 0, 0, 0.7)'       // Maroon for Restricted
        };

        statuses.forEach(status => {
            datasets.push({
                label: `${status} - ${statusLabels[status] || status}`,
                data: [],
                backgroundColor: colors[status] || 'rgba(128, 128, 128, 0.7)'
            });
        });

        let timePoints;
        if (year && month) {
            // Daily view for specific month
            const daysInMonth = new Date(year, month, 0).getDate();
            timePoints = Array.from({length: daysInMonth}, (_, i) => new Date(year, month - 1, i + 1));
        } else if (year) {
            // Monthly view for specific year
            timePoints = Array.from({length: 12}, (_, i) => new Date(year, i, 1));
        } else {
            // Yearly view
            const years = [...new Set(bookingsData.map(booking => 
                new Date(ExcelDate_to_NormalDate(booking["Arrival Day"])).getFullYear()
            ))].sort((a, b) => a - b);
            timePoints = years.map(y => new Date(y, 0, 1));
        }

        // Initialize data arrays
        datasets.forEach(dataset => {
            dataset.data = Array(timePoints.length).fill(0);
        });

        // Fill in the actual booking counts
        for (const status in bookingsByStatus) {
            const statusIndex = statuses.indexOf(status);
            if (statusIndex !== -1) {
                const bookings = bookingsByStatus[status].bookings;
                bookings.forEach(booking => {
                    const date = new Date(ExcelDate_to_NormalDate(booking["Arrival Day"]));
                    let index;
                    if (year && month) {
                        index = date.getDate() - 1;
                    } else if (year) {
                        index = date.getMonth();
                    } else {
                        index = timePoints.findIndex(tp => tp.getFullYear() === date.getFullYear());
                    }
                    if (index >= 0) {
                        datasets[statusIndex].data[index]++;
                    }
                });
            }
        }

        return { datasets };
    }
}

function generateRevenueChartData(year = null, month = null) {
    if (!year) {
        // Get all available years and their total revenue
        const years = [...new Set(bookingsData.map(booking => 
            new Date(ExcelDate_to_NormalDate(booking["Arrival Day"])).getFullYear()
        ))].sort((a, b) => a - b);

        const data = years.map(year => {
            const yearlyBookings = bookingsData.filter(booking => {
                const bookingYear = new Date(ExcelDate_to_NormalDate(booking["Arrival Day"])).getFullYear();
                return bookingYear === year;
            });
            
            const yearlyRevenue = yearlyBookings.reduce((total, booking) => {
                return total + (parseInt(booking["Total Actual Charge"]) / 100);
            }, 0);

            return yearlyRevenue;
        });

        return {
            labels: years.map(year => year.toString()),
            datasets: [{
                label: 'Yearly Revenue',
                data: data
            }]
        };

    } else if (!month) {
        // Get monthly revenue for specified year
        const monthlyData = Array(12).fill(0);
        
        bookingsData.forEach(booking => {
            const bookingDate = new Date(ExcelDate_to_NormalDate(booking["Arrival Day"]));
            if (bookingDate.getFullYear() === year) {
                const month = bookingDate.getMonth();
                monthlyData[month] += parseInt(booking["Total Actual Charge"]) / 100;
            }
        });

        return {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: `Monthly Revenue for ${year}`,
                data: monthlyData
            }]
        };

    } else {
        // Get daily revenue for specified month and year
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyData = Array(daysInMonth).fill(0);

        bookingsData.forEach(booking => {
            const bookingDate = new Date(ExcelDate_to_NormalDate(booking["Arrival Day"]));
            if (bookingDate.getFullYear() === year && bookingDate.getMonth() === month - 1) {
                const day = bookingDate.getDate() - 1; // Array is 0-based
                dailyData[day] += parseInt(booking["Total Actual Charge"]) / 100;
            }
        });

        return {
            labels: Array.from({length: daysInMonth}, (_, i) => (i + 1).toString()),
            datasets: [{
                label: `Daily Revenue for ${new Date(year, month - 1).toLocaleString('default', { month: 'long' })} ${year}`,
                data: dailyData
            }]
        };
    }
}

// console.log("ExcelDate_to_NormalDate : " + convertEminutesToNormalminute(62065440).year);
// console.log("ExcelDate_to_NormalDate : " + convertEminutesToNormalminute(62065440).month);
// console.log("ExcelDate_to_NormalDate : " + convertEminutesToNormalminute(62065440).day);
// console.log("ExcelDate_to_NormalDate : " + convertEminutesToNormalminute(62065440).time.hours);
// console.log("ExcelDate_to_NormalDate : " + convertEminutesToNormalminute(62065440).time.minutes);
// console.log("ExcelDate_to_NormalDate : " + convertNormalminuteToEminutes({
//   day: 1,
//   month: 1,
//   year: 2018,
//   time: {
//       hours: 0,
//       minutes: 0,
//   }}));

// Add to exports
export { 
  filter_bookingsData_byArrival,
  ExcelDate_to_NormalDate,
  NormalDate_to_ExcelDate,
  generate_Barchart_dashboard_1_inMonth,
  generate_Barchart_dashboard_1_inYear,
  generate_Barchart_dashboard_1_inYears,
  count_total_bookings,
  isBookedByMember,
  getTotalRooms,
  getMonthlyOccupancyAndADR,
  generateMemberVsGeneralData,
  calculateTotalActualCharge,
  generateProfitComparisonData,
  generateHourlyBookingData,
  getMonthlyBookingCounts,
  generateUnitPerformanceData,
  getAllClientBirthdays,
  getBookingsByAgeGroup,
  generateBookingStatusChartData,
  generateRevenueChartData
};


// This is how booking data looks like:
// "Booking ID": "-2147483647",
// "Booking Group ID": "-2147483647",
// "Booking Key": "RR00000001RR0001",
// "Booker ID": "-2147431704",
// "Guest ID": "-2147431704",
// "Creation Staff ID": "-2147431780",
// "Booking Status": "A",
// "Group Name": "",
// "Arrival Day": "45536",
// "Arrival Minute": "65572680",
// "Departure Day": "45543",
// "Departure Minute": "65582460",
// "Booking Unit ID": "-2147483647",
// "Unit Type ID": "-2147483647",
// "Adult Count": "2",
// "Number of Days": "7",
// "Do not disturb": "False",
// "Booker Rate ID": "-2147464871",
// "Guest Rate ID": "-2147464871",
// "Accommodation Total": "1400000",
// "Deposit Total": "1600000",
// "Effective Average Daily Rate": "200000",
// "Recommended Average Daily Rate": "200000",
// "Total Actual Charge": "1400000",
// "Total Recommended Charge": "1400000",
// "Guest Effective Average Daily Rate": "200000",
// "Guest Recommended Average Daily Rate": "200000",
// "Guest Total Actual Charge": "1400000",
// "Guest Total Recommended Charge": "1400000"
// "Child Ages" : [ 2, 4, 5]
// },
// {
// "Booking ID": "-2147483646",
// "Booking Group ID": "-2147483646",
// "Booking Key": "RR00000002RR0001",
// "Booker ID": "-2147431703",
// "Guest ID": "-2147431703",
// "Creation Staff ID": "-2147431780",
// "Booking Status": "A",
// "Group Name": "",
// "Arrival Day": "45538",
// "Arrival Minute": "65575560",
// "Departure Day": "45553",
// "Departure Minute": "65596860",
// "Booking Unit ID": "-2147483646",
// "Unit Type ID": "-2147483647",
// "Adult Count": "2",
// "Number of Days": "15",
// "Do not disturb": "False",
// "Booker Rate ID": "-2147464871",
// "Guest Rate ID": "-2147464871",
// "Accommodation Total": "3000000",
// "Deposit Total": "3200000",
// "Effective Average Daily Rate": "200000",
// "Recommended Average Daily Rate": "200000",
// "Total Actual Charge": "3000000",
// "Total Recommended Charge": "3000000",
// "Guest Effective Average Daily Rate": "200000",
// "Guest Recommended Average Daily Rate": "200000",
// "Guest Total Actual Charge": "3000000",
// "Guest Total Recommended Charge": "3000000"
// },

    // This is how client data looks like:
    //     "Client ID": "-2147431538",
    //     "First Name": "Liam",
    //     "Surname": "Smith",
    //     "Given Name": "Liam",
    //     "Gender": "M",
    //     "Birth Date": 32120,
    //     "Membership List": []
    // }, {
    //     "Client ID": "-2147431539",
    //     "First Name": "Noah",
    //     "Surname": "Williams",
    //     "Given Name": "Noah",
    //     "Gender": "M",
    //     "Birth Date": 36839,
    //     "Membership List": [-9108]
    // }, {
    //     "Client ID": "-2147431543",
    //     "First Name": "William",
    //     "Surname": "Jones",
    //     "Given Name": "William",
    //     "Gender": "M",
    //     "Birth Date": 32638,
    //     "Membership List": []