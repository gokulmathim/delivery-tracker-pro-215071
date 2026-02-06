import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const NotificationContext = createContext(null);

function nowIso() {
  return new Date().toISOString();
}

/** PUBLIC_INTERFACE */
export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);

  const add = useCallback((n) => {
    setItems((prev) => [{ id: crypto.randomUUID?.() || String(Date.now()), created_at: nowIso(), ...n }, ...prev].slice(0, 50));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({ items, add, clear }), [items, add, clear]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

/** PUBLIC_INTERFACE */
export function useNotifications() {
  /** Get notification items and actions. */
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}
