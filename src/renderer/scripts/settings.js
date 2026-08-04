// =============================================================================
// FocusFlight — Settings Module
// =============================================================================
// Handles theme, notifications, and default timer preferences.
// Settings persist to settings.json via IPC.
//
// Note: init() and load() are called each time the Settings dropdown opens
// because the DOM elements are freshly loaded from the HTML fragment.
// loadOnStartup() is called once at app start to apply the theme.
// =============================================================================

const Settings = (() => {
  let currentSettings = {
    theme: 'dark',
    notifications: true,
    defaultTimer: 50,
  };

  // ---------------------------------------------------------------------------
  // loadOnStartup — called once when app starts (before dropdown exists)
  // Only loads settings and applies theme. Does NOT touch DOM form elements.
  // ---------------------------------------------------------------------------
  async function loadOnStartup() {
    currentSettings = await window.api.loadSettings();
    applyTheme(currentSettings.theme);
  }

  // ---------------------------------------------------------------------------
  // init — bind events to dropdown DOM elements (called when dropdown opens)
  // ---------------------------------------------------------------------------
  function init() {
    const themeSelect = document.getElementById('setting-theme');
    const notifToggle = document.getElementById('setting-notifications');
    const timerSelect = document.getElementById('setting-default-timer');

    if (themeSelect) {
      themeSelect.addEventListener('change', async () => {
        currentSettings.theme = themeSelect.value;
        applyTheme(currentSettings.theme);
        await save();
      });
    }

    if (notifToggle) {
      notifToggle.addEventListener('change', async () => {
        currentSettings.notifications = notifToggle.checked;
        await save();
      });
    }

    if (timerSelect) {
      timerSelect.addEventListener('change', async () => {
        currentSettings.defaultTimer = parseInt(timerSelect.value);
        await save();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // load — populate dropdown form elements with current values
  // ---------------------------------------------------------------------------
  async function load() {
    currentSettings = await window.api.loadSettings();

    const themeSelect = document.getElementById('setting-theme');
    const notifToggle = document.getElementById('setting-notifications');
    const timerSelect = document.getElementById('setting-default-timer');

    if (themeSelect) themeSelect.value = currentSettings.theme;
    if (notifToggle) notifToggle.checked = currentSettings.notifications;
    if (timerSelect) timerSelect.value = String(currentSettings.defaultTimer);
  }

  // ---------------------------------------------------------------------------
  // Apply theme
  // ---------------------------------------------------------------------------
  function applyTheme(theme) {
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }

  // ---------------------------------------------------------------------------
  // Save settings via IPC
  // ---------------------------------------------------------------------------
  async function save() {
    await window.api.saveSettings(currentSettings);
  }

  return { init, load, loadOnStartup, applyTheme };
})();
