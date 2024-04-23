// Module_InjectedCheck.js
//
// Checks if requested Module has been injected into current tab
// Return True or False
//

export function CheckModuleInject(moduleName, tabId) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, { type: "ping", moduleName: moduleName }, response => {
            if (chrome.runtime.lastError) {
                // If no reply resolve the promise with `false` - Not an error just not injected currently
                console.log(`NetPolish: Module ${moduleName} is not injected in tab ${tabId}`);
                resolve(false);
            } else {
                // If the message was successful and we got a response
                console.log(`NetPolish: Module ${moduleName} is already injected in tab ${tabId}`);
                resolve(true);
            }
        });
    });
}