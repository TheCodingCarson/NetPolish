// options.js
//
// Used for Common Interactions in the options.html menu
//

// Set the current version number in sidebar - On options.html load
document.addEventListener('DOMContentLoaded', function() {
    // Get the current extension manifest using chrome.runtime.getManifest()
    const manifest = chrome.runtime.getManifest();

    // Extract the version number from the manifest
    const currentVersion = manifest.version;

    // Get the paragraph element by its ID
    const versionDisplay = document.getElementById('VersionNumber');

    // Update the text content of the paragraph element with the current version
    if (versionDisplay) {
        versionDisplay.textContent = 'v' + currentVersion;
    }
});