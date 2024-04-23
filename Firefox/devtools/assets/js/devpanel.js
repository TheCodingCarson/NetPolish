function logMessage(message) {
    const logElement = document.getElementById('log');
    // Ensure new messages are appended in a way that keeps the log readable
    logElement.innerHTML += `<div>${message}</div>`;
    // Auto-scroll to the latest message
    logElement.scrollTop = logElement.scrollHeight;
}

// Establish a connection to the background script using a named port
let port = browser.runtime.connect({name: "NetPolish-Devtools-Panel"});

// Listen for messages from the background script
port.onMessage.addListener((msg) => {
    // Check the type of message and call logMessage or handle differently if needed
    if (msg.type === "log" || msg.type === "error") {
        // Combine the type and message to provide context in the log
        const formattedMessage = `[${msg.type.toUpperCase()}] ${msg.message}`;
        logMessage(formattedMessage);
    }
});

// Optionally, if you need to send messages to the background script, use port.postMessage