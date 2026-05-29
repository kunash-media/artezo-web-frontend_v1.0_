document.addEventListener("DOMContentLoaded", () => {
fetch("/Header/header.html")
    .then((response) => {
      if (!response.ok) throw new Error("Header file not found");
      return response.text();
    })
    .then((html) => {
      // Insert header HTML at the very beginning of body
      document.body.insertAdjacentHTML("afterbegin", html);

      // Make sure header CSS is loaded (if not already linked in <head>)
      if (!document.querySelector('link[href="/header/header.css"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/header/header.css";
        document.head.appendChild(link);
      }

      // Now that the HTML is in the DOM → initialize the header's behavior
      if (typeof initializeHeader === "function") {
        initializeHeader();
      } else {
        // Safety fallback in case header.js loads slower
        const interval = setInterval(() => {
          if (typeof initializeHeader === "function") {
            initializeHeader();
            clearInterval(interval);
          }
        }, 100);
      }
    })
    .catch((err) => {
      console.error("Failed to load header:", err);
    });
});