// script.js
async function loadDashboards() {
    try {
        // Load home page first
        const homeResponse = await fetch("/home/home.html");
        const homeData = await homeResponse.text();
        document.getElementById("loaded-home").innerHTML = homeData;

        // Array of dashboard configurations
        const dashboards = [
            { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, 
            { id: 5 }, { id: 6 }, { id: 7 }, { id: 8 }, { id: 9 }
        ];

        // Load dashboards sequentially
        for (const dashboard of dashboards) {
            try {
                const response = await fetch(`/dashboard-${dashboard.id}/dashboard-${dashboard.id}.html`);
                const data = await response.text();
                document.getElementById(`dash-${dashboard.id}`).innerHTML = data;

                // Import JS module
                await import(`/dashboard-${dashboard.id}/dashboard-${dashboard.id}.js`);
            } catch (error) {
                console.error(`Error loading dashboard ${dashboard.id}:`, error);
            }
        }
    } catch (error) {
        console.error("Error in loadDashboards:", error);
    }
}

// Initialize loading
loadDashboards();