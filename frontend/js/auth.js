/**
 * auth.js — Enterprise Authentication & Session Manager
 * -----------------------------------------------------
 * Handles login, registration, session persistence, and auth UI.
 */

import api from "./api.js";

const AUTH_KEY = "ecovalor_user";
const TOKEN_KEY = "ecovalor_token";

export const auth = {
  getUser() {
    try {
      const u = localStorage.getItem(AUTH_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },

  setUser(user, token = null) {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else if (!user) {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  isAuthenticated() {
    return !!this.getUser();
  },

  async login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    if (res.success && res.data) {
      this.setUser(res.data.user, res.data.token);
      return res.data.user;
    }
    throw new Error(res.errors ? res.errors.join(", ") : "Authentication failed");
  },

  async register(data) {
    const res = await api.post("/auth/register", data);
    if (res.success && res.data) {
      this.setUser(res.data.user, res.data.token);
      return res.data.user;
    }
    throw new Error(res.errors ? res.errors.join(", ") : "Registration failed");
  },

  logout() {
    this.setUser(null, null);
    window.location.hash = "#login";
  },

  async fetchMe() {
    try {
      const res = await api.get("/auth/me");
      if (res.success && res.data) {
        this.setUser(res.data, localStorage.getItem(TOKEN_KEY) || `bearer_${res.data.id}`);
        return res.data;
      }
    } catch {
      // Fallback
    }
    return null;
  }
};

/**
 * Render Login Screen
 */
export function renderLogin(container, navigateTo, showToast) {
  // If already logged in, redirect to dashboard
  if (auth.isAuthenticated()) {
    navigateTo("dashboard");
    return;
  }

  container.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-split-grid">
        <!-- Left Hero / Brand Card -->
        <div class="auth-hero-panel">
          <div class="auth-hero-brand">
            <div class="auth-logo-badge">
              <i data-lucide="leaf" style="width:24px;height:24px;"></i>
            </div>
            <div>
              <div class="auth-logo-title">EcoValor AI</div>
              <div class="auth-logo-subtitle">Enterprise Waste Valorization</div>
            </div>
          </div>
          <div class="auth-hero-content">
            <div class="hero-badge-pill">Phase 1 Enterprise Architecture</div>
            <h1 class="auth-hero-headline">Industrial Waste Transformation & ESG Intelligence</h1>
            <p class="auth-hero-desc">
              Harness predictive analytics and material engineering pathways to convert manufacturing byproducts into circular value streams.
            </p>
            <div class="auth-feature-list">
              <div class="auth-feature-item">
                <div class="feat-icon"><i data-lucide="shield-check"></i></div>
                <div>
                  <strong>EPA & ISO 14001 Compliance</strong>
                  <span>Standardized data models and certified audit trails</span>
                </div>
              </div>
              <div class="auth-feature-item">
                <div class="feat-icon"><i data-lucide="cpu"></i></div>
                <div>
                  <strong>AI Valorization Readiness</strong>
                  <span>Pre-structured pipeline for circular economy recommendations</span>
                </div>
              </div>
              <div class="auth-feature-item">
                <div class="feat-icon"><i data-lucide="building-2"></i></div>
                <div>
                  <strong>Multi-Facility Industrial Scope</strong>
                  <span>Granular waste inventory tracking across operations</span>
                </div>
              </div>
            </div>
          </div>
          <div class="auth-hero-footer">
            <span>EcoValor AI Platform &copy; 2026</span>
            <span class="dot-sep">&bull;</span>
            <span>Enterprise Edition v1.2</span>
          </div>
        </div>

        <!-- Right Form Panel -->
        <div class="auth-form-panel">
          <div class="auth-form-card">
            <div class="auth-header">
              <h2>Sign in to your facility</h2>
              <p>Enter your enterprise credentials to access the sustainability dashboard.</p>
            </div>

            <!-- Demo Credentials Banner -->
            <div class="demo-account-callout">
              <div class="demo-callout-header">
                <i data-lucide="info" style="width:16px;height:16px;color:var(--color-primary);"></i>
                <strong>Pre-Configured Demo Account</strong>
              </div>
              <div class="demo-callout-credentials">
                <div><span>Email:</span> <code>sustainability@apexchem.com</code></div>
                <div><span>Password:</span> <code>EcoValor2026!</code></div>
              </div>
              <button type="button" id="btn-autofill-demo" class="btn btn-secondary btn-sm" style="margin-top:8px;width:100%;">
                <i data-lucide="sparkles" style="width:14px;height:14px;"></i> Autofill Demo Credentials
              </button>
            </div>

            <form id="form-login" class="auth-form">
              <div class="form-group">
                <label class="form-label" for="login-email">Enterprise Email</label>
                <div class="input-icon-wrap">
                  <i data-lucide="mail" class="input-icon"></i>
                  <input type="email" id="login-email" class="form-input with-icon" placeholder="name@company.com" required autocomplete="email">
                </div>
              </div>

              <div class="form-group">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <label class="form-label" for="login-password">Password</label>
                  <a href="javascript:void(0)" id="link-forgot-pass" class="form-hint-link">Forgot password?</a>
                </div>
                <div class="input-icon-wrap">
                  <i data-lucide="lock" class="input-icon"></i>
                  <input type="password" id="login-password" class="form-input with-icon" placeholder="••••••••" required autocomplete="current-password">
                </div>
              </div>

              <div class="form-check-row">
                <label class="checkbox-label">
                  <input type="checkbox" id="login-remember" checked>
                  <span>Remember this device for 30 days</span>
                </label>
              </div>

              <div id="login-error-box" class="form-alert error-alert" style="display:none;"></div>

              <button type="submit" id="btn-submit-login" class="btn btn-primary btn-block btn-lg">
                <span>Sign In to Platform</span>
                <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>
              </button>
            </form>

            <div class="auth-divider">
              <span>or</span>
            </div>

            <div class="auth-switch-link">
              <span>New facility or division?</span>
              <a href="#register-user" id="link-go-register" class="text-primary font-semibold">Register Organization Account</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Handle demo autofill
  document.getElementById("btn-autofill-demo")?.addEventListener("click", () => {
    document.getElementById("login-email").value = "sustainability@apexchem.com";
    document.getElementById("login-password").value = "EcoValor2026!";
  });

  document.getElementById("link-forgot-pass")?.addEventListener("click", () => {
    showToast("Please contact your Facility Administrator or IT compliance officer to reset credentials.", "info");
  });

  // Handle submit
  const form = document.getElementById("form-login");
  const errBox = document.getElementById("login-error-box");
  const submitBtn = document.getElementById("btn-submit-login");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errBox.style.display = "none";
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Authenticating...</span>`;

    try {
      const user = await auth.login(email, password);
      showToast(`Welcome back, ${user.name}!`, "success");
      // Update topbar user details
      updateTopbarUserUI(user);
      navigateTo("dashboard");
    } catch (err) {
      errBox.textContent = err.message || "Failed to sign in. Please verify credentials.";
      errBox.style.display = "block";
      showToast(err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Sign In to Platform</span> <i data-lucide="arrow-right" style="width:16px;height:16px;"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }
  });
}

/**
 * Render Registration Screen
 */
export function renderRegisterUser(container, navigateTo, showToast) {
  container.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-split-grid">
        <!-- Left Hero / Brand Card -->
        <div class="auth-hero-panel">
          <div class="auth-hero-brand">
            <div class="auth-logo-badge">
              <i data-lucide="leaf" style="width:24px;height:24px;"></i>
            </div>
            <div>
              <div class="auth-logo-title">EcoValor AI</div>
              <div class="auth-logo-subtitle">Enterprise Onboarding</div>
            </div>
          </div>
          <div class="auth-hero-content">
            <div class="hero-badge-pill">Facility Account Creation</div>
            <h1 class="auth-hero-headline">Join the Next-Generation Industrial Circular Network</h1>
            <p class="auth-hero-desc">
              Create an enterprise profile to begin tracking waste streams, calculating carbon offset values, and preparing data for AI valorization matching.
            </p>
            <div class="auth-stats-callout-grid">
              <div class="auth-stat-box">
                <div class="auth-stat-val">100%</div>
                <div class="auth-stat-lbl">Data Confidentiality</div>
              </div>
              <div class="auth-stat-box">
                <div class="auth-stat-val">ISO 14001</div>
                <div class="auth-stat-lbl">Standard Framework</div>
              </div>
            </div>
          </div>
          <div class="auth-hero-footer">
            <span>EcoValor AI Platform &copy; 2026</span>
          </div>
        </div>

        <!-- Right Form Panel -->
        <div class="auth-form-panel">
          <div class="auth-form-card" style="max-width: 520px;">
            <div class="auth-header">
              <h2>Register New Facility Account</h2>
              <p>Setup your sustainability officer account and organization profile.</p>
            </div>

            <form id="form-register-user" class="auth-form">
              <div class="form-row-2col">
                <div class="form-group">
                  <label class="form-label" for="reg-name">Full Name *</label>
                  <input type="text" id="reg-name" class="form-input" placeholder="e.g. Dr. Jordan Reed" required>
                </div>
                <div class="form-group">
                  <label class="form-label" for="reg-role">Platform Role *</label>
                  <select id="reg-role" class="form-select" required>
                    <option value="Sustainability Officer">Sustainability Officer</option>
                    <option value="Facility Manager">Facility Manager</option>
                    <option value="Environmental Engineer">Environmental Engineer</option>
                    <option value="Compliance Auditor">Compliance Auditor</option>
                    <option value="Executive / Operations">Executive / Operations</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="reg-email">Enterprise Work Email *</label>
                <div class="input-icon-wrap">
                  <i data-lucide="mail" class="input-icon"></i>
                  <input type="email" id="reg-email" class="form-input with-icon" placeholder="name@company.com" required>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="reg-org">Organization / Industry Name *</label>
                <div class="input-icon-wrap">
                  <i data-lucide="building-2" class="input-icon"></i>
                  <input type="text" id="reg-org" class="form-input with-icon" placeholder="e.g. Acme Advanced Chemicals Corp" required>
                </div>
              </div>

              <div class="form-row-2col">
                <div class="form-group">
                  <label class="form-label" for="reg-job">Job Title</label>
                  <input type="text" id="reg-job" class="form-input" placeholder="Lead Sustainability Engineer">
                </div>
                <div class="form-group">
                  <label class="form-label" for="reg-phone">Contact Phone</label>
                  <input type="text" id="reg-phone" class="form-input" placeholder="+1 (555) 000-0000">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="reg-password">Password (min. 6 characters) *</label>
                <div class="input-icon-wrap">
                  <i data-lucide="lock" class="input-icon"></i>
                  <input type="password" id="reg-password" class="form-input with-icon" placeholder="••••••••" minlength="6" required>
                </div>
              </div>

              <div id="reg-error-box" class="form-alert error-alert" style="display:none;"></div>

              <button type="submit" id="btn-submit-reg" class="btn btn-primary btn-block btn-lg">
                <span>Create Enterprise Account</span>
                <i data-lucide="check" style="width:16px;height:16px;"></i>
              </button>
            </form>

            <div class="auth-divider">
              <span>or</span>
            </div>

            <div class="auth-switch-link">
              <span>Already registered?</span>
              <a href="#login" class="text-primary font-semibold">Sign in here</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const form = document.getElementById("form-register-user");
  const errBox = document.getElementById("reg-error-box");
  const submitBtn = document.getElementById("btn-submit-reg");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errBox.style.display = "none";

    const payload = {
      name: document.getElementById("reg-name").value.trim(),
      role: document.getElementById("reg-role").value,
      email: document.getElementById("reg-email").value.trim(),
      organization_name: document.getElementById("reg-org").value.trim(),
      job_title: document.getElementById("reg-job").value.trim(),
      phone: document.getElementById("reg-phone").value.trim(),
      password: document.getElementById("reg-password").value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Creating Account...</span>`;

    try {
      const user = await auth.register(payload);
      showToast(`Account successfully registered for ${user.name}!`, "success");
      updateTopbarUserUI(user);
      navigateTo("dashboard");
    } catch (err) {
      errBox.textContent = err.message || "Registration failed. Please check your inputs.";
      errBox.style.display = "block";
      showToast(err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Create Enterprise Account</span> <i data-lucide="check" style="width:16px;height:16px;"></i>`;
      if (window.lucide) window.lucide.createIcons();
    }
  });
}

/**
 * Helper to update header profile details
 */
export function updateTopbarUserUI(user) {
  const nameEl = document.getElementById("topbar-user-name");
  const roleEl = document.getElementById("topbar-user-role");
  const avatarEl = document.getElementById("topbar-user-avatar");
  const orgBadgeEl = document.getElementById("topbar-org-badge");

  if (user) {
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role || user.job_title || "Sustainability Officer";
    if (avatarEl) {
      const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      avatarEl.textContent = initials || "EV";
    }
    if (orgBadgeEl) {
      orgBadgeEl.innerHTML = `<i data-lucide="building-2" style="width:14px;height:14px;"></i><span>${user.organization_name || "Apex Advanced Petrochem"}</span>`;
    }
  }
  if (window.lucide) window.lucide.createIcons();
}
