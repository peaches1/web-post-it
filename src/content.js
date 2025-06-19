let postIts = {};
const currentUrl = window.location.origin + window.location.pathname;

// Clear existing notes before displaying saved ones
function clearExistingNotes() {
    document.querySelectorAll('.web-post-it').forEach(note => note.remove());
}

// Define helper functions first
function getElementPath(element) {
    try {
        const path = [];
        while (element && element.parentElement) {
            let selector = element.tagName.toLowerCase();
            if (element.id) {
                selector += `#${element.id}`;
            } else if (element.className) {
                const classes = Array.from(element.classList).join('.');
                if (classes) {
                    selector += `.${classes}`;
                }
            }
            path.unshift(selector);
            element = element.parentElement;
        }
        return path.join(' > ');
    } catch (error) {
        console.error('Error getting element path:', error);
        return null;
    }
}

function createPostIt(x, y, text = '', width = '200px', height = '100px') {
    const postIt = document.createElement('div');
    postIt.className = 'web-post-it';
    postIt.style.left = `${x}px`;
    postIt.style.top = `${y}px`;
    postIt.style.width = width;
    postIt.style.height = height;
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'web-post-it-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = function() {
        postIt.remove();
        delete postIts[postIt.id];
        savePostIts();
    };
    
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.placeholder = 'Type your note here...';
    textarea.oninput = function() {
        if (postIt.id) {
            postIts[postIt.id].text = textarea.value;
            savePostIts();
        }
    };
    
    let isDragging = false;
    let isResizing = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    postIt.addEventListener('mousedown', function(e) {
        if (e.target === textarea) return; // Don't drag when clicking textarea
        
        // Check if clicking near bottom-right corner (resize area)
        const rect = postIt.getBoundingClientRect();
        const isNearCorner = 
            e.clientX > rect.right - 15 && 
            e.clientY > rect.bottom - 15;

        if (isNearCorner) {
            isResizing = true;
        } else {
            isDragging = true;
        }

        initialX = e.clientX - postIt.offsetLeft;
        initialY = e.clientY - postIt.offsetTop;
    });

    document.addEventListener('mousemove', function(e) {
        if (!isDragging && !isResizing) return;

        e.preventDefault();

        if (isDragging) {
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;

            postIt.style.left = `${currentX}px`;
            postIt.style.top = `${currentY}px`;

            if (postIt.id && postIts[postIt.id]) {
                postIts[postIt.id].x = currentX;
                postIts[postIt.id].y = currentY;
                savePostIts();
            }
        }
    });

    document.addEventListener('mouseup', function() {
        isDragging = false;
        isResizing = false;
    });
    
    // Handle resize with ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
        if (postIt.id && postIts[postIt.id]) {
            const { width, height } = entries[0].contentRect;
            postIts[postIt.id].width = `${width}px`;
            postIts[postIt.id].height = `${height}px`;
            savePostIts();
        }
    });
    
    resizeObserver.observe(postIt);
    
    postIt.appendChild(closeBtn);
    postIt.appendChild(textarea);
    document.body.appendChild(postIt);
    
    return postIt;
}

function loadPostIts() {
    console.log('Loading notes for:', currentUrl);
    chrome.storage.local.get(null, function(result) {
        if (result.postIts && result.postIts[currentUrl]) {
            clearExistingNotes(); // Clear existing notes first
            postIts = result.postIts[currentUrl];
            displaySavedPostIts();
        }
    });
}

function savePostIts() {
    chrome.storage.local.get(null, function(result) {
        let allPostIts = result.postIts || {};
        allPostIts[currentUrl] = postIts;
        chrome.storage.local.set({ postIts: allPostIts }, function() {
            if (chrome.runtime.lastError) {
                console.error('Save error:', chrome.runtime.lastError);
            } else {
                console.log('Notes saved:', allPostIts);
            }
        });
    });
}

function displaySavedPostIts() {
    console.log('Displaying notes:', postIts);
    clearExistingNotes(); // Clear any existing notes
    Object.entries(postIts).forEach(([id, data]) => {
        const note = createPostIt(
            data.x || 10,
            data.y || 10,
            data.text || '',
            data.width || '200px',
            data.height || '100px'
        );
        note.id = id;
    });
}

// Event Listeners
window.addEventListener('load', loadPostIts);
document.addEventListener('DOMContentLoaded', loadPostIts);

// Create note on Ctrl + Right Click
document.addEventListener('mouseup', function(e) {
    if (e.button !== 2 || !e.ctrlKey) return;
    if (e.target.classList.contains('web-post-it')) return;
    
    e.preventDefault();
    
    const note = createPostIt(e.pageX, e.pageY);
    const noteId = `note-${Date.now()}`;
    note.id = noteId;
    
    postIts[noteId] = {
        x: e.pageX,
        y: e.pageY,
        text: '',
        width: '200px',
        height: '100px',
        element: e.target.tagName,
        elementPath: getElementPath(e.target)
    };
    
    savePostIts();
});

// Prevent context menu when creating a note
document.addEventListener('contextmenu', function(e) {
    if (e.ctrlKey) {
        e.preventDefault();
    }
});