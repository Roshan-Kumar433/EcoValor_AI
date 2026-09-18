/**
 * notifications.js — Platform Alert & Notification Center
 * --------------------------------------------------------
 * EcoValor AI — Industrial Waste Valorization Platform
 * Provides both the full-page notification hub and topbar popover.
 */

import api from "./api.js";

export async function renderNotifications(container, navigateTo, showToast) {
  container.innerHTML = `
    <div class="page-loading-skeleton">
      <div class="skeleton-header"></div>
      <div class="skeleton-card"></div>
    </div>
  `;

  try {
    const res = await api.get("/notifications/list");
    const notifications = res.items || [];
    const unreadCount = res.unread_count || 0;

    container.innerHTML = `
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Notifications & Operational Alerts</h1>
          <p class="page-subtitle">Real-time alerts, stream anomalies, and compliance updates across your facility</p>
        </div>
        <div class="page-header-actions">
          <button id="btn-mark-all-read-page" class="btn btn-secondary" ${unreadCount === 0 ? "disabled" : ""}>
            <i data-lucide="check-check"></i>
            <span>Mark All as Read</span>
          </button>
        </div>
      </div>

      <!-- Notification Filter Tabs -->
      <div class="notification-tabs-bar">
        <button class="notif-tab active" data-category="all">
          <span>All Notifications</span>
          <span class="notif-tab-count">${notifications.length}</span>
        </button>
        <button class="notif-tab" data-category="alert">
          <i data-lucide="alert-triangle" style="width:14px;height:14px;color:var(--color-warning);"></i>
          <span>Contamination & Hazards</span>
        </button>
        <button class="notif-tab" data-category="valorization">
          <i data-lucide="cpu" style="width:14px;height:14px;color:var(--color-primary);"></i>
          <span>AI Pipeline</span>
        </button>
        <button class="notif-tab" data-category="system">
          <i data-lucide="info" style="width:14px;height:14px;color:var(--color-info);"></i>
          <span>System & Security</span>
        </button>
      </div>

      <!-- Notifications List Container -->
      <div class="notification-feed-container" id="notif-feed">
        ${notifications.length > 0
          ? notifications.map(n => renderNotificationCard(n)).join("")
          : `
            <div class="empty-state-card" style="padding:60px 20px;">
              <div class="empty-state-icon"><i data-lucide="bell-off"></i></div>
              <h3>No notifications in your inbox</h3>
              <p>Your facility operations and waste valorization streams are operating within normal parameters.</p>
            </div>
          `}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Event listeners
    setupNotificationEvents(container, navigateTo, showToast);

  } catch (err) {
    container.innerHTML = `
      <div class="empty-state-card">
        <i data-lucide="alert-triangle" style="width:48px;height:48px;color:var(--color-danger);"></i>
        <h3>Failed to load notifications</h3>
        <p>${err.message}</p>
        <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}

function renderNotificationCard(n) {
  const iconMap = {
    alert: { icon: "alert-triangle", class: "notif-icon-warning" },
    compliance: { icon: "shield-alert", class: "notif-icon-primary" },
    valorization: { icon: "sparkles", class: "notif-icon-teal" },
    system: { icon: "info", class: "notif-icon-info" },
  };

  const iconInfo = iconMap[n.category] || iconMap.system;
  const timeAgo = formatTimeAgo(n.created_at);

  return `
    <div class="notif-card ${n.is_read ? 'is-read' : 'is-unread'}" data-id="${n.id}" data-category="${n.category}">
      <div class="notif-card-icon ${iconInfo.class}">
        <i data-lucide="${iconInfo.icon}"></i>
      </div>
      <div class="notif-card-content">
        <div class="notif-card-header">
          <div class="notif-card-title">
            ${!n.is_read ? '<span class="unread-dot"></span>' : ''}
            <span>${escapeHtml(n.title)}</span>
          </div>
          <div class="notif-card-time">${timeAgo}</div>
        </div>
        <p class="notif-card-message">${escapeHtml(n.message)}</p>
        <div class="notif-card-actions">
          ${n.link ? `
            <button class="btn btn-secondary btn-sm btn-notif-action" data-link="${n.link}">
              <i data-lucide="arrow-right" style="width:14px;height:14px;"></i>
              <span>View in ${formatLinkName(n.link)}</span>
            </button>
          ` : ''}
          ${!n.is_read ? `
            <button class="btn btn-ghost btn-sm btn-mark-read" data-id="${n.id}">
              <i data-lucide="check" style="width:14px;height:14px;"></i>
              <span>Mark as Read</span>
            </button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function setupNotificationEvents(container, navigateTo, showToast) {
  // Category filter tabs
  const tabs = container.querySelectorAll(".notif-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      const cat = tab.getAttribute("data-category");
      const cards = container.querySelectorAll(".notif-card");
      cards.forEach(card => {
        const cardCat = card.getAttribute("data-category");
        if (cat === "all" || cardCat === cat) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  });

  // Mark single as read
  container.addEventListener("click", async (e) => {
    const markBtn = e.target.closest(".btn-mark-read");
    if (markBtn) {
      const notifId = markBtn.getAttribute("data-id");
      try {
        await api.post(`/notifications/${notifId}/read`);
        const card = container.querySelector(`.notif-card[data-id="${notifId}"]`);
        if (card) {
          card.classList.remove("is-unread");
          card.classList.add("is-read");
          const dot = card.querySelector(".unread-dot");
          if (dot) dot.remove();
          markBtn.remove();
        }
        updateGlobalNotificationBadge();
      } catch (err) {
        showToast(err.message, "error");
      }
      return;
    }

    // Action link navigation
    const actionBtn = e.target.closest(".btn-notif-action");
    if (actionBtn) {
      const link = actionBtn.getAttribute("data-link");
      if (link) {
        navigateTo(link);
      }
    }
  });

  // Mark all read on page
  document.getElementById("btn-mark-all-read-page")?.addEventListener("click", async () => {
    try {
      await api.post("/notifications/read-all");
      showToast("All notifications marked as read.", "success");
      renderNotifications(container, navigateTo, showToast);
      updateGlobalNotificationBadge();
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

/**
 * Topbar Dropdown Initialization
 */
export async function setupTopbarNotificationDropdown(navigateTo, showToast) {
  const bellBtn = document.getElementById("btn-notification-bell");
  const dropdown = document.getElementById("notification-dropdown-menu");
  if (!bellBtn || !dropdown) return;

  // Toggle dropdown
  bellBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const isVisible = dropdown.style.display === "block";
    if (isVisible) {
      dropdown.style.display = "none";
    } else {
      dropdown.style.display = "block";
      await populateDropdownContent(dropdown, navigateTo, showToast);
    }
  });

  // Close when clicking outside
  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !bellBtn.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });

  // Initial badge update
  updateGlobalNotificationBadge();
}

async function populateDropdownContent(dropdown, navigateTo, showToast) {
  try {
    const res = await api.get("/notifications/list?unread=true");
    const unread = res.items || [];

    dropdown.innerHTML = `
      <div class="notif-dropdown-header">
        <div style="font-weight:700;font-size:0.9rem;color:var(--color-text-primary);">
          Notifications (${res.unread_count || 0})
        </div>
        ${unread.length > 0 ? `
          <button id="btn-dropdown-mark-all" class="btn-text-link" style="font-size:0.75rem;">
            Mark all read
          </button>
        ` : ''}
      </div>

      <div class="notif-dropdown-body">
        ${unread.length > 0 ? unread.slice(0, 5).map(n => `
          <div class="notif-dropdown-item" data-id="${n.id}" data-link="${n.link || 'notifications'}">
            <div class="notif-dropdown-item-title">${escapeHtml(n.title)}</div>
            <div class="notif-dropdown-item-msg">${escapeHtml(n.message)}</div>
            <div class="notif-dropdown-item-time">${formatTimeAgo(n.created_at)}</div>
          </div>
        `).join("") : `
          <div style="padding:24px;text-align:center;color:var(--color-text-muted);font-size:0.8125rem;">
            <i data-lucide="check-circle" style="width:28px;height:28px;margin-bottom:6px;color:var(--color-primary);"></i>
            <div>All caught up! No unread alerts.</div>
          </div>
        `}
      </div>

      <div class="notif-dropdown-footer">
        <button id="btn-dropdown-view-all" class="btn btn-secondary btn-sm" style="width:100%;">
          <span>Open Full Notification Center</span>
          <i data-lucide="arrow-right" style="width:14px;height:14px;"></i>
        </button>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Mark all read in dropdown
    document.getElementById("btn-dropdown-mark-all")?.addEventListener("click", async (e) => {
      e.stopPropagation();
      await api.post("/notifications/read-all");
      updateGlobalNotificationBadge();
      populateDropdownContent(dropdown, navigateTo, showToast);
      showToast("All notifications marked as read.", "success");
    });

    // View all button
    document.getElementById("btn-dropdown-view-all")?.addEventListener("click", () => {
      dropdown.style.display = "none";
      navigateTo("notifications");
    });

    // Item click
    dropdown.querySelectorAll(".notif-dropdown-item").forEach(item => {
      item.addEventListener("click", async () => {
        const id = item.getAttribute("data-id");
        const link = item.getAttribute("data-link");
        try {
          await api.post(`/notifications/${id}/read`);
          updateGlobalNotificationBadge();
        } catch {
          // Ignore
        }
        dropdown.style.display = "none";
        navigateTo(link || "notifications");
      });
    });

  } catch {
    dropdown.innerHTML = `<div style="padding:16px;text-align:center;color:var(--color-danger);">Failed to load alerts.</div>`;
  }
}

export async function updateGlobalNotificationBadge() {
  try {
    const res = await api.get("/notifications/list?unread=true");
    const count = res.unread_count ?? 0;
    const badge = document.getElementById("notif-badge-counter");
    const sidebarBadge = document.getElementById("sidebar-notif-badge");

    if (badge) {
      if (count > 0) {
        badge.textContent = count > 9 ? "9+" : count;
        badge.style.display = "flex";
      } else {
        badge.style.display = "none";
      }
    }

    if (sidebarBadge) {
      if (count > 0) {
        sidebarBadge.textContent = count;
        sidebarBadge.style.display = "inline-block";
      } else {
        sidebarBadge.style.display = "none";
      }
    }
  } catch {
    // Ignore
  }
}

function formatTimeAgo(isoString) {
  if (!isoString) return "Recently";
  const date = new Date(isoString);
  const diffSec = Math.floor((new Date() - date) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatLinkName(link) {
  const names = {
    dashboard: "Dashboard",
    history: "Waste Inventory",
    analysis: "AI Analysis",
    reports: "Reports Hub",
    organization: "Organization",
    settings: "Settings",
  };
  return names[link] || link;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
