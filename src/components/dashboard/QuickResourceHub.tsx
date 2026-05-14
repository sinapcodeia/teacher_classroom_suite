"use client";

import { 
  BookOpen, Calculator, FileSpreadsheet, 
  Presentation, LayoutGrid, Sparkles, ArrowUpRight,
  ClipboardList, Users, History
} from "lucide-react";
import Link from "next/link";

const RESOURCES = [
  { 
    title: "Planilla Maestra", 
    desc: "Carga y descarga de notas masivas",
    icon: FileSpreadsheet, 
    href: "/clase-en-vivo?view=gradebook",
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  { 
    title: "Control Asistencia", 
    desc: "Registro oficial y alertas de ausentismo",
    icon: ClipboardList, 
    href: "/clase-en-vivo",
    color: "text-emerald-600",
    bg: "bg-emerald-50"
  },
  { 
    title: "Currículo Institucional", 
    desc: "Hijos del Saber y Tejidos de Aprendizaje",
    icon: BookOpen, 
    href: "/curriculo",
    color: "text-purple-600",
    bg: "bg-purple-50"
  },
  { 
    title: "Seguimiento Grupal", 
    desc: "Observaciones y alertas de convivencia",
    icon: Users, 
    href: "/estudiantes",
    color: "text-amber-600",
    bg: "bg-amber-50"
  }
];

export default function QuickResourceHub() {
  return (
    <section className="bg-white rounded-[2.5rem] p-8 border border-outline-variant shadow-xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
            <LayoutGrid size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-on-surface uppercase tracking-tighter italic">Recursos de Clase</h2>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Acceso intuitivo a herramientas clave</p>
          </div>
        </div>
        <Sparkles size={20} className="text-amber-400 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {RESOURCES.map((r, i) => (
          <Link 
            key={i} 
            href={r.href}
            className={`p-5 rounded-3xl border border-transparent hover:border-outline-variant/30 ${r.bg} flex flex-col gap-4 transition-all hover:bg-white hover:shadow-2xl hover:shadow-slate-200 group/item`}
          >
            <div className="flex justify-between items-start">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover/item:rotate-6 ${r.bg} group-hover/item:bg-white border group-hover/item:border-slate-100`}>
                <r.icon size={22} className={r.color} />
              </div>
              <ArrowUpRight size={16} className={`${r.color} opacity-40 group-hover/item:opacity-100 transition-all`} />
            </div>
            <div>
              <h3 className={`text-[11px] font-black uppercase leading-tight ${r.color}`}>{r.title}</h3>
              <p className="text-[9px] font-medium text-slate-500 mt-1 uppercase opacity-60 leading-relaxed">{r.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-outline-variant/30 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Sugerencia IA:</span>
        </div>
        <p className="text-[10px] font-bold text-on-surface italic text-right flex-1 ml-4 opacity-70">
          &quot;Recuerda que hoy es el cierre del Tema de Tecnología. No olvides registrar la evaluación.&quot;
        </p>
      </div>
    </section>
  );
}
