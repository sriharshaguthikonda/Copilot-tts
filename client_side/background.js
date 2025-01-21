// background.js
let perplexityTabId = null;
let chatGptTabId = null;

// Function to search on Perplexity AI, reusing an open tab if available
async function searchPerplexity(query) {
    console.log('searchPerplexity called with query:', query);
    const updatedQuery = `according to NICE guidelines, what is the answer for the following :   ${query} `;
    const url = `https://www.perplexity.ai/search?q=${encodeURIComponent(updatedQuery)}`;

    // Check if there's an open Perplexity AI tab
    let [existingTab] = await chrome.tabs.query({ url: "*://www.perplexity.ai/*" });
    console.log('Existing Perplexity tab:', existingTab);

    if (existingTab) {
        // Update the URL of the existing Perplexity AI tab
        chrome.tabs.update(existingTab.id, { url });
        chrome.tabs.highlight({ tabs: existingTab.id });
        perplexityTabId = existingTab.id; // Store this tab ID for future searches
        console.log('Updated existing Perplexity tab:', existingTab.id);
    } else {
        // If no existing tab found, open a new one and store its ID
        chrome.tabs.create({ url }, (tab) => {
            perplexityTabId = tab.id;
            console.log('Created new Perplexity tab:', tab.id);
        });
    }
}


// Define the selector for the send button
const sendButtonSelector = 'button[aria-label="Send prompt"], button.btn.relative.btn-primary';


// Function to simulate a click on the send button
function clickSendButton() {
    const sendButton = document.querySelector(sendButtonSelector);
    if (sendButton) {
        sendButton.click();
    }
}





async function searchChatGpt(query) {
    query = `According to NICE guidelines, what is the answer for the following :
    <p></p>
    <p></p> 
    <p></p>
    <p></p>
    <p></p>
    <p></p>
    <p></p>
    <p></p>
    ${query} `;
    console.log('searchChatGpt called with query:', query);
    const CHATGPT_URL = "https://chatgpt.com/";
    const SEND_BUTTON_SELECTOR = 'button[aria-label="Send prompt"], button.btn.relative.btn-primary';

    // Check for existing ChatGPT tabs
    let [existingTab] = await chrome.tabs.query({ 
        url: "*://chatgpt.com/*",
        status: 'complete'
    });

    const handleQuerySubmission = (tabId) => {
        chrome.scripting.executeScript({
            target: { tabId },
            func: (query, SEND_BUTTON_SELECTOR) => {
                const findPromptArea = () => {
                    return document.querySelector('div[contenteditable="true"][id="prompt-textarea"]') ||                           document.querySelector('div[contenteditable][data-message-author-role="user"]');
                };

                const setQueryAndSend = () => {
                    const promptArea = findPromptArea();
                    if (promptArea) {
                        // Set the query content
                        promptArea.focus();
                        promptArea.innerHTML = query;
                        
                        // Create input event to trigger UI updates
                        const inputEvent = new Event('input', { bubbles: true });
                        promptArea.dispatchEvent(inputEvent);

                        // Wait for send button to be ready
                        const observer = new MutationObserver((mutations, obs) => {
                            const sendButton = document.querySelector(SEND_BUTTON_SELECTOR);
                            if (sendButton && !sendButton.disabled) {
                                sendButton.click();
                                obs.disconnect();
                            }
                        });

                        // Observe the entire document for changes
                        observer.observe(document.body, {
                            childList: true,
                            subtree: true,
                            attributes: true,
                            attributeFilter: ['disabled']
                        });

                        // Fallback timeout to prevent infinite waiting
                        setTimeout(() => observer.disconnect(), 5000);
                    }
                };

                // Try immediately first
                setQueryAndSend();
            },
            args: [query, SEND_BUTTON_SELECTOR]
        });
    };

    if (existingTab) {
        chrome.tabs.update(existingTab.id, { active: true }, () => {
            handleQuerySubmission(existingTab.id);
        });
    } else {
        chrome.tabs.create({ url: CHATGPT_URL }, (newTab) => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === newTab.id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    handleQuerySubmission(newTab.id);
                }
            });
        });
    }
}





// Improved handling in createPopupContextMenu
function createPopupContextMenu(selectionText, sender, cursorX, cursorY) {
    console.log('Creating popup context menu for:', selectionText); // Debugging statement

    chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: () => {
            const existingPopup = document.getElementById('popup-context-menu');
            if (existingPopup) existingPopup.remove(); // Cleanup old popup
        },
    }, () => {
        console.log('Old popup removed if existed'); // Debugging statement
    });

    const popupHtml = `
        <div id="popup-context-menu" style="position: fixed; top: ${cursorY - 60}px; left: ${cursorX - 240}px; 
        background: #333; color: #fff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); z-index: 9999;">
            <button id="searchPerplexityButton" style="background: #ddc; color: #333; font-size: 14px; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer; transition: box-shadow 0.3s;">
                Search Perplexity AI
            </button>
            <button id="searchChatGptButton" style="background: #ddf; color: #333; font-size: 14px; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer; transition: box-shadow 0.3s;">
                Search ChatGPT
            </button>
        </div>
    `;

    chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: (popupHtml, selectionText) => {
            console.log('Executing script to add popup'); // Debugging statement
            // Only add the popup if it doesn't already exist
            if (!document.getElementById('popup-context-menu')) {
                document.body.insertAdjacentHTML('beforeend', popupHtml);
                console.log('Popup added to the DOM'); // Debugging statement

                // Stop propagation of mouseup event inside the popup
                document.getElementById('popup-context-menu').addEventListener('mouseup', (e) => {
                    e.stopPropagation();
                });

                // Event listeners for buttons
                document.getElementById('searchPerplexityButton').addEventListener('click', () => {
                    console.log('Search Perplexity button clicked'); // Debugging statement
                    chrome.runtime.sendMessage({ action: 'searchPerplexity', query: selectionText }, (response) => {
                        console.log('Search Perplexity response:', response); // Debugging statement
                    });
                    document.getElementById('popup-context-menu').remove();
                });
                document.getElementById('searchChatGptButton').addEventListener('click', () => {
                    console.log('Search ChatGPT button clicked'); // Debugging statement
                    chrome.runtime.sendMessage({ action: 'searchChatGpt', query: selectionText }, (response) => {
                        console.log('Search ChatGPT response:', response); // Debugging statement
                    });
                    document.getElementById('popup-context-menu').remove();
                });

                // Global click listener to remove popup if clicked outside
                document.addEventListener('click', (e) => {
                    const popup = document.getElementById('popup-context-menu');
                    if (popup && !popup.contains(e.target)) popup.remove();
                });
            } else {
                console.log('Popup already exists'); // Debugging statement
            }
        },
        args: [popupHtml, selectionText],
    }, () => {
        console.log('Popup script executed'); // Debugging statement
    });
}





// Update the message listener to only handle textSelected:
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        try {
            console.log('Message received:', message); // Debugging statement
            if (message.action === "textSelected" && message.selectionText) {
                createPopupContextMenu(message.selectionText, sender, message.cursorX, message.cursorY);
            } else if (message.action === 'searchPerplexity') {
                console.log('Handling searchPerplexity action'); // Debugging statement
                await searchPerplexity(message.query);
            } else if (message.action === 'searchChatGpt') {
                console.log('Handling searchChatGpt action'); // Debugging statement
                await searchChatGpt(message.query);
            }
            sendResponse({ status: "success" });
        } catch (error) {
            console.error('Error processing message:', error);
            sendResponse({ status: "error", error: error.message });
        }
    })();
    return true;
});