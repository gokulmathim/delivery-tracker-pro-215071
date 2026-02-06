import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useDeliveries } from "../state/DeliveryContext";
import { useNotifications } from "../state/NotificationContext";

/** PUBLIC_INTERFACE */
export function DeliveryDetailPage() {
  /** Delivery detail page wired to /deliveries/{id} and /deliveries/{id}/history. */
  const { deliveryId } = useParams();
  const { selectedDelivery, history, loadingDetail, error, loadDelivery, loadHistory } = useDeliveries();
  const { add } = useNotifications();

  useEffect(() => {
    if (!deliveryId) return;
    loadDelivery(deliveryId);
    loadHistory(deliveryId);
  }, [deliveryId, loadDelivery, loadHistory]);

  useEffect(() => {
    if (error) add({ kind: "error", title: "Delivery", body: error });
  }, [add, error]);

  const d = selectedDelivery;

  return (
    <Layout
      title="Delivery details"
      subtitle={d ? `Tracking ${d.tracking_number}` : "Loading…"}
      actions={
        deliveryId ? (
          <Link className="btn btnSmall btnPrimary" to={`/tracking?delivery_id=${encodeURIComponent(deliveryId)}`}>
            Open live tracking
          </Link>
        ) : null
      }
    >
      <div className="grid2">
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Overview</div>
              <div className="cardHint">Status, addresses, and current location.</div>
            </div>
          </div>
          <div className="cardBody">
            {loadingDetail && !d ? <div className="loading">Loading delivery…</div> : null}
            {!loadingDetail && !d ? <div className="help">Delivery not found.</div> : null}

            {d ? (
              <>
                <div className="grid3">
                  <Info title="Status" value={<span className="badge">{d.current_status.replaceAll("_", " ")}</span>} />
                  <Info title="Carrier" value={d.carrier || "—"} />
                  <Info title="Scheduled" value={d.scheduled_delivery_date || "—"} />
                </div>

                <div className="divider" />

                <div className="grid2">
                  <Info title="Origin" value={d.origin_address || "—"} />
                  <Info title="Destination" value={d.destination_address || "—"} />
                </div>

                <div className="divider" />

                <div className="grid2">
                  <Info title="Latitude" value={d.current_location_lat ?? "—"} />
                  <Info title="Longitude" value={d.current_location_lng ?? "—"} />
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Recent events</div>
              <div className="cardHint">Latest status and last location pings.</div>
            </div>
          </div>
          <div className="cardBody">
            {!history ? <div className="loading">Loading history…</div> : null}
            {history ? (
              <>
                <div className="label">Latest status</div>
                <div className="help">
                  {history.status_events?.[0]
                    ? `${history.status_events[0].status.replaceAll("_", " ")} • ${new Date(
                        history.status_events[0].occurred_at
                      ).toLocaleString()}`
                    : "No status events."}
                </div>

                <div className="divider" />

                <div className="label">Latest location</div>
                <div className="help">
                  {history.location_pings?.[0]
                    ? `${history.location_pings[0].lat.toFixed(5)}, ${history.location_pings[0].lng.toFixed(5)} • ${new Date(
                        history.location_pings[0].pinged_at
                      ).toLocaleString()}`
                    : "No location pings."}
                </div>

                <div className="divider" />

                <div className="help">
                  <Link to={`/history?delivery_id=${encodeURIComponent(deliveryId || "")}`}>View full history →</Link>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Info({ title, value }) {
  return (
    <div>
      <div className="label">{title}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}
