// content.js
document.addEventListener('mouseup', function(event) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
        const range = selection.getRangeAt(0);
        const container = document.createElement('div');
        container.appendChild(range.cloneContents());
        const selectedHTML = container.innerHTML;

        const popup = document.createElement('div');
        popup.innerHTML = `Search Perplexity AI for "<strong>${selectedText} according to NICE guidelines</strong>"`;
        popup.style.position = 'absolute';
        popup.style.backgroundColor = 'white';
        popup.style.border = '1px solid black';
        popup.style.padding = '5px';
        popup.style.zIndex = 1000;
        popup.style.left = `${event.pageX}px`;
        popup.style.top = `${event.pageY}px`;
        popup.style.cursor = 'pointer';

        popup.onclick = () => {
            chrome.runtime.sendMessage({ action: 'searchPerplexity', query: selectedHTML });
            document.body.removeChild(popup);
        };

        document.body.appendChild(popup);

        // Remove the popup when clicking elsewhere
        document.addEventListener('mousedown', function removePopup() {
            if (popup && popup.parentNode) {
                document.body.removeChild(popup);
            }
            document.removeEventListener('mousedown', removePopup);
        });
    }
});
