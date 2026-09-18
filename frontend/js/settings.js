/**
 * settings.js — User Profile & System Settings Page
 * -------------------------------------------------
 * EcoValor AI — Industrial Waste Valorization Platform
 * Manages user profile, preferences, password changes, and developer API keys.
 */

import api from "./api.js";
import { auth, updateTopbarUserUI } from "./auth.js";

export async function renderSettings(container, navigateTo, showToast) {
  let user = auth.getUser();
  try {
    const res = await api.get("/auth/me");
    if (res.success && res.data) {
      user = res.data;
      auth.setUser(user);
    }
  } catch {
    // Keep local user
  }

  if (!user) {
    user = {
      name: "Dr. Elena Vance",
      email: "sustainability@apexchem.com",
      role: "Sustainability Lead",
      job_title: "Chief Sustainability Engineer",
      phone: "+1 (313) 555-0142",
      department: "Circular Economy & Compliance",
      unit_preference: "metric",
      currency_preference: "USD",
      email_notifications: true,
      anomaly_alerts: true,
      weekly_digest: true,
      two_factor_enabled: false,
      api_key: "ecov_8f93a1c4b72e0d5568194cf2"
    };
  }

  container.innerHTML = `
    <div class="page-header-row">
      <div>
        <h1 class="page-title">User Profile & Account Settings</h1>
        <p class="page-subtitle">Manage personal credentials, platform preferences, and API security keys</p>
      </div>
    </div>

    <div class="settings-layout-grid">
      <!-- Left Tab / Summary Column -->
      <div class="settings-sidebar-col">
        <div class="card user-profile-badge-card">
          <div class="user-avatar-large">
            ${user.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div class="user-profile-meta">
            <h3 class="user-profile-name">${user.name}</h3>
            <span class="user-role-pill">${user.role || "Sustainability Officer"}</span>
            <span class="user-email-text">${user.email}</span>
          </div>
          <div class="user-org-badge">
            <i data-lucide="building-2" style="width:14px;height:14px;"></i>
            <span>${user.organization_name || "Apex Advanced Petrochem"}</span>
          </div>
        </div>

        <div class="card settings-nav-card">
          <button class="settings-nav-item active" data-tab="profile">
            <i data-lucide="user"></i>
            <span>Profile Information</span>
          </button>
          <button class="settings-nav-item" data-tab="preferences">
            <i data-lucide="sliders"></i>
            <span>System Preferences</span>
          </button>
          <button class="settings-nav-item" data-tab="security">
            <i data-lucide="lock"></i>
            <span>Security & 2FA</span>
          </button>
          <button class="settings-nav-item" data-tab="developer">
            <i data-lucide="code"></i>
            <span>API Keys & Webhooks</span>
          </button>
        </div>
      </div>

      <!-- Right Tab Content Column -->
      <div class="settings-content-col">
        <!-- Tab 1: Profile Information -->
        <div id="tab-profile" class="settings-tab-pane active">
          <div class="card">
            <div class="card-header">
              <div class="card-header-icon"><i data-lucide="user-check"></i></div>
              <div>
                <h2 class="card-title">Personal Information</h2>
                <p class="card-subtitle">Update your contact details and professional titles</p>
              </div>
            </div>
            <div class="card-body">
              <form id="form-update-profile">
                <div class="form-row-2col">
                  <div class="form-group">
                    <label class="form-label" for="set-name">Full Name *</label>
                    <input type="text" id="set-name" class="form-input" value="${user.name || ""}" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="set-email">Account Email (Corporate ID)</label>
                    <input type="email" id="set-email" class="form-input" value="${user.email || ""}" disabled style="opacity:0.75;">
                  </div>
                </div>

                <div class="form-row-2col">
                  <div class="form-group">
                    <label class="form-label" for="set-job">Job Title</label>
                    <input type="text" id="set-job" class="form-input" value="${user.job_title || ""}">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="set-dept">Department / Division</label>
                    <input type="text" id="set-dept" class="form-input" value="${user.department || ""}">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="set-phone">Work Phone Number</label>
                  <input type="text" id="set-phone" class="form-input" value="${user.phone || ""}">
                </div>

                <div style="display:flex;justify-content:flex-end;margin-top:16px;">
                  <button type="submit" id="btn-save-profile" class="btn btn-primary">
                    <i data-lucide="check"></i>
                    <span>Update Profile</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Tab 2: System Preferences -->
        <div id="tab-preferences" class="settings-tab-pane">
          <div class="card">
            <div class="card-header">
              <div class="card-header-icon"><i data-lucide="sliders"></i></div>
              <div>
                <h2 class="card-title">Measurement & Interface Preferences</h2>
                <p class="card-subtitle">Configure measurement units, currency, and notification thresholds</p>
              </div>
            </div>
            <div class="card-body">
              <div class="form-row-2col">
                <div class="form-group">
                  <label class="form-label" for="pref-units">Standard Mass / Weight Units</label>
                  <select id="pref-units" class="form-select">
                    <option value="metric" ${user.unit_preference === "metric" ? "selected" : ""}>Metric (Kilograms, Metric Tonnes, m³)</option>
                    <option value="imperial" ${user.unit_preference === "imperial" ? "selected" : ""}>Imperial (Pounds, Short Tons, Gallons)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="pref-curr">Default Valuation Currency</label>
                  <select id="pref-curr" class="form-select">
                    <option value="USD" ${user.currency_preference === "USD" ? "selected" : ""}>USD ($ - United States Dollar)</option>
                    <option value="EUR" ${user.currency_preference === "EUR" ? "selected" : ""}>EUR (€ - Euro)</option>
                    <option value="GBP" ${user.currency_preference === "GBP" ? "selected" : ""}>GBP (£ - British Pound)</option>
                    <option value="INR" ${user.currency_preference === "INR" ? "selected" : ""}>INR (₹ - Indian Rupee)</option>
                  </select>
                </div>
              </div>

              <div class="divider-line" style="margin:20px 0;"></div>

              <h3 style="font-size:0.95rem;font-weight:700;margin-bottom:12px;color:var(--color-text-primary);">
                Alert Subscriptions
              </h3>

              <div class="toggle-setting-row">
                <div>
                  <strong>Real-Time Contamination & Hazard Alerts</strong>
                  <p>Receive notifications when registered waste exceeds contamination thresholds</p>
                </div>
                <label class="switch">
                  <input type="checkbox" id="pref-alert-hazard" ${user.anomaly_alerts ? "checked" : ""}>
                  <span class="slider round"></span>
                </label>
              </div>

              <div class="toggle-setting-row">
                <div>
                  <strong>Weekly ESG & Circularity Digest</strong>
                  <p>Aggregated weekly report of plant diversion rates and carbon footprint metrics</p>
                </div>
                <label class="switch">
                  <input type="checkbox" id="pref-alert-digest" ${user.weekly_digest ? "checked" : ""}>
                  <span class="slider round"></span>
                </label>
              </div>

              <div style="display:flex;justify-content:flex-end;margin-top:20px;">
                <button id="btn-save-prefs" class="btn btn-primary">
                  <i data-lucide="check"></i>
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Security & 2FA -->
        <div id="tab-security" class="settings-tab-pane">
          <div class="card">
            <div class="card-header">
              <div class="card-header-icon"><i data-lucide="lock"></i></div>
              <div>
                <h2 class="card-title">Password & Authentication Security</h2>
                <p class="card-subtitle">Ensure your industrial compliance account remains secure</p>
              </div>
            </div>
            <div class="card-body">
              <form id="form-change-password">
                <div class="form-group">
                  <label class="form-label" for="sec-current-pass">Current Password *</label>
                  <input type="password" id="sec-current-pass" class="form-input" required autocomplete="current-password">
                </div>

                <div class="form-row-2col">
                  <div class="form-group">
                    <label class="form-label" for="sec-new-pass">New Password (min 6 chars) *</label>
                    <input type="password" id="sec-new-pass" class="form-input" minlength="6" required autocomplete="new-password">
                  </div>
                  <div class="form-group">
                    <label class="form-label" for="sec-confirm-pass">Confirm New Password *</label>
                    <input type="password" id="sec-confirm-pass" class="form-input" minlength="6" required autocomplete="new-password">
                  </div>
                </div>

                <div style="display:flex;justify-content:flex-end;margin-top:16px;">
                  <button type="submit" id="btn-submit-pw" class="btn btn-secondary">
                    <i data-lucide="key"></i>
                    <span>Update Password</span>
                  </button>
                </div>
              </form>

              <div class="divider-line" style="margin:24px 0;"></div>

              <div class="two-factor-box">
                <div class="two-factor-info">
                  <div class="two-factor-icon"><i data-lucide="smartphone"></i></div>
                  <div>
                    <strong>Two-Factor Authentication (2FA)</strong>
                    <p>Enforce Time-Based One-Time Passwords (TOTP) for high-privilege sustainability auditors.</p>
                  </div>
                </div>
                <button id="btn-toggle-2fa" class="btn ${user.two_factor_enabled ? "btn-danger" : "btn-primary"} btn-sm">
                  ${user.two_factor_enabled ? "Disable 2FA" : "Enable 2FA Protection"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 4: Developer API Keys -->
        <div id="tab-developer" class="settings-tab-pane">
          <div class="card">
            <div class="card-header">
              <div class="card-header-icon"><i data-lucide="code"></i></div>
              <div>
                <h2 class="card-title">Enterprise API Integration</h2>
                <p class="card-subtitle">Connect your ERP/SCADA and environmental telemetry systems</p>
              </div>
            </div>
            <div class="card-body">
              <div class="api-key-box">
                <label class="form-label">Live Production API Secret Key</label>
                <div class="input-copy-group">
                  <input type="password" id="field-api-key" class="form-input" value="${user.api_key || "ecov_8f93a1c4b72e0d5568194cf2"}" readonly>
                  <button type="button" id="btn-toggle-key-view" class="btn btn-secondary btn-icon-only" title="Show/Hide Key">
                    <i data-lucide="eye"></i>
                  </button>
                  <button type="button" id="btn-copy-key" class="btn btn-secondary" title="Copy Key">
                    <i data-lucide="copy"></i>
                    <span>Copy</span>
                  </button>
                </div>
                <span class="field-hint">Include this token as <code>Authorization: Bearer ecov_...</code> in your HTTP headers.</span>
              </div>

              <div style="margin-top:16px;">
                <button id="btn-rotate-key" class="btn btn-danger btn-sm">
                  <i data-lucide="refresh-cw"></i>
                  <span>Rotate API Key</span>
                </button>
              </div>

              <div class="api-docs-callout" style="margin-top:24px;">
                <div class="api-docs-header">
                  <i data-lucide="terminal"></i>
                  <strong>REST Endpoint Reference</strong>
                </div>
                <pre class="code-block"><code>POST /api/waste/register
GET  /api/waste/list?page=1&per_page=20
GET  /api/waste/stats
GET  /api/reports/list</code></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Tab switching
  const tabBtns = container.querySelectorAll(".settings-nav-item");
  const tabPanes = container.querySelectorAll(".settings-tab-pane");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-tab");
      document.getElementById(`tab-${target}`)?.classList.add("active");
    });
  });

  // Profile update form
  document.getElementById("form-update-profile")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-save-profile");
    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader-2" class="spin"></i> <span>Updating...</span>`;

    const payload = {
      user_id: user.id || 1,
      name: document.getElementById("set-name").value.trim(),
      job_title: document.getElementById("set-job").value.trim(),
      department: document.getElementById("set-dept").value.trim(),
      phone: document.getElementById("set-phone").value.trim(),
    };

    try {
      const res = await api.put("/auth/profile", payload);
      showToast("Profile successfully updated!", "success");
      if (res.data) {
        auth.setUser(res.data);
        updateTopbarUserUI(res.data);
      }
      renderSettings(container, navigateTo, showToast);
    } catch (err) {
      showToast(err.message || "Failed to update profile.", "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="check"></i> <span>Update Profile</span>`;
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // Preferences save
  document.getElementById("btn-save-prefs")?.addEventListener("click", async () => {
    const payload = {
      user_id: user.id || 1,
      unit_preference: document.getElementById("pref-units").value,
      currency_preference: document.getElementById("pref-curr").value,
      anomaly_alerts: document.getElementById("pref-alert-hazard").checked,
      weekly_digest: document.getElementById("pref-alert-digest").checked,
    };

    try {
      const res = await api.put("/auth/profile", payload);
      showToast("Preferences saved!", "success");
      if (res.data) auth.setUser(res.data);
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // Password update form
  document.getElementById("form-change-password")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPass = document.getElementById("sec-current-pass").value;
    const newPass = document.getElementById("sec-new-pass").value;
    const confirmPass = document.getElementById("sec-confirm-pass").value;

    if (newPass !== confirmPass) {
      showToast("New passwords do not match.", "error");
      return;
    }

    try {
      await api.post("/auth/change-password", {
        user_id: user.id || 1,
        current_password: currentPass,
        new_password: newPass,
      });
      showToast("Password successfully changed!", "success");
      document.getElementById("form-change-password").reset();
    } catch (err) {
      showToast(err.message || "Password change failed.", "error");
    }
  });

  // 2FA Toggle simulation
  document.getElementById("btn-toggle-2fa")?.addEventListener("click", async () => {
    const newState = !user.two_factor_enabled;
    try {
      const res = await api.put("/auth/profile", {
        user_id: user.id || 1,
        two_factor_enabled: newState,
      });
      showToast(newState ? "2FA Enabled for this account." : "2FA Disabled.", "info");
      if (res.data) auth.setUser(res.data);
      renderSettings(container, navigateTo, showToast);
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  // API Key Show/Hide & Copy & Rotate
  const keyInput = document.getElementById("field-api-key");
  document.getElementById("btn-toggle-key-view")?.addEventListener("click", () => {
    keyInput.type = keyInput.type === "password" ? "text" : "password";
  });

  document.getElementById("btn-copy-key")?.addEventListener("click", () => {
    navigator.clipboard.writeText(keyInput.value);
    showToast("API Key copied to clipboard!", "success");
  });

  document.getElementById("btn-rotate-key")?.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to rotate your API key? Any active webhook integrations will need to be updated.")) {
      return;
    }
    try {
      const res = await api.post("/auth/api-key/rotate", { user_id: user.id || 1 });
      showToast("New API key generated!", "success");
      keyInput.value = res.api_key;
      keyInput.type = "text";
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}
