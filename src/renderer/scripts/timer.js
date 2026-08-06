// =============================================================================
// FocusFlight — Redesigned Flight Timer Module (Exact Match with Reference UI)
// =============================================================================

const Timer = (() => {
  let state = {
    totalSeconds: 50 * 60,
    remainingSeconds: 50 * 60,
    isRunning: false,
    isPaused: false,
    intervalId: null,
    selectedMinutes: 50,
    selectedOrigin: 'Dhaka (DAC)',
    selectedDestination: 'Chittagong (CGP)',
    totalDistanceKm: 248,
    missionName: 'Backend Engineering Notes',
  };

  let els = {};

  function init() {
    els = {
      timeDisplay: document.getElementById('timer-time'),
      progressBar: document.getElementById('timer-progress-bar'),
      progressHandle: document.getElementById('timer-progress-handle'),
      metricDistance: document.getElementById('metric-distance'),
      metricEstTime: document.getElementById('metric-est-time'),
      pauseBtn: document.getElementById('btn-pause'),
      pauseBtnText: document.getElementById('btn-pause-text'),
      resetBtn: document.getElementById('btn-reset'),
      endBtn: document.getElementById('btn-end'),
      mapContainer: document.getElementById('map-container'),
      destTitle: document.getElementById('node-dest-title'),
    };

    renderMap();
    updateDisplay();
    bindEvents();
    setupCustomDropdowns();
  }

  const AIRPORTS = [
    { name: 'Dhaka (DAC)', code: 'DAC', dist: 248 },
    { name: 'Chittagong (CGP)', code: 'CGP', dist: 248 },
    { name: 'Sylhet (ZYL)', code: 'ZYL', dist: 200 },
    { name: "Cox's Bazar (CXB)", code: 'CXB', dist: 300 },
    { name: 'Dubai (DXB)', code: 'DXB', dist: 3540 },
    { name: 'London (LHR)', code: 'LHR', dist: 8000 },
    { name: 'New York (JFK)', code: 'JFK', dist: 11300 },
    { name: 'Singapore (SIN)', code: 'SIN', dist: 2900 },
    { name: 'Tokyo (HND)', code: 'HND', dist: 4900 },
    { name: 'Paris (CDG)', code: 'CDG', dist: 7800 },
    { name: 'Doha (DOH)', code: 'DOH', dist: 3900 },
    { name: 'Sydney (SYD)', code: 'SYD', dist: 9100 },
  ];

  function setupCustomDropdowns() {
    setupDropdown('origin');
    setupDropdown('dest');

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.custom-dropdown-wrap')) {
        document.querySelectorAll('.custom-dropdown-wrap').forEach(w => w.classList.remove('active'));
      }
    });
  }

  function setupDropdown(type) {
    const wrap = document.getElementById(`${type}-dropdown-wrap`);
    const trigger = document.getElementById(`${type}-dropdown-trigger`);
    const selectedText = document.getElementById(`${type}-selected-text`);
    const optionsList = document.getElementById(`${type}-options-list`);

    if (!wrap || !trigger || !optionsList) return;

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = wrap.classList.contains('active');
      document.querySelectorAll('.custom-dropdown-wrap').forEach(w => w.classList.remove('active'));
      if (!isActive) {
        wrap.classList.add('active');
        renderOptions();
      }
    });

    function renderOptions() {
      const currentVal = type === 'origin' ? state.selectedOrigin : state.selectedDestination;

      optionsList.innerHTML = AIRPORTS.map(a => `
        <div class="dropdown-option-item ${a.name === currentVal ? 'selected' : ''}" data-val="${a.name}" data-dist="${a.dist}">
          <span>${a.name}</span>
          <span class="option-dist-badge">${a.dist.toLocaleString()} km</span>
        </div>
      `).join('');

      optionsList.querySelectorAll('.dropdown-option-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = item.getAttribute('data-val');
          const dist = parseInt(item.getAttribute('data-dist'), 10);

          if (type === 'origin') {
            state.selectedOrigin = val;
            selectedText.textContent = val;
          } else {
            state.selectedDestination = val;
            state.totalDistanceKm = dist;
            selectedText.textContent = val;
          }

          wrap.classList.remove('active');
          updateDisplay();
        });
      });
    }

    renderOptions();
  }

  function renderMap() {
    if (!els.mapContainer) return;

    // Ultra-clear high-definition Flight Path SVG with glowing radar airplane badge
    els.mapContainer.innerHTML = `
      <svg class="arc-svg" viewBox="0 0 400 65">
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#6347FF" stop-opacity="0.3" />
            <stop offset="50%" stop-color="#7C5CFF" stop-opacity="0.95" />
            <stop offset="100%" stop-color="#9E85FF" stop-opacity="0.3" />
          </linearGradient>
          <filter id="badgeShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#7C5CFF" flood-opacity="0.7"/>
          </filter>
        </defs>

        <!-- Curved Dashed Arc Line -->
        <path d="M 10,50 Q 200,6 390,50" fill="none"
              stroke="url(#arcGrad)" stroke-width="2.5"
              stroke-dasharray="5,5" id="route-path"/>

        <!-- Progress Line along Arc -->
        <path d="M 10,50 Q 200,6 390,50" fill="none"
              stroke="#7C5CFF" stroke-width="3.5"
              stroke-dasharray="500" stroke-dashoffset="500"
              id="route-progress" stroke-linecap="round"/>

        <!-- Ultra-Clear Glowing Flight Radar Airplane Badge -->
        <g id="map-plane" transform="translate(10, 50)">
          <!-- Glowing Purple Radar Circle Pill -->
          <circle r="15" fill="#7C5CFF" filter="url(#badgeShadow)" stroke="#A78BFA" stroke-width="1.5"/>
          <!-- Razor-Sharp Pure White Jet Plane Icon -->
          <g transform="translate(-10, -10) scale(0.85)">
            <path d="M21 12C21 11.2 19.5 10.5 17 10.8L11 5H8.5L11.5 11H5L3 9.5H1.5L3 12L1.5 14.5H3L5 13H11.5L8.5 19H11L17 13.2C19.5 13.5 21 12.8 21 12Z"
                  fill="#FFFFFF" />
          </g>
        </g>
      </svg>
    `;

    const routePath = document.getElementById('route-path');
    const routeProgress = document.getElementById('route-progress');
    if (routePath && routeProgress) {
      const len = routePath.getTotalLength();
      routeProgress.style.strokeDasharray = len;
      routeProgress.style.strokeDashoffset = len;
    }
  }

  function setDuration(minutes) {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins) || mins <= 0) return;

    state.selectedMinutes = mins;
    state.totalSeconds = mins * 60;

    if (!state.isRunning || state.isPaused) {
      state.remainingSeconds = mins * 60;
    }

    updateDurationChipsUI(mins);
    updateDisplay();
  }

  function updateDurationChipsUI(mins) {
    const chips = document.querySelectorAll('.duration-chip');
    let matched = false;

    chips.forEach(chip => {
      const chipMins = parseInt(chip.getAttribute('data-mins'), 10);
      if (chipMins === mins) {
        chip.classList.add('active');
        matched = true;
      } else {
        chip.classList.remove('active');
      }
    });

    const customInput = document.getElementById('custom-minutes-input');
    if (customInput) {
      customInput.value = matched ? '' : mins;
    }
  }

  function bindEvents() {
    if (els.pauseBtn) els.pauseBtn.addEventListener('click', togglePause);
    if (els.resetBtn) els.resetBtn.addEventListener('click', reset);
    if (els.endBtn) els.endBtn.addEventListener('click', endSession);

    // Preset duration chips
    const chips = document.querySelectorAll('.duration-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const mins = parseInt(chip.getAttribute('data-mins'), 10);
        setDuration(mins);
      });
    });

    // Custom duration input & set button
    const customInput = document.getElementById('custom-minutes-input');
    const customBtn = document.getElementById('btn-custom-set');

    if (customBtn && customInput) {
      const handleCustomSet = () => {
        const mins = parseInt(customInput.value, 10);
        if (mins > 0 && mins <= 720) {
          setDuration(mins);
        } else {
          alert('Please enter a duration between 1 and 720 minutes.');
        }
      };

      customBtn.addEventListener('click', handleCustomSet);
      customInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleCustomSet();
      });
    }
  }

  function togglePause() {
    if (!state.isRunning || state.isPaused) {
      state.isRunning = true;
      state.isPaused = false;
      state.intervalId = setInterval(tick, 1000);
      if (els.pauseBtnText) els.pauseBtnText.textContent = 'Pause';
      if (els.pauseBtn) els.pauseBtn.innerHTML = '<i data-lucide="pause" style="width: 16px; height: 16px;"></i> <span id="btn-pause-text">Pause</span>';
    } else {
      state.isPaused = true;
      clearInterval(state.intervalId);
      if (els.pauseBtnText) els.pauseBtnText.textContent = 'Resume';
      if (els.pauseBtn) els.pauseBtn.innerHTML = '<i data-lucide="play" style="width: 16px; height: 16px;"></i> <span id="btn-pause-text">Resume</span>';
    }
    if (window.lucide) window.lucide.createIcons();
  }

  function tick() {
    if (state.remainingSeconds <= 0) {
      complete();
      return;
    }
    state.remainingSeconds--;
    updateDisplay();
  }

  function reset() {
    clearInterval(state.intervalId);
    state.isRunning = false;
    state.isPaused = false;
    state.remainingSeconds = state.selectedMinutes * 60;
    if (els.pauseBtnText) els.pauseBtnText.textContent = 'Start Focus';
    if (els.pauseBtn) els.pauseBtn.innerHTML = '<i data-lucide="play" style="width: 16px; height: 16px;"></i> <span id="btn-pause-text">Start Focus</span>';
    if (window.lucide) window.lucide.createIcons();
    updateDisplay();
  }

  function endSession() {
    complete();
  }

  async function complete() {
    clearInterval(state.intervalId);
    state.isRunning = false;
    state.isPaused = false;

    updateDisplay();

    const elapsed = state.totalSeconds - state.remainingSeconds;
    const elapsedMinutes = Math.ceil(elapsed / 60);

    const session = {
      date: new Date().toISOString().split('T')[0],
      duration: elapsedMinutes > 0 ? elapsedMinutes : state.selectedMinutes,
      origin: state.selectedOrigin || 'Dhaka (DAC)',
      destination: state.selectedDestination || 'Chittagong (CGP)',
      mission: state.missionName,
      completed: true,
    };

    try {
      if (window.api && window.api.saveSession) {
        await window.api.saveSession(session);
      }
    } catch (err) {
      console.warn('Could not save session via IPC:', err);
    }

    try {
      if (window.api && window.api.showNotification) {
        await window.api.showNotification(
          'Session Complete!',
          `You focused for ${session.duration} minutes!`
        );
      }
    } catch (err) {
      console.warn('Could not show notification via IPC:', err);
    }

    showCompletionModal(session);

    if (typeof Dashboard !== 'undefined' && Dashboard.load) {
      Dashboard.load();
    }
  }

  function showCompletionModal(session) {
    const overlay = document.getElementById('modal-overlay');
    const modalDest = document.getElementById('modal-dest');
    const modalDuration = document.getElementById('modal-duration');
    const closeBtn = document.getElementById('modal-close');

    if (modalDest) modalDest.textContent = session.destination || 'Chittagong (CGP)';
    if (modalDuration) modalDuration.textContent = (session.duration || 50) + ' minutes';

    if (closeBtn && overlay) {
      closeBtn.onclick = () => {
        overlay.classList.remove('active');
        reset();
      };

      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
          reset();
        }
      };
    }

    if (overlay) overlay.classList.add('active');
  }

  function updateDisplay() {
    const minutes = Math.floor(state.remainingSeconds / 60);
    const seconds = state.remainingSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');

    if (els.timeDisplay) els.timeDisplay.textContent = pad(minutes) + ':' + pad(seconds);

    const progress = (state.totalSeconds - state.remainingSeconds) / state.totalSeconds;
    const progressPct = Math.min(100, Math.max(0, Math.round(progress * 100)));

    if (els.progressBar) els.progressBar.style.width = progressPct + '%';
    if (els.progressHandle) els.progressHandle.style.left = progressPct + '%';

    // Dynamic distance & estimated time matching reference design
    const totalDistKm = state.totalDistanceKm || 248;
    const distLeft = Math.max(0, Math.round(totalDistKm * (1 - progress)));
    const estTimeMins = Math.ceil(state.remainingSeconds / 60);

    if (els.metricDistance) els.metricDistance.textContent = distLeft.toLocaleString() + ' km';
    if (els.metricEstTime) els.metricEstTime.textContent = estTimeMins + ' min';

    updateMapProgress(progress);
  }

  function updateMapProgress(progress) {
    const routeProgress = document.getElementById('route-progress');
    const plane = document.getElementById('map-plane');
    const routePath = document.getElementById('route-path');

    if (!routeProgress || !plane || !routePath) return;

    const len = routePath.getTotalLength();
    routeProgress.style.strokeDashoffset = len * (1 - progress);

    const currentLen = len * progress;
    const point = routePath.getPointAtLength(currentLen);
    const nextPoint = routePath.getPointAtLength(Math.min(len, currentLen + 2));
    const angle = Math.atan2(nextPoint.y - point.y, nextPoint.x - point.x) * (180 / Math.PI);

    plane.setAttribute('transform', `translate(${point.x}, ${point.y}) rotate(${angle})`);
  }

  return { init, setDuration, reset, togglePause, endSession };
})();
