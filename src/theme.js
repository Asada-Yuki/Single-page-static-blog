(() => {
  const storageKey = 'yuki.art.color-mode';
  const root = document.documentElement;
  const systemPreference = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
  let preference = null;

  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch {
    // Keep the current tab usable when storage is unavailable.
  }

  function currentTheme() {
    return preference ?? (systemPreference?.matches ? 'dark' : 'light');
  }

  function applyTheme() {
    const theme = currentTheme();
    root.dataset.theme = theme;

    const button = document.querySelector('[data-theme-toggle]');
    if (!button) return;
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.title = theme === 'dark' ? '切换到浅色模式' : '切换到深色模式';
  }

  // Run in the head before stylesheets render to avoid a flash of the other theme.
  applyTheme();

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('[data-theme-toggle]');
    if (button) {
      applyTheme();
      button.addEventListener('click', () => {
        preference = currentTheme() === 'dark' ? 'light' : 'dark';
        try {
          window.localStorage.setItem(storageKey, preference);
        } catch {
          // The selected theme still applies for this page view.
        }
        applyTheme();
      });
    }

    const followSystemPreference = () => {
      if (preference === null) applyTheme();
    };
    if (systemPreference?.addEventListener) {
      systemPreference.addEventListener('change', followSystemPreference);
    } else {
      systemPreference?.addListener?.(followSystemPreference);
    }

    window.addEventListener('storage', (event) => {
      if (event.key !== storageKey && event.key !== null) return;
      preference = event.newValue === 'light' || event.newValue === 'dark'
        ? event.newValue
        : null;
      applyTheme();
    });
  }, { once: true });
})();
