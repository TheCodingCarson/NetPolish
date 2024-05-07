/* background.js
*
* Usage: Handles Main Background tasks - Main Service Worker
*
*/

// Declared Variables
let NetPolishInitialized = false;
const logCache = [];
let devLogging = false;

// NetPolish - Start Initialization
self.addEventListener('activate', event => {
    // Ensure Only Initialized Once
    if (!NetPolishInitialized) {
        InitializeNetPolish(event);
    }
});

// NetPolish - Initialization Tasks
function InitializeNetPolish(event) {

    logCache.length = 0; // Clear Remaining Log cache

    // -Initialize Listeners-
    // Wait for devmessaging.js
    chrome.runtime.onConnect.addListener(function(port) {
        if (port.name === "devtools-page") {
            port.onMessage.addListener(function(msg) {
                if (msg.action === "init") {
                    devLogging = true;
                    // Send cached logs to DevTools panel
                    port.postMessage({action: 'loadLogs', data: logCache});
                    logCache.length = 0; // Clear cache after sending
                }
            });
        }
    });
    // Log Messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === "log") {
            console.log(request.message);
        }
    });
    // Error Messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === "error") {
            console.error(request.message);
        }
    });

    // -Reset Required Local Storage Settings-
    resetVolumeBoosterStorage(event); // Clear Saved Tabs
    resetLocalDevStorage(event); // Clear Saved Dev Tabs

    // Continue After Import
}

// Initialize & Start URLWatcher - (Doesn't work in a function)
importScripts('/helpers/URLWatcher.js');

// InitializeNetPolishContinued - Continue Initialization After Import
if (!NetPolishInitialized) {
    InitializeNetPolishContinued();
}
function InitializeNetPolishContinued() {

    // Console Log - NetPolish Is Now Active!
    NetPolishInitialized = true;
    console.log('NetPolish: Is now active!');
}

// Helper Function - Volume Booster Clear Recently Closed Tab Saved Settings
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    // Construct the key used for storing the volume setting for this tab
    const key = `volumeForTab${tabId}`;

    // Remove the volume setting for the closed tab from storage
    chrome.storage.local.remove(key, function() {
        console.log(`NetPolish: VolumeBooster - Cleared volume setting for tab: ${tabId}`);
    });
});

// Helper Function - "Volume Booster" Clear Saved Tabs on (re)load
function resetVolumeBoosterStorage(event) {
    event.waitUntil(
        // Get all keys from storage
        chrome.storage.local.get(null, function(items) {
            const keysToRemove = Object.keys(items).filter(key => key.startsWith('volumeForTab'));
            if (keysToRemove.length > 0) {
                // Remove all keys that start with 'volumeForTab'
                chrome.storage.local.remove(keysToRemove, function() {
                    console.log(`NetPolish: VolumeBooster - Cleared leftover volume settings for tabs: ${keysToRemove.join(', ')}`);
                });
            } else {
                // No leftover keys to clear
            }
        })
    );
}

// Helper Function - "Dev Messaging" Clear Local Tab Dev Storage On (re)Load
function resetLocalDevStorage(event) {
    event.waitUntil(
        // Get all keys from storage
        chrome.storage.local.get(null, function(items) {
            const keysToRemove = Object.keys(items).filter(key => key.startsWith('tabDevConnections'));
            if (keysToRemove.length > 0) {
                // Remove all keys that start with 'tabDevConnections'
                chrome.storage.local.remove(keysToRemove, function() {
                    console.log(`NetPolish: Dev Messaging - Cleared leftover states for tabs: ${keysToRemove.join(', ')}`);
                });
            } else {
                // No leftover keys to clear
            }
        })
    );
}

// Function to handle and forward log messages
(function() {
    const oldLog = console.log;
    const oldError = console.error;
    const oldWarn = console.warn;
    const oldInfo = console.info;

    console.log = function(...args) {
        oldLog.apply(console, args);
        if (devLogging) {
        sendMessageToPanel('log', args, new Error().stack);
        } else {
            logCache.push({type: 'log', args: args, timestamp: new Date().toISOString()});
        }
    };

    console.error = function(...args) {
        oldError.apply(console, args);
        if (devLogging) {
        sendMessageToPanel('error', args, new Error().stack);
        } else {
            logCache.push({type: 'error', args: args, timestamp: new Date().toISOString()});
        }
    };

    console.warn = function(...args) {
        oldWarn.apply(console, args);
        if (devLogging) {
        sendMessageToPanel('warn', args, new Error().stack);
        } else {
            logCache.push({type: 'warn', args: args, timestamp: new Date().toISOString()});
        }
    };

    console.info = function(...args) {
        oldInfo.apply(console, args);
        if (devLogging) {
            sendMessageToPanel('info', args, new Error().stack);
        } else {
            logCache.push({type: 'info', args: args, timestamp: new Date().toISOString()});
        }
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