// main.js
// This is the Node.js backend for your Electron app.

const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');

// --- NEW: Handle development mode warning for auto-start ---
// We store this path for app.setLoginItemSettings.
// This is necessary for the packaged app to auto-start correctly.
const appFolder = path.dirname(process.execPath);
const exeName = path.basename(process.execPath);
const appPath = process.execPath;


// Function to create the main application window
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('one_shortcut.html');
  // Optional: Open DevTools
  // win.webContents.openDevTools();
}

// --- App Lifecycle ---
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPC (Inter-Process Communication) ---

/**
 * @summary Opens the OS's native "Open File" dialog
 */
ipcMain.handle('open-file-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select a file, app, or executable',
    properties: ['openFile', 'openDirectory'] 
  });

  if (canceled) {
    return null; // User cancelled
  } else {
    return filePaths[0]; // Return the selected path
  }
});

/**
 * @summary Launches a file or web URL.
 */
ipcMain.handle('launch-shortcut', async (event, filePath) => {
  return new Promise(async (resolve, reject) => {
    
    // 1. Check if it's a web URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      try {
        await shell.openExternal(filePath);
        resolve({ success: true, message: 'Web URL opened in browser.' });
      } catch (err) {
        console.error(err);
        reject(new Error(`Failed to open URL: ${err.message}`));
      }
      return;
    }

    // 2. It's a file path. Use shell.openPath()
    try {
      const errorMessage = await shell.openPath(filePath);
      if (errorMessage) {
        throw new Error(errorMessage);
      }
      resolve({ success: true, message: 'Path opened successfully.' });
    } catch (error) {
      console.error(`Failed to open path: ${error.message}`);
      reject(new Error(`Failed to open path: ${error.message}`));
    }
  });
});

/**
 * @summary NEW: Sets the app to auto-start on OS login.
 */
ipcMain.handle('set-auto-start', (event, autoStartEnabled) => {
  console.log(`Setting auto-start to: ${autoStartEnabled}`);
  
  // This API is the cross-platform way to set auto-start.
  // IMPORTANT: This may not work reliably in development mode (`npm start`).
  // It works correctly after the app is packaged.
  
  if (process.env.NODE_ENV === 'development') {
    console.warn('Auto-start setting is being set in development mode. This may not work correctly until the app is packaged.');
  }

  try {
    app.setLoginItemSettings({
      openAtLogin: autoStartEnabled,
      // On Windows, you provide the path to the .exe
      path: appPath, 
      // On macOS, it's handled automatically by `openAtLogin`
    });
    return { success: true, message: `Auto-start set to ${autoStartEnabled}` };
  } catch (error) {
    console.error('Failed to set auto-start:', error);
    return { success: false, message: `Failed to set auto-start: ${error.message}` };
  }
});