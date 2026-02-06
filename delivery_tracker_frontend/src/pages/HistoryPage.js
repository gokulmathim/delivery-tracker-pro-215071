import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useDeliveries } from "../state/DeliveryContext";
import { useNotifications } from "../state/NotificationContext";

/** PUBLIC_INTERFACE */
export function HistoryPage() {
  /** Delivery history center. */
  const { deliveries, refreshDeliveries, history, loadHistory, loadingDetail } = useDeliveries();
  const { add } = useNotifications();
  const [sp, setSp] = useSearchParams();
  const initialId = sp.get("delivery_id") || "";
  const [deliveryId, setDeliveryId] = useState(initialId);

  useEffect(() => {
    refreshDeliveries();
  }, [refreshDeliveries]);

  useEffect(() => {
    if (deliveryId) loadHistory(deliveryId);
  }, [deliveryId, loadHistory]);

  useEffect(() => {
    if (initialId && initialId !== deliveryId) setDeliveryId(initialId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialId]);

  const selectedTitle = useMemo(() => deliveries.find((d) => d.id === deliveryId)?.tracking_number, [deliveries, deliveryId]);

  return (
    <Layout
      title="Delivery history"
      subtitle={selectedTitle ? `Timeline for ${selectedTitle}` : "Select a delivery to view status & location history."}
      actions={
        <button
          className="btn btnSmall"
          onClick={() => {
            refreshDeliveries();
            add({ kind: "info", title: "History", body: "Delivery list refreshed." });
          }}
        >
          Refresh list
        </button>
      }
    >
      <div className="grid2">
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Select delivery</div>
              <div className="cardHint">Choose a delivery to inspect its events.</div>
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

            {loadingDetail ? <div className="loading">Loading history…</div> : null}

            {!loadingDetail && history ? (
              <>
                <div className="label">Status timeline</div>
                <div style={{ maxHeight: 240, overflow: "auto" }}>
                  <table className="table" aria-label="Status events">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>When</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.status_events.map((e) => (
                        <tr key={e.id}>
                          <td style={{ fontWeight: 800 }}>{e.status.replaceAll("_", " ")}</td>
                          <td style={{ color: "rgba(17,24,39,0.65)" }}>{new Date(e.occurred_at).toLocaleString()}</td>
                          <td>{e.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="help">Pick a delivery to load its history.</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Location pings</div>
              <div className="cardHint">Most recent first.</div>
            </div>
          </div>
          <div className="cardBody">
            {!history ? <div className="help">No history loaded.</div> : null}
            {history ? (
              <div style={{ maxHeight: 360, overflow: "auto" }}>
                <table className="table" aria-label="Location pings">
                  <thead>
                    <tr>
                      <th>Lat</th>
                      <th>Lng</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.location_pings.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700 }}>{p.lat.toFixed(5)}</td>
                        <td style={{ fontWeight: 700 }}>{p.lng.toFixed(5)}</td>
                        <td style={{ color: "rgba(17,24,39,0.65)" }}>{new Date(p.pinged_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}
