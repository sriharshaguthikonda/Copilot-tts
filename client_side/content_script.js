document.addEventListener('mouseup', (event) => {
    const selection = window.getSelection().toString().trim();
    console.log('Text selected:', selection); // Debugging statement
    if (selection && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        // Check if the click is inside the popup
        if (event.target.closest('#popup-context-menu')) {
            return;
        }
        chrome.runtime.sendMessage({
            action: 'textSelected',
            selectionText: selection,
            cursorX: event.clientX,
            cursorY: event.clientY
        }, (response) => {
            console.log('Message sent, response:', response); // Debugging statement
        });
    } else {
        console.error('chrome.runtime.sendMessage is not available');
    }
});
