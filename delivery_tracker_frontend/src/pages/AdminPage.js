import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "../components/Layout";
import { useAuth } from "../state/AuthContext";
import { useNotifications } from "../state/NotificationContext";

/** PUBLIC_INTERFACE */
export function AdminPage() {
  /** Admin panel to manage users and deliveries via admin endpoints. */
  const { api } = useAuth();
  const { add } = useNotifications();

  const [users, setUsers] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create delivery form
  const [trackingNumber, setTrackingNumber] = useState("");
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");

  const userOptions = useMemo(() => users.map((u) => ({ id: u.id, email: u.email })), [users]);

  async function refresh() {
    setLoading(true);
    try {
      const [u, d] = await Promise.all([api.adminListUsers(), api.adminListDeliveries()]);
      setUsers(u);
      setDeliveries(d);
    } catch (e) {
      add({ kind: "error", title: "Admin", body: e?.message || "Failed to load admin data." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreateDelivery(e) {
    e.preventDefault();
    if (!trackingNumber || !userId) return;

    setLoading(true);
    try {
      const created = await api.adminCreateDelivery({
        tracking_number: trackingNumber,
        user_id: userId,
        title: title || null,
      });
      add({ kind: "success", title: "Delivery created", body: created.tracking_number });
      setTrackingNumber("");
      setTitle("");
      await refresh();
    } catch (e2) {
      add({ kind: "error", title: "Create delivery", body: e2?.message || "Failed to create delivery." });
    } finally {
      setLoading(false);
    }
  }

  async function onDeleteDelivery(id) {
    if (!window.confirm("Delete this delivery?")) return;
    setLoading(true);
    try {
      await api.adminDeleteDelivery(id);
      add({ kind: "success", title: "Delivery deleted", body: id });
      await refresh();
    } catch (e) {
      add({ kind: "error", title: "Delete delivery", body: e?.message || "Failed to delete." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout
      title="Admin"
      subtitle="Manage users and deliveries."
      actions={
        <button className="btn btnSmall" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      }
    >
      <div className="grid2">
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Users</div>
              <div className="cardHint">Admin-only list of users.</div>
            </div>
          </div>
          <div className="cardBody">
            {loading && users.length === 0 ? <div className="loading">Loading users…</div> : null}
            <table className="table" aria-label="Users">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Active</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 800 }}>{u.email}</td>
                    <td>
                      <span className="badge">{u.role}</span>
                    </td>
                    <td>{u.is_active ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="divider" />

            <div className="help">
              Note: user creation/update endpoints exist in the backend; this UI keeps to minimal management requested (list + delivery controls).
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Create delivery</div>
              <div className="cardHint">Requires a unique tracking number and an owner user.</div>
            </div>
          </div>
          <div className="cardBody">
            <form className="formStack" onSubmit={onCreateDelivery}>
              <div>
                <div className="label">Tracking number</div>
                <input className="input" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} required />
              </div>

              <div>
                <div className="label">Owner user</div>
                <select className="select" value={userId} onChange={(e) => setUserId(e.target.value)} required>
                  <option value="">—</option>
                  {userOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="label">Title (optional)</div>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New package" />
              </div>

              <button className="btn btnPrimary" type="submit" disabled={loading}>
                {loading ? "Working…" : "Create"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div style={{ height: 16 }} />

      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Deliveries (admin)</div>
            <div className="cardHint">All deliveries in the system.</div>
          </div>
        </div>
        <div className="cardBody">
          {loading && deliveries.length === 0 ? <div className="loading">Loading deliveries…</div> : null}
          <table className="table" aria-label="Admin deliveries">
            <thead>
              <tr>
                <th>Tracking</th>
                <th>Status</th>
                <th>Owner</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 800 }}>{d.tracking_number}</td>
                  <td>
                    <span className="badge">{d.current_status.replaceAll("_", " ")}</span>
                  </td>
                  <td style={{ color: "rgba(17,24,39,0.65)" }}>{d.user_id}</td>
                  <td style={{ textAlign: "right" }}>
                    <button className="btn btnSmall btnDanger" onClick={() => onDeleteDelivery(d.id)} disabled={loading}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {deliveries.length === 0 && !loading ? <div className="help">No deliveries.</div> : null}
        </div>
      </div>
    </Layout>
  );
}
