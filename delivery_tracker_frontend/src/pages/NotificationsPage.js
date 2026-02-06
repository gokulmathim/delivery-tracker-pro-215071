import React from "react";
import { Layout } from "../components/Layout";
import { useNotifications } from "../state/NotificationContext";

/** PUBLIC_INTERFACE */
export function NotificationsPage() {
  /** Notification center; currently stubbed from frontend state. */
  const { items, clear } = useNotifications();

  return (
    <Layout
      title="Notifications"
      subtitle="Status updates and important events."
      actions={
        <button className="btn btnSmall" onClick={clear} disabled={items.length === 0}>
          Clear
        </button>
      }
    >
      <div className="card">
        <div className="cardBody">
          {items.length === 0 ? <div className="help">No notifications yet.</div> : null}

          {items.length > 0 ? (
            <table className="table" aria-label="Notifications">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Detail</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr key={n.id}>
                    <td>
                      <span className="badge">{n.kind || "info"}</span>
                    </td>
                    <td style={{ fontWeight: 800 }}>{n.title || "Update"}</td>
                    <td>{n.body || "—"}</td>
                    <td style={{ color: "rgba(17,24,39,0.65)" }}>{new Date(n.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card">
        <div className="cardBody">
          <div className="cardTitle">Backend notifications</div>
          <div className="cardHint">
            The current backend OpenAPI spec does not include a notifications endpoint; this panel is stubbed using realtime messages and user
            actions.
          </div>
        </div>
      </div>
    </Layout>
  );
}
