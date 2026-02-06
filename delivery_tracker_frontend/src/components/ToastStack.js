import React, { useEffect, useMemo, useState } from "react";
import { useNotifications } from "../state/NotificationContext";

/** PUBLIC_INTERFACE */
export function ToastStack() {
  /** Renders small toasts for latest notifications. */
  const { items } = useNotifications();
  const latest = useMemo(() => items.slice(0, 3), [items]);

  // Auto-hide (visual only). We keep them in the center state; this just fades older from stack.
  const [visibleIds, setVisibleIds] = useState(() => new Set());

  useEffect(() => {
    const next = new Set(visibleIds);
    latest.forEach((n) => next.add(n.id));
    setVisibleIds(next);

    const timers = latest.map((n) =>
      setTimeout(() => {
        setVisibleIds((prev) => {
          const s = new Set(prev);
          s.delete(n.id);
          return s;
        });
      }, 8000)
    );

    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  return (
    <div className="toastStack" aria-live="polite" aria-relevant="additions">
      {latest
        .filter((n) => visibleIds.has(n.id))
        .map((n) => (
          <div key={n.id} className="toast" role="status">
            <div className="toastTitle">{n.title || "Update"}</div>
            <div className="toastBody">{n.body || ""}</div>
            <div className="toastMeta">
              <span>{n.kind || "info"}</span>
              <span>{new Date(n.created_at).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
    </div>
  );
}
