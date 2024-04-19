// --Volume Booster-- //

// Initialize the audio context and gain node at the top level to ensure availability
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let gainNode = audioContext.createGain();
gainNode.connect(audioContext.destination);

function setVolumeBeyondLimits(volumeLevel) {
    // Directly use audioContext and gainNode without calling ensureAudioContext()
    const clampedVolume = Math.max(0.01, Math.min(5, volumeLevel));
    gainNode.gain.value = clampedVolume;

    document.querySelectorAll('audio, video').forEach(element => {
        if (!element.dataset.connectedToContext) {
            try {
                const source = audioContext.createMediaElementSource(element);
                source.connect(gainNode);
                element.dataset.connectedToContext = 'true';
            } catch (error) {
                // Send error log to DevTools panel via background script
                chrome.runtime.sendMessage({
                    type: "log",
                    message: `Error connecting media element to audio context: ${error.message}`
                })
            }
        }
    });
}

// Listen for messages to adjust volume
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === "setVolume") {
        setVolumeBeyondLimits(request.volume);
    }
});

// Respond To Inject Check
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "ping") {
        sendResponse({ status: "ok" });
    }
});