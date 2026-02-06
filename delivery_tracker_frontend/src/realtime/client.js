import { getBackendWsBaseUrl } from "../config";

/**
 * @typedef {Object} RealtimeMessage
 * @property {"status"|"location"} type
 * @property {string} delivery_id
 * @property {any} payload
 * @property {string} emitted_at
 */

/** PUBLIC_INTERFACE */
export function createRealtimeClient({ getAccessToken, onMessage, onError, onOpen, onClose }) {
  /**
   * Connects to backend websocket with ?token=<accessToken>.
   * Backend endpoint: /realtime/ws
   */
  let ws = null;
  let isOpen = false;

  function connect() {
    const token = getAccessToken?.();
    if (!token) throw new Error("Cannot connect realtime: missing access token");

    const base = getBackendWsBaseUrl();
    const url = `${base}/realtime/ws?token=${encodeURIComponent(token)}`;

    ws = new WebSocket(url);

    ws.onopen = () => {
      isOpen = true;
      onOpen?.();
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        onMessage?.(msg);
      } catch (e) {
        onError?.(e);
      }
    };

    ws.onerror = (evt) => {
      onError?.(evt);
    };

    ws.onclose = () => {
      isOpen = false;
      onClose?.();
    };

    return ws;
  }

  function ensureOpen() {
    if (!ws || !isOpen) throw new Error("Realtime socket not open");
  }

  return {
    /** PUBLIC_INTERFACE */
    connect,

    /** PUBLIC_INTERFACE */
    close() {
      if (ws) ws.close();
      ws = null;
      isOpen = false;
    },

    /** PUBLIC_INTERFACE */
    subscribe(deliveryId) {
      ensureOpen();
      ws.send(JSON.stringify({ action: "subscribe", delivery_id: deliveryId }));
    },

    /** PUBLIC_INTERFACE */
    unsubscribe(deliveryId) {
      ensureOpen();
      ws.send(JSON.stringify({ action: "unsubscribe", delivery_id: deliveryId }));
    },

    /** PUBLIC_INTERFACE */
    isConnected() {
      return Boolean(ws && isOpen);
    },
  };
}
