/**
 * Central configuration for the frontend.
 * CRA env vars must be prefixed with REACT_APP_.
 */

/** PUBLIC_INTERFACE */
export function getBackendBaseUrl() {
  /**
   * Returns the HTTP base URL for the backend.
   * Configure with REACT_APP_BACKEND_URL (e.g., http://localhost:3001).
   */
  return (process.env.REACT_APP_BACKEND_URL || "http://localhost:3001").replace(/\/+$/, "");
}

/** PUBLIC_INTERFACE */
export function getBackendWsBaseUrl() {
  /**
   * Returns the WS base URL for the backend websocket endpoint.
   * Derived from backend base URL unless REACT_APP_BACKEND_WS_URL is set.
   */
  const explicit = process.env.REACT_APP_BACKEND_WS_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const httpBase = getBackendBaseUrl();
  // Convert http(s) -> ws(s)
  return httpBase.startsWith("https://") ? httpBase.replace("https://", "wss://") : httpBase.replace("http://", "ws://");
}
