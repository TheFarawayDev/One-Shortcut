// preload.js
// This script runs in a special context, bridging the "web" world
// (one_shortcut.html) and the "Node.js" world (main.js).

const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the window (your HTML)
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * @summary Invokes the 'launch-shortcut' function in main.js
   * @param {string} filePath - The path to the file to launch
   * @returns {Promise<object>} - A promise that resolves or rejects based on success
   */
  launchShortcut: (filePath) => ipcRenderer.invoke('launch-shortcut', filePath),

  /**
   * @summary Invokes the 'open-file-dialog' function in main.js
   * @returns {Promise<string | null>} - The selected file path or null if canceled
   */
  openFile: () => ipcRenderer.invoke('open-file-dialog'),

  /**
   * @summary NEW: Invokes the 'set-auto-start' function in main.js
   * @param {boolean} isEnabled - Whether to enable auto-start or not
   * @returns {Promise<object>}
   */
  setAutoStart: (isEnabled) => ipcRenderer.invoke('set-auto-start', isEnabled)
});

console.log('Electron API exposed to window');