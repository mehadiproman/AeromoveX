// =============================================================================
// FocusFlight — Timer Module
// =============================================================================
// Core focus timer with countdown logic, flight progress animation,
// and session completion handling.
//
// Key JS Concepts Used:
//   - setInterval / clearInterval for countdown
//   - DOM manipulation for UI updates
//   - Async/await for IPC calls
//   - Object state management
// =============================================================================

const Timer = (() => {
  // ── State ──
  let state = {
    totalSeconds: 50 * 60,     // Total duration in seconds
    remainingSeconds: 50 * 60, // Current remaining seconds
    isRunning: false,
    isPaused: false,
    intervalId: null,
    selectedMinutes: 50,
    selectedDestination: 'Tokyo',
  };

  // ── Destinations ──
  const DESTINATIONS = [
    { from: 'Dhaka', to: 'Chittagong', emoji: '🏖️' },
    { from: 'Dhaka', to: 'Sylhet', emoji: '🌿' },
    { from: 'Dhaka', to: "Cox's Bazar", emoji: '🏝️' },
    { from: 'Dhaka', to: 'Tokyo', emoji: '🗼' },
    { from: 'Dhaka', to: 'London', emoji: '🎡' },
    { from: 'Earth', to: 'Mars', emoji: '🚀' },
  ];

  // ── DOM References ──
  let els = {};

  // ---------------------------------------------------------------------------
  // Initialize
  // ---------------------------------------------------------------------------
  function init() {
    els = {
      timeDisplay: document.getElementById('timer-time'),
      percentDisplay: document.getElementById('timer-percent'),
      startBtn: document.getElementById('btn-start'),
      pauseBtn: document.getElementById('btn-pause'),
      resetBtn: document.getElementById('btn-reset'),
      trackProgress: document.getElementById('track-progress'),
      trackPlane: document.getElementById('track-plane'),
      fromLabel: document.getElementById('label-from'),
      toLabel: document.getElementById('label-to'),
      presetsContainer: document.getElementById('timer-presets'),
      destsContainer: document.getElementById('dest-selector'),
      dotsContainer: document.getElementById('track-dots'),
    };

    renderDestinations();
    renderPresets();
    renderDots();
    updateDisplay();
    bindEvents();
  }

  // ---------------------------------------------------------------------------
  // Render destination chips
  // ---------------------------------------------------------------------------
  function renderDestinations() {
    els.destsContainer.innerHTML = DESTINATIONS.map((d) => {
      const isActive = d.to === state.selectedDestination ? 'active' : '';
      return `<button class="dest-chip ${isActive}" data-dest="${d.to}">${d.emoji} ${d.from} → ${d.to}</button>`;
    }).join('');
  }

  // ---------------------------------------------------------------------------
  // Render timer preset buttons
  // ---------------------------------------------------------------------------
  function renderPresets() {
    const presets = [25, 50, 90];
    els.presetsContainer.innerHTML = presets.map((m) => {
      const isActive = m === state.selectedMinutes ? 'active' : '';
      return `<button class="preset-btn ${isActive}" data-minutes="${m}">${m} min</button>`;
    }).join('');
  }

  // ---------------------------------------------------------------------------
  // Render track dots (progress markers)
  // ---------------------------------------------------------------------------
  function renderDots() {
    const dotCount = 8;
    let html = '';
    for (let i = 0; i < dotCount; i++) {
      html += '<div class="track-dot" data-index="' + i + '"></div>';
    }
    els.dotsContainer.innerHTML = html;
  }

  // ---------------------------------------------------------------------------
  // Bind event listeners
  // ---------------------------------------------------------------------------
  function bindEvents() {
    els.startBtn.addEventListener('click', start);
    els.pauseBtn.addEventListener('click', togglePause);
    els.resetBtn.addEventListener('click', reset);

    // Destination chips
    els.destsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.dest-chip');
      if (!chip || state.isRunning) return;

      state.selectedDestination = chip.dataset.dest;
      const dest = DESTINATIONS.find((d) => d.to === state.selectedDestination);
      if (dest) {
        els.fromLabel.textContent = dest.from;
        els.toLabel.textContent = dest.to;
      }
      // Update active class
      els.destsContainer.querySelectorAll('.dest-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
    });

    // Preset buttons
    els.presetsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.preset-btn');
      if (!btn || state.isRunning) return;

      const minutes = parseInt(btn.dataset.minutes);
      state.selectedMinutes = minutes;
      state.totalSeconds = minutes * 60;
      state.remainingSeconds = minutes * 60;
      updateDisplay();

      els.presetsContainer.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
  }

  // ---------------------------------------------------------------------------
  // Start the timer
  // ---------------------------------------------------------------------------
  function start() {
    if (state.isRunning) return;

    state.isRunning = true;
    state.isPaused = false;
    state.totalSeconds = state.selectedMinutes * 60;
    state.remainingSeconds = state.totalSeconds;

    updateButtonStates();
    disableSelectors(true);

    state.intervalId = setInterval(tick, 1000);
  }

  // ---------------------------------------------------------------------------
  // Tick — called every second
  // ---------------------------------------------------------------------------
  function tick() {
    if (state.remainingSeconds <= 0) {
      complete();
      return;
    }

    state.remainingSeconds--;
    updateDisplay();
  }

  // ---------------------------------------------------------------------------
  // Pause / Resume
  // ---------------------------------------------------------------------------
  function togglePause() {
    if (!state.isRunning) return;

    if (state.isPaused) {
      // Resume
      state.isPaused = false;
      state.intervalId = setInterval(tick, 1000);
      els.pauseBtn.textContent = '⏸ Pause';
    } else {
      // Pause
      state.isPaused = true;
      clearInterval(state.intervalId);
      els.pauseBtn.textContent = '▶ Resume';
    }
  }

  // ---------------------------------------------------------------------------
  // Reset the timer
  // ---------------------------------------------------------------------------
  function reset() {
    clearInterval(state.intervalId);
    state.isRunning = false;
    state.isPaused = false;
    state.remainingSeconds = state.selectedMinutes * 60;
    state.totalSeconds = state.selectedMinutes * 60;

    els.pauseBtn.textContent = '⏸ Pause';
    updateDisplay();
    updateButtonStates();
    disableSelectors(false);
  }

  // ---------------------------------------------------------------------------
  // Session Complete
  // ---------------------------------------------------------------------------
  async function complete() {
    clearInterval(state.intervalId);
    state.isRunning = false;
    state.isPaused = false;

    updateDisplay();
    updateButtonStates();
    disableSelectors(false);

    // Save session via IPC
    const session = {
      date: new Date().toISOString().split('T')[0],
      duration: state.selectedMinutes,
      destination: state.selectedDestination,
      completed: true,
    };

    await window.api.saveSession(session);

    // Show native notification
    await window.api.showNotification(
      '✈️ Session Complete!',
      `You focused for ${state.selectedMinutes} minutes and reached ${state.selectedDestination}!`
    );

    // Show completion modal
    showCompletionModal(session);

    // Reset for next session
    state.remainingSeconds = state.totalSeconds;
    updateDisplay();
  }

  // ---------------------------------------------------------------------------
  // Show completion modal
  // ---------------------------------------------------------------------------
  function showCompletionModal(session) {
    const overlay = document.getElementById('modal-overlay');
    const modalDest = document.getElementById('modal-dest');
    const modalDuration = document.getElementById('modal-duration');

    if (modalDest) modalDest.textContent = session.destination;
    if (modalDuration) modalDuration.textContent = session.duration + ' minutes';
    if (overlay) overlay.classList.add('active');
  }

  // ---------------------------------------------------------------------------
  // Update the timer display
  // ---------------------------------------------------------------------------
  function updateDisplay() {
    const minutes = Math.floor(state.remainingSeconds / 60);
    const seconds = state.remainingSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');

    els.timeDisplay.textContent = pad(minutes) + ':' + pad(seconds);

    // Calculate progress
    const progress = state.totalSeconds > 0
      ? ((state.totalSeconds - state.remainingSeconds) / state.totalSeconds) * 100
      : 0;

    els.percentDisplay.textContent = Math.round(progress) + '% complete';

    // Update flight track
    els.trackProgress.style.width = progress + '%';
    els.trackPlane.style.left = progress + '%';

    // Update dots
    const dots = els.dotsContainer.querySelectorAll('.track-dot');
    dots.forEach((dot, i) => {
      const dotPercent = ((i + 1) / (dots.length + 1)) * 100;
      if (progress >= dotPercent) {
        dot.classList.add('passed');
      } else {
        dot.classList.remove('passed');
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Update button states
  // ---------------------------------------------------------------------------
  function updateButtonStates() {
    els.startBtn.disabled = state.isRunning;
    els.pauseBtn.disabled = !state.isRunning;
    els.resetBtn.disabled = !state.isRunning && state.remainingSeconds === state.totalSeconds;
  }

  // ---------------------------------------------------------------------------
  // Disable selectors while running
  // ---------------------------------------------------------------------------
  function disableSelectors(disabled) {
    els.destsContainer.querySelectorAll('.dest-chip').forEach((c) => {
      c.style.pointerEvents = disabled ? 'none' : 'auto';
      c.style.opacity = disabled ? '0.4' : '1';
    });
    els.presetsContainer.querySelectorAll('.preset-btn').forEach((b) => {
      b.style.pointerEvents = disabled ? 'none' : 'auto';
      b.style.opacity = disabled ? '0.4' : '1';
    });
  }

  // ── Public API ──
  return { init };
})();
