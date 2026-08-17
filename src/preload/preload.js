// FocusFlight — Preload Script (Secure Bridge)

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Session Operations
  saveSession: (session) => ipcRenderer.invoke('save-session', session),
  loadSessions: () => ipcRenderer.invoke('load-sessions'),

  // Settings Operations
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),

  // Notifications
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
});

// Global Error Forwarding — sends renderer errors to Main for logging
window.onerror = function (message, source, lineno, colno, error) {
  ipcRenderer.send(
    'console-error',
    `[Window Error] ${message} at ${source}:${lineno}:${colno}\n${error?.stack}`
  );
};

window.addEventListener('unhandledrejection', function (event) {
  ipcRenderer.send(
    'console-error',
    `[Unhandled Rejection] ${event.reason?.stack || event.reason}`
  );
});
