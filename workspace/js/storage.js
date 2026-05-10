// Storage Manager - localStorage abstraction for watchlist and theme preferences

const STORAGE_KEYS = {
  WATCHLIST: 'fp_watchlist',
  THEME: 'fp_theme',
  QUOTES_CACHE: 'fp_quotes_cache',
  QUOTES_CACHE_TIME: 'fp_quotes_cache_time',
};

const CACHE_DURATION = 30000; // 30 seconds

/**
 * Get user's watchlist array
 * @returns {string[]} Array of symbol strings
 */
export function getWatchlist() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WATCHLIST);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Add symbol to watchlist
 * @param {string} symbol - Trading pair symbol
 */
export function addToWatchlist(symbol) {
  const list = getWatchlist();
  if (!list.includes(symbol)) {
    list.push(symbol);
    localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(list));
  }
}

/**
 * Remove symbol from watchlist
 * @param {string} symbol - Trading pair symbol
 */
export function removeFromWatchlist(symbol) {
  const list = getWatchlist().filter(s => s !== symbol);
  localStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(list));
}

/**
 * Check if symbol is in watchlist
 * @param {string} symbol - Trading pair symbol
 * @returns {boolean}
 */
export function isInWatchlist(symbol) {
  return getWatchlist().includes(symbol);
}

/**
 * Get saved theme preference
 * @returns {string} 'dark' or 'light'
 */
export function getTheme() {
  try {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  } catch {
    return 'dark';
  }
}

/**
 * Save theme preference
 * @param {string} theme - 'dark' or 'light'
 */
export function setTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {
    // localStorage not available
  }
}

/**
 * Cache quotes data
 * @param {Object} data - Quotes data object
 */
export function cacheQuotes(data) {
  try {
    localStorage.setItem(STORAGE_KEYS.QUOTES_CACHE, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.QUOTES_CACHE_TIME, Date.now().toString());
  } catch {
    // Ignore storage errors
  }
}

/**
 * Get cached quotes data if still valid
 * @returns {Object|null} Cached quotes or null
 */
export function getCachedQuotes() {
  try {
    const time = localStorage.getItem(STORAGE_KEYS.QUOTES_CACHE_TIME);
    const data = localStorage.getItem(STORAGE_KEYS.QUOTES_CACHE);
    if (time && data && Date.now() - parseInt(time) < CACHE_DURATION) {
      return JSON.parse(data);
    }
    return null;
  } catch {
    return null;
  }
}
