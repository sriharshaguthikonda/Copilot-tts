// background.js
let perplexityTabId = null;

// Function to search on Perplexity AI, reusing an open tab if available
async function searchPerplexity(query) {
    const updatedQuery = `according to NICE guidelines, what is the answer for the following :   ${query} `;
    const url = `https://www.perplexity.ai/search?q=${encodeURIComponent(updatedQuery)}`;

    // Check if there's an open Perplexity AI tab
    let [existingTab] = await chrome.tabs.query({ url: "*://www.perplexity.ai/*" });

    if (existingTab) {
        // Update the URL of the existing Perplexity AI tab
        chrome.tabs.update(existingTab.id, { url });
        chrome.tabs.highlight({ tabs: existingTab.id });
        perplexityTabId = existingTab.id; // Store this tab ID for future searches
    } else {
        // If no existing tab found, open a new one and store its ID
        chrome.tabs.create({ url }, (tab) => {
            perplexityTabId = tab.id;
        });
    }
}

// Listen for messages from the popup or context menu
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "searchPerplexity" && message.query) {
        searchPerplexity(message.query);
    }
    sendResponse({ status: "done" });
});

chrome.contextMenus.create({
    id: "searchPerplexity",
    title: "Search Perplexity AI for '%s'",
    contexts: ["selection"]
});

chrome.contextMenus.onClicked.addListener((info) => {
    if (info.menuItemId === "searchPerplexity") {
        searchPerplexity(info.selectionText);
    }
});
