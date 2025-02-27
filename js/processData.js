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

function BookingsData_filtered_byArrival(bookingsData, startDate_inEdate, endDate_inEdate) { // get bookings json and return json
    const filteredBookings = bookingsData.filter(booking => {
        const arrivalDate = parseInt(booking["Arrival Day"]);
        return arrivalDate >= startDate_inEdate && arrivalDate <= endDate_inEdate;
    });
    return filteredBookings;
}

function Dashboard_1_Barchart_inMonth(month, year) {
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    
    const labels = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
    
    const data = labels.map(day => {
        const startDate = new Date(year, month - 1, day);
        const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
        
        // Count bookings with arrivals on this exact day
        return BookingsData_filtered_byArrival(bookingsData, startDate_inEdate, startDate_inEdate).length;
    });
    
    return [labels, data];
}



function Dashboard_1_Barchart_inYear(year) {
    const labels = Array.from({ length: 12 }, (_, i) => 
        new Date(year, i).toLocaleString('en-US', { month: 'short' })
    );
    
    const data = labels.map((_, index) => {
        const startDate = new Date(year, index, 1);
        const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
        
        const endDate = new Date(year, index + 1, 0);
        const endDate_inEdate = NormalDate_to_ExcelDate(endDate);
        
        return BookingsData_filtered_byArrival(bookingsData, startDate_inEdate, endDate_inEdate).length;
    });
    
    return [labels, data];
}


function Dashboard_1_Barchart_inYears() {
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
        
        return BookingsData_filtered_byArrival(bookingsData, startDate_inEdate, endDate_inEdate).length;
    });

    const labels = years;

    return [labels, data];
}




function get_totalbookings(year, month = null) {
    if (!year) {
        console.error("Year is required for fetching total bookings.");
        return 0;
    }

    if (month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        
        const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
        const endDate_inEdate = NormalDate_to_ExcelDate(endDate);
        
        return BookingsData_filtered_byArrival(bookingsData, startDate_inEdate, endDate_inEdate).length;
    } else {
        // Get the start and end dates for the entire year
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        
        const startDate_inEdate = NormalDate_to_ExcelDate(startDate);
        const endDate_inEdate = NormalDate_to_ExcelDate(endDate);
        
        return BookingsData_filtered_byArrival(bookingsData, startDate_inEdate, endDate_inEdate).length;
    }
}

console.log(currentDate);
console.log(currentDate_inEdate);

export { 
    Dashboard_1_Barchart_inMonth,
    Dashboard_1_Barchart_inYear,
    Dashboard_1_Barchart_inYears,
    get_totalbookings
};