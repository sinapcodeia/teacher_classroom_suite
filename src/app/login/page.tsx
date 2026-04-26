"use client";

import { useEffect, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Loader2, ShieldCheck, Globe, Lock, Sparkles,
  Mail, KeyRound, ArrowLeft, Send, Eye, EyeOff
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { user, authLoading, loginWithEmail, resetPassword } = useApp();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<"login" | "reset">("login");

  useEffect(() => {
    if (!authLoading && user) router.replace("/");
  }, [user, authLoading, router]);

  const handleGoogleLogin = async () => {
    setError("");
    setSigningIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "unknown";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // User closed popup — no error
      } else if (code === "auth/invalid-api-key") {
        setError("Error de configuración del servidor. Contacta al administrador.");
      } else if (code === "auth/network-request-failed") {
        setError("Sin conexión a internet. Verifica tu red e intenta de nuevo.");
      } else if (code === "auth/unauthorized-domain") {
        setError("Dominio no autorizado en Firebase. Contacta al administrador.");
      } else {
        setError(`Error de autenticación: ${code}`);
      }
      setSigningIn(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSigningIn(true);
    try {
      await loginWithEmail(email, password);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code || "unknown";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Correo o contraseña incorrectos.");
      } else if (code === "auth/too-many-requests") {
        setError("Demasiados intentos. Espera unos minutos o restablece tu contraseña.");
      } else if (code === "auth/network-request-failed") {
        setError("Sin conexión. Verifica tu red e intenta de nuevo.");
      } else {
        setError(`Error: ${code}`);
      }
      setSigningIn(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Ingresa tu correo registrado."); return; }
    setError("");
    setSigningIn(true);
    try {
      await resetPassword(email);
      setSuccess("Si el correo está registrado, recibirás un enlace en pocos minutos.");
      setSigningIn(false);
      setTimeout(() => { setSuccess(""); setView("login"); }, 5000);
    } catch {
      // Incluso si falla en el backend, no revelamos el motivo al usuario para evitar enumeración de cuentas.
      setSuccess("Si el correo está registrado, recibirás un enlace en pocos minutos.");
      setSigningIn(false);
      setTimeout(() => { setSuccess(""); setView("login"); }, 5000);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0f1e" }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="animate-spin" style={{ color: "#4f8cff" }} />
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", fontWeight: 900, letterSpacing: "0.3em", textTransform: "uppercase" }}>
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #040812 0%, #0a1628 50%, #050d1a 100%)" }}
    >
      {/* Orbs decorativos */}
      <div className="pointer-events-none absolute" style={{ top: "-10%", left: "-10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,56,200,0.15) 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute" style={{ bottom: "-10%", right: "-10%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,120,255,0.08) 0%, transparent 70%)" }} />

      <main className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-16 p-8 md:p-14 items-center">

        {/* ── IZQUIERDA: BRANDING ─────────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-center gap-10">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: "linear-gradient(135deg, #1a56db, #0038c8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 8px 32px rgba(26,86,219,0.4)",
              fontWeight: 900, fontSize: 16, color: "#fff"
            }}>TD</div>
            <div>
              <p style={{ color: "#fff", fontWeight: 900, fontSize: 22, letterSpacing: "-0.04em", textTransform: "uppercase", fontStyle: "italic", lineHeight: 1 }}>EduManager</p>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", marginTop: 4 }}>IETABA · Premium Suite</p>
            </div>
          </div>

          {/* Headline */}
          <div>
            <p style={{ color: "#4f8cff", fontSize: 11, fontWeight: 900, letterSpacing: "0.4em", textTransform: "uppercase", marginBottom: 16 }}>Plataforma Institucional</p>
            <h1 style={{ color: "#ffffff", fontWeight: 900, fontSize: 34, lineHeight: 1.1, letterSpacing: "-0.03em", textTransform: "uppercase", fontStyle: "italic" }}>
              El Estándar<br />
              <span style={{ background: "linear-gradient(90deg, #4f8cff, #60cfff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Superior</span><br />
              en Educación.
            </h1>
          </div>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: Globe, title: "Infraestructura Cloud", desc: "Sincronización en tiempo real, sin latencia." },
              { icon: ShieldCheck, title: "Seguridad Institucional", desc: "Protocolo de autenticación de grado bancario." },
              { icon: Lock, title: "Modo Offline", desc: "Productividad garantizada sin conexión a internet." },
            ].map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 16,
                padding: "16px 20px", borderRadius: 16,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)"
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(79,140,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4f8cff", flexShrink: 0 }}>
                  <f.icon size={20} />
                </div>
                <div>
                  <p style={{ color: "#fff", fontSize: 12, fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase" }}>{f.title}</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500, marginTop: 2 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── DERECHA: CARD LOGIN ──────────────────────────────── */}
        <div className="flex items-center justify-center">
          <div style={{
            width: "100%", maxWidth: 440,
            background: "#0f172a",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 32,
            padding: "48px 40px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
            backdropFilter: "none"
          }}>

            {view === "login" ? (
              <>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: 36 }}>
                  <h2 style={{ color: "#fff", fontSize: 32, fontWeight: 900, letterSpacing: "-0.04em", textTransform: "uppercase", fontStyle: "italic" }}>Acceso</h2>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 600, marginTop: 8, letterSpacing: "0.05em" }}>Ingresa con tu identidad institucional</p>
                </div>

                {/* Error / Success */}
                {error && (
                  <div style={{ background: "rgba(186,26,26,0.15)", border: "1px solid rgba(186,26,26,0.4)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, color: "#ff6b6b", fontSize: 12, fontWeight: 700, textAlign: "center" }}>
                    {error}
                  </div>
                )}

                {/* Google Button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={signingIn}
                  style={{
                    width: "100%", padding: "16px 24px",
                    background: "#ffffff", borderRadius: 16, border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                    fontSize: 13, fontWeight: 800, color: "#111827",
                    letterSpacing: "0.05em", textTransform: "uppercase",
                    cursor: "pointer", transition: "all 0.2s",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f0f4ff")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#ffffff")}
                >
                  {signingIn ? <Loader2 size={20} className="animate-spin" style={{ color: "#111827" }} /> : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 18 18">
                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                        <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
                      </svg>
                      Continuar con Google
                    </>
                  )}
                </button>

                {/* Separator */}
                <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "24px 0" }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                  <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em" }}>O</span>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ position: "relative" }}>
                    <Mail size={15} style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                    <input
                      type="email" required
                      placeholder="Correo institucional"
                      value={email} onChange={e => setEmail(e.target.value)}
                      style={{
                        width: "100%", padding: "15px 18px 15px 48px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 14, color: "#ffffff",
                        fontSize: 13, fontWeight: 600,
                        outline: "none", boxSizing: "border-box"
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = "#4f8cff"; e.currentTarget.style.background = "rgba(79,140,255,0.08)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    />
                  </div>
                  <div style={{ position: "relative" }}>
                    <KeyRound size={15} style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                    <input
                      type={showPassword ? "text" : "password"} required
                      placeholder="Contraseña"
                      value={password} onChange={e => setPassword(e.target.value)}
                      style={{
                        width: "100%", padding: "15px 50px 15px 48px",
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 14, color: "#ffffff",
                        fontSize: 13, fontWeight: 600,
                        outline: "none", boxSizing: "border-box"
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = "#4f8cff"; e.currentTarget.style.background = "rgba(79,140,255,0.08)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  <div style={{ textAlign: "right", marginTop: -4 }}>
                    <button type="button" onClick={() => { setError(""); setView("reset"); }} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, letterSpacing: "0.03em" }}>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <button
                    type="submit" disabled={signingIn}
                    style={{
                      width: "100%", padding: "16px 24px", marginTop: 4,
                      background: "linear-gradient(135deg, #1a56db, #0038c8)",
                      border: "none", borderRadius: 16, color: "#fff",
                      fontSize: 13, fontWeight: 800, letterSpacing: "0.08em",
                      textTransform: "uppercase", cursor: "pointer",
                      boxShadow: "0 8px 24px rgba(26,86,219,0.4)",
                      transition: "all 0.2s"
                    }}
                  >
                    {signingIn ? <Loader2 size={18} className="animate-spin" style={{ margin: "0 auto" }} /> : "Iniciar Sesión"}
                  </button>
                </form>
              </>
            ) : (
              /* ── VISTA RECUPERAR CONTRASEÑA ── */
              <>
                <button onClick={() => { setError(""); setView("login"); }} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 32, padding: 0 }}>
                  <ArrowLeft size={14} /> Volver al acceso
                </button>

                <div style={{ marginBottom: 32 }}>
                  <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", textTransform: "uppercase", fontStyle: "italic" }}>Recuperar<br />Contraseña</h2>
                  <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 500, marginTop: 10, lineHeight: 1.6 }}>Ingresa tu correo registrado y te enviaremos un enlace seguro de restablecimiento.</p>
                </div>

                {error && <div style={{ background: "rgba(186,26,26,0.15)", border: "1px solid rgba(186,26,26,0.4)", borderRadius: 12, padding: "12px 16px", marginBottom: 20, color: "#ff6b6b", fontSize: 12, fontWeight: 700 }}>{error}</div>}
                {success && <div style={{ background: "rgba(0,108,74,0.2)", border: "1px solid rgba(0,108,74,0.5)", borderRadius: 12, padding: "14px 18px", marginBottom: 20, color: "#4ade80", fontSize: 12, fontWeight: 700, lineHeight: 1.5 }}>{success}</div>}

                <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ position: "relative" }}>
                    <Mail size={15} style={{ position: "absolute", left: 18, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
                    <input
                      type="email" required
                      placeholder="tu@correo.com"
                      value={email} onChange={e => setEmail(e.target.value)}
                      style={{
                        width: "100%", padding: "15px 18px 15px 48px",
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 14, color: "#fff", fontSize: 13, fontWeight: 600, outline: "none", boxSizing: "border-box"
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = "#4f8cff"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; }}
                    />
                  </div>
                  <button type="submit" disabled={signingIn} style={{
                    width: "100%", padding: "16px 24px",
                    background: "rgba(79,140,255,0.15)", border: "1px solid rgba(79,140,255,0.3)",
                    borderRadius: 16, color: "#4f8cff", fontSize: 13, fontWeight: 800,
                    letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10
                  }}>
                    {signingIn ? <Loader2 size={18} className="animate-spin" /> : <><Send size={16} /> Enviar enlace de recuperación</>}
                  </button>
                </form>
              </>
            )}

            {/* Footer */}
            <div style={{ marginTop: 36, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase" }}>
                SinapCodeIA · Enterprise Infrastructure
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
