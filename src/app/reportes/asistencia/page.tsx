"use client";

import { useApp } from "@/context/AppContext";
import { Printer, ArrowLeft, Download, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function AttendanceReportPage() {
  const { students, profile } = useApp();
  const currentMonth = "ABRIL";
  const currentYear = "2025";
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-surface-container-lowest p-0 md:p-8 font-inter antialiased">
      {/* Controls - Hidden on Print */}
      <div className="max-w-[1200px] mx-auto mb-8 flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-xl border border-outline-variant/30 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/estudiantes" className="p-3 hover:bg-surface-container-low rounded-2xl transition-all">
            <ArrowLeft size={24} className="text-primary" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-primary">Generador de Reportes</h1>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">Lista de Asistencia Mensual Oficial</p>
          </div>
        </div>
        <div className="flex gap-4">
           <button onClick={handlePrint} className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
             <Printer size={20} /> Imprimir Reporte
           </button>
           <button className="px-8 py-4 bg-secondary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
             <Download size={20} /> Exportar PDF
           </button>
        </div>
      </div>

      {/* The Official Report Sheet */}
      <div className="bg-white mx-auto w-full max-w-[1400px] p-6 md:p-12 shadow-2xl border border-outline-variant/20 print:shadow-none print:border-none print:p-0 overflow-x-auto">
        
        {/* Institutional Header */}
        <div className="flex justify-between items-center mb-6 text-center border-b-2 border-on-surface pb-6">
          <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center border-2 border-on-surface/10 relative">
             <ShieldCheck size={48} className="text-primary/20" />
             <span className="absolute text-[8px] font-black uppercase">Logo UNIPA</span>
          </div>
          
          <div className="flex-1 space-y-0.5">
            <h2 className="text-lg font-black uppercase leading-tight">UNIDAD INDIGENA DEL PUEBLO AWA</h2>
            <h3 className="text-md font-bold uppercase leading-tight">GOBERNACION DE NARIÑO</h3>
            <h4 className="text-sm font-bold uppercase leading-tight">SECRETARIA DE EDUCACION DEPARTAMENTAL</h4>
            <p className="text-sm font-black uppercase italic">CONTRATO No. 1987 - 26 DEL 2025</p>
            <div className="mt-4 inline-block border-2 border-on-surface px-6 py-1">
               <span className="text-xs font-black uppercase tracking-[0.3em]">LISTA DE ASISTENCIA</span>
            </div>
          </div>

          <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center border-2 border-on-surface/10 relative">
             <ShieldCheck size={48} className="text-secondary/20" />
             <span className="absolute text-[8px] font-black uppercase">Logo IETABA</span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-12 gap-y-4 mb-8 text-[11px] font-bold">
           <div className="col-span-4 flex items-end gap-2">
             <span className="uppercase shrink-0 font-black">ESTABLECIMIENTO EDUCATIVO:</span>
             <span className="border-b border-on-surface flex-1 pb-1 uppercase">{profile.institution} - IETABA</span>
           </div>
           <div className="col-span-3 flex items-end gap-2">
             <span className="uppercase shrink-0 font-black">CODIGO DANE E.E.:</span>
             <span className="border-b border-on-surface flex-1 pb-1">252079002045</span>
           </div>
           <div className="col-span-3"></div>
           <div className="col-span-2 flex items-end gap-2">
             <span className="uppercase shrink-0 font-black">MES:</span>
             <span className="border-b border-on-surface flex-1 pb-1 uppercase text-center text-sm font-black">{currentMonth}</span>
           </div>

           <div className="col-span-4 flex items-end gap-2">
             <span className="uppercase shrink-0 font-black">NOMBRE DE LA SEDE:</span>
             <span className="border-b border-on-surface flex-1 pb-1 uppercase">SEDE # 01 I.E.T.A.B.A.</span>
           </div>
           <div className="col-span-3 flex items-end gap-2">
             <span className="uppercase shrink-0 font-black">CODIGO DANE SEDE:</span>
             <span className="border-b border-on-surface flex-1 pb-1">252079002045</span>
           </div>
        </div>

        {/* The Attendance Table */}
        <div className="border-[1.5px] border-on-surface overflow-hidden">
          <table className="w-full border-collapse text-[9px]">
            <thead>
              <tr className="bg-[#00a651] text-white">
                <th className="border border-on-surface p-1 w-6 text-center rotate-[-90deg] h-16">No</th>
                <th className="border border-on-surface p-1 w-8 text-center rotate-[-90deg]">GRAD</th>
                <th className="border border-on-surface p-1 w-10 text-center rotate-[-90deg]">TIPO DOC.</th>
                <th className="border border-on-surface p-1 w-24 text-center uppercase font-black">NRO DOCUMENTO</th>
                <th className="border border-on-surface p-1 w-24 text-center uppercase font-black">PRIMER APELLIDO</th>
                <th className="border border-on-surface p-1 w-24 text-center uppercase font-black">SEGUNDO APELLIDO</th>
                <th className="border border-on-surface p-1 w-24 text-center uppercase font-black">PRIMER NOMBRE</th>
                <th className="border border-on-surface p-1 w-24 text-center uppercase font-black">SEGUNDO NOMBRE</th>
                <th className="border border-on-surface p-1 w-24 text-center uppercase font-black">FECHA NACIMIENTO</th>
                <th className="border border-on-surface p-1 w-6 text-center rotate-[-90deg]">GENER O</th>
                {days.map(d => (
                  <th key={d} className={`border border-on-surface w-6 text-center font-black ${d === 23 ? 'bg-yellow-300 text-on-surface' : ''}`}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((st, idx) => (
                <tr key={st.id} className="h-7">
                  <td className="border border-on-surface text-center font-bold">{idx + 1}</td>
                  <td className="border border-on-surface text-center uppercase">{st.grado}</td>
                  <td className="border border-on-surface text-center uppercase">{st.tipoDocumento}</td>
                  <td className="border border-on-surface px-1 uppercase font-medium">{st.nroDocumento}</td>
                  <td className="border border-on-surface px-1 uppercase font-bold">{st.primerApellido}</td>
                  <td className="border border-on-surface px-1 uppercase font-bold">{st.segundoApellido}</td>
                  <td className="border border-on-surface px-1 uppercase font-bold">{st.primerNombre}</td>
                  <td className="border border-on-surface px-1 uppercase font-bold">{st.segundoNombre}</td>
                  <td className="border border-on-surface px-1 text-center">{st.fechaNacimiento}</td>
                  <td className="border border-on-surface text-center uppercase font-bold">{st.genero}</td>
                  {days.map(d => (
                    <td key={d} className={`border border-on-surface ${d === 23 ? 'bg-yellow-50' : ''}`}></td>
                  ))}
                </tr>
              ))}
              {/* Fill empty rows to reach a full page feel if few students */}
              {Array.from({ length: Math.max(0, 25 - students.length) }).map((_, i) => (
                <tr key={`empty-${i}`} className="h-7">
                  <td className="border border-on-surface"></td>
                  <td className="border border-on-surface"></td>
                  <td className="border border-on-surface"></td>
                  <td className="border border-on-surface"></td>
                  <td className="border border-on-surface"></td>
                  <td className="border border-on-surface"></td>
                  <td className="border border-on-surface"></td>
                  <td className="border border-on-surface"></td>
                  <td className="border border-on-surface"></td>
                  <td className="border border-on-surface"></td>
                  {days.map(d => <td key={d} className="border border-on-surface"></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        <div className="mt-8 grid grid-cols-2 gap-20 print:mt-12">
           <div className="border-t border-on-surface pt-2">
              <p className="text-[10px] font-black uppercase text-center">Firma del Docente</p>
           </div>
           <div className="border-t border-on-surface pt-2">
              <p className="text-[10px] font-black uppercase text-center">Sello de la Institución</p>
           </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
          }
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
