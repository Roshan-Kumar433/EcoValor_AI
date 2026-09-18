/**
 * analysis.js — Advanced AI Valorization Decision Engine Interface
 * -----------------------------------------------------------------
 * EcoValor AI — Industrial Waste Valorization Platform (Stage 5)
 *
 * Implements 8 interactive tabs:
 *   1. Overview (Top recommendation, highlights, batch metadata)
 *   2. Pathway Comparison (Multi-factor composite scores across 5 pathways)
 *   3. Economics (Gross value, processing, transport, Net Economic Value)
 *   4. Market (Demand level, liquidity index, price stability)
 *   5. Environment (Circularity hierarchy, landfill diversion, logistics CO2e)
 *   6. What-If Simulator (Interactive parameter sliders & comparative delta)
 *   7. Why? (Explainable AI factor attribution & executive narrative)
 *   8. Waste → Opportunity (Circular business case & asset potential)
 */

import api from "./api.js";
import { showToast, navigateTo, escapeHtml } from "./app.js";

/* ── Pathway Definitions ────────────────────────────────────────── */

const PATHWAYS = [
  {
    key: "Reuse",
    name: "Reuse",
    icon: "refresh-cw",
    color: "#16a34a",
    bg: "#f0fdf4",
    desc: "Direct reuse of clean components or materials in industrial operations with minimal reconditioning.",
  },
  {
    key: "Recycling",
    name: "Recycling",
    icon: "recycle",
    color: "#2563eb",
    bg: "#eff6ff",
    desc: "Mechanical or chemical conversion into secondary raw materials for industrial production.",
  },
  {
    key: "Material Recovery",
    name: "Material Recovery",
    icon: "flask-conical",
    color: "#0d9488",
    bg: "#f0fdfa",
    desc: "Selective hydrometallurgical or thermal extraction of high-value constituent fractions (e.g. metals, catalysts).",
  },
  {
    key: "Energy Recovery",
    name: "Energy Recovery",
    icon: "zap",
    color: "#d97706",
    bg: "#fffbeb",
    desc: "Thermal co-processing or refuse-derived fuel (RDF) conversion for high-calorific streams.",
  },
  {
    key: "Disposal",
    name: "Disposal",
    icon: "trash-2",
    color: "#dc2626",
    bg: "#fef2f2",
    desc: "Compliant regulated containment or certified landfill as an environmentally safe last resort.",
  },
];

let allBatches = [];
let selectedEntry = null;
let activeAnalysisData = null;
let currentTab = "overview";

/* ── Main Render ─────────────────────────────────────────────────── */

export async function renderAnalysis(container, highlightId = null) {
  container.innerHTML = `
    <div class="page-header-row">
      <div>
        <h1>AI Valorization Decision Engine</h1>
        <p>Multi-factor circular intelligence combining Random Forest ML, economics, market demand, and ESG impact.</p>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <span class="badge" style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;font-size:12px;padding:6px 14px;display:flex;align-items:center;gap:6px;">
          <span style="width:8px;height:8px;border-radius:50%;background:#16a34a;display:inline-block;"></span>
          Decision Engine v5.0 · Active
        </span>
      </div>
    </div>

    <!-- Top Grid: Batch Selector & Readiness -->
    <div style="display:grid;grid-template-columns:1.2fr 1fr;gap:18px;margin-bottom:24px;">

      <!-- Batch Selector Card -->
      <div class="card" id="selector-card">
        <div class="card-header">
          <div>
            <div class="card-title">Select Waste Batch</div>
            <div class="card-subtitle">Choose a material stream for multi-engine valorization evaluation</div>
          </div>
        </div>
        
        <div class="form-group" style="margin-bottom:16px;">
          <label class="form-label" for="batch-selector">Registered Material Stream</label>
          <select class="form-control" id="batch-selector">
            <option value="">— Loading registered batches… —</option>
          </select>
        </div>

        <div id="batch-summary-body">
          <div style="text-align:center;padding:28px 0;color:var(--text-muted);">
            <i data-lucide="inbox" style="width:32px;height:32px;margin:0 auto 10px;opacity:0.4;"></i>
            <p style="font-size:13px;">Select a waste batch from the dropdown above</p>
          </div>
        </div>
      </div>

      <!-- Readiness & Execute Card -->
      <div class="card" id="readiness-card">
        <div class="card-header">
          <div>
            <div class="card-title">Decision Engine Verification</div>
            <div class="card-subtitle">Validation of 8 input features & multi-factor weights</div>
          </div>
        </div>
        <div id="readiness-body">
          <div style="text-align:center;padding:28px 0;color:var(--text-muted);">
            <i data-lucide="mouse-pointer-click" style="width:32px;height:32px;margin:0 auto 10px;opacity:0.4;"></i>
            <p style="font-size:13px;">Select a batch to inspect feature completeness</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Dynamic 8-Tab Decision Hub -->
    <div id="decision-hub-container" style="display:none;margin-bottom:24px;">
      <div class="card" style="padding:0;overflow:hidden;border:1.5px solid var(--primary);">
        
        <!-- Tab Navigation Bar -->
        <div style="display:flex;border-bottom:1px solid var(--border);background:var(--bg-card);overflow-x:auto;padding:0 8px;">
          <button class="nav-tab-btn active" data-tab="overview"><i data-lucide="layout-dashboard"></i> Overview</button>
          <button class="nav-tab-btn" data-tab="pathways"><i data-lucide="git-branch"></i> Pathway Comparison</button>
          <button class="nav-tab-btn" data-tab="economics"><i data-lucide="circle-dollar-sign"></i> Economics</button>
          <button class="nav-tab-btn" data-tab="market"><i data-lucide="trending-up"></i> Market</button>
          <button class="nav-tab-btn" data-tab="environment"><i data-lucide="leaf"></i> Environment</button>
          <button class="nav-tab-btn" data-tab="whatif"><i data-lucide="sliders"></i> What-If</button>
          <button class="nav-tab-btn" data-tab="why"><i data-lucide="help-circle"></i> Why?</button>
          <button class="nav-tab-btn" data-tab="opportunity" style="color:var(--primary);font-weight:700;"><i data-lucide="sparkles"></i> Waste → Opportunity</button>
        </div>

        <!-- Tab Content Container -->
        <div id="tab-content-area" style="padding:22px;"></div>
      </div>
    </div>

    <!-- Inventory / Batches Table -->
    <div class="card">
      <div class="card-header-row" style="margin-bottom:12px;">
        <div>
          <div class="card-title">All Registered Waste Batches</div>
          <div class="card-subtitle" id="analysis-count">Loading batches…</div>
        </div>
      </div>
      <div id="batches-table-container">
        ${skeletonRows(4)}
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Wire Tab Navigation clicks
  document.querySelectorAll(".nav-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentTab = btn.dataset.tab;
      renderActiveTabContent();
    });
  });

  // Load data
  try {
    const res = await api.get("/waste/list?per_page=100");
    allBatches = res.items || [];

    populateBatchSelector(allBatches, highlightId);
    renderBatchesTable(allBatches, highlightId);

    const pendingCount = allBatches.filter(e => e.status === "pending").length;
    const analysedCount = allBatches.filter(e => e.status === "analysed").length;
    document.getElementById("analysis-count").textContent =
      `${allBatches.length} total batches (${analysedCount} assessed · ${pendingCount} pending)`;

  } catch (err) {
    document.getElementById("batches-table-container").innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i data-lucide="alert-triangle"></i></div>
        <h3>Failed to load waste batches</h3>
        <p>${escapeHtml(err.message)}</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
  }
}

/* ── Batch Selector & Summary ────────────────────────────────────── */

function populateBatchSelector(items, highlightId) {
  const sel = document.getElementById("batch-selector");
  if (!sel) return;

  if (items.length === 0) {
    sel.innerHTML = `<option value="">— No batches registered yet —</option>`;
    return;
  }

  sel.innerHTML = `<option value="">— Select a batch to evaluate —</option>` +
    items.map(e => `
      <option value="${e.id}" ${Number(e.id) === Number(highlightId) ? "selected" : ""}>
        #${e.id} — ${escapeHtml(e.waste_type)} · ${Number(e.quantity).toLocaleString()} ${e.unit} [${e.status === "analysed" ? "Assessed" : "Pending"}]
      </option>`).join("");

  sel.addEventListener("change", () => {
    const id = Number(sel.value);
    const entry = items.find(e => e.id === id);
    selectBatch(entry);
  });

  if (highlightId) {
    const entry = items.find(e => e.id === Number(highlightId));
    if (entry) selectBatch(entry);
  }
}

function selectBatch(entry) {
  selectedEntry = entry;
  renderBatchSummary(entry);
  renderReadinessAndAction(entry);

  if (entry && entry.prediction_result) {
    activeAnalysisData = entry.prediction_result;
    document.getElementById("decision-hub-container").style.display = "block";
    renderActiveTabContent();
  } else {
    activeAnalysisData = null;
    const hub = document.getElementById("decision-hub-container");
    if (hub) hub.style.display = "none";
  }
}

function renderBatchSummary(entry) {
  const el = document.getElementById("batch-summary-body");
  if (!el) return;
  if (!entry) {
    el.innerHTML = `
      <div style="text-align:center;padding:28px 0;color:var(--text-muted);">
        <i data-lucide="inbox" style="width:32px;height:32px;margin:0 auto 10px;opacity:0.4;"></i>
        <p style="font-size:13px;">Select a waste batch from the dropdown above</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const hasCost = entry.processing_cost !== null && entry.processing_cost !== undefined;
  const hasDist = entry.transportation_distance !== null && entry.transportation_distance !== undefined;

  el.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;font-size:13px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;">
        <div>
          <span style="color:var(--text-muted);display:block;font-size:11.5px;margin-bottom:2px;">Waste Type</span>
          <span style="font-weight:700;color:var(--text-primary);">${escapeHtml(entry.waste_type)}</span>
        </div>
        <div>
          <span style="color:var(--text-muted);display:block;font-size:11.5px;margin-bottom:2px;">Quantity / Batch</span>
          <span style="font-weight:700;color:var(--text-primary);">${Number(entry.quantity).toLocaleString()} ${entry.unit}</span>
        </div>
        <div>
          <span style="color:var(--text-muted);display:block;font-size:11.5px;margin-bottom:2px;">Contamination</span>
          <span>${contaminationBadge(entry.contamination_level)}</span>
        </div>
        <div>
          <span style="color:var(--text-muted);display:block;font-size:11.5px;margin-bottom:2px;">Moisture Level</span>
          <span style="font-weight:600;">${entry.moisture_level !== null ? entry.moisture_level + "%" : "—"}</span>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px;padding:4px 0;">
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">Composition Details:</span>
          <span style="font-weight:600;text-align:right;">${escapeHtml(entry.material_composition || "—")}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">Processing Cost:</span>
          <span style="font-weight:600;">${hasCost ? "₹" + Number(entry.processing_cost).toLocaleString() + " / tonne" : '<span style="color:var(--text-muted);">Default (₹3,000/t)</span>'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">Transport Distance:</span>
          <span style="font-weight:600;">${hasDist ? entry.transportation_distance + " km" : '<span style="color:var(--text-muted);">Default (50 km)</span>'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">Facility Location:</span>
          <span style="font-weight:600;text-align:right;">${escapeHtml(entry.location)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span style="color:var(--text-muted);">Status:</span>
          <span>${statusBadge(entry.status)}</span>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

/* ── Readiness & Trigger Card ────────────────────────────────────── */

function renderReadinessAndAction(entry) {
  const el = document.getElementById("readiness-body");
  if (!el) return;
  if (!entry) {
    el.innerHTML = `
      <div style="text-align:center;padding:28px 0;color:var(--text-muted);">
        <i data-lucide="mouse-pointer-click" style="width:32px;height:32px;margin:0 auto 10px;opacity:0.4;"></i>
        <p style="font-size:13px;">Select a batch to inspect feature completeness</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  const requiredChecks = [
    { key: "waste_type", label: "Waste Type", ok: Boolean(entry.waste_type) },
    { key: "quantity", label: "Quantity (>0)", ok: Boolean(entry.quantity && Number(entry.quantity) > 0) },
    { key: "material_composition", label: "Material Composition", ok: Boolean(entry.material_composition) },
    { key: "contamination_level", label: "Contamination Level", ok: Boolean(entry.contamination_level) },
    { key: "moisture_level", label: "Moisture Level", ok: entry.moisture_level !== null && entry.moisture_level !== undefined },
    { key: "generation_frequency", label: "Frequency", ok: Boolean(entry.generation_frequency) },
    { key: "processing_cost", label: "Processing Cost", ok: true, optional: true },
    { key: "transportation_distance", label: "Transport Distance", ok: true, optional: true },
  ];

  const missingStrict = requiredChecks.filter(c => !c.optional && !c.ok).map(c => c.label);
  const isReady = missingStrict.length === 0;

  el.innerHTML = `
    <div style="margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:13px;">
        <span style="font-weight:600;">Engine Input Verification</span>
        <span class="badge ${isReady ? 'badge-success' : 'badge-danger'}">
          ${isReady ? "Ready for Evaluation" : "Data Incomplete"}
        </span>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;margin-bottom:14px;">
        ${requiredChecks.map(c => `
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:${c.ok ? 'var(--success)' : (c.optional ? 'var(--text-muted)' : 'var(--danger)')};">
              <i data-lucide="${c.ok ? 'check-circle' : 'alert-circle'}" style="width:13px;height:13px;"></i>
            </span>
            <span style="color:${c.ok ? 'var(--text-primary)' : 'var(--text-muted)'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${c.label} ${c.optional ? '<small style="opacity:0.7;">(opt)</small>' : ''}
            </span>
          </div>`).join("")}
      </div>

      ${!isReady ? `
        <div class="notice-banner danger" style="margin-bottom:14px;">
          <div class="notice-banner-icon"><i data-lucide="alert-triangle"></i></div>
          <div class="notice-banner-body">
            <h4>Insufficient data for AI analysis</h4>
            <p>Missing required model inputs: <strong>${missingStrict.join(", ")}</strong>.</p>
          </div>
        </div>
      ` : `
        <div class="notice-banner info" style="margin-bottom:14px;background:#f8fafc;border-color:#cbd5e1;">
          <div class="notice-banner-icon"><i data-lucide="cpu"></i></div>
          <div class="notice-banner-body">
            <h4>Decision Engine Synthesizer Ready</h4>
            <p>Will calculate ML, financial return, market liquidity, and ESG scores.</p>
          </div>
        </div>
      `}

      <button id="btn-run-decision" class="btn btn-primary" style="width:100%;justify-content:center;padding:11px 16px;"
        ${!isReady ? "disabled" : ""}>
        <i data-lucide="brain-circuit"></i>
        <span>${entry.status === "analysed" ? "Re-Run Decision Engine" : "Run AI Decision Engine"}</span>
      </button>
    </div>
  `;

  if (window.lucide) lucide.createIcons();

  document.getElementById("btn-run-decision")?.addEventListener("click", () => {
    executeDecisionAnalysis(entry.id);
  });
}

/* ── Execute Analysis via Backend ────────────────────────────────── */

async function executeDecisionAnalysis(entryId) {
  const btn = document.getElementById("btn-run-decision");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner" style="width:16px;height:16px;border:2px solid #fff;border-top-color:transparent;border-radius:50%;display:inline-block;animation:spin 0.8s linear infinite;"></span> Evaluating Stream with Multi-Factor Engine…`;
  }

  try {
    const res = await api.post(`/waste/${entryId}/analyze`, {});
    const decisionData = res.data;

    // Update in-memory record
    const idx = allBatches.findIndex(b => b.id === entryId);
    if (idx !== -1) {
      allBatches[idx].status = "analysed";
      allBatches[idx].valorization_pathway = decisionData.predicted_pathway;
      allBatches[idx].prediction_confidence = decisionData.confidence;
      allBatches[idx].prediction_result = decisionData;
      selectedEntry = allBatches[idx];
    }

    activeAnalysisData = decisionData;
    showToast(`Decision Engine Complete: Recommended pathway is ${decisionData.predicted_pathway}`, "success");

    renderBatchSummary(selectedEntry);
    renderReadinessAndAction(selectedEntry);
    renderBatchesTable(allBatches, entryId);

    document.getElementById("decision-hub-container").style.display = "block";
    renderActiveTabContent();

  } catch (err) {
    showToast(`Decision Engine Error: ${err.message}`, "error");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="brain-circuit"></i> <span>Retry Decision Engine</span>`;
      if (window.lucide) lucide.createIcons();
    }
  }
}

/* ── Dynamic Tab Content Router ──────────────────────────────────── */

function renderActiveTabContent() {
  const container = document.getElementById("tab-content-area");
  if (!container || !activeAnalysisData) return;

  const data = activeAnalysisData;
  const recPathway = data.predicted_pathway || data.recommended_pathway;
  const pathMeta = PATHWAYS.find(p => p.key === recPathway) || PATHWAYS[0];

  switch (currentTab) {
    case "overview":
      renderOverviewTab(container, data, pathMeta);
      break;
    case "pathways":
      renderPathwaysTab(container, data, pathMeta);
      break;
    case "economics":
      renderEconomicsTab(container, data, pathMeta);
      break;
    case "market":
      renderMarketTab(container, data, pathMeta);
      break;
    case "environment":
      renderEnvironmentTab(container, data, pathMeta);
      break;
    case "whatif":
      renderWhatIfTab(container, data, pathMeta);
      break;
    case "why":
      renderWhyTab(container, data, pathMeta);
      break;
    case "opportunity":
      renderOpportunityTab(container, data, pathMeta);
      break;
    default:
      renderOverviewTab(container, data, pathMeta);
  }

  if (window.lucide) lucide.createIcons();
}

/* ── TAB 1: Overview ─────────────────────────────────────────────── */

function renderOverviewTab(container, data, pathMeta) {
  const compScore = data.composite_score || Math.round((data.confidence || 0.85) * 100);
  const econ = data.economics?.pathway_economics?.[pathMeta.key] || {};
  const mkt = data.market?.pathway_demands?.[pathMeta.key] || {};
  const env = data.environment?.pathway_environmental?.[pathMeta.key] || {};

  container.innerHTML = `
    <!-- Top Recommendation Showcase -->
    <div style="background:${pathMeta.bg};border:1.5px solid ${pathMeta.color}55;border-radius:12px;padding:22px;margin-bottom:20px;display:flex;gap:20px;align-items:flex-start;">
      <div style="width:58px;height:58px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;color:${pathMeta.color};box-shadow:0 4px 12px rgba(0,0,0,0.06);flex-shrink:0;">
        <i data-lucide="${pathMeta.icon}" style="width:30px;height:30px;"></i>
      </div>
      <div style="flex:1;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${pathMeta.color};">Optimal Circular Destination</span>
          <span class="badge" style="background:${pathMeta.color};color:#fff;font-size:13px;padding:5px 12px;font-weight:700;">
            ${compScore} / 100 Composite Score
          </span>
        </div>
        <h2 style="margin:0 0 6px 0;font-size:24px;font-weight:800;color:var(--text-primary);">${pathMeta.name}</h2>
        <p style="margin:0 0 12px 0;font-size:14px;color:var(--text-secondary);line-height:1.5;">${pathMeta.desc}</p>
        <div style="font-size:13px;background:#ffffffcc;padding:10px 14px;border-radius:8px;border:1px solid ${pathMeta.color}22;color:var(--text-primary);">
          <strong>Executive Summary:</strong> ${escapeHtml(data.explanation?.executive_narrative || data.explanation || "Selected based on multi-factor optimization.")}
        </div>
      </div>
    </div>

    <!-- 4-Pillar Metric Grid -->
    <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:14px;margin-bottom:20px;">
      <div class="card" style="padding:14px;background:var(--bg-card);border:1px solid var(--border);">
        <span style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:5px;">
          <i data-lucide="cpu" style="width:14px;height:14px;"></i> ML Suitability
        </span>
        <div style="font-size:22px;font-weight:800;margin-top:4px;color:var(--primary);">${(data.pathway_probabilities?.[pathMeta.key] ? data.pathway_probabilities[pathMeta.key] * 100 : compScore).toFixed(1)}%</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Random Forest Model Output</div>
      </div>

      <div class="card" style="padding:14px;background:var(--bg-card);border:1px solid var(--border);">
        <span style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:5px;">
          <i data-lucide="circle-dollar-sign" style="width:14px;height:14px;"></i> Net Economic Value
        </span>
        <div style="font-size:22px;font-weight:800;margin-top:4px;color:${(econ.net_economic_value || 0) >= 0 ? 'var(--success)' : 'var(--danger)'};">
          ${(econ.net_economic_value || 0) >= 0 ? '+₹' : '-₹'}${Math.abs(Math.round(econ.net_economic_value || 0)).toLocaleString()}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Est. Gross - (Proc + Logistics)</div>
      </div>

      <div class="card" style="padding:14px;background:var(--bg-card);border:1px solid var(--border);">
        <span style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:5px;">
          <i data-lucide="trending-up" style="width:14px;height:14px;"></i> Market Demand
        </span>
        <div style="font-size:22px;font-weight:800;margin-top:4px;color:var(--text-primary);">${mkt.demand_level || "High"}</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Liquidity: ${mkt.offtaker_liquidity || "High"}</div>
      </div>

      <div class="card" style="padding:14px;background:var(--bg-card);border:1px solid var(--border);">
        <span style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:5px;">
          <i data-lucide="leaf" style="width:14px;height:14px;"></i> Landfill Diversion
        </span>
        <div style="font-size:22px;font-weight:800;margin-top:4px;color:#16a34a;">${env.landfill_diversion_pct || 90}%</div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${Number(env.diverted_mass_kg || data.quantity_kg * 0.9).toLocaleString()} kg Diverted</div>
      </div>
    </div>
  `;
}

/* ── TAB 2: Multi-Pathway Comparison ─────────────────────────────── */

function renderPathwaysTab(container, data, pathMeta) {
  const ranked = data.ranked_pathways || [];

  container.innerHTML = `
    <div style="margin-bottom:18px;">
      <h3 style="margin:0 0 4px 0;font-size:18px;">Multi-Factor Pathway Ranking</h3>
      <p style="margin:0;font-size:13px;color:var(--text-muted);">
        Every pathway evaluated across ML suitability (35%), economics (25%), market demand (15%), environmental circularity (20%), and logistics (5%).
      </p>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px;">
      ${ranked.map((item, idx) => {
        const pm = PATHWAYS.find(p => p.key === item.pathway) || { name: item.pathway, color: "var(--primary)", bg: "var(--primary-light)", icon: "circle" };
        const isTop = idx === 0;

        return `
          <div style="background:${isTop ? pm.bg : 'var(--bg-card)'};border:1.5px solid ${isTop ? pm.color : 'var(--border)'};border-radius:10px;padding:16px 20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:14px;font-weight:800;color:var(--text-muted);width:22px;">#${idx + 1}</span>
                <div style="width:28px;height:28px;border-radius:6px;background:${pm.bg};color:${pm.color};display:flex;align-items:center;justify-content:center;">
                  <i data-lucide="${pm.icon}" style="width:16px;height:16px;"></i>
                </div>
                <span style="font-size:16px;font-weight:700;color:var(--text-primary);">${pm.name}</span>
                ${isTop ? `<span class="badge" style="background:${pm.color};color:#fff;font-size:11px;">Recommended</span>` : ''}
              </div>
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:12px;color:var(--text-muted);">Composite Score:</span>
                <span style="font-size:20px;font-weight:800;color:${isTop ? pm.color : 'var(--text-primary)'};">${item.composite_score}</span>
              </div>
            </div>

            <!-- Sub-factor indicators -->
            <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px;font-size:12px;background:rgba(255,255,255,0.7);padding:8px 12px;border-radius:6px;border:1px solid var(--border);">
              <div><span style="color:var(--text-muted);">ML Prob:</span> <strong>${item.ml_probability_pct}%</strong></div>
              <div><span style="color:var(--text-muted);">Net Value:</span> <strong>${item.net_economic_value >= 0 ? '+₹' : '-₹'}${Math.abs(Math.round(item.net_economic_value)).toLocaleString()}</strong></div>
              <div><span style="color:var(--text-muted);">Market:</span> <strong>${item.market_demand_level}</strong></div>
              <div><span style="color:var(--text-muted);">Diversion:</span> <strong>${item.landfill_diversion_pct}%</strong></div>
            </div>

            <!-- Progress Bar -->
            <div style="height:8px;background:var(--border);border-radius:4px;overflow:hidden;margin-top:10px;">
              <div style="height:100%;width:${item.composite_score}%;background:${pm.color};border-radius:4px;"></div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/* ── TAB 3: Economics ────────────────────────────────────────────── */

function renderEconomicsTab(container, data, pathMeta) {
  const econ = data.economics?.pathway_economics || {};

  container.innerHTML = `
    <div style="margin-bottom:18px;">
      <h3 style="margin:0 0 4px 0;font-size:18px;">Economic Feasibility Analysis</h3>
      <p style="margin:0;font-size:13px;color:var(--text-muted);">
        Transparent financial model: <code>Net Value = Gross Recoverable Value - (Processing Cost + Freight Cost)</code>
      </p>
    </div>

    <div class="table-wrapper" style="margin-bottom:18px;">
      <table class="data-table">
        <thead>
          <tr>
            <th>Pathway</th>
            <th>Gross Value</th>
            <th>Processing Cost</th>
            <th>Logistics Cost</th>
            <th>Net Economic Value</th>
            <th>Net / Tonne</th>
            <th>Feasibility Score</th>
          </tr>
        </thead>
        <tbody>
          ${PATHWAYS.map(p => {
            const row = econ[p.key] || {};
            const isRec = p.key === pathMeta.key;
            const netVal = row.net_economic_value || 0;

            return `
              <tr style="${isRec ? 'background:var(--primary-light);font-weight:600;' : ''}">
                <td style="display:flex;align-items:center;gap:6px;">
                  <i data-lucide="${p.icon}" style="width:14px;height:14px;color:${p.color};"></i>
                  ${p.name}
                  ${isRec ? '<span class="badge badge-success" style="font-size:10px;padding:2px 6px;">Top</span>' : ''}
                </td>
                <td>₹${Math.round(row.gross_revenue || 0).toLocaleString()}</td>
                <td>₹${Math.round(row.processing_cost || 0).toLocaleString()}</td>
                <td>₹${Math.round(row.transport_cost || 0).toLocaleString()}</td>
                <td style="color:${netVal >= 0 ? 'var(--success)' : 'var(--danger)'};font-weight:700;">
                  ${netVal >= 0 ? '+₹' : '-₹'}${Math.abs(Math.round(netVal)).toLocaleString()}
                </td>
                <td>₹${Math.round(row.net_value_per_tonne || 0).toLocaleString()}</td>
                <td><strong>${row.economic_score || 50} / 100</strong></td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>

    <div class="notice-banner info" style="margin-bottom:0;">
      <div class="notice-banner-icon"><i data-lucide="info"></i></div>
      <div class="notice-banner-body">
        <h4>Prototype Valuation Methodology</h4>
        <p>Values represent prototype circular benchmark prices (INR/t) calibrated for 2026 industrial secondary raw materials. Not guaranteed commodity quotes.</p>
      </div>
    </div>
  `;
}

/* ── TAB 4: Market ───────────────────────────────────────────────── */

function renderMarketTab(container, data, pathMeta) {
  const mkt = data.market?.pathway_demands || {};

  container.innerHTML = `
    <div style="margin-bottom:18px;">
      <h3 style="margin:0 0 4px 0;font-size:18px;">Market Demand & Offtaker Liquidity Matrix</h3>
      <p style="margin:0;font-size:13px;color:var(--text-muted);">
        Structured secondary raw material offtaker indices for ${escapeHtml(data.waste_type)}.
      </p>
    </div>

    <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:12px;margin-bottom:18px;">
      ${PATHWAYS.map(p => {
        const item = mkt[p.key] || { demand_level: "Medium", offtaker_liquidity: "Medium", price_stability: "Moderate", demand_index: 0.5 };
        const isRec = p.key === pathMeta.key;

        return `
          <div class="card" style="padding:14px;border:1.5px solid ${isRec ? p.color : 'var(--border)'};background:${isRec ? p.bg : 'var(--bg-card)'};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
              <i data-lucide="${p.icon}" style="width:16px;height:16px;color:${p.color};"></i>
              <span style="font-weight:700;font-size:13px;">${p.name}</span>
            </div>
            <div style="font-size:18px;font-weight:800;color:var(--text-primary);margin-bottom:4px;">${item.demand_level}</div>
            <div style="font-size:11.5px;color:var(--text-muted);display:flex;flex-direction:column;gap:3px;">
              <div>Liquidity: <strong>${item.offtaker_liquidity}</strong></div>
              <div>Stability: <strong>${item.price_stability}</strong></div>
              <div>Index: <strong>${(item.demand_index * 100).toFixed(0)}%</strong></div>
            </div>
          </div>
        `;
      }).join("")}
    </div>

    <div class="notice-banner info">
      <div class="notice-banner-icon"><i data-lucide="database"></i></div>
      <div class="notice-banner-body">
        <h4>Structured Reference Source</h4>
        <p>Market demand parameters are derived from the EcoValor Prototype Circular Demand Matrix (v1.0) and do not represent active exchange tickers.</p>
      </div>
    </div>
  `;
}

/* ── TAB 5: Environment ──────────────────────────────────────────── */

function renderEnvironmentTab(container, data, pathMeta) {
  const env = data.environment?.pathway_environmental || {};

  container.innerHTML = `
    <div style="margin-bottom:18px;">
      <h3 style="margin:0 0 4px 0;font-size:18px;">Environmental & ESG Circularity Scoring</h3>
      <p style="margin:0;font-size:13px;color:var(--text-muted);">
        Aligned with European Waste Framework Directive hierarchy levels & landfill diversion metrics.
      </p>
    </div>

    <div class="table-wrapper" style="margin-bottom:18px;">
      <table class="data-table">
        <thead>
          <tr>
            <th>Pathway</th>
            <th>Hierarchy Level</th>
            <th>Landfill Diversion %</th>
            <th>Mass Diverted</th>
            <th>Est. Freight CO2e</th>
            <th>ESG Circularity Score</th>
          </tr>
        </thead>
        <tbody>
          ${PATHWAYS.map(p => {
            const row = env[p.key] || {};
            const isRec = p.key === pathMeta.key;

            return `
              <tr style="${isRec ? 'background:var(--primary-light);font-weight:600;' : ''}">
                <td style="display:flex;align-items:center;gap:6px;">
                  <i data-lucide="${p.icon}" style="width:14px;height:14px;color:${p.color};"></i>
                  ${p.name}
                </td>
                <td><span class="badge" style="background:${p.bg};color:${p.color};">${p.name}</span></td>
                <td><strong>${row.landfill_diversion_pct || 0}%</strong></td>
                <td>${Number(row.diverted_mass_kg || 0).toLocaleString()} kg</td>
                <td>${row.estimated_transport_co2e_kg || 0} kg CO2e</td>
                <td><strong style="color:${p.color};font-size:14px;">${row.environmental_score || 50} / 100</strong></td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* ── TAB 6: What-If Simulator ────────────────────────────────────── */

function renderWhatIfTab(container, data, pathMeta) {
  container.innerHTML = `
    <div style="margin-bottom:18px;">
      <h3 style="margin:0 0 4px 0;font-size:18px;">What-If Scenario Simulator</h3>
      <p style="margin:0;font-size:13px;color:var(--text-muted);">
        Simulate operational adjustments (sorting, moisture reduction, freight consolidation) and recalculate live decision outcomes.
      </p>
    </div>

    <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:20px;">
      
      <!-- Interactive Parameter Controls -->
      <div class="card" style="padding:16px;background:var(--bg-card);border:1px solid var(--border);">
        <h4 style="margin:0 0 14px 0;font-size:14px;">Scenario Levers</h4>
        
        <div style="display:flex;flex-direction:column;gap:14px;font-size:13px;">
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span>Batch Quantity: <strong id="val-qty">${data.quantity_kg}</strong> kg</span>
            </div>
            <input type="range" id="sim-qty" min="100" max="50000" step="100" value="${data.quantity_kg}" style="width:100%;">
          </div>

          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span>Contamination: <strong id="val-contam">${data.contamination_pct}%</strong></span>
            </div>
            <input type="range" id="sim-contam" min="0" max="95" step="1" value="${data.contamination_pct}" style="width:100%;">
          </div>

          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span>Moisture Level: <strong id="val-moist">${data.moisture_pct}%</strong></span>
            </div>
            <input type="range" id="sim-moist" min="0" max="90" step="1" value="${data.moisture_pct}" style="width:100%;">
          </div>

          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span>Processing Cost: ₹<strong id="val-cost">${data.processing_cost_per_tonne}</strong> / t</span>
            </div>
            <input type="range" id="sim-cost" min="500" max="15000" step="250" value="${data.processing_cost_per_tonne || 3000}" style="width:100%;">
          </div>

          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span>Transport Distance: <strong id="val-dist">${data.transport_distance_km}</strong> km</span>
            </div>
            <input type="range" id="sim-dist" min="5" max="450" step="5" value="${data.transport_distance_km}" style="width:100%;">
          </div>

          <button id="btn-recalculate-sim" class="btn btn-primary" style="margin-top:6px;width:100%;justify-content:center;">
            <i data-lucide="refresh-cw"></i> Recalculate What-If Outcome
          </button>
        </div>
      </div>

      <!-- Comparative Output Display -->
      <div class="card" id="sim-output-card" style="padding:16px;background:var(--bg-card);border:1px solid var(--border);">
        <h4 style="margin:0 0 14px 0;font-size:14px;">Current vs What-If Outcome</h4>
        <div id="sim-output-body">
          <div style="text-align:center;padding:32px 0;color:var(--text-muted);">
            <i data-lucide="sliders" style="width:32px;height:32px;margin:0 auto 10px;opacity:0.4;"></i>
            <p style="font-size:13px;">Adjust sliders and click Recalculate</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach live slider updates
  ["qty", "contam", "moist", "cost", "dist"].forEach(k => {
    const input = document.getElementById(`sim-${k}`);
    const label = document.getElementById(`val-${k}`);
    if (input && label) {
      input.addEventListener("input", () => {
        label.textContent = k === "contam" || k === "moist" ? `${input.value}%` : input.value;
      });
    }
  });

  document.getElementById("btn-recalculate-sim")?.addEventListener("click", runSimulation);
}

async function runSimulation() {
  const btn = document.getElementById("btn-recalculate-sim");
  if (btn) btn.disabled = true;

  const modified = {
    quantity_kg: Number(document.getElementById("sim-qty").value),
    contamination_pct: Number(document.getElementById("sim-contam").value),
    moisture_pct: Number(document.getElementById("sim-moist").value),
    processing_cost_per_tonne: Number(document.getElementById("sim-cost").value),
    transport_distance_km: Number(document.getElementById("sim-dist").value),
  };

  try {
    const res = await api.post(`/waste/${selectedEntry.id}/simulate`, { modified_params: modified });
    const sim = res.data;

    const outBody = document.getElementById("sim-output-body");
    if (outBody) {
      const isShift = sim.deltas.pathway_changed;
      const nevDelta = sim.deltas.net_economic_value_delta;
      const scoreDelta = sim.deltas.composite_score_delta;

      outBody.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;">
            <div>
              <span style="color:var(--text-muted);font-size:11.5px;display:block;">Current Scenario</span>
              <strong style="font-size:15px;color:var(--text-primary);">${sim.current_scenario.recommended_pathway}</strong>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Score: ${sim.current_scenario.composite_score} · ₹${Math.round(sim.current_scenario.net_economic_value).toLocaleString()}</div>
            </div>
            <div>
              <span style="color:var(--text-muted);font-size:11.5px;display:block;">What-If Scenario</span>
              <strong style="font-size:15px;color:var(--primary);">${sim.what_if_scenario.recommended_pathway}</strong>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Score: ${sim.what_if_scenario.composite_score} · ₹${Math.round(sim.what_if_scenario.net_economic_value).toLocaleString()}</div>
            </div>
          </div>

          <div class="notice-banner ${isShift ? 'success' : 'info'}" style="margin-bottom:0;">
            <div class="notice-banner-icon"><i data-lucide="${isShift ? 'sparkles' : 'check'}"></i></div>
            <div class="notice-banner-body">
              <h4>${isShift ? "Pathway Upgrade Achieved!" : "Scenario Recalculated"}</h4>
              <p>${escapeHtml(sim.deltas.summary)}</p>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:1px solid var(--border);">
            <span style="color:var(--text-muted);">Net Value Delta:</span>
            <strong style="color:${nevDelta >= 0 ? 'var(--success)' : 'var(--danger)'};">${nevDelta >= 0 ? '+₹' : '-₹'}${Math.abs(Math.round(nevDelta)).toLocaleString()}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;padding-bottom:4px;">
            <span style="color:var(--text-muted);">Composite Score Delta:</span>
            <strong style="color:${scoreDelta >= 0 ? 'var(--success)' : 'var(--danger)'};">${scoreDelta >= 0 ? '+' : ''}${scoreDelta} pts</strong>
          </div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  } catch (err) {
    showToast(`Simulation failed: ${err.message}`, "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ── TAB 7: Why? (Explainability) ────────────────────────────────── */

function renderWhyTab(container, data, pathMeta) {
  const exp = data.explanation || {};
  const drivers = exp.key_decision_drivers || [];
  const constraints = exp.operational_constraints || [];

  container.innerHTML = `
    <div style="margin-bottom:18px;">
      <h3 style="margin:0 0 4px 0;font-size:18px;">Explainable AI Decision Audit</h3>
      <p style="margin:0;font-size:13px;color:var(--text-muted);">
        Comprehensive factor-by-factor attribution for the recommendation: <strong>${pathMeta.name}</strong>
      </p>
    </div>

    <!-- Executive Narrative -->
    <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;margin-bottom:18px;">
      <h4 style="margin:0 0 8px 0;font-size:14px;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
        <i data-lucide="file-text" style="width:16px;height:16px;"></i> Decision Engine Synthesis
      </h4>
      <p style="margin:0;font-size:13.5px;color:var(--text-secondary);line-height:1.6;">
        ${escapeHtml(exp.executive_narrative || "Multi-variable analysis completed.")}
      </p>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      
      <!-- Positive Drivers -->
      <div class="card" style="padding:16px;background:var(--bg-card);border:1px solid var(--border);">
        <h4 style="margin:0 0 12px 0;font-size:14px;color:#16a34a;display:flex;align-items:center;gap:6px;">
          <i data-lucide="check-circle" style="width:16px;height:16px;"></i> Positive Supporting Drivers
        </h4>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--text-secondary);line-height:1.6;">
          ${drivers.map(d => `<li style="margin-bottom:6px;">${escapeHtml(d)}</li>`).join("")}
        </ul>
      </div>

      <!-- Operational Constraints -->
      <div class="card" style="padding:16px;background:var(--bg-card);border:1px solid var(--border);">
        <h4 style="margin:0 0 12px 0;font-size:14px;color:#d97706;display:flex;align-items:center;gap:6px;">
          <i data-lucide="alert-circle" style="width:16px;height:16px;"></i> Operational Constraints
        </h4>
        <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--text-secondary);line-height:1.6;">
          ${constraints.length > 0 ? constraints.map(c => `<li style="margin-bottom:6px;">${escapeHtml(c)}</li>`).join("") : '<li>No critical operational bottlenecks identified for this stream.</li>'}
        </ul>
      </div>
    </div>
  `;
}

/* ── TAB 8: Waste → Opportunity ──────────────────────────────────── */

function renderOpportunityTab(container, data, pathMeta) {
  const opp = data.opportunity || {};

  container.innerHTML = `
    <div style="margin-bottom:18px;">
      <h3 style="margin:0 0 4px 0;font-size:18px;color:var(--primary);display:flex;align-items:center;gap:8px;">
        <i data-lucide="sparkles" style="width:20px;height:20px;"></i>
        Waste → Circular Opportunity Blueprint
      </h3>
      <p style="margin:0;font-size:13px;color:var(--text-muted);">
        Transforming compliance liabilities into quantifiable secondary material assets.
      </p>
    </div>

    <!-- Opportunity Showcase Grid -->
    <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:16px;margin-bottom:20px;">
      <div class="card" style="padding:18px;background:#f0fdf4;border:1.5px solid #86efac;">
        <span style="font-size:12px;font-weight:700;color:#16a34a;text-transform:uppercase;">Recoverable Mass</span>
        <div style="font-size:26px;font-weight:800;color:var(--text-primary);margin-top:6px;">
          ${Number(opp.recoverable_material_kg || 0).toLocaleString()} kg
        </div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">Secondary raw material content</div>
      </div>

      <div class="card" style="padding:18px;background:#eff6ff;border:1.5px solid #93c5fd;">
        <span style="font-size:12px;font-weight:700;color:#2563eb;text-transform:uppercase;">Net Economic Potential</span>
        <div style="font-size:26px;font-weight:800;color:var(--text-primary);margin-top:6px;">
          ${(opp.estimated_net_economic_value || 0) >= 0 ? '+₹' : '-₹'}${Math.abs(Math.round(opp.estimated_net_economic_value || 0)).toLocaleString()}
        </div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">Gross revenue after full processing</div>
      </div>

      <div class="card" style="padding:18px;background:#fefce8;border:1.5px solid #fde047;">
        <span style="font-size:12px;font-weight:700;color:#ca8a04;text-transform:uppercase;">Landfill Diversion</span>
        <div style="font-size:26px;font-weight:800;color:var(--text-primary);margin-top:6px;">
          ${opp.landfill_diversion_pct || 0}%
        </div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">${Number(opp.landfill_diverted_kg || 0).toLocaleString()} kg mass diverted</div>
      </div>
    </div>

    <!-- Optimization Lever Recommendation -->
    <div style="background:var(--bg-card);border:1px solid var(--border);border-left:4px solid var(--primary);border-radius:8px;padding:16px;margin-bottom:14px;">
      <h4 style="margin:0 0 6px 0;font-size:14px;color:var(--text-primary);display:flex;align-items:center;gap:6px;">
        <i data-lucide="trending-up" style="width:16px;height:16px;color:var(--primary);"></i> Key Value Maximization Lever
      </h4>
      <p style="margin:0;font-size:13.5px;color:var(--text-secondary);line-height:1.5;">
        ${escapeHtml(opp.optimization_lever || "Maintain current stream segregation to preserve secondary market value.")}
      </p>
    </div>
  `;
}

/* ── Batches Table ───────────────────────────────────────────────── */

function renderBatchesTable(items, highlightId) {
  const el = document.getElementById("batches-table-container");
  if (!el) return;

  if (items.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i data-lucide="inbox"></i></div>
        <h3>No waste batches registered yet</h3>
        <p>Register your first industrial waste batch to run AI valorization predictions.</p>
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
            <th>Contamination</th>
            <th>Moisture</th>
            <th>Status</th>
            <th>Decision Pathway</th>
            <th>Score</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(e => {
            const isAssessed = e.status === "analysed" && e.valorization_pathway;
            const isSelected = Number(e.id) === Number(highlightId);
            const scoreDisplay = e.prediction_confidence ? Math.round(e.prediction_confidence * 100) : "—";

            return `
              <tr id="entry-row-${e.id}" style="${isSelected ? 'background:var(--primary-light);' : ''}">
                <td class="td-mono">#${e.id}</td>
                <td class="td-primary">${escapeHtml(e.waste_type)}</td>
                <td>${Number(e.quantity).toLocaleString()} ${e.unit}</td>
                <td>${contaminationBadge(e.contamination_level)}</td>
                <td>${e.moisture_level !== null ? e.moisture_level + "%" : "—"}</td>
                <td>${statusBadge(e.status)}</td>
                <td>
                  ${isAssessed ? `
                    <span class="badge" style="background:var(--primary-light);color:var(--primary);font-weight:700;">
                      ${escapeHtml(e.valorization_pathway)}
                    </span>
                  ` : `
                    <span style="color:var(--text-muted);font-size:12px;">Awaiting Engine Run</span>
                  `}
                </td>
                <td>
                  <strong style="color:var(--text-primary);">${scoreDisplay}</strong>
                </td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="selectAndEvaluate(${e.id})"
                    style="padding:4px 10px;font-size:12px;gap:4px;">
                    <i data-lucide="${isAssessed ? 'eye' : 'brain-circuit'}"></i>
                    ${isAssessed ? "View Decision" : "Evaluate"}
                  </button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>`;

  if (window.lucide) lucide.createIcons();
}

window.selectAndEvaluate = function(id) {
  const sel = document.getElementById("batch-selector");
  if (sel) sel.value = id;
  const entry = allBatches.find(b => b.id === Number(id));
  if (entry) {
    selectBatch(entry);
    document.getElementById("selector-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (entry.status !== "analysed") {
      executeDecisionAnalysis(id);
    }
  }
};

/* ── Badge Helpers ───────────────────────────────────────────────── */

function statusBadge(status) {
  return status === "analysed"
    ? `<span class="badge badge-analysed">Assessed</span>`
    : `<span class="badge badge-pending">Pending</span>`;
}

function contaminationBadge(level) {
  const labels = { low: "Low", medium: "Medium", high: "High" };
  return `<span class="badge badge-${level || "low"}">${labels[level] || level}</span>`;
}

function skeletonRows(n) {
  return `<div style="display:flex;flex-direction:column;gap:8px;padding:8px 0;">
    ${Array(n).fill(`<div class="skeleton" style="height:40px;border-radius:6px;"></div>`).join("")}
  </div>`;
}
