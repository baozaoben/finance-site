
// ========== 实时行情价格自动刷新 ==========
function updateRealTimePrice() {
  fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true")
  .then(res => res.json())
  .then(data => {
    if(document.getElementById("btc-price")){
      document.getElementById("btc-price").innerText = "$" + data.bitcoin.usd.toLocaleString();
    }
    if(document.getElementById("eth-price")){
      document.getElementById("eth-price").innerText = "$" + data.ethereum.usd.toLocaleString();
    }
    if(document.getElementById("btc-change")){
      document.getElementById("btc-change").innerText = data.bitcoin.usd_24h_change.toFixed(2) + "%";
    }
  });
}

// ========== 实时走势图 ==========
let chart;
function drawRealTimeChart() {
  fetch("https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1")
  .then(res => res.json())
  .then(data => {
    let prices = data.prices.map(item => ({ 
      x: new Date(item[0]), 
      y: item[1] 
    }));

    if(chart) chart.destroy();
    chart = new Chart(document.getElementById("realChart"), {
      type: "line",
      data: {
        datasets: [{
          label: "BTC实时走势",
          data: prices,
          borderColor: "#165DFF",
          backgroundColor: "rgba(22,93,255,0.1)",
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }]
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false,
        scales: {
          x: { type: "time" }
        }
      }
    });
  });
}

// ========== 实时财经新闻 ==========
function loadRealTimeNews() {
  fetch("https://api.currentsapi.services/v1/latest-news?category=business")
  .then(res => res.json())
  .then(data => {
    let listBox = document.getElementById("newsList");
    if(!listBox || !data.news) return;

    listBox.innerHTML = "";
    data.news.slice(0,6).forEach(item => {
      let itemHtml = `
        <div style="margin:10px 0;padding:8px;border-bottom:1px solid #eee;">
          <h4 style="margin:0;font-size:15px;">${item.title}</h4>
          <p style="font-size:13px;color:#666;">${item.description || ''}</p>
          <small style="color:#999;">${item.published}</small>
        </div>
      `;
      listBox.innerHTML += itemHtml;
    });
  });
}

// ========== 财经日历 ==========
function loadCalendar() {
  const calendarData = [
    "今日重点：全球央行讲话预告",
    "明日：美国CPI通胀数据公布",
    "本周：美联储利率会议纪要",
    "关注：原油、黄金库存数据"
  ];
  let box = document.getElementById("calendarList");
  if(!box) return;
  
  box.innerHTML = calendarData.map(item=>`<div style="margin:6px 0;">📅 ${item}</div>`).join("");
}

// 初始化执行
updateRealTimePrice();
drawRealTimeChart();
loadRealTimeNews();
loadCalendar();

// 定时自动刷新
setInterval(updateRealTimePrice, 30000);   // 30秒刷新价格
setInterval(drawRealTimeChart, 60000);     // 1分钟刷新走势
setInterval(loadRealTimeNews, 300000);     // 5分钟刷新新闻
