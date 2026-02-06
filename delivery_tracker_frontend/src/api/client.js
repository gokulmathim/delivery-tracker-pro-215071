import { getBackendBaseUrl } from "../config";

/**
 * @typedef {"admin"|"user"|"driver"} UserRole
 *
 * @typedef {Object} TokenPairResponse
 * @property {string} access_token
 * @property {string} refresh_token
 * @property {string} token_type
 * @property {number} expires_in_seconds
 *
 * @typedef {Object} UserPublic
 * @property {string} id
 * @property {string} email
 * @property {string|null} full_name
 * @property {UserRole} role
 * @property {boolean} is_active
 * @property {string} created_at
 * @property {string} updated_at
 *
 * @typedef {"created"|"picked_up"|"in_transit"|"out_for_delivery"|"delivered"|"exception"|"cancelled"} DeliveryStatus
 *
 * @typedef {Object} DeliveryPublic
 * @property {string} id
 * @property {string} tracking_number
 * @property {string} user_id
 * @property {string|null} assigned_driver_id
 * @property {string|null} carrier
 * @property {string|null} title
 * @property {string|null} description
 * @property {string|null} origin_address
 * @property {string|null} destination_address
 * @property {string|null} scheduled_delivery_date
 * @property {DeliveryStatus} current_status
 * @property {number|null} current_location_lat
 * @property {number|null} current_location_lng
 * @property {string} created_at
 * @property {string} updated_at
 *
 * @typedef {Object} DeliveryHistoryResponse
 * @property {DeliveryPublic} delivery
 * @property {Array<{id:string,delivery_id:string,status:DeliveryStatus,occurred_at:string,note?:string|null,created_by_user_id?:string|null}>} status_events
 * @property {Array<{id:string,delivery_id:string,pinged_at:string,lat:number,lng:number,accuracy_m?:number|null,speed_mps?:number|null,heading_deg?:number|null,source?:string|null}>} location_pings
 */

/**
 * Basic error type for API failures.
 */
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function safeReadJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Create a REST client with token refresh handling.
 * The caller provides token accessors so this module stays UI-framework agnostic.
 */

/** PUBLIC_INTERFACE */
export function createApiClient({ getAccessToken, getRefreshToken, onTokenPair, onAuthFailure }) {
  /**
   * @param {string} path
   * @param {RequestInit & { retry?: boolean }} init
   */
  async function request(path, init = {}) {
    const base = getBackendBaseUrl();
    const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;

    const headers = new Headers(init.headers || {});
    headers.set("Content-Type", "application/json");

    const access = getAccessToken?.();
    if (access) headers.set("Authorization", `Bearer ${access}`);

    const res = await fetch(url, { ...init, headers });

    // Attempt refresh once if unauthorized.
    if (res.status === 401 && init.retry !== false && getRefreshToken?.()) {
      try {
        const refreshed = await rawRefresh(getRefreshToken());
        onTokenPair?.(refreshed);

        const headers2 = new Headers(init.headers || {});
        headers2.set("Content-Type", "application/json");
        headers2.set("Authorization", `Bearer ${refreshed.access_token}`);

        const res2 = await fetch(url, { ...init, headers: headers2, retry: false });
        if (!res2.ok) {
          const body = await safeReadJson(res2);
          throw new ApiError(body?.detail || `Request failed (${res2.status})`, res2.status, body);
        }
        return res2;
      } catch (e) {
        onAuthFailure?.();
        throw e;
      }
    }

    if (!res.ok) {
      const body = await safeReadJson(res);
      throw new ApiError(body?.detail || `Request failed (${res.status})`, res.status, body);
    }
    return res;
  }

  async function rawRefresh(refreshToken) {
    const base = getBackendBaseUrl();
    const res = await fetch(`${base}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      const body = await safeReadJson(res);
      throw new ApiError(body?.detail || `Refresh failed (${res.status})`, res.status, body);
    }
    /** @type {TokenPairResponse} */
    const data = await res.json();
    return data;
  }

  return {
    // Auth
    /** PUBLIC_INTERFACE */
    async register({ email, password, full_name }) {
      const res = await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, full_name }),
      });
      /** @type {UserPublic} */
      const data = await res.json();
      return data;
    },

    /** PUBLIC_INTERFACE */
    async login({ email, password }) {
      const res = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      /** @type {TokenPairResponse} */
      const data = await res.json();
      return data;
    },

    /** PUBLIC_INTERFACE */
    async logout(refreshToken) {
      const res = await request("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      return res.json();
    },

    /** PUBLIC_INTERFACE */
    async me() {
      const res = await request("/me", { method: "GET" });
      /** @type {UserPublic} */
      const data = await res.json();
      return data;
    },

    // Deliveries
    /** PUBLIC_INTERFACE */
    async listDeliveries({ status_filter } = {}) {
      const qs = status_filter ? `?status_filter=${encodeURIComponent(status_filter)}` : "";
      const res = await request(`/deliveries${qs}`, { method: "GET" });
      /** @type {DeliveryPublic[]} */
      const data = await res.json();
      return data;
    },

    /** PUBLIC_INTERFACE */
    async getDelivery(deliveryId) {
      const res = await request(`/deliveries/${encodeURIComponent(deliveryId)}`, { method: "GET" });
      /** @type {DeliveryPublic} */
      const data = await res.json();
      return data;
    },

    /** PUBLIC_INTERFACE */
    async getDeliveryHistory(deliveryId, { limit_status_events = 100, limit_location_pings = 200 } = {}) {
      const qs = `?limit_status_events=${encodeURIComponent(limit_status_events)}&limit_location_pings=${encodeURIComponent(
        limit_location_pings
      )}`;
      const res = await request(`/deliveries/${encodeURIComponent(deliveryId)}/history${qs}`, { method: "GET" });
      /** @type {DeliveryHistoryResponse} */
      const data = await res.json();
      return data;
    },

    // Admin
    /** PUBLIC_INTERFACE */
    async adminListUsers() {
      const res = await request("/admin/users", { method: "GET" });
      /** @type {UserPublic[]} */
      const data = await res.json();
      return data;
    },

    /** PUBLIC_INTERFACE */
    async adminListDeliveries() {
      const res = await request("/admin/deliveries", { method: "GET" });
      /** @type {DeliveryPublic[]} */
      const data = await res.json();
      return data;
    },

    /** PUBLIC_INTERFACE */
    async adminCreateDelivery(payload) {
      const res = await request("/admin/deliveries", { method: "POST", body: JSON.stringify(payload) });
      /** @type {DeliveryPublic} */
      const data = await res.json();
      return data;
    },

    /** PUBLIC_INTERFACE */
    async adminDeleteDelivery(deliveryId) {
      const res = await request(`/admin/deliveries/${encodeURIComponent(deliveryId)}`, { method: "DELETE" });
      return res.json();
    },
  };
}
