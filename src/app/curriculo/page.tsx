"use client";

import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import UnitProgress from "@/components/curriculum/UnitProgress";
import UnitSidebar from "@/components/curriculum/UnitSidebar";
import TopicTree from "@/components/curriculum/TopicTree";
import CSVImporter from "@/components/curriculum/CSVImporter";
import { Plus, Sparkles, FileText, Presentation } from "lucide-react";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import RoleGuard from "@/components/shared/RoleGuard";

export default function CurriculumPage() {
  const { masterData } = useApp();
  const [selectedGrade, setSelectedGrade] = useState("11°");
  const [selectedSubject, setSelectedSubject] = useState("MATEMÁTICAS");

  return (
    <RoleGuard allowedRoles={["COORDINADOR", "DOCENTE", "RECTOR"]}>
      <div className="flex flex-col min-h-screen">
      <TopAppBar />
      
      <main className="pt-20 px-6 max-w-[1440px] mx-auto w-full space-y-8 pb-24 md:pb-8">
        {/* Global Filters & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl border border-outline-variant/30">
          <div>
            <h1 className="text-4xl font-black text-on-surface mb-2 tracking-tighter uppercase italic">Malla Curricular</h1>
            <div className="flex gap-4 items-center">
              <select 
                value={selectedGrade} 
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-slate-100 border-none rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest focus:ring-2 ring-primary"
              >
                {(masterData.grades || []).map(g => <option key={g} value={g}>Grado {g}</option>)}
              </select>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-slate-100 border-none rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest focus:ring-2 ring-primary"
              >
                {(masterData.subjects || []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CSVImporter />
            <button className="flex items-center gap-2 px-8 py-3 bg-on-surface text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-2xl transition-all">
              <Plus size={18} />
              Nuevo Tema
            </button>
          </div>
        </div>

        {/* Curriculum Structure Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            <UnitProgress />
            <UnitSidebar />
          </div>

          {/* Right Column (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            <TopicTree />
            
            {/* Resources Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-outline-variant/30 rounded-[2rem] p-8 shadow-xl">
                <h4 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em]">Recursos: {selectedSubject} - {selectedGrade}</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 hover:bg-surface-container rounded-lg cursor-pointer transition-colors">
                    <FileText size={18} className="text-error" />
                    <span className="text-sm font-medium text-on-surface">Guia_Derivadas.pdf</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 hover:bg-surface-container rounded-lg cursor-pointer transition-colors">
                    <Presentation size={18} className="text-primary" />
                    <span className="text-sm font-medium text-on-surface">Intuicion_Visual.pptx</span>
                  </div>
                </div>
              </div>
              <div className="bg-primary text-white border border-outline-variant rounded-xl p-6 shadow-sm relative overflow-hidden group cursor-pointer">
                <div className="relative z-10">
                  <h4 className="text-xs font-bold opacity-80 mb-2 uppercase tracking-widest">Asistente Curricular IA</h4>
                  <p className="text-base mb-4 font-medium">¿Necesitas alinear estos temas con estándares internacionales?</p>
                  <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-bold transition-colors backdrop-blur-sm">
                    Iniciar Análisis
                  </button>
                </div>
                <Sparkles size={120} className="absolute -bottom-8 -right-8 text-white/10 group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNavBar />
    </div>
    </RoleGuard>
  );
}
