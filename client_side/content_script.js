document.addEventListener('mouseup', (event) => {
    const selection = window.getSelection().toString().trim();
    if (selection) {
        chrome.runtime.sendMessage({
            action: 'textSelected',
            selectionText: selection,
            cursorX: event.clientX,
            cursorY: event.clientY
        });
    }
});
