import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

const DeliveryContext = createContext(null);

/** PUBLIC_INTERFACE */
export function DeliveryProvider({ children }) {
  const { api, isAuthenticated } = useAuth();

  const [deliveries, setDeliveries] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [history, setHistory] = useState(null);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState(null);

  const refreshDeliveries = useCallback(
    async ({ status_filter } = {}) => {
      if (!isAuthenticated) return;
      setError(null);
      setLoadingList(true);
      try {
        const list = await api.listDeliveries({ status_filter });
        setDeliveries(list);
      } catch (e) {
        setError(e?.message || "Failed to load deliveries");
      } finally {
        setLoadingList(false);
      }
    },
    [api, isAuthenticated]
  );

  const loadDelivery = useCallback(
    async (deliveryId) => {
      if (!isAuthenticated) return;
      setError(null);
      setLoadingDetail(true);
      try {
        const d = await api.getDelivery(deliveryId);
        setSelectedDelivery(d);
      } catch (e) {
        setError(e?.message || "Failed to load delivery");
      } finally {
        setLoadingDetail(false);
      }
    },
    [api, isAuthenticated]
  );

  const loadHistory = useCallback(
    async (deliveryId) => {
      if (!isAuthenticated) return;
      setError(null);
      setLoadingDetail(true);
      try {
        const h = await api.getDeliveryHistory(deliveryId);
        setHistory(h);
      } catch (e) {
        setError(e?.message || "Failed to load history");
      } finally {
        setLoadingDetail(false);
      }
    },
    [api, isAuthenticated]
  );

  const value = useMemo(
    () => ({
      deliveries,
      selectedDelivery,
      history,
      loadingList,
      loadingDetail,
      error,
      refreshDeliveries,
      loadDelivery,
      loadHistory,
      setSelectedDelivery,
      setHistory,
    }),
    [deliveries, selectedDelivery, history, loadingList, loadingDetail, error, refreshDeliveries, loadDelivery, loadHistory]
  );

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

/** PUBLIC_INTERFACE */
export function useDeliveries() {
  /** Get deliveries state and actions. */
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error("useDeliveries must be used inside DeliveryProvider");
  return ctx;
}
