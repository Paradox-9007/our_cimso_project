
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

            // Create and append the new dashboard item only if it doesn't exist
            let newNavItem = document.createElement("span");
            newNavItem.textContent = selectedDashboard;
            newNavItem.dataset.section = selectedDashboard;
            newNavItem.addEventListener("click", (event) => {
                event.stopPropagation();
                selectDashboard(selectedDashboard); // Corrected: Pass selectedDashboard
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

    populateDashboardDropdown();
    showSection("homepage");

    function getCurrentSection() {
        return currentSection;
    }

export { getCurrentSection };