// Default settings
const defaultSettings = {
    fontSize: 12,
    showFirstLineAsTitle: true
};

// DOM elements
const fontSizeSlider = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const showFirstLineAsTitle = document.getElementById('showFirstLineAsTitle');
const saveStatus = document.getElementById('saveStatus');
const versionInfo = document.getElementById('versionInfo');

// Load version from manifest
const manifest = chrome.runtime.getManifest();
versionInfo.textContent = `Version ${manifest.version}`;

// Load saved settings
chrome.storage.sync.get(defaultSettings, function(settings) {
    fontSizeSlider.value = settings.fontSize;
    fontSizeValue.textContent = settings.fontSize + 'px';
    showFirstLineAsTitle.checked = settings.showFirstLineAsTitle;
});

// Update font size display
fontSizeSlider.addEventListener('input', function() {
    const value = parseInt(fontSizeSlider.value);
    fontSizeValue.textContent = value + 'px';
    saveSettings();
});

// Save settings when checkbox changes
showFirstLineAsTitle.addEventListener('change', saveSettings);

function saveSettings() {
    const settings = {
        fontSize: parseInt(fontSizeSlider.value),
        showFirstLineAsTitle: showFirstLineAsTitle.checked
    };
    
    chrome.storage.sync.set(settings, function() {
        // Show save confirmation
        saveStatus.style.display = 'block';
        saveStatus.className = 'save-status success';
        
        // Hide after 2 seconds
        setTimeout(() => {
            saveStatus.style.display = 'none';
        }, 2000);
        
        // Notify content scripts to update
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'updateSettings',
                settings: settings
            });
        });
    });
}
