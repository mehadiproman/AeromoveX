// =============================================================================
// FocusFlight — Preload Script (Secure Bridge)
// =============================================================================
// This script runs in a sandboxed context between the Main process and the
// Renderer process. It uses Electron's contextBridge to expose a safe API
// to the frontend without giving it direct access to Node.js.
//
// Security Model:
//   - contextIsolation: true  → renderer can't access Node globals
//   - nodeIntegration: false  → no require() in the renderer
//   - This preload exposes only specific IPC channels
// =============================================================================

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {

  // ── Session Operations ──
  saveSession: (session) => ipcRenderer.invoke('save-session', session),
  loadSessions: () => ipcRenderer.invoke('load-sessions'),

  // ── Settings Operations ──
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadSettings: () => ipcRenderer.invoke('load-settings'),

  // ── Notifications ──
  showNotification: (title, body) => ipcRenderer.invoke('show-notification', title, body),
});

// ---------------------------------------------------------------------------
// Global Error Forwarding — sends renderer errors to Main for logging
// ---------------------------------------------------------------------------
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
