// popup.js
//
// Used for Common Interactions in the popup.html menu
//

// Open Options.html when "Gear Icon" is Clicked
document.querySelector('#OpenSettings').addEventListener('click', function() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });