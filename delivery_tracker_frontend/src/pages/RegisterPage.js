import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useAuth } from "../state/AuthContext";
import { useNotifications } from "../state/NotificationContext";

/** PUBLIC_INTERFACE */
export function RegisterPage() {
  /** Registration page wired to /auth/register (role defaults to user). */
  const { register, loading, error, clearError } = useAuth();
  const { add } = useNotifications();
  const nav = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    clearError();
    try {
      await register(email, password, fullName || undefined);
      add({ kind: "success", title: "Account created", body: "You're signed in." });
      nav("/deliveries", { replace: true });
    } catch {
      add({ kind: "error", title: "Registration failed", body: "Please verify your email/password and try again." });
    }
  }

  return (
    <Layout title="Create account" subtitle="A simple, secure account to track deliveries.">
      <div className="card">
        <div className="cardBody">
          <form className="formStack" onSubmit={onSubmit}>
            <div>
              <div className="label">Full name (optional)</div>
              <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <div className="label">Email</div>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            </div>
            <div>
              <div className="label">Password</div>
              <input
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                minLength={6}
              />
              <div className="help">Minimum 6 characters.</div>
            </div>

            {error ? <div className="error">{error}</div> : null}

            <button className="btn btnPrimary" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </button>

            <div className="help">
              Already have an account? <Link to="/login">Sign in</Link>.
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
