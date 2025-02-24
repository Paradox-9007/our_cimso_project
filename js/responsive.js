window.addEventListener("scroll", () => {
    let scrollPosition = window.scrollY; // Get scroll position
    let typingText = document.getElementById("typing-text"); // Select text element

    // Define the scroll range where animation happens (200px to 800px)
    let minScroll = 60;
    let maxScroll = 500;
    console.log(scrollPosition);
    // Define the top position range (25% to 60%)
    let minTop = 25;
    let maxTop = 60;

    if (scrollPosition <= minScroll) {
        typingText.style.top = `${minTop}%`; // Fix at 25% before scroll reaches 200px
    } else if (scrollPosition >= maxScroll) {
        typingText.style.top = `${maxTop}%`; // Fix at 60% after scroll passes 800px
    } else {
        // Smoothly interpolate the top position
        let percentage = (scrollPosition - minScroll) / (maxScroll - minScroll); // Normalize to 0-1 range
        let newTop = minTop + percentage * (maxTop - minTop); // Calculate interpolated top position
        typingText.style.top = `${newTop}%`;
    }
});

document.getElementById("scrollButton").addEventListener("click", () => {
    window.scrollTo({
        top: window.innerHeight, // Scroll directly to 100vh
        behavior: "smooth"
    });
});

document.querySelectorAll(".TOC_paper_left, .TOC_paper_right").forEach(section => {
    section.addEventListener("click", function() {
        const targetId = this.getAttribute("data-target"); // Get the section ID to go to
        if (targetId) {
            document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
        }
    });
});
