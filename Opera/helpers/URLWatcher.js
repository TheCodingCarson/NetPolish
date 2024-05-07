/* URLWatcher.js - Watches for URL changes and injects modules accordingly
*
* Imports can't be used as module is imported into background.js
*/

// Declaring
let hasInitializedWatcher = false;
let tabs = null;

// Listeners
chrome.runtime.onStartup.addListener(() => {
    console.log(`NetPolish: URLWatcher - Initializing...`);
    chrome.storage.local.clear(); // Clear storage on startup to prevent stale entries
    if (!hasInitializedWatcher) {
        hasInitializedWatcher = true;
        initializeTabs();
    }
});

async function initializeTabs() {
    tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {

        // Ignore Restricted Tabs
        if (!tab.url.startsWith('chrome://')) {
            console.log(`NetPolish: URLWatcher - Processing initial tab ID ${tab.id} with URL ${tab.url}`);
            chrome.storage.local.set({[tab.id]: tab.url}); // Save each tab's URL and ID
            injectModulesBasedOnURL(tab.id, tab.url);
        }
    });
}

// Detect URL Changes & Page Reload
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

    // Ignore Restricted Tabs
    if (!tab.url.startsWith('chrome://')) {
        let LogMessage = null;

        // URL Change
        if (changeInfo.url) {
            LogMessage = `NetPolish: URLWatcher - Detected URL change for Tab ID: ${tabId}`;
            chrome.storage.local.set({[tabId]: changeInfo.url}); // Update storage with new URL
            injectModulesBasedOnURL(tabId, changeInfo.url, false, LogMessage);

        // Page Reload
        } else if (changeInfo.status === 'complete') {
            LogMessage = `NetPolish: URLWatcher - Detected page reload for Tab ID: ${tabId}`;
            const TabReloaded = true;
            injectModulesBasedOnURL(tabId, changeInfo.url, TabReloaded, LogMessage);
        }

    }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo, tab) => {

    // Remove tab ID from storage when tab is closed
    chrome.storage.local.remove(String(tabId));
    console.log(`NetPolish: URLWatcher - Removed tab ID ${tabId} from storage`);
});

async function injectModulesBasedOnURL(tabId, url, TabReload = false, LogMessage) {
    
    if (TabReload) {
        // Tab Reload Method - Silent
        try {
            const response = await fetch(chrome.runtime.getURL('/modules/module_list.json'));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const moduleList = await response.json();

            // Loop through each module configuration object
            moduleList.modules.forEach((moduleConfig) => {
                Object.keys(moduleConfig).forEach(async moduleKey => {
                    const module = moduleConfig[moduleKey];
                    if (module.urls && module.urls.some(matchUrl => new RegExp(matchUrl).test(url))) {
                        
                        // If Url for Change or Reload is a Module URL Display "Detected Change/Reload" Log
                        console.log(LogMessage)

                        // Attempt Module Injection into Matched Tab & URL - Suppressing Errors (Check Causes Error)
                        try {
                            await InjectModule(module.modules, tabId, module.css);
                        } catch (error) {
                            // Suppress Error
                        }
                    }
                });
            });
        } catch (error) {
            // Suppress Error
        }

    } else {
        // Normal Method
        try {
            const response = await fetch(chrome.runtime.getURL('/modules/module_list.json'));
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const moduleList = await response.json();

            // Loop through each module configuration object
            moduleList.modules.forEach((moduleConfig) => {
                Object.keys(moduleConfig).forEach(async moduleKey => {
                    const module = moduleConfig[moduleKey];
                    if (module.urls && module.urls.some(matchUrl => new RegExp(matchUrl).test(url))) {
                        console.log(`NetPolish: URLWatcher - Module for Tab ${tabId} and URL ${url} Found!`);
                        console.log(`NetPolish: URLWatcher - Attempting injection for ${module.modules} in Tab ${tabId}`);
                        try {
                            await InjectModule(module.modules, tabId, module.css);
                        } catch (error) {
                            console.error(`NetPolish: URLWatcher - Error injecting module: ${error}`);
                        }
                    }
                });
            });
        } catch (error) {
            console.error(`NetPolish: URLWatcher - Error while injecting modules: ${error}`);
        }

    }
}

// Copy of Module_Injector.js (Without Exports)
async function InjectModule(moduleName, tabId, cssFileName = null) {
    const scriptFilePath = `/modules/${moduleName}/${moduleName}_ContentScript.js`;
    const exclusionPath = `/modules/${moduleName}/${moduleName}_Exclude.json`;
    const cssFilePath = cssFileName ? `/modules/${moduleName}/${cssFileName}` : null;
    const tabInfo = await chrome.tabs.get(tabId);
    let isDomainAllowed = null;

    // Attempt to load the exclusion list; assume allowed if not found
    try {
        const response = await fetch(chrome.runtime.getURL(exclusionPath));
        const exclusionData = await response.json();
        if (tabInfo.url) {

            // Ignore Restricted Tabs
            if (!tab.url.startsWith('chrome://')) {

                const url = new URL(tabInfo.url);
                if (exclusionData.domains.includes(url.hostname)) {
                    chrome.tabs.sendMessage(tabId, { type: "domainExclusion", moduleName: moduleName });
                    return 'Excluded Domain';
                } else {
                    chrome.tabs.sendMessage(tabId, { type: "domainAllowed", moduleName: moduleName });
                    isDomainAllowed = true;
                }

            }
            // Ignore Restricted Tabs
            return 'Excluded Domain';
        }
    } catch (error) {
        console.error(`NetPolish: URLWatcher - Error loading exclusion file for ${moduleName}: ${error}`);
    }

    // If Domain is allowed
    if (isDomainAllowed) {

        // Inject Module
        try {
            const alreadyInjected = await CheckModuleInject(moduleName, tabId);
            if (!alreadyInjected) {
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: [scriptFilePath]
                });
                console.log(`NetPolish: URLWatcher - ${moduleName} injected into tab ${tabId}`);
    
                // Inject CSS if specified
                if (cssFilePath) {
                    await chrome.scripting.insertCSS({
                        target: { tabId: tabId },
                        files: [cssFilePath]
                    });
                    console.log(`NetPolish: URLWatcher - CSS for ${moduleName} injected into tab ${tabId}`);
                }
    
                return true;
            } else {
                console.log(`NetPolish: URLWatcher - ${moduleName} already injected into tab ${tabId}`);
                return 'Already Injected';
            }
        } catch (error) {
            console.error(`NetPolish: URLWatcher - Failed to inject ${moduleName} into tab ${tabId}: ${error}`);
            return false;
        }

    }

    
}

// Copy of Module_InjectedCheck.js (Without Exports)
function CheckModuleInject(moduleName, tabId) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, { type: "ping", moduleName: moduleName }, response => {
            if (chrome.runtime.lastError) {
                // If no reply resolve the promise with `false` - Not an error just not injected currently
                console.log(`NetPolish: URLWatcher - Module ${moduleName} is not injected in tab ${tabId}`);
                resolve(false);
            } else {
                // If the message was successful and we got a response
                console.log(`NetPolish: URLWatcher - Module ${moduleName} is already injected in tab ${tabId}`);
                resolve(true);
            }
        });
    });
}