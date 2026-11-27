(function () {
  var root = document.documentElement;
  var frame = document.getElementById('demo');
  var form = document.getElementById('controls');
  var wrap = document.getElementById('device-wrap');

  // ---- theme
  function currentTheme() {
    return root.dataset.theme === 'light' ? 'light' : 'dark';
  }

  function setTheme(theme) {
    root.dataset.theme = theme;
    try {
      localStorage.setItem('stb-theme', theme);
    } catch (e) {}
    var toggle = document.querySelector('[data-theme-toggle]');
    if (toggle) {
      toggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
    sendConfig();
  }

  document.querySelector('[data-theme-toggle]').addEventListener('click', function () {
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });

  // ---- demo settings, sent into the phone
  function readConfig() {
    var data = new FormData(form);
    return {
      theme: currentTheme(),
      preset: data.get('preset'),
      collapseMode: data.get('collapseMode'),
      placement: data.get('placement'),
      actionButton: data.get('actionButton') === 'true',
    };
  }

  function sendConfig() {
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage(
      { type: 'stb-config', config: readConfig() },
      window.location.origin
    );
  }

  form.addEventListener('change', sendConfig);
  frame.addEventListener('load', sendConfig);
  window.addEventListener('message', function (e) {
    if (e.origin === window.location.origin && e.data && e.data.type === 'stb-ready') {
      sendConfig();
    }
  });

  // Start the demo in the page's theme.
  frame.src = 'demo/index.html?theme=' + currentTheme();

  // ---- copy the install command
  document.querySelectorAll('[data-copy]').forEach(function (button) {
    button.addEventListener('click', function () {
      var text = document.getElementById(button.dataset.copy).textContent;
      var done = function () {
        button.textContent = 'Copied';
        setTimeout(function () {
          button.textContent = 'Copy';
        }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      }
    });
  });

  // ---- fit the phone to the window
  function fit() {
    var byHeight = (window.innerHeight - 190) / 868;
    var byWidth = (Math.min(window.innerWidth, 480) - 32) / 414;
    var scale = Math.max(0.5, Math.min(0.86, byHeight, byWidth));
    wrap.style.setProperty('--scale', scale.toFixed(3));
  }
  fit();
  window.addEventListener('resize', fit);
})();
