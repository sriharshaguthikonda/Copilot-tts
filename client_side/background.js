// background.js
let perplexityTabId = null;
let chatGptTabId = null;

// Function to search on Perplexity AI, reusing an open tab if available
async function searchPerplexity(query) {
    console.log('searchPerplexity called with query:', query);
    const updatedQuery = `According to NICE guidelines, what is the answer for the following :
    <p></p>
    <p></p> 
    <p></p>
    <p></p>
    <p></p>
    <p></p>
    <p></p>
    <p></p>
    ${query} `;
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




// Add to top with other tab IDs
let deepSeekTabId = null;

// Add new DeepSeek search function
async function searchDeepSeek(query) {
    query = `According to NICE guidelines, what is the answer for the following :
    ${query}`;
    console.log('searchDeepSeek called with query:', query);
    const DEEPSEEK_URL = "https://chat.deepseek.com/a/chat/s/*";
    const TEXTAREA_SELECTOR = 'textarea#chat-input';
    const SEND_BUTTON_SELECTOR = 'div[role="button"].f6d670';

    const handleQuerySubmission = (tabId) => {
        chrome.scripting.executeScript({
            target: { tabId },
            func: (query, TEXTAREA_SELECTOR, SEND_BUTTON_SELECTOR) => {
                const setQueryAndSend = () => {
                    const textArea = document.querySelector(TEXTAREA_SELECTOR);
                    const sendButton = document.querySelector(SEND_BUTTON_SELECTOR);

                    if (textArea && sendButton) {
                        // Set the query value
                        textArea.value = query;
                        
                        // Trigger input events
                        ['input', 'change', 'keydown', 'keyup'].forEach(eventType => {
                            textArea.dispatchEvent(new Event(eventType, { bubbles: true }));
                        });

                        // Click send button
                        sendButton.click();
                    }
                };

                // Try immediately first
                setQueryAndSend();
                
                // Fallback observer if elements not immediately available
                const observer = new MutationObserver((mutations) => {
                    if (document.querySelector(TEXTAREA_SELECTOR) && document.querySelector(SEND_BUTTON_SELECTOR)) {
                        setQueryAndSend();
                        observer.disconnect();
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                // Timeout cleanup
                setTimeout(() => observer.disconnect(), 5000);
            },
            args: [query, TEXTAREA_SELECTOR, SEND_BUTTON_SELECTOR]
        });
    };

    // Check for existing DeepSeek tabs
    let [existingTab] = await chrome.tabs.query({ 
        url: "*://chat.deepseek.com/a/chat/s/*",
        status: 'complete'
    });

    if (existingTab) {
        chrome.tabs.update(existingTab.id, { active: true }, () => {
            handleQuerySubmission(existingTab.id);
        });
    } else {
        chrome.tabs.create({ url: DEEPSEEK_URL }, (newTab) => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === newTab.id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    handleQuerySubmission(newTab.id);
                }
            });
        });
    }
}



// In your background.js when creating the popup HTML
const deepseekIconUrl = chrome.runtime.getURL('deepseek-color.svg');



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
    <div id="popup-context-menu" style="position: fixed; top: ${cursorY - 80}px; left: ${cursorX - 110}px; 
    background: rgba(51, 51, 51, 0.95); padding: 12px; border-radius: 12px; 
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2); z-index: 9999; backdrop-filter: blur(4px); 
    border: 1px solid rgba(255, 255, 255, 0.1);">
    <div style="display: flex; gap: 8px; justify-content: center;">
        <button id="searchPerplexityButton" 
            style="background: linear-gradient(145deg, #f8f3e6, #e2d8b9); border: none; width: 60px; height: 60px; 
            border-radius: 50%; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; 
            justify-content: center; padding: 8px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);"
            onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 6px 12px rgba(0, 0, 0, 0.2)'" 
            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 6px rgba(0, 0, 0, 0.1)'">
            <img src="data:image/png;base64,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" 
            style="width: 40px; height: 40px;" alt="Perplexity">
        </button>

        <button id="searchChatGptButton" 
            style="background: linear-gradient(145deg, #e3f2fd, #bbdefb); border: none; width: 60px; height: 60px; 
            border-radius: 50%; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; 
            justify-content: center; padding: 8px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);"
            onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 6px 12px rgba(0, 0, 0, 0.2)'" 
            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 6px rgba(0, 0, 0, 0.1)'">
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFaElEQVR4nO2abWiWVRjHf0stzUUusloUZTZRKqjAolimZs1cubI+JKWInyrLPlSEZRYhJSmVZUiZRRFmRS9QRhCZVmYqKqPIDRKJnBVLk3ybs+2JC/43XN3c53553NY+PH94kJ1znXPf17ne/ue6hQoqqKCvcB7wOLAe2AN06t/vNH4+/RzDgJXAMaCU8vsHWAwMoR/iEuBXvahZ4C2gCTgHOBE4C5gEvO4U3Q7U0I9wEbBXL7cBGJVDfofkNwL3SsE1+plVbayWPsRQ4Ce91IfASTnXXQ905XDBj4E6+gDznZucnEP+DOBVp8QR4B1ZYCpwIzAXeB/ocDL39aYSg4G/9LBrMmQtTh4E9kv+KLAEODNlzenACqBbaxbQS2jSA77PkLsJaHUu80mOOPK4UwnE1k6jh2An+BTwrU7VNn80IDsG+NwpYLHUUOZz79Eee483050g0x5MCMrbYrL2oBfcKe4DHgAGpcSNJY0sfKH9HipXiSHKSCX5qwXiFLmUjY2LyX/tss5y+XoSqoFFsmw7cDcwICPTlZS6y8IrzqwT3fg3Gq+Pye/S+PjAflXAdGB3gnWbgQmBdQOBQzpMO4RCmKoHHFL1JociP2v8goT9bI917sXNqmMVxDvd+AfAiIT12zV/WVFFtmphUh4PKRJlqLoYD3vR0ZM/gNmKPZ/O5wEHXP14Onb62zRn7CA3rtKiPYGKHVIkoh+j9aKz9eLRaXfrYMzFknA28KarH23ATMVPVLeMu+XGPC1aGpgPKfKjxmcBm5wC652F7bc5Ya3HlS6hlNy+LRTEe1o4vaAizbEA3q09qmShWbFAtyw4MvCMKmCGrBLJW7UvhM+08IaCikR+fFTpNSnDWN14wtWlDt1RLJaScCqwysn67JmJNVrYWFCRLRqfnOMZjTHrWT2Zo1SbhKWS+x0YnleR5zMqaUiRyK/Nx7NwrWQt033lFNoROMAqJ/dSXkVmaMHaDEUWxujHBo1fneMZ9ZK1vQy3xAjmMwEO1630HHLF/2CY/LFLqTSORe6BrXoJr2AWtfcp3pSPYIeyMKZgHGs1b4edC8u04MtA3m90daMks7dmUBSPKwJXgfoMRR7W/HN5FRmuwEqrJwMVoO2xwLV7SBYaJLuloCI3a/5TCmCiu3auUioMueJiJ2up9ckARa+W/0d3mm0FFZlcjiKoCEUn3SbfDFGMkSpyviDOUjG0NXckMN/mgorcpfnVRRWJ/P6HGHNNS7H1oiGR/FbRlOjvTVIwoh9FFFmm+UeKKFGrRX+KuM10lKFbBM+IXhKqRBAjAhhnvqMDl6X6FEWMwP6meUsWuXFxQkBWi2If0dwBkUyj4hHizPeYqLzP/XUufedV5P5AgsjE5c414hihS1B02jt1SRobY67rEi5m6PJV0mUsjyKXAoc1Z5mrEE6RaxxMuVNPSGC9ceabhPGS25VDkUlqZNj4y5SJFm1wXYrMADUQ2jOYL2pILFeDIrqreIxzCWVKzOrvFmjNBiuptWSyMDSFmQ5Sayg62U61juKc6fYE6/6tLBWybi7UuI67NcvKQYNreJfUvDMCmNZTPizaY03A0+ghTHPZx9qYeTFKbVJPMLPoy2bJWhenV7DA1Y8VKc23qL26xNGQ/WpkW0M7DVEC2Hc8sZAHc1z96BAdmatPAk2aX+04V5c+JVhrNE98RezB6lKv40LgoxzfC7tS7vxxDNaHnYiy5Pne0mOo1UealbrjGxt9TWl4o16qJVAMPca4AmrpO+ki97+hxnVUzHJvyDq1ipNzgVuBt51lfynaRewrWCf/WVf4Qr9ONctDd51+9Z8I5usDUZsyWZtqxGOyTgUVVEDv41/8yxmQXOu50gAAAABJRU5ErkJggg==" style="width: 40px; height: 40px;" alt="ChatGPT">
        </button>

        <!-- New DeepSeek button -->
            <button id="searchDeepSeekButton" 
                style="background: linear-gradient(145deg, #f0f5ff, #d6e4ff); border: none; width: 60px; height: 60px; 
                border-radius: 50%; cursor: pointer; transition: all 0.3s ease; display: flex; align-items: center; 
                justify-content: center; padding: 8px; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);"
                onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 6px 12px rgba(0, 0, 0, 0.2)'" 
                onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 6px rgba(0, 0, 0, 0.1)'">
                <img src="${deepseekIconUrl}"
                style="width: 40px; height: 40px;" alt="DeepSeek">
            </button>
    </div>
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
                 // ... existing code ...
                document.getElementById('searchDeepSeekButton').addEventListener('click', () => {
                    chrome.runtime.sendMessage({ action: 'searchDeepSeek', query: selectionText });
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
            } else if (message.action === 'searchDeepSeek') {
                console.log('Handling searchDeepSeek action');
                await searchDeepSeek(message.query);
            }
            sendResponse({ status: "success" });
        } catch (error) {
            console.error('Error processing message:', error);
            sendResponse({ status: "error", error: error.message });
        }
    })();
    return true;
});