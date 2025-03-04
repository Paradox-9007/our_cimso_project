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

const API_KEY = 'AIzaSyAWDlc-sQZolxp6A_HwCTUxrA46_6Hnaw4';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

async function generateAiContent(SetPrompt, SystemInput) {
    try {
        const response = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${SetPrompt} ${SystemInput}`
                    }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        const candidates = data.candidates;

        // Ensure we have valid response data before returning
        if (!candidates || candidates.length === 0 || !candidates[0].content?.parts[0]?.text) {
            return 'No response from AI.';
        }

        // Return the text content directly once Promise is fulfilled
        return candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Error generating content:', error.message);
        throw new Error('Failed to generate content.');
    }
}

export { fetchClientRequest, fetchBookingsRequest, generateAiContent };