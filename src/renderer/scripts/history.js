// =============================================================================
// FocusFlight — History Module
// =============================================================================
// Loads sessions via IPC and renders them in the dropdown panel.
// init() and load() are called each time the dropdown opens.
// =============================================================================

const History = (() => {
  let container = null;

  function init() {
    container = document.getElementById('history-list');
  }

  async function load() {
    if (!container) return;

    const sessions = await window.api.loadSessions();

    if (!sessions || sessions.length === 0) {
      container.innerHTML = `
        <div class="history-empty">
          <div class="empty-icon">✈️</div>
          <p>No sessions yet.</p>
          <p class="mt-sm text-muted">Complete a focus session to see it here.</p>
        </div>
      `;
      return;
    }

    const reversed = [...sessions].reverse();

    container.innerHTML = reversed.map((s) => {
      const icon = s.completed ? '✅' : '⏸️';
      const iconClass = s.completed ? 'completed' : 'cancelled';

      return `
        <div class="history-item">
          <div class="history-icon ${iconClass}">${icon}</div>
          <div class="history-details">
            <div class="history-dest">${s.destination || 'Unknown'}</div>
            <div class="history-meta">${formatDate(s.date)}</div>
          </div>
          <div class="history-duration">${formatDuration(s.duration)}</div>
        </div>
      `;
    }).join('');
  }

  function formatDuration(minutes) {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? h + 'h ' + m + 'm' : h + 'h';
    }
    return minutes + 'm';
  }

  function formatDate(dateStr) {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  return { init, load };
})();
