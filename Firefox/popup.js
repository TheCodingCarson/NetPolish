// popup.js
//
// Used for Common Interactions in the popup.html menu
//

// Open Options.html when "Gear Icon" is Clicked
document.querySelector('#OpenSettings').addEventListener('click', function() {
    if (browser.runtime.openOptionsPage) {
      browser.runtime.openOptionsPage();
    } else {
      window.open(browser.runtime.getURL('options.html'));
    }
});

// ==-- Quick Options --==

// Enable Right Click
document.querySelector('#EnableRightClick').addEventListener('click', function() {
  QuickOptionInjector("Enable Right Click", "/modules/PopupQuickOptions/EnableRightClick.js");
});


// ==--Quick Options Injector --==
async function QuickOptionInjector(quickOptionName, quickOptionFile) {
  
  let currentTabId = null;

  browser.tabs.query({active: true, currentWindow: true}, async function(tabs) {
    currentTabId = tabs[0].id;

    try {
      await browser.scripting.executeScript({
          target: { tabId: currentTabId },
          files: [quickOptionFile]
      });
      console.log(`NetPolish: ${quickOptionName} injected into tab ${currentTabId}`);
      
      return true;
    } catch (error) {
        console.error(`NetPolish: Failed to inject ${quickOptionName} into tab ${currentTabId}: ${error}`);
        return false;
    }

  });

}
