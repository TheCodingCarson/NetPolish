/* devpanel.js
*
* Usage: Handles Javascript for UI Elements In devpanel.html
*
*/

// Declared Variables
let globalPort = null;
let tabPort = null;
let currentTabID = null;

// Initialize tab-specific messaging only if we have a valid tab context
function initTabSpecificMessaging() {
    currentTabID = chrome.devtools.inspectedWindow.tabId;
    if (currentTabID) {
        tabPort = chrome.runtime.connect({ name: "NetPolish-Devtools-Tabs" });
        
        // Send Tab Connected Message
        if (tabPort) {
            sendTabDevMessage("NetPolish: Dev Panel - New Tab Connected!")
        } else {
            console.error("NetPolish: Dev Panel - Cannot establish tab-specific messaging without a tab Port.");
        }

    } else {
        console.error("NetPolish: Dev Panel - Cannot establish tab-specific messaging without a tab context.");
    }
}

// Call initialization function when DevTools are opened and ready
document.addEventListener('DOMContentLoaded', function() {
    initTabSpecificMessaging();

    // Load User Preferences
    chrome.storage.local.get('devPanelSettings', function(result) {
        if (result.devPanelSettings) {
            const settings = result.devPanelSettings;
            if (settings.selectedFont) {
                document.getElementById('fontSelector').value = settings.selectedFont;
                updateLogFont(settings.selectedFont);
            }
            if (settings.selectedTimeFormat) {
                document.getElementById('timeFormatSelector').value = settings.selectedTimeFormat;
            }
        }
    });
});

// Handle incoming store logs from "background.js"
chrome.runtime.connect({name: "devtools-page"}).postMessage({action: "init"});
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'loadLogs') {
        message.data.forEach(log => {
            addLogEntry(log);
        });
    }
});

// Change Debug Log Panel Font
function updateLogFont(font) {
    const logContainer = document.getElementById('devLogPanelOutput');
    logContainer.style.fontFamily = font;
}

function formatTimestamp(dateString, format) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: format === '12h'
    });
}

function sendTabDevMessage(tabMessage) {
    if (currentTabID) {
        tabPort.postMessage({tabId: currentTabID, message: tabMessage});
    } else if (!tabPort) {
        console.error("NetPolish: Dev Panel - Failed sending Tab Dev Message 'tabPort' wasn't found");
    } else {
        console.error("NetPolish: Dev Panel - Failed sending Tab Dev Message 'tabId' wasn't found");
    }
}

// Handle Dev log messages that include log data
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'forwardLog') {
        addLogEntry(message.logData);
    }
});

function addLogEntry(logData) {
    chrome.storage.local.get('devPanelSettings', function(settings) {
        const timeFormat = settings.devPanelSettings ? settings.devPanelSettings.selectedTimeFormat : '24h';
        const formattedTime = formatTimestamp(logData.timestamp, timeFormat);

        const logContainer = document.getElementById('devLogPanelOutput');
        const entry = document.createElement('div');
        entry.innerHTML = `<a class="logtimestamp">[${formattedTime}]</a> <a class="${logData.type.toLowerCase()}">${logData.type.toUpperCase()}: ${logData.message}</a><a href="target="_blank" class="loglink">${logData.file}</a>`;
        entry.className = 'log-entry';
        logContainer.appendChild(entry);
    });
}


// ----------------------- \\

// Handle "General" being Clicked
document.getElementById('ShowDevToolsGeneralContainer').addEventListener('click', function() {
    openMainDevToolContainer("DevToolsGeneralTabContainer", (document.getElementById("ShowDevToolsGeneralContainer")));
});

// Handle "Dev Tools Logs" being Clicked
document.getElementById('ShowDevToolsLogsTabContainer').addEventListener('click', function() {
    openMainDevToolContainer("DevToolsLogsTabContainer", (document.getElementById("ShowDevToolsLogsTabContainer")));
});

// Handle "Dev Tools Settings" being Clicked
document.getElementById('ShowDevToolsSettingsTabContainer').addEventListener('click', function() {
    openMainDevToolContainer("DevToolsSettingsTabContainer", (document.getElementById("ShowDevToolsSettingsTabContainer")));
});

// Open Options.html when "Open Settings" is Clicked
document.getElementById('OpenSettings').addEventListener('click', function() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
});

//Show Default Main Devtool Container
ClickGeneralDevSidebarButton();

// Open "devtoolscontainer" that matches event
function openMainDevToolContainer(devToolsContainer, pressedButtonElement) {
    // Declare all variables
    var i, devpaneltabcontent, devpaneltablinks;
  
    // Get all elements with class="devtools-tab-content" and hide them
    devpaneltabcontent = document.getElementsByClassName("devtools-tab-content");
    for (i = 0; i < devpaneltabcontent.length; i++) {
        devpaneltabcontent[i].className = "devtools-tab-content";
    }
  
    // Get all elements with class="devpanel-tablink" and remove the class "active"
    devpaneltablinks = document.getElementsByClassName("devpanel-tablink");
    for (i = 0; i < devpaneltablinks.length; i++) {
        devpaneltablinks[i].className = "devpanel-tablink";
    }
  
    // Show the current tab, and add an "show" class to the button that opened the tab
    document.getElementById(devToolsContainer).className = "devtools-tab-content show";
    pressedButtonElement.className = "devpanel-tablink active";
}

// Click "General Button in Dev Panel"
function ClickGeneralDevSidebarButton() {
document.getElementById("ShowDevToolsGeneralContainer").click();
}

// ------- User Settings ------- \\

// Save Settings in a Nested Object - devPanelSettings
function saveSettings() {
    const font = document.getElementById('fontSelector').value;
    const timeFormat = document.getElementById('timeFormatSelector').value;
    chrome.storage.local.set({
        'devPanelSettings': {
            'selectedFont': font,
            'selectedTimeFormat': timeFormat
        }
    });
}

document.getElementById('fontSelector').addEventListener('change', saveSettings);
document.getElementById('timeFormatSelector').addEventListener('change', saveSettings);