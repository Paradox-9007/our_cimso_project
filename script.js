// script.js

























// import { fetchData } from './apiCaller.js';
//     const apiResponseDiv = document.getElementById("apiResponse");
    
//     try {
//         // Fetch the data using the fetchData function from apiCaller.js
//         const data = await fetchData();

//         // Log the data to check if it's correct
//         console.log(data);

//         // Process the data here (e.g., filtering, calculations)
//         if (data && data.payload) {
//             // For example, you can log the payload or perform further processing
//             const processedData = processApiData(data.payload); // Call your own processing function

//             // Display the processed data
//             console.log(processedData);
//             apiResponseDiv.innerHTML = `<p>${processedData}</p>`;
//         } else {
//             apiResponseDiv.innerHTML = `<p>No payload data found.</p>`;
//         }
//     } catch (error) {
//         console.error("Error:", error.message);
//     };

// // Example of a data processing function
// function processApiData(payload) {
//     // Process the raw API data here (this is just an example)
//     // For instance, you can sum up values, filter, or format the data
//     return `Processed data: ${JSON.stringify(payload)}`;
// }
