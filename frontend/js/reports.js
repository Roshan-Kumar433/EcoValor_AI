/**
 * reports.js — Environmental & Waste Valorization Reports Hub
 * ------------------------------------------------------------
 * EcoValor AI — Industrial Waste Valorization Platform
 * Generates and exports certified ESG audits, regulatory manifests,
 * and circular economy material summaries from real database records.
 */

import api from "./api.js";
import { auth } from "./auth.js";

export async function renderReports(container, navigateTo, showToast) {
  container.innerHTML = `
    <div class="page-loading-skeleton">
      <div class="skeleton-header"></div>
      <div class="skeleton-card"></div>
    </div>
  `;

  try {
    const res = await api.get("/reports/list");
    const reports = res.items || [];

    container.innerHTML = `
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Reports & Compliance Hub</h1>
          <p class="page-subtitle">Generate, review, and export certified ESG waste valorization audits and regulatory manifests</p>
        </div>
        <div class="page-header-actions">
          <button id="btn-open-gen-report" class="btn btn-primary">
            <i data-lucide="file-plus"></i>
            <span>Generate New Audit Report</span>
          </button>
        </div>
      </div>

      <!-- Compliance Standards Ribbon -->
      <div class="compliance-ribbon">
        <div class="ribbon-title">
          <i data-lucide="shield-check" style="color:var(--color-primary);"></i>
          <strong>Certified Reporting Standards Supported:</strong>
        </div>
        <div class="ribbon-badges">
          <span class="ribbon-tag">ISO 14001:2015</span>
          <span class="ribbon-tag">GRI 306 (Waste 2020)</span>
          <span class="ribbon-tag">EPA RCRA Manifest</span>
          <span class="ribbon-tag">GHG Protocol Scope 3 Cat. 5</span>
          <span class="ribbon-tag">EU CSRD Standard E5</span>
        </div>
      </div>

      <!-- Filter and Action Bar -->
      <div class="table-card">
        <div class="table-toolbar">
          <div class="search-input-wrap">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" id="report-search" class="form-input search-input" placeholder="Search reports by title or type...">
          </div>
          <div class="filter-group">
            <select id="report-type-filter" class="form-select form-select-sm">
              <option value="all">All Report Types</option>
              <option value="valorization_summary">Valorization & Circularity</option>
              <option value="regulatory_manifest">EPA Compliance Manifest</option>
              <option value="esg_audit">ESG Environmental Audit</option>
            </select>
          </div>
        </div>

        <div class="table-responsive">
          <table class="data-table" id="reports-table">
            <thead>
              <tr>
                <th>Report Title & ID</th>
                <th>Standard / Type</th>
                <th>Coverage Period</th>
                <th>Batches Analyzed</th>
                <th>Total Mass</th>
                <th>Diversion Rate</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="reports-tbody">
              ${reports.map(r => renderReportRow(r)).join("")}
            </tbody>
          </table>
        </div>

        ${reports.length === 0 ? `
          <div class="empty-state-card" style="padding:40px;">
            <i data-lucide="file-text" style="width:48px;height:48px;color:var(--color-text-muted);"></i>
            <h3>No reports generated yet</h3>
            <p>Generate your first certified waste audit report to evaluate facility performance.</p>
          </div>
        ` : ""}
      </div>

      <!-- Generate Report Modal Container -->
      <div id="gen-report-modal" class="modal-backdrop" style="display:none;">
        <div class="modal-card">
          <div class="modal-header">
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="modal-icon-badge"><i data-lucide="file-plus"></i></div>
              <div>
                <h3 class="modal-title">Generate Waste & ESG Report</h3>
                <p class="modal-subtitle">Aggregates real registered batches into a certified compliance manifest</p>
              </div>
            </div>
            <button class="btn-close-modal" id="btn-close-gen-modal">&times;</button>
          </div>
          <form id="form-generate-report">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label" for="gen-title">Report Title *</label>
                <input type="text" id="gen-title" class="form-input" placeholder="e.g. Q3-2026 Facility Environmental Audit" required>
              </div>

              <div class="form-group">
                <label class="form-label" for="gen-type">Report Framework / Template *</label>
                <select id="gen-type" class="form-select" required>
                  <option value="valorization_summary">Waste Valorization & Material Recovery Summary</option>
                  <option value="regulatory_manifest">EPA Regulatory Waste Manifest & Chain of Custody</option>
                  <option value="esg_audit">Corporate ESG Circularity Audit (ISO 14001 / GRI 306)</option>
                  <option value="landfill_diversion">Facility Landfill Diversion & Zero-Waste Scorecard</option>
                </select>
              </div>

              <div class="form-row-2col">
                <div class="form-group">
                  <label class="form-label" for="gen-date-from">Period Start Date</label>
                  <input type="date" id="gen-date-from" class="form-input" value="2026-01-01">
                </div>
                <div class="form-group">
                  <label class="form-label" for="gen-date-to">Period End Date</label>
                  <input type="date" id="gen-date-to" class="form-input" value="2026-09-18">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="btn-cancel-gen">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btn-submit-gen">
                <i data-lucide="sparkles"></i>
                <span>Compile & Generate</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Report Detail / Print Preview Modal -->
      <div id="view-report-modal" class="modal-backdrop" style="display:none;">
        <div class="modal-card modal-card-lg" id="print-area">
          <div class="modal-header no-print">
            <h3 class="modal-title">Report Document Preview</h3>
            <div style="display:flex;gap:8px;">
              <button type="button" class="btn btn-secondary btn-sm" id="btn-print-report">
                <i data-lucide="printer"></i> Print / PDF
              </button>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-export-csv">
                <i data-lucide="download"></i> Export CSV
              </button>
              <button class="btn-close-modal" id="btn-close-view-modal">&times;</button>
            </div>
          </div>
          <div class="modal-body" id="report-view-content" style="padding:24px;">
            <!-- Filled dynamically -->
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Wire up events
    setupReportEvents(container, reports, navigateTo, showToast);

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state-card">
        <i data-lucide="alert-triangle" style="width:48px;height:48px;color:var(--color-danger);"></i>
        <h3>Failed to load reports</h3>
        <p>${err.message}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}

function renderReportRow(r) {
  const typeMap = {
    valorization_summary: "Valorization & Circularity",
    regulatory_manifest: "EPA Regulatory Manifest",
    esg_audit: "ESG Environmental Audit",
    landfill_diversion: "Landfill Diversion Audit",
  };

  const formattedDate = r.created_at
    ? new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  return `
    <tr data-id="${r.id}" data-type="${r.report_type}">
      <td>
        <div style="font-weight:600;color:var(--color-text-primary);">${escapeHtml(r.title)}</div>
        <div style="font-size:0.75rem;color:var(--color-text-muted);">REP-${String(r.id).padStart(4, "0")} &bull; Generated ${formattedDate}</div>
      </td>
      <td>
        <span class="report-type-badge">${typeMap[r.report_type] || r.report_type}</span>
      </td>
      <td>
        <span style="font-size:0.8125rem;color:var(--color-text-secondary);">${r.date_from || "2026-01-01"} &rarr; ${r.date_to || "Present"}</span>
      </td>
      <td><strong>${r.total_entries_analyzed ?? 0}</strong> batches</td>
      <td><strong>${r.total_volume_tons ?? 0}</strong> Tons</td>
      <td>
        <div style="display:flex;align-items:center;gap:6px;">
          <div class="progress-bar-wrap" style="width:50px;height:6px;background:var(--color-bg-secondary);border-radius:3px;overflow:hidden;">
            <div style="width:${Math.min(r.diversion_rate_pct ?? 0, 100)}%;height:100%;background:var(--color-primary);"></div>
          </div>
          <span style="font-size:0.8125rem;font-weight:600;color:var(--color-primary);">${r.diversion_rate_pct ?? 0}%</span>
        </div>
      </td>
      <td>
        <span class="badge badge-success"><i data-lucide="check-circle" style="width:12px;height:12px;"></i> Certified Ready</span>
      </td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-secondary btn-sm btn-view-report" data-id="${r.id}" title="View & Print Report">
            <i data-lucide="eye" style="width:14px;height:14px;"></i> View
          </button>
        </div>
      </td>
    </tr>
  `;
}

function setupReportEvents(container, reports, navigateTo, showToast) {
  const genModal = document.getElementById("gen-report-modal");
  const viewModal = document.getElementById("view-report-modal");
  const viewContent = document.getElementById("report-view-content");

  // Open modal
  document.getElementById("btn-open-gen-report")?.addEventListener("click", () => {
    document.getElementById("gen-title").value = `Waste Valorization Audit — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
    genModal.style.display = "flex";
  });

  document.getElementById("btn-close-gen-modal")?.addEventListener("click", () => {
    genModal.style.display = "none";
  });
  document.getElementById("btn-cancel-gen")?.addEventListener("click", () => {
    genModal.style.display = "none";
  });

  document.getElementById("btn-close-view-modal")?.addEventListener("click", () => {
    viewModal.style.display = "none";
  });

  // Search and filter
  const searchInput = document.getElementById("report-search");
  const typeFilter = document.getElementById("report-type-filter");
  const tbody = document.getElementById("reports-tbody");

  function filterTable() {
    const q = searchInput.value.toLowerCase().trim();
    const type = typeFilter.value;
    const rows = tbody.querySelectorAll("tr");

    rows.forEach(r => {
      const title = r.innerText.toLowerCase();
      const rType = r.getAttribute("data-type");
      const matchQ = !q || title.includes(q);
      const matchType = type === "all" || rType === type;
      r.style.display = (matchQ && matchType) ? "" : "none";
    });
  }

  searchInput?.addEventListener("input", filterTable);
  typeFilter?.addEventListener("change", filterTable);

  // Form submit for new report
  document.getElementById("form-generate-report")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById("btn-submit-gen");
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> <span>Compiling Data...</span>`;

    const user = auth.getUser();
    const payload = {
      title: document.getElementById("gen-title").value.trim(),
      report_type: document.getElementById("gen-type").value,
      date_from: document.getElementById("gen-date-from").value,
      date_to: document.getElementById("gen-date-to").value,
      user_name: user ? user.name : "Sustainability Officer",
    };

    try {
      const res = await api.post("/reports/generate", payload);
      showToast("Certified audit report successfully compiled!", "success");
      genModal.style.display = "none";
      renderReports(container, navigateTo, showToast);
      if (res.data) {
        showReportDetail(res.data, viewModal, viewContent);
      }
    } catch (err) {
      showToast(err.message || "Failed to generate report.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i data-lucide="sparkles"></i> <span>Compile & Generate</span>`;
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // View Report Click
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest(".btn-view-report");
    if (!btn) return;
    const reportId = btn.getAttribute("data-id");
    const targetReport = reports.find(r => String(r.id) === String(reportId));
    if (targetReport) {
      showReportDetail(targetReport, viewModal, viewContent);
    }
  });

  // Print Report
  document.getElementById("btn-print-report")?.addEventListener("click", () => {
    window.print();
  });

  // Export CSV
  document.getElementById("btn-export-csv")?.addEventListener("click", () => {
    exportReportsToCSV(reports);
    showToast("Report CSV downloaded.", "success");
  });
}

function showReportDetail(r, modal, contentEl) {
  const summary = r.summary_data || {};
  const materials = summary.material_breakdown || [];
  const contamination = summary.contamination_summary || {};

  contentEl.innerHTML = `
    <div class="report-document-sheet">
      <div class="report-doc-header">
        <div class="report-doc-brand">
          <div class="auth-logo-badge" style="width:36px;height:36px;font-size:18px;">
            <i data-lucide="leaf"></i>
          </div>
          <div>
            <div style="font-size:1.15rem;font-weight:800;color:var(--color-primary-dark);">EcoValor AI &bull; Environmental Compliance</div>
            <div style="font-size:0.8125rem;color:var(--color-text-muted);">Industrial Waste Valorization & Circular Audit Certificate</div>
          </div>
        </div>
        <div class="report-doc-stamp">
          <div class="stamp-pill">CERTIFIED AUDIT</div>
          <div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:2px;">REP-${String(r.id).padStart(4, "0")}</div>
        </div>
      </div>

      <div class="report-doc-title-block">
        <h2>${escapeHtml(r.title)}</h2>
        <div class="report-doc-meta-row">
          <div><strong>Facility:</strong> ${summary.facility_name || "Apex Advanced Petrochemicals Corp"} (${summary.facility_code || "FAC-MI-0914"})</div>
          <div><strong>Period:</strong> ${r.date_from || "2026-01-01"} to ${r.date_to || "2026-09-18"}</div>
          <div><strong>Auditor:</strong> ${r.generated_by || "System"}</div>
          <div><strong>Standard:</strong> ${summary.esg_alignment || "ISO 14001 / GRI 306"}</div>
        </div>
      </div>

      <!-- Executive KPI Cards in Report -->
      <div class="report-doc-kpis">
        <div class="doc-kpi-item">
          <span class="doc-kpi-lbl">Total Batches Audited</span>
          <span class="doc-kpi-val">${r.total_entries_analyzed ?? 0}</span>
        </div>
        <div class="doc-kpi-item">
          <span class="doc-kpi-lbl">Total Waste Volume</span>
          <span class="doc-kpi-val">${r.total_volume_tons ?? 0} Tons</span>
        </div>
        <div class="doc-kpi-item">
          <span class="doc-kpi-lbl">Circularity Diversion</span>
          <span class="doc-kpi-val" style="color:var(--color-primary);">${r.diversion_rate_pct ?? 0}%</span>
        </div>
        <div class="doc-kpi-item">
          <span class="doc-kpi-lbl">Est. Market Valuation</span>
          <span class="doc-kpi-val" style="color:var(--color-primary);">₹${summary.total_market_valuation_inr ? Number(summary.total_market_valuation_inr).toLocaleString('en-IN') : '0'}</span>
        </div>
      </div>

      <!-- Material Stream Table -->
      <h4 style="font-size:0.95rem;font-weight:700;margin:20px 0 8px 0;color:var(--color-text-primary);">
        Material Stream Characterization Breakdown
      </h4>
      <table class="report-doc-table">
        <thead>
          <tr>
            <th>Waste Stream Classification</th>
            <th>Batch Count</th>
            <th>Total Volume (kg)</th>
            <th>% of Total Stream</th>
          </tr>
        </thead>
        <tbody>
          ${materials.length > 0 ? materials.map(m => `
            <tr>
              <td><strong>${escapeHtml(m.waste_type)}</strong></td>
              <td>${m.batch_count}</td>
              <td>${m.total_kg?.toLocaleString()} kg</td>
              <td><strong>${m.pct_of_total}%</strong></td>
            </tr>
          `).join("") : `
            <tr><td colspan="4" style="text-align:center;color:var(--color-text-muted);">No material batch data recorded in this period.</td></tr>
          `}
        </tbody>
      </table>

      <!-- Contamination & Market Demand Summary -->
      <div class="report-doc-risk-section">
        <h4 style="font-size:0.9rem;font-weight:700;margin-bottom:8px;">Feedstock Purity &amp; Market Demand Profile</h4>
        <div style="display:flex;gap:20px;font-size:0.875rem;flex-wrap:wrap;margin-bottom:6px;">
          <div><span class="badge badge-success">Low Contamination:</span> <strong>${contamination.low || 0} batches</strong></div>
          <div><span class="badge badge-warning">Medium Contamination:</span> <strong>${contamination.medium || 0} batches</strong></div>
          <div><span class="badge badge-danger">High Contamination:</span> <strong>${contamination.high || 0} batches</strong></div>
        </div>
        ${summary.demand_summary ? `
          <div style="display:flex;gap:20px;font-size:0.875rem;flex-wrap:wrap;padding-top:6px;border-top:1px dashed var(--border);">
            <div><span class="badge badge-demand-high">High Market Demand:</span> <strong>${summary.demand_summary.high || 0} streams</strong></div>
            <div><span class="badge badge-demand-medium">Medium Demand:</span> <strong>${summary.demand_summary.medium || 0} streams</strong></div>
            <div><span class="badge badge-demand-low">Low / Niche Demand:</span> <strong>${summary.demand_summary.low || 0} streams</strong></div>
          </div>
        ` : ''}
      </div>

      <div class="report-doc-signatures">
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-lbl">Lead Environmental Auditor</div>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-lbl">Facility Operations Director</div>
        </div>
      </div>
    </div>
  `;

  modal.style.display = "flex";
  if (window.lucide) window.lucide.createIcons();
}

function exportReportsToCSV(reports) {
  const headers = ["ID", "Title", "Type", "Date From", "Date To", "Batches Analyzed", "Total Mass Tons", "Diversion Rate %", "Generated By", "Created At"];
  const rows = reports.map(r => [
    r.id,
    `"${(r.title || "").replace(/"/g, '""')}"`,
    r.report_type,
    r.date_from || "",
    r.date_to || "",
    r.total_entries_analyzed || 0,
    r.total_volume_tons || 0,
    r.diversion_rate_pct || 0,
    `"${(r.generated_by || "").replace(/"/g, '""')}"`,
    r.created_at || ""
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `ecovalor_reports_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
