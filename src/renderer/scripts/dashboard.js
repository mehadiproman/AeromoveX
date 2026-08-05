// =============================================================================
// FocusFlight — Dashboard Module
// =============================================================================
// Renders the right-sidebar widgets dynamically based on actual session data:
// Pilot Stats, Today's Flights, Weekly Overview (bar chart + ring).
// Starts at 0 when no sessions exist. Uses Lucide icons exclusively.
// =============================================================================

const Dashboard = (() => {
  let els = {};

  function init() {
    els = {
      hoursToday: document.getElementById('stat-hours-today'),
      hoursWeek: document.getElementById('stat-hours-week'),
      currentStreak: document.getElementById('stat-current-streak'),
      longestStreak: document.getElementById('stat-longest-streak'),
      flightsList: document.getElementById('flights-list'),
      weeklyBars: document.getElementById('weekly-bars'),
      weeklyRingFill: document.getElementById('weekly-ring-fill'),
      ringHoursValue: document.getElementById('ring-hours-value'),
      streakBadge: document.getElementById('streak-count'),
    };
  }

  async function load() {
    const sessions = await window.api.loadSessions();
    const completed = (sessions || []).filter((s) => s.completed);

    renderPilotStats(completed);
    renderTodaysFlights(completed);
    renderWeeklyOverview(completed);

    if (window.lucide) window.lucide.createIcons();
  }

  // ---------------------------------------------------------------------------
  // Pilot Stats
  // ---------------------------------------------------------------------------
  function renderPilotStats(sessions) {
    const today = new Date().toISOString().split('T')[0];
    const weekDays = getLast7Days();

    const todayMinutes = sessions
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + (s.duration || 0), 0);
    const todayHours = (todayMinutes / 60).toFixed(1);

    const weekMinutes = sessions
      .filter((s) => weekDays.includes(s.date))
      .reduce((sum, s) => sum + (s.duration || 0), 0);
    const weekHours = (weekMinutes / 60).toFixed(1);

    const { current, longest } = computeStreaks(sessions);

    if (els.hoursToday) els.hoursToday.textContent = todayHours + ' h';
    if (els.hoursWeek) els.hoursWeek.textContent = weekHours + ' h';
    if (els.currentStreak) els.currentStreak.textContent = current + ' days';
    if (els.longestStreak) els.longestStreak.textContent = longest + ' days';
    if (els.streakBadge) els.streakBadge.textContent = current;
  }

  // ---------------------------------------------------------------------------
  // Today's Flights
  // ---------------------------------------------------------------------------
  function renderTodaysFlights(sessions) {
    if (!els.flightsList) return;

    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter((s) => s.date === today);

    if (todaySessions.length === 0) {
      els.flightsList.innerHTML = `
        <div class="flights-empty" style="text-align: center; padding: 18px 0; color: var(--text-tertiary); font-size: 13px;">
          No flights today yet. Start a focus session!
        </div>
      `;
      return;
    }

    els.flightsList.innerHTML = todaySessions.map((s, i) => {
      const isLast = i === todaySessions.length - 1;
      const icon = isLast
        ? '<i data-lucide="plane" style="width: 14px; height: 14px;"></i>'
        : '<i data-lucide="check-circle-2" style="width: 14px; height: 14px;"></i>';

      return `
        <div class="flight-item ${isLast ? 'active' : ''}">
          <div class="flight-icon ${isLast ? 'in-progress' : 'completed'}">${icon}</div>
          <div class="flight-details">
            <div class="flight-route">${s.origin || 'Dhaka (DAC)'} → ${s.destination || 'Chittagong (CGP)'}</div>
            <div class="flight-meta ${isLast ? 'in-progress-text' : ''}">${isLast ? 'In Progress' : s.mission || 'Completed'}</div>
          </div>
          <div class="flight-duration ${isLast ? 'in-progress-dur' : ''}">${s.duration} min</div>
        </div>
      `;
    }).join('');
  }

  // ---------------------------------------------------------------------------
  // Weekly Overview
  // ---------------------------------------------------------------------------
  function renderWeeklyOverview(sessions) {
    const days = getLast7Days(); // Array of ISO date strings for last 7 days
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date().toISOString().split('T')[0];

    const byDate = {};
    sessions.forEach((s) => {
      if (!byDate[s.date]) byDate[s.date] = 0;
      byDate[s.date] += s.duration || 0;
    });

    const maxMinutes = Math.max(...days.map((d) => byDate[d] || 0), 1);

    if (els.weeklyBars) {
      els.weeklyBars.innerHTML = days.map((dateStr, idx) => {
        const minutes = byDate[dateStr] || 0;
        const heightPct = (minutes / maxMinutes) * 100;
        const isToday = dateStr === today;
        const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
        const dayLabel = dayNames[(dayOfWeek + 6) % 7]; // Convert Sunday=0 to Mon=0 scale

        return `
          <div class="weekly-bar-wrapper">
            <div class="weekly-bar-track">
              <div class="weekly-bar ${isToday ? 'today' : ''} ${minutes > 0 ? 'has-data' : ''}"
                   style="height: ${minutes > 0 ? Math.max(heightPct, 12) : 6}%"></div>
            </div>
            <div class="weekly-bar-day">${dayLabel}</div>
          </div>
        `;
      }).join('');
    }

    const weekMinutes = days.reduce((sum, d) => sum + (byDate[d] || 0), 0);
    const weekHours = (weekMinutes / 60).toFixed(1);
    const goalHours = 40;
    const progressPct = Math.min((weekMinutes / 60) / goalHours, 1);

    const RING_CIRC = 263.89; // 2π × 42
    if (els.weeklyRingFill) {
      els.weeklyRingFill.style.strokeDashoffset = RING_CIRC * (1 - progressPct);
    }

    if (els.ringHoursValue) {
      els.ringHoursValue.textContent = weekHours + ' h';
    }
  }

  function computeStreaks(sessions) {
    if (sessions.length === 0) return { current: 0, longest: 0 };

    const dates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let current = 0;
    let checkDate = new Date(today);
    const todayStr = checkDate.toISOString().split('T')[0];
    if (!dates.includes(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dates.includes(dateStr)) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    let longest = 0;
    let streak = 1;
    const sortedDates = [...new Set(sessions.map((s) => s.date))].sort();
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1] + 'T00:00:00');
      const curr = new Date(sortedDates[i] + 'T00:00:00');
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else {
        longest = Math.max(longest, streak);
        streak = 1;
      }
    }
    longest = Math.max(longest, streak, current);

    return { current, longest };
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

  return { init, load };
})();
