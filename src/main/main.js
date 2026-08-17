// FocusFlight — Main Process

const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const { startServer } = require('./server');
const path = require('path');
const fs = require('fs');

// File paths for persistent data
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const SESSIONS_PATH = path.join(DATA_DIR, 'sessions.json');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

// Helper: Read JSON file safely
function readJSON(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Helper: Write JSON file
function writeJSON(filePath, data) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// IPC Handlers — Renderer to Main

// Save a completed session
ipcMain.handle('save-session', async (_event, session) => {
  const sessions = readJSON(SESSIONS_PATH, []);
  session.id = sessions.length > 0 ? sessions[sessions.length - 1].id + 1 : 1;
  sessions.push(session);
  writeJSON(SESSIONS_PATH, sessions);
  return session;
});

// Load all sessions
ipcMain.handle('load-sessions', async () => {
  return readJSON(SESSIONS_PATH, []);
});

// Save settings
ipcMain.handle('save-settings', async (_event, settings) => {
  writeJSON(SETTINGS_PATH, settings);
  return settings;
});

// Load settings
ipcMain.handle('load-settings', async () => {
  return readJSON(SETTINGS_PATH, {
    notifications: true,
    defaultTimer: 50,
  });
});

// Show a native desktop notification
ipcMain.handle('show-notification', async (_event, title, body) => {
  if (Notification.isSupported()) {
    const notification = new Notification({ title, body });
    notification.show();
  }
  return true;
});

// Log frontend errors for debugging
ipcMain.on('console-error', (_event, message) => {
  console.log('\n!!! FRONTEND ERROR !!!');
  console.log(message);
  console.log('!!! END FRONTEND ERROR !!!\n');
});

// Window Creation
function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#FFFFFF',
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Remove the default menu bar for a cleaner look
  window.setMenuBarVisibility(false);

  window.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
}

// App Lifecycle
app.whenReady().then(() => {
  createWindow();
  startServer(3000);

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
