"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Wifi, WifiOff, X } from "lucide-react";

export default function OfflineToast() {
  const { isOnline } = useApp();
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"online" | "offline">("online");
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (isFirstRender) {
      setIsFirstRender(false);
      // Don't show toast on initial mount if already online
      if (!isOnline) {
        setStatus("offline");
        setShow(true);
      }
      return;
    }

    if (isOnline) {
      setStatus("online");
      setShow(true);
      // Auto-hide online toast after 4 seconds
      const timer = setTimeout(() => {
        setShow(false);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setStatus("offline");
      setShow(true);
    }
  }, [isOnline]);

  if (!show) return null;

  const isOffline = status === "offline";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 99999,
        maxWidth: 380,
        width: "calc(100% - 48px)",
        padding: "16px 20px",
        borderRadius: 16,
        background: isOffline ? "rgba(245, 158, 11, 0.95)" : "rgba(16, 185, 129, 0.95)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${isOffline ? "rgba(251, 191, 36, 0.3)" : "rgba(52, 211, 153, 0.3)"}`,
        boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.3)",
        color: "#fff",
        display: "flex",
        alignItems: "start",
        gap: 14,
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        animation: "toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      <style>{`
        @keyframes toastSlideIn {
          from {
            transform: translateY(20px) scale(0.95);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>

      <div
        style={{
          padding: 6,
          borderRadius: 10,
          background: "rgba(255, 255, 255, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isOffline ? <WifiOff size={18} /> : <Wifi size={18} />}
      </div>

      <div style={{ flex: 1 }}>
        <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>
          {isOffline ? "Trabajando sin conexión" : "Conexión Recuperada"}
        </h4>
        <p style={{ margin: "4px 0 0", fontSize: 11.5, opacity: 0.9, lineHeight: 1.5, fontWeight: 500 }}>
          {isOffline
            ? "Todos los cambios se guardarán de manera local y se sincronizarán al recuperar señal."
            : "Sincronizando datos con el servidor..."}
        </p>
      </div>

      <button
        onClick={() => setShow(false)}
        style={{
          background: "none",
          border: "none",
          padding: 4,
          cursor: "pointer",
          color: "rgba(255, 255, 255, 0.6)",
          transition: "color 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "center",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)")}
      >
        <X size={16} />
      </button>
    </div>
  );
}
