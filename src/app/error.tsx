"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[EduManager Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-[2rem] shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
          <AlertTriangle size={32} />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-rose-600">
            EduManager · IETABA
          </p>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Ocurrió un inconveniente inesperado
          </h1>
          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            La pantalla encontró un problema temporal. Tus datos locales están protegidos; puedes reintentar o regresar al panel principal.
          </p>
          {error?.digest && (
            <p className="text-[10px] font-mono text-slate-400 pt-1">
              Código de referencia: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            <RotateCcw size={15} />
            Reintentar
          </button>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider transition-all"
          >
            <Home size={15} />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
