// Volume Booster - Main Logic //

//Imports
import { CheckModuleInject } from '/helpers/Module_InjectedCheck.js';
import { InjectModule } from '/helpers/Module_Injector.js';

// Main Volume Booster Logic
document.addEventListener('DOMContentLoaded', function() {
  const slider = document.getElementById('VolumeBoost');
  const sliderValueDisplay = document.getElementById('VolumeValue');
  let currentTabId = null;

  // Add event listener for right-click (context menu) on the slider
  slider.addEventListener('contextmenu', function(event) {
    event.preventDefault(); // Prevent the default context menu from showing

    slider.value = 100; // Reset slider value to 100%
    updateSliderValue(1, true); // 100% volume as a multiplier (1), forced update

    return false; // To prevent the default handler
  });

  // Retrieve the cached volume or default to 100%
  browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTabId = tabs[0].id;

    // Attempt to fetch the volume setting for the current tab
    browser.storage.local.get([`volumeForTab${currentTabId}`], function(result) {
        if (result[`volumeForTab${currentTabId}`] !== undefined) {
            // If there's a stored volume for this tab, use it
            const volume = result[`volumeForTab${currentTabId}`];
            slider.value = volume;
            sliderValueDisplay.textContent = volume + '%';
            updateSliderValue(volume / 100);
        } else {
            // No stored volume for this tab, default to 100%
            slider.value = 100;
            sliderValueDisplay.textContent = '100%';
            
            // Set stored value to default 100% - avoiding injecting script till user changes value
            browser.storage.local.set({[`volumeForTab${currentTabId}`]: 100});
            console.log(`NetPolish: Volume for new tab ${currentTabId} set to default`)
        }
    });
  });

  async function updateSliderValue(volumeMultiplier, forceUpdate = false) {
    const volume = Math.round(volumeMultiplier * 100);
    sliderValueDisplay.textContent = volume + '%';
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const currentTabId = tabs[0].id;

    await browser.storage.local.set({[`volumeForTab${currentTabId}`]: volume});
    console.log(`NetPolish: Volume for tab ${currentTabId} updated to ${volume}%`);

    const injected = await CheckModuleInject("VolumeBooster", currentTabId);
    if (!injected) {
        await InjectModule("VolumeBooster", currentTabId);
        // After injection, send volume update if necessary
        browser.tabs.sendMessage(currentTabId, { type: "setVolume", volume: volumeMultiplier });
    } else {
        // Content script already injected, just update volume
        browser.tabs.sendMessage(currentTabId, { type: "setVolume", volume: volumeMultiplier });
    }
  }

  slider.addEventListener('input', () => updateSliderValue(slider.value / 100));
});

// Volume Booster - Domain Excuded //
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === "domainExclusion" && request.moduleName === "VolumeBooster") {
        
        const volumeSlider = document.getElementById('VolumeBoost');
        volumeSlider = document.getElementById('VolumeBoost')
        volumeSlider.disabled = true;
        volumeSlider.title = "This feature is disabled on this site.";
        console.warn(`NetPolish: Volume Booster in tab ${currentTabId} is disabled on this domain.`);
    
    } else if (request.type === "domainAllowed" && request.moduleName === "VolumeBooster") {
        
        volumeSlider = document.getElementById('VolumeBoost')
        volumeSlider.disabled = false; // Ensure it's enabled if not in the list
        volumeSlider.title = "";
        
    }
});