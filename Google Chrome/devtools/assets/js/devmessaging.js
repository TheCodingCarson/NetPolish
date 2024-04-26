/* devmessaging.js
* Usage: Centralizes and simplifies the handling messages of DevTools functionalities
* including creation of tab specific and global connections
*/

// Variable to store tab connections
let tabDevConnections = {};

// Connection listener for global and tab-specific messaging
chrome.runtime.onConnect.addListener(port => {
    if (port.name === "NetPolish-Devtools-Global") {

        // Handle global connections
        port.onMessage.addListener(message => handleGlobalMessage(message.message));

    } else if (port.name === "NetPolish-Devtools-Tabs") {

        // Ensure connection is being made from a valid tab context
        if (chrome.devtools.inspectedWindow.tabId) {
            let tabId = chrome.devtools.inspectedWindow.tabId;
            tabDevConnections[tabId] = port;

            port.onMessage.addListener(message => handleTabMessage(tabId, message.message));
            port.onDisconnect.addListener(() => {
                console.log(`NetPolish: DevMessaging - Disconnecting tab ${tabId}`);
                delete tabDevConnections[tabId];
                chrome.storage.local.set({ 'NetPolish: DevMessaging - tabDevConnections': tabDevConnections });
            });
        } else {
            console.error("NetPolish: DevMessaging - Tab-specific connection attempted without tab context.");
        }
    }
});

// Handle global messages
function handleGlobalMessage(message) {

    console.log(`NetPolish: DevMessaging - Handling global message: ${message}`);

}

// Handle tab-specific messages
function handleTabMessage(tabId, message) {

    console.log(`NetPolish: DevMessaging - Handling message for tab ${tabId}: ${message}`);

}

// Function to handle and forward log messages
(function() {
    const oldLog = console.log;
    const oldError = console.error;
    const oldWarn = console.warn;
    const oldInfo = console.info;

    console.log = function(...args) {
        oldLog.apply(console, args);
        sendMessageToPanel('log', args, new Error().stack);
    };

    console.error = function(...args) {
        oldError.apply(console, args);
        sendMessageToPanel('error', args, new Error().stack);
    };

    console.warn = function(...args) {
        oldWarn.apply(console, args);
        sendMessageToPanel('warn', args, new Error().stack);
    };

    console.info = function(...args) {
        oldInfo.apply(console, args);
        sendMessageToPanel('info', args, new Error().stack);
    };

    function sendMessageToPanel(type, args, stack) {
        const stackLines = stack.split('\n');
        // This regex extracts the path and line number from the stack trace
        const sourceRegex = /(\w+:\/\/\/?.+\/)([^\/]+):(\d+):(\d+)/;
        const match = stackLines[2] ? stackLines[2].match(sourceRegex) : null;
    
        chrome.runtime.sendMessage({
            action: 'forwardLog',
            logData: {
                type: type,
                message: args.join(' '),
                timestamp: new Date().toISOString(),
                file: match ? `${match[2]}:${match[3]}` : 'unknown',  // Only file name and line
                fullPath: match ? `${match[1]}${match[2]}:${match[3]}` : 'unknown'  // Full path used for hyperlink
            }
        });
    }
})();