// Module_Injector.js
//
// Injects requested Module into current tab (Dynamically creating filepath)
//

//Imports
import { CheckModuleInject } from '/helpers/Module_InjectedCheck.js';

export async function InjectModule(moduleName, tabId) {
    const filePath = `/modules/${moduleName}/${moduleName}_ContentScript.js`;
    const exclusionPath = `/modules/${moduleName}/${moduleName}_Exclude.json`;
    const tabInfo = await chrome.tabs.get(tabId);

    // Load the exclusion list and check the domain
    const response = await fetch(chrome.runtime.getURL(exclusionPath));
    const exclusionData = await response.json();
    if (tabInfo.url) {
        const url = new URL(tabInfo.url);
        if (exclusionData.domains.includes(url.hostname)) {
            chrome.tabs.sendMessage(tabId, { type: "domainExclusion", moduleName:  moduleName });
            return 'Excluded Domain';
        }
        else {
            chrome.tabs.sendMessage(tabId, { type: "domainAllowed", moduleName:  moduleName });
        }
    }

    // If Domain is allowed Inject Module
    try {
        const alreadyInjected = await CheckModuleInject(moduleName, tabId);
        if (!alreadyInjected) {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: [filePath]
            }, () => {
                console.log(`NetPolish: ${moduleName} injected into tab ${tabId}`);
                return true;
            });
        } else {
            console.log(`NetPolish: ${moduleName} already injected into tab ${tabId}`);
            return 'Already Injected';
        }
    } catch (error) {
        console.error(`NetPolish: Failed to inject ${moduleName} into tab ${tabId}: ${error}`);
        return false;
    }
}