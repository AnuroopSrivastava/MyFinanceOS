import { app, BrowserWindow, ipcMain, protocol, net } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, bypassCSP: true } }
]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import * as os from 'os';

let mainWindow: BrowserWindow | null = null;

const dataDir = path.join(os.homedir(), '.financeos');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const backupFilePath = path.join(dataDir, 'financeos_data.json');
const configFilePath = path.join(dataDir, 'financeos_config.json');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'MyFinanceOS',
    autoHideMenuBar: true
  });

  // In development, load the Vite dev server URL
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    const loadDevServer = () => {
      if (!mainWindow) return;
      mainWindow.loadURL('http://localhost:3000').catch((err) => {
        console.log('Vite server not ready yet, retrying in 500ms...', err.message);
        setTimeout(loadDevServer, 500);
      });
    };
    loadDevServer();
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('app://-/index.html');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    const urlObj = new URL(request.url);
    const pathname = decodeURIComponent(urlObj.pathname);
    let filePath = path.join(__dirname, '../web-dist', pathname);

    // Fallback for Single Page Application (SPA) routing
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(__dirname, '../web-dist', 'index.html');
    }

    return net.fetch(pathToFileURL(filePath).toString());
  });

  // IPC Backup writes
  ipcMain.handle('save-db-backup', async (_, encryptedPayload: string) => {
    try {
      fs.writeFileSync(backupFilePath, encryptedPayload, 'utf8');
      return { success: true };
    } catch (e) {
      console.error('Failed to write local backup database file', e);
      return { success: false, error: e };
    }
  });

  // IPC Backup reads
  ipcMain.handle('load-db-backup', async () => {
    try {
      if (fs.existsSync(backupFilePath)) {
        const payload = fs.readFileSync(backupFilePath, 'utf8');
        return { success: true, payload };
      }
      return { success: false, error: 'File does not exist' };
    } catch (e) {
      console.error('Failed to read local backup database file', e);
      return { success: false, error: e };
    }
  });

  // Config sync handlers
  ipcMain.handle('save-config-backup', async (_, configPayload: string) => {
    try {
      fs.writeFileSync(configFilePath, configPayload, 'utf8');
      return { success: true };
    } catch (e) {
      console.error('Failed to write local config file', e);
      return { success: false, error: e };
    }
  });

  ipcMain.handle('load-config-backup', async () => {
    try {
      if (fs.existsSync(configFilePath)) {
        const payload = fs.readFileSync(configFilePath, 'utf8');
        return { success: true, payload };
      }
      return { success: false, error: 'File does not exist' };
    } catch (e) {
      console.error('Failed to read local config file', e);
      return { success: false, error: e };
    }
  });

  createWindow();

  // Watch for external database changes
  let watchDebounce: NodeJS.Timeout;
  fs.watch(dataDir, (eventType, filename) => {
    if (filename === 'financeos_data.json') {
      clearTimeout(watchDebounce);
      watchDebounce = setTimeout(() => {
        BrowserWindow.getAllWindows().forEach(win => {
          win.webContents.send('db-external-change');
        });
      }, 100); // debounce to avoid multiple triggers on single file save
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
