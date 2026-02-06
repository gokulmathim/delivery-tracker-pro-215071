/**
 * Central configuration for the frontend.
 * CRA env vars must be prefixed with REACT_APP_.
 */

/** PUBLIC_INTERFACE */
export function getBackendBaseUrl() {
  /**
   * Returns the HTTP base URL for the backend.
   *
   * Supported env vars (preferred first):
   * - REACT_APP_API_BASE
   * - REACT_APP_BACKEND_URL
   *
   * Defaults to http://localhost:3001 for local dev.
   */
  return (process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "http://localhost:3001").replace(/\/*$/, "");
}

/** PUBLIC_INTERFACE */
export function getBackendWsBaseUrl() {
  /**
   * Returns the WS base URL for the backend websocket endpoint.
   *
   * Supported env vars (preferred first):
   * - REACT_APP_WS_URL
   *
   * Legacy support:
   * - REACT_APP_BACKEND_WS_URL
   *
   * Otherwise derived from getBackendBaseUrl() by converting http(s) -> ws(s).
   */
  const explicit = process.env.REACT_APP_WS_URL || process.env.REACT_APP_BACKEND_WS_URL;
  if (explicit) return explicit.replace(/\/*$/, "");

  const httpBase = getBackendBaseUrl();
  // Convert http(s) -> ws(s)
  return httpBase.startsWith("https://") ? httpBase.replace("https://", "wss://") : httpBase.replace("http://", "ws://");
}
