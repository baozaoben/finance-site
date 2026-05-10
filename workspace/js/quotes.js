// Quotes Manager - Real-time quote display and updates

import { INSTRUMENTS, fetchAllPrices, formatQuote } from './api.js';
import { getWatchlist, isInWatchlist, addToWatchlist, removeFromWatchlist } from './storage.js';

let refreshInterval = null;

/**
 * Render quote cards into a container
 * @param {string} containerId - DOM element ID
 * @param {string[]} symbols - Array of symbol keys to display
 * @param {Object} priceData - Current price data
 */
export function renderQuotes(containerId, symbols, priceData) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';

  for (const symbol of symbols) {
    const price = priceData[symbol];
    if (price === undefined) continue;

    const quote = formatQuote(symbol, price);
    if (!quote) continue;

    const card = document.createElement('div');
    card.className = 'quote-card';
    card.dataset.symbol = symbol;
    card.id = `quote-${symbol}`;

    const isFav = isInWatchlist(symbol);
    const changeClass = quote.change >= 0 ? 'up' : 'down';
    const changeSign = quote.change >= 0 ? '+' : '';

    card.innerHTML = `
      <div class="quote-header">
        <div>
          <div class="quote-symbol">${quote.name}</div>
          <div class="quote-name">${quote.displayName}</div>
        </div>
        <button class="quote-favorite ${isFav ? 'active' : ''}" data-symbol="${symbol}" title="Add to watchlist">
          ${isFav ? '\u2605' : '\u2606'}
        </button>
      </div>
      <div class="quote-price" id="price-${symbol}">
        ${quote.price.toFixed(quote.decimals)}
      </div>
      <div class="quote-change ${changeClass}" id="change-${symbol}">
        <span class="change-points">${changeSign}${quote.change.toFixed(quote.decimals)}</span>
        <span class="change-percent">${changeSign}${quote.changePercent.toFixed(2)}%</span>
      </div>
      <div class="quote-details">
        <div class="quote-detail">
          <span class="quote-detail-label">High</span>
          <span class="quote-detail-value" id="high-${symbol}">-</span>
        </div>
        <div class="quote-detail">
          <span class="quote-detail-label">Low</span>
          <span class="quote-detail-value" id="low-${symbol}">-</span>
        </div>
      </div>
    `;

    // Click to navigate to detail
    card.addEventListener('click', (e) => {
      if (e.target.closest('.quote-favorite')) return;
      window.location.href = `quotes.html?symbol=${symbol}`;
    });

    container.appendChild(card);
  }

  // Bind favorite buttons
  container.querySelectorAll('.quote-favorite').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const sym = btn.dataset.symbol;
      toggleFavorite(sym, btn);
    });
  });
}

/**
 * Toggle favorite status
 */
function toggleFavorite(symbol, btn) {
  if (isInWatchlist(symbol)) {
    removeFromWatchlist(symbol);
    btn.textContent = '\u2606';
    btn.classList.remove('active');
  } else {
    addToWatchlist(symbol);
    btn.textContent = '\u2605';
    btn.classList.add('active');
  }
}

/**
 * Update all displayed quotes with new data
 * @param {Object} priceData - New price data
 */
export function updateQuotes(priceData) {
  if (!priceData) return;

  for (const symbol of Object.keys(priceData)) {
    const quote = formatQuote(symbol, priceData[symbol]);
    if (!quote) continue;

    // Update price
    const priceEl = document.getElementById(`price-${symbol}`);
    if (priceEl) {
      priceEl.textContent = quote.price.toFixed(quote.decimals);
    }

    // Update change
    const changeEl = document.getElementById(`change-${symbol}`);
    if (changeEl) {
      const changeClass = quote.change >= 0 ? 'up' : 'down';
      const changeSign = quote.change >= 0 ? '+' : '';
      changeEl.className = `quote-change ${changeClass}`;
      changeEl.innerHTML = `
        <span class="change-points">${changeSign}${quote.change.toFixed(quote.decimals)}</span>
        <span class="change-percent">${changeSign}${quote.changePercent.toFixed(2)}%</span>
      `;
    }

    // Highlight significant moves
    const card = document.getElementById(`quote-${symbol}`);
    if (card && Math.abs(quote.changePercent) > 2) {
      card.classList.add(quote.change >= 0 ? 'highlight-up' : 'highlight-down');
      setTimeout(() => {
        card.classList.remove('highlight-up', 'highlight-down');
      }, 3000);
    }
  }
}

/**
 * Start auto-refresh for quotes
 * @param {number} intervalMs - Refresh interval in milliseconds
 * @param {Function} onUpdate - Callback when data is fetched
 */
export function startAutoRefresh(intervalMs = 30000, onUpdate = null) {
  stopAutoRefresh();

  async function fetchAndUpdate() {
    try {
      const data = await fetchAllPrices();
      updateQuotes(data);
      if (onUpdate) onUpdate(data);
    } catch (err) {
      console.warn('Quote refresh failed:', err);
    }
  }

  // Initial fetch
  fetchAndUpdate();

  // Set interval
  refreshInterval = setInterval(fetchAndUpdate, intervalMs);
}

/**
 * Stop auto-refresh
 */
export function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

/**
 * Get all symbols for a category
 * @param {string} category - 'forex', 'metal', 'energy', 'crypto', or 'all'
 * @returns {string[]}
 */
export function getSymbolsByCategory(category = 'all') {
  if (category === 'all') {
    return Object.keys(INSTRUMENTS);
  }
  return Object.entries(INSTRUMENTS)
    .filter(([, config]) => config.category === category)
    .map(([symbol]) => symbol);
}
