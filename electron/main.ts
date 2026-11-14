import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const DB_PATH = path.join(app.getPath('userData'), 'guzelyali.db');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 768,
    title: 'Güzelyalı ERP — Restoran Mühendislik ve Muhasebe Sistemi',
    icon: path.join(__dirname, '../public/logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    backgroundColor: '#0F172A',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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

// --- IPC HANDLERS ---
// Database Persistence Handlers
ipcMain.handle('db:load', async () => {
  try {
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      return buffer;
    }
    return null;
  } catch (error) {
    console.error('Failed to load database file:', error);
    return null;
  }
});

ipcMain.handle('db:save', async (_event, data: Uint8Array) => {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    return true;
  } catch (error) {
    console.error('Failed to save database file:', error);
    return false;
  }
});

// Backup File Export
ipcMain.handle('backup:export', async (_event, base64Content: string) => {
  if (!mainWindow) return { success: false };
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Güzelyalı ERP Yedek Dosyası Kaydet',
    defaultPath: `guzelyali_erp_yedek_${new Date().toISOString().split('T')[0]}.gzy`,
    filters: [{ name: 'Güzelyalı ERP Yedek (*.gzy)', extensions: ['gzy', 'sqlite', 'db'] }],
  });

  if (filePath) {
    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(filePath, buffer);
    return { success: true, filePath };
  }
  return { success: false, cancelled: true };
});

// Backup File Import
ipcMain.handle('backup:import', async () => {
  if (!mainWindow) return null;
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Güzelyalı ERP Yedek Dosyası Seçin',
    filters: [{ name: 'Güzelyalı ERP Yedek (*.gzy)', extensions: ['gzy', 'sqlite', 'db'] }],
    properties: ['openFile'],
  });

  if (filePaths && filePaths.length > 0) {
    const buffer = fs.readFileSync(filePaths[0]);
    return buffer.toString('base64');
  }
  return null;
});

// Thermal Printing
ipcMain.handle('print:receipt', async (_event, _options) => {
  if (!mainWindow) return false;
  try {
    mainWindow.webContents.print({
      silent: false,
      printBackground: true,
      pageSize: {
        width: 80000, // 80mm in microns
        height: 297000,
      },
    });
    return true;
  } catch (err) {
    console.error('Print failed:', err);
    return false;
  }
});

// Window controls
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window:close', () => mainWindow?.close());
