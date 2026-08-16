const { app, BrowserWindow } = require('electron');
const path = require('path');

const { fork } = require('child_process');

let mainWindow;
let serverProcess;

const fs = require('fs');

function startServer() {
  const isDev = !app.isPackaged;
  if (!isDev) {
    const serverPath = path.join(__dirname, '../dist/boot.js');
    
    const envPath = path.join(__dirname, '../.env.production');
    let prodEnv = {};
    try {
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
          const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
          if (match) {
            prodEnv[match[1]] = match[2].trim();
          }
        });
      }
    } catch (e) {
      console.error('Failed to load .env.production', e);
    }

    serverProcess = fork(serverPath, [], {
      env: { ...process.env, ...prodEnv, NODE_ENV: 'production' },
      stdio: 'ignore'
    });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    title: 'سليم HR',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    titleBarStyle: 'default',
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/public/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startServer();
  createWindow();
});

app.on('will-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
