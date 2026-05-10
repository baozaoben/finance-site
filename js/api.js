// API Configuration - Real-time market data
export const INSTRUMENTS = {
  EURUSD: { name: 'EUR/USD', type: 'forex' },
  GBPUSD: { name: 'GBP/USD', type: 'forex' },
  USDJPY: { name: 'USD/JPY', type: 'forex' },
  USDCHF: { name: 'USD/CHF', type: 'forex' },
  USDCAD: { name: 'USD/CAD', type: 'forex' },
  AUDUSD: { name: 'AUD/USD', type: 'forex' },
  NZDUSD: { name: 'NZD/USD', type: 'forex' },
  XAUUSD: { name: 'XAU/USD', type: 'commodity' }
};

// 真实API数据获取
export async function fetchAllPrices() {
  try {
    const [forexRes, goldRes] = await Promise.all([
      fetch("https://latest.currency-api.p.rapidapi.com/v1/currencies/latest/usd", {
        headers: {
          "X-RapidAPI-Key": "76bb72029amshc3e35335d172994p18a079jsn11859dd79267",
          "X-RapidAPI-Host": "latest.currency-api.p.rapidapi.com"
        }
      }),
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd&include_24hr_change=true")
    ]);

    const forexData = await forexRes.json();
    const goldData = await goldRes.json();

    // 处理外汇数据
    const prices = {
      EURUSD: 1 / forexData.usd.eur,
      GBPUSD: 1 / forexData.usd.gbp,
      USDJPY: forexData.usd.jpy,
      USDCHF: forexData.usd.chf,
      USDCAD: forexData.usd.cad,
      AUDUSD: 1 / forexData.usd.aud,
      NZDUSD: 1 / forexData.usd.nzd,
      XAUUSD: goldData["tether-gold"].usd
    };

    // 模拟涨跌幅（后续可替换为真实数据）
    for (const symbol in prices) {
      const change = (Math.random() * 0.2 - 0.1).toFixed(2);
      prices[`${symbol}_change`] = change;
    }

    return prices;
  } catch (error) {
    console.error('Error fetching prices:', error);
    return null;
  }
}

// 格式化价格显示
export function formatQuote(symbol, price) {
  if (!price) return null;

  const instrument = INSTRUMENTS[symbol];
  if (!instrument) return null;

  let formattedPrice;
  if (symbol === 'USDJPY') {
    formattedPrice = price.toFixed(2);
  } else if (symbol === 'XAUUSD') {
    formattedPrice = price.toFixed(2);
  } else {
    formattedPrice = price.toFixed(4);
  }

  return {
    symbol,
    name: instrument.name,
    price: formattedPrice,
    change: parseFloat(`${Math.random() * 0.2 - 0.1}`.toFixed(2))
  };
}
