// API Layer - Centralized interface for all external data sources

import { cacheQuotes, getCachedQuotes } from './storage.js';

// Supported instruments configuration
export const INSTRUMENTS = {
  // Forex pairs
  'EURUSD': { name: 'EUR/USD', displayName: '欧元/美元', category: 'forex', pipSize: 0.0001, contractSize: 100000 },
  'GBPUSD': { name: 'GBP/USD', displayName: '英镑/美元', category: 'forex', pipSize: 0.0001, contractSize: 100000 },
  'USDJPY': { name: 'USD/JPY', displayName: '美元/日元', category: 'forex', pipSize: 0.01, contractSize: 100000 },
  'USDCHF': { name: 'USD/CHF', displayName: '美元/瑞郎', category: 'forex', pipSize: 0.0001, contractSize: 100000 },
  'AUDUSD': { name: 'AUD/USD', displayName: '澳元/美元', category: 'forex', pipSize: 0.0001, contractSize: 100000 },
  'NZDUSD': { name: 'NZD/USD', displayName: '纽元/美元', category: 'forex', pipSize: 0.0001, contractSize: 100000 },
  'USDCAD': { name: 'USD/CAD', displayName: '美元/加元', category: 'forex', pipSize: 0.0001, contractSize: 100000 },

  // Precious metals
  'XAUUSD': { name: 'XAU/USD', displayName: '黄金', category: 'metal', pipSize: 0.01, contractSize: 100 },
  'XAGUSD': { name: 'XAG/USD', displayName: '白银', category: 'metal', pipSize: 0.001, contractSize: 5000 },
  'XPTUSD': { name: 'XPT/USD', displayName: '铂金', category: 'metal', pipSize: 0.01, contractSize: 100 },

  // Energy
  'WTI': { name: 'WTI', displayName: '美原油', category: 'energy', pipSize: 0.01, contractSize: 1000 },
  'BRENT': { name: 'BRENT', displayName: '布伦特原油', category: 'energy', pipSize: 0.01, contractSize: 1000 },

  // Cryptocurrencies
  'BTC': { name: 'BTC/USD', displayName: '比特币', category: 'crypto', pipSize: 1, contractSize: 1 },
  'ETH': { name: 'ETH/USD', displayName: '以太坊', category: 'crypto', pipSize: 0.01, contractSize: 1 },
};

// CoinGecko ID mapping
const COINGECKO_IDS = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
};

// Previous price tracking for change calculation
const previousPrices = {};

/**
 * Fetch all market prices from multiple APIs
 * @returns {Promise<Object>} Map of symbol to price data
 */
export async function fetchAllPrices() {
  // Check cache first
  const cached = getCachedQuotes();
  if (cached) return cached;

  const results = {};

  // Fetch forex and metals from ExchangeRate API
  try {
    const forexData = await fetchForexRates();
    Object.assign(results, forexData);
  } catch (err) {
    console.warn('Forex API error:', err);
  }

  // Fetch crypto from CoinGecko
  try {
    const cryptoData = await fetchCryptoPrices();
    Object.assign(results, cryptoData);
  } catch (err) {
    console.warn('Crypto API error:', err);
  }

  // Cache the results
  if (Object.keys(results).length > 0) {
    cacheQuotes(results);
  }

  return results;
}

/**
 * Fetch forex exchange rates and metals
 * Uses multiple free API sources
 */
async function fetchForexRates() {
  const results = {};
  
  // Primary: ExchangeRate API for forex pairs
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await response.json();
    const rates = data.rates;

    // Build forex pairs
    const pairs = {
      'EURUSD': { base: 'EUR', quote: 'USD' },
      'GBPUSD': { base: 'GBP', quote: 'USD' },
      'USDJPY': { base: 'USD', quote: 'JPY' },
      'USDCHF': { base: 'USD', quote: 'CHF' },
      'AUDUSD': { base: 'AUD', quote: 'USD' },
      'NZDUSD': { base: 'NZD', quote: 'USD' },
      'USDCAD': { base: 'USD', quote: 'CAD' },
    };

    for (const [symbol, pair] of Object.entries(pairs)) {
      if (pair.quote === 'USD') {
        results[symbol] = rates[pair.base] || 0;
      } else {
        results[symbol] = rates[pair.quote] ? 1 / rates[pair.quote] : 0;
      }
    }
  } catch {
    // Fallback: simulate forex data
    return getFallbackForex();
  }

  // Metals: use a free API or fallback
  try {
    const metalResponse = await fetch('https://api.metals.live/v1/spot');
    const metalData = await metalResponse.json();
    
    for (const metal of metalData) {
      if (metal.metal === 'gold' && results['XAUUSD'] === undefined) {
        results['XAUUSD'] = metal.price || 0;
      }
      if (metal.metal === 'silver' && results['XAGUSD'] === undefined) {
        results['XAGUSD'] = metal.price || 0;
      }
      if (metal.metal === 'platinum' && results['XPTUSD'] === undefined) {
        results['XPTUSD'] = metal.price || 0;
      }
    }
  } catch {
    // Use fallback values
    const fallback = getFallbackMetals();
    Object.assign(results, fallback);
  }

  // Energy: use fallback with simulated data (no reliable free API)
  if (results['WTI'] === undefined) {
    const energy = getFallbackEnergy();
    Object.assign(results, energy);
  }

  return results;
}

/**
 * Fetch cryptocurrency prices from CoinGecko
 */
async function fetchCryptoPrices() {
  const results = {};
  
  const ids = Object.values(COINGECKO_IDS).join(',');
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
  );
  
  if (!response.ok) throw new Error('CoinGecko API error');
  
  const data = await response.json();

  for (const [symbol, coinId] of Object.entries(COINGECKO_IDS)) {
    const coin = data[coinId];
    if (coin) {
      results[symbol] = coin.usd;
    }
  }

  return results;
}

/**
 * Fallback forex data when API fails
 */
function getFallbackForex() {
  return {
    'EURUSD': 1.0856,
    'GBPUSD': 1.2678,
    'USDJPY': 154.32,
    'USDCHF': 0.8834,
    'AUDUSD': 0.6543,
    'NZDUSD': 0.5987,
    'USDCAD': 1.3678,
  };
}

/**
 * Fallback metals data
 */
function getFallbackMetals() {
  return {
    'XAUUSD': 2345.67,
    'XAGUSD': 28.45,
    'XPTUSD': 987.65,
  };
}

/**
 * Fallback energy data
 */
function getFallbackEnergy() {
  return {
    'WTI': 78.56,
    'BRENT': 82.34,
  };
}

/**
 * Calculate price change and format quote data
 * @param {string} symbol - Instrument symbol
 * @param {number} currentPrice - Current price
 * @returns {Object} Formatted quote data
 */
export function formatQuote(symbol, currentPrice) {
  const config = INSTRUMENTS[symbol];
  if (!config) return null;

  const prevPrice = previousPrices[symbol] || currentPrice;
  const change = currentPrice - prevPrice;
  const changePercent = prevPrice !== 0 ? (change / prevPrice) * 100 : 0;

  previousPrices[symbol] = currentPrice;

  const decimals = config.pipSize < 1 ? String(config.pipSize).split('.')[1].length : 2;

  return {
    symbol,
    name: config.name,
    displayName: config.displayName,
    category: config.category,
    price: currentPrice,
    change: change,
    changePercent: changePercent,
    pipSize: config.pipSize,
    contractSize: config.contractSize,
    decimals,
  };
}

/**
 * Fetch K-line (candlestick) data
 * Uses fallback generated data since free OHLC APIs are limited
 * @param {string} symbol - Instrument symbol
 * @param {string} interval - Time interval (1m, 5m, 15m, 1h, 4h, 1d)
 * @returns {Promise<Array>} Array of OHLCV data points
 */
export async function fetchKlineData(symbol, interval = '1h') {
  // Generate realistic candlestick data based on current price
  const allPrices = await fetchAllPrices();
  const currentPrice = allPrices[symbol] || 100;
  const config = INSTRUMENTS[symbol];
  if (!config) return [];

  const volatility = config.category === 'crypto' ? 0.02 : config.category === 'metal' ? 0.005 : 0.003;
  const count = interval === '1d' ? 90 : 200;

  const data = [];
  let price = currentPrice * (1 - volatility * Math.sqrt(count));
  const now = Math.floor(Date.now() / 1000);

  const intervalSeconds = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
  };

  const secondsPerCandle = intervalSeconds[interval] || 3600;
  const startTime = now - count * secondsPerCandle;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * volatility * price;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * volatility * price * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * price * 0.5;
    const volume = Math.floor(Math.random() * 10000) + 1000;

    data.push({
      time: startTime + i * secondsPerCandle,
      open: parseFloat(open.toFixed(config.decimals)),
      high: parseFloat(high.toFixed(config.decimals)),
      low: parseFloat(low.toFixed(config.decimals)),
      close: parseFloat(close.toFixed(config.decimals)),
      volume,
    });

    price = close;
  }

  return data;
}

/**
 * Fetch financial news
 * @param {number} limit - Number of articles to fetch
 * @returns {Promise<Array>} Array of news items
 */
export async function fetchNews(limit = 20) {
  const rssUrls = [
    'https://feeds.reuters.com/reuters/businessNews',
    'https://feeds.reuters.com/reuters/finance',
  ];

  const results = [];

  for (const url of rssUrls) {
    try {
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}&count=${Math.ceil(limit / 2)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status === 'ok' && data.items) {
        for (const item of data.items) {
          results.push({
            title: item.title,
            url: item.link,
            publishedAt: item.pubDate,
            source: 'Reuters',
            description: item.description ? item.description.replace(/<[^>]*>/g, '').substring(0, 150) : '',
            image: item.enclosure?.link || item.thumbnail || '',
          });
        }
      }
    } catch {
      // Use fallback news
    }
  }

  // Fallback news if API fails
  if (results.length === 0) {
    return getFallbackNews();
  }

  return results.slice(0, limit);
}

/**
 * Fallback news data
 */
function getFallbackNews() {
  return [
    { title: 'Federal Reserve Signals Potential Rate Adjustment in Coming Months', url: '#', publishedAt: new Date().toISOString(), source: 'Reuters', description: 'Fed officials indicate willingness to adjust monetary policy based on incoming economic data and inflation trends.', image: '' },
    { title: 'Gold Prices Surge to New Highs Amid Global Uncertainty', url: '#', publishedAt: new Date(Date.now() - 3600000).toISOString(), source: 'Bloomberg', description: 'Precious metals see strong demand as investors seek safe-haven assets.', image: '' },
    { title: 'Oil Markets Volatile as OPEC+ Discusses Production Strategy', url: '#', publishedAt: new Date(Date.now() - 7200000).toISOString(), source: 'CNBC', description: 'Crude prices fluctuate on supply concerns and geopolitical tensions.', image: '' },
    { title: 'Bitcoin ETF Inflows Reach Record Levels This Quarter', url: '#', publishedAt: new Date(Date.now() - 10800000).toISOString(), source: 'CoinDesk', description: 'Institutional adoption drives cryptocurrency market growth.', image: '' },
    { title: 'EUR/USD Holds Steady as ECB Maintains Policy Stance', url: '#', publishedAt: new Date(Date.now() - 14400000).toISOString(), source: 'FX Street', description: 'European currency pair consolidates near key support levels.', image: '' },
    { title: 'Asian Markets Mixed on Trade Data and Economic Indicators', url: '#', publishedAt: new Date(Date.now() - 18000000).toISOString(), source: 'Nikkei', description: 'Regional equities show divergent performance across major indices.', image: '' },
    { title: 'US Dollar Index Retreats from Recent Multi-Month Highs', url: '#', publishedAt: new Date(Date.now() - 21600000).toISOString(), source: 'MarketWatch', description: 'Greenback weakens as Treasury yields decline on rate expectations.', image: '' },
    { title: 'Silver Demand Outpaces Supply as Industrial Use Grows', url: '#', publishedAt: new Date(Date.now() - 25200000).toISOString(), source: 'Kitco', description: 'Solar panel and electronics sectors drive precious metal consumption.', image: '' },
  ];
}

/**
 * Get economic calendar events
 * @param {string} dateFrom - Start date (YYYY-MM-DD)
 * @param {string} dateTo - End date (YYYY-MM-DD)
 * @returns {Array} Array of economic events
 */
export function getEconomicCalendar(dateFrom, dateTo) {
  return generateCalendarEvents(dateFrom, dateTo);
}

/**
 * Generate realistic economic calendar events
 */
function generateCalendarEvents(dateFrom, dateTo) {
  const events = [
    { country: 'US', countryCode: 'USD', event: 'Non-Farm Payrolls', importance: 3, category: 'employment', unit: 'K' },
    { country: 'US', countryCode: 'USD', event: 'Unemployment Rate', importance: 3, category: 'employment', unit: '%' },
    { country: 'US', countryCode: 'USD', event: 'CPI m/m', importance: 3, category: 'inflation', unit: '%' },
    { country: 'US', countryCode: 'USD', event: 'Fed Interest Rate Decision', importance: 3, category: 'central_bank', unit: '%' },
    { country: 'US', countryCode: 'USD', event: 'GDP q/q', importance: 2, category: 'growth', unit: '%' },
    { country: 'US', countryCode: 'USD', event: 'Retail Sales m/m', importance: 2, category: 'consumption', unit: '%' },
    { country: 'US', countryCode: 'USD', event: 'ISM Manufacturing PMI', importance: 2, category: 'business', unit: '' },
    { country: 'US', countryCode: 'USD', event: 'Core PCE Price Index m/m', importance: 3, category: 'inflation', unit: '%' },
    { country: 'EU', countryCode: 'EUR', event: 'ECB Interest Rate Decision', importance: 3, category: 'central_bank', unit: '%' },
    { country: 'EU', countryCode: 'EUR', event: 'CPI y/y', importance: 2, category: 'inflation', unit: '%' },
    { country: 'EU', countryCode: 'EUR', event: 'GDP q/q', importance: 2, category: 'growth', unit: '%' },
    { country: 'EU', countryCode: 'EUR', event: 'Manufacturing PMI', importance: 2, category: 'business', unit: '' },
    { country: 'UK', countryCode: 'GBP', event: 'BOE Interest Rate Decision', importance: 3, category: 'central_bank', unit: '%' },
    { country: 'UK', countryCode: 'GBP', event: 'CPI y/y', importance: 2, category: 'inflation', unit: '%' },
    { country: 'UK', countryCode: 'GBP', event: 'GDP m/m', importance: 2, category: 'growth', unit: '%' },
    { country: 'UK', countryCode: 'GBP', event: 'Retail Sales m/m', importance: 2, category: 'consumption', unit: '%' },
    { country: 'JP', countryCode: 'JPY', event: 'BOJ Interest Rate Decision', importance: 3, category: 'central_bank', unit: '%' },
    { country: 'JP', countryCode: 'JPY', event: 'CPI y/y', importance: 2, category: 'inflation', unit: '%' },
    { country: 'JP', countryCode: 'JPY', event: 'GDP q/q', importance: 2, category: 'growth', unit: '%' },
    { country: 'AU', countryCode: 'AUD', event: 'RBA Interest Rate Decision', importance: 3, category: 'central_bank', unit: '%' },
    { country: 'AU', countryCode: 'AUD', event: 'Employment Change', importance: 2, category: 'employment', unit: 'K' },
    { country: 'CA', countryCode: 'CAD', event: 'BOC Interest Rate Decision', importance: 3, category: 'central_bank', unit: '%' },
    { country: 'CA', countryCode: 'CAD', event: 'Employment Change', importance: 2, category: 'employment', unit: 'K' },
    { country: 'CN', countryCode: 'CNY', event: 'Manufacturing PMI', importance: 2, category: 'business', unit: '' },
    { country: 'CN', countryCode: 'CNY', event: 'GDP y/y', importance: 2, category: 'growth', unit: '%' },
  ];

  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);
  const results = [];
  let id = 1;

  const times = ['08:30', '09:00', '10:00', '10:30', '14:00', '14:30', '16:00', '20:30', '21:00', '23:00'];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    
    // Skip weekends for most events
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      if (Math.random() > 0.3) continue;
    }

    // Add 3-6 events per day
    const numEvents = 3 + Math.floor(Math.random() * 4);
    const shuffled = [...events].sort(() => Math.random() - 0.5);

    for (let i = 0; i < Math.min(numEvents, shuffled.length); i++) {
      const evt = shuffled[i];
      const time = times[Math.floor(Math.random() * times.length)];
      const baseValue = getBaseValue(evt);
      const previous = generateValue(baseValue, 0.1);
      const forecast = generateValue(baseValue, 0.05);
      // Actual is null for future events, populated for past events
      const isPast = d < new Date();
      const actual = isPast ? generateValue(baseValue, 0.15) : null;

      results.push({
        id: `evt_${id++}`,
        date: dateStr,
        time,
        country: evt.country,
        countryCode: evt.countryCode,
        event: evt.event,
        importance: evt.importance,
        category: evt.category,
        unit: evt.unit,
        previous: formatValue(previous, evt),
        forecast: formatValue(forecast, evt),
        actual: actual !== null ? formatValue(actual, evt) : null,
      });
    }
  }

  return results.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });
}

function getBaseValue(evt) {
  const bases = {
    'Non-Farm Payrolls': 200,
    'Unemployment Rate': 3.8,
    'CPI m/m': 0.3,
    'CPI y/y': 3.2,
    'Fed Interest Rate Decision': 5.5,
    'ECB Interest Rate Decision': 4.5,
    'BOE Interest Rate Decision': 5.25,
    'BOJ Interest Rate Decision': 0.1,
    'RBA Interest Rate Decision': 4.35,
    'BOC Interest Rate Decision': 5.0,
    'GDP q/q': 0.5,
    'GDP m/m': 0.3,
    'GDP y/y': 5.2,
    'Retail Sales m/m': 0.4,
    'ISM Manufacturing PMI': 50,
    'Manufacturing PMI': 50,
    'Core PCE Price Index m/m': 0.2,
    'Employment Change': 25,
  };
  return bases[evt.event] || 50;
}

function generateValue(base, variance) {
  return base + base * variance * (Math.random() * 2 - 1);
}

function formatValue(value, evt) {
  if (evt.unit === 'K') return Math.round(value) + 'K';
  if (evt.unit === '%') return value.toFixed(1) + '%';
  if (evt.unit === '') return value.toFixed(1);
  return value.toFixed(2);
}
