"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Loader2, ShieldX, ShieldCheck, LogOut,
  FileText, CheckCircle2, Clock
} from "lucide-react";
import OnboardingWizard from "@/components/shared/OnboardingWizard";


type Role = "RECTOR" | "COORDINADOR" | "BIENESTAR" | "DOCENTE";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

// ── Paleta de la pantalla oscura (síncrona con globals.css) ──
const D = {
  bg:           "#040c1a",
  surface:      "#0f172a",
  surface2:     "#1e293b",
  border:       "rgba(255,255,255,0.1)",
  borderSoft:   "rgba(255,255,255,0.06)",
  text:         "#ffffff",
  textMuted:    "rgba(255,255,255,0.55)",
  textFaint:    "rgba(255,255,255,0.28)",
  primary:      "#1a56db",
  primaryLight: "#93c5fd",
  success:      "#4ade80",
  successBg:    "rgba(22,101,52,0.25)",
  successBorder:"rgba(74,222,128,0.3)",
  warning:      "#fbbf24",
  warningBg:    "rgba(146,64,14,0.25)",
  warningBorder:"rgba(251,191,36,0.35)",
};

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, authLoading, profile, logout, acceptTerms } = useApp();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 8) setHasScrolledToBottom(true);
  };

  const handleAccept = async () => {
    setAccepting(true);
    await acceptTerms();
    setAccepting(false);
  };

  // ── 1. Cargando ────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: D.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: D.primary, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#fff" }}>TD</div>
          <Loader2 size={22} className="animate-spin" style={{ color: D.primaryLight }} />
          <p style={{ color: D.textFaint, fontSize: 10, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase" }}>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ── 2. MODAL DE TÉRMINOS (aparece primero para TODOS) ──────
  if (!profile.acceptedTerms) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(4,12,26,0.92)",
        backdropFilter: "blur(20px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}>
        <div style={{
          background: D.surface,
          border: `1px solid ${D.border}`,
          borderRadius: 28,
          width: "100%", maxWidth: 580,
          maxHeight: "88vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{ padding: "28px 32px", borderBottom: `1px solid ${D.borderSoft}`, display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(26,86,219,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: D.primaryLight, flexShrink: 0 }}>
              <FileText size={22} />
            </div>
            <div>
              <h2 style={{ color: D.text, fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em", margin: 0 }}>Acuerdo de Tratamiento de Datos</h2>
              <p style={{ color: D.textFaint, fontSize: 11, fontWeight: 600, marginTop: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>Política Institucional IETABA · Ley 1581 de 2012</p>
            </div>
          </div>

          {/* Scroll indicator banner */}
          {!hasScrolledToBottom && (
            <div style={{ padding: "10px 32px", background: D.warningBg, borderBottom: `1px solid ${D.warningBorder}`, display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={14} style={{ color: D.warning, flexShrink: 0 }} />
              <p style={{ color: D.warning, fontSize: 11, fontWeight: 700, margin: 0 }}>Lee el documento completo para habilitar la aceptación.</p>
            </div>
          )}
          {hasScrolledToBottom && (
            <div style={{ padding: "10px 32px", background: D.successBg, borderBottom: `1px solid ${D.successBorder}`, display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircle2 size={14} style={{ color: D.success, flexShrink: 0 }} />
              <p style={{ color: D.success, fontSize: 11, fontWeight: 700, margin: 0 }}>Lectura completada. Ya puedes aceptar los términos.</p>
            </div>
          )}

          {/* Content */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            style={{ padding: "28px 32px", overflowY: "auto", flex: 1 }}
          >
            {[
              {
                title: "1. Finalidad del Tratamiento",
                body: "Los datos personales recolectados en esta plataforma EduManager tienen como única finalidad la gestión administrativa, académica y de convivencia de la Institución Educativa Técnico Ambiental Bajo Mira y Frontera (IETABA). No serán compartidos con terceros bajo ninguna circunstancia."
              },
              {
                title: "2. Compromiso del Usuario",
                body: "Al acceder, el usuario se compromete a hacer uso responsable de la información de los menores de edad, respetando la Ley de Protección de Datos Personales (Ley 1581 de 2012). Queda prohibida la descarga, distribución o uso de datos de estudiantes fuera de los fines pedagógicos autorizados."
              },
              {
                title: "3. Seguridad de la Información",
                body: "El sistema implementa protocolos de cifrado (Firebase Auth + Firestore Security Rules) y auditoría de accesos. Cada acción realizada queda registrada para garantizar la integridad de los datos institucionales."
              },
              {
                title: "4. Almacenamiento Local y Caché",
                body: "La plataforma utiliza almacenamiento local del navegador para permitir el funcionamiento offline en zonas de baja conectividad, garantizando que el trabajo pedagógico no se detenga. Estos datos se sincronizan automáticamente al recuperar la conexión."
              },
              {
                title: "5. Derechos del Titular",
                body: "Cualquier usuario tiene derecho a conocer, actualizar, rectificar y suprimir sus datos personales. Para ejercer estos derechos, contacte al administrador del sistema a través del correo institucional de la rectoría."
              },
            ].map((section, i) => (
              <div key={i} style={{ marginBottom: 24 }}>
                <p style={{ color: D.primaryLight, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>{section.title}</p>
                <p style={{ color: D.textMuted, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{section.body}</p>
              </div>
            ))}

            <div style={{ padding: "16px 20px", background: "rgba(26,86,219,0.08)", border: `1px solid rgba(26,86,219,0.2)`, borderRadius: 12, marginTop: 8 }}>
              <p style={{ color: D.primaryLight, fontSize: 12, fontWeight: 700, textAlign: "center", margin: 0, lineHeight: 1.6 }}>
                Al aceptar, confirmas que has leído y comprendes este acuerdo en su totalidad.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "24px 32px", background: D.surface2, borderTop: `1px solid ${D.borderSoft}`, display: "flex", flexDirection: "column", gap: 16 }}>
            <button
              disabled={!hasScrolledToBottom || accepting}
              onClick={handleAccept}
              style={{
                width: "100%",
                padding: "16px 24px",
                background: hasScrolledToBottom ? D.primary : "rgba(255,255,255,0.06)",
                border: "none",
                borderRadius: 14,
                color: hasScrolledToBottom ? "#fff" : D.textFaint,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                cursor: hasScrolledToBottom ? "pointer" : "not-allowed",
                transition: "all 0.25s ease",
                boxShadow: hasScrolledToBottom ? "0 8px 24px rgba(26,86,219,0.35)" : "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10
              }}
            >
              {accepting ? <Loader2 size={16} className="animate-spin" /> : <><CheckCircle2 size={16} /> Acepto los términos y condiciones</>}
            </button>
            <p style={{ color: D.textFaint, fontSize: 10, fontWeight: 600, textAlign: "center", margin: 0, letterSpacing: "0.05em" }}>
              Esta firma digital queda registrada en la base de datos institucional.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── 2.5 ONBOARDING WIZARD (perfil incompleto) ───────────────
  if (profile.acceptedTerms && !profile.isProfileComplete) {
    return <OnboardingWizard />;
  }

  // ── 3. PENDIENTE DE AUTORIZACIÓN ────────────────────────────
  if (profile.status === "PENDING" && !profile.isSuperAdmin) {

    return (
      <div style={{ minHeight: "100vh", background: D.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
        {/* Orb decorativo */}
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(26,86,219,0.12) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", width: "100%", maxWidth: 460, textAlign: "center", display: "flex", flexDirection: "column", gap: 28 }}>
          {/* Ícono */}
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(26,86,219,0.12)", border: `1px solid rgba(26,86,219,0.25)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <ShieldCheck size={36} style={{ color: D.primaryLight }} className="animate-pulse-slow" />
          </div>

          {/* Texto */}
          <div>
            <h1 style={{ color: D.text, fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", textTransform: "uppercase", fontStyle: "italic", margin: "0 0 12px" }}>Acceso en Proceso</h1>
            <p style={{ color: D.textMuted, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
              Hola <strong style={{ color: D.text }}>{(profile.name || "").split(" ")[0]}</strong>. Tu cuenta ha sido registrada con éxito. El Administrador General debe asignarte un rol antes de que puedas acceder a la plataforma.
            </p>
          </div>

          {/* Info box */}
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 18, padding: "24px 28px", textAlign: "left" }}>
            <p style={{ color: D.primaryLight, fontSize: 10, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 10px" }}>Paso siguiente</p>
            <p style={{ color: D.textMuted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              Contacta a la Rectoría o a los administradores del sistema para activar tu perfil institucional.
            </p>
          </div>

          {/* Logout */}
          <button
            onClick={() => logout()}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: D.textFaint, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 auto" }}
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  // ── 4. ACCESO DENEGADO POR ROL ──────────────────────────────
  if (allowedRoles && !allowedRoles.includes(profile.role as Role)) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9ff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: 32 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(186,26,26,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldX size={36} style={{ color: "#ba1a1a" }} />
        </div>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#121c28", textTransform: "uppercase", margin: "0 0 8px" }}>Acceso Denegado</h1>
          <p style={{ fontSize: 14, color: "#757684", margin: 0 }}>Tu rol <strong style={{ color: "#1a56db" }}>{profile.role}</strong> no tiene permisos para esta sección.</p>
        </div>
        <button onClick={() => router.back()} style={{ padding: "12px 28px", background: "#1a56db", border: "none", borderRadius: 12, color: "#fff", fontSize: 12, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", cursor: "pointer" }}>
          Volver
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
