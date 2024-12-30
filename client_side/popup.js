// content.js
document.addEventListener('mouseup', function() {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
        const popup = document.createElement('div');
        popup.innerText = `Search Perplexity AI for "${selectedText} according to NICE guidelines"`;
        popup.style.position = 'absolute';
        popup.style.backgroundColor = 'white';
        popup.style.border = '1px solid black';
        popup.style.padding = '5px';
        popup.style.zIndex = 1000;
        popup.style.left = `${event.pageX}px`;
        popup.style.top = `${event.pageY}px`;
        popup.style.cursor = 'pointer';

        popup.onclick = () => {
            chrome.runtime.sendMessage({ action: 'searchPerplexity', query: selectedText });
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
