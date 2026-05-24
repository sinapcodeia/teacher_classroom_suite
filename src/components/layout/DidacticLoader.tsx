"use client";

import { useEffect, useState } from "react";
import { BookOpen, Sparkles, Pencil, HelpCircle } from "lucide-react";

const DIDACTIC_QUOTES = [
  "Tejiendo saberes ancestrales con los hilos de los mayores Awá...",
  "Afilando los lápices virtuales para el próximo gran taller de clase...",
  "Sembrando semillas de conocimiento en la parcela agroambiental del IETABA...",
  "Sintonizando la energía de Katsa Su (La Gran Tierra) para el aula...",
  "Ordenando las 10 preguntas premium del taller para que sean súper divertidas...",
  "Preparando la guía bilingüe (Awapit - Español) para conectar corazones...",
  "Cargando el radar de competencias para balancear tus saberes curriculares...",
  "Organizando las bitácoras de nivelación (¡nadie se queda atrás hoy!)..."
];

export default function DidacticLoader({ size = 48, showSubtitle = true }: { size?: number; showSubtitle?: boolean }) {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // Smooth fade transition between quotes
      setVisible(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % DIDACTIC_QUOTES.length);
        setVisible(true);
      }, 400);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-sm mx-auto">
      {/* Dynamic Animated Spinner */}
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Glowing orbit circles */}
        <div className="absolute inset-0 border-4 border-dashed border-amber-400/30 rounded-full animate-[spin_12s_linear_infinite]" />
        <div className="absolute inset-2 border-4 border-dashed border-primary/20 rounded-full animate-[spin_8s_linear_infinite_reverse]" />
        <div className="absolute inset-4 border-2 border-dotted border-emerald-400/30 rounded-full animate-[spin_6s_linear_infinite]" />
        
        {/* Core floating educational symbol */}
        <div className="w-16 h-16 bg-gradient-to-tr from-primary to-amber-500 rounded-[2rem] flex items-center justify-center shadow-xl shadow-primary/20 animate-bounce relative z-10">
          <BookOpen size={size / 1.6} className="text-white animate-pulse" />
          
          {/* Micro floating icons */}
          <Sparkles size={16} className="absolute -top-1 -right-1 text-yellow-300 animate-ping" />
          <Pencil size={12} className="absolute -bottom-1 -left-1 text-white animate-pulse" />
        </div>
      </div>

      {/* Floating text messages */}
      <div className="space-y-2">
        <h5 className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-500 animate-pulse">Sincronizando Aula Virtual</h5>
        {showSubtitle && (
          <div className="h-12 flex items-center justify-center">
            <p className={`text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
              "{DIDACTIC_QUOTES[quoteIndex]}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
