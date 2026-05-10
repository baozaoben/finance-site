// Theme Manager - Dark/Light mode handling

import { getTheme, setTheme } from './storage.js';

/**
 * Initialize theme from saved preference or system preference
 */
export function init() {
  const savedTheme = getTheme();
  if (savedTheme === 'light' || savedTheme === 'dark') {
    applyTheme(savedTheme);
  } else {
    // Use system preference as fallback
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('fp_theme')) {
      applyTheme(e.matches ? 'dark' : 'light');
    }
  });
}

/**
 * Toggle between dark and light themes
 */
export function toggle() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  setTheme(next);
}

/**
 * Apply theme to document root
 * @param {string} theme - 'dark' or 'light'
 */
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  // Update toggle button icon if exists
  const toggleBtn = document.querySelector('.theme-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = theme === 'dark' ? '\u2600' : '\u263E';
    toggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }
}
