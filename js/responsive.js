
const dashboards = [
    "Monthly Arrival Stats", "Member & General Arrivals", "Today's Arrivals/Departures",
    "Monthly Occupancy & ADR", "Guest Birthdays", "Arrival Age Groups",
    "Monthly Cancellation Stats", "Most Booked Units", "Total Income"
];

const homeBtn = document.getElementById("homeBtn");
const dashboardBtn = document.getElementById("dashboardBtn");
const dashboardContainer = document.getElementById("dashboardContainer");
const dashboardDropdown = document.getElementById("dashboardDropdown"); // Get the dropdown here

let list_of_selectedDashboard = [];
let currentDashboardIndex = -1; // Initialize to -1 to prevent errors
let currentSection = "homepage"; // Track current section

function showSection(sectionId) {
    console.log("sectionId:", sectionId);
    const section = document.getElementById(sectionId);
    currentSection = sectionId; // Update current section

    if (section) {
        document.querySelectorAll("section").forEach(sec => sec.style.display = "none");
        section.style.display = "block";
    } else {
        console.error(`Section with ID ${sectionId} not found`);
    }

    document.querySelectorAll("#dashboardContainer span").forEach(navItem => {
        navItem.classList.remove("active");
    });

    if (sectionId === "homepage") {
        homeBtn.classList.add("active");
    } else {
        homeBtn.classList.remove("active");
        const navItem = Array.from(dashboardContainer.children).find(
            item => item.dataset.section === sectionId
        );
        if (navItem) {
            navItem.classList.add("active");
        }
    }
}

function populateDashboardDropdown() {
    dashboardDropdown.innerHTML = "";
    dashboards.forEach(dashboard => {
        const span = document.createElement("span");
        span.textContent = dashboard;
        span.dataset.section = dashboard;
        span.id = 'dropdownSpan';
        span.addEventListener("click", () => selectDashboard(dashboard));
        dashboardDropdown.appendChild(span);
    });
}

function selectDashboard(selectedDashboard) {
    showSection(selectedDashboard);

    if (!list_of_selectedDashboard.includes(selectedDashboard)) {
        list_of_selectedDashboard.push(selectedDashboard);

        let newNavItem = document.createElement("span");
        newNavItem.textContent = selectedDashboard;
        newNavItem.dataset.section = selectedDashboard;
        
        // Inside the selectDashboard function, update the click event handler for the close button
        newNavItem.addEventListener("click", (event) => {
            if (event.target === newNavItem && event.offsetX > newNavItem.offsetWidth - 20) {
                event.stopPropagation();
                
                // Store the current index before any modifications
                const currentIndex = list_of_selectedDashboard.indexOf(selectedDashboard);
                let nextDashboard = null;
        
                // Determine next dashboard before any removals
                if (currentSection === selectedDashboard) {
                    if (currentIndex === list_of_selectedDashboard.length - 1) {
                        // If it's the last dashboard, go to the previous one
                        nextDashboard = list_of_selectedDashboard[currentIndex - 1];
                    } else {
                        // Go to the next dashboard
                        nextDashboard = list_of_selectedDashboard[currentIndex + 1];
                    }
                }
        
                // Remove from list and DOM
                list_of_selectedDashboard.splice(currentIndex, 1);
                newNavItem.remove();
        
                // Add back to dropdown
                const span = document.createElement("span");
                span.textContent = selectedDashboard;
                span.dataset.section = selectedDashboard;
                span.id = 'dropdownSpan';
                span.addEventListener("click", () => selectDashboard(selectedDashboard));
                dashboardDropdown.appendChild(span);
        
                // Switch to next dashboard if current one was active
                if (nextDashboard) {
                    showSection(nextDashboard);
                    currentDashboardIndex = list_of_selectedDashboard.indexOf(nextDashboard);
                } else if (list_of_selectedDashboard.length === 0) {
                    // If no dashboards left, go to homepage
                    showSection("homepage");
                    currentDashboardIndex = -1;
                }
        
                // Update indexes
                Array.from(dashboardContainer.children).forEach((navItem, idx) => {
                    if (navItem.id !== "dashboardBtn") {
                        navItem.dataset.index = idx - 1;
                    }
                });
            } else {
                event.stopPropagation();
                selectDashboard(selectedDashboard);
            }
        });
        dashboardContainer.appendChild(newNavItem);
    }

        // Update the current index to the newly selected dashboard 1
    currentDashboardIndex = list_of_selectedDashboard.indexOf(selectedDashboard);

        // **Reorder indexes based on their order in list_of_selectedDashboard**
    Array.from(dashboardContainer.children).forEach((navItem, index) => {
        if (navItem.id !== "dashboardBtn") {
            navItem.dataset.index = index - 1;
        }
    });

    // Highlight the active dashboard
    document.querySelectorAll("#dashboardContainer span").forEach(navItem => {
        navItem.classList.remove("active");
    });

        // Find the navItem by data-section and add the active class
    const activeNavItem = Array.from(dashboardContainer.children).find(
        item => item.dataset.section === selectedDashboard
    );
    if (activeNavItem) {
        activeNavItem.classList.add("active");
    }

        // Remove the selected dashboard from the dropdown
    const selectedSpan = dashboardDropdown.querySelector(`[data-section="${selectedDashboard}"]`);
    if (selectedSpan) selectedSpan.remove();

    dashboardDropdown.style.display = "none";
}

function handleKeyPress(event) {
    const key = event.key;

    if (key >= "1" && key <= "9") {
        const index = parseInt(key) - 1;
        if (index < list_of_selectedDashboard.length) {
            currentDashboardIndex = index;
            updateDashboardView();
        }
    } else if (key === "a" || key === "A") {
        if (currentDashboardIndex > 0) {
            currentDashboardIndex--;
            updateDashboardView();
        }
    } else if (key === "d" || key === "D") {
        if (currentDashboardIndex < list_of_selectedDashboard.length - 1) {
            currentDashboardIndex++;
            updateDashboardView();
        }
    }
}

function updateDashboardView() {
    if (currentDashboardIndex >= 0 && currentDashboardIndex < list_of_selectedDashboard.length) {
        const selectedDashboard = list_of_selectedDashboard[currentDashboardIndex];
        showSection(selectedDashboard);
    }
}

dashboardBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    dashboardDropdown.style.display = dashboardDropdown.style.display === "flex" ? "none" : "flex";
});

document.addEventListener("click", (event) => {
    if (!dashboardDropdown.contains(event.target) && event.target !== dashboardBtn) {
        dashboardDropdown.style.display = "none";
    }
});

document.addEventListener("keydown", handleKeyPress);
    homeBtn.addEventListener("click", () => {
    showSection("homepage");
    currentDashboardIndex = -1; // Reset index
});


const dashboardMapping = {
    'view-report-1': 'Monthly Arrival Stats',
    'view-report-2': 'Member & General Arrivals',
    'view-report-3': "Today's Arrivals/Departures",
    'view-report-4': 'Monthly Occupancy & ADR',
    'view-report-5': 'Guest Birthdays',
    'view-report-6': 'Arrival Age Groups',
    'view-report-7': 'Monthly Cancellation Stats',
    'view-report-8': 'Most Booked Units',
    'view-report-9': 'Total Income'
};

// Add this function before the export statement
function initializeViewReportButtons() {
    Object.entries(dashboardMapping).forEach(([buttonId, dashboardName]) => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                selectDashboard(dashboardName);
            });
        }
    });
}


initializeViewReportButtons();
populateDashboardDropdown();
showSection("homepage");

function getCurrentSection() {
    return currentSection;
}

export { getCurrentSection };