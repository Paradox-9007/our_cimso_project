async function fetchData(endpoint) {
    try {
        const response = await fetch(`https://www.kyawswarheinm.com/api/${endpoint}`, {
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

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();

        return data.payload || [];
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        throw error;
    }
}

async function fetchClientRequest() {
    return fetchData("get_client_request");
}

async function fetchBookingsRequest() {
    return fetchData("get_bookings_request");
}

export { fetchClientRequest, fetchBookingsRequest };

