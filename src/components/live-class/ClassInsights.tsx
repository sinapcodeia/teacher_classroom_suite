"use client";

import { useMemo, useState } from "react";
import {
  Sparkles, AlertTriangle, Lightbulb, ArrowUpRight,
  TrendingDown, X, Eye, Printer, MessageCircle, CheckCircle2, Copy
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { matchStudentCourse, normalizeGrade } from "@/lib/constants";
import StudentProfileModal from "@/components/shared/StudentProfileModal";
import RecoveryPlanModal from "@/components/live-class/RecoveryPlanModal";

interface ClassInsightsProps {
  course: string;
  subject: string;
  grade?: string;
  onApplyWorkshopTitle?: (title: string) => void;
}

type InsightModalTab = "absence" | "failing" | "workshop";

export default function ClassInsights({ course, subject, grade, onApplyWorkshopTitle }: ClassInsightsProps) {
  const targetGrade = grade || "TODOS";
  const { myStudents } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<InsightModalTab>("absence");
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<any>(null);
  const [selectedRecoveryStudent, setSelectedRecoveryStudent] = useState<any>(null);
  const [copiedToast, setCopiedToast] = useState(false);

  const analysis = useMemo(() => {
    const classStudents = myStudents.filter(
      s =>
        matchStudentCourse(s.curso, course, s.grado, targetGrade) &&
        (targetGrade === "TODOS" || normalizeGrade(s.grado) === normalizeGrade(targetGrade)) &&
        s.isActive !== false
    );

    const atRiskAbsence = classStudents
      .map(s => {
        const absCount = s.attendanceRecord
          ? Object.values(s.attendanceRecord).filter(v => v === "absent").length
          : 0;
        const lateCount = s.attendanceRecord
          ? Object.values(s.attendanceRecord).filter(v => v === "late").length
          : 0;
        return { student: s, absCount, lateCount };
      })
      .filter(item => item.absCount >= 3)
      .sort((a, b) => b.absCount - a.absCount);

    const classAvg =
      classStudents.length > 0
        ? classStudents.reduce((acc, s) => acc + (s.avgGrade || 0), 0) / classStudents.length
        : 0;

    const failingStudents = classStudents
      .filter(s => (s.avgGrade || 0) > 0 && (s.avgGrade || 0) < 3.0)
      .sort((a, b) => (a.avgGrade || 0) - (b.avgGrade || 0));

    const sub = subject.toUpperCase();
    let aiSuggestion = {
      title: "IA Sugiere: Taller Territorial de Aplicación",
      shortTitle: "Taller Territorial de Aplicación",
      message: "La IA sugiere un Taller de Aplicación conceptual en parejas enfocado en el territorio con exposición al final.",
    };

    if (classAvg > 0) {
      if (classAvg < 3.5) {
        if (sub.includes("MATEMÁTICAS")) {
          aiSuggestion = {
            title: "IA Sugiere: Nivelación con la Chagra",
            shortTitle: "Taller Nivelación con la Chagra",
            message: "Realizar un taller de sumas y conteo práctico usando productos recolectados en la chagra escolar (yuca, plátano) para afianzar operaciones básicas.",
          };
        } else if (sub.includes("TECNOLOGÍA") || sub.includes("INFORMÁTICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Tabla de Producción Veredal",
            shortTitle: "Tabla de Producción Veredal",
            message: "Diseñar una tabla simple de 3 columnas (Cosecha, Consumo, Excedente) en papel o equipo para organizar la producción de la vereda.",
          };
        } else if (sub.includes("FÍSICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Práctica de Fuerzas y Trapiche",
            shortTitle: "Práctica de Fuerzas y Trapiche",
            message: "Explicar los conceptos de tensión y palancas comparándolos con el funcionamiento y tracción motriz del trapiche panelero local.",
          };
        } else if (sub.includes("ÉTICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Círculo de Palabra y Minga",
            shortTitle: "Círculo de Palabra y Minga",
            message: "Llevar a cabo una ronda de diálogo basada en los valores Awá de ayuda mutua ('Minga') para resolver desacuerdos en el grupo.",
          };
        } else {
          aiSuggestion = {
            title: `IA Sugiere: Refuerzo de ${subject}`,
            shortTitle: `Glosario Territorial de ${subject}`,
            message: `Elaborar un glosario visual de los términos principales de la clase de ${subject} y su relación con las labores del Diviso.`,
          };
        }
      } else if (classAvg >= 4.2) {
        if (sub.includes("MATEMÁTICAS")) {
          aiSuggestion = {
            title: "IA Sugiere: Cestería y Simetría Awá",
            shortTitle: "Cestería y Simetría Awá",
            message: "Taller avanzado aplicando geometría espacial para diseñar patrones y simetrías circulares basadas en el tejido de canastos tradicionales.",
          };
        } else if (sub.includes("TECNOLOGÍA") || sub.includes("INFORMÁTICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Algoritmo de Riego Agroecológico",
            shortTitle: "Algoritmo de Riego Agroecológico",
            message: "Desarrollar un diagrama de flujo para programar un sistema de riego casero automatizado con materiales reciclados.",
          };
        } else if (sub.includes("FÍSICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Termodinámica y Evaporación",
            shortTitle: "Termodinámica y Evaporación",
            message: "Estudiar la transferencia de calor latente y la evaporación analizando el proceso de cocción del jugo de caña para hacer panela.",
          };
        } else if (sub.includes("ÉTICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Minga de Liderazgo Comunitario",
            shortTitle: "Minga de Liderazgo Comunitario",
            message: "Elaborar un plan de acción grupal donde los estudiantes propongan soluciones a problemas de basura y agua en su vereda.",
          };
        } else {
          aiSuggestion = {
            title: `IA Sugiere: Profundización en ${subject}`,
            shortTitle: `Proyecto Territorial ${subject}`,
            message: `Proyecto de investigación del rol de ${subject} en la soberanía alimentaria o protección del entorno indígena.`,
          };
        }
      } else {
        if (sub.includes("MATEMÁTICAS")) {
          aiSuggestion = {
            title: "IA Sugiere: Presupuesto y Comercio Local",
            shortTitle: "Presupuesto y Comercio Local",
            message: "Taller de cálculo básico simulando compras, ventas y trueques cotidianos en la plaza o mercado comunitario de la región.",
          };
        } else if (sub.includes("TECNOLOGÍA") || sub.includes("INFORMÁTICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Inventario de Saberes Locales",
            shortTitle: "Inventario de Saberes Locales",
            message: "Estructurar una base de datos o tabla conceptual con las tecnologías tradicionales Awá y su importancia ecológica.",
          };
        } else if (sub.includes("FÍSICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Gravedad y Fluidos en Ríos",
            shortTitle: "Gravedad y Fluidos en Ríos",
            message: "Analizar el caudal y la velocidad del agua en las quebradas locales usando botellas flotantes como experimento práctico de campo.",
          };
        } else if (sub.includes("ÉTICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Relación Territorio y Awá",
            shortTitle: "Relación Territorio y Awá",
            message: "Debate guiado sobre cómo el cuidado del medio ambiente y los ríos fortalece la identidad del joven en la comunidad.",
          };
        } else {
          aiSuggestion = {
            title: `IA Sugiere: Aplicación de ${subject}`,
            shortTitle: `Aplicación Katsa Su - ${subject}`,
            message: `Dinámica de roles para exponer en grupos cómo el tema de hoy en ${subject} se conecta con el bienestar de Katsa Su.`,
          };
        }
      }
    }

    const cards: {
      id: InsightModalTab;
      title: string;
      message: string;
      cta: string;
      type: "warning" | "tip" | "success";
      icon: any;
    }[] = [];

    if (atRiskAbsence.length > 0) {
      cards.push({
        id: "absence",
        title: "Alerta de Deserción",
        message: `Hay ${atRiskAbsence.length} estudiante(s) con inasistencia crítica (≥ 3 fallas). Se sugiere citar a acudientes.`,
        cta: `Ver ${atRiskAbsence.length} caso(s) y citar acudientes →`,
        type: "warning",
        icon: AlertTriangle,
      });
    }

    if (failingStudents.length > 0) {
      const pct = classStudents.length > 0 ? Math.round((failingStudents.length / classStudents.length) * 100) : 0;
      cards.push({
        id: "failing",
        title: "Refuerzo Necesario",
        message: `El ${pct}% del grupo (${failingStudents.length} est.) tiene bajo rendimiento (< 3.0). Considera una sesión de nivelación.`,
        cta: `Ver ${failingStudents.length} estudiante(s) y generar nivelación →`,
        type: "warning",
        icon: TrendingDown,
      });
    } else {
      cards.push({
        id: "failing",
        title: "Rendimiento Estable",
        message: `El rendimiento promedio grupal es de ${classAvg.toFixed(1)} / 5.0. Ningún estudiante en reprobación crítica.`,
        cta: "Ver desglose del grupo →",
        type: "success",
        icon: ArrowUpRight,
      });
    }

    cards.push({
      id: "workshop",
      title: aiSuggestion.title,
      message: aiSuggestion.message,
      cta: "Aplicar actividad o ver detalle →",
      type: "tip",
      icon: Lightbulb,
    });

    return {
      classStudents,
      atRiskAbsence,
      failingStudents,
      classAvg,
      aiSuggestion,
      cards,
    };
  }, [myStudents, course, subject, targetGrade]);

  const copySuggestion = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard?.writeText(`${analysis.aiSuggestion.title}: ${analysis.aiSuggestion.message}`);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const sendAbsenceWA = (student: any, absCount: number) => {
    const phone = (student.acudienteTelefono || "").replace(/\D/g, "");
    const msg = `Cordial saludo desde IETABA. Informamos que el estudiante ${student.primerNombre} ${student.primerApellido} (Grado ${normalizeGrade(student.grado)} - ${student.curso}) registra ${absCount} inasistencias acumuladas en ${subject}. Solicitamos su presencia o comunicación oportuna.`;
    if (!phone) {
      navigator.clipboard?.writeText(msg);
      alert("El estudiante no tiene teléfono registrado. Se copió la citación al portapapeles.");
      return;
    }
    window.open(`https://wa.me/${phone.startsWith("57") ? phone : "57" + phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <>
      <section className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

        <div className="flex items-center justify-between gap-3 mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
              <Sparkles size={20} className="text-primary-container" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-tighter italic">Asistente IA IETABA</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Análisis predictivo de aula 360° ({analysis.classStudents.length} est.)
              </p>
            </div>
          </div>
          {copiedToast && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black uppercase">
              ¡Copiado!
            </span>
          )}
        </div>

        <div className="space-y-4 relative z-10">
          {analysis.cards.map((insight, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => {
                setActiveTab(insight.id);
                setModalOpen(true);
              }}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  setActiveTab(insight.id);
                  setModalOpen(true);
                }
              }}
              className={`p-4 rounded-2xl border flex gap-4 transition-all hover:-translate-y-0.5 cursor-pointer group ${
                insight.type === "warning"
                  ? "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/15 hover:border-rose-400/40"
                  : insight.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15 hover:border-emerald-400/40"
                  : "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15 hover:border-blue-400/40"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
                  insight.type === "warning"
                    ? "bg-rose-500/20 text-rose-400"
                    : insight.type === "success"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-blue-500/20 text-blue-400"
                }`}
              >
                <insight.icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <h3
                    className={`text-[11px] font-black uppercase tracking-widest mb-1 ${
                      insight.type === "warning"
                        ? "text-rose-400"
                        : insight.type === "success"
                        ? "text-emerald-400"
                        : "text-blue-400"
                    }`}
                  >
                    {insight.title}
                  </h3>
                  {insight.type === "tip" && (
                    <button
                      type="button"
                      onClick={copySuggestion}
                      className="text-[8px] font-black text-blue-300 hover:text-white uppercase tracking-wider bg-blue-500/20 hover:bg-blue-500/40 px-2 py-0.5 rounded border border-blue-400/30 transition-all shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Copy size={10} /> Copiar
                    </button>
                  )}
                </div>
                <p className="text-[11px] font-medium text-slate-300 leading-relaxed">{insight.message}</p>
                <p className="text-[9px] font-black uppercase tracking-wider text-white/80 group-hover:text-white underline mt-2">
                  {insight.cta}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setActiveTab(analysis.atRiskAbsence.length > 0 ? "absence" : "failing");
            setModalOpen(true);
          }}
          className="w-full mt-6 py-3.5 bg-white/10 border border-white/15 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary hover:border-primary transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
        >
          <Sparkles size={14} /> Ver Reporte de IA Completo 360°
        </button>
      </section>

      {/* MODAL 360° DEL ASISTENTE IA DE AULA */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[140] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-[2.5rem] max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[88vh] flex flex-col space-y-5 text-slate-900"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 shrink-0">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-900 text-blue-300">
                  Asistente IA IETABA · Diagnóstico 360° de Aula
                </span>
                <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight mt-1">
                  {subject} · Grado {targetGrade} · Curso {course}
                </h3>
                <p className="text-[11px] font-bold text-slate-500">
                  {analysis.classStudents.length} estudiantes evaluados · Promedio actual: {analysis.classAvg.toFixed(2)} / 5.0
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Pestañas interactivas */}
            <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("absence")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "absence"
                    ? "bg-rose-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <AlertTriangle size={13} /> Alerta Deserción ({analysis.atRiskAbsence.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("failing")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "failing"
                    ? "bg-amber-500 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <TrendingDown size={13} /> Refuerzo / Nivelación ({analysis.failingStudents.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("workshop")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "workshop"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <Lightbulb size={13} /> Taller Sugerido IA
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
              {activeTab === "absence" && (
                <>
                  {analysis.atRiskAbsence.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
                      <p className="text-xs font-black uppercase">Ningún estudiante supera el umbral crítico de 3 inasistencias</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-rose-200 rounded-2xl overflow-hidden">
                      {analysis.atRiskAbsence.map(({ student: s, absCount, lateCount }) => (
                        <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-rose-50/40">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-slate-900 uppercase">
                                {s.primerApellido} {s.segundoApellido} {s.primerNombre} {s.segundoNombre}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-black uppercase">
                                {absCount} Inasistencias {lateCount > 0 ? `· ${lateCount} Retardos` : ""}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 mt-1">
                              Grado {normalizeGrade(s.grado)} · Curso {s.curso} · Promedio: {(s.avgGrade || 0).toFixed(1)} · Acudiente: {s.acudienteNombres || "Sin registrar"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => sendAbsenceWA(s, absCount)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer"
                            >
                              <MessageCircle size={11} /> Citar Acudiente
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedProfileStudent(s)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-primary text-white text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={11} /> Ficha 360°
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "failing" && (
                <>
                  {analysis.failingStudents.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500" />
                      <p className="text-xs font-black uppercase">Todos los estudiantes del filtro mantienen promedio ≥ 3.0</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-amber-200 rounded-2xl overflow-hidden">
                      {analysis.failingStudents.map(s => (
                        <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50/40">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900 uppercase">
                                {s.primerApellido} {s.segundoApellido} {s.primerNombre} {s.segundoNombre}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[9px] font-black uppercase">
                                Promedio: {(s.avgGrade || 0).toFixed(2)}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 mt-1">
                              Grado {normalizeGrade(s.grado)} · Curso {s.curso} · Doc: {s.nroDocumento}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedRecoveryStudent(s)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer"
                            >
                              <Printer size={11} /> Plan Nivelación
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedProfileStudent(s)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-primary text-white text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={11} /> Ficha 360°
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "workshop" && (
                <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-200 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-[9px] font-black uppercase tracking-wider">
                      Propuesta Didáctica Territorial Awá
                    </span>
                    <button
                      type="button"
                      onClick={() => copySuggestion()}
                      className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 text-[10px] font-black uppercase flex items-center gap-1.5 hover:bg-indigo-100 cursor-pointer"
                    >
                      <Copy size={12} /> Copiar Texto
                    </button>
                  </div>
                  <h4 className="text-base font-black text-slate-900 uppercase">{analysis.aiSuggestion.title}</h4>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed">{analysis.aiSuggestion.message}</p>
                  {onApplyWorkshopTitle && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyWorkshopTitle(analysis.aiSuggestion.shortTitle);
                        setModalOpen(false);
                      }}
                      className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-md"
                    >
                      Usar este taller en el Calificador de Actividades →
                    </button>
                  )}
                </div>
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
          subject={subject}
        />
      )}
    </>
  );
}
