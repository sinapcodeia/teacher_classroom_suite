"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Bot, MessageSquare, HelpCircle, X, Send, Sparkles, 
  ChevronRight, BookOpen, Search, ExternalLink, Lightbulb, 
  CheckCircle2, ShieldAlert, Award, FileText, ArrowUpRight,
  Mic, MicOff, Volume2, VolumeX, Copy, Check, ThumbsUp, ThumbsDown,
  Minimize2, Maximize2, Zap, Compass, RefreshCw, Layers, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { KNOWLEDGE_ARTICLES, FAQS, queryKnowledgeBase, KnowledgeArticle } from "@/lib/knowledgeBase";
import { APP_VERSION_LABEL } from "@/lib/version";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  suggestedArticles?: KnowledgeArticle[];
  actionLink?: { label: string; url: string };
  feedback?: "up" | "down";
  isTyping?: boolean;
}

// ── Web Audio Synth para micro-sonidos alegres no invasivos ──────────────────
function playChime(type: "pop" | "send" | "reply") {
  try {
    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === "pop") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "send") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.06);
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === "reply") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (e) {
    // Silently ignore audio restrictions
  }
}

export default function HelpChatbot() {
  const { user, authLoading, profile } = useApp();
  const pathname = usePathname() || "/";

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "actions" | "guides" | "faq">("chat");
  const [inputQuery, setInputQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  const userName = profile?.firstName || profile?.name?.split(" ")[0] || user?.displayName?.split(" ")[0] || "Docente";
  const userRole = profile?.role || (profile?.isSuperAdmin ? "Rector / SuperAdmin" : "Docente");

  // Mensaje de bienvenida alegre y contextual
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "bot",
      text: `¡Kam saru, ${userName}! 👋 Soy **EduAwá**, tu Asistente Pedagógico de Inteligencia IETABA.\n\nEstoy conectado con **contexto 100% seguro** para orientarte en tus labores de ${userRole} (SIEEE, calificaciones, actas con 4 firmas, observador, periodos y asistencia). ¿En qué te acompaño hoy?`,
      timestamp: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
      suggestedArticles: KNOWLEDGE_ARTICLES.slice(0, 2)
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-desaparecer el tooltip no invasivo después de 7 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 7000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isOpen && activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, activeTab, isTyping]);

  // Sugerencias contextuales según la página donde esté el usuario
  const getContextualPills = useCallback(() => {
    if (pathname.includes("clase-en-vivo")) {
      return [
        "📊 ¿Cómo calificar con saberes?",
        "⏱️ ¿Cómo usar la ruleta?",
        "🔄 ¿Cómo registrar nivelación REC?",
        "🔒 ¿Cómo cerrar el periodo?"
      ];
    }
    if (pathname.includes("estudiantes")) {
      return [
        "📑 ¿Cómo elegir Periodo 2 en el Dossier?",
        "⚖️ ¿Cómo registrar falta en el Observador?",
        "✍️ ¿Cómo generar el Acta con 4 firmas?",
        "🔍 ¿Cómo filtrar por cursos?"
      ];
    }
    if (pathname.includes("curriculo")) {
      return [
        "🌿 ¿Qué es piankammuMi?",
        "🤖 ¿Cómo usar el Copiloto de Lecciones?",
        "♿ ¿Cómo adaptar con PIAR?",
        "📈 ¿Qué mide el Radar de Competencias?"
      ];
    }
    if (pathname.includes("reportes")) {
      return [
        "📋 ¿Cómo descargar la Sábana en CSV?",
        "🖨️ ¿Cómo imprimir boletines?",
        "📉 ¿Cómo ver la escala valorativa?",
        "🏫 ¿Cómo consolidar notas del año?"
      ];
    }
    return [
      "✨ Pesos del SIEEE",
      "📑 Dossier del Periodo 2",
      "🔒 Cierre de Periodo",
      "📡 Modo Offline en veredas",
      "⚖️ Observador Ley 1620"
    ];
  }, [pathname]);

  // Reconocimiento de Voz (Web Speech API)
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("El reconocimiento de voz no está disponible en este navegador. Prueba con Google Chrome o Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "es-CO";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        if (soundEnabled) playChime("pop");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputQuery(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputQuery).trim();
    if (!text) return;

    if (soundEnabled) playChime("send");

    const timeStr = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: timeStr
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    // Dynamic smart answer with typing delay for natural feel
    setTimeout(() => {
      const result = queryKnowledgeBase(text);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: result.reply,
        timestamp: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
        suggestedArticles: result.suggestedArticles,
        actionLink: result.actionLink
      };
      setIsTyping(false);
      setMessages(prev => [...prev, botMsg]);
      if (soundEnabled) playChime("reply");
    }, 450);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (msgId: string, type: "up" | "down") => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: type } : m));
    if (soundEnabled) playChime("pop");
  };

  const filteredArticles = KNOWLEDGE_ARTICLES.filter(a => 
    a.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    a.summary.toLowerCase().includes(searchFilter.toLowerCase()) ||
    a.keywords.some(k => k.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const filteredFaqs = FAQS.filter(f =>
    f.question.toLowerCase().includes(searchFilter.toLowerCase()) ||
    f.answer.toLowerCase().includes(searchFilter.toLowerCase())
  );

  // ══════════════════════════════════════════════════════════════════════════
  // 🔒 REGLA DE SEGURIDAD ESTRICTA: SOLO VISIBLE CON SESIÓN INICIADA
  // Si el usuario no ha iniciado sesión o está en la pantalla de login,
  // el bot EduAwá NO se renderiza en el DOM, protegiendo datos y privacidad.
  // ══════════════════════════════════════════════════════════════════════════
  if (authLoading || !user || pathname === "/login") {
    return null;
  }

  return (
    <>
      {/* ── BOTÓN FLOTANTE NO INVASIVO ───────────────────────────────────────── */}
      <div 
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5 select-none print:hidden no-print"
        data-no-print="true"
      >
        
        {/* Tooltip alegre no invasivo con auto-cierre */}
        {!isOpen && showTooltip && (
          <div 
            onClick={() => { setIsOpen(true); setShowTooltip(false); }}
            className="cursor-pointer hidden sm:flex items-center gap-2.5 bg-slate-900/90 text-white text-xs font-semibold py-2 px-3.5 rounded-2xl shadow-2xl backdrop-blur-xl border border-teal-500/30 hover:border-teal-400 hover:scale-[1.02] transition-all duration-300 animate-in fade-in slide-in-from-right-4"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-teal-300 font-black">EduAwá:</span>
            <span className="text-slate-200">Hola {userName}, ¿dudas con tus notas?</span>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
              className="text-slate-400 hover:text-white ml-1 p-0.5"
              title="Cerrar aviso"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Botón Principal del Avatar Awá */}
        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setShowTooltip(false);
            if (!isOpen && soundEnabled) playChime("pop");
          }}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-teal-900 via-teal-700 to-emerald-500 text-white shadow-xl hover:shadow-2xl hover:shadow-teal-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-teal-300/40 relative group p-0.5 overflow-hidden focus:outline-none focus:ring-4 focus:ring-teal-400/30"
          title="EduAwá - Asistente Pedagógico IA IETABA"
          aria-label="Abrir Asistente EduAwá"
        >
          {isOpen ? (
            <X size={24} className="text-white animate-in spin-in-90 duration-200" />
          ) : (
            <div className="w-full h-full relative">
              <img 
                src="/eduawa.png" 
                alt="EduAwá" 
                className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300" 
              />
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-slate-900 shadow-sm flex items-center justify-center animate-pulse" />
            </div>
          )}
        </button>
      </div>

      {/* ── VENTANA MODAL / DRAWER PRO DINÁMICO ─────────────────────────────────── */}
      {isOpen && (
        <div 
          data-no-print="true"
          className={`fixed z-50 transition-all duration-300 ease-out flex flex-col overflow-hidden bg-white/95 backdrop-blur-2xl border border-slate-200/80 shadow-2xl print:hidden no-print ${
            isExpanded 
              ? "bottom-4 right-4 left-4 top-4 md:left-auto md:w-[680px] md:h-[calc(100vh-2rem)] rounded-3xl" 
              : "bottom-20 right-4 sm:right-5 w-[calc(100vw-2rem)] sm:w-[440px] h-[610px] max-h-[82vh] rounded-3xl"
          } animate-in fade-in slide-in-from-bottom-8`}
        >
          
          {/* HEADER PRO CON ACCIONES RÁPIDAS */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shrink-0 border-b border-slate-800 shadow-sm select-none">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src="/eduawa.png"
                  alt="EduAwá Avatar"
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border-2 border-teal-400/60 shadow-lg bg-teal-950"
                />
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm tracking-tight text-white flex items-center gap-1">
                    EduAwá
                  </h3>
                  <span className="px-2 py-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 text-[9px] font-black rounded-full uppercase tracking-wider border border-emerald-400/40 flex items-center gap-1">
                    <ShieldCheck size={10} className="text-emerald-400" />
                    Sesión Segura
                  </span>
                </div>
                <p className="text-[10px] text-slate-300/90 font-medium">Asistente Pedagógico de {userName} ({userRole})</p>
              </div>
            </div>

            {/* Header Controls (Sound, Expand, Close) */}
            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors hover:text-white"
                title={soundEnabled ? "Silenciar respuestas" : "Activar sonido"}
              >
                {soundEnabled ? <Volume2 size={16} className="text-teal-400" /> : <VolumeX size={16} />}
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:block p-1.5 hover:bg-white/10 rounded-xl transition-colors hover:text-white"
                title={isExpanded ? "Tamaño estándar" : "Expandir vista"}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors hover:text-white"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* NAVEGACIÓN PRO EN TABS */}
          <div className="flex border-b border-slate-200/80 bg-slate-50/90 px-2 pt-1.5 shrink-0 gap-1 select-none">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-t-xl transition-all ${
                activeTab === "chat" 
                  ? "bg-white text-teal-800 shadow-xs border-t border-x border-slate-200/80 font-black" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
            >
              <MessageSquare size={13} className={activeTab === "chat" ? "text-teal-600" : ""} /> Chat IA
            </button>
            <button
              onClick={() => setActiveTab("actions")}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-t-xl transition-all ${
                activeTab === "actions" 
                  ? "bg-white text-teal-800 shadow-xs border-t border-x border-slate-200/80 font-black" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
            >
              <Zap size={13} className={activeTab === "actions" ? "text-amber-500" : ""} /> Atajos
            </button>
            <button
              onClick={() => setActiveTab("guides")}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-t-xl transition-all ${
                activeTab === "guides" 
                  ? "bg-white text-teal-800 shadow-xs border-t border-x border-slate-200/80 font-black" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
            >
              <BookOpen size={13} className={activeTab === "guides" ? "text-teal-600" : ""} /> Guías
            </button>
            <button
              onClick={() => setActiveTab("faq")}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 rounded-t-xl transition-all ${
                activeTab === "faq" 
                  ? "bg-white text-teal-800 shadow-xs border-t border-x border-slate-200/80 font-black" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/60"
              }`}
            >
              <HelpCircle size={13} className={activeTab === "faq" ? "text-teal-600" : ""} /> FAQ
            </button>
          </div>

          {/* ── TAB 1: CHAT PRO INTERACTIVO ───────────────────────────────────── */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/40">
              
              {/* Área de Mensajes */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start items-start"}`}
                  >
                    {msg.sender === "bot" && (
                      <img
                        src="/eduawa.png"
                        alt="EduAwá"
                        className="w-7 h-7 rounded-xl object-cover border border-teal-400/50 shadow-xs shrink-0 mt-1 bg-teal-950"
                      />
                    )}
                    <div className={`flex flex-col ${msg.sender === "user" ? "items-end max-w-[85%]" : "items-start max-w-[92%]"}`}>
                      <div
                        className={`rounded-2xl px-3.5 py-3 text-xs leading-relaxed shadow-sm transition-all ${
                          msg.sender === "user"
                            ? "bg-gradient-to-tr from-teal-700 to-teal-600 text-white rounded-tr-xs"
                            : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs"
                        }`}
                      >
                        <div className="whitespace-pre-line font-medium text-slate-800">
                          {msg.text}
                        </div>

                        {/* Botón de acción directa si viene con la respuesta */}
                        {msg.actionLink && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <Link
                              href={msg.actionLink.url}
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100/80 px-3 py-1.5 rounded-xl border border-teal-200/80 transition-colors shadow-xs"
                            >
                              <span>{msg.actionLink.label}</span>
                              <ArrowUpRight size={13} />
                            </Link>
                          </div>
                        )}

                        {/* Artículos Sugeridos */}
                        {msg.suggestedArticles && msg.suggestedArticles.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Artículos y guías relacionadas:</p>
                            {msg.suggestedArticles.map(art => (
                              <button
                                key={art.id}
                                onClick={() => handleSendMessage(art.title)}
                                className="w-full text-left text-[10.5px] font-bold text-slate-700 hover:text-teal-800 bg-slate-50 hover:bg-teal-50/70 p-2 rounded-xl border border-slate-200/70 flex items-center justify-between transition-colors group"
                              >
                                <span className="truncate">{art.title}</span>
                                <ChevronRight size={12} className="shrink-0 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Barra de utilidades para respuestas del bot (Copiar + Feedback) */}
                        {msg.sender === "bot" && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 select-none">
                            <span className="text-[9px] font-semibold text-slate-400">{msg.timestamp}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopyText(msg.text, msg.id)}
                                className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-700 flex items-center gap-1"
                                title="Copiar respuesta"
                              >
                                {copiedId === msg.id ? (
                                  <span className="text-emerald-600 font-bold flex items-center gap-0.5 text-[9px]">
                                    <Check size={11} /> ¡Copiado!
                                  </span>
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, "up")}
                                className={`p-1 hover:bg-slate-100 rounded-md transition-colors ${
                                  msg.feedback === "up" ? "text-emerald-600 font-bold" : "text-slate-400 hover:text-slate-700"
                                }`}
                                title="Respuesta útil"
                              >
                                <ThumbsUp size={12} />
                              </button>
                              <button
                                onClick={() => handleFeedback(msg.id, "down")}
                                className={`p-1 hover:bg-slate-100 rounded-md transition-colors ${
                                  msg.feedback === "down" ? "text-amber-600 font-bold" : "text-slate-400 hover:text-slate-700"
                                }`}
                                title="Mejorar respuesta"
                              >
                                <ThumbsDown size={12} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {msg.sender === "user" && (
                        <span className="text-[8px] text-slate-400 font-bold mt-1 px-1">{msg.timestamp}</span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Indicador de pensamiento animado alegre */}
                {isTyping && (
                  <div className="flex gap-2 items-center text-slate-500 text-xs font-medium animate-pulse">
                    <img
                      src="/eduawa.png"
                      alt="EduAwá"
                      className="w-6 h-6 rounded-xl object-cover border border-teal-400/40"
                    />
                    <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: "300ms" }} />
                      <span className="text-[10px] text-slate-400 ml-1 font-semibold">Consultando SIEEE IETABA...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Sugerencias Dinámicas Contextuales en Vivo */}
              <div className="px-3 py-1.5 bg-white border-t border-slate-200/80 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0 select-none">
                <span className="text-[9px] font-black uppercase text-teal-700 self-center px-1 flex items-center gap-1">
                  <Sparkles size={10} /> Sugerencias:
                </span>
                {getContextualPills().map((pill, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(pill)}
                    className="shrink-0 text-[10px] font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 transition-all hover:border-teal-300 active:scale-95 shadow-2xs"
                  >
                    {pill}
                  </button>
                ))}
              </div>

              {/* Input Bar con Dictado por Voz y Atajos */}
              <div className="p-2.5 sm:p-3 bg-white border-t border-slate-200 shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1 flex items-center">
                    <input
                      type="text"
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      placeholder={isListening ? "Escuchando tu voz..." : "Escribe o dicta tu consulta pedagógica..."}
                      className={`w-full text-xs bg-slate-50 border rounded-xl pl-3.5 pr-10 py-2.5 focus:outline-none focus:ring-2 text-slate-800 placeholder-slate-400 font-medium transition-all ${
                        isListening 
                          ? "border-red-400 ring-2 ring-red-300/40 bg-red-50/20" 
                          : "border-slate-300 focus:ring-teal-500 focus:border-teal-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      className={`absolute right-2 p-1.5 rounded-lg transition-all ${
                        isListening 
                          ? "text-red-600 bg-red-100 animate-pulse" 
                          : "text-slate-400 hover:text-teal-700 hover:bg-slate-200/60"
                      }`}
                      title={isListening ? "Detener grabación de voz" : "Dictar consulta por voz"}
                    >
                      {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!inputQuery.trim()}
                    className="p-2.5 bg-gradient-to-tr from-teal-700 to-teal-600 hover:from-teal-600 hover:to-teal-500 disabled:opacity-40 text-white rounded-xl shadow-md hover:shadow-teal-700/20 transition-all flex items-center justify-center shrink-0 active:scale-95"
                    title="Enviar mensaje"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── TAB 2: ATAJOS Y ACCIONES RÁPIDAS ─────────────────────────────── */}
          {activeTab === "actions" && (
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3">
              <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white p-3.5 rounded-2xl shadow-sm">
                <h4 className="text-xs font-black flex items-center gap-1.5 text-teal-300">
                  <Zap size={14} className="text-amber-400" />
                  Centro de Atajos Pedagógicos
                </h4>
                <p className="text-[10.5px] text-slate-300 mt-1">
                  Accede a los módulos clave de IETABA en 1 clic:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Link
                  href="/clase-en-vivo"
                  onClick={() => setIsOpen(false)}
                  className="bg-white p-3 rounded-2xl border border-slate-200 hover:border-teal-400 shadow-xs hover:shadow-md transition-all flex items-start gap-3 group"
                >
                  <div className="p-2 bg-teal-50 text-teal-700 rounded-xl group-hover:scale-105 transition-transform">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">Calificador SIEEE</h5>
                    <p className="text-[10px] text-slate-500">Registrar notas en los 5 saberes</p>
                  </div>
                </Link>

                <Link
                  href="/estudiantes"
                  onClick={() => setIsOpen(false)}
                  className="bg-white p-3 rounded-2xl border border-slate-200 hover:border-teal-400 shadow-xs hover:shadow-md transition-all flex items-start gap-3 group"
                >
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl group-hover:scale-105 transition-transform">
                    <FileText size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">Dossier 360° PDF</h5>
                    <p className="text-[10px] text-slate-500">Informes con selector de periodos</p>
                  </div>
                </Link>

                <Link
                  href="/curriculo"
                  onClick={() => setIsOpen(false)}
                  className="bg-white p-3 rounded-2xl border border-slate-200 hover:border-teal-400 shadow-xs hover:shadow-md transition-all flex items-start gap-3 group"
                >
                  <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl group-hover:scale-105 transition-transform">
                    <Compass size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">Tejido Awá y PIAR</h5>
                    <p className="text-[10px] text-slate-500">Mallas curriculares y Copiloto IA</p>
                  </div>
                </Link>

                <Link
                  href="/reportes"
                  onClick={() => setIsOpen(false)}
                  className="bg-white p-3 rounded-2xl border border-slate-200 hover:border-teal-400 shadow-xs hover:shadow-md transition-all flex items-start gap-3 group"
                >
                  <div className="p-2 bg-amber-50 text-amber-700 rounded-xl group-hover:scale-105 transition-transform">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-800">Sábanas y Boletines</h5>
                    <p className="text-[10px] text-slate-500">Exportar notas a CSV y PDF</p>
                  </div>
                </Link>
              </div>

              <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 text-[11px] text-amber-900 leading-relaxed space-y-1">
                <p className="font-black flex items-center gap-1.5 text-amber-950">
                  <Lightbulb size={13} className="text-amber-600" />
                  Consejo del día:
                </p>
                <p>
                  Para entregar notas a padres de familia antes del cierre del Periodo 3, selecciona <strong>Periodo 2</strong> en el Dossier para mostrar el informe con todas las notas consolidadas.
                </p>
              </div>
            </div>
          )}

          {/* ── TAB 3: GUÍAS RÁPIDAS DEL MANUAL ──────────────────────────────── */}
          {activeTab === "guides" && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50 p-3.5 sm:p-4 overflow-y-auto space-y-3">
              <div className="relative shrink-0">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar guías del manual IETABA..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="space-y-3">
                {filteredArticles.map(art => (
                  <div key={art.id} className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs space-y-2.5 hover:border-teal-300 transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-black text-slate-800 leading-snug">{art.title}</h4>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-teal-50 text-teal-800 rounded-full border border-teal-200/80 shrink-0">
                        {art.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">{art.summary}</p>
                    
                    {art.steps && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Pasos:</p>
                        <ul className="space-y-1">
                          {art.steps.map((st, i) => (
                            <li key={i} className="text-[10.5px] text-slate-700 flex items-start gap-1.5">
                              <CheckCircle2 size={12} className="text-teal-600 shrink-0 mt-0.5" />
                              <span>{st}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {art.relatedRoute && (
                      <Link
                        href={art.relatedRoute}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[10.5px] font-black text-teal-800 hover:text-teal-950 pt-1"
                      >
                        <span>Abrir módulo correspondiente</span>
                        <ArrowUpRight size={12} />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB 4: PREGUNTAS FRECUENTES (FAQ) ────────────────────────────── */}
          {activeTab === "faq" && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50 p-3.5 sm:p-4 overflow-y-auto space-y-3">
              <div className="relative shrink-0">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar en preguntas frecuentes..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="space-y-2.5">
                {filteredFaqs.map((faq, i) => (
                  <details key={i} className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs group">
                    <summary className="p-3.5 text-xs font-black text-slate-800 cursor-pointer flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <span className="pr-2">{faq.question}</span>
                      <ChevronRight size={14} className="text-slate-400 group-open:rotate-90 transition-transform shrink-0" />
                    </summary>
                    <div className="px-4 pb-3.5 pt-1 text-[11px] text-slate-600 leading-relaxed border-t border-slate-100 font-medium bg-slate-50/50">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* FOOTER ELEGANTE CON ACCESO AL MANUAL */}
          <div className="px-4 py-2 bg-slate-100/80 border-t border-slate-200 flex items-center justify-between text-[10px] font-bold text-slate-600 shrink-0">
            <span className="text-[9px] text-slate-400">{APP_VERSION_LABEL} · EduAwá IA</span>
            <Link
              href="/ayuda"
              onClick={() => setIsOpen(false)}
              className="font-black text-teal-800 hover:text-teal-950 uppercase tracking-wider flex items-center gap-1 hover:underline"
            >
              <BookOpen size={11} /> Centro de Ayuda Completo
            </Link>
          </div>

        </div>
      )}
    </>
  );
}
