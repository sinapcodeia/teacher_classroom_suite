"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Sparkles, Gamepad2, Trophy, RotateCcw, AlertTriangle, ArrowLeft, ArrowRight, Home } from "lucide-react";

// Falling items interface
interface GameItem {
  id: number;
  x: number;
  y: number;
  type: "book" | "apple" | "knowledge" | "goblin";
  symbol: string;
  speed: number;
}

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  
  // Game states
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasWon, setHasWon] = useState(false);
  const [basketX, setBasketX] = useState(50); // percentage (0 - 100)
  const [items, setItems] = useState<GameItem[]>([]);
  const [alertMsg, setAlertMsg] = useState("¡Ayuda a la Shingra a recolectar saberes para abrir el portal escolar!");
  
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const nextItemId = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard controls for the basket
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || hasWon) return;
      if (e.key === "ArrowLeft") {
        moveLeft();
      } else if (e.key === "ArrowRight") {
        moveRight();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [basketX, isPlaying, hasWon]);

  // Basket movement functions
  const moveLeft = () => {
    setBasketX((prev) => Math.max(5, prev - 10));
  };

  const moveRight = () => {
    setBasketX((prev) => Math.min(95, prev + 10));
  };

  // Game tick loop (physics and collision)
  useEffect(() => {
    if (!isPlaying || hasWon) return;

    // Item generator tick
    const spawnInterval = setInterval(() => {
      const types: ("book" | "apple" | "knowledge" | "goblin")[] = ["book", "apple", "knowledge", "goblin"];
      const symbols = { book: "📖", apple: "🍎", knowledge: "🌱", goblin: "👾" };
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      const newItem: GameItem = {
        id: nextItemId.current++,
        x: Math.floor(Math.random() * 85) + 5, // random x between 5% and 90%
        y: 0,
        type: randomType,
        symbol: symbols[randomType],
        speed: Math.random() * 2 + 3 // falling speed
      };
      
      setItems((prev) => [...prev, newItem]);
    }, 1800);

    // Physics tick
    const physicsInterval = setInterval(() => {
      setItems((prev) => {
        const updated: GameItem[] = [];
        
        for (let item of prev) {
          const nextY = item.y + item.speed;
          
          // Collision check: bottom zone (y >= 85%)
          if (nextY >= 82 && nextY <= 89) {
            // Check horizontal alignment with the basket (basketX +- 12% width margin)
            const isCaught = Math.abs(item.x - basketX) < 12;
            if (isCaught) {
              if (item.type === "goblin") {
                setScore((s) => Math.max(0, s - 10));
                setAlertMsg("¡Oops! El travieso duende te restó -10 puntos. ¡Evita los duendes 👾!");
              } else {
                setScore((s) => {
                  const newScore = s + 10;
                  if (newScore >= 50) {
                    setHasWon(true);
                    setAlertMsg("¡FANTÁSTICO! Has recolectado suficientes saberes. ¡El portal escolar está abierto!");
                  } else {
                    const messages = [
                      "¡Excelente! Atrapaste un Saber Ancestral 🌱",
                      "¡Nutritivo! Cosechaste una Manzana Roja 🍎",
                      "¡Didáctico! Guardaste una Guía de Clase 📖",
                      "¡Sigue así! Estás equilibrando el tejido escolar."
                    ];
                    setAlertMsg(messages[Math.floor(Math.random() * messages.length)]);
                  }
                  return newScore;
                });
              }
              continue; // Caught item disappears
            }
          }
          
          // If item hasn't fallen out of screen, keep it
          if (nextY < 95) {
            updated.push({ ...item, y: nextY });
          }
        }
        
        return updated;
      });
    }, 50);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(physicsInterval);
    };
  }, [isPlaying, hasWon, basketX]);

  // Reset game function
  const handleReset = () => {
    setScore(0);
    setItems([]);
    setHasWon(false);
    setIsPlaying(true);
    setBasketX(50);
    setAlertMsg("¡Shingra lista! Recolecta 50 puntos atrapando saberes y evita los duendes.");
  };

  return (
    <div
      className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-x-hidden select-none"
      style={{ background: "linear-gradient(135deg, #050b14 0%, #0c1c38 50%, #040912 100%)" }}
    >
      {/* Dynamic Ambient Blur Backgrounds */}
      <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-amber-500/10 blur-[100px] pointer-events-none" />

      {/* Main glass container */}
      <div
        className={`relative z-10 w-full max-w-xl bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-2xl p-6 md:p-8 flex flex-col items-center transition-all duration-1000 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        }`}
      >
        {/* Glowing Badge */}
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full mb-4">
          <AlertTriangle size={14} className="text-red-400 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-red-400">
            Página No Encontrada (Error 404)
          </span>
        </div>

        {/* Dynamic Title */}
        <h1 className="text-2xl md:text-3xl font-black text-center text-white tracking-tight leading-tight mb-2">
          ¡AULA EXTRAVIADA EN KATSA SU!
        </h1>
        <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider text-center max-w-sm mb-6 leading-relaxed">
          El aula que buscas se ha esfumado del sendero escolar. ¡Un travieso duende del bosque se robó la ruta!
        </p>

        {/* Live Status Board */}
        <div className="w-full flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-4 gap-4">
          <div className="flex items-center gap-2">
            <Gamepad2 size={16} className="text-amber-400 animate-bounce" />
            <div className="text-left">
              <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Estado del portal</p>
              <p className="text-[10px] font-bold text-white uppercase">
                {hasWon ? "¡Portal Desbloqueado! 🌟" : "Portal Cerrado (Falta Energía)"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-yellow-400 animate-pulse" />
            <div className="text-left">
              <p className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">Saberes Cosechados</p>
              <p className="text-base font-black text-white">{score} / 50 PTS</p>
            </div>
          </div>
        </div>

        {/* Interactive Game Area */}
        <div
          ref={gameAreaRef}
          className="relative w-full h-64 bg-slate-950/70 border border-white/10 rounded-3xl overflow-hidden mb-4 shadow-inner"
        >
          {/* Grid visual lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

          {/* Falling items */}
          {items.map((item) => (
            <div
              key={item.id}
              className="absolute text-2xl animate-fade-in transition-all duration-75 select-none"
              style={{
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {item.symbol}
            </div>
          ))}

          {/* Catcher Basket (Shingra) */}
          <div
            className="absolute bottom-2 h-8 w-20 flex flex-col items-center justify-end transition-all duration-100 ease-out"
            style={{
              left: `${basketX}%`,
              transform: "translateX(-50%)",
            }}
          >
            {/* Basket graphics */}
            <div className="w-full h-4 bg-gradient-to-r from-amber-600 to-amber-700 border border-amber-500 rounded-b-lg rounded-t shadow-lg flex items-center justify-center relative overflow-hidden">
              {/* Traditional weave pattern lines */}
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%),linear-gradient(-45deg,rgba(255,255,255,0.1)_25%,transparent_25%)] bg-[size:10px_10px]" />
              <span className="text-[7px] font-black uppercase text-amber-100 tracking-widest z-10">SHINGRA</span>
            </div>
            {/* Basket Handle */}
            <div className="w-14 h-4 border-2 border-amber-600 rounded-t-full -mb-6" />
          </div>

          {/* Winning Overlay Screen */}
          {hasWon && (
            <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-20 animate-[fadeIn_0.4s_ease-out]">
              <Sparkles size={40} className="text-yellow-400 animate-spin mb-3" />
              <h3 className="text-lg font-black text-white tracking-tight uppercase">¡CAMINO DEL SABER RESTAURADO!</h3>
              <p className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest max-w-xs mt-1 leading-relaxed">
                Lograste sintonizar {score} puntos. El duendecillo te devolvió las llaves de la escuela.
              </p>
              
              <Link
                href="/"
                className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 border border-yellow-400 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-500/20 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
              >
                <Home size={12} />
                Entrar al Dashboard
              </Link>
            </div>
          )}
        </div>

        {/* Didactic Floating Hint & Instructions */}
        <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-3 text-center mb-6 min-h-12 flex items-center justify-center">
          <p className="text-[9px] font-bold text-amber-400 uppercase tracking-wider leading-relaxed">
            {alertMsg}
          </p>
        </div>

        {/* Game controller responsive buttons (Mobile Support) */}
        {!hasWon && (
          <div className="w-full flex items-center justify-between gap-4 mb-6">
            <button
              onClick={moveLeft}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 rounded-2xl text-white transition-all text-xs font-black uppercase tracking-wider"
            >
              <ArrowLeft size={16} />
              Izquierda
            </button>
            <button
              onClick={handleReset}
              title="Reiniciar Juego"
              className="px-4 py-4 bg-slate-900 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={moveRight}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 rounded-2xl text-white transition-all text-xs font-black uppercase tracking-wider"
            >
              Derecha
              <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Global Exit Actions */}
        <div className="w-full flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-primary to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-xl hover:shadow-primary/20 transition-all hover:scale-102 active:scale-98"
          >
            <Home size={12} />
            Dashboard
          </Link>
          <Link
            href="/login"
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Cambiar Cuenta
          </Link>
        </div>

        {/* Premium footer branding */}
        <p className="mt-8 text-[8px] font-bold text-slate-600 uppercase tracking-[0.4em]">
          IETABA · Katsa Su · Pedagogia Awapit
        </p>
      </div>
    </div>
  );
}
