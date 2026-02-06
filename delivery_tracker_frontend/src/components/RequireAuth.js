import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../state/AuthContext";

/** PUBLIC_INTERFACE */
export function RequireAuth({ children, requireAdmin = false }) {
  /** Protect routes behind authentication and (optionally) admin role. */
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <div className="loading">Loading session…</div>;

  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (requireAdmin && !isAdmin) return <Navigate to="/deliveries" replace />;

  return children;
}
