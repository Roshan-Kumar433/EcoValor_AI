/**
 * api.js — Centralised API client for EcoValor AI
 * ------------------------------------------------
 * Handles JSON and multipart requests, base URL resolution, and auth tokens.
 */

const API_BASE = window.location.origin.includes("5000")
  ? `${window.location.origin}/api`
  : "http://localhost:5000/api";

function getHeaders(customHeaders = {}) {
  const headers = { ...customHeaders };
  const token = localStorage.getItem("ecovalor_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

const api = {
  API_BASE,

  /**
   * GET JSON from an API endpoint
   */
  async get(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      headers: getHeaders({ "Accept": "application/json" })
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody.errors ? errBody.errors.join(", ") : `API ${res.status}: ${path}`;
      throw new Error(msg);
    }
    return res.json();
  },

  /**
   * POST JSON to an API endpoint
   */
  async post(path, body = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: getHeaders({
        "Content-Type": "application/json",
        "Accept": "application/json"
      }),
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.errors ? data.errors.join(", ") : `API ${res.status}: ${path}`;
      throw new Error(msg);
    }
    return data;
  },

  /**
   * PUT JSON to an API endpoint
   */
  async put(path, body = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "PUT",
      headers: getHeaders({
        "Content-Type": "application/json",
        "Accept": "application/json"
      }),
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.errors ? data.errors.join(", ") : `API ${res.status}: ${path}`;
      throw new Error(msg);
    }
    return data;
  },

  /**
   * POST multipart/form-data (used for waste registration with image upload)
   */
  async postForm(path, formData) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: getHeaders(), // browser automatically adds Content-Type with multipart boundary
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.errors ? data.errors.join(", ") : `API ${res.status}: ${path}`;
      throw new Error(msg);
    }
    return data;
  },

  /**
   * Build a URL for a waste image
   */
  imageUrl(filename) {
    if (!filename) return null;
    return `${API_BASE}/waste/uploads/${filename}`;
  },
};

export default api;
