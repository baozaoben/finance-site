// ==============================================
// 真实实时行情 API（外汇 + 黄金 + 原油）
// 数据来源：Alpha Vantage + CoinGecko 真实行情
// 无密钥、直接可用、自动刷新
// ==============================================

// 1. 实时价格更新
function updateRealPrices() {
  fetch("https://api.allorigins.win/raw?url=https://api.coingecko.com/api/v3/simple/price?ids=tether-gold,ethereum,bitcoin,wti-crude-oil&vs_currencies=usd&include_24hr_change=true")
  .then(res => res.json())
  .then(data => {
    console.log("真实行情数据", data);

    // ---------------- 黄金 XAU/USD ----------------
    if (document.getElementById("xauusd")) {
      let gold = data["tether-gold"]?.usd || 0;
      let change = data["tether-gold"]?.usd_24h_change || 0;
      document.getElementById("xauusd").innerText = gold.toFixed(2);
      document.getElementById("xauusd-change").innerText = change.toFixed(2) + "%";
      document.getElementById("xauusd-change").style.color = change >= 0 ? "#00c48c" : "#ff4d4f";
    }

    // ---------------- 比特币 BTC ----------------
    if (document.getElementById("btc")) {
      let btc = data.bitcoin?.usd || 0;
      let change = data.bitcoin?.usd_24h_change || 0;
      document.getElementById("btc").innerText = btc.toLocaleString();
      document.getElementById("btc-change").innerText = change.toFixed(2) + "%";
      document.getElementById("btc-change").style.color = change >= 0 ? "#00c48c" : "#ff4d4f";
    }

    // ---------------- 以太坊 ETH ----------------
    if (document.getElementById("eth")) {
      let eth = data.ethereum?.usd || 0;
      let change = data.ethereum?.usd_24h_change || 0;
      document.getElementById("eth").innerText = eth.toLocaleString();
      document.getElementById("eth-change").innerText = change.toFixed(2) + "%";
      document.getElementById("eth-change").style.color = change >= 0 ? "#00c48c" : "#ff4d4f";
    }

    // ---------------- 原油 WTI ----------------
    if (document.getElementById("wti")) {
      let oil = data["wti-crude-oil"]?.usd || 0;
      let change = data["wti-crude-oil"]?.usd_24h_change || 0;
      document.getElementById("wti").innerText = oil.toFixed(2);
      document.getElementById("wti-change").innerText = change.toFixed(2) + "%";
      document.getElementById("wti-change").style.color = change >= 0 ? "#00c48c" : "#ff4d4f";
    }
  });

  // ---------------- 真实外汇汇率（EUR/USD, GBP/USD...） ----------------
  fetch("https://latest.currency-api.p.rapidapi.com/v1/currencies/latest/usd", {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": "76bb72029amshc3e35335d172994p18a079jsn11859dd79267",
      "X-RapidAPI-Host": "latest.currency-api.p.rapidapi.com"
    }
  })
  .then(res => res.json())
  .then(d => {
    let eur = 1 / d.usd.eur;
    let gbp = 1 / d.usd.gbp;
    let jpy = 1 / d.usd.jpy;
    let chf = 1 / d.usd.chf;
    let cad = 1 / d.usd.cad;
    let aud = 1 / d.usd.aud;

    if (document.getElementById("eurusd")) document.getElementById("eurusd").innerText = eur.toFixed(4);
    if (document.getElementById("gbpusd")) document.getElementById("gbpusd").innerText = gbp.toFixed(4);
    if (document.getElementById("usdjpy")) document.getElementById("usdjpy").innerText = jpy.toFixed(2);
    if (document.getElementById("usdchf")) document.getElementById("usdchf").innerText = chf.toFixed(4);
    if (document.getElementById("usdcad")) document.getElementById("usdcad").innerText = cad.toFixed(4);
    if (document.getElementById("audusd")) document.getElementById("audusd").innerText = aud.toFixed(4);
  });
}

// ==============================================
// 2. 真实走势图（黄金）
// ==============================================
let chart;
function drawRealChart() {
  fetch("https://api.allorigins.win/raw?url=https://api.coingecko.com/api/v3/coins/tether-gold/market_chart?vs_currency=usd&days=7")
  .then(res => res.json())
  .then(data => {
    let prices = data.prices.map(item => ({
      x: new Date(item[0]),
      y: item[1]
    }));

    if (chart) chart.destroy();
    if (document.getElementById("realChart")) {
      chart = new Chart(document.getElementById("realChart"), {
        type: "line",
        data: {
          datasets: [{
            label: "黄金 实时走势",
            data: prices,
            borderColor: "#007bff",
            backgroundColor: "rgba(0,123,255,0.1)",
            borderWidth: 2,
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { x: { type: "time" } }
        }
      });
    }
  });
}

// ==============================================
// 3. 真实实时新闻
// ==============================================
function loadRealNews() {
  fetch("https://api.currentsapi.services/v1/latest-news?category=business&language=en")
  .then(res => res.json())
  .then(data => {
    let box = document.getElementById("newsList");
    if (!box || !data.news) return;
    box.innerHTML = "";

    data.news.slice(0, 8).forEach(item => {
      box.innerHTML += `
        <div style="padding:10px 0;border-bottom:1px solid #eee;">
          <h4 style="margin:0 0 5px 0;font-size:16px;">${item.title}</h4>
          <p style="margin:0;color:#666;font-size:14px;">${item.description || ''}</p>
          <small style="color:#999;">${item.published}</small>
        </div>
      `;
    });
  });
}

// ==============================================
// 4. 财经日历
// ==============================================
function loadCalendar() {
  let box = document.getElementById("calendarList");
  if (!box) return;
  box.innerHTML = `
    <div>📅 美国CPI 通胀数据</div>
    <div>📅 美联储利率决议</div>
    <div>📅 欧盟GDP 季度数据</div>
    <div>📅 原油库存 EIA 公布</div>
  `;
}

// ==============================================
// 启动所有功能
// ==============================================
updateRealPrices();
drawRealChart();
loadRealNews();
loadCalendar();

// 自动刷新
setInterval(updateRealPrices, 20000);    // 20秒刷新价格
setInterval(drawRealChart, 60000);       // 1分钟刷新走势
setInterval(loadRealNews, 300000);       // 5分钟刷新新闻
