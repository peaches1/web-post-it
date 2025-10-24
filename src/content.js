let postIts = {};
const currentUrl = window.location.origin + window.location.pathname;
let extensionInvalidated = false;

// Global error handler for extension context errors
window.addEventListener('error', function(event) {
    if (event.error && event.error.message && event.error.message.includes('Extension context invalidated')) {
        console.log('Caught extension context error, flagging as invalidated');
        extensionInvalidated = true;
        event.preventDefault(); // Prevent the error from appearing in console
        return true;
    }
});

// Also handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('Extension context invalidated')) {
        console.log('Caught extension context promise rejection, flagging as invalidated');
        extensionInvalidated = true;
        event.preventDefault();
        return true;
    }
});

// Safe Chrome API wrapper
function safeChrome(callback) {
    // If we've already detected invalidation, don't try again
    if (extensionInvalidated) {
        return false;
    }
    
    try {
        // Check if chrome object exists and has runtime
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            console.log('Chrome API not available');
            extensionInvalidated = true;
            return false;
        }
        
        // Try to access chrome.runtime.id - this is where the error typically occurs
        const runtimeId = chrome.runtime.id;
        if (!runtimeId) {
            console.log('Extension context invalidated - no runtime ID');
            extensionInvalidated = true;
            return false;
        }
        
        return callback();
    } catch (error) {
        console.log('Chrome API error caught:', error.message);
        extensionInvalidated = true;
        return false;
    }
}

// Global extension context checker
function isExtensionContextValid() {
    return safeChrome(() => true) || false;
}

// Debounced save to prevent rapid calls
let saveTimeout;
function debouncedSavePostIts() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        safeChrome(() => {
            savePostIts();
            return true;
        });
    }, 300);
}

// Default settings
let settings = {
    fontSize: 12,
    showFirstLineAsTitle: true
};

// Load settings
safeChrome(() => {
    chrome.storage.sync.get(settings, function(savedSettings) {
        safeChrome(() => {
            if (chrome.runtime.lastError) {
                console.error('Settings load error:', chrome.runtime.lastError);
                return true;
            }
            settings = savedSettings;
            updateGlobalStyles();
            return true;
        });
    });
    return true;
});

// Listen for settings updates from popup
safeChrome(() => {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        safeChrome(() => {
            if (request.action === 'updateSettings') {
                settings = request.settings;
                updateGlobalStyles();
                updateAllNotes();
            }
            return true;
        });
    });
    return true;
});

// Update global CSS styles based on settings
function updateGlobalStyles() {
    let styleEl = document.getElementById('web-post-it-dynamic-styles');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'web-post-it-dynamic-styles';
        document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = `
        .web-post-it {
            font-size: ${settings.fontSize}px !important;
        }
        .web-post-it textarea {
            font-size: ${settings.fontSize}px !important;
        }
        .web-post-it-header {
            font-size: ${settings.fontSize}px !important;
        }
        .web-post-it-header-text {
            font-size: ${settings.fontSize}px !important;
        }
    `;
}

// Update all existing notes with new settings
function updateAllNotes() {
    document.querySelectorAll('.web-post-it').forEach(postIt => {
        const headerText = postIt.querySelector('.web-post-it-header-text');
        const textarea = postIt.querySelector('textarea');
        
        if (headerText && textarea) {
            if (settings.showFirstLineAsTitle) {
                const firstLine = textarea.value.split('\n')[0] || 'New Note';
                headerText.textContent = firstLine;
                headerText.style.display = 'block';
            } else {
                headerText.textContent = 'Note';
                headerText.style.display = 'block';
            }
        }
    });
}

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

function createPostIt(x, y, text = '', width = '200px', height = '100px', collapsed = false) {
    const postIt = document.createElement('div');
    postIt.className = 'web-post-it';
    postIt.style.left = `${x}px`;
    postIt.style.top = `${y}px`;
    postIt.style.width = width;
    postIt.style.height = height;
    
    // Create header
    const header = document.createElement('div');
    header.className = 'web-post-it-header';
    
    // Create header content container
    const headerContent = document.createElement('div');
    headerContent.style.display = 'flex';
    headerContent.style.alignItems = 'center';
    headerContent.style.flex = '1';
    
    // Create header text (first line of note or static title)
    const headerText = document.createElement('span');
    headerText.className = 'web-post-it-header-text';
    
    if (settings.showFirstLineAsTitle) {
        headerText.textContent = text ? text.split('\n')[0] || 'New Note' : 'New Note';
    } else {
        headerText.textContent = 'Note';
    }
    
    headerContent.appendChild(headerText);
    
    // Create toggle button
    const toggleBtn = document.createElement('span');
    toggleBtn.className = 'web-post-it-toggle';
    toggleBtn.textContent = collapsed ? '▶' : '▼';
    toggleBtn.tabIndex = -1; // Prevent focus
    
    // Prevent focus events
    toggleBtn.addEventListener('focus', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.blur();
    });
    
    // Create close button
    const closeBtn = document.createElement('span');
    closeBtn.className = 'web-post-it-close';
    closeBtn.textContent = '×';
    closeBtn.tabIndex = -1; // Prevent focus
    
    // Prevent focus events
    closeBtn.addEventListener('focus', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.blur();
    });
    
    closeBtn.onclick = function(e) {
        e.stopPropagation();
        postIt.remove();
        delete postIts[postIt.id];
        savePostIts();
    };
    
    header.appendChild(headerContent);
    header.appendChild(toggleBtn);
    header.appendChild(closeBtn);
    
    // Prevent focus on header
    header.tabIndex = -1;
    header.addEventListener('focus', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.blur();
    });
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'web-post-it-content';
    if (collapsed) {
        content.classList.add('collapsed');
        postIt.classList.add('collapsed');
    }
    
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.placeholder = 'Type your note here...';
    textarea.oninput = function() {
        // Update header text based on settings
        if (settings.showFirstLineAsTitle) {
            const firstLine = textarea.value.split('\n')[0] || 'New Note';
            headerText.textContent = firstLine;
        }
        
        if (postIt.id) {
            postIts[postIt.id].text = textarea.value;
            debouncedSavePostIts();
        }
    };
    
    content.appendChild(textarea);
    
    // Toggle functionality
    const toggleNote = function() {
        const isCollapsed = content.classList.contains('collapsed');
        content.classList.toggle('collapsed');
        postIt.classList.toggle('collapsed', !isCollapsed);
        toggleBtn.textContent = isCollapsed ? '▼' : '▶';
        
        if (postIt.id) {
            postIts[postIt.id].collapsed = !isCollapsed;
            debouncedSavePostIts();
        }
    };
    
    header.addEventListener('dblclick', toggleNote);
    toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleNote();
    });
    
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
                debouncedSavePostIts();
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
            debouncedSavePostIts();
        }
    });
    
    resizeObserver.observe(postIt);
    
    postIt.appendChild(header);
    postIt.appendChild(content);
    document.body.appendChild(postIt);
    
    return postIt;
}

function loadPostIts() {
    console.log('Loading notes for:', currentUrl);
    
    safeChrome(() => {
        chrome.storage.local.get(null, function(result) {
            safeChrome(() => {
                if (chrome.runtime.lastError) {
                    console.error('Load error:', chrome.runtime.lastError);
                    return true;
                }
                if (result.postIts && result.postIts[currentUrl]) {
                    clearExistingNotes(); // Clear existing notes first
                    postIts = result.postIts[currentUrl];
                    displaySavedPostIts();
                }
                return true;
            });
        });
        return true;
    });
}

function savePostIts() {
    safeChrome(() => {
        chrome.storage.local.get(null, function(result) {
            safeChrome(() => {
                if (chrome.runtime.lastError) {
                    console.error('Save error:', chrome.runtime.lastError);
                    return true;
                }
                let allPostIts = result.postIts || {};
                allPostIts[currentUrl] = postIts;
                chrome.storage.local.set({ postIts: allPostIts }, function() {
                    safeChrome(() => {
                        if (chrome.runtime.lastError) {
                            console.error('Save error:', chrome.runtime.lastError);
                        } else {
                            console.log('Notes saved:', allPostIts);
                        }
                        return true;
                    });
                });
                return true;
            });
        });
        return true;
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
            data.height || '100px',
            data.collapsed || false
        );
        note.id = id;
    });
}

// Retry loading notes with a delay if extension context is not available
function loadPostItsWithRetry(retryCount = 0) {
    const contextValid = safeChrome(() => {
        loadPostIts();
        return true;
    });
    
    if (!contextValid && retryCount < 5) {
        console.log(`Extension context not ready, retrying in ${(retryCount + 1) * 500}ms...`);
        setTimeout(() => loadPostItsWithRetry(retryCount + 1), (retryCount + 1) * 500);
    } else if (!contextValid) {
        console.log('Extension context failed to initialize after multiple retries');
    }
}

// Event Listeners
window.addEventListener('load', loadPostItsWithRetry);
document.addEventListener('DOMContentLoaded', loadPostItsWithRetry);

// Create note on Ctrl + Right Click (Windows/Linux) or Cmd + Right Click (macOS)
document.addEventListener('mouseup', function(e) {
    if (e.button !== 2 || !(e.ctrlKey || e.metaKey)) return;
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
        collapsed: false,
        element: e.target.tagName,
        elementPath: getElementPath(e.target)
    };
    
    savePostIts();
});

// Prevent context menu when creating a note
document.addEventListener('contextmenu', function(e) {
    if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
    }
});