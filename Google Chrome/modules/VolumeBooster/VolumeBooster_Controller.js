// Volume Booster - Main Logic //

//Imports
import { CheckModuleInject } from '/helpers/Module_InjectedCheck.js';
import { InjectModule } from '/helpers/Module_Injector.js';

// Declared Variables
let volumeSlider = document.getElementById('VolumeBoost');
let sliderValueDisplay = document.getElementById('VolumeValue');
let currentTabId = null;

// Main Volume Booster Logic
document.addEventListener('DOMContentLoaded', function() {

  // Add event listener for right-click (context menu) on the slider
  volumeSlider.addEventListener('contextmenu', function(event) {
    event.preventDefault(); // Prevent the default context menu from showing

    // Set Current Tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      currentTabId = tabs[0].id;
    });

    // Disable Popup Options On Chrome Restricted Sites
    if (currentTabId !== null) {
      volumeSlider.disabled = true;
      volumeSlider.title = "This feature is disabled on Chrome restricted sites.";
    } else if (currentTabId.url.startsWith('chrome://')) {
      volumeSlider.disabled = true;
      volumeSlider.title = "This feature is disabled on Chrome restricted sites.";
    }

    // Disable "Right Click Reset" for volume slider popup when VolumeBooster is disabled
    if (!volumeSlider.disabled) {

      volumeSlider.value = 100; // Reset slider value to 100%
      updateSliderValue(1, true); // 100% volume as a multiplier (1), forced update

    }

    return false; // To prevent the default handler
  });

  // Retrieve the cached volume or default to 100%
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    currentTabId = tabs[0].id;

    // Ignore Restricted Tabs
    if (currentTabId !== null) {
      if (!currentTabId.url.startsWith('chrome://')) {
        // Attempt to fetch the volume setting for the current tab
        chrome.storage.local.get([`volumeForTab${currentTabId}`], function(result) {
          if (result[`volumeForTab${currentTabId}`] !== undefined) {
              // If there's a stored volume for this tab, use it
              const volume = result[`volumeForTab${currentTabId}`];
              volumeSlider.value = volume;
              sliderValueDisplay.textContent = volume + '%';
              updateSliderValue(volume / 100);
          } else {
              // No stored volume for this tab, default to 100%
              volumeSlider.value = 100;
              sliderValueDisplay.textContent = '100%';
              
              // Set stored value to default 100% - avoiding injecting script till user changes value
              chrome.storage.local.set({[`volumeForTab${currentTabId}`]: 100});
              console.log(`NetPolish: Volume for new tab ${currentTabId} set to default`)
          }
        });
      }
    }
    
  });

  async function updateSliderValue(volumeMultiplier, forceUpdate = false) {
    const volume = Math.round(volumeMultiplier * 100);
    sliderValueDisplay.textContent = volume + '%';

    await chrome.storage.local.set({[`volumeForTab${currentTabId}`]: volume});
    console.log(`NetPolish: Volume for tab ${currentTabId} updated to ${volume}%`);

    const injected = await CheckModuleInject("VolumeBooster", currentTabId);
    if (!injected) {
        await InjectModule("VolumeBooster", currentTabId);
        // After injection, send volume update if necessary
        chrome.tabs.sendMessage(currentTabId, { type: "setVolume", volume: volumeMultiplier, moduleName : "VolumeBooster"});
    } else {
        // Content script already injected, just update volume
        chrome.tabs.sendMessage(currentTabId, { type: "setVolume", volume: volumeMultiplier, moduleName : "VolumeBooster" });
    }
  }

  volumeSlider.addEventListener('input', () => updateSliderValue(volumeSlider.value / 100));
});

// Volume Booster - Domain Excluded //
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === "domainExclusion" && request.moduleName === "VolumeBooster") {
      
      // Disable Popup Options On "Domain Excluded" sites
      volumeSlider.disabled = true;
      volumeSlider.title = "This feature is disabled on this site.";
  
  } else if (!currentTabId.url.startsWith('chrome://')) {

    // Disable Popup Options On Chrome Restricted Sites
    volumeSlider.disabled = true;
    volumeSlider.title = "This feature is disabled on Chrome restricted sites.";

  } else if (request.type === "domainAllowed" && request.moduleName === "VolumeBooster") {
      
    // Re-enable on "Domain Allowed" sites
    
    volumeSlider.disabled = false;
    volumeSlider.title = "";
      
  }
});