import React, { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import { ToastStack } from "./components/ToastStack";
import { RequireAuth } from "./components/RequireAuth";

import { AuthProvider, useAuth } from "./state/AuthContext";
import { DeliveryProvider, useDeliveries } from "./state/DeliveryContext";
import { NotificationProvider, useNotifications } from "./state/NotificationContext";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DeliveriesPage } from "./pages/DeliveriesPage";
import { DeliveryDetailPage } from "./pages/DeliveryDetailPage";
import { TrackingPage } from "./pages/TrackingPage";
import { HistoryPage } from "./pages/HistoryPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { AdminPage } from "./pages/AdminPage";
import { NotFoundPage } from "./pages/NotFoundPage";

/**
 * Root app with providers and routes.
 * Port 3000 is handled by CRA dev server; backend default is http://localhost:3001 (config.js).
 */

// PUBLIC_INTERFACE
function App() {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <DeliveryProvider>
            <ToastStack />
            <AppRealtimeBridge />
            <Routes>
              <Route path="/" element={<Navigate to="/deliveries" replace />} />

              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              <Route
                path="/deliveries"
                element={
                  <RequireAuth>
                    <DeliveriesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/deliveries/:deliveryId"
                element={
                  <RequireAuth>
                    <DeliveryDetailPage />
                  </RequireAuth>
                }
              />

              <Route
                path="/tracking"
                element={
                  <RequireAuth>
                    <TrackingPage />
                  </RequireAuth>
                }
              />

              <Route
                path="/history"
                element={
                  <RequireAuth>
                    <HistoryPage />
                  </RequireAuth>
                }
              />

              <Route
                path="/notifications"
                element={
                  <RequireAuth>
                    <NotificationsPage />
                  </RequireAuth>
                }
              />

              <Route
                path="/admin"
                element={
                  <RequireAuth requireAdmin={true}>
                    <AdminPage />
                  </RequireAuth>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </DeliveryProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
}

/**
 * Bridges realtime events into state:
 * - On status/location updates, refresh the delivery list and push notification items.
 * This keeps the rest of the UI simple without introducing heavier state libraries.
 */
function AppRealtimeBridge() {
  const { isAuthenticated } = useAuth();
  const { add } = useNotifications();
  const { refreshDeliveries } = useDeliveries();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Minimal approach: periodic refresh to reflect backend changes in list/detail.
    // Realtime Tracking page already shows live messages. Here we keep the rest of the UI coherent.
    const id = setInterval(() => {
      refreshDeliveries();
    }, 15000);

    add({ kind: "info", title: "Session active", body: "Realtime tracking available under Live tracking." });

    return () => clearInterval(id);
  }, [add, isAuthenticated, refreshDeliveries]);

  return null;
}

export default App;
