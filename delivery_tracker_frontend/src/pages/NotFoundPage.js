import React from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";

/** PUBLIC_INTERFACE */
export function NotFoundPage() {
  /** Fallback page for unknown routes. */
  return (
    <Layout title="Page not found" subtitle="The page you requested does not exist.">
      <div className="card">
        <div className="cardBody">
          <div className="help">
            Return to <Link to="/deliveries">Deliveries</Link>.
          </div>
        </div>
      </div>
    </Layout>
  );
}
