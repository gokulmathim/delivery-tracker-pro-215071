import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useDeliveries } from "../state/DeliveryContext";
import { useNotifications } from "../state/NotificationContext";

/** PUBLIC_INTERFACE */
export function DeliveriesPage() {
  /** List deliveries for the current user/driver/admin. */
  const nav = useNavigate();
  const { deliveries, loadingList, error, refreshDeliveries } = useDeliveries();
  const { add } = useNotifications();

  useEffect(() => {
    refreshDeliveries();
  }, [refreshDeliveries]);

  useEffect(() => {
    if (error) add({ kind: "error", title: "Deliveries", body: error });
  }, [add, error]);

  return (
    <Layout title="Deliveries" subtitle="Your current deliveries and latest status.">
      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Active list</div>
            <div className="cardHint">Click a row to view details, history, and realtime tracking.</div>
          </div>
          <button className="btn btnSmall" onClick={() => refreshDeliveries()} disabled={loadingList}>
            {loadingList ? "Refreshing…" : "Refresh"}
          </button>
        </div>
        <div className="cardBody">
          {loadingList ? <div className="loading">Loading deliveries…</div> : null}
          {!loadingList && deliveries.length === 0 ? <div className="help">No deliveries found.</div> : null}

          {deliveries.length > 0 ? (
            <table className="table" aria-label="Deliveries table">
              <thead>
                <tr>
                  <th>Tracking</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr
                    key={d.id}
                    className="rowHover"
                    onClick={() => nav(`/deliveries/${d.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        nav(`/deliveries/${d.id}`);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open delivery ${d.tracking_number}`}
                  >
                    <td style={{ fontWeight: 800 }}>{d.tracking_number}</td>
                    <td>{d.title || "—"}</td>
                    <td>
                      <StatusBadge status={d.current_status} />
                    </td>
                    <td style={{ color: "rgba(17,24,39,0.65)" }}>{new Date(d.updated_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}

function StatusBadge({ status }) {
  const cls =
    status === "delivered"
      ? "badge badgeSuccess"
      : status === "exception" || status === "cancelled"
        ? "badge badgeError"
        : "badge";

  return <span className={cls}>{status.replaceAll("_", " ")}</span>;
}
