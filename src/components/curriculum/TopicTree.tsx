"use client";

import { useState, useMemo, useEffect } from "react";
import { CheckCircle, ChevronDown, ChevronUp, Circle, Book, Loader2, Sparkles, CheckSquare, Square } from "lucide-react";
import { useApp } from "@/context/AppContext";
import LessonCopilotModal from "./LessonCopilotModal";
import { normalizeTopicForDisplay } from "@/lib/tejidoTemplate";

export default function TopicTree({ grade, subject }: { grade: string; subject: string }) {
  const { curriculum, updateTopicStatus, toggleTopicEje } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copilotTopic, setCopilotTopic] = useState<any>(null);

  // Seleccionar el currículo activo basado en los filtros
  const activeCurriculum = useMemo(() => {
    if (!curriculum.length || !grade || !subject) return null;
    const normStr = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    const targetSubject = normStr(subject);
    const targetGradeNum = grade.replace(/[^\d]/g, "");

    const candidates = curriculum.filter(c => c.grade.replace(/[^\d]/g, "") === targetGradeNum);
    return (
      candidates.find(c => normStr(c.subjectId) === targetSubject) ||
      candidates.find(c => normStr(c.subjectId).startsWith(targetSubject)) ||
      candidates.find(c => targetSubject.startsWith(normStr(c.subjectId))) ||
      null
    );
  }, [curriculum, grade, subject]);

  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    setLoadingProgress(0);
    if (activeCurriculum) return;

    const timer = setInterval(() => {
      setLoadingProgress(prev => (prev >= 90 ? 90 : prev + 10));
    }, 200);
    return () => clearInterval(timer);
  }, [activeCurriculum]);

  if (!activeCurriculum) {
    return (
      <div className="bg-white border border-outline-variant rounded-[2.5rem] p-16 text-center shadow-2xl space-y-6">
        <div className="relative w-24 h-24 mx-auto">
          <Book size={64} className="mx-auto text-primary/20 animate-pulse" />
          <Loader2 size={24} className="absolute bottom-0 right-0 text-primary animate-spin" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-xl font-black uppercase tracking-tighter italic">Buscando Tejido Institucional</h3>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">
            Sincronizando con la base de datos de {grade} - {subject}
          </p>
        </div>

        <div className="max-w-xs mx-auto">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>

        {loadingProgress === 90 && (
          <div className="pt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] inline-block">
              <div className="flex items-center gap-2 text-amber-700 mb-2 justify-center">
                <Sparkles size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">¿Tejido no encontrado?</span>
              </div>
              <p className="text-xs font-medium text-amber-900/70 mb-4">
                Usa el botón Cargar Tejido o Cargar PDF arriba para registrar la malla de este grado.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
            <span className="font-bold text-lg">{activeCurriculum.grade[0] || "C"}</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
              Puyuaizpa Putkit Kamna · Tejido de Aprendizaje - Grado {activeCurriculum.grade}
            </p>
            <h2 className="text-xl font-black text-on-surface uppercase italic tracking-tighter">
              {activeCurriculum.subjectId}
            </h2>
          </div>
        </div>
      </div>

      {activeCurriculum.objective && (
        <div className="mb-6 p-4 bg-surface-container border border-outline-variant rounded-xl">
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">
            Objetivo del Tejido
          </p>
          <p className="text-sm font-medium text-on-surface leading-relaxed">{activeCurriculum.objective}</p>
        </div>
      )}

      <div className="space-y-8">
        {[...activeCurriculum.units]
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(unit => {
            // Calcular cumplimiento de temas del periodo
            const unitNormTopics = unit.topics.map(t => ({ raw: t, norm: normalizeTopicForDisplay(t) }));
            const unitTotalEjes = unitNormTopics.reduce((acc, x) => acc + x.norm.ejes.length, 0);
            const unitDoneEjes = unitNormTopics.reduce((acc, x) => acc + x.norm.completedEjes.length, 0);
            const unitPct = unitTotalEjes > 0 ? Math.round((unitDoneEjes / unitTotalEjes) * 100) : 0;

            return (
              <div key={unit.id} id={`curriculum-unit-${unit.id}`} className="space-y-3 scroll-mt-24">
                <div className="flex flex-wrap items-center justify-between gap-2 px-2">
                  <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em]">
                    {unit.title}
                  </h3>
                  <span
                    className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                      unitPct === 100
                        ? "bg-emerald-100 text-emerald-800"
                        : unitPct > 0
                        ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Cumplimiento Periodo: {unitDoneEjes}/{unitTotalEjes} temas ({unitPct}%)
                  </span>
                </div>

                <div className="space-y-3">
                  {unitNormTopics.map(({ raw: topic, norm }) => {
                    const doneCount = norm.completedEjes.length;
                    const totalCount = norm.ejes.length;
                    const isAllDone = topic.status === "covered" || (totalCount > 0 && doneCount === totalCount);

                    return (
                      <div
                        key={topic.id}
                        className={`border rounded-2xl overflow-hidden transition-all ${
                          topic.status === "active"
                            ? "border-primary ring-1 ring-primary/15"
                            : isAllDone
                            ? "border-emerald-300"
                            : "border-outline-variant"
                        }`}
                      >
                        {/* Encabezado de la tarjeta: SIEMPRE muestra la Higra del Conocimiento */}
                        <div
                          onClick={() => setExpandedId(expandedId === topic.id ? null : topic.id)}
                          className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors ${
                            isAllDone ? "bg-emerald-50/40" : "bg-white hover:bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-start md:items-center gap-3 md:gap-4 flex-1 min-w-0 pr-2 md:pr-4">
                            <div
                              className="cursor-pointer hover:scale-110 transition-transform shrink-0 mt-0.5 md:mt-0"
                              title="Cambiar estado de la Higra (Pendiente / En curso / Cubierta)"
                              onClick={e => {
                                e.stopPropagation();
                                const nextStatus =
                                  topic.status === "covered"
                                    ? "not_started"
                                    : topic.status === "active"
                                    ? "covered"
                                    : "covered";
                                updateTopicStatus(activeCurriculum.id!, unit.id, topic.id, nextStatus as any);
                              }}
                            >
                              {isAllDone ? (
                                <CheckCircle size={24} className="text-emerald-600 fill-emerald-100" />
                              ) : (
                                <Circle
                                  size={24}
                                  className={topic.status === "active" ? "text-primary" : "text-outline"}
                                />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary">
                                  {topic.id} · Higra del Conocimiento
                                </span>
                                {norm.semanas && (
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                    {norm.semanas} semanas
                                  </span>
                                )}
                                <span
                                  className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                    isAllDone
                                      ? "bg-emerald-100 text-emerald-700"
                                      : doneCount > 0
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {doneCount}/{totalCount} temas impartidos
                                </span>
                              </div>

                              <h4 className="text-sm md:text-base font-black text-on-surface leading-snug">
                                {norm.higra}
                                {norm.higraDetalle ? (
                                  <span className="font-semibold text-on-surface-variant text-xs md:text-sm">
                                    {" "}
                                    — {norm.higraDetalle}
                                  </span>
                                ) : null}
                              </h4>

                              <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">
                                <strong className="text-emerald-700 uppercase text-[9px] tracking-wider">
                                  Temas de la Higra:{" "}
                                </strong>
                                {norm.ejes.join(" · ")}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setCopilotTopic({
                                ...topic,
                                title: norm.higra,
                                higra: norm.higra,
                                higraDetalle: norm.higraDetalle,
                                ejes: norm.ejes,
                                saber: norm.saber,
                                hacer: norm.hacer,
                                ser: norm.ser,
                                panapain: norm.panapain,
                                nanpaskas: norm.nanpaskas,
                                satIshkit: norm.satIshkit,
                                katkinAizpa: norm.katkinAizpa,
                              });
                            }}
                            className="mr-3 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl flex items-center gap-1.5 shrink-0 transition-colors shadow-sm border border-indigo-200 text-[10px] font-black uppercase tracking-wider"
                            title="Preparar Clase con IA sobre esta Higra"
                          >
                            <Sparkles size={15} />
                            <span className="hidden sm:inline">Preparar Clase IA</span>
                          </button>

                          {expandedId === topic.id ? (
                            <ChevronUp size={20} className="text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown size={20} className="text-slate-400 shrink-0" />
                          )}
                        </div>

                        {expandedId === topic.id && (
                          <div className="p-4 md:p-6 bg-surface-container-lowest border-t border-outline-variant space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                              {/* COLUMNA 1: TUH PUTKAMNA (HIGRA DEL CONOCIMIENTO) + TEMAS VERIFICABLES */}
                              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="text-[10px] font-black text-primary uppercase tracking-widest">
                                      Tuh Putkamna · Higra del Conocimiento
                                    </h5>
                                    <p className="text-[9px] font-bold text-on-surface-variant uppercase opacity-75">
                                      Base sobre la que se preparan las clases del periodo
                                    </p>
                                  </div>
                                  <span className="text-[10px] font-black text-primary bg-white px-2.5 py-1 rounded-full border border-primary/20">
                                    {doneCount}/{totalCount} cumplidos
                                  </span>
                                </div>

                                <p className="text-sm font-black text-on-surface">
                                  {norm.higra}
                                  {norm.higraDetalle ? ` — ${norm.higraDetalle}` : ""}
                                </p>

                                <div className="space-y-1.5 pt-1">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-primary/80">
                                    Temas de la Higra (marca cada tema al dictarlo):
                                  </p>
                                  {norm.ejes.map((eje, idx) => {
                                    const checked = isAllDone || norm.completedEjes.includes(eje);
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() =>
                                          toggleTopicEje(
                                            activeCurriculum.id!,
                                            unit.id,
                                            topic.id,
                                            eje,
                                            norm.ejes
                                          )
                                        }
                                        className={`w-full text-left flex items-start gap-2.5 p-2 rounded-lg border transition-all text-xs ${
                                          checked
                                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-900 font-bold"
                                            : "bg-white border-slate-200 text-on-surface hover:border-primary/40"
                                        }`}
                                      >
                                        {checked ? (
                                          <CheckSquare size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                                        ) : (
                                          <Square size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                        )}
                                        <span className="flex-1 leading-snug">{eje}</span>
                                        <span
                                          className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                            checked
                                              ? "bg-emerald-100 text-emerald-700"
                                              : "bg-amber-50 text-amber-700"
                                          }`}
                                        >
                                          {checked ? "Cumplido" : "Pendiente"}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* COLUMNA 2: PIANKAMMU MI — HILOS DEL SABER (SABER, HACER, SER) */}
                              <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-3">
                                <div>
                                  <h5 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                                    Piankammu Mi · Hilos del Saber
                                  </h5>
                                  <p className="text-[9px] font-bold text-emerald-700/70 uppercase">
                                    Se desprenden de la Higra del Conocimiento
                                  </p>
                                </div>

                                <div className="space-y-2.5">
                                  <div className="p-3 bg-white rounded-xl border border-emerald-200/70">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 block mb-0.5">
                                      Hilo SABER (Cognitivo)
                                    </span>
                                    <p className="text-xs font-medium text-on-surface leading-relaxed">
                                      {norm.saber}
                                    </p>
                                  </div>

                                  <div className="p-3 bg-white rounded-xl border border-blue-200/70">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-700 block mb-0.5">
                                      Hilo HACER (Procedimental)
                                    </span>
                                    <p className="text-xs font-medium text-on-surface leading-relaxed">
                                      {norm.hacer}
                                    </p>
                                  </div>

                                  <div className="p-3 bg-white rounded-xl border border-violet-200/70">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-violet-700 block mb-0.5">
                                      Hilo SER (Actitudinal y Comunitario)
                                    </span>
                                    <p className="text-xs font-medium text-on-surface leading-relaxed">
                                      {norm.ser}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* FILA INFERIOR: PIANAIZPA (SABIDURÍAS) Y SAT ISHKIT KAMTANA (TEJIENDO APRENDO) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                              <div className="p-4 bg-surface-container border border-outline-variant rounded-xl">
                                <h5 className="text-[10px] font-black text-on-surface uppercase tracking-widest mb-1">
                                  Pianaizpa · Sabidurías
                                </h5>
                                <div className="mt-2 space-y-3">
                                  <div>
                                    <span className="text-[9px] font-black text-primary uppercase block mb-0.5">
                                      Pañapain · Propia (Saberes del Territorio Awá)
                                    </span>
                                    <p className="text-xs font-medium text-on-surface leading-relaxed">
                                      {norm.panapain ||
                                        `Articulación de ${norm.higra} con la vida cotidiana, mingas y saberes del territorio Katsa Su.`}
                                    </p>
                                  </div>
                                  <div className="h-px w-full bg-outline-variant/50" />
                                  <div>
                                    <span className="text-[9px] font-black text-indigo-700 uppercase block mb-0.5">
                                      Ñanpaskas Piankamna · Intercultural (Saberes Universales)
                                    </span>
                                    <p className="text-xs font-medium text-on-surface leading-relaxed">
                                      {norm.nanpaskas ||
                                        `Aplicación de los estándares interculturales y científicos de ${norm.higra} en diálogo con otras culturas.`}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-col justify-between space-y-3">
                                <div>
                                  <h5 className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-0.5">
                                    Sat Ishkit Kamtana · Tejiendo Aprendo
                                  </h5>
                                  <p className="text-[9px] font-bold text-amber-700/80 uppercase mb-2">
                                    Metodología y Estrategias Didácticas
                                  </p>
                                  <p className="text-xs font-medium text-amber-950 whitespace-pre-wrap leading-relaxed">
                                    {norm.satIshkit ||
                                      "Trabajo individual y colaborativo, mesa redonda, exposiciones, lluvia de ideas, salidas de campo y carteleras."}
                                  </p>
                                </div>

                                {norm.katkinAizpa && (
                                  <div className="pt-2 border-t border-amber-200/70">
                                    <span className="text-[9px] font-black text-amber-800 uppercase block mb-0.5">
                                      Katkin Aizpa Saina · Recursos y Ayudas Pedagógicas
                                    </span>
                                    <p className="text-xs font-medium text-amber-900">{norm.katkinAizpa}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      <LessonCopilotModal
        isOpen={!!copilotTopic}
        onClose={() => setCopilotTopic(null)}
        topic={copilotTopic}
        subject={subject}
        grade={grade}
      />
    </div>
  );
}
