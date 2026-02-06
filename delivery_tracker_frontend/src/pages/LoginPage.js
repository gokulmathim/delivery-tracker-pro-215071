import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAuth } from "../state/AuthContext";
import { useNotifications } from "../state/NotificationContext";

/** PUBLIC_INTERFACE */
export function LoginPage() {
  /** Login page wired to /auth/login. */
  const { login, loading, error, clearError } = useAuth();
  const { add } = useNotifications();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const nav = useNavigate();
  const loc = useLocation();

  const from = useMemo(() => loc.state?.from || "/deliveries", [loc.state]);

  async function onSubmit(e) {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      add({ kind: "success", title: "Signed in", body: "Welcome back." });
      nav(from, { replace: true });
    } catch {
      add({ kind: "error", title: "Sign-in failed", body: "Check your credentials and try again." });
    }
  }

  return (
    <Layout title="Sign in" subtitle="Access your deliveries and live tracking.">
      <div className="card">
        <div className="cardBody">
          <form className="formStack" onSubmit={onSubmit}>
            <div>
              <div className="label">Email</div>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div>
              <div className="label">Password</div>
              <input className="input" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            </div>

            {error ? <div className="error">{error}</div> : null}

            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <div className="help">
              New here? <Link to="/register">Create an account</Link>.
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
