document.getElementById("fetchButton").addEventListener("click", async () => {
    const apiResponseDiv = document.getElementById("apiResponse");

    try {
        // Simplified fetch call to the backend API (proxy)
        const response = await fetch("/api/get_client_request", {
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

            // Log the data to the console to inspect the API response
            console.log(data);

            // Assuming the response contains a 'payload' property or similar
            apiResponseDiv.innerHTML = `<p>${JSON.stringify(data.payload)}</p>`;
        } else {
            apiResponseDiv.innerHTML = `<p>Error: ${response.statusText}</p>`;
        }
    } catch (error) {
        apiResponseDiv.innerHTML = `<p>Failed to fetch data: ${error.message}</p>`;
    }
});
