"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[EduManager Global Error]", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#f8fafc",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 440,
            width: "100%",
            background: "#1e293b",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 24,
            padding: 32,
            textAlign: "center",
            boxShadow: "0 24px 64px rgba(0,0,0,0.45)",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "#fbbf24",
              margin: "0 0 8px",
            }}
          >
            EduManager · Recuperación del Sistema
          </p>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 900,
              margin: "0 0 12px",
              color: "#ffffff",
            }}
          >
            Se produjo un fallo crítico de carga
          </h1>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "#cbd5e1",
              margin: "0 0 24px",
            }}
          >
            No te preocupes, la información almacenada permanece segura. Recarga la aplicación para continuar.
          </p>
          {error?.digest && (
            <p
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                color: "#94a3b8",
                margin: "0 0 20px",
              }}
            >
              Referencia: {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: "12px 22px",
                borderRadius: 12,
                border: "none",
                background: "#2563eb",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                cursor: "pointer",
              }}
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") window.location.assign("/");
              }}
              style={{
                padding: "12px 22px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "#e2e8f0",
                fontSize: 12,
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                cursor: "pointer",
              }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
