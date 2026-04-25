"use client";

import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { LogIn, Sparkles, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("Login success:", result.user);
      router.push("/");
    } catch (error: any) {
      console.error("Login failed:", error.code, error.message);
      alert(`Error al iniciar sesión (${error.code}). Asegúrate de haber habilitado Google Auth en la consola de Firebase.`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration - Adjusted sizes and opacity */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <Sparkles 
          size={300} 
          className="absolute -top-10 -left-10 text-primary/5 rotate-12" 
        />
        <ShieldCheck 
          size={250} 
          className="absolute -bottom-10 -right-10 text-secondary/5 -rotate-12" 
        />
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-8 z-10 border border-outline-variant">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary-container/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
             <span className="text-3xl font-bold text-primary">E</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface">EduManager</h1>
          <p className="text-on-surface-variant text-sm">Tu suite educativa offline-first</p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-white border border-outline-variant rounded-2xl flex items-center justify-center gap-3 font-bold text-on-surface hover:bg-surface-container-low transition-all active:scale-95 shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continuar con Google
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-outline-variant"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-on-surface-variant font-bold">Modo Offline</span>
            </div>
          </div>

          <button 
            onClick={() => router.push("/")}
            className="w-full py-4 bg-surface-container-low text-on-surface rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-surface-container transition-all active:scale-95"
          >
            <LogIn size={18} />
            Entrar como Invitado
          </button>
        </div>

        <p className="text-[10px] text-center text-on-surface-variant">
          Al continuar, aceptas que los datos se guarden localmente en tu navegador para permitir el acceso sin conexión.
        </p>
      </div>
    </div>
  );
}
