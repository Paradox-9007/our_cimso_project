// apiCaller.js

async function fetchData() {
    const apiResponseDiv = document.getElementById("apiResponse");
    try {
        // Simplified fetch call to the backend API
        const response = await fetch("http://localhost:3001/api/get_client_request", {
            method: "POST",
            headers: {
                "Authorization": '{"Client Login ID":"CiMSO.dev","Client Password":"CiMSO.dev","hg_pass":"nGXUF1i^57I^ao^o"}',
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                hg_code: "ixschool",
                payload: {}
            })
        });

        // Check if the response is successful
        if (response.ok) {
            // Extract the JSON body
            const data = await response.json();
            
            // Return the data to the calling function
            return data;
        } else {
            throw new Error(`API responded with status ${response.status}`);
        }
    } catch (error) {
        apiResponseDiv.innerHTML = `<p>Failed to fetch data: ${error.message}</p>`;
        throw error; // Re-throw error to handle it in the calling function
    }
}

export { fetchData };
