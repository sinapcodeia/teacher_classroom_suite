"use client";

import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import { useApp } from "@/context/AppContext";
import { Calendar, Clock, BookOpen, GraduationCap, ArrowLeft, Printer, Download } from "lucide-react";
import Link from "next/link";

const DAYS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES"];
const TIME_SLOTS = [
  "07:30 - 08:30",
  "08:30 - 09:30",
  "09:30 - 10:30",
  "10:30 - 11:00", // DESCANSO
  "11:00 - 11:50",
  "11:50 - 12:40",
  "12:40 - 13:30"
];

export default function HorarioPage() {
  const { schedule, profile } = useApp();

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest font-inter">
      <TopAppBar />
      
      <main className="pt-24 px-6 max-w-7xl mx-auto w-full pb-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
             <Link href="/" className="p-3 bg-white border border-outline-variant rounded-2xl hover:bg-primary/5 hover:border-primary transition-all group">
                <ArrowLeft size={24} className="text-on-surface-variant group-hover:text-primary" />
             </Link>
             <div>
                <h1 className="text-3xl font-black text-on-surface tracking-tighter uppercase italic">Horario Institucional</h1>
                <p className="text-[10px] font-black text-on-surface-variant opacity-60 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Calendar size={14} /> Gestión Semanal {profile.institution}
                </p>
             </div>
          </div>
          <div className="flex gap-3">
             <button onClick={() => window.print()} className="px-6 py-3 bg-white border border-outline-variant text-on-surface-variant rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-surface-container-low transition-all flex items-center gap-2">
                <Printer size={18} /> Imprimir
             </button>
             <button className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                <Download size={18} /> Exportar PDF
             </button>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="bg-white border border-outline-variant rounded-[3rem] shadow-2xl overflow-hidden overflow-x-auto">
          <table className="w-full border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[10px] font-black uppercase tracking-[0.3em]">
                <th className="px-8 py-6 border-r border-outline-variant/30 text-left w-48">HORA / DÍA</th>
                {DAYS.map(day => (
                  <th key={day} className="px-8 py-6 border-r border-outline-variant/30 text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {TIME_SLOTS.map(slot => {
                const isDescanso = slot === "10:30 - 11:00";
                
                return (
                  <tr key={slot} className={`group ${isDescanso ? 'bg-surface-container-low' : 'hover:bg-surface-container-lowest'}`}>
                    <td className="px-8 py-6 border-r border-outline-variant/30 font-black text-[11px] text-on-surface-variant flex items-center gap-3">
                       <Clock size={16} className="opacity-40" /> {slot}
                    </td>
                    {DAYS.map(day => {
                      if (isDescanso) {
                        return (
                          <td key={day} className="px-8 py-6 border-r border-outline-variant/30 text-center">
                            <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.5em] italic">DESCANSO</span>
                          </td>
                        );
                      }

                      const entry = schedule.find(s => s.day === day && s.time === slot);
                      
                      return (
                        <td key={day} className="p-2 border-r border-outline-variant/30 align-top h-32">
                          {entry ? (
                            <Link 
                              href={`/clase-en-vivo?subject=${encodeURIComponent(entry.subject)}&curso=${encodeURIComponent(entry.group)}`}
                              className={`h-full p-4 rounded-2xl border-2 shadow-sm flex flex-col justify-between transition-all hover:shadow-lg hover:-translate-y-1 block cursor-pointer ${entry.color}`}
                            >
                               <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                     <BookOpen size={14} className="opacity-40" />
                                     <span className="text-[8px] font-black uppercase opacity-60">Matrícula {entry.group}</span>
                                  </div>
                                  <p className="font-black text-[11px] leading-tight mt-1">{entry.subject}</p>
                               </div>
                               <div className="flex items-center gap-2 mt-4 pt-3 border-t border-black/5">
                                  <GraduationCap size={14} className="opacity-40" />
                                  <span className="text-[10px] font-black">GRADO {entry.group}</span>
                               </div>
                            </Link>
                          ) : (
                            <div className="h-full border-2 border-dashed border-outline-variant/20 rounded-2xl flex items-center justify-center">
                               <span className="text-[8px] font-black text-outline-variant uppercase tracking-widest opacity-30">Libre</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Card */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-primary/5 border border-primary/20 p-8 rounded-[2.5rem] flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20">
                 <BookOpen size={32} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Carga Académica</p>
                 <p className="text-2xl font-black text-on-surface">{schedule.length} SESIONES / SEMANA</p>
              </div>
           </div>
           
           <div className="bg-secondary/5 border border-secondary/20 p-8 rounded-[2.5rem] flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-secondary text-white flex items-center justify-center shadow-xl shadow-secondary/20">
                 <GraduationCap size={32} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Población Estudiantil</p>
                 <p className="text-2xl font-black text-on-surface">11 GRADOS DIFERENTES</p>
              </div>
           </div>

           <div className="bg-white border border-outline-variant p-8 rounded-[2.5rem] flex items-center gap-6 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-surface-container-high text-on-surface flex items-center justify-center">
                 <Clock size={32} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Jornada Laboral</p>
                 <p className="text-2xl font-black text-on-surface">07:30 AM — 01:30 PM</p>
              </div>
           </div>
        </div>
      </main>

      <BottomNavBar />

      <style jsx global>{`
        @media print {
          .no-print, header, footer, nav, button {
            display: none !important;
          }
          main {
            padding: 0 !important;
            max-width: 100% !important;
          }
          .bg-white {
            border: none !important;
            box-shadow: none !important;
          }
          table {
            min-width: 100% !important;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
