# Web Post-it Notes

A browser extension that allows you to add sticky notes to any website. Create, edit, and manage notes that persist across browser sessions and sync across your devices.

## 🚀 How to Use

### Creating Notes
- **Windows/Linux**: `Ctrl` + Right Click on any webpage element
- **macOS**: `Cmd` + Right Click on any webpage element

### Managing Notes
- **Edit**: Click on any note to start typing
- **Move**: Drag notes by their header to reposition
- **Resize**: Drag the bottom-right corner to resize
- **Collapse/Expand**: Double-click the header or click the toggle button
- **Delete**: Click the ✖ button in the top-right corner
- **View All**: Click the extension icon → "View All Notes" button

## ⚙️ Settings

Access settings by clicking the extension icon in your browser toolbar:

- **Font Size**: Adjust note text size (8px-20px)
- **Header Display**: Toggle showing the first line as note title
- **View All Notes**: Open the notes management page

## 📋 Features

- 📌 **Persistent Notes**: Notes are saved automatically and persist across browser sessions
- 🌐 **Cross-Site**: Notes are organized by website domain
- 🔄 **Sync**: Notes sync across devices (when browser sync is enabled)
- 📱 **Responsive**: Works on desktop and mobile browsers
- 🎨 **Customizable**: Adjustable font sizes and display options
- 🔍 **Search**: Find notes quickly in the management interface

## 🆕 Version 0.9.7 (October 24, 2025)

### Latest Updates
- **🛡️ Complete Error Elimination**: Completely resolved "Extension context invalidated" errors
- **🍎 macOS Support**: Full Cmd+Right Click functionality for Mac users
- **⚡ Performance Optimization**: Debounced saves and intelligent error handling
- **📖 User Instructions**: Clear instructions in popup for both Mac and Windows
- **� Robust Context Handling**: Advanced extension context validation and recovery
- **� Silent Failure**: Graceful degradation when extension context is lost## 🔧 Installation

### For Developers
1. Clone this repository
2. Open your browser's extension management page
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `src` folder
5. The extension is now installed and ready to use

### From Store
*Coming soon to browser extension stores*

## 🎨 Technical Features

- **🖱️ Cross-Platform Shortcuts**: Supports both Ctrl (Windows/Linux) and Cmd (macOS) modifiers
- **🛡️ Error-Proof Architecture**: Complete protection against extension context invalidation
- **🔄 Smart Recovery**: Automatic retry mechanisms with context validation
- **📱 SPA Compatibility**: Optimized for Single Page Applications (Outlook, Gmail, Teams, etc.)
- **💾 Intelligent Storage**: Debounced saves with Chrome storage API synchronization
- **🔒 CSP Compliant**: Follows Content Security Policy best practices
- **⚡ Performance Optimized**: Minimal impact on webpage loading and performance
- **🚫 Silent Failure**: Graceful degradation when extension updates occur

## 🌐 Browser Compatibility

- ✅ **Chrome** (Chromium-based browsers) - Fully tested
- ✅ **Microsoft Edge** - Fully tested and optimized
- ✅ **Brave** - Compatible
- ✅ **Opera** - Compatible
- ⚠️ **Firefox** (Requires manifest v2 adaptation)
- ❌ **Safari** (Not supported)

## 🧪 Tested Environments

- ✅ **Outlook Web App** - Calendar, Mail, Teams integration
- ✅ **Gmail** - Full compatibility
- ✅ **Static Websites** - Perfect integration
- ✅ **Dynamic SPAs** - React, Angular, Vue applications
- ✅ **Corporate Portals** - Tested with enterprise applications

## 🔧 Troubleshooting

### Notes Not Appearing?
1. **Reload the extension**: Go to `edge://extensions/` and click reload
2. **Check permissions**: Ensure the extension has access to the website
3. **Clear cache**: Sometimes clearing browser cache helps
4. **Try incognito**: Test if the issue persists in incognito mode

### Creating Notes Not Working?
- **macOS**: Use `Cmd` + Right Click (not Ctrl)
- **Windows/Linux**: Use `Ctrl` + Right Click
- **Check console**: Open DevTools to see if there are any errors
- **Page reload**: Try refreshing the page and creating a note again

### Performance Issues?
- The extension uses debounced saves to minimize performance impact
- Notes are stored locally and sync across devices automatically
- Minimal memory footprint with intelligent context management

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension.

## 📄 License

This project is open source. Please check the license file for details.

## 🎨 Design Resources

[Icon Design Files](https://lun-eu.icons8.com/d/wwpxphdKb0GK5vvRt4oJEg?node=A3w5tuEre0ul8cAhOeefLg)

---

**Made by [Gravity Global AG](https://gravity.global/) © 2025**
