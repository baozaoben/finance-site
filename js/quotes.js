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

    // 生成卡片，自动加上ID，方便实时更新
    const card = document.createElement('div');
    card.className = 'quote-card';
    card.dataset.symbol = symbol;
    card.id = `quote-${symbol}`;

    const isFav = isInWatchlist(symbol);
    const changeClass = quote.change >= 0 ? 'positive' : 'negative';
    const changeIcon = quote.change >= 0 ? '↑' : '↓';

    card.innerHTML = `
      <div class="quote-header">
        <div class="quote-info">
          <h3 class="quote-symbol">${quote.symbol}</h3>
          <p class="quote-name">${quote.name}</p>
        </div>
        <button class="quote-fav ${isFav ? 'active' : ''}" aria-label="Add to watchlist">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      </div>
      <div class="quote-price" id="price-${symbol}">${quote.price}</div>
      <div class="quote-change ${changeClass}" id="change-${symbol}">
        ${changeIcon} ${Math.abs(quote.change).toFixed(2)}%
      </div>
      <div class="quote-stats">
        <div class="stat">
          <span class="label">High</span>
          <span class="value">-</span>
        </div>
        <div class="stat">
          <span class="label">Low</span>
          <span class="value">-</span>
        </div>
      </div>
    `;

    // 收藏按钮事件
    const favBtn = card.querySelector('.quote-fav');
    favBtn.addEventListener('click', () => {
      if (isInWatchlist(symbol)) {
        removeFromWatchlist(symbol);
        favBtn.classList.remove('active');
      } else {
        addToWatchlist(symbol);
        favBtn.classList.add('active');
      }
    });

    container.appendChild(card);
  }
}

/**
 * Update quote prices in real-time
 * @param {Object} priceData - New price data
 */
export function updateQuotePrices(priceData) {
  for (const symbol in priceData) {
    const priceEl = document.getElementById(`price-${symbol}`);
    const changeEl = document.getElementById(`change-${symbol}`);
    const cardEl = document.getElementById(`quote-${symbol}`);

    if (!priceEl || !changeEl || !cardEl) continue;

    const price = priceData[symbol];
    const quote = formatQuote(symbol, price);
    if (!quote) continue;

    // 更新价格和涨跌幅
    priceEl.textContent = quote.price;
    changeEl.textContent = `${quote.change >= 0 ? '↑' : '↓'} ${Math.abs(quote.change).toFixed(2)}%`;

    // 更新样式
    changeEl.className = `quote-change ${quote.change >= 0 ? 'positive' : 'negative'}`;
    cardEl.classList.add('updating');
    setTimeout(() => cardEl.classList.remove('updating'), 500);
  }
}

/**
 * Start auto-refresh for quotes
 * @param {number} interval - Refresh interval in ms
 */
export function startQuoteRefresh(interval = 30000) {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  refreshInterval = setInterval(async () => {
    const newPrices = await fetchAllPrices();
    if (newPrices) {
      updateQuotePrices(newPrices);
    }
  }, interval);
}

/**
 * Stop auto-refresh
 */
export function stopQuoteRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

/**
 * Initialize quotes page
 * @param {string} containerId - Quotes container ID
 */
export async function initQuotesPage(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '<div class="loading">Loading market data...</div>';

  try {
    const prices = await fetchAllPrices();
    if (!prices) {
      container.innerHTML = '<div class="error">Failed to load market data. Please try again later.</div>';
      return;
    }

    const symbols = Object.keys(INSTRUMENTS);
    renderQuotes(containerId, symbols, prices);
    startQuoteRefresh();
  } catch (error) {
    console.error('Error initializing quotes:', error);
    container.innerHTML = '<div class="error">Failed to load market data. Please try again later.</div>';
  }
}
