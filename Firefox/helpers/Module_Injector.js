// Module_Injector.js
//
// Injects requested Module into current tab (Dynamically creating filepath)
//

//Imports
import { CheckModuleInject } from '/helpers/Module_InjectedCheck.js';

export async function InjectModule(moduleName, tabId, cssFileName = null) {
    const scriptFilePath = `/modules/${moduleName}/${moduleName}_ContentScript.js`;
    const exclusionPath = `/modules/${moduleName}/${moduleName}_Exclude.json`;
    const cssFilePath = cssFileName ? `/modules/${moduleName}/${cssFileName}` : null;
    const tabInfo = await browser.tabs.get(tabId);

    // Attempt to load the exclusion list; assume allowed if not found
    try {
        const response = await fetch(browser.runtime.getURL(exclusionPath));
        const exclusionData = await response.json();
        if (tabInfo.url) {
            const url = new URL(tabInfo.url);
            if (exclusionData.domains.includes(url.hostname)) {
                browser.tabs.sendMessage(tabId, { type: "domainExclusion", moduleName: moduleName });
                return 'Excluded Domain';
            } else {
                browser.tabs.sendMessage(tabId, { type: "domainAllowed", moduleName: moduleName });
            }
        }
    } catch (error) {
        console.error(`Error loading exclusion file for ${moduleName}: ${error}`);
        browser.tabs.sendMessage(tabId, { type: "domainAllowed", moduleName: moduleName });
    }

    // If Domain is allowed, inject Module
    try {
        const alreadyInjected = await CheckModuleInject(moduleName, tabId);
        if (!alreadyInjected) {
            await browser.scripting.executeScript({
                target: { tabId: tabId },
                files: [scriptFilePath]
            });
            console.log(`NetPolish: ${moduleName} injected into tab ${tabId}`);

            // Inject CSS if specified
            if (cssFilePath) {
                await browser.scripting.insertCSS({
                    target: { tabId: tabId },
                    files: [cssFilePath]
                });
                console.log(`NetPolish: CSS for ${moduleName} injected into tab ${tabId}`);
            }

            return true;
        } else {
            console.log(`NetPolish: ${moduleName} already injected into tab ${tabId}`);
            return 'Already Injected';
        }
    } catch (error) {
        console.error(`NetPolish: Failed to inject ${moduleName} into tab ${tabId}: ${error}`);
        return false;
    }
}