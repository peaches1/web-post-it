// notes-list.js - JavaScript for the dedicated notes list page

class NotesManager {
    constructor() {
        this.allNotes = [];
        this.filteredNotes = [];
        this.settings = { fontSize: 12 }; // Default font size
        this.handleNoteAction = this.handleNoteAction.bind(this);
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadVersionInfo();
        await this.loadSettings();
        await this.loadNotes();
        this.updateStats();
        this.displayNotes();
    }

    loadVersionInfo() {
        try {
            const manifest = chrome.runtime.getManifest();
            const versionElement = document.getElementById('versionInfo');
            if (versionElement) {
                versionElement.textContent = `${manifest.name} - Version ${manifest.version}`;
            }
        } catch (error) {
            console.error('Error loading version info:', error);
        }
    }

    setupEventListeners() {
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterNotes(e.target.value);
        });

        // Sort functionality
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.sortNotes(e.target.value);
        });

        // Filter functionality
        document.getElementById('filterSelect').addEventListener('change', (e) => {
            this.applyFilter(e.target.value);
        });
    }

    async loadSettings() {
        try {
            const defaultSettings = { fontSize: 12, showFirstLineAsTitle: true };
            const settings = await new Promise(resolve => 
                chrome.storage.sync.get(defaultSettings, resolve)
            );
            this.settings = settings;
            this.applyFontSize();
        } catch (error) {
            console.error('Error loading settings:', error);
            // Use defaults if loading fails
            this.settings = { fontSize: 12, showFirstLineAsTitle: true };
            this.applyFontSize();
        }
    }

    applyFontSize() {
        // Create or update a style element for dynamic font sizing
        let styleElement = document.getElementById('dynamic-font-styles');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'dynamic-font-styles';
            document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = `
            .note-content {
                font-size: ${this.settings.fontSize}px !important;
            }
            .note-title {
                font-size: ${this.settings.fontSize}px !important;
            }
        `;
    }

    async loadNotes() {
        try {
            // Show loading state
            this.showLoading();

            // Load notes from both local and sync storage
            const [localData, syncData] = await Promise.all([
                new Promise(resolve => chrome.storage.local.get(null, resolve)),
                new Promise(resolve => chrome.storage.sync.get(null, resolve))
            ]);

            this.allNotes = [];

            // Process local storage notes (page-specific)
            if (localData.postIts) {
                Object.entries(localData.postIts).forEach(([url, urlNotes]) => {
                    Object.entries(urlNotes).forEach(([noteId, noteData]) => {
                        this.allNotes.push({
                            id: noteId,
                            title: this.extractTitle(noteData.text || ''),
                            content: noteData.text || '',
                            url: url,
                            createdAt: noteData.createdAt || Date.now(),
                            modifiedAt: noteData.modifiedAt || noteData.createdAt || Date.now(),
                            source: 'local'
                        });
                    });
                });
            }

            // Process sync storage notes (cross-device)
            Object.entries(syncData).forEach(([key, value]) => {
                if (key.startsWith('note_') && typeof value === 'object') {
                    // Avoid duplicates from local storage
                    const exists = this.allNotes.some(note => 
                        note.content === value.content && 
                        note.url === value.url
                    );
                    
                    if (!exists) {
                        this.allNotes.push({
                            id: key,
                            title: value.title || this.extractTitle(value.content || ''),
                            content: value.content || '',
                            url: value.url || 'Unknown',
                            createdAt: value.createdAt || Date.now(),
                            modifiedAt: value.modifiedAt || value.createdAt || Date.now(),
                            source: 'sync'
                        });
                    }
                }
            });

            // Sort by creation date (newest first) by default
            this.allNotes.sort((a, b) => b.createdAt - a.createdAt);
            this.filteredNotes = [...this.allNotes];

        } catch (error) {
            console.error('Error loading notes:', error);
            this.showError('Failed to load notes. Please try refreshing the page.');
        }
    }

    extractTitle(text) {
        if (!text) return 'Untitled Note';
        const firstLine = text.split('\n')[0].trim();
        return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine || 'Untitled Note';
    }

    updateStats() {
        const totalNotes = this.allNotes.length;
        const uniqueWebsites = new Set(this.allNotes.map(note => this.getDomain(note.url))).size;
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recentNotes = this.allNotes.filter(note => note.createdAt > oneWeekAgo).length;

        document.getElementById('totalNotes').textContent = totalNotes;
        document.getElementById('totalWebsites').textContent = uniqueWebsites;
        document.getElementById('recentNotes').textContent = recentNotes;
    }

    getDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    filterNotes(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        
        if (!term) {
            this.filteredNotes = [...this.allNotes];
        } else {
            this.filteredNotes = this.allNotes.filter(note => 
                note.title.toLowerCase().includes(term) ||
                note.content.toLowerCase().includes(term) ||
                note.url.toLowerCase().includes(term)
            );
        }

        this.displayNotes();
    }

    sortNotes(sortBy) {
        this.filteredNotes.sort((a, b) => {
            switch (sortBy) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'url':
                    return a.url.localeCompare(b.url);
                case 'date':
                default:
                    return b.createdAt - a.createdAt;
            }
        });

        this.displayNotes();
    }

    applyFilter(filterType) {
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

        switch (filterType) {
            case 'recent':
                this.filteredNotes = this.allNotes.filter(note => note.createdAt > oneWeekAgo);
                break;
            case 'older':
                this.filteredNotes = this.allNotes.filter(note => note.createdAt <= oneWeekAgo);
                break;
            case 'all':
            default:
                this.filteredNotes = [...this.allNotes];
                break;
        }

        this.displayNotes();
    }

    displayNotes() {
        const container = document.getElementById('notesContainer');

        if (this.filteredNotes.length === 0) {
            container.innerHTML = this.getEmptyStateHTML();
            this.updatePageTitle();
            return;
        }

        // Group notes by domain
        const notesByDomain = this.groupNotesByDomain(this.filteredNotes);
        
        // Update page title with domain info
        this.updatePageTitle(Object.keys(notesByDomain));

        // Create HTML for domain sections
        const domainsHTML = Object.entries(notesByDomain)
            .map(([domain, domainNotes]) => this.createDomainSection(domain, domainNotes))
            .join('');

        container.innerHTML = `<div class="domains-container">${domainsHTML}</div>`;

        // Attach event listeners to action buttons
        this.attachNoteEventListeners();
    }

    groupNotesByDomain(notes) {
        const grouped = {};
        notes.forEach(note => {
            const domain = this.getDomain(note.url);
            if (!grouped[domain]) {
                grouped[domain] = [];
            }
            grouped[domain].push(note);
        });

        // Sort domains alphabetically
        const sortedGrouped = {};
        Object.keys(grouped).sort().forEach(domain => {
            sortedGrouped[domain] = grouped[domain];
        });

        return sortedGrouped;
    }

    // Helper function to clean domain name for display
    cleanDomainForDisplay(domain) {
        return domain.startsWith('www.') ? domain.substring(4) : domain;
    }

    // Helper function to remove query parameters from URL
    removeQueryParameters(url) {
        try {
            const urlObj = new URL(url);
            return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
        } catch (error) {
            // If URL parsing fails, return original URL
            const queryIndex = url.indexOf('?');
            return queryIndex !== -1 ? url.substring(0, queryIndex) : url;
        }
    }

    // Helper function to format URL with domain normal and path bold
    formatUrlDisplay(url) {
        try {
            const urlObj = new URL(url);
            const domain = `${urlObj.protocol}//${urlObj.host}`;
            const path = urlObj.pathname;
            
            if (path === '/' || path === '') {
                return this.escapeHtml(domain);
            }
            
            return `${this.escapeHtml(domain)}<strong>${this.escapeHtml(path)}</strong>`;
        } catch (error) {
            // If URL parsing fails, return escaped original URL
            return this.escapeHtml(url);
        }
    }

    createDomainSection(domain, notes) {
        const notesHTML = notes.map(note => this.createNoteCard(note)).join('');
        const noteCount = notes.length;
        const pluralText = noteCount === 1 ? 'note' : 'notes';
        const displayDomain = this.cleanDomainForDisplay(domain);

        return `
            <div class="domain-section">
                <div class="domain-header">
                    <h2 class="domain-title">
                        <span class="domain-icon">🌐</span>
                        ${this.escapeHtml(displayDomain)}
                        <span class="note-count">(${noteCount} ${pluralText})</span>
                    </h2>
                </div>
                <div class="notes-grid">${notesHTML}</div>
            </div>
        `;
    }

    updatePageTitle(domains = []) {
        const pageTitle = document.getElementById('pageTitle');
        const headerTitle = document.querySelector('.header h1');
        
        if (domains.length === 0) {
            pageTitle.textContent = 'Web Post-it Notes - No Notes';
            return;
        }

        if (domains.length === 1) {
            const displayDomain = this.cleanDomainForDisplay(domains[0]);
            pageTitle.textContent = `Web Post-it Notes - ${displayDomain}`;
            if (headerTitle) {
                headerTitle.innerHTML = `📝 Notes from <strong>${this.escapeHtml(displayDomain)}</strong>`;
            }
        } else {
            pageTitle.textContent = `Web Post-it Notes - ${domains.length} Websites`;
            if (headerTitle) {
                headerTitle.innerHTML = `📝 Notes from <strong>${domains.length} Websites</strong>`;
            }
        }
    }

    createNoteCard(note) {
        const createdDate = new Date(note.createdAt).toLocaleDateString();
        const domain = this.getDomain(note.url);
        const cleanUrl = this.removeQueryParameters(note.url);
        const formattedUrl = this.formatUrlDisplay(cleanUrl);
        const isLongContent = note.content.length > 200;
        const displayContent = isLongContent ? 
            note.content.substring(0, 200) + '...' : 
            note.content;

        return `
            <article class="note-card" data-note-id="${note.id}" data-note-source="${note.source}">
                <div class="note-header">
                    <h3 class="note-title" title="${this.escapeHtml(note.title)}">${this.escapeHtml(note.title)}</h3>
                    <time class="note-date" datetime="${new Date(note.createdAt).toISOString()}">${createdDate}</time>
                </div>
                <div class="note-content${isLongContent ? ' long' : ''}">${this.escapeHtml(displayContent)}</div>
                <div class="note-url" title="${this.escapeHtml(note.url)}">${formattedUrl}</div>
                <div class="note-actions">
                    <button class="action-btn btn-visit" data-action="visit" data-note-id="${note.id}"
                            aria-label="Visit website where this note was created">
                        Visit Site
                    </button>
                    <button class="action-btn btn-delete" data-action="delete" data-note-id="${note.id}" data-note-source="${note.source}"
                            aria-label="Delete this note">
                        Delete
                    </button>
                </div>
            </article>
        `;
    }

    attachNoteEventListeners() {
        // Use event delegation to handle button clicks
        const notesContainer = document.getElementById('notesContainer');
        
        // Remove any existing listeners to prevent duplicates
        notesContainer.removeEventListener('click', this.handleNoteAction);
        
        // Add event listener (already bound in constructor)
        notesContainer.addEventListener('click', this.handleNoteAction);
    }

    handleNoteAction(event) {
        const button = event.target;
        
        // Check if clicked element is an action button
        if (!button.classList.contains('action-btn')) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();

        const action = button.getAttribute('data-action');
        const noteId = button.getAttribute('data-note-id');
        const noteSource = button.getAttribute('data-note-source');

        if (action === 'visit') {
            this.visitNote(noteId);
        } else if (action === 'delete') {
            this.deleteNote(noteId, noteSource);
        }
    }

    async visitNote(noteId) {
        const note = this.allNotes.find(n => n.id === noteId);
        if (note && note.url) {
            try {
                await chrome.tabs.create({ url: note.url });
            } catch (error) {
                console.error('Error opening tab:', error);
                alert('Unable to open the website. Please check if the URL is valid.');
            }
        }
    }

    async deleteNote(noteId, source) {
        if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            return;
        }

        try {
            // Find the note card element and start animation
            const noteCard = document.querySelector(`[data-note-id="${noteId}"]`);
            if (noteCard) {
                // Add fade-out animation class
                noteCard.classList.add('fade-out');
                
                // Wait for animation to complete before removing from DOM and storage
                await new Promise(resolve => {
                    setTimeout(resolve, 400); // Match the CSS animation duration
                });
            }

            // Remove from appropriate storage
            if (source === 'sync') {
                await new Promise(resolve => chrome.storage.sync.remove(noteId, resolve));
            } else {
                // For local storage, we need to find and remove from the nested structure
                const note = this.allNotes.find(n => n.id === noteId);
                if (note) {
                    chrome.storage.local.get('postIts', (result) => {
                        if (result.postIts && result.postIts[note.url]) {
                            delete result.postIts[note.url][noteId];
                            
                            // If no more notes for this URL, remove the URL entry
                            if (Object.keys(result.postIts[note.url]).length === 0) {
                                delete result.postIts[note.url];
                            }
                            
                            chrome.storage.local.set({ postIts: result.postIts });
                        }
                    });
                }
            }

            // Remove from local arrays
            this.allNotes = this.allNotes.filter(n => n.id !== noteId);
            this.filteredNotes = this.filteredNotes.filter(n => n.id !== noteId);

            // Update display
            this.updateStats();
            this.displayNotes();

            // Show success message
            this.showTemporaryMessage('Note deleted successfully', 'success');

        } catch (error) {
            console.error('Error deleting note:', error);
            this.showTemporaryMessage('Failed to delete note. Please try again.', 'error');
        }
    }

    showLoading() {
        document.getElementById('notesContainer').innerHTML = `
            <div class="loading" id="loadingState">
                Loading your notes...
            </div>
        `;
    }

    showError(message) {
        document.getElementById('notesContainer').innerHTML = `
            <div class="error-state">
                <h2>⚠️ Error</h2>
                <p>${this.escapeHtml(message)}</p>
                <button id="retryButton" class="btn-retry" style="margin-top: 15px; padding: 10px 20px; background: #cc9900; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Try Again
                </button>
            </div>
        `;
        
        // Add event listener for retry button
        setTimeout(() => {
            const retryButton = document.getElementById('retryButton');
            if (retryButton) {
                retryButton.addEventListener('click', () => {
                    location.reload();
                });
            }
        }, 0);
    }

    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <h2>📝 No Notes Found</h2>
                <p>You haven't created any post-it notes yet. Start by visiting a website and creating your first note!</p>
                <p><strong>How to create notes:</strong></p>
                <p>Hold <kbd>Ctrl</kbd> and click anywhere on a webpage to create a new post-it note.</p>
            </div>
        `;
    }

    showTemporaryMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `temporary-message ${type}`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 6px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            background: ${type === 'success' ? '#28a745' : '#dc3545'};
        `;
        messageDiv.textContent = message;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Add CSS for temporary messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    kbd {
        background: #f1f1f1;
        border: 1px solid #ccc;
        border-radius: 3px;
        padding: 2px 4px;
        font-family: monospace;
    }
`;
document.head.appendChild(style);

// Initialize the notes manager when the page loads
let notesManager;
document.addEventListener('DOMContentLoaded', () => {
    notesManager = new NotesManager();
});

// Handle page visibility changes to refresh data
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && notesManager) {
        Promise.all([
            notesManager.loadSettings(),
            notesManager.loadNotes()
        ]).then(() => {
            notesManager.updateStats();
            notesManager.displayNotes();
        });
    }
});
