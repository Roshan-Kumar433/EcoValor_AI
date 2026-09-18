/**
 * dashboard.js — Dashboard Page
 * --------------------------------
 * EcoValor AI — Industrial Waste Valorization Platform
 * Fetches live stats from /api/waste/stats and renders KPI cards + charts.
 * All values come from real database records — zero fabricated data.
 */

import api from "./api.js";

/* ── Chart.js Light-Theme Defaults ─────────────────────────────── */
Chart.defaults.color          = "#7d9484";
Chart.defaults.borderColor    = "#dde5e0";
Chart.defaults.font.family    = "'Inter', sans-serif";
Chart.defaults.font.size      = 12;
Chart.defaults.plugins.tooltip.padding    = 10;
Chart.defaults.plugins.tooltip.boxPadding = 4;
Chart.defaults.plugins.tooltip.backgroundColor = "#1a2e1e";
Chart.defaults.plugins.tooltip.titleColor       = "#ffffff";
Chart.defaults.plugins.tooltip.bodyColor        = "#a3b8a9";
Chart.defaults.plugins.tooltip.cornerRadius     = 6;
Chart.defaults.plugins.tooltip.borderColor      = "#0f3d24";
Chart.defaults.plugins.tooltip.borderWidth      = 1;

/* ── Palette ────────────────────────────────────────────────────── */
const PALETTE = {
  primary:   "#1a5c38",
  secondary: "#0d9488",
  sage:      "#4d8b6b",
  moss:      "#6aab84",
  fern:      "#2d7d55",
  amber:     "#d97706",
  info:      "#0369a1",
  danger:    "#b91c1c",
};

const CHART_COLORS = [
  "#1a5c38", "#0d9488", "#4d8b6b", "#2d7d55", "#6aab84",
  "#0891b2", "#d97706", "#b91c1c",
];

/* ── Main Render ─────────────────────────────────────────────────── */

export async function renderDashboard(container) {
  container.innerHTML = dashboardSkeleton();

  let stats;
  try {
    const res = await api.get("/waste/stats");
    stats = res.data;
  } catch (err) {
    container.innerHTML = `
      <div class="page-header">
        <h1>Dashboard</h1>
        <p>Industrial Waste Intelligence</p>
      </div>
      <div class="card" style="text-align:center;padding:48px 20px;">
        <div class="empty-icon" style="margin:0 auto 16px;">
          <i data-lucide="alert-triangle" style="width:24px;height:24px;color:var(--warning);"></i>
        </div>
        <h3 style="font-size:16px;margin-bottom:8px;">Unable to Load Dashboard</h3>
        <p style="color:var(--text-muted);font-size:13px;">Make sure the Flask server is running.</p>
        <p style="color:var(--danger);font-size:12px;margin-top:8px;">${err.message}</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <!-- Page Header -->
    <div class="page-header-row">
      <div>
        <h1>Industrial Waste Intelligence</h1>
        <p>Monitor waste generation, valorization opportunities and recovered value.</p>
      </div>
      <button class="btn btn-primary" onclick="navigateTo('register')">
        <i data-lucide="plus"></i>
        <span class="btn-label">Register Waste</span>
      </button>
    </div>

    <!-- KPI Cards -->
    <div class="stats-grid" id="kpi-grid">
      ${kpiCard(
        "package",
        "stat-icon-green",
        stats.total_entries ?? 0,
        "Total Waste Batches",
        "Across all registered records"
      )}
      ${kpiCard(
        "trending-up",
        "stat-icon-teal",
        "₹" + (stats.total_market_value ? Number(stats.total_market_value).toLocaleString('en-IN') : "0"),
        "Est. Market Valuation",
        `Avg ₹${stats.avg_market_price || 0}/unit`
      )}
      ${kpiCard(
        "recycle",
        "stat-icon-green",
        stats.analysed ?? 0,
        "Batches Valorized",
        "Analysis completed"
      )}
      ${kpiCard(
        "weight",
        "stat-icon-info",
        formatVolume(stats.total_volume_kg),
        "Total Volume",
        "Cumulative quantity"
      )}
      ${kpiCard(
        "clock",
        "stat-icon-amber",
        stats.pending_analysis ?? 0,
        "Awaiting Analysis",
        "Pending AI assessment"
      )}
    </div>

    <!-- AI Engine Notice -->
    ${stats.ml_model_ready
      ? `<div class="notice-banner success" style="margin-bottom:20px;">
           <div class="notice-banner-icon"><i data-lucide="cpu"></i></div>
           <div class="notice-banner-body">
             <h4>AI Engine Active</h4>
             <p>The valorization predictor is ready to analyze waste entries.</p>
           </div>
         </div>`
      : `<div class="notice-banner info" style="margin-bottom:20px;">
           <div class="notice-banner-icon"><i data-lucide="info"></i></div>
           <div class="notice-banner-body">
             <h4>AI Engine — Phase 2</h4>
             <p>The machine-learning predictor will be integrated in Phase 2. All registered entries are stored and ready for batch analysis.</p>
           </div>
         </div>`
    }

    <!-- Charts -->
    <div class="charts-grid">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Waste Category Distribution</div>
            <div class="card-subtitle">Registered entries by waste type</div>
          </div>
        </div>
        <div class="chart-container"><canvas id="chart-type"></canvas></div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Registration Trend</div>
            <div class="card-subtitle">Monthly waste entry volume</div>
          </div>
        </div>
        <div class="chart-container"><canvas id="chart-monthly"></canvas></div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Contamination Profile</div>
            <div class="card-subtitle">Low / Medium / High breakdown</div>
          </div>
        </div>
        <div class="chart-container"><canvas id="chart-contamination"></canvas></div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Market Demand Distribution</div>
            <div class="card-subtitle">High, Medium &amp; Low Demand breakdown</div>
          </div>
        </div>
        <div class="chart-container"><canvas id="chart-demand"></canvas></div>
      </div>
    </div>

    <!-- Recent Batches -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Recent Waste Batches</div>
          <div class="card-subtitle">Latest registered entries</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="navigateTo('history')">
          View all
          <i data-lucide="arrow-right"></i>
        </button>
      </div>
      <div id="recent-batches-body">
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${Array(4).fill(`<div class="skeleton" style="height:36px;"></div>`).join("")}
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  drawCharts(stats);
  loadRecentBatches();
}

/* ── KPI Card Helper ─────────────────────────────────────────── */

function kpiCard(icon, iconClass, value, label, sub) {
  return `
    <div class="stat-card">
      <div class="stat-icon-box ${iconClass}">
        <i data-lucide="${icon}"></i>
      </div>
      <div class="stat-body">
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
        <div class="stat-sub">${sub}</div>
      </div>
    </div>`;
}

/* ── Recent Batches ──────────────────────────────────────────── */

async function loadRecentBatches() {
  const el = document.getElementById("recent-batches-body");
  if (!el) return;

  try {
    const res = await api.get("/waste/list?page=1&per_page=5");
    const items = res.items || [];

    if (items.length === 0) {
      el.innerHTML = `
        <div class="empty-state" style="padding:32px 20px;">
          <div class="empty-icon"><i data-lucide="inbox"></i></div>
          <h3>No waste batches yet</h3>
          <p>Register your first industrial waste batch to begin.</p>
          <button class="btn btn-primary" style="margin-top:14px;" onclick="navigateTo('register')">
            <i data-lucide="plus"></i> Register Waste
          </button>
        </div>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    el.innerHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>Waste Type</th>
              <th>Quantity</th>
              <th>Location</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(e => `
              <tr>
                <td class="td-mono">#${e.id}</td>
                <td class="td-primary">${escHtml(e.waste_type)}</td>
                <td>${e.quantity.toLocaleString()} ${e.unit}</td>
                <td>${escHtml(e.location)}</td>
                <td>${statusBadge(e.status)}</td>
                <td>${formatDate(e.created_at)}</td>
                <td>
                  <button class="btn btn-ghost btn-sm"
                    onclick="navigateTo('analysis', ${e.id})"
                    title="Open in Analysis">
                    <i data-lucide="arrow-up-right"></i>
                  </button>
                </td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    el.innerHTML = `<p style="color:var(--danger);font-size:13px;padding:12px 0;">${err.message}</p>`;
  }
}

/* ── Charts ──────────────────────────────────────────────────── */

function drawCharts(stats) {
  // 1. Waste Type — Doughnut
  const typeLabels = stats.type_distribution.map(d => d.type);
  const typeCounts = stats.type_distribution.map(d => d.count);
  renderDonut("chart-type", typeLabels, typeCounts);

  // 2. Monthly Trend — Line
  const months = stats.monthly_trend.map(d => {
    const date = new Date(d.year, d.month - 1);
    return date.toLocaleString("default", { month: "short", year: "2-digit" });
  });
  renderLine("chart-monthly", months, stats.monthly_trend.map(d => d.count));

  // 3. Contamination — Horizontal Bar
  const contamMap = { low: 0, medium: 0, high: 0 };
  stats.contamination_distribution.forEach(d => { contamMap[d.level] = d.count; });
  renderHBar("chart-contamination",
    ["Low", "Medium", "High"],
    [contamMap.low, contamMap.medium, contamMap.high],
    [PALETTE.primary, PALETTE.amber, PALETTE.danger]
  );

  // 4. Market Demand — Doughnut
  const demandMap = { high: 0, medium: 0, low: 0 };
  (stats.demand_distribution || []).forEach(d => {
    if (d.demand && demandMap.hasOwnProperty(d.demand.toLowerCase())) {
      demandMap[d.demand.toLowerCase()] = d.count;
    }
  });
  renderDonut("chart-demand",
    ["High Demand", "Medium Demand", "Low Demand"],
    [demandMap.high, demandMap.medium, demandMap.low],
    [PALETTE.primary, PALETTE.amber, "#64748b"]
  );
}

function renderDonut(id, labels, data, colors = CHART_COLORS) {
  const el = document.getElementById(id);
  if (!el) return;

  if (!data.some(v => v > 0)) {
    renderEmpty(el);
    return;
  }

  new Chart(el, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.map(c => hexToRgba(c, 0.85)),
        borderColor:     colors,
        borderWidth: 2,
        hoverOffset: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: { boxWidth: 11, padding: 14, font: { size: 11 } },
        },
      },
      cutout: "62%",
    },
  });
}

function renderLine(id, labels, data) {
  const el = document.getElementById(id);
  if (!el) return;

  if (!data.some(v => v > 0)) {
    renderEmpty(el);
    return;
  }

  new Chart(el, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Registrations",
        data,
        borderColor:     PALETTE.primary,
        backgroundColor: hexToRgba(PALETTE.primary, 0.08),
        fill: true,
        tension: 0.4,
        pointBackgroundColor: PALETTE.primary,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "#f0f4f1" }, ticks: { font: { size: 11 } } },
        y: { grid: { color: "#f0f4f1" }, ticks: { precision: 0, font: { size: 11 } }, beginAtZero: true },
      },
    },
  });
}

function renderHBar(id, labels, data, colors = CHART_COLORS) {
  const el = document.getElementById(id);
  if (!el) return;

  if (!data.some(v => v > 0)) {
    renderEmpty(el);
    return;
  }

  new Chart(el, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Entries",
        data,
        backgroundColor: colors.map(c => hexToRgba(c, 0.75)),
        borderColor:     colors,
        borderWidth: 1.5,
        borderRadius: 4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "#f0f4f1" }, ticks: { precision: 0, font: { size: 11 } }, beginAtZero: true },
        y: { grid: { display: false }, ticks: { font: { size: 12, weight: "600" } } },
      },
    },
  });
}

function renderEmpty(canvas) {
  const parent = canvas.parentElement;
  parent.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
      height:100%;color:var(--text-muted);gap:10px;">
      <i data-lucide="bar-chart-2" style="width:32px;height:32px;opacity:0.35;"></i>
      <p style="font-size:12.5px;">No data yet</p>
    </div>`;
  if (window.lucide) lucide.createIcons();
}

/* ── Skeleton ────────────────────────────────────────────────── */

function dashboardSkeleton() {
  return `
    <div class="page-header-row">
      <div>
        <h1>Industrial Waste Intelligence</h1>
        <p>Loading dashboard data…</p>
      </div>
    </div>
    <div class="stats-grid">
      ${Array(4).fill(`<div class="skeleton" style="height:92px;border-radius:12px;"></div>`).join("")}
    </div>
    <div class="charts-grid">
      ${Array(4).fill(`<div class="skeleton" style="height:300px;border-radius:12px;"></div>`).join("")}
    </div>`;
}

/* ── Helpers ─────────────────────────────────────────────────── */

function statusBadge(status) {
  return status === "analysed"
    ? `<span class="badge badge-analysed">Assessed</span>`
    : `<span class="badge badge-pending">Pending</span>`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatVolume(kg) {
  if (!kg || kg === 0) return "0 kg";
  if (kg >= 1000000) return `${(kg / 1000000).toFixed(1)}M kg`;
  if (kg >= 1000)    return `${(kg / 1000).toFixed(1)}k kg`;
  return `${kg.toLocaleString()} kg`;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function escHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
