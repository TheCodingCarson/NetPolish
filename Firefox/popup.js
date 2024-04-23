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