import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

/** PUBLIC_INTERFACE */
export function Layout({ title, subtitle, children, actions }) {
  /** App shell layout with sidebar navigation. */
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand" aria-label="Delivery Tracker">
          <div className="brandMark" aria-hidden="true" />
          <div>
            <div className="brandTitle">Delivery Tracker</div>
            <div className="brandSub">Nordic Clean dashboard</div>
          </div>
        </div>

        <nav className="nav" aria-label="Primary">
          <NavItem to="/deliveries" label="Deliveries" icon="📦" />
          <NavItem to="/history" label="History" icon="🗂️" />
          <NavItem to="/notifications" label="Notifications" icon="🔔" />
          <NavItem to="/tracking" label="Live tracking" icon="🛰️" />
          {isAdmin && <NavItem to="/admin" label="Admin" icon="🛠️" />}
        </nav>

        <div className="sidebarFooter">
          {isAuthenticated ? (
            <>
              <div className="pill" title={user?.email || ""}>
                <span aria-hidden="true">👤</span>
                <span>{user?.role || "user"}</span>
              </div>
              <button className="btn btnSmall" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <div className="pill">
                <span aria-hidden="true">🔒</span>
                <span>Signed out</span>
              </div>
              <NavLink className="btn btnSmall" to="/login" state={{ from: location.pathname }}>
                Sign in
              </NavLink>
            </>
          )}
        </div>
      </aside>

      <main className="main">
        <div className="container">
          <div className="topbar">
            <div>
              <div className="pageTitle">{title}</div>
              {subtitle ? <div className="pageSubtitle">{subtitle}</div> : null}
            </div>
            <div className="topbarActions">{actions}</div>
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, label, icon }) {
  return (
    <NavLink to={to} end style={{ textDecoration: "none" }}>
      {({ isActive }) => (
        <div className={`navItem ${isActive ? "navItemActive" : ""}`}>
          <span className="navIcon" aria-hidden="true">
            {icon}
          </span>
          <span>{label}</span>
        </div>
      )}
    </NavLink>
  );
}
