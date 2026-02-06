import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createApiClient } from "../api/client";

const STORAGE_KEY = "dt_session_v1";

/**
 * @typedef {Object} AuthSession
 * @property {string} accessToken
 * @property {string} refreshToken
 * @property {number|null} expiresAtMs
 */

/**
 * @typedef {Object} AuthState
 * @property {AuthSession|null} session
 * @property {any|null} user
 * @property {boolean} loading
 * @property {string|null} error
 * @property {boolean} isAuthenticated
 * @property {boolean} isAdmin
 * @property {boolean} isDriver
 * @property {(email:string,password:string)=>Promise<void>} login
 * @property {(email:string,password:string,fullName?:string)=>Promise<void>} register
 * @property {()=>Promise<void>} logout
 * @property {()=>void} clearError
 * @property {import("../api/client").createApiClient} api
 */

const AuthContext = createContext(null);

function loadStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken || !parsed?.refreshToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeSession(session) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/** PUBLIC_INTERFACE */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadStoredSession());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(session));
  const [error, setError] = useState(null);

  const getAccessToken = useCallback(() => session?.accessToken || null, [session]);
  const getRefreshToken = useCallback(() => session?.refreshToken || null, [session]);

  const onTokenPair = useCallback(
    (tp) => {
      const expiresAtMs = Date.now() + (tp.expires_in_seconds || 0) * 1000;
      const next = {
        accessToken: tp.access_token,
        refreshToken: tp.refresh_token,
        expiresAtMs,
      };
      setSession(next);
      storeSession(next);
    },
    [setSession]
  );

  const onAuthFailure = useCallback(() => {
    setSession(null);
    setUser(null);
    storeSession(null);
  }, []);

  const api = useMemo(() => {
    return createApiClient({ getAccessToken, getRefreshToken, onTokenPair, onAuthFailure });
  }, [getAccessToken, getRefreshToken, onTokenPair, onAuthFailure]);

  const hydrateMe = useCallback(async () => {
    if (!session?.accessToken) return;
    try {
      const me = await api.me();
      setUser(me);
    } catch (e) {
      // If token is invalid, drop the session.
      onAuthFailure();
    }
  }, [api, onAuthFailure, session?.accessToken]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!session) return;
      setLoading(true);
      try {
        await hydrateMe();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [hydrateMe, session]);

  const login = useCallback(
    async (email, password) => {
      setError(null);
      setLoading(true);
      try {
        const tp = await api.login({ email, password });
        onTokenPair(tp);
        const me = await api.me();
        setUser(me);
      } catch (e) {
        setError(e?.message || "Login failed");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [api, onTokenPair]
  );

  const register = useCallback(
    async (email, password, fullName) => {
      setError(null);
      setLoading(true);
      try {
        await api.register({ email, password, full_name: fullName || null });
        // UX: after register, login automatically.
        const tp = await api.login({ email, password });
        onTokenPair(tp);
        const me = await api.me();
        setUser(me);
      } catch (e) {
        setError(e?.message || "Registration failed");
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [api, onTokenPair]
  );

  const logout = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const refreshToken = session?.refreshToken;
      if (refreshToken) {
        try {
          await api.logout(refreshToken);
        } catch {
          // Ignore logout errors; still clear local session.
        }
      }
      onAuthFailure();
    } finally {
      setLoading(false);
    }
  }, [api, onAuthFailure, session?.refreshToken]);

  const value = useMemo(() => {
    const role = user?.role;
    return {
      session,
      user,
      loading,
      error,
      isAuthenticated: Boolean(session?.accessToken && user),
      isAdmin: role === "admin",
      isDriver: role === "driver",
      login,
      register,
      logout,
      clearError: () => setError(null),
      api,
    };
  }, [api, error, login, logout, register, session, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** PUBLIC_INTERFACE */
export function useAuth() {
  /** Get the auth state and actions. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
