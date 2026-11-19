"use client";
import { normalizeGrade } from "@/lib/constants";
import { useApp } from "@/context/AppContext";
import {
  Cake, Users, TrendingUp, AlertTriangle, ChevronRight,
  UserCheck, Heart, X, Eye, MessageCircle, Printer, ShieldCheck
} from "lucide-react";
import { useMemo, useState } from "react";
import StudentProfileModal from "@/components/shared/StudentProfileModal";
import RecoveryPlanModal from "@/components/live-class/RecoveryPlanModal";
import Link from "next/link";

interface GovernanceKPIsProps {
  grado: string;
  curso: string;
  subject?: string;
}

type GovernanceModalType = "birthdays" | "gender" | "extraedad" | "governance" | null;

export default function GovernanceKPIs({ grado, curso, subject }: GovernanceKPIsProps) {
  const { students, myStudents, profile, masterData } = useApp();
  const [activeModal, setActiveModal] = useState<GovernanceModalType>(null);
  const [genderFilter, setGenderFilter] = useState<"ALL" | "M" | "F">("ALL");
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<any>(null);
  const [selectedRecoveryStudent, setSelectedRecoveryStudent] = useState<any>(null);

  const activeSubject =
    subject && subject !== "TODOS"
      ? subject
      : (masterData.subjects?.[0] as any)?.name || masterData.subjects?.[0] || "TECNOLOGÍA";

  const stats = useMemo(() => {
    const targetStudents = profile.isSuperAdmin ? students : myStudents;

    let active = targetStudents.filter(s => s.isActive !== false);
    if (grado !== "TODOS") {
      active = active.filter(s => normalizeGrade(s.grado) === grado);
    }
    if (curso !== "TODOS") {
      active = active.filter(s => s.curso === curso);
    }

    const today = new Date();
    const padZ = (n: number) => String(n).padStart(2, "0");
    const todayMD = `${padZ(today.getMonth() + 1)}-${padZ(today.getDate())}`;
    const monthM = padZ(today.getMonth() + 1);

    const parseBirth = (raw: any): Date | null => {
      if (!raw) return null;
      const str = String(raw).trim();
      if (!isNaN(Number(str)) && Number(str) > 10000) {
        const d = new Date((Number(str) - 25569) * 86400 * 1000);
        return isNaN(d.getTime()) ? null : d;
      }
      const d = new Date(str.slice(0, 10) + "T12:00:00");
      return isNaN(d.getTime()) ? null : d;
    };

    const birthdaysToday = active.filter(s => {
      const bDate = parseBirth(s.fechaNacimiento);
      if (!bDate) return false;
      return `${padZ(bDate.getMonth() + 1)}-${padZ(bDate.getDate())}` === todayMD;
    });

    const birthdaysMonth = active
      .filter(s => {
        const bDate = parseBirth(s.fechaNacimiento);
        if (!bDate) return false;
        return padZ(bDate.getMonth() + 1) === monthM;
      })
      .sort((a, b) => {
        const dA = parseBirth(a.fechaNacimiento)?.getDate() || 0;
        const dB = parseBirth(b.fechaNacimiento)?.getDate() || 0;
        return dA - dB;
      });

    const gender = {
      m: active.filter(s => s.genero === "M").length,
      f: active.filter(s => s.genero === "F").length,
      parity: 0,
    };
    gender.parity =
      active.length > 0 && Math.max(gender.m, gender.f) > 0
        ? Math.round((Math.min(gender.m, gender.f) / Math.max(gender.m, gender.f)) * 100)
        : 0;

    const extraedad = active
      .map(s => {
        const bDate = parseBirth(s.fechaNacimiento);
        const age = bDate ? today.getFullYear() - bDate.getFullYear() : 0;
        const gradeNum = parseInt(normalizeGrade(s.grado));
        const expectedMaxAge = !isNaN(gradeNum) ? gradeNum + 7 : 99;
        return {
          student: s,
          age,
          expectedMaxAge,
          isExtra: Boolean(bDate && !isNaN(gradeNum) && age > gradeNum + 8),
        };
      })
      .filter(item => item.isExtra);

    // Desglose por curso para Equidad y Gobernanza
    const courseBreakdownMap = new Map<string, { course: string; grade: string; total: number; m: number; f: number; withPhone: number }>();
    active.forEach(s => {
      const key = `${normalizeGrade(s.grado)}-${s.curso}`;
      const curr = courseBreakdownMap.get(key) || {
        course: s.curso,
        grade: normalizeGrade(s.grado),
        total: 0,
        m: 0,
        f: 0,
        withPhone: 0,
      };
      curr.total++;
      if (s.genero === "M") curr.m++;
      if (s.genero === "F") curr.f++;
      if (s.acudienteTelefono) curr.withPhone++;
      courseBreakdownMap.set(key, curr);
    });

    return {
      active,
      birthdaysToday,
      birthdaysMonth,
      gender,
      extraedad,
      totalActive: active.length,
      courseBreakdown: Array.from(courseBreakdownMap.values()),
      parseBirth,
    };
  }, [students, myStudents, profile.isSuperAdmin, grado, curso]);

  const { active, birthdaysToday, birthdaysMonth, gender, extraedad, totalActive, courseBreakdown, parseBirth } = stats;

  const sendBirthdayWhatsApp = (student: any) => {
    const phone = (student.acudienteTelefono || "").replace(/\D/g, "");
    const msg = `¡Feliz cumpleaños! 🎂🎉 La Institución Educativa Técnica Agropecuaria Bilingüe Awá (IETABA) felicita con mucho afecto a ${student.primerNombre} ${student.primerApellido} en su día especial.`;
    if (!phone) {
      navigator.clipboard?.writeText(msg);
      alert("El estudiante no tiene teléfono de acudiente registrado. Se copió el mensaje de felicitación al portapapeles.");
      return;
    }
    window.open(`https://wa.me/${phone.startsWith("57") ? phone : "57" + phone}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
  };

  const monthName = new Date().toLocaleDateString("es-CO", { month: "long" });

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 w-full max-w-full">
        {/* CARD 1: CUMPLEAÑOS (Pedagogía del Afecto) */}
        <button
          type="button"
          onClick={() => setActiveModal("birthdays")}
          className="text-left bg-white p-6 rounded-[2.5rem] border border-outline-variant shadow-sm hover:shadow-xl hover:border-rose-300 hover:-translate-y-1 transition-all group relative overflow-hidden animate-fade-in-up cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Cake size={80} />
          </div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <Cake size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Pedagogía del Afecto
              </span>
            </div>
            <ChevronRight size={16} className="text-rose-400 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="space-y-1 relative z-10">
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black tracking-tight text-on-surface">
                {birthdaysToday.length}
              </h3>
              <span className="text-xs font-bold text-on-surface-variant/40">HOY</span>
            </div>
            <p className="text-[11px] font-bold text-on-surface-variant leading-snug">
              {birthdaysMonth.length} cumpleañero{birthdaysMonth.length === 1 ? "" : "s"} este mes · <span className="text-rose-600 underline">Ver 360°</span>
            </p>
          </div>
          {birthdaysToday.length > 0 && (
            <div className="mt-4 space-y-2 relative z-10">
              {birthdaysToday.slice(0, 2).map(s => (
                <div key={s.id} className="p-2.5 bg-rose-50 rounded-xl border border-rose-100 flex items-center justify-between">
                  <p className="text-[10px] font-black text-rose-700 uppercase leading-tight truncate pr-2 flex-1">
                    🎉 {s.primerNombre} {s.primerApellido}
                  </p>
                  <div className="flex gap-1 shrink-0">
                    <span className="text-[8px] font-black bg-rose-200/50 text-rose-800 px-1.5 py-0.5 rounded-md uppercase">G: {normalizeGrade(s.grado)}</span>
                    <span className="text-[8px] font-black bg-rose-200/50 text-rose-800 px-1.5 py-0.5 rounded-md uppercase">C: {s.curso}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </button>

        {/* CARD 2: GÉNERO (Equidad Institucional) */}
        <button
          type="button"
          onClick={() => {
            setGenderFilter("ALL");
            setActiveModal("gender");
          }}
          className="text-left bg-white p-6 rounded-[2.5rem] border border-outline-variant shadow-sm hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all group relative overflow-hidden animate-fade-in-up cursor-pointer"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Users size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Equidad Institucional
              </span>
            </div>
            <ChevronRight size={16} className="text-blue-400 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-2xl font-black tracking-tighter text-on-surface">{gender.parity}%</h3>
              <p className="text-[11px] font-bold text-on-surface-variant">
                Índice de Paridad · <span className="text-blue-600 underline">Desglose</span>
              </p>
            </div>
            <div className="text-right">
              <div className="flex gap-1 mb-1 justify-end">
                <div className="w-2 h-4 bg-blue-400 rounded-full" />
                <div className="w-2 h-4 bg-rose-400 rounded-full" />
              </div>
              <p className="text-[9px] font-black text-on-surface-variant/60 uppercase">{gender.m}M | {gender.f}F</p>
            </div>
          </div>
          <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex shadow-inner">
            <div style={{ width: `${totalActive > 0 ? (gender.m / totalActive) * 100 : 0}%` }} className="bg-blue-500 h-full" />
            <div style={{ width: `${totalActive > 0 ? (gender.f / totalActive) * 100 : 0}%` }} className="bg-rose-500 h-full" />
          </div>
        </button>

        {/* CARD 3: EXTRAEDAD (Alerta Pedagógica) */}
        <button
          type="button"
          onClick={() => setActiveModal("extraedad")}
          className="text-left bg-white p-6 rounded-[2.5rem] border border-outline-variant shadow-sm hover:shadow-xl hover:border-amber-300 hover:-translate-y-1 transition-all group relative overflow-hidden animate-fade-in-up cursor-pointer"
          style={{ animationDelay: "200ms" }}
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <TrendingUp size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Alerta Pedagógica
              </span>
            </div>
            <ChevronRight size={16} className="text-amber-500 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tighter text-on-surface">
              {extraedad.length} <span className="text-xs font-bold text-on-surface-variant/40">CASOS</span>
            </h3>
            <p className="text-[11px] font-bold text-on-surface-variant">Riesgo por Extraedad Detectado</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-amber-600">
            <AlertTriangle size={14} />
            <span className="text-[10px] font-black uppercase underline">
              {extraedad.length > 0 ? "Intervención Recomendada · Ver Casos" : "Sin alertas de extraedad"}
            </span>
          </div>
        </button>

        {/* CARD 4: TOTAL (Gobernanza Activa) */}
        <button
          type="button"
          onClick={() => setActiveModal("governance")}
          className="text-left bg-on-surface p-6 rounded-[2.5rem] shadow-2xl hover:scale-[1.02] transition-all group relative overflow-hidden animate-fade-in-up cursor-pointer"
          style={{ animationDelay: "300ms" }}
        >
          <div className="absolute -right-4 -bottom-4 p-4 opacity-10 scale-150 rotate-12">
            <UserCheck size={80} className="text-white" />
          </div>
          <div className="flex items-center justify-between gap-2 mb-4 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors">
                <UserCheck size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                Gobernanza Activa
              </span>
            </div>
            <ChevronRight size={16} className="text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
          <div className="space-y-1 relative z-10">
            <h3 className="text-2xl font-black tracking-tighter text-white">{totalActive}</h3>
            <p className="text-[11px] font-bold text-white/60">Estudiantes bajo tu cuidado</p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-primary-container relative z-10">
            <Heart size={14} fill="currentColor" />
            <span className="text-[10px] font-black uppercase underline">Datos Protegidos 100% · Ver Auditoría</span>
          </div>
        </button>
      </div>

      {/* MODAL INTERACTIVO 360° DE GOBERNANZA */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[140] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-[2.5rem] max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[88vh] flex flex-col space-y-5"
          >
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                    activeModal === "birthdays"
                      ? "bg-rose-600"
                      : activeModal === "gender"
                      ? "bg-blue-600"
                      : activeModal === "extraedad"
                      ? "bg-amber-500"
                      : "bg-slate-900"
                  }`}
                >
                  {activeModal === "birthdays" && <Cake size={24} />}
                  {activeModal === "gender" && <Users size={24} />}
                  {activeModal === "extraedad" && <AlertTriangle size={24} />}
                  {activeModal === "governance" && <ShieldCheck size={24} />}
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Vista Interactiva 360° · {grado === "TODOS" ? "Todos los Grados" : `Grado ${grado}`} · {curso === "TODOS" ? "Todos los Cursos" : `Curso ${curso}`}
                  </span>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight mt-1">
                    {activeModal === "birthdays" && `Pedagogía del Afecto · Cumpleaños de ${monthName}`}
                    {activeModal === "gender" && `Equidad Institucional · Paridad ${gender.parity}% (${gender.m}M / ${gender.f}F)`}
                    {activeModal === "extraedad" && `Alerta Pedagógica · ${extraedad.length} Casos de Extraedad`}
                    {activeModal === "governance" && `Gobernanza Activa · ${totalActive} Estudiantes Bajo Tu Cuidado`}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cuerpo dinámico según tarjeta seleccionada */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
              {activeModal === "birthdays" && (
                <>
                  {birthdaysMonth.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <Cake size={36} className="mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-black uppercase">No hay cumpleañeros registrados en {monthName} para este filtro</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                      {birthdaysMonth.map(s => {
                        const bDate = parseBirth(s.fechaNacimiento);
                        const dayNum = bDate ? bDate.getDate() : "—";
                        const ageTurning = bDate ? new Date().getFullYear() - bDate.getFullYear() : null;
                        const isToday = birthdaysToday.some(t => t.id === s.id);
                        return (
                          <div
                            key={s.id}
                            className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-rose-50/40 transition-colors ${
                              isToday ? "bg-rose-50" : "bg-white"
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-0.5 rounded-lg bg-rose-100 text-rose-700 font-black text-[10px] uppercase">
                                  Día {dayNum} de {monthName}
                                </span>
                                {isToday && (
                                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[9px] uppercase animate-bounce">
                                    ¡Hoy Cumple Años!
                                  </span>
                                )}
                                {ageTurning && (
                                  <span className="text-[10px] font-bold text-slate-500">
                                    Cumple {ageTurning} años
                                  </span>
                                )}
                              </div>
                              <p className="text-xs font-black text-slate-900 uppercase mt-1">
                                {s.primerApellido} {s.segundoApellido} {s.primerNombre} {s.segundoNombre}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500">
                                Grado {normalizeGrade(s.grado)} · Curso {s.curso} · Doc: {s.nroDocumento}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => sendBirthdayWhatsApp(s)}
                                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                              >
                                <MessageCircle size={13} /> Felicitación WA
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedProfileStudent(s)}
                                className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye size={13} /> Ficha 360°
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {activeModal === "gender" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setGenderFilter("ALL")}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        genderFilter === "ALL" ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Total Activos</p>
                      <p className="text-xl font-black mt-0.5">{totalActive} estudiantes</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenderFilter("M")}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        genderFilter === "M" ? "border-blue-600 bg-blue-600 text-white" : "border-blue-200 bg-blue-50 text-blue-800"
                      }`}
                    >
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Masculino (M)</p>
                      <p className="text-xl font-black mt-0.5">
                        {gender.m} ({totalActive > 0 ? Math.round((gender.m / totalActive) * 100) : 0}%)
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenderFilter("F")}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        genderFilter === "F" ? "border-rose-600 bg-rose-600 text-white" : "border-rose-200 bg-rose-50 text-rose-800"
                      }`}
                    >
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Femenino (F)</p>
                      <p className="text-xl font-black mt-0.5">
                        {gender.f} ({totalActive > 0 ? Math.round((gender.f / totalActive) * 100) : 0}%)
                      </p>
                    </button>
                  </div>

                  {/* Resumen por salón */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-600">
                        <tr>
                          <th className="p-3">Grado / Curso</th>
                          <th className="p-3 text-center">Total</th>
                          <th className="p-3 text-center text-blue-700">Hombres (M)</th>
                          <th className="p-3 text-center text-rose-700">Mujeres (F)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {courseBreakdown.map((cb, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-black text-slate-800">Grado {cb.grade} · Curso {cb.course}</td>
                            <td className="p-3 text-center font-bold">{cb.total}</td>
                            <td className="p-3 text-center font-bold text-blue-700">{cb.m}</td>
                            <td className="p-3 text-center font-bold text-rose-700">{cb.f}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Lista de estudiantes filtrados por género */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {active
                      .filter(s => genderFilter === "ALL" || s.genero === genderFilter)
                      .map(s => (
                        <div key={s.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                          <div>
                            <p className="text-xs font-black text-slate-800 uppercase">
                              {s.primerApellido} {s.segundoApellido} {s.primerNombre} {s.segundoNombre}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500">
                              Grado {normalizeGrade(s.grado)} · {s.curso} · Género: {s.genero || "—"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedProfileStudent(s)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} /> Ficha 360°
                          </button>
                        </div>
                      ))}
                  </div>
                </>
              )}

              {activeModal === "extraedad" && (
                <>
                  {extraedad.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <AlertTriangle size={36} className="mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-black uppercase">No se detectaron estudiantes en extraedad para este filtro</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-amber-200 rounded-2xl overflow-hidden">
                      {extraedad.map(({ student: s, age, expectedMaxAge }) => (
                        <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/30 hover:bg-amber-50/70 transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-black text-[10px] uppercase">
                                Edad actual: {age} años
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                (Esperada para Grado {normalizeGrade(s.grado)}: ≤ {expectedMaxAge + 1} años)
                              </span>
                            </div>
                            <p className="text-xs font-black text-slate-900 uppercase mt-1">
                              {s.primerApellido} {s.segundoApellido} {s.primerNombre} {s.segundoNombre}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500">
                              Grado {normalizeGrade(s.grado)} · Curso {s.curso} · F. Nac: {String(s.fechaNacimiento || "").slice(0, 10)} · Promedio: {(s.avgGrade || 0).toFixed(1)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedRecoveryStudent(s)}
                              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                            >
                              <Printer size={12} /> Plan Nivelación
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedProfileStudent(s)}
                              className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye size={12} /> Ficha 360°
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeModal === "governance" && (
                <>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                        Protección Institucional y Cobertura 360°
                      </p>
                      <p className="text-xs font-bold text-emerald-700 mt-0.5">
                        {totalActive} estudiantes activos sincronizados con respaldo local e integridad SIEEE / SIMAT.
                      </p>
                    </div>
                    <Link
                      href="/estudiantes"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider shrink-0"
                    >
                      Ir a Estudiantes
                    </Link>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {active.map(s => (
                      <div key={s.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <p className="text-xs font-black text-slate-800 uppercase">
                            {s.primerApellido} {s.segundoApellido} {s.primerNombre} {s.segundoNombre}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500">
                            Doc: {s.nroDocumento} · Grado {normalizeGrade(s.grado)} ({s.curso}) · Acudiente: {s.acudienteNombres ? `${s.acudienteNombres} ${s.acudienteApellidos || ""}` : "Pendiente"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedProfileStudent(s)}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-primary text-white text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye size={12} /> Ficha 360°
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedProfileStudent && (
        <StudentProfileModal
          student={selectedProfileStudent}
          onClose={() => setSelectedProfileStudent(null)}
        />
      )}

      {selectedRecoveryStudent && (
        <RecoveryPlanModal
          isOpen={!!selectedRecoveryStudent}
          onClose={() => setSelectedRecoveryStudent(null)}
          student={selectedRecoveryStudent}
          subject={activeSubject}
        />
      )}
    </>
  );
}
