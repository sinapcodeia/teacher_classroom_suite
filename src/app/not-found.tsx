"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #040812 0%, #0a1628 50%, #050d1a 100%)" }}
    >
      {/* Orbs decorativos */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: "-15%", left: "-10%", width: 700, height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,56,200,0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: "-15%", right: "-10%", width: 500, height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,120,255,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Número 404 gigante decorativo */}
      <div
        className="pointer-events-none absolute select-none"
        style={{
          fontSize: "clamp(160px, 35vw, 420px)",
          fontWeight: 900,
          fontStyle: "italic",
          letterSpacing: "-0.06em",
          lineHeight: 1,
          background: "linear-gradient(180deg, rgba(79,140,255,0.07) 0%, transparent 80%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          userSelect: "none",
        }}
      >
        404
      </div>

      {/* Contenido principal */}
      <div
        className={`relative z-10 flex flex-col items-center text-center px-6 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Badge */}
        <div
          style={{
            background: "rgba(79,140,255,0.1)",
            border: "1px solid rgba(79,140,255,0.25)",
            borderRadius: 999,
            padding: "6px 18px",
            marginBottom: 32,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span
            style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#4f8cff", display: "inline-block",
              animation: "pulse 2s infinite",
            }}
          />
          <span
            style={{
              color: "#4f8cff", fontSize: 10, fontWeight: 900,
              letterSpacing: "0.3em", textTransform: "uppercase",
            }}
          >
            Página no encontrada
          </span>
        </div>

        {/* Número visible */}
        <h1
          style={{
            color: "#ffffff",
            fontSize: "clamp(60px, 12vw, 96px)",
            fontWeight: 900,
            fontStyle: "italic",
            letterSpacing: "-0.05em",
            lineHeight: 1,
            margin: "0 0 16px",
            background: "linear-gradient(135deg, #ffffff 0%, #4f8cff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          404
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,0.5)",
            fontSize: "clamp(13px, 2vw, 16px)",
            fontWeight: 500,
            maxWidth: 420,
            lineHeight: 1.6,
            margin: "0 0 48px",
          }}
        >
          La ruta que buscas no existe o fue movida. Regresa al panel principal para continuar.
        </p>

        {/* Acciones */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/"
            style={{
              padding: "16px 36px",
              background: "linear-gradient(135deg, #1a56db, #0038c8)",
              border: "none",
              borderRadius: 16,
              color: "#fff",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "none",
              boxShadow: "0 8px 24px rgba(26,86,219,0.4)",
              transition: "all 0.2s",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            ← Volver al Dashboard
          </Link>
          <Link
            href="/login"
            style={{
              padding: "16px 36px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              color: "rgba(255,255,255,0.6)",
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              textDecoration: "none",
              transition: "all 0.2s",
            }}
          >
            Ir al Login
          </Link>
        </div>

        {/* Branding footer */}
        <p
          style={{
            marginTop: 64,
            color: "rgba(255,255,255,0.12)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
          }}
        >
          EduManager · IETABA · Enterprise
        </p>
      </div>
    </div>
  );
}
