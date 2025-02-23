const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();  // Load environment variables

const app = express();

// Enable CORS (Cross-Origin Resource Sharing)
app.use(cors());

// Enable JSON body parsing
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "../public")));

// Serve index.html on the root route "/"
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Fixed Base URL (Switch manually & restart `node server.js`)
const LIVE_API_URL = 'https://kyawswarheinm.com/api'; // Mock-up API
// const LIVE_API_URL = 'https://ixschool.cimso.xyz'; // CiMSO API

// Proxy API endpoint
app.post('/api/:filename', async (req, res) => {
    const { filename } = req.params;
    const requestBody = req.body;

    console.log(`Proxying request to ${LIVE_API_URL}/${filename}`);

    try {
        // Make a POST request to the live API
        const response = await fetch(`${LIVE_API_URL}/${filename}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': JSON.stringify({
                    "Client Login ID": "CiMSO.dev",
                    "Client Password": "CiMSO.dev",
                    "hg_pass": "nGXUF1i^57I^ao^o"
                }),
            },
            body: JSON.stringify(requestBody),
        });

        // Handle the response properly
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error(`Error fetching data: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch data from live API' });
    }
});

// Define the port
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
