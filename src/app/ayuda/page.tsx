"use client";

import React, { useState } from "react";
import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import { 
  BookOpen, HelpCircle, Sparkles, Search, CheckCircle2, 
  ShieldCheck, Calculator, FileText, ArrowRight, Layers,
  Phone, AlertTriangle, ExternalLink, Printer, Scale
} from "lucide-react";
import Link from "next/link";
import { KNOWLEDGE_ARTICLES, FAQS } from "@/lib/knowledgeBase";

export default function AyudaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");

  // Interactive SIEEE Simulator State
  const [simSb, setSimSb] = useState<number>(4.0);
  const [simSbh, setSimSbh] = useState<number>(4.2);
  const [simSr, setSimSr] = useState<number>(4.5);
  const [simCv, setSimCv] = useState<number>(5.0);
  const [simAut, setSimAut] = useState<number>(4.0);

  const simDefinitiva = Number(
    ((simSb * 0.30) + (simSbh * 0.40) + (simSr * 0.20) + (simCv * 0.05) + (simAut * 0.05)).toFixed(2)
  );

  const simNivel = simDefinitiva >= 4.6 ? "Superior" : simDefinitiva >= 4.0 ? "Alto" : simDefinitiva >= 3.0 ? "Básico" : "Bajo";
  const simColor = simDefinitiva >= 4.6 ? "text-emerald-700 bg-emerald-100 border-emerald-300" :
                   simDefinitiva >= 4.0 ? "text-sky-700 bg-sky-100 border-sky-300" :
                   simDefinitiva >= 3.0 ? "text-amber-700 bg-amber-100 border-amber-300" :
                   "text-rose-700 bg-rose-100 border-rose-300";

  const categories = [
    { id: "todos", label: "Todos los temas" },
    { id: "calificaciones", label: "Calificaciones & SIEEE" },
    { id: "periodos", label: "Cierre de Periodos" },
    { id: "reportes", label: "Dossier 360° & Reportes" },
    { id: "convivencia", label: "Observador Ley 1620" },
    { id: "offline", label: "Modo Offline" }
  ];

  const filteredArticles = KNOWLEDGE_ARTICLES.filter(a => {
    const matchesCat = selectedCategory === "todos" || a.category === selectedCategory;
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          a.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <TopAppBar />

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white pt-12 pb-16 px-6 relative overflow-hidden border-b border-teal-900/40">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-4 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-black uppercase tracking-widest border border-teal-400/30">
              <Sparkles size={14} /> Centro de Ayuda & Inteligencia Pedagógica
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Manual de Usuario y Asistente EduAwá
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-2xl font-medium leading-relaxed">
              Aprende a dominar el calificador de Sabidurías Awá, la emisión del Dossier 360°, el cierre seguro de periodos y la toma de asistencia en el territorio.
            </p>

            {/* Search Bar */}
            <div className="pt-2 max-w-xl">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Busca por tema (ej. Dossier, Cerrar Periodo, Porcentajes, Observador)..."
                  className="w-full pl-12 pr-4 py-3 bg-white text-slate-800 placeholder-slate-400 rounded-2xl shadow-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-teal-500/30"
                />
              </div>
            </div>
          </div>

          {/* EduAwá Mascot Card */}
          <div className="shrink-0 flex flex-col items-center bg-white/10 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-2xl">
            <div className="relative w-28 h-28 md:w-32 md:h-32">
              <img
                src="/eduawa.png"
                alt="EduAwá Robot Awá"
                className="w-full h-full object-cover rounded-2xl shadow-lg border-2 border-teal-400/50"
              />
              <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-full uppercase tracking-wider shadow-md">
                EduAwá
              </span>
            </div>
            <p className="text-[10px] font-black uppercase text-teal-300 tracking-widest mt-3">Mascota Pedagógica IETABA</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-8 space-y-8 relative z-20">
        
        {/* Category Pills */}
        <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-200 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all ${
                selectedCategory === c.id 
                  ? "bg-teal-600 text-white shadow-sm" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* ── SIMULADOR INTERACTIVO SIEEE (AWÁ) ── */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-lg space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-teal-700 font-black text-xs uppercase tracking-widest">
                <Calculator size={16} /> Herramienta Interactiva
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">Simulador de Calificación Ponderada SIEEE</h2>
              <p className="text-slate-500 text-xs mt-0.5">Mueve los controles para ver cómo se calcula la nota definitiva institucional en tiempo real.</p>
            </div>
            <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3 ${simColor}`}>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-wider opacity-80">Nota Definitiva</p>
                <p className="text-2xl font-black">{simDefinitiva.toFixed(2)}</p>
              </div>
              <div className="h-8 w-px bg-current opacity-20" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider opacity-80">Nivel</p>
                <p className="text-xs font-black uppercase">{simNivel}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Saber */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-teal-900">Saber (SB)</span>
                <span className="text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md text-[10px]">30%</span>
              </div>
              <input
                type="range" min="1.0" max="5.0" step="0.1"
                value={simSb}
                onChange={e => setSimSb(parseFloat(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs font-black text-slate-700">
                <span>Promedio:</span>
                <span className="text-teal-700">{simSb.toFixed(1)}</span>
              </div>
            </div>

            {/* Saber-Hacer */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-sky-900">Saber-Hacer</span>
                <span className="text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md text-[10px]">40%</span>
              </div>
              <input
                type="range" min="1.0" max="5.0" step="0.1"
                value={simSbh}
                onChange={e => setSimSbh(parseFloat(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs font-black text-slate-700">
                <span>Promedio:</span>
                <span className="text-sky-700">{simSbh.toFixed(1)}</span>
              </div>
            </div>

            {/* Ser */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-purple-900">Ser (SR)</span>
                <span className="text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md text-[10px]">20%</span>
              </div>
              <input
                type="range" min="1.0" max="5.0" step="0.1"
                value={simSr}
                onChange={e => setSimSr(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs font-black text-slate-700">
                <span>Promedio:</span>
                <span className="text-purple-700">{simSr.toFixed(1)}</span>
              </div>
            </div>

            {/* Convivencia */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-emerald-900">Convivencia</span>
                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-[10px]">5%</span>
              </div>
              <input
                type="range" min="1.0" max="5.0" step="0.1"
                value={simCv}
                onChange={e => setSimCv(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs font-black text-slate-700">
                <span>Promedio:</span>
                <span className="text-emerald-700">{simCv.toFixed(1)}</span>
              </div>
            </div>

            {/* Autoevaluación */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-amber-900">Autoeval.</span>
                <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-[10px]">5%</span>
              </div>
              <input
                type="range" min="1.0" max="5.0" step="0.1"
                value={simAut}
                onChange={e => setSimAut(parseFloat(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs font-black text-slate-700">
                <span>Promedio:</span>
                <span className="text-amber-700">{simAut.toFixed(1)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── ARTÍCULOS Y GUÍAS DEL MANUAL ── */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <BookOpen size={20} className="text-teal-600" /> Guías Oficiales de Procedimiento
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArticles.map(art => (
              <div key={art.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4 flex flex-col justify-between hover:border-teal-300 transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg border border-teal-200">
                      {art.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 leading-snug">{art.title}</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{art.summary}</p>
                  
                  {art.steps && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Pasos:</p>
                      <ul className="space-y-1.5">
                        {art.steps.map((st, i) => (
                          <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                            <CheckCircle2 size={13} className="text-teal-600 shrink-0 mt-0.5" />
                            <span>{st}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {art.relatedRoute && (
                  <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <Link
                      href={art.relatedRoute}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-teal-700 hover:text-teal-900 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 hover:bg-teal-100 transition-all"
                    >
                      <span>Abrir módulo</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── PREGUNTAS FRECUENTES (FAQ) ── */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-lg space-y-6">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <HelpCircle size={20} className="text-amber-500" /> Preguntas Frecuentes de la Comunidad Docente
          </h3>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <details key={idx} className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden group">
                <summary className="p-4 text-xs md:text-sm font-black text-slate-800 cursor-pointer flex items-center justify-between hover:bg-slate-100 transition-colors">
                  <span className="pr-2">{faq.question}</span>
                  <span className="text-xs font-black text-teal-600 group-open:rotate-90 transition-transform">▸</span>
                </summary>
                <div className="px-5 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200 font-medium">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>

        <BottomNavBar />
      </div>
    </div>
  );
}
