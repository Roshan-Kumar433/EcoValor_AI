/**
 * register.js — Waste Registration (5-Step Wizard)
 * --------------------------------------------------
 * EcoValor AI — Industrial Waste Valorization Platform
 * Handles multi-step form, validation, image upload,
 * and POST to /api/waste/register (multipart/form-data).
 * All existing fields and API calls are preserved.
 */

import api from "./api.js";
import { showToast, navigateTo, escapeHtml } from "./app.js";

/* ── Constants ────────────────────────────────────────────────── */

const WASTE_TYPES = [
  "Chemical Waste", "Electronic Waste (E-Waste)", "Metal Scrap",
  "Plastic Waste", "Paper / Cardboard", "Organic / Food Waste",
  "Textile Waste", "Construction Debris", "Hazardous Waste",
  "Glass Waste", "Rubber Waste", "Mixed Industrial Waste",
];

const FREQUENCIES = [
  { value: "daily",     label: "Daily" },
  { value: "weekly",    label: "Weekly" },
  { value: "monthly",   label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually",  label: "Annually" },
  { value: "one-time",  label: "One-time" },
];

const STEPS = [
  { id: 1, label: "Information",       icon: "clipboard-list" },
  { id: 2, label: "Characteristics",   icon: "flask-conical" },
  { id: 3, label: "Operations",        icon: "building-2" },
  { id: 4, label: "Evidence",          icon: "image" },
  { id: 5, label: "Review",            icon: "check-circle" },
];

let currentStep = 1;
let formData = {};

/* ── Render ───────────────────────────────────────────────────── */

export function renderRegister(container) {
  currentStep = 1;
  formData = {};

  container.innerHTML = `
    <div class="page-header">
      <h1>Register Waste Batch</h1>
      <p>Complete all steps to submit a new industrial waste entry for tracking and valorization analysis.</p>
    </div>

    <div class="card">
      <!-- Step Progress -->
      ${renderStepProgress(1)}

      <!-- Step Forms -->
      <form id="register-wizard" novalidate>

        <!-- STEP 1: Waste Information -->
        <div class="step-content ${currentStep === 1 ? 'active' : ''}" data-step="1">
          <div class="step-section-title">
            <i data-lucide="clipboard-list"></i>
            Waste Information
          </div>
          <div class="form-grid">

            <div class="form-group" id="fg-waste_type">
              <label class="form-label" for="waste_type">
                Waste Type <span class="required">*</span>
              </label>
              <select class="form-control" id="waste_type" name="waste_type" required>
                <option value="">— Select waste type —</option>
                ${WASTE_TYPES.map(t => `<option value="${t}">${t}</option>`).join("")}
              </select>
              <span class="field-error">
                <i data-lucide="alert-circle"></i> Please select a waste type.
              </span>
            </div>

            <div class="form-group" id="fg-generation_frequency">
              <label class="form-label" for="generation_frequency">
                Generation Frequency <span class="required">*</span>
              </label>
              <select class="form-control" id="generation_frequency" name="generation_frequency" required>
                <option value="">— Select frequency —</option>
                ${FREQUENCIES.map(f => `<option value="${f.value}">${f.label}</option>`).join("")}
              </select>
              <span class="field-error">
                <i data-lucide="alert-circle"></i> Please select a frequency.
              </span>
            </div>

            <div class="form-group" id="fg-quantity">
              <label class="form-label" for="quantity">
                Quantity <span class="required">*</span>
              </label>
              <input type="number" class="form-control" id="quantity" name="quantity"
                min="0.001" step="any" placeholder="e.g. 500" required>
              <span class="field-error">
                <i data-lucide="alert-circle"></i> Enter a quantity greater than 0.
              </span>
            </div>

            <div class="form-group" id="fg-unit">
              <label class="form-label" for="unit">
                Unit <span class="required">*</span>
              </label>
              <select class="form-control" id="unit" name="unit" required>
                <option value="">— Select unit —</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="tonnes">Tonnes</option>
                <option value="litres">Litres</option>
                <option value="m3">Cubic Meters (m³)</option>
              </select>
              <span class="field-error">
                <i data-lucide="alert-circle"></i> Please select a unit.
              </span>
            </div>

          </div>
          <div class="step-actions">
            <span></span>
            <button type="button" class="btn btn-primary" onclick="window._wizardNext()">
              Next: Characteristics
              <i data-lucide="arrow-right"></i>
            </button>
          </div>
        </div>

        <!-- STEP 2: Material Characteristics -->
        <div class="step-content" data-step="2">
          <div class="step-section-title">
            <i data-lucide="flask-conical"></i>
            Material Characteristics
          </div>
          <div class="form-grid">

            <div class="form-group full-width" id="fg-material_composition">
              <label class="form-label" for="material_composition">
                Material Composition <span class="required">*</span>
              </label>
              <textarea class="form-control" id="material_composition" name="material_composition"
                placeholder="e.g. 60% polypropylene, 30% PVC, 10% metal fragments…"
                rows="3" required></textarea>
              <span class="form-hint">Describe the primary materials present in the waste stream.</span>
              <span class="field-error">
                <i data-lucide="alert-circle"></i> Please describe the material composition.
              </span>
            </div>

            <div class="form-group" id="fg-contamination_level">
              <label class="form-label" for="contamination_level">
                Contamination Level <span class="required">*</span>
              </label>
              <select class="form-control" id="contamination_level" name="contamination_level" required>
                <option value="">— Select level —</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <span class="form-hint">Estimated proportion of unwanted material mixed with the waste.</span>
              <span class="field-error">
                <i data-lucide="alert-circle"></i> Please select a contamination level.
              </span>
            </div>

            <div class="form-group" id="fg-moisture_level">
              <label class="form-label" for="moisture_level">
                Moisture Level <span class="required">*</span>
              </label>
              <div class="input-group">
                <input type="number" class="form-control" id="moisture_level" name="moisture_level"
                  min="0" max="100" step="0.1" placeholder="0 – 100" required>
                <span class="input-addon">%</span>
              </div>
              <span class="form-hint">Water content as a percentage of total waste weight.</span>
              <span class="field-error" id="fe-moisture">
                <i data-lucide="alert-circle"></i> Must be between 0 and 100.
              </span>
            </div>

          </div>
          <div class="step-actions">
            <button type="button" class="btn btn-outline" onclick="window._wizardBack()">
              <i data-lucide="arrow-left"></i>
              Back
            </button>
            <button type="button" class="btn btn-primary" onclick="window._wizardNext()">
              Next: Operations
              <i data-lucide="arrow-right"></i>
            </button>
          </div>
        </div>

        <!-- STEP 3: Operational Information -->
        <div class="step-content" data-step="3">
          <div class="step-section-title">
            <i data-lucide="building-2"></i>
            Operational Information
          </div>
          <div class="form-grid">

            <div class="form-group full-width" id="fg-location">
              <label class="form-label" for="location">
                Industrial Location / Facility <span class="required">*</span>
              </label>
              <input type="text" class="form-control" id="location" name="location"
                placeholder="e.g. Plant B, Chennai Industrial Zone" required>
              <span class="form-hint">Name and location of the facility where waste is generated.</span>
              <span class="field-error">
                <i data-lucide="alert-circle"></i> Please enter a facility location.
              </span>
            </div>

            <div class="form-group" id="fg-processing_cost">
              <label class="form-label" for="processing_cost">
                Estimated Processing Cost
              </label>
              <div class="input-group">
                <span class="input-addon-left">₹</span>
                <input type="number" class="form-control" id="processing_cost"
                  name="processing_cost" min="0" step="0.01" placeholder="e.g. 2500">
              </div>
              <span class="form-hint">Per-unit estimated cost to process or dispose of this waste.</span>
            </div>

            <div class="form-group" id="fg-transportation_distance">
              <label class="form-label" for="transportation_distance">
                Transportation Distance
              </label>
              <div class="input-group">
                <input type="number" class="form-control" id="transportation_distance"
                  name="transportation_distance" min="0" step="0.1" placeholder="e.g. 45">
                <span class="input-addon">km</span>
              </div>
              <span class="form-hint">Distance to the nearest waste processing or recycling facility.</span>
            </div>

            <div class="form-group" id="fg-market_demand">
              <label class="form-label" for="market_demand">
                Market Demand
              </label>
              <select class="form-control" id="market_demand" name="market_demand">
                <option value="">— Select market demand —</option>
                <option value="high">High Demand (Active commercial buyers / recyclers)</option>
                <option value="medium">Medium Demand (Moderate / Seasonal buyers)</option>
                <option value="low">Low Demand (Niche or restricted market)</option>
              </select>
              <span class="form-hint">Current secondary market appetite for this byproduct.</span>
            </div>

            <div class="form-group" id="fg-market_price">
              <label class="form-label" for="market_price">
                Estimated Market / Resale Price
              </label>
              <div class="input-group">
                <span class="input-addon-left">₹</span>
                <input type="number" class="form-control" id="market_price"
                  name="market_price" min="0" step="0.01" placeholder="e.g. 3800">
              </div>
              <span class="form-hint">Estimated market value or selling price per unit.</span>
            </div>

          </div>
          <div class="step-actions">
            <button type="button" class="btn btn-outline" onclick="window._wizardBack()">
              <i data-lucide="arrow-left"></i>
              Back
            </button>
            <button type="button" class="btn btn-primary" onclick="window._wizardNext()">
              Next: Evidence
              <i data-lucide="arrow-right"></i>
            </button>
          </div>
        </div>

        <!-- STEP 4: Evidence (Image Upload) -->
        <div class="step-content" data-step="4">
          <div class="step-section-title">
            <i data-lucide="image"></i>
            Waste Image (Optional)
          </div>

          <div class="upload-zone" id="upload-zone">
            <input type="file" id="image" name="image" accept="image/png,image/jpeg,image/jpg,image/webp">
            <div class="upload-zone-icon">
              <i data-lucide="upload-cloud"></i>
            </div>
            <div class="upload-text">
              <strong>Click to upload</strong> or drag &amp; drop
            </div>
            <div class="upload-hint">JPG, JPEG, PNG or WebP — max 16 MB</div>
          </div>

          <div class="image-preview" id="image-preview">
            <img id="preview-img" src="" alt="Waste image preview">
            <div class="image-preview-actions">
              <button type="button" class="image-preview-btn" id="remove-image"
                title="Remove image" aria-label="Remove uploaded image">
                <i data-lucide="x"></i>
              </button>
            </div>
          </div>

          <div style="margin-top:16px;">
            <div class="notice-banner info">
              <div class="notice-banner-icon"><i data-lucide="cpu"></i></div>
              <div class="notice-banner-body">
                <h4>Computer Vision — Phase 2</h4>
                <p>Image analysis will be enabled when the AI engine is integrated. Uploading an image now helps build the training dataset.</p>
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button type="button" class="btn btn-outline" onclick="window._wizardBack()">
              <i data-lucide="arrow-left"></i>
              Back
            </button>
            <button type="button" class="btn btn-primary" onclick="window._wizardNext()">
              Next: Review
              <i data-lucide="arrow-right"></i>
            </button>
          </div>
        </div>

        <!-- STEP 5: Review & Submit -->
        <div class="step-content" data-step="5">
          <div class="step-section-title">
            <i data-lucide="check-circle"></i>
            Review &amp; Submit
          </div>

          <p style="font-size:13.5px;color:var(--text-secondary);margin-bottom:20px;">
            Please review the information below before submitting. You can go back to any step to make changes.
          </p>

          <div class="review-grid" id="review-summary">
            <!-- Populated by JS -->
          </div>

          <!-- Server errors -->
          <div id="form-errors" class="form-errors-block">
            <p>Please fix the following errors:</p>
            <ul id="error-list"></ul>
          </div>

          <div class="step-actions">
            <button type="button" class="btn btn-outline" onclick="window._wizardBack()">
              <i data-lucide="arrow-left"></i>
              Back
            </button>
            <button type="submit" class="btn btn-success btn-lg" id="btn-submit">
              <span class="spinner"></span>
              <span class="btn-label">
                <i data-lucide="check"></i>
                Submit Waste Entry
              </span>
            </button>
          </div>
        </div>

      </form>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
  attachWizardHandlers();
}

/* ── Step Progress Renderer ────────────────────────────────────── */

function renderStepProgress(active) {
  const items = STEPS.map((step, i) => {
    const isActive    = step.id === active;
    const isCompleted = step.id < active;
    const circleClass = isCompleted ? "completed" : (isActive ? "active" : "");
    const labelClass  = isCompleted ? "completed" : (isActive ? "active" : "");

    const circleContent = isCompleted
      ? `<i data-lucide="check"></i>`
      : step.id;

    const connector = i < STEPS.length - 1
      ? `<div class="step-connector ${isCompleted ? 'completed' : ''}"></div>`
      : "";

    return `
      <div class="step-item">
        <div class="step-with-label">
          <div class="step-circle ${circleClass}">${circleContent}</div>
          <div class="step-label ${labelClass}">${step.label}</div>
        </div>
        ${connector}
      </div>`;
  }).join("");

  return `<div class="step-progress">${items}</div>`;
}

/* ── Wizard Navigation ─────────────────────────────────────────── */

function goToStep(target) {
  if (target < 1 || target > STEPS.length) return;

  // Save current visible step data
  saveStepData();

  // Show/hide steps
  document.querySelectorAll(".step-content").forEach(el => {
    el.classList.toggle("active", Number(el.dataset.step) === target);
  });

  // Update progress indicator
  const progressEl = document.querySelector(".step-progress");
  if (progressEl) {
    progressEl.outerHTML = renderStepProgress(target);
    if (window.lucide) lucide.createIcons();
  }

  currentStep = target;

  // Populate review on step 5
  if (target === 5) {
    buildReview();
  }

  // Scroll to top of card
  document.querySelector(".card")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function saveStepData() {
  const form = document.getElementById("register-wizard");
  if (!form) return;
  const data = new FormData(form);
  for (const [key, val] of data.entries()) {
    if (key !== "image") formData[key] = val;
  }
}

/* ── Review Builder ────────────────────────────────────────────── */

function buildReview() {
  saveStepData();
  const el = document.getElementById("review-summary");
  if (!el) return;

  const val = (k) => formData[k] ? escapeHtml(String(formData[k])) : '<span class="review-row-value empty">—</span>';
  const hasImg = document.getElementById("preview-img")?.src &&
                 document.getElementById("preview-img").src.startsWith("data:");

  el.innerHTML = `
    <div class="review-section">
      <div class="review-section-title">Waste Information</div>
      <div class="review-row">
        <span class="review-row-label">Waste Type</span>
        <span class="review-row-value">${val("waste_type")}</span>
      </div>
      <div class="review-row">
        <span class="review-row-label">Quantity</span>
        <span class="review-row-value">${formData.quantity ? `${escapeHtml(formData.quantity)} ${escapeHtml(formData.unit || "")}` : '<span class="review-row-value empty">—</span>'}</span>
      </div>
      <div class="review-row">
        <span class="review-row-label">Generation Frequency</span>
        <span class="review-row-value" style="text-transform:capitalize;">${val("generation_frequency")}</span>
      </div>
    </div>

    <div class="review-section">
      <div class="review-section-title">Material Characteristics</div>
      <div class="review-row">
        <span class="review-row-label">Composition</span>
        <span class="review-row-value">${val("material_composition")}</span>
      </div>
      <div class="review-row">
        <span class="review-row-label">Contamination</span>
        <span class="review-row-value" style="text-transform:capitalize;">${val("contamination_level")}</span>
      </div>
      <div class="review-row">
        <span class="review-row-label">Moisture Level</span>
        <span class="review-row-value">${formData.moisture_level !== undefined ? escapeHtml(formData.moisture_level) + "%" : '<span class="review-row-value empty">—</span>'}</span>
      </div>
    </div>

    <div class="review-section">
      <div class="review-section-title">Operational &amp; Market Economics</div>
      <div class="review-row">
        <span class="review-row-label">Facility / Location</span>
        <span class="review-row-value">${val("location")}</span>
      </div>
      <div class="review-row">
        <span class="review-row-label">Processing Cost</span>
        <span class="review-row-value">${formData.processing_cost ? "₹" + escapeHtml(formData.processing_cost) : '<span class="review-row-value empty">Not specified</span>'}</span>
      </div>
      <div class="review-row">
        <span class="review-row-label">Transport Distance</span>
        <span class="review-row-value">${formData.transportation_distance ? escapeHtml(formData.transportation_distance) + " km" : '<span class="review-row-value empty">Not specified</span>'}</span>
      </div>
      <div class="review-row">
        <span class="review-row-label">Market Demand</span>
        <span class="review-row-value">${formData.market_demand ? `<span class="badge badge-demand-${formData.market_demand}">${formData.market_demand.toUpperCase()}</span>` : '<span class="review-row-value empty">Not specified</span>'}</span>
      </div>
      <div class="review-row">
        <span class="review-row-label">Market Price</span>
        <span class="review-row-value">${formData.market_price ? "₹" + escapeHtml(formData.market_price) + " / unit" : '<span class="review-row-value empty">Not specified</span>'}</span>
      </div>
    </div>

    <div class="review-section">
      <div class="review-section-title">Evidence</div>
      <div class="review-row">
        <span class="review-row-label">Waste Image</span>
        <span class="review-row-value">${hasImg ? "Image uploaded" : '<span class="review-row-value empty">No image</span>'}</span>
      </div>
    </div>
  `;
}

/* ── Validation ────────────────────────────────────────────────── */

function validateStep(step) {
  let valid = true;

  const requireds = {
    1: ["waste_type", "generation_frequency", "quantity", "unit"],
    2: ["material_composition", "contamination_level", "moisture_level"],
    3: ["location"],
    4: [],
    5: [],
  };

  (requireds[step] || []).forEach(name => {
    const el = document.querySelector(`[name="${name}"]`);
    if (!el) return;
    if (!el.value.trim()) {
      setError(name, true);
      valid = false;
    } else {
      setError(name, false);
    }
  });

  if (step === 1) {
    const qty = parseFloat(document.getElementById("quantity")?.value);
    if (isNaN(qty) || qty <= 0) {
      setError("quantity", true);
      valid = false;
    } else {
      setError("quantity", false);
    }
  }

  if (step === 2) {
    const moisture = parseFloat(document.getElementById("moisture_level")?.value);
    if (isNaN(moisture) || moisture < 0 || moisture > 100) {
      setError("moisture_level", true);
      valid = false;
    } else {
      setError("moisture_level", false);
    }
  }

  if (!valid) {
    // Scroll first error into view
    const firstError = document.querySelector(".form-group.has-error .form-control");
    firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
    firstError?.focus();
  }

  return valid;
}

function setError(fieldName, hasError) {
  const fg = document.getElementById(`fg-${fieldName}`);
  const el = document.querySelector(`[name="${fieldName}"]`);
  if (!fg || !el) return;
  fg.classList.toggle("has-error", hasError);
  el.classList.toggle("error", hasError);
}

function clearAllErrors() {
  document.querySelectorAll(".form-group.has-error").forEach(fg => fg.classList.remove("has-error"));
  document.querySelectorAll(".form-control.error").forEach(el => el.classList.remove("error"));
}

/* ── Form Handlers ────────────────────────────────────────────── */

function attachWizardHandlers() {
  const form      = document.getElementById("register-wizard");
  const submitBtn = document.getElementById("btn-submit");
  const uploadZone = document.getElementById("upload-zone");
  const fileInput  = document.getElementById("image");
  const preview    = document.getElementById("image-preview");
  const previewImg = document.getElementById("preview-img");
  const removeBtn  = document.getElementById("remove-image");

  // Expose wizard nav globally (for onclick handlers in HTML)
  window._wizardNext = () => {
    if (!validateStep(currentStep)) return;
    goToStep(currentStep + 1);
  };

  window._wizardBack = () => {
    goToStep(currentStep - 1);
  };

  // Image preview on file select
  fileInput?.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      preview.style.display = "block";
      showToast("success", "Image uploaded", file.name);
      if (window.lucide) lucide.createIcons();
    };
    reader.readAsDataURL(file);
  });

  // Drag-and-drop
  uploadZone?.addEventListener("dragover", e => {
    e.preventDefault();
    uploadZone.classList.add("dragover");
  });
  uploadZone?.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
  uploadZone?.addEventListener("drop", e => {
    e.preventDefault();
    uploadZone.classList.remove("dragover");
    const file = e.dataTransfer?.files[0];
    if (file) {
      // Transfer to file input
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event("change"));
    }
  });

  // Remove image
  removeBtn?.addEventListener("click", () => {
    fileInput.value = "";
    previewImg.src = "";
    preview.style.display = "none";
  });

  // Submit
  form?.addEventListener("submit", async e => {
    e.preventDefault();
    hideServerErrors();

    // Final full validation
    let allValid = true;
    for (let s = 1; s <= 3; s++) {
      if (!validateStep(s)) {
        allValid = false;
        goToStep(s);
        break;
      }
    }
    if (!allValid) return;

    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    // Build FormData from saved data + actual form (for image)
    saveStepData();
    const fd = new FormData();
    for (const [key, val] of Object.entries(formData)) {
      if (val !== undefined && val !== "") fd.append(key, val);
    }
    const imageFile = fileInput?.files[0];
    if (imageFile) fd.append("image", imageFile);

    try {
      const res = await api.postForm("/waste/register", fd);

      if (res.success) {
        showToast("success", "Waste Registered!", `Batch #${res.data.id} saved successfully.`);
        // Reset wizard
        currentStep = 1;
        formData = {};
        clearAllErrors();
        setTimeout(() => navigateTo("history"), 1500);
      } else {
        showServerErrors(res.errors || ["An unknown error occurred."]);
      }
    } catch (err) {
      showServerErrors([`Network error: ${err.message}`]);
    } finally {
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
    }
  });
}

/* ── Server Error Helpers ──────────────────────────────────────── */

function showServerErrors(errors) {
  const container = document.getElementById("form-errors");
  const list      = document.getElementById("error-list");
  if (!container || !list) return;
  list.innerHTML  = errors.map(e => `<li>${escapeHtml(e)}</li>`).join("");
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function hideServerErrors() {
  const container = document.getElementById("form-errors");
  if (container) container.style.display = "none";
}
