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
async function searchChatGpt(query) {
    console.log('searchChatGpt called with query:', query);

    // Check if there's an open ChatGPT tab with variations in the URL
    let [existingTab] = await chrome.tabs.query({ url: "*://chatgpt.com/*" });
    console.log('Existing ChatGPT tab:', existingTab);

    if (existingTab) {
        // Focus on the existing ChatGPT tab
        chrome.tabs.update(existingTab.id, { active: true });
        chatGptTabId = existingTab.id; // Store this tab ID for future searches
        console.log('Highlighted existing ChatGPT tab:', existingTab.id);

        // Wait for the tab to load and then paste the query
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
            if (tabId === chatGptTabId && changeInfo.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                chrome.scripting.executeScript({
                    target: { tabId: chatGptTabId },
                    func: (query) => {
                        const promptArea = document.querySelector('div[contenteditable="true"][id="prompt-textarea"]');
                        if (promptArea) {
                            // Create a new <p> element
                            const p = document.createElement('p');
                            // Set the text content
                            p.textContent = query;
                            // Append the <p> element to the prompt area
                            promptArea.appendChild(p);
                            // Optionally, scroll to the bottom to ensure the new content is visible
                            promptArea.scrollTop = promptArea.scrollHeight;
                        } else {
                            console.error('Prompt area not found');
                        }

                    },
                    args: [query]
                });
            }
        });
    } else {
        // No existing ChatGPT tab found, create a new one
        chrome.tabs.create({ url: "https://chat.openai.com/" }, (newTab) => {
            chatGptTabId = newTab.id; // Store this tab ID for future searches
            console.log('Created new ChatGPT tab:', newTab.id);

            // Wait for the tab to load and then paste the query
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === chatGptTabId && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    chrome.scripting.executeScript({
                        target: { tabId: chatGptTabId },
                        func: (query) => {
                            const promptArea = document.querySelector('div[contenteditable="true"][id="prompt-textarea"]');
                            if (promptArea) {
                                // Set the content
                                promptArea.innerHTML = `<p>${query}</p>`;
                                // Simulate Enter key press
                                const enterEvent = new KeyboardEvent('keydown', {
                                    key: 'Enter',
                                    code: 'Enter',
                                    keyCode: 13,
                                    which: 13,
                                    bubbles: true,
                                    cancelable: true,
                                });
                                promptArea.dispatchEvent(enterEvent);
                                console.log('Pasted query into ChatGPT input area and sent');
                            } else {
                                console.error('Prompt area not found');
                            }
                        },
                        args: [query]
                    });
                }
            });
        });
    }
}


// Improved handling in createPopupContextMenu
function createPopupContextMenu(selectionText, sender, cursorX, cursorY) {
    console.log('Creating popup context menu for:', selectionText);

    chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        func: () => {
            const existingPopup = document.getElementById('popup-context-menu');
            if (existingPopup) existingPopup.remove(); // Cleanup old popup
        },
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
            // Only add the popup if it doesn't already exist
            if (!document.getElementById('popup-context-menu')) {
                document.body.insertAdjacentHTML('beforeend', popupHtml);

                // Event listeners for buttons
                document.getElementById('searchPerplexityButton').addEventListener('click', () => {
                    chrome.runtime.sendMessage({ action: 'searchPerplexity', query: selectionText });
                    document.getElementById('popup-context-menu').remove();
                });
                document.getElementById('searchChatGptButton').addEventListener('click', () => {
                    chrome.runtime.sendMessage({ action: 'searchChatGpt', query: selectionText });
                    document.getElementById('popup-context-menu').remove();
                });

                // Global click listener to remove popup if clicked outside
                document.addEventListener('click', (e) => {
                    const popup = document.getElementById('popup-context-menu');
                    if (popup && !popup.contains(e.target)) popup.remove();
                });
            }
        },
        args: [popupHtml, selectionText],
    });
}


// Remove these lines from background.js:
chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
        id: "searchPerplexity",
        title: "Search Perplexity AI for '%s'",
        contexts: ["selection"],
    });
    chrome.contextMenus.create({
        id: "searchChatGpt",
        title: "Search ChatGPT for '%s'",
        contexts: ["selection"],
    });
});

// Update the message listener to only handle textSelected:
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        try {
            console.log('Message received:', message);
            if (message.action === "textSelected" && message.selectionText) {
                createPopupContextMenu(message.selectionText, sender, message.cursorX, message.cursorY);
            }
            sendResponse({ status: "success" });
        } catch (error) {
            console.error('Error processing message:', error);
            sendResponse({ status: "error", error: error.message });
        }
    })();
    return true;
});