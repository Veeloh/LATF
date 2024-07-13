// main.js

const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');

   

    // Example of handling folder selection dialog
    ipcMain.on('select-folder', async (event) => {
        // Show folder selection dialog
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory']
        });

        // Send selected folder path back to renderer process
        if (!result.canceled) {
            event.sender.send('selected-folder', result.filePaths[0]);
        }
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Create window on app ready
app.whenReady().then(createWindow);


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
