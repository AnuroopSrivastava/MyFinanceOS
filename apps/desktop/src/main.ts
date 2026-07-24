import { app, BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import { fileURLToPath } from 'url';
import * as os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
const dataDir = path.join(os.homedir(), '.financeos');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const backupFilePath = path.join(dataDir, 'financeos_data.json');
const configFilePath = path.join(dataDir, 'financeos_config.json');

const PORT = 5174;

function serveStatic(port: number, dir: string) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      // Remove query strings
      const rawUrl = req.url?.split('?')[0] || '/';
      let filePath = path.join(dir, rawUrl === '/' ? 'index.html' : rawUrl);
      
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(dir, 'index.html'); // SPA fallback
      }
      
      const extname = String(path.extname(filePath)).toLowerCase();
      const mimeTypes: { [key: string]: string } = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.svg': 'image/svg+xml',
        '.woff': 'application/font-woff',
        '.woff2': 'font/woff2',
        '.ttf': 'application/font-ttf'
      };

      const contentType = mimeTypes[extname] || 'application/octet-stream';
      fs.readFile(filePath, (error, content) => {
        if (error) {
          if (error.code === 'ENOENT') {
            res.writeHead(404);
            res.end('File not found', 'utf-8');
          } else {
            res.writeHead(500);
            res.end('Server Error: ' + error.code, 'utf-8');
          }
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, '../build/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'MyFinanceOS',
    autoHideMenuBar: true
  });

  // Spoof User-Agent for Google Auth to work in Electron
  const userAgent = mainWindow.webContents.userAgent;
  mainWindow.webContents.userAgent = userAgent.replace(/Electron\/\S*\s/, "");
  app.userAgentFallback = app.userAgentFallback.replace(/Electron\/\S*\s/, "");

  // Handle popups (specifically for Google Sign-in)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://accounts.google.com') || url.startsWith('https://myaccount.google.com')) {
      return { action: 'allow' };
    }
    // Open other links in external browser
    shell.openExternal(url);
    return { action: 'deny' };
  });

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
  } else {
    // Serve static files over HTTP to satisfy Google OAuth origin rules
    await serveStatic(PORT, path.join(__dirname, '../web-dist'));
    mainWindow.loadURL(`http://localhost:${PORT}`);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // IPC Local Backup writes
  ipcMain.handle('save-db-backup', async (_, encryptedPayload: string) => {
    try {
      fs.writeFileSync(backupFilePath, encryptedPayload, 'utf8');
      return { success: true };
    } catch (e) {
      console.error('Failed to write local backup database file', e);
      return { success: false, error: e };
    }
  });

  // IPC Local Backup reads
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

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
