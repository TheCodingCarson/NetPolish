// ChatGPTEnhancements_ContentScript.js

// Declare
const ChatGPTURLPattern = /^https:\/\/chat\.openai\.com\/.*/;
let lastKnownURL = null;
let WaitForChatGPTFullLoadAttempts = null;

// Set interval to check for URL changes every second + Log
setInterval(CheckForURLChange, 1000);
chrome.runtime.sendMessage({
    type: "log",
    message: "NetPolish: ChatGPT Enhancements - Watching for URL Changes"
})

// Initialization
InitialLoadEvents();

function InitialLoadEvents() {
    // Declare In Load
    lastKnownURL = window.location.href;
    WaitForChatGPTFullLoadAttempts = 0;

    // Log Loading
    chrome.runtime.sendMessage({
        type: "log",
        message: "NetPolish: ChatGPT Enhancements Loading..."
    })

    // Check for Existing Button
    const existingButton = document.getElementById('ChatGPTEnhanced_NewFolderButton');
    if (existingButton) {

        // Wait on ChatGPT Website to Fully Load + button exists
        waitForChatGPTFullLoad(true);

    } else {

        // Wait on ChatGPT Website to Fully Load
        waitForChatGPTFullLoad(false);
    }
}

function waitForChatGPTFullLoad (hasInitializedChatGPTEnhancements) {
    let fullLoadIndicatorElement = null;
    CheckForChatGPTLoadedElement();

    function CheckForChatGPTLoadedElement() {
        
        // Select all div elements with tabindex="0"
        const fullLoadIndicatorElement = document.querySelector('div[tabindex="0"]');
        if (fullLoadIndicatorElement) {

            chrome.runtime.sendMessage({
                type: "log",
                message: "NetPolish: ChatGPT Enhancements - Detected Loaded Website"
            })

            // ChatGPT Website Fully Loaded
            if (hasInitializedChatGPTEnhancements) {

                // Button Already Exists
                chrome.runtime.sendMessage({
                    type: "log",
                    message: "NetPolish: ChatGPT Enhancements - New folder button already exists"
                })

                // Log Loaded
                ChatGPTEnhancementsLoaded();
            } else {

                // Continue Main Initialization
                enhanceSidebar();

            }
        } else {
            if (WaitForChatGPTFullLoadAttempts < 45) {
                WaitForChatGPTFullLoadAttempts++;
                // Wait for 1 second before checking again
                setTimeout(CheckForChatGPTLoadedElement, 1000);
            } else {

                // Timed out waiting for ChatGPT website to load
                UnloadChatGPTEnhancements(true);
            }
        }
    }
}

function enhanceSidebar() {
    let targetDiv = null;

    // Select all div elements with tabindex="0"
    const divsWithTabIndex = document.querySelectorAll('div[tabindex="0"]');
    // Iterate through each div and check for the required nested structure
    divsWithTabIndex.forEach(div => {
        // Check each <a> element within the div
        const links = div.querySelectorAll('a');
        // Determine if any link contains the desired <span>
        const hasRequiredSpan = Array.from(links).some(link => {
            const span = link.querySelector('span.text-sm');
            return span && span.textContent.includes("Explore GPTs");
        });

        // If the required <span> is found within an <a> in this div, assign the div to the variable
        if (hasRequiredSpan) {
            targetDiv = div;
        }
    });

    // Log Error if no div matches
    if (!targetDiv) {
        chrome.runtime.sendMessage({
            type: "error",
            message: "NetPolish: ChatGPT Enhancements - Target div for new folder button not found"
        })
        return;
    }

    // Create a new button element
    const newFolderButton = document.createElement('a');
    newFolderButton.id = `ChatGPTEnhanced_ParentNewFolderDiv`
    newFolderButton.innerHTML = `
        <div id="ChatGPTEnhanced_NewFolderButton" class="flex h-7 w-7 items-center justify-center text-token-text-secondary">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" class="icon-md">
            <path d="M0 0h24v24H0V0z" fill="none"/>
            <path d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm0 12H4V6h5.17l2 2H20v10zm-8-4h2v2h2v-2h2v-2h-2v-2h-2v2h-2z"/>
            </svg>
        </div>
        <span class="text-sm">+ New Folder</span>
    `;
    newFolderButton.classList.add('flex', 'h-10', 'w-full', 'items-center', 'gap-2', 'rounded-lg', 'px-2', 'font-medium', 'text-token-text-primary', 'hover:bg-token-sidebar-surface-secondary');
    newFolderButton.addEventListener('click', HandleNewFolderButtonClick); // JavaScript action on click

    newFolderButton.onclick = function() {
        chrome.runtime.sendMessage({
            type: "log",
            message: "NetPolish: ChatGPT Enhancements - Creating new folder..."
        })
        // Functionality to handle new folder creation goes here
    };

    // Inserting the new button after the specified div
    targetDiv.appendChild(newFolderButton);
    chrome.runtime.sendMessage({
        type: "log",
        message: "NetPolish: ChatGPT Enhancements - New folder button added"
    })

    // Log Loaded
    ChatGPTEnhancementsLoaded();
}

// Handle New Folder Button - Click Event
function HandleNewFolderButtonClick(event) {

    // Test
    chrome.runtime.sendMessage({
        type: "log",
        message: "NetPolish: ChatGPT Enhancements - New Folder Button Clicked!"
    })

}

// Listen & Respond To Inject Check
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "ping") {
        sendResponse({ status: "ok" });
    }
});

// Watch for URL Change
function CheckForURLChange() {
    
    let currentURL = window.location.href;
    if (currentURL !== lastKnownURL) {
        lastKnownURL = currentURL; // Update the last known URL to the current
        HandleURLChange(currentURL);
    }
}

// Handle URL Change
function HandleURLChange(url) {
    
    if (ChatGPTURLPattern.test(url)) {
        // Log Re-initialize
        chrome.runtime.sendMessage({
            type: "log",
            message: "NetPolish: ChatGPT Enhancements - URL Change Detected Re-initializing"
        })

        // Reset if still on ChatGPT Website
        WaitForChatGPTFullLoadAttempts = null;
        lastKnownURL = null;
        InitialLoadEvents();

    } else {
        //Unload if no longer on ChatGPT Website
        UnloadChatGPTEnhancements();
    }
}

// Finished Loading
function ChatGPTEnhancementsLoaded() {
    chrome.runtime.sendMessage({
        type: "log",
        message: "NetPolish: ChatGPT Enhancements Loaded"
    })
}

// Timed Out - Unload
function UnloadChatGPTEnhancements(TimeOutOnLoad = false) {

    if (TimeOutOnLoad) {
        // Log Timed out waiting on ChatGPT Load - If Errored
        chrome.runtime.sendMessage({
            type: "error",
            message: "NetPolish: ChatGPT Enhancements - Timed out waiting to load, Canceling."
        })
    }

    // Log Removal
    chrome.runtime.sendMessage({
        type: "log",
        message: "NetPolish: ChatGPT Enhancements Unloading..."
    })

    // Removal Process - Reset variables
    WaitForChatGPTFullLoadAttempts = null;
    lastKnownURL = null;

    // Log Removal
    chrome.runtime.sendMessage({
        type: "log",
        message: "NetPolish: ChatGPT Enhancements Unloaded!"
    })
}