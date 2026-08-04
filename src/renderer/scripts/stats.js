// =============================================================================
// FocusFlight — Statistics Module
// =============================================================================
// Computes daily/weekly stats and renders a CSS bar chart.
// init() and load() are called each time the dropdown opens.
// =============================================================================

const Stats = (() => {
  let els = {};

  function init() {
    els = {
      totalTime: document.getElementById('stat-total-time'),
      totalSessions: document.getElementById('stat-total-sessions'),
      longestSession: document.getElementById('stat-longest'),
      chartBars: document.getElementById('chart-bars'),
    };
  }

  async function load() {
    const sessions = await window.api.loadSessions();
    const completed = sessions.filter((s) => s.completed);

    renderSummary(completed);
    renderWeeklyChart(completed);
  }

  function renderSummary(sessions) {
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    if (els.totalTime) els.totalTime.textContent = formatTime(totalMinutes);
    if (els.totalSessions) els.totalSessions.textContent = sessions.length;

    const longest = sessions.length > 0
      ? Math.max(...sessions.map((s) => s.duration || 0))
      : 0;
    if (els.longestSession) els.longestSession.textContent = longest > 0 ? longest + 'm' : '—';
  }

  function renderWeeklyChart(sessions) {
    if (!els.chartBars) return;

    const days = getLast7Days();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date().toISOString().split('T')[0];

    const byDate = {};
    sessions.forEach((s) => {
      if (!byDate[s.date]) byDate[s.date] = 0;
      byDate[s.date] += s.duration || 0;
    });

    const maxMinutes = Math.max(...days.map((d) => byDate[d] || 0), 1);

    els.chartBars.innerHTML = days.map((dateStr) => {
      const minutes = byDate[dateStr] || 0;
      const heightPercent = (minutes / maxMinutes) * 100;
      const hours = (minutes / 60).toFixed(1);
      const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
      const isToday = dateStr === today;

      return `
        <div class="chart-bar-wrapper">
          <div class="chart-bar-hours">${minutes > 0 ? hours + 'h' : ''}</div>
          <div class="chart-bar-container">
            <div class="chart-bar ${isToday ? 'today' : ''}" style="height: ${heightPercent}%"></div>
          </div>
          <div class="chart-bar-day">${isToday ? 'Today' : dayNames[dayOfWeek]}</div>
        </div>
      `;
    }).join('');
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

  function formatTime(minutes) {
    if (minutes === 0) return '0m';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return m + 'm';
    return m > 0 ? h + 'h ' + m + 'm' : h + 'h';
  }

  return { init, load };
})();
