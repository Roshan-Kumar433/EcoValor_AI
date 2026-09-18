/**
 * app.js — Client-side Router & Application Shell
 * --------------------------------------------------
 * EcoValor AI — Industrial Waste Valorization Platform
 * Handles SPA navigation, protected routes, user menus, and toasts.
 */

import { renderDashboard } from "./dashboard.js";
import { renderRegister }  from "./register.js";
import { renderHistory }   from "./history.js";
import { renderAnalysis }  from "./analysis.js";
import { renderReports }   from "./reports.js";
import { renderOrganization } from "./organization.js";
import { renderSettings }  from "./settings.js";
import { renderNotifications, setupTopbarNotificationDropdown, updateGlobalNotificationBadge } from "./notifications.js";
import { auth, renderLogin, renderRegisterUser, updateTopbarUserUI } from "./auth.js";

/* ── Route Map ─────────────────────────────────────────────────── */

const ROUTES = {
  dashboard: renderDashboard,
  register: renderRegister,
  history: renderHistory,
  analysis: renderAnalysis,
  reports: renderReports,
  organization: renderOrganization,
  settings: renderSettings,
  notifications: renderNotifications,
  login: renderLogin,
  "register-user": renderRegisterUser,
};

const PAGE_TITLES = {
  dashboard: { title: "Dashboard", sub: "Industrial Circular Intelligence" },
  register: { title: "Register Waste Batch", sub: "Material stream intake and characterization" },
  history: { title: "Waste Inventory & History", sub: "All registered batches across facilities" },
  analysis: { title: "AI Valorization Analysis", sub: "Optimization pathways & circular recommendations" },
  reports: { title: "Reports & ESG Compliance", sub: "Certified waste audits and EPA manifests" },
  organization: { title: "Organization & Facility", sub: "Industrial classification and net-zero targets" },
  settings: { title: "Settings & Profile", sub: "User preferences and enterprise API security" },
  notifications: { title: "Notifications & Alerts", sub: "Facility anomaly alerts and compliance updates" },
  login: { title: "Sign In", sub: "EcoValor AI Enterprise Platform" },
  "register-user": { title: "Register Facility", sub: "Create Enterprise Account" },
};

/* ── Navigation ────────────────────────────────────────────────── */

let currentPage = null;

export function navigateTo(page, ...args) {
  if (!ROUTES[page]) {
    page = "dashboard";
  }

  // Auth Guard: if not authenticated and trying to access protected page
  const isAuthPage = page === "login" || page === "register-user";
  if (!auth.isAuthenticated() && !isAuthPage) {
    page = "login";
  }

  window.location.hash = `#${page}`;

  const sidebar = document.getElementById("sidebar");
  const topbar = document.getElementById("app-topbar");

  if (isAuthPage) {
    if (sidebar) sidebar.style.display = "none";
    if (topbar) topbar.style.display = "none";
    document.querySelector(".main-content")?.classList.add("full-width-auth");
  } else {
    if (sidebar) sidebar.style.display = "";
    if (topbar) topbar.style.display = "";
    document.querySelector(".main-content")?.classList.remove("full-width-auth");
  }

  // Update active nav item
  document.querySelectorAll(".nav-item[data-page]").forEach((el) => {
    el.classList.toggle("active", el.dataset.page === page);
  });

  // Update topbar title/breadcrumb
  const meta = PAGE_TITLES[page] || {};
  const topbarTitle = document.getElementById("topbar-title");
  const topbarSub = document.getElementById("topbar-sub");
  if (topbarTitle) topbarTitle.textContent = meta.title || page;
  if (topbarSub) topbarSub.textContent = meta.sub || "";

  // Clear content and render new page
  const content = document.getElementById("page-content");
  if (!content) return;
  content.innerHTML = "";
  currentPage = page;

  const handler = ROUTES[page];
  handler(content, navigateTo, showToast, ...args);

  // Re-init Lucide icons after page render
  if (window.lucide) lucide.createIcons();

  // Scroll to top
  content.scrollTop = 0;

  // Sync notification badges if authenticated
  if (auth.isAuthenticated()) {
    updateGlobalNotificationBadge();
  }
}

// Expose globally
window.navigateTo = navigateTo;

/* ── Toast Notifications ──────────────────────────────────────── */

export function showToast(arg1, arg2 = "info", arg3 = "", duration = 4500) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const validTypes = ["success", "error", "info", "warning"];
  let type = "info";
  let title = "";
  let message = "";

  if (validTypes.includes(arg1)) {
    type = arg1;
    title = arg2;
    message = arg3;
  } else if (validTypes.includes(arg2)) {
    title = arg1;
    type = arg2;
    message = arg3;
  } else {
    title = arg1;
    type = "info";
    message = typeof arg2 === "string" ? arg2 : "";
  }

  const iconMap = {
    success: "check-circle",
    error: "x-circle",
    info: "info",
    warning: "alert-triangle",
  };

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      <i data-lucide="${iconMap[type] || "bell"}"></i>
    </div>
    <div class="toast-body">
      <div class="toast-title">${escapeHtml(title)}</div>
      ${message ? `<div class="toast-msg">${escapeHtml(message)}</div>` : ""}
    </div>`;

  container.appendChild(toast);

  if (window.lucide) lucide.createIcons({ nodes: [toast] });

  setTimeout(() => {
    toast.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(16px)";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ── Topbar User Dropdown & Modals ────────────────────────────── */

function initUserDropdown() {
  const avatarBtn = document.getElementById("topbar-user-avatar");
  const dropdown = document.getElementById("user-dropdown-menu");
  if (!avatarBtn || !dropdown) return;

  avatarBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isVisible = dropdown.style.display === "block";
    dropdown.style.display = isVisible ? "none" : "block";
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !avatarBtn.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });

  document.getElementById("btn-menu-profile")?.addEventListener("click", () => {
    dropdown.style.display = "none";
    navigateTo("settings");
  });

  document.getElementById("btn-menu-org")?.addEventListener("click", () => {
    dropdown.style.display = "none";
    navigateTo("organization");
  });

  document.getElementById("btn-menu-reports")?.addEventListener("click", () => {
    dropdown.style.display = "none";
    navigateTo("reports");
  });

  document.getElementById("btn-menu-logout")?.addEventListener("click", () => {
    dropdown.style.display = "none";
    auth.logout();
    showToast("You have been safely signed out.", "info");
  });

  // Sidebar user card click -> settings
  document.getElementById("sidebar-user-card")?.addEventListener("click", () => {
    navigateTo("settings");
  });
}

/* ── Mobile Sidebar ───────────────────────────────────────────── */

function initMobileSidebar() {
  const hamburger = document.getElementById("btn-hamburger");
  const sidebar = document.getElementById("sidebar");
  if (!hamburger) return;

  hamburger.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  document.querySelectorAll(".nav-item[data-page]").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth <= 900) {
        sidebar.classList.remove("open");
      }
    });
  });

  document.addEventListener("click", (e) => {
    if (
      window.innerWidth <= 900 &&
      !sidebar.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      sidebar.classList.remove("open");
    }
  });
}

/* ── Keyboard Navigation ──────────────────────────────────────── */

function initKeyboardNav() {
  document.querySelectorAll(".nav-item[data-page]").forEach((item) => {
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        navigateTo(item.dataset.page);
      }
    });
  });
}

/* ── Escape HTML ──────────────────────────────────────────────── */

export function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ── Boot & Hash Listener ─────────────────────────────────────── */

window.addEventListener("hashchange", () => {
  const hash = window.location.hash.replace("#", "") || "dashboard";
  if (hash !== currentPage) {
    navigateTo(hash);
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  // Wire up sidebar nav clicks
  document.querySelectorAll(".nav-item[data-page]").forEach((item) => {
    item.addEventListener("click", () => navigateTo(item.dataset.page));
  });

  // Quick-register button in topbar
  document.getElementById("btn-quick-register")?.addEventListener("click", () => navigateTo("register"));

  initMobileSidebar();
  initKeyboardNav();
  initUserDropdown();

  // Setup topbar notification popover
  setupTopbarNotificationDropdown(navigateTo, showToast);

  // Sync user state
  if (!auth.isAuthenticated()) {
    // If not logged in, try to auto-fetch demo user so test suite and initial load work effortlessly
    const user = await auth.fetchMe();
    if (user) {
      updateTopbarUserUI(user);
    }
  } else {
    updateTopbarUserUI(auth.getUser());
  }

  // Initial routing from URL hash or default to dashboard
  const initialPage = window.location.hash.replace("#", "") || "dashboard";
  navigateTo(initialPage);
});
