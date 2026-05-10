// Chart Engine - Lightweight Charts wrapper

import { createChart, ColorType } from 'lightweight-charts';

let chartInstances = new Map();

/**
 * Create a K-line (candlestick) chart
 * @param {HTMLElement} container - DOM container element
 * @param {Object} options - Chart options
 * @returns {Object} Chart instance wrapper
 */
export function createKlineChart(container, options = {}) {
  const {
    width = container.clientWidth,
    height = container.clientHeight || 400,
    theme = 'dark',
  } = options;

  const isDark = theme === 'dark';

  const chart = createChart(container, {
    width,
    height,
    layout: {
      background: { type: ColorType.Solid, color: isDark ? '#0f2440' : '#ffffff' },
      textColor: isDark ? '#9fb3d9' : '#1a3a5c',
    },
    grid: {
      vertLines: { color: isDark ? '#15304d' : '#e8edf5' },
      horzLines: { color: isDark ? '#15304d' : '#e8edf5' },
    },
    crosshair: {
      mode: 0,
    },
    rightPriceScale: {
      borderColor: isDark ? '#15304d' : '#e8edf5',
    },
    timeScale: {
      borderColor: isDark ? '#15304d' : '#e8edf5',
      timeVisible: true,
      secondsVisible: false,
    },
  });

  const candlestickSeries = chart.addCandlestickSeries({
    upColor: isDark ? '#00c853' : '#00875a',
    downColor: isDark ? '#ff1744' : '#de350b',
    borderDownColor: isDark ? '#ff1744' : '#de350b',
    borderUpColor: isDark ? '#00c853' : '#00875a',
    wickDownColor: isDark ? '#ff1744' : '#de350b',
    wickUpColor: isDark ? '#00c853' : '#00875a',
  });

  const volumeSeries = chart.addHistogramSeries({
    color: isDark ? '#2979ff' : '#0052cc',
    priceFormat: { type: 'volume' },
    priceScaleId: 'volume',
    scaleMargins: { top: 0.8, bottom: 0 },
  });

  chart.priceScale('volume').applyOptions({
    scaleMargins: { top: 0.8, bottom: 0 },
  });

  const instance = { chart, candlestickSeries, volumeSeries, container };
  chartInstances.set(container.id || Date.now().toString(), instance);

  return instance;
}

/**
 * Update chart with OHLCV data
 * @param {Object} instance - Chart instance from createKlineChart
 * @param {Array} data - Array of OHLCV data points
 */
export function updateChartData(instance, data) {
  if (!instance || !data || data.length === 0) return;

  const candleData = data.map(d => ({
    time: d.time,
    open: d.open,
    high: d.high,
    low: d.low,
    close: d.close,
  }));

  const volumeData = data.map(d => ({
    time: d.time,
    value: d.volume,
    color: d.close >= d.open ? 'rgba(0, 200, 83, 0.3)' : 'rgba(255, 23, 68, 0.3)',
  }));

  instance.candlestickSeries.setData(candleData);
  instance.volumeSeries.setData(volumeData);
  instance.chart.timeScale().fitContent();
}

/**
 * Create a mini sparkline chart for inline display
 * @param {HTMLElement} container - DOM container
 * @param {Array} data - Array of price points
 * @param {string} color - Line color
 */
export function createMiniChart(container, data, color = '#2979ff') {
  if (!container || !data || data.length === 0) return;

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  try {
    const chart = createChart(container, {
      width: container.clientWidth,
      height: 50,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'transparent',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: { visible: false },
    });

    const lineSeries = chart.addLineSeries({
      color,
      lineWidth: 2,
      crosshairMarkerVisible: false,
    });

    const chartData = data.map((price, i) => ({
      time: Math.floor(Date.now() / 1000) - (data.length - i) * 60,
      value: price,
    }));

    lineSeries.setData(chartData);
  } catch {
    // Lightweight charts may not be available
  }
}

/**
 * Resize chart to fit container
 * @param {Object} instance - Chart instance
 */
export function resizeChart(instance) {
  if (!instance) return;
  const { container, chart } = instance;
  chart.applyOptions({
    width: container.clientWidth,
    height: container.clientHeight,
  });
}

/**
 * Remove chart instance
 * @param {string} id - Chart container ID
 */
export function removeChart(id) {
  const instance = chartInstances.get(id);
  if (instance) {
    instance.chart.remove();
    chartInstances.delete(id);
  }
}

/**
 * Get all chart instances
 * @returns {Map}
 */
export function getChartInstances() {
  return chartInstances;
}
