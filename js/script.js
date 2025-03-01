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


fetch("/dashboard-2/dashboard-2.html")
  .then((response) => response.text())
  .then((data) => {
      document.getElementById("dash-2").innerHTML = data;

      // Import the JS module dynamically
      import("/dashboard-2/dashboard-2.js")
      .catch((error) => console.error("Error importing the module:", error));
  })
  .catch((error) => console.error("Error loading the page:", error));

  fetch("/dashboard-3/dashboard-3.html")
  .then((response) => response.text())
  .then((data) => {
      document.getElementById("dash-3").innerHTML = data;

      // Import the JS module dynamically
      import("/dashboard-3/dashboard-3.js")
      .catch((error) => console.error("Error importing the module:", error));
  })
  .catch((error) => console.error("Error loading the page:", error));

  fetch("/dashboard-4/dashboard-4.html")
  .then((response) => response.text())
  .then((data) => {
      document.getElementById("dash-4").innerHTML = data;

      // Import the JS module dynamically
      import("/dashboard-4/dashboard-4.js")
      .catch((error) => console.error("Error importing the module:", error));
  })
  .catch((error) => console.error("Error loading the page:", error));


  fetch("/dashboard-5/dashboard-5.html")
  .then((response) => response.text())
  .then((data) => {
      document.getElementById("dash-5").innerHTML = data;

      // Import the JS module dynamically
      import("/dashboard-5/dashboard-5.js")
      .catch((error) => console.error("Error importing the module:", error));
  })
  .catch((error) => console.error("Error loading the page:", error));