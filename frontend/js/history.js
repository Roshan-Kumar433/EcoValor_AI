/**
 * history.js — Waste History Page
 * ----------------------------------
 * EcoValor AI — Industrial Waste Valorization Platform
 * Enterprise data table with search, filters, sorting, and pagination.
 */

import api from "./api.js";
import { navigateTo } from "./app.js";

export async function renderHistory(container) {
  container.innerHTML = `
    <div class="page-header-row">
      <div>
        <h1>Waste History</h1>
        <p>All registered industrial waste batches, newest first.</p>
      </div>
      <button class="btn btn-primary" onclick="navigateTo('register')">
        <i data-lucide="plus"></i>
        <span class="btn-label">Register Waste</span>
      </button>
    </div>

    <div class="card">
      <!-- Controls -->
      <div class="card-header" style="flex-wrap:wrap;gap:12px;">
        <div>
          <div class="card-title">Waste Registry</div>
          <div class="card-subtitle" id="history-count">Loading…</div>
        </div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <!-- Search -->
          <div class="search-bar">
            <span class="search-icon"><i data-lucide="search"></i></span>
            <input type="text" id="history-search" placeholder="Search by type or location…"
              aria-label="Search waste entries">
          </div>

          <!-- Waste Type Filter -->
          <select class="filter-select" id="filter-type" aria-label="Filter by waste type">
            <option value="">All Types</option>
            <option value="Chemical Waste">Chemical</option>
            <option value="Electronic Waste (E-Waste)">E-Waste</option>
            <option value="Metal Scrap">Metal Scrap</option>
            <option value="Plastic Waste">Plastic</option>
            <option value="Paper / Cardboard">Paper</option>
            <option value="Organic / Food Waste">Organic</option>
            <option value="Textile Waste">Textile</option>
            <option value="Construction Debris">Construction</option>
            <option value="Hazardous Waste">Hazardous</option>
            <option value="Glass Waste">Glass</option>
            <option value="Rubber Waste">Rubber</option>
            <option value="Mixed Industrial Waste">Mixed</option>
          </select>

          <!-- Status Filter -->
          <select class="filter-select" id="filter-status" aria-label="Filter by status">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="analysed">Assessed</option>
          </select>

          <!-- Market Demand Filter -->
          <select class="filter-select" id="filter-demand" aria-label="Filter by market demand">
            <option value="">All Demands</option>
            <option value="high">High Demand</option>
            <option value="medium">Medium Demand</option>
            <option value="low">Low Demand</option>
          </select>

          <!-- Refresh -->
          <button class="btn btn-outline btn-sm" id="btn-refresh" title="Refresh" aria-label="Refresh list">
            <i data-lucide="refresh-cw"></i>
          </button>
        </div>
      </div>

      <!-- Table Body -->
      <div id="history-body">
        ${skeletonRows(8)}
      </div>

      <!-- Pagination -->
      <div id="history-pagination" class="pagination" style="display:none;"></div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  let page         = 1;
  let searchQuery  = "";
  let typeFilter   = "";
  let statusFilter = "";
  let demandFilter = "";
  let allItems     = [];

  async function load(p = 1) {
    page = p;
    const bodyEl = document.getElementById("history-body");
    if (p === 1) bodyEl.innerHTML = skeletonRows(8);

    try {
      const res = await api.get(`/waste/list?page=${p}&per_page=20`);
      allItems = res.items || [];
      renderTable(allItems);
      renderPagination(res.total, res.page, res.pages);
      document.getElementById("history-count").textContent =
        `${res.total} total entr${res.total === 1 ? "y" : "ies"}`;
    } catch (err) {
      document.getElementById("history-body").innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i data-lucide="alert-triangle"></i></div>
          <h3>Failed to load entries</h3>
          <p>${err.message}</p>
        </div>`;
      if (window.lucide) lucide.createIcons();
    }
  }

  function renderTable(items) {
    // Apply client-side filters
    const filtered = items.filter(e => {
      const matchSearch = !searchQuery ||
        e.waste_type.toLowerCase().includes(searchQuery) ||
        e.location.toLowerCase().includes(searchQuery);
      const matchType   = !typeFilter   || e.waste_type === typeFilter;
      const matchStatus = !statusFilter || e.status === statusFilter;
      const matchDemand = !demandFilter || (e.market_demand && e.market_demand.toLowerCase() === demandFilter);
      return matchSearch && matchType && matchStatus && matchDemand;
    });

    const tbody = document.getElementById("history-body");

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i data-lucide="inbox"></i></div>
          <h3>${searchQuery || typeFilter || statusFilter || demandFilter ? "No matching entries" : "No waste batches yet"}</h3>
          <p>${searchQuery || typeFilter || statusFilter || demandFilter
              ? "Try adjusting your search or filters."
              : "Register your first industrial waste batch to begin valorization analysis."}</p>
          ${!searchQuery && !typeFilter && !statusFilter && !demandFilter
            ? `<button class="btn btn-primary" style="margin-top:16px;" onclick="navigateTo('register')">
                 <i data-lucide="plus"></i> Register Waste
               </button>` : ""}
        </div>`;
      if (window.lucide) lucide.createIcons();
      return;
    }

    tbody.innerHTML = `
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>Waste Type</th>
              <th>Quantity</th>
              <th>Contamination</th>
              <th>Market Demand</th>
              <th>Market Price</th>
              <th>Location</th>
              <th>Registered</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(e => `
              <tr>
                <td class="td-mono">#${e.id}</td>
                <td class="td-primary">${escHtml(e.waste_type)}</td>
                <td>${e.quantity.toLocaleString()} ${e.unit}</td>
                <td>${contaminationBadge(e.contamination_level)}</td>
                <td>${demandBadge(e.market_demand)}</td>
                <td style="font-weight:600;color:var(--text-primary);">${e.market_price ? "₹" + Number(e.market_price).toLocaleString() + "/" + e.unit : '<span style="color:var(--text-muted);">—</span>'}</td>
                <td style="max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                    title="${escHtml(e.location)}">${escHtml(e.location)}</td>
                <td style="white-space:nowrap;">${formatDate(e.created_at)}</td>
                <td>${statusBadge(e.status)}</td>
                <td>
                  <div style="display:flex;gap:6px;">
                    <button class="btn btn-outline btn-sm"
                      onclick="navigateTo('analysis', ${e.id})"
                      title="Analyze this batch"
                      aria-label="Analyze batch #${e.id}">
                      <i data-lucide="brain-circuit"></i>
                      Analyze
                    </button>
                  </div>
                </td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
    if (window.lucide) lucide.createIcons();
  }

  function renderPagination(total, currentPage, totalPages) {
    const el = document.getElementById("history-pagination");
    if (totalPages <= 1) { el.style.display = "none"; return; }

    el.style.display = "flex";
    el.innerHTML = `
      <span>${(currentPage - 1) * 20 + 1}–${Math.min(currentPage * 20, total)} of ${total} entries</span>
      <div class="pagination-controls">
        <button class="btn btn-outline btn-sm" id="pg-prev"
          ${currentPage <= 1 ? "disabled" : ""}
          aria-label="Previous page">
          <i data-lucide="chevron-left"></i>
          Prev
        </button>
        <span style="padding:6px 10px;font-size:12.5px;color:var(--text-secondary);">
          ${currentPage} / ${totalPages}
        </span>
        <button class="btn btn-outline btn-sm" id="pg-next"
          ${currentPage >= totalPages ? "disabled" : ""}
          aria-label="Next page">
          Next
          <i data-lucide="chevron-right"></i>
        </button>
      </div>`;
    if (window.lucide) lucide.createIcons();

    document.getElementById("pg-prev")?.addEventListener("click", () => load(currentPage - 1));
    document.getElementById("pg-next")?.addEventListener("click", () => load(currentPage + 1));
  }

  // Search
  document.getElementById("history-search")?.addEventListener("input", e => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderTable(allItems);
  });

  // Type filter
  document.getElementById("filter-type")?.addEventListener("change", e => {
    typeFilter = e.target.value;
    renderTable(allItems);
  });

  // Status filter
  document.getElementById("filter-status")?.addEventListener("change", e => {
    statusFilter = e.target.value;
    renderTable(allItems);
  });

  // Demand filter
  document.getElementById("filter-demand")?.addEventListener("change", e => {
    demandFilter = e.target.value;
    renderTable(allItems);
  });

  // Refresh
  document.getElementById("btn-refresh")?.addEventListener("click", () => {
    searchQuery  = "";
    typeFilter   = "";
    statusFilter = "";
    demandFilter = "";
    document.getElementById("history-search").value = "";
    document.getElementById("filter-type").value    = "";
    document.getElementById("filter-status").value  = "";
    document.getElementById("filter-demand").value  = "";
    load(1);
  });

  await load(1);
}

/* ── Helpers ─────────────────────────────────────────────────── */

function statusBadge(status) {
  return status === "analysed"
    ? `<span class="badge badge-analysed">Assessed</span>`
    : `<span class="badge badge-pending">Pending</span>`;
}

function contaminationBadge(level) {
  const labels = { low: "Low", medium: "Medium", high: "High" };
  return `<span class="badge badge-${level || "low"}">${labels[level] || level}</span>`;
}

function demandBadge(demand) {
  if (!demand) return `<span class="badge badge-neutral">Unspecified</span>`;
  const d = demand.toLowerCase();
  const label = d === "high" ? "High" : d === "medium" ? "Medium" : "Low";
  return `<span class="badge badge-demand-${d}">${label}</span>`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function skeletonRows(n) {
  return `<div style="display:flex;flex-direction:column;gap:8px;padding:8px 0;">
    ${Array(n).fill(`<div class="skeleton" style="height:36px;border-radius:6px;"></div>`).join("")}
  </div>`;
}

function escHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
