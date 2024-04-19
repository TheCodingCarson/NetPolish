// Devtools - Create Console Panel //
chrome.devtools.panels.create(
    "NetPolish",
    "/devtools/assets/images/icon128.png",
    "/devtools/devpanel.html", // HTML page for the content of the DevTools tab
    function(panel) {
        // Code invoked when the panel is created
    }
);