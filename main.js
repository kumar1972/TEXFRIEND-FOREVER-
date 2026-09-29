const {
  app,
  BrowserWindow,
  dialog,
  ipcMain
} = require('electron');

const path = require('path');
const fs = require('fs');

let selectedStorageFolder = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'icon-512.png'),

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('index.html');
}

// Select Storage Folder
ipcMain.handle('select-storage-folder', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select TEXFOREVER Data Folder',
    properties: ['openDirectory', 'createDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return {
      success: false,
      message: 'Folder selection cancelled'
    };
  }

  selectedStorageFolder = result.filePaths[0];

  return {
    success: true,
    folder: selectedStorageFolder
  };
});

// Save ERP Data
ipcMain.handle('save-erp-data', async (event, data) => {
  try {
    if (!selectedStorageFolder) {
      return {
        success: false,
        message: 'Please select a storage folder first'
      };
    }

    const filePath = path.join(
      selectedStorageFolder,
      'texforever_data.json'
    );

    fs.writeFileSync(
      filePath,
      JSON.stringify(data, null, 2),
      'utf8'
    );

    return {
      success: true,
      message: 'Data saved successfully',
      filePath
    };

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
});

// Load ERP Data
ipcMain.handle('load-erp-data', async () => {
  try {
    if (!selectedStorageFolder) {
      return {
        success: false,
        message: 'Please select a storage folder first'
      };
    }

    const filePath = path.join(
      selectedStorageFolder,
      'texforever_data.json'
    );

    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        message: 'No saved data found'
      };
    }

    const data = JSON.parse(
      fs.readFileSync(filePath, 'utf8')
    );

    return {
      success: true,
      data
    };

  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
