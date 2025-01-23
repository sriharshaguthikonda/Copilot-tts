// content_script.js
let isDragSelection = false;
let mouseDownTime = 0;
let lastSelection = '';
const DRAG_THRESHOLD = 5; // pixels
const DOUBLE_CLICK_MAX_DELAY = 300; // ms

document.addEventListener('mousedown', (e) => {
    mouseDownTime = Date.now();
    isDragSelection = false;
});

document.addEventListener('mousemove', (e) => {
    if (mouseDownTime && !isDragSelection) {
        const dx = Math.abs(e.movementX);
        const dy = Math.abs(e.movementY);
        
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
            isDragSelection = true;
        }
    }
});

document.addEventListener('mouseup', (e) => {
    if (!isDragSelection) return;




    // Check if it's a double-click
    const clickDuration = Date.now() - mouseDownTime;
    if (clickDuration < DOUBLE_CLICK_MAX_DELAY) {
        isDragSelection = false;
        return;
    }

    // Get final selection after mouse release
    const selection = window.getSelection().toString().trim();
    if (!selection || selection === lastSelection) {
        isDragSelection = false;
        return;
    }

    // Get selection position
    try {
        const range = window.getSelection().getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Get mouse position with scroll offset
        const posX = e.clientX + window.scrollX;
        const posY = e.clientY + window.scrollY;

        // Verify the click position isn't in our popup
        const popup = document.getElementById('popup-context-menu');
        if (!popup || !popup.contains(document.elementFromPoint(e.clientX, e.clientY))) {
            chrome.runtime.sendMessage({
                action: 'textSelected',
                selectionText: selection,
                cursorX: posX,
                cursorY: posY  // We'll adjust this in the popup creation
            });
        }

        lastSelection = selection;
    } catch (error) {
        console.log('No valid selection');
    }
    
    isDragSelection = false;
    mouseDownTime = 0;
});

// Handle text cleanup when selection changes
document.addEventListener('selectionchange', () => {
    if (!window.getSelection().toString().trim()) {
        lastSelection = '';
    }
});