"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Sparkles,
  Trophy,
  Gamepad2,
  UserCheck,
  X,
  Flame,
  Bug,
  Code2,
  ShieldCheck,
  Coffee,
  Volume2,
  VolumeX,
  RotateCcw,
  Star,
  Award,
} from "lucide-react";

interface DeveloperEasterEggModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Simple Web Audio API Synthesizer for 8-bit retro arcade effects
class RetroSoundFX {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
  }

  playJump() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Ignore audio context errors if blocked by browser policy
    }
  }

  playScore() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime);
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // Audio policy safe
    }
  }

  playCrash() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      // Audio policy safe
    }
  }
}

const sfx = new RetroSoundFX();

export const DeveloperEasterEggModal: React.FC<DeveloperEasterEggModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"card" | "game">("card");
  const [soundMuted, setSoundMuted] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<"idle" | "playing" | "gameover">("idle");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load HighScore from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ietaba_dev_arcade_highscore");
      if (saved) {
        setHighScore(parseInt(saved, 10) || 0);
      }
    }
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Toggle Sound
  const toggleSound = () => {
    sfx.enabled = !sfx.enabled;
    setSoundMuted(!sfx.enabled);
  };

  // Canvas Arcade Game Loop
  const gameRef = useRef<{
    player: { x: number; y: number; vy: number; radius: number };
    obstacles: Array<{ x: number; topH: number; bottomY: number; width: number; passed: boolean }>;
    stars: Array<{ x: number; y: number; radius: number; collected: boolean; angle: number }>;
    particles: Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>;
    score: number;
    frameId: number;
    lastTime: number;
  }>({
    player: { x: 80, y: 150, vy: 0, radius: 14 },
    obstacles: [],
    stars: [],
    particles: [],
    score: 0,
    frameId: 0,
    lastTime: 0,
  });

  const triggerJump = useCallback(() => {
    if (gameState === "idle" || gameState === "gameover") {
      startGame();
      return;
    }
    if (gameState === "playing") {
      gameRef.current.player.vy = -6.5;
      sfx.playJump();
    }
  }, [gameState]);

  const startGame = () => {
    gameRef.current = {
      player: { x: 80, y: 140, vy: -4, radius: 14 },
      obstacles: [
        { x: 380, topH: 70, bottomY: 170, width: 32, passed: false },
        { x: 580, topH: 100, bottomY: 200, width: 32, passed: false },
      ],
      stars: [
        { x: 480, y: 130, radius: 8, collected: false, angle: 0 },
        { x: 680, y: 110, radius: 8, collected: false, angle: 0 },
      ],
      particles: [],
      score: 0,
      frameId: 0,
      lastTime: performance.now(),
    };
    setScore(0);
    setGameState("playing");
    sfx.playJump();
  };

  // Game Loop
  useEffect(() => {
    if (!isOpen || activeTab !== "game" || gameState !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const spawnObstacle = (xOffset: number) => {
      const gap = 110;
      const minTop = 40;
      const maxTop = canvas.height - gap - 40;
      const topH = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
      const bottomY = topH + gap;
      gameRef.current.obstacles.push({
        x: xOffset,
        topH,
        bottomY,
        width: 34,
        passed: false,
      });

      // Spawn a star in the gap
      gameRef.current.stars.push({
        x: xOffset + 90,
        y: topH + gap / 2 + (Math.random() * 30 - 15),
        radius: 8,
        collected: false,
        angle: 0,
      });
    };

    const loop = () => {
      if (!isRunning) return;

      const g = gameRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Update Player Physics
      g.player.vy += 0.32; // Gravity
      g.player.y += g.player.vy;

      // Ground / Ceiling bounds
      if (g.player.y + g.player.radius > height - 12) {
        g.player.y = height - 12 - g.player.radius;
        endGame();
        return;
      }
      if (g.player.y - g.player.radius < 0) {
        g.player.y = g.player.radius;
        g.player.vy = 0;
      }

      // 2. Update Obstacles
      const speed = 2.4;
      for (let i = 0; i < g.obstacles.length; i++) {
        const obs = g.obstacles[i];
        obs.x -= speed;

        // Collision Check with Obstacle
        const px = g.player.x;
        const py = g.player.y;
        const pr = g.player.radius - 2;

        if (px + pr > obs.x && px - pr < obs.x + obs.width) {
          if (py - pr < obs.topH || py + pr > obs.bottomY) {
            // Collision!
            endGame();
            return;
          }
        }

        // Passed Obstacle for Score
        if (!obs.passed && obs.x + obs.width < px) {
          obs.passed = true;
          g.score += 1;
          setScore(g.score);
          sfx.playScore();
        }
      }

      // 3. Update Stars
      for (let i = 0; i < g.stars.length; i++) {
        const star = g.stars[i];
        star.x -= speed;
        star.angle += 0.05;

        if (!star.collected) {
          const dx = g.player.x - star.x;
          const dy = g.player.y - star.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < g.player.radius + star.radius + 6) {
            star.collected = true;
            g.score += 5; // Bonus
            setScore(g.score);
            sfx.playScore();

            // Spawn confetti particles
            for (let p = 0; p < 8; p++) {
              g.particles.push({
                x: star.x,
                y: star.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 25,
                color: ["#FBBF24", "#34D399", "#60A5FA", "#F472B6"][p % 4],
              });
            }
          }
        }
      }

      // Filter off-screen obstacles
      g.obstacles = g.obstacles.filter((o) => o.x + o.width > -50);
      g.stars = g.stars.filter((s) => s.x + 20 > -50);

      // Spawn new obstacles if needed
      const lastObs = g.obstacles[g.obstacles.length - 1];
      if (lastObs && lastObs.x < width - 170) {
        spawnObstacle(width + 20);
      }

      // 4. Update Particles
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const p = g.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        if (p.life <= 0) {
          g.particles.splice(i, 1);
        }
      }

      // 5. Render Scene
      // Background Gradient (Cyber Awá Jungle / Cosmos)
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "#0F172A");
      grad.addColorStop(0.5, "#1E1B4B");
      grad.addColorStop(1, "#064E3B");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Cyber Grid Lines
      ctx.strokeStyle = "rgba(147, 197, 253, 0.07)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw Obstacles (Code Columns / Firewalls)
      g.obstacles.forEach((obs) => {
        // Top column
        const colGradTop = ctx.createLinearGradient(obs.x, 0, obs.x + obs.width, 0);
        colGradTop.addColorStop(0, "#EF4444");
        colGradTop.addColorStop(0.5, "#DC2626");
        colGradTop.addColorStop(1, "#991B1B");
        ctx.fillStyle = colGradTop;
        ctx.fillRect(obs.x, 0, obs.width, obs.topH);

        // Column caps
        ctx.fillStyle = "#F87171";
        ctx.fillRect(obs.x - 3, obs.topH - 8, obs.width + 6, 8);

        // Bottom column
        const colGradBot = ctx.createLinearGradient(obs.x, 0, obs.x + obs.width, 0);
        colGradBot.addColorStop(0, "#EF4444");
        colGradBot.addColorStop(0.5, "#DC2626");
        colGradBot.addColorStop(1, "#991B1B");
        ctx.fillStyle = colGradBot;
        ctx.fillRect(obs.x, obs.bottomY, obs.width, height - obs.bottomY);

        ctx.fillStyle = "#F87171";
        ctx.fillRect(obs.x - 3, obs.bottomY, obs.width + 6, 8);

        // Bug icon symbol inside top column cap
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "10px sans-serif";
        ctx.fillText("🐛", obs.x + 8, obs.topH - 12 > 15 ? obs.topH - 12 : 15);
      });

      // Draw Stars
      g.stars.forEach((star) => {
        if (!star.collected) {
          ctx.save();
          ctx.translate(star.x, star.y);
          ctx.rotate(star.angle);
          ctx.fillStyle = "#FBBF24";
          ctx.shadowColor = "#F59E0B";
          ctx.shadowBlur = 10;

          // Star shape
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * 8, -Math.sin(((18 + i * 72) * Math.PI) / 180) * 8);
            ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * 4, -Math.sin(((54 + i * 72) * Math.PI) / 180) * 4);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      });

      // Draw Particles
      g.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 4;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Draw Ground
      ctx.fillStyle = "#047857";
      ctx.fillRect(0, height - 12, width, 12);
      ctx.fillStyle = "#34D399";
      ctx.fillRect(0, height - 12, width, 2);

      // Draw Player (Cyber Dev Drone / Falcon)
      ctx.save();
      ctx.translate(g.player.x, g.player.y);
      const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (g.player.vy * 0.08)));
      ctx.rotate(angle);

      // Glowing aura
      ctx.shadowColor = "#38BDF8";
      ctx.shadowBlur = 14;

      // Drone Body
      const bodyGrad = ctx.createLinearGradient(-12, -12, 12, 12);
      bodyGrad.addColorStop(0, "#38BDF8");
      bodyGrad.addColorStop(1, "#6366F1");
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();

      // Visor
      ctx.fillStyle = "#F8FAFC";
      ctx.beginPath();
      ctx.ellipse(5, -1, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Headphone / Antenna
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-4, -13);
      ctx.lineTo(-7, -19);
      ctx.stroke();

      ctx.fillStyle = "#10B981";
      ctx.beginPath();
      ctx.arc(-7, -20, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Thruster trail
      ctx.fillStyle = "#F43F5E";
      ctx.beginPath();
      ctx.moveTo(-13, -4);
      ctx.lineTo(-20 - Math.random() * 6, 0);
      ctx.lineTo(-13, 4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Request next frame
      g.frameId = requestAnimationFrame(loop);
    };

    const endGame = () => {
      isRunning = false;
      sfx.playCrash();
      setGameState("gameover");

      const finalScore = gameRef.current.score;
      if (finalScore > highScore) {
        setHighScore(finalScore);
        if (typeof window !== "undefined") {
          localStorage.setItem("ietaba_dev_arcade_highscore", finalScore.toString());
        }
      }
    };

    gameRef.current.frameId = requestAnimationFrame(loop);

    return () => {
      isRunning = false;
      cancelAnimationFrame(gameRef.current.frameId);
    };
  }, [isOpen, activeTab, gameState, highScore]);

  // Spacebar trigger for game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && isOpen && activeTab === "game") {
        e.preventDefault();
        triggerJump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, activeTab, triggerJump]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      {/* Container with Holographic Border */}
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-400/40 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Glowing Header Strip */}
        <div className="relative px-6 py-4 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-pulse">
              <Sparkles size={16} className="text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black tracking-widest uppercase bg-gradient-to-r from-amber-400 via-yellow-200 to-emerald-400 bg-clip-text text-transparent">
                  ⚡ MODO CREADOR DESBLOQUEADO // LEVEL 999 ⚡
                </span>
              </div>
              <p className="text-[9px] font-semibold text-slate-400 tracking-wider">
                IETABA EduManager Suite · Arquitectura & Legado
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-white/10"
            title="Cerrar Modo Creador (ESC)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 pb-1 flex items-center gap-2 border-b border-white/5 bg-slate-950/50">
          <button
            onClick={() => setActiveTab("card")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "card"
                ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <UserCheck size={14} />
            Tarjeta del Creador
          </button>
          <button
            onClick={() => {
              setActiveTab("game");
              if (gameState === "idle") startGame();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === "game"
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
            }`}
          >
            <Gamepad2 size={14} />
            Awá Runner Arcade
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors text-xs flex items-center gap-1"
              title={soundMuted ? "Activar Sonido" : "Silenciar Sonido"}
            >
              {soundMuted ? <VolumeX size={14} className="text-rose-400" /> : <Volume2 size={14} className="text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {activeTab === "card" ? (
            <div className="space-y-6">
              {/* Creator Profile Hero */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-5 rounded-2xl bg-gradient-to-br from-slate-800/80 via-slate-800/40 to-slate-900/80 border border-white/10 shadow-xl">
                {/* Photo with VIP Hologram Frame */}
                <div className="relative shrink-0">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl p-1 bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                    <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-950">
                      <Image
                        src="/developer.jpg"
                        alt="Antony - Creador & Arquitecto"
                        fill
                        sizes="128px"
                        className="object-cover object-top"
                        priority
                      />
                    </div>
                  </div>
                  {/* Verified Badge */}
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                    <Award size={11} className="stroke-[3]" />
                    VERIFIED
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      Antony
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      ONLINE / MASTER
                    </span>
                  </div>

                  <p className="text-sm font-bold bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-100 bg-clip-text text-transparent leading-snug">
                    Creador & Arquitecto Principal del Sistema EduManager
                  </p>

                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    Diseñó e implementó la suite completa de gestión académica, análisis predictivo BI, sincronización docente y fortalecimiento de la soberanía digital educativa de IETABA.
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Flame size={14} className="text-amber-400" />
                  Métricas de Ingeniería & Poder
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Stat 1 */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-amber-400/20 hover:border-amber-400/50 transition-all group">
                    <div className="flex items-center gap-2 text-amber-400 mb-1">
                      <Coffee size={16} className="group-hover:rotate-12 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Café Consumido</span>
                    </div>
                    <div className="text-lg font-black text-amber-300">9,999+</div>
                    <div className="text-[9px] text-slate-500 font-semibold">Tazas de concentración</div>
                  </div>

                  {/* Stat 2 */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-rose-400/20 hover:border-rose-400/50 transition-all group">
                    <div className="flex items-center gap-2 text-rose-400 mb-1">
                      <Bug size={16} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Bugs Cazados</span>
                    </div>
                    <div className="text-lg font-black text-rose-300">1,420+</div>
                    <div className="text-[9px] text-slate-500 font-semibold">Exterminados 100%</div>
                  </div>

                  {/* Stat 3 */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-indigo-400/20 hover:border-indigo-400/50 transition-all group">
                    <div className="flex items-center gap-2 text-indigo-400 mb-1">
                      <Code2 size={16} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Código Limpio</span>
                    </div>
                    <div className="text-lg font-black text-indigo-300">50,000+</div>
                    <div className="text-[9px] text-slate-500 font-semibold">Líneas en TypeScript</div>
                  </div>

                  {/* Stat 4 */}
                  <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-emerald-400/20 hover:border-emerald-400/50 transition-all group">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                      <ShieldCheck size={16} className="group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Seguridad</span>
                    </div>
                    <div className="text-lg font-black text-emerald-300">Nivel Militar</div>
                    <div className="text-[9px] text-slate-500 font-semibold">Blindaje & IA Ética</div>
                  </div>
                </div>
              </div>

              {/* Dedication Quote */}
              <div className="relative p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-amber-950/40 border border-emerald-500/30 text-center">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[8px] font-black uppercase tracking-widest shadow-md">
                  DEDICATORIA DE HONOR
                </div>
                <p className="text-xs sm:text-sm font-medium text-emerald-100/90 italic leading-relaxed pt-1">
                  &ldquo;Desarrollado con pasión, rigor técnico y profundo respeto por la identidad y pervivencia del Pueblo Indígena Awá e IETABA.&rdquo;
                </p>
                <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-emerald-400/80">
                  — Antony · EduManager Suite 2026
                </div>
              </div>

              {/* CTA to play minigame */}
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => {
                    setActiveTab("game");
                    if (gameState === "idle") startGame();
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Gamepad2 size={16} />
                  Jugar Minijuego: Awá Runner
                </button>
              </div>
            </div>
          ) : (
            /* Arcade Game Tab */
            <div className="flex flex-col items-center space-y-4">
              {/* Score HUD */}
              <div className="w-full flex items-center justify-between px-2 text-xs font-black uppercase tracking-wider">
                <div className="flex items-center gap-2 text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span>Puntaje: {score}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                  <Trophy size={14} className="text-emerald-400" />
                  <span>Récord: {highScore}</span>
                </div>
              </div>

              {/* Game Canvas Box */}
              <div
                className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[300px] rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)] bg-slate-950 cursor-pointer touch-none"
                onClick={triggerJump}
              >
                <canvas
                  ref={canvasRef}
                  width={540}
                  height={320}
                  className="w-full h-full object-cover"
                />

                {/* Overlays for Idle / Game Over */}
                {gameState === "idle" && (
                  <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-bounce">
                      <Gamepad2 size={24} />
                    </div>
                    <h4 className="text-base font-black text-white uppercase tracking-wider">
                      Awá Dev Runner
                    </h4>
                    <p className="text-[11px] text-slate-300 max-w-xs">
                      Esquiva los bugs 🐛 y recolecta las estrellas de sabiduría ⭐.
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startGame();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-400/30 active:scale-95 transition-all"
                    >
                      ▶ Iniciar Vuelo
                    </button>
                    <span className="text-[9px] text-slate-400">
                      Toca la pantalla o presiona [Espacio / Clic] para elevarte
                    </span>
                  </div>
                )}

                {gameState === "gameover" && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-3 animate-fade-in">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                      <Bug size={24} />
                    </div>
                    <h4 className="text-base font-black text-rose-400 uppercase tracking-wider">
                      ¡Bug Encontrado!
                    </h4>
                    <p className="text-xs text-slate-200">
                      Puntaje final: <span className="font-black text-amber-300">{score} pts</span>
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startGame();
                      }}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-400/30 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <RotateCcw size={14} />
                      Reintentar
                    </button>
                  </div>
                )}
              </div>

              {/* Controls guide */}
              <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-4">
                <span>⚡ <strong>Clic / Tap / Barra Espaciadora:</strong> Elevarse</span>
                <span>⭐ <strong>Estrella:</strong> +5 pts</span>
                <span>🐛 <strong>Obstáculo:</strong> Esquivar</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-950 flex items-center justify-between">
          <div className="text-[9px] text-slate-500 font-mono">
            BUILD_VERSION: 2.9.0-AWÁ-EXP · ARCHITECT_SIGNATURE: ANTONY
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all border border-white/5"
          >
            Volver a Clases
          </button>
        </div>

      </div>
    </div>
  );
};
