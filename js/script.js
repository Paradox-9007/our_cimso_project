// script.js
fetch("/home/home.html")
.then((response) => response.text())
.then((data) => {
  document.getElementById("loaded-home").innerHTML = data;
})
.catch((error) => console.error("Error loading the HTML page:", error));


fetch("/dashboard-1/dashboard-1.html")
  .then((response) => response.text())
  .then((data) => {
      document.getElementById("dash-1").innerHTML = data;

      // Import the JS module dynamically
      import("/dashboard-1/dashboard-1.js")
      .catch((error) => console.error("Error importing the module:", error));
  })
  .catch((error) => console.error("Error loading the page:", error));