/**
 * organization.js — Organization & Facility Management Page
 * ---------------------------------------------------------
 * EcoValor AI — Industrial Waste Valorization Platform
 * Manages industrial entity profiles, facility codes, EPA permits,
 * and circularity & emission targets.
 */

import api from "./api.js";

export async function renderOrganization(container, navigateTo, showToast) {
  container.innerHTML = `
    <div class="page-loading-skeleton">
      <div class="skeleton-header"></div>
      <div class="skeleton-grid-4"></div>
      <div class="skeleton-card"></div>
    </div>
  `;

  try {
    const res = await api.get("/org/current");
    const data = res.data || {};
    const org = data.organization || {};
    const metrics = data.metrics || {};

    container.innerHTML = `
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Organization & Facility Hub</h1>
          <p class="page-subtitle">Configure industrial parameters, regulatory permits, and circularity targets</p>
        </div>
        <div class="page-header-actions">
          <button id="btn-save-org-profile" class="btn btn-primary">
            <i data-lucide="save"></i>
            <span>Save Organization Profile</span>
          </button>
        </div>
      </div>

      <!-- Facility Quick Switcher Banner -->
      <div class="facility-switcher-banner">
        <div class="facility-icon-wrap">
          <i data-lucide="building" style="width:24px;height:24px;color:var(--color-primary);"></i>
        </div>
        <div class="facility-info-meta">
          <div class="facility-active-badge">Active Facility</div>
          <div class="facility-title-text" id="facility-display-name">${org.name || "Apex Advanced Petrochemicals Corp"}</div>
          <div class="facility-sub-meta">
            <span>Code: <strong>${org.facility_code || "FAC-MI-0914"}</strong></span>
            <span class="dot-sep">&bull;</span>
            <span>Permit: <strong>${org.environmental_permit_no || "EPA-IND-2026-8941A"}</strong></span>
            <span class="dot-sep">&bull;</span>
            <span>Location: <strong>${org.city || "Detroit"}, ${org.state_province || "MI"}</strong></span>
          </div>
        </div>
        <div class="facility-selector-dropdown-wrap">
          <label class="form-label" style="margin-bottom:4px;font-size:0.75rem;">Switch Active Plant</label>
          <select id="select-facility-switch" class="form-select form-select-sm" style="min-width:210px;">
            <option value="primary" selected>${org.name || "Apex Advanced Petrochem"} (Main Plant)</option>
            <option value="plant2">Apex Polymers Division (Plant #2 - Ohio)</option>
            <option value="plant3">Apex Refining & Solvents (Plant #3 - Texas)</option>
          </select>
        </div>
      </div>

      <!-- Sustainability & Compliance Metrics -->
      <div class="org-kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon kpi-green"><i data-lucide="scale"></i></div>
          <div class="kpi-body">
            <span class="kpi-label">Total Waste Recorded</span>
            <span class="kpi-value">${metrics.total_recorded_tons ?? 0} <span class="kpi-unit">Tons</span></span>
            <span class="kpi-sub">${metrics.total_registered_batches ?? 0} total registered batches</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon kpi-teal"><i data-lucide="target"></i></div>
          <div class="kpi-body">
            <span class="kpi-label">Annual Budget Utilized</span>
            <span class="kpi-value">${metrics.budget_utilization_pct ?? 0}<span class="kpi-unit">%</span></span>
            <span class="kpi-sub">Target Cap: ${metrics.annual_budget_tons ?? 14500} Tons / yr</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon kpi-amber"><i data-lucide="shield-check"></i></div>
          <div class="kpi-body">
            <span class="kpi-label">Regulatory Status</span>
            <span class="kpi-value" style="font-size:1.15rem;color:var(--color-primary);">${metrics.permit_status || "Active & Verified"}</span>
            <span class="kpi-sub">Cycle: ${metrics.audit_cycle || "Q3-2026"}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon kpi-blue"><i data-lucide="award"></i></div>
          <div class="kpi-body">
            <span class="kpi-label">Diversion Goal</span>
            <span class="kpi-value">${org.landfill_diversion_target_pct ?? 85}<span class="kpi-unit">%</span></span>
            <span class="kpi-sub">Net-Zero Target: ${org.net_zero_target_year || 2030}</span>
          </div>
        </div>
      </div>

      <!-- Main Form Sections -->
      <div class="org-form-grid">
        <!-- Organization Identity -->
        <div class="card">
          <div class="card-header">
            <div class="card-header-icon"><i data-lucide="factory"></i></div>
            <div>
              <h2 class="card-title">Industrial Profile & Classification</h2>
              <p class="card-subtitle">General entity credentials and manufacturing category</p>
            </div>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label" for="org-name">Legal Entity / Company Name *</label>
              <input type="text" id="org-name" class="form-input" value="${org.name || ""}" required>
            </div>

            <div class="form-row-2col">
              <div class="form-group">
                <label class="form-label" for="org-sector">Primary Industrial Sector *</label>
                <select id="org-sector" class="form-select">
                  <option value="Chemical & Petrochemical" ${org.sector === "Chemical & Petrochemical" ? "selected" : ""}>Chemical & Petrochemical</option>
                  <option value="Automotive & Heavy Manufacturing" ${org.sector === "Automotive & Heavy Manufacturing" ? "selected" : ""}>Automotive & Heavy Manufacturing</option>
                  <option value="Metallurgy & Smelting" ${org.sector === "Metallurgy & Smelting" ? "selected" : ""}>Metallurgy & Smelting</option>
                  <option value="Textiles & Synthetic Fibers" ${org.sector === "Textiles & Synthetic Fibers" ? "selected" : ""}>Textiles & Synthetic Fibers</option>
                  <option value="Pharmaceuticals & Bio-chemicals" ${org.sector === "Pharmaceuticals & Bio-chemicals" ? "selected" : ""}>Pharmaceuticals & Bio-chemicals</option>
                  <option value="Food & Agro-Processing" ${org.sector === "Food & Agro-Processing" ? "selected" : ""}>Food & Agro-Processing</option>
                  <option value="Electronics & Semiconductors" ${org.sector === "Electronics & Semiconductors" ? "selected" : ""}>Electronics & Semiconductors</option>
                  <option value="Pulp, Paper & Packaging" ${org.sector === "Pulp, Paper & Packaging" ? "selected" : ""}>Pulp, Paper & Packaging</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="org-facility-code">Internal Facility Code</label>
                <input type="text" id="org-facility-code" class="form-input" value="${org.facility_code || ""}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="org-permit">Environmental & Pollution Board Permit No. *</label>
              <div class="input-icon-wrap">
                <i data-lucide="shield" class="input-icon"></i>
                <input type="text" id="org-permit" class="form-input with-icon" value="${org.environmental_permit_no || ""}" required>
              </div>
              <span class="field-hint">Used on all certified waste manifests and regulatory export reports.</span>
            </div>

            <div class="form-row-2col">
              <div class="form-group">
                <label class="form-label" for="org-contact-email">Compliance Contact Email</label>
                <input type="email" id="org-contact-email" class="form-input" value="${org.primary_contact_email || ""}">
              </div>
              <div class="form-group">
                <label class="form-label" for="org-contact-phone">Compliance Emergency Phone</label>
                <input type="text" id="org-contact-phone" class="form-input" value="${org.primary_contact_phone || ""}">
              </div>
            </div>
          </div>
        </div>

        <!-- Location & Target Settings -->
        <div class="card">
          <div class="card-header">
            <div class="card-header-icon"><i data-lucide="map-pin"></i></div>
            <div>
              <h2 class="card-title">Plant Location & ESG Targets</h2>
              <p class="card-subtitle">Physical site address and net-zero sustainability trajectory</p>
            </div>
          </div>
          <div class="card-body">
            <div class="form-group">
              <label class="form-label" for="org-address">Physical Plant Address</label>
              <input type="text" id="org-address" class="form-input" value="${org.address || ""}">
            </div>

            <div class="form-row-3col">
              <div class="form-group">
                <label class="form-label" for="org-city">City</label>
                <input type="text" id="org-city" class="form-input" value="${org.city || ""}">
              </div>
              <div class="form-group">
                <label class="form-label" for="org-state">State / Province</label>
                <input type="text" id="org-state" class="form-input" value="${org.state_province || ""}">
              </div>
              <div class="form-group">
                <label class="form-label" for="org-postal">Postal Code</label>
                <input type="text" id="org-postal" class="form-input" value="${org.postal_code || ""}">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="org-country">Country</label>
              <input type="text" id="org-country" class="form-input" value="${org.country || "United States"}">
            </div>

            <div class="divider-line" style="margin:20px 0;"></div>

            <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:12px;color:var(--color-text-primary);">
              Circularity & Decarbonization Targets
            </h3>

            <div class="form-row-3col">
              <div class="form-group">
                <label class="form-label" for="org-budget">Annual Waste Budget</label>
                <div class="input-unit-wrap">
                  <input type="number" id="org-budget" class="form-input" value="${org.annual_waste_budget_tons || 14500}" min="0" step="100">
                  <span class="input-unit">Tons</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="org-diversion">Landfill Diversion Target</label>
                <div class="input-unit-wrap">
                  <input type="number" id="org-diversion" class="form-input" value="${org.landfill_diversion_target_pct || 85}" min="0" max="100" step="0.5">
                  <span class="input-unit">%</span>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="org-netzero">Net-Zero Target Year</label>
                <input type="number" id="org-netzero" class="form-input" value="${org.net_zero_target_year || 2030}" min="2026" max="2060">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Plant switch handler
    document.getElementById("select-facility-switch")?.addEventListener("change", (e) => {
      showToast(`Switched view to ${e.target.options[e.target.selectedIndex].text}`, "info");
    });

    // Save handler
    document.getElementById("btn-save-org-profile")?.addEventListener("click", async () => {
      const btn = document.getElementById("btn-save-org-profile");
      btn.disabled = true;
      btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> <span>Saving...</span>`;

      const payload = {
        name: document.getElementById("org-name").value.trim(),
        sector: document.getElementById("org-sector").value,
        facility_code: document.getElementById("org-facility-code").value.trim(),
        environmental_permit_no: document.getElementById("org-permit").value.trim(),
        address: document.getElementById("org-address").value.trim(),
        city: document.getElementById("org-city").value.trim(),
        state_province: document.getElementById("org-state").value.trim(),
        country: document.getElementById("org-country").value.trim(),
        postal_code: document.getElementById("org-postal").value.trim(),
        primary_contact_email: document.getElementById("org-contact-email").value.trim(),
        primary_contact_phone: document.getElementById("org-contact-phone").value.trim(),
        annual_waste_budget_tons: document.getElementById("org-budget").value,
        landfill_diversion_target_pct: document.getElementById("org-diversion").value,
        net_zero_target_year: document.getElementById("org-netzero").value,
      };

      try {
        await api.put("/org/update", payload);
        showToast("Organization profile successfully updated!", "success");
        // Update topbar badge
        const badge = document.getElementById("topbar-org-badge");
        if (badge) {
          badge.innerHTML = `<i data-lucide="building-2" style="width:14px;height:14px;"></i><span>${payload.name}</span>`;
        }
        renderOrganization(container, navigateTo, showToast);
      } catch (err) {
        showToast(err.message || "Failed to update organization profile.", "error");
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<i data-lucide="save"></i> <span>Save Organization Profile</span>`;
        if (window.lucide) window.lucide.createIcons();
      }
    });

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state-card">
        <i data-lucide="alert-triangle" style="width:48px;height:48px;color:var(--color-danger);"></i>
        <h3>Failed to load organization data</h3>
        <p>${err.message}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}
