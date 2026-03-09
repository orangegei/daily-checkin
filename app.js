const STORAGE_KEY = "daily-checkin-records";
const DAYS_TO_SHOW = 14;

const sampleRecords = [
  { date: "2026-02-20", growth: 2, note: "重新启动计划" },
  { date: "2026-02-21", growth: 3, note: "状态平稳" },
  { date: "2026-02-22", growth: 4, note: "专注度提升" },
  { date: "2026-02-23", growth: 2, note: "轻松推进" },
  { date: "2026-02-24", growth: 5, note: "效率拉满" },
  { date: "2026-02-25", growth: 4, note: "持续发力" },
  { date: "2026-02-26", growth: 6, note: "破纪录" },
  { date: "2026-02-27", growth: 3, note: "稳扎稳打" },
  { date: "2026-02-28", growth: 5, note: "进步明显" },
  { date: "2026-03-01", growth: 7, note: "进入冲刺阶段" },
  { date: "2026-03-02", growth: 8, note: "高质量完成" },
  { date: "2026-03-03", growth: 6, note: "延续节奏" },
  { date: "2026-03-04", growth: 9, note: "阶段突破" },
  { date: "2026-03-05", growth: 8, note: "再创新高" }
];

const form = document.getElementById("checkin-form");
const dateInput = document.getElementById("date");
const growthInput = document.getElementById("growth");
const noteInput = document.getElementById("note");
const statsBox = document.getElementById("stats");
const list = document.getElementById("record-list");
const chart = document.getElementById("chart");
const bestPeriod = document.getElementById("best-period");

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function loadRecords() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return sampleRecords;
  try {
    return JSON.parse(raw);
  } catch {
    return sampleRecords;
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function sortRecords(records) {
  return [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getBest7DayWindow(records) {
  if (records.length < 7) return null;
  let best = { sum: -Infinity, start: 0, end: 6 };
  for (let i = 0; i <= records.length - 7; i += 1) {
    const window = records.slice(i, i + 7);
    const sum = window.reduce((acc, item) => acc + Number(item.growth), 0);
    if (sum > best.sum) {
      best = { sum, start: i, end: i + 6 };
    }
  }
  return best;
}

function updateStats(records) {
  const totalGrowth = records.reduce((sum, item) => sum + Number(item.growth), 0);
  const avg = records.length ? (totalGrowth / records.length).toFixed(1) : "0.0";
  const latest = records.at(-1);

  statsBox.innerHTML = `
    <div class="stat-item"><div>累计增长</div><b>${totalGrowth}</b></div>
    <div class="stat-item"><div>打卡天数</div><b>${records.length}</b></div>
    <div class="stat-item"><div>日均增长</div><b>${avg}</b></div>
    <div class="stat-item"><div>最新增长</div><b>${latest ? latest.growth : 0}</b></div>
  `;
}

function updateBestPeriod(records) {
  const best = getBest7DayWindow(records);
  if (!best) {
    bestPeriod.textContent = "至少 7 天后可分析大幅增长";
    return;
  }
  const start = records[best.start].date;
  const end = records[best.end].date;
  bestPeriod.textContent = `${start} ~ ${end} 累计 +${best.sum}`;
}

function renderList(records) {
  const recent = [...records].reverse().slice(0, 8);
  list.innerHTML = recent
    .map(
      (item) => `
      <li>
        <div><strong>${item.date}</strong><br/><small>${item.note || "继续保持，温柔前进 ✨"}</small></div>
        <strong>+${item.growth}</strong>
      </li>`
    )
    .join("");
}

function renderChart(records) {
  const show = records.slice(-DAYS_TO_SHOW);
  chart.innerHTML = "";
  if (!show.length) return;

  const width = 760;
  const height = 260;
  const padding = { top: 20, right: 28, bottom: 38, left: 30 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const maxGrowth = Math.max(...show.map((d) => Number(d.growth)), 1);
  const points = show.map((d, i) => {
    const x = padding.left + (plotW * i) / Math.max(show.length - 1, 1);
    const y = padding.top + plotH - (Number(d.growth) / maxGrowth) * plotH;
    return { x, y, ...d };
  });

  const areaPath = `M ${points[0].x} ${padding.top + plotH} ${points
    .map((p) => `L ${p.x} ${p.y}`)
    .join(" ")} L ${points.at(-1).x} ${padding.top + plotH} Z`;

  const linePath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const bgGrid = Array.from({ length: 4 }, (_, i) => {
    const y = padding.top + (plotH * i) / 3;
    return `<line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#f5dbe8" stroke-dasharray="4 6" />`;
  }).join("");

  const labels = points
    .map(
      (p, i) =>
        i % 2 === 0
          ? `<text x="${p.x}" y="${height - 14}" text-anchor="middle" fill="#9c8198" font-size="11">${formatDate(
              p.date
            )}</text>`
          : ""
    )
    .join("");

  const dots = points
    .map(
      (p) => `
      <circle cx="${p.x}" cy="${p.y}" r="4.8" fill="#fff" stroke="#ff80ad" stroke-width="2" />
      <text x="${p.x}" y="${p.y - 10}" text-anchor="middle" fill="#c45b8c" font-size="11">+${p.growth}</text>
    `
    )
    .join("");

  chart.innerHTML = `
    ${bgGrid}
    <path d="${areaPath}" fill="url(#growthGradient)" opacity="0.5" />
    <path d="${linePath}" fill="none" stroke="#ff80ad" stroke-width="3" stroke-linecap="round" />
    ${dots}
    ${labels}
    <defs>
      <linearGradient id="growthGradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="#ff9ec1" />
        <stop offset="100%" stop-color="#ffe2ef" />
      </linearGradient>
    </defs>
  `;
}

function rerender(records) {
  updateStats(records);
  updateBestPeriod(records);
  renderList(records);
  renderChart(records);
}

function init() {
  dateInput.value = new Date().toISOString().slice(0, 10);
  let records = sortRecords(loadRecords());

  rerender(records);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const date = dateInput.value;
    const growth = Number(growthInput.value);
    const note = noteInput.value.trim();

    const idx = records.findIndex((item) => item.date === date);
    if (idx >= 0) {
      records[idx] = { date, growth, note };
    } else {
      records.push({ date, growth, note });
    }

    records = sortRecords(records);
    saveRecords(records);
    rerender(records);

    growthInput.value = "";
    noteInput.value = "";
  });
}

init();
