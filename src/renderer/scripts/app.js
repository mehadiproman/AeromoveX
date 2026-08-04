// =============================================================================
// FocusFlight — App Controller
// =============================================================================
// Handles dropdown navigation, loads HTML fragments via fetch(),
// initializes all modules, and manages the completion modal.
// =============================================================================

const App = (() => {
  let activeDropdown = null; // Currently open dropdown name or null

  // ---------------------------------------------------------------------------
  // Initialize
  // ---------------------------------------------------------------------------
  async function init() {
    // Initialize the timer (always visible)
    Timer.init();

    // Load and apply settings on startup
    await Settings.loadOnStartup();

    // Set up top bar navigation
    setupNavigation();

    // Set up modal close
    setupModal();
  }

  // ---------------------------------------------------------------------------
  // Dropdown Navigation
  // ---------------------------------------------------------------------------
  function setupNavigation() {
    const overlay = document.getElementById('dropdown-overlay');
    const panel = document.getElementById('dropdown-panel');
    const navBtns = document.querySelectorAll('.nav-btn[data-dropdown]');

    // Click a nav button → toggle dropdown
    navBtns.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const target = btn.dataset.dropdown;

        // If clicking the same button, close the dropdown
        if (activeDropdown === target) {
          closeDropdown();
          return;
        }

        // Open new dropdown
        activeDropdown = target;

        // Update active states
        navBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        // Fetch HTML fragment from pages/ directory
        try {
          const response = await fetch('./pages/' + target + '.html');
          const html = await response.text();
          panel.innerHTML = html;
        } catch (err) {
          panel.innerHTML = '<p style="color: var(--text-2)">Could not load content.</p>';
        }

        // Show dropdown
        overlay.classList.add('open');

        // Initialize the module for this dropdown
        if (target === 'history') {
          History.init();
          await History.load();
        } else if (target === 'stats') {
          Stats.init();
          await Stats.load();
        } else if (target === 'settings') {
          Settings.init();
          await Settings.load();
        }
      });
    });

    // Click outside the panel → close dropdown
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeDropdown();
      }
    });

    // Escape key → close dropdown
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activeDropdown) {
        closeDropdown();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Close the dropdown
  // ---------------------------------------------------------------------------
  function closeDropdown() {
    activeDropdown = null;
    document.getElementById('dropdown-overlay').classList.remove('open');
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
  }

  // ---------------------------------------------------------------------------
  // Setup completion modal
  // ---------------------------------------------------------------------------
  function setupModal() {
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    }
  }

  // ── Public API ──
  return { init };
})();

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
