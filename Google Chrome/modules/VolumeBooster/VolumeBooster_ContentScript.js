// --Volume Booster-- //

// Initialize the audio context and gain node at the top level to ensure availability
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let gainNode = audioContext.createGain();
gainNode.connect(audioContext.destination);

// Start Monitoring for new audio elements
InitializeObserver();

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
                    message: `Error connecting media element to audio context: ${error.message}`,
                    moduleName : "VolumeBooster"
                })
            }
        }
    });
}

// Monitor & Add new media sources
function InitializeObserver () {
	const observer = new MutationObserver(mutations => {
		mutations.forEach(mutation => {
			if (mutation.type === 'childList') {
				mutation.addedNodes.forEach(node => {
					// Only process new nodes that are audio or video elements
					if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') {
						attachGainToElement(node);
					}
				});
			}
		});
	});
	
	observer.observe(document.body, { childList: true, subtree: true });
}

//Helper Function - Attach New Audio/Video Element to gainNode
function attachGainToElement(node) {
    if (!node.dataset.connectedToContext) {
        try {
            const source = audioContext.createMediaElementSource(node);
            source.connect(gainNode);
            node.dataset.connectedToContext = 'true';
        } catch (error) {
            chrome.runtime.sendMessage({
                type: "log",
                message: `Error connecting new media element to audio context: ${error.message}`,
                moduleName : "VolumeBooster"
            });
        }
    }
}

// Listen for messages to adjust volume
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "setVolume" && request.moduleName === "VolumeBooster") {
        setVolumeBeyondLimits(request.volume);
	// Respond To Inject Check
    } else if (request.type === "ping" && request.moduleName === "VolumeBooster") {
        sendResponse({ status: "ok" });
    } else if (request.type === "domainAllowed" && request.moduleName === "VolumeBooster") {

    }
});