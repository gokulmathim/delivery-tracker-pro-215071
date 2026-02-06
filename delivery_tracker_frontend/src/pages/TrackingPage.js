import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { createRealtimeClient } from "../realtime/client";
import { useAuth } from "../state/AuthContext";
import { useDeliveries } from "../state/DeliveryContext";
import { useNotifications } from "../state/NotificationContext";

/** PUBLIC_INTERFACE */
export function TrackingPage() {
  /** Realtime tracking page subscribing to /realtime/ws updates. */
  const { session } = useAuth();
  const { deliveries, refreshDeliveries, selectedDelivery, loadDelivery } = useDeliveries();
  const { add } = useNotifications();
  const [sp, setSp] = useSearchParams();

  const [deliveryId, setDeliveryId] = useState(sp.get("delivery_id") || "");
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  const rtRef = useRef(null);

  useEffect(() => {
    refreshDeliveries();
  }, [refreshDeliveries]);

  useEffect(() => {
    const id = sp.get("delivery_id") || "";
    if (id && id !== deliveryId) setDeliveryId(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  useEffect(() => {
    if (!deliveryId) return;
    loadDelivery(deliveryId);
  }, [deliveryId, loadDelivery]);

  const realtime = useMemo(() => {
    if (!session?.accessToken) return null;
    return createRealtimeClient({
      getAccessToken: () => session.accessToken,
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onError: () => add({ kind: "error", title: "Realtime", body: "WebSocket error." }),
      onMessage: (msg) => {
        setLastMessage(msg);
        // Promote to notifications feed
        if (msg?.type === "status") {
          add({ kind: "info", title: "Status update", body: `Delivery ${msg.delivery_id}: ${msg.payload?.status || "updated"}` });
        }
        if (msg?.type === "location") {
          add({
            kind: "info",
            title: "Location update",
            body: `Delivery ${msg.delivery_id}: ${Number(msg.payload?.lat).toFixed(4)}, ${Number(msg.payload?.lng).toFixed(4)}`,
          });
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.accessToken]);

  useEffect(() => {
    // connect once per mount/session
    if (!realtime) return;
    try {
      rtRef.current = realtime;
      realtime.connect();
    } catch (e) {
      add({ kind: "error", title: "Realtime", body: e?.message || "Failed to connect." });
    }
    return () => {
      try {
        realtime.close();
      } catch {
        // ignore
      }
    };
  }, [add, realtime]);

  useEffect(() => {
    if (!realtime || !connected) return;
    if (!deliveryId) return;

    try {
      realtime.subscribe(deliveryId);
      add({ kind: "success", title: "Subscribed", body: `Realtime updates enabled for ${deliveryId}.` });
    } catch (e) {
      add({ kind: "error", title: "Subscribe failed", body: e?.message || "Could not subscribe." });
    }
    // Best-effort unsubscribe on change
    return () => {
      try {
        realtime.unsubscribe(deliveryId);
      } catch {
        // ignore
      }
    };
  }, [add, connected, deliveryId, realtime]);

  const marker = useMemo(() => {
    const lat = selectedDelivery?.current_location_lat;
    const lng = selectedDelivery?.current_location_lng;

    // Fallback: if we got a realtime location payload, use it.
    if ((lat == null || lng == null) && lastMessage?.type === "location") {
      return {
        lat: Number(lastMessage.payload?.lat),
        lng: Number(lastMessage.payload?.lng),
      };
    }
    if (lat == null || lng == null) return null;
    return { lat, lng };
  }, [lastMessage, selectedDelivery?.current_location_lat, selectedDelivery?.current_location_lng]);

  const xy = useMemo(() => {
    // Very simple normalization into a box: map lat/lng into [0..100] for demo.
    if (!marker || !Number.isFinite(marker.lat) || !Number.isFinite(marker.lng)) return null;
    const x = ((marker.lng + 180) / 360) * 100;
    const y = (1 - (marker.lat + 90) / 180) * 100;
    return { x, y };
  }, [marker]);

  return (
    <Layout
      title="Live tracking"
      subtitle="Realtime status and location updates via WebSocket."
      actions={
        <span className="pill">
          <span aria-hidden="true">{connected ? "🟢" : "⚪"}</span>
          <span>{connected ? "Connected" : "Disconnected"}</span>
        </span>
      }
    >
      <div className="grid2">
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Delivery</div>
              <div className="cardHint">Select which delivery to subscribe to.</div>
            </div>
          </div>
          <div className="cardBody">
            <div className="label">Delivery</div>
            <select
              className="select"
              value={deliveryId}
              onChange={(e) => {
                const id = e.target.value;
                setDeliveryId(id);
                setSp(id ? { delivery_id: id } : {});
              }}
            >
              <option value="">—</option>
              {deliveries.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.tracking_number} • {d.current_status.replaceAll("_", " ")}
                </option>
              ))}
            </select>

            <div className="divider" />

            <div className="grid2">
              <Field title="Tracking" value={selectedDelivery?.tracking_number || "—"} />
              <Field title="Status" value={selectedDelivery?.current_status?.replaceAll("_", " ") || "—"} />
            </div>

            <div className="divider" />

            <div className="help">
              Backend WS endpoint: <code>/realtime/ws?token=&lt;access_token&gt;</code>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Realtime map</div>
              <div className="cardHint">Simple placeholder map (lat/lng marker) updated by websocket events.</div>
            </div>
          </div>
          <div className="cardBody">
            <div className="mapBox" aria-label="Map placeholder">
              <div className="mapGrid" aria-hidden="true" />
              {xy ? <div className="mapMarker" style={{ left: `${xy.x}%`, top: `${xy.y}%` }} title="Current location" /> : null}
              <div className="mapLegend">
                <div className="kv">
                  <span>Lat</span>
                  <strong>{marker?.lat != null && Number.isFinite(marker.lat) ? marker.lat.toFixed(5) : "—"}</strong>
                </div>
                <div className="kv">
                  <span>Lng</span>
                  <strong>{marker?.lng != null && Number.isFinite(marker.lng) ? marker.lng.toFixed(5) : "—"}</strong>
                </div>
                <div className="kv">
                  <span>Last msg</span>
                  <strong>{lastMessage?.type || "—"}</strong>
                </div>
              </div>
            </div>

            <div className="divider" />

            <div className="help">
              Note: this is a minimal map visualization. It validates realtime wiring and shows live marker movement without adding a heavy map SDK.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Field({ title, value }) {
  return (
    <div>
      <div className="label">{title}</div>
      <div style={{ fontWeight: 800 }}>{value}</div>
    </div>
  );
}
