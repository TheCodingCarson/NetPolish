// Devtools - Create Console Panel //
/* devpanel.js
*
* Usage: Handles Dev Tasks/Functions
*
*/

// Create Dev Panel
chrome.devtools.panels.create(
    "NetPolish",
    "/devtools/assets/images/icon128.png",
    "/devtools/devpanel.html",
);

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