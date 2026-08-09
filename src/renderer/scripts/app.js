// =============================================================================
// FocusFlight — Single Window App Controller
// =============================================================================

const App = (() => {
  let els = {};

  async function init() {
    Timer.init();
    Dashboard.init();
    await Dashboard.load();

    els = {
      statToday: document.getElementById('stat-today'),
      statWeek: document.getElementById('stat-week'),
      statStreak: document.getElementById('stat-streak'),
      headerStreak: document.getElementById('header-streak-count'),
      recentList: document.getElementById('recent-sessions-list'),

      // Settings modal
      settingsTrigger: document.getElementById('settings-trigger'),
      settingsModal: document.getElementById('settings-modal'),
      settingsClose: document.getElementById('settings-close'),
      modalDuration: document.getElementById('modal-timer-duration'),
      modalRoute: document.getElementById('modal-flight-route'),
    };

    setupSettingsModal();
    setupCompletionModal();
    await reloadData();

    if (window.lucide) window.lucide.createIcons();
  }

  async function reloadData() {
    await Dashboard.load();
    const sessions = await window.api.loadSessions();
    const completed = sessions.filter(s => s.completed);

    renderSummaryMetrics(completed);
    renderRecentSessions(sessions);
  }

  function renderSummaryMetrics(sessions) {
    const today = new Date().toISOString().split('T')[0];
    const weekDays = getLast7Days();

    const todayMin = sessions.filter(s => s.date === today)
      .reduce((sum, s) => sum + (s.duration || 0), 0);
    const weekMin = sessions.filter(s => weekDays.includes(s.date))
      .reduce((sum, s) => sum + (s.duration || 0), 0);

    const currentStreak = computeStreak(sessions);

    if (els.statToday) els.statToday.textContent = (todayMin / 60).toFixed(1) + 'h';
    if (els.statWeek) els.statWeek.textContent = (weekMin / 60).toFixed(1) + 'h';
    if (els.statStreak) els.statStreak.textContent = currentStreak + ' Days';
    if (els.headerStreak) els.headerStreak.textContent = currentStreak + ' days';
  }

  function renderRecentSessions(sessions) {
    if (!els.recentList) return;

    // Show last 5 sessions only
    const last5 = [...sessions].reverse().slice(0, 5);

    if (last5.length === 0) {
      els.recentList.innerHTML = `<div style="font-size: 12px; color: var(--text-tertiary);">No sessions logged yet.</div>`;
      return;
    }

    els.recentList.innerHTML = last5.map(s => `
      <div class="recent-item">
        <span class="recent-task">${escapeHtml(s.mission || 'Focus Session')}</span>
        <span class="recent-route">Dhaka → ${escapeHtml(s.destination || 'Chittagong')}</span>
        <span class="recent-duration">${s.duration} min</span>
        <span class="recent-status"><i data-lucide="check" style="width: 12px; height: 12px;"></i> Done</span>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  function setupCompletionModal() {
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close');

    if (closeBtn && overlay) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        if (typeof Timer !== 'undefined' && Timer.reset) {
          Timer.reset();
        }
      });
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          if (typeof Timer !== 'undefined' && Timer.reset) {
            Timer.reset();
          }
        }
      });
    }
  }

  function computeStreak(sessions) {
    if (sessions.length === 0) return 0;
    const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let checkDate = new Date(today);
    const todayStr = checkDate.toISOString().split('T')[0];
    if (!dates.includes(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }

  /**
   * Toggles window theme between Light (white window) and Dark (black window).
   * @param {string} [targetTheme] - Optional 'dark' or 'light'
   * @returns {string} Current theme name ('dark' | 'light')
   */
  function toggleTheme(targetTheme) {
    const body = document.body;
    const doc = document.documentElement;

    let isDark;
    if (typeof targetTheme === 'string') {
      isDark = targetTheme === 'dark';
    } else {
      isDark = !body.classList.contains('dark-theme') && !doc.classList.contains('dark-theme');
    }

    if (isDark) {
      body.classList.add('dark-theme');
      doc.classList.add('dark-theme');
      localStorage.setItem('focusflight_theme', 'dark');
      if (window.api && window.api.setNativeTheme) {
        window.api.setNativeTheme('dark');
      }
    } else {
      body.classList.remove('dark-theme');
      doc.classList.remove('dark-theme');
      localStorage.setItem('focusflight_theme', 'light');
      if (window.api && window.api.setNativeTheme) {
        window.api.setNativeTheme('light');
      }
    }

    updateThemeIcon(isDark);
    return isDark ? 'dark' : 'light';
  }

  function updateThemeIcon(isDark) {
    const themeBtn = document.getElementById('btn-theme-toggle');
    if (!themeBtn) return;

    const iconName = isDark ? 'sun' : 'moon';
    const titleText = isDark
      ? 'Switch to Light Mode (Black to White Window)'
      : 'Switch to Dark Mode (White to Black Window)';

    themeBtn.title = titleText;
    themeBtn.innerHTML = `<i data-lucide="${iconName}" id="theme-icon" style="width: 18px; height: 18px;"></i>`;

    if (window.lucide) window.lucide.createIcons();
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('focusflight_theme') || 'light';
    toggleTheme(savedTheme);

    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn && !themeBtn.dataset.bound) {
      themeBtn.dataset.bound = 'true';
      themeBtn.addEventListener('click', () => {
        toggleTheme();
      });
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
    });
  }

  return {
    init: async function() {
      initTheme();
      await init();
    },
    reloadRecentSessions: reloadData,
    toggleTheme,
    setTheme: (theme) => toggleTheme(theme),
    initTheme,
  };
})();

// Expose globally on window for direct access
window.toggleTheme = (...args) => App.toggleTheme(...args);
window.setTheme = (theme) => App.setTheme(theme);

document.addEventListener('DOMContentLoaded', async () => {
  App.initTheme();
  await App.init();
});


