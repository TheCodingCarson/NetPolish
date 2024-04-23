// - Background Stuff - //

// Create DevPanel
let devToolsConnections = {};
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "NetPolish-Devtools-Panel") {
        let tabId = port.sender.tab.id;
        devToolsConnections[tabId] = port;

        port.onDisconnect.addListener(() => {
            delete devToolsConnections[tabId];
        });
    }
});

// Volume Booster- Clear Saved Tabs on (re)load
self.addEventListener('activate', event => {
    event.waitUntil(
        // Get all keys from storage
        chrome.storage.local.get(null, function(items) {
            const keysToRemove = Object.keys(items).filter(key => key.startsWith('volumeForTab'));
            if (keysToRemove.length > 0) {
                // Remove all keys that start with 'volumeForTab'
                chrome.storage.local.remove(keysToRemove, function() {
                    console.log(`NetPolish: Cleared leftover volume settings for tabs: ${keysToRemove.join(', ')}`);
                    console.log('NetPolish: Is now active!');
                });
            } else {
                // No leftover keys to clear
                console.log('NetPolish: Is now active!');
            }
        })
    );
});

// Volume Booster - Clear Closed Tabs Cached Settings //
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    // Construct the key used for storing the volume setting for this tab
    const key = `volumeForTab${tabId}`;

    // Remove the volume setting for the closed tab from storage
    chrome.storage.local.remove(key, function() {
        console.log(`Cleared volume setting for tab: ${tabId}`);
    });
});