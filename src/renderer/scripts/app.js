// FocusFlight — App Controller

const App = (() => {
  async function init() {
    Timer.init();
    Dashboard.init();
    await Dashboard.load();

    if (typeof Sandbox !== 'undefined') {
      Sandbox.init();
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  return {
    init,
  };
})();

document.addEventListener('DOMContentLoaded', async () => {
  await App.init();
});



