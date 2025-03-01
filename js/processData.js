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
    const excelStartDate = new Date(1900, 0, 1);
    const normalDate = new Date(excelStartDate.getTime() + (excelDate - 1) * 86400000);

    // Adjust to GMT+07:00, Bangkok Time Code
    const adjustedDate = new Date(normalDate);
    adjustedDate.setHours(adjustedDate.getHours() + 7);  // Adding 7 hours for GMT+07:00

    
    return adjustedDate.toDateString(); // From 45714 to  Wed Feb 26 2025
}



function NormalDate_to_ExcelDate(normalDate) {
    if (typeof normalDate === "string") {
        normalDate = new Date(normalDate);
    }
    const adjustedDate = new Date(normalDate);
    adjustedDate.setHours(adjustedDate.getHours() + 7);
    const excelStartDate = new Date(1900, 0, 1);
    
    const timeDiff = adjustedDate - excelStartDate;

    const excelDate = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;  // "Wed Feb 26 2025" or "Wed Feb 26 2025" to ExcelDate, 45714

    return excelDate;
}


function filter_bookingsData_byArrival(bookingsData, startDate_inEdate, endDate_inEdate) { // get bookings json and return json
    const filteredBookings = bookingsData.filter(booking => {
        const arrivalDate = parseInt(booking["Arrival Day"]);
        return arrivalDate >= startDate_inEdate && arrivalDate <= endDate_inEdate;
    });
    return filteredBookings;
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

function generate_Combochart_dashboard_4_occupancy_rate_adr(
    startDate,
    endDate
  ) {
    // Convert dates to Excel format if they're not already
    const startDate_inEdate =
      typeof startDate === "number"
        ? startDate
        : NormalDate_to_ExcelDate(startDate);
    const endDate_inEdate =
      typeof endDate === "number" ? endDate : NormalDate_to_ExcelDate(endDate);
   
    // Get total number of units available
    const totalUnits =
      filter_bookingsData_byUniqueUnit(bookingsData).totalUniqueUnits;
   
    // Initialize arrays for the chart data
    const dates = [];
    const occupancyRates = [];
    const averageDailyRates = [];
   
    // Calculate data for each day in the range
    for (
      let currentDate = startDate_inEdate;
      currentDate <= endDate_inEdate;
      currentDate++
    ) {
      // Get occupied units and calculate occupancy rate
      const occupiedUnitsData = getOccupiedUnits(bookingsData, currentDate);
      const occupancyRate =
        (occupiedUnitsData.totalOccupiedUnits / totalUnits) * 100;
   
      // Get average daily rate using the new function
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
      },
    };
  }

// ... existing code ...

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

console.log(currentDate);
console.log(currentDate_inEdate);

// Add to exports
export { 
  filter_bookingsData_byArrival,
  ExcelDate_to_NormalDate,
  NormalDate_to_ExcelDate,
  generate_Barchart_dashboard_1_inMonth,
  generate_Barchart_dashboard_1_inYear,
  generate_Barchart_dashboard_1_inYears,
  count_total_bookings,
  generate_Combochart_dashboard_4_occupancy_rate_adr,
  isBookedByMember,
  generateMemberVsGeneralData,
  calculateTotalActualCharge,
  generateProfitComparisonData
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