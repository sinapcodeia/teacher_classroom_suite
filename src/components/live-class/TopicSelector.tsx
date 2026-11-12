"use client";

import { useState, useMemo } from "react";
import { useApp, Slide } from "@/context/AppContext";
import {
  BookOpen,
  ChevronDown,
  Target,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowRight,
  BrainCircuit,
  Lightbulb,
  Wand2,
  Play,
  CheckSquare,
  Square,
  CheckCircle2,
} from "lucide-react";
import SlideViewer from "@/components/presentation/SlideViewer";
import GeniallyWizard from "@/components/presentation/GeniallyWizard";
import { normalizeTopicForDisplay, computeCurriculumCoverage } from "@/lib/tejidoTemplate";

interface TopicSelectorProps {
  subjectId?: string; // e.g. "Matemáticas"
  grade?: string;     // e.g. "11°"
}

export default function TopicSelector({ subjectId, grade }: TopicSelectorProps) {
  const { curriculum, updateTopicStatus, toggleTopicEje, updateTopicSlides, masterData } = useApp();
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [isPresenting, setIsPresenting] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [activeCustomSlides, setActiveCustomSlides] = useState<Slide[] | undefined>(undefined);

  const activeCurriculum = useMemo(() => {
    if (!curriculum.length || !subjectId) return null;

    const normStr = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();

    const targetSubject = normStr(subjectId);
    const gradeNum = (grade || "").replace(/[^\d]/g, "");

    const candidates = curriculum.filter(c => {
      const cGradeNum = c.grade.replace(/[^\d]/g, "");
      return gradeNum && cGradeNum === gradeNum;
    });

    if (candidates.length === 0) return null;

    const exactMatch = candidates.find(c => normStr(c.subjectId) === targetSubject);
    if (exactMatch) return exactMatch;

    const startsWithMatch = candidates.find(c => normStr(c.subjectId).startsWith(targetSubject));
    if (startsWithMatch) return startsWithMatch;

    const reverseStartsWithMatch = candidates.find(c => targetSubject.startsWith(normStr(c.subjectId)));
    if (reverseStartsWithMatch) return reverseStartsWithMatch;

    return null;
  }, [curriculum, subjectId, grade]);

  const coverage = useMemo(() => computeCurriculumCoverage(activeCurriculum), [activeCurriculum]);

  // Aplanar todas las Higras con su información normalizada (Higra, Temas/Ejes, Saber, Hacer, Ser)
  const allTopics = useMemo(() => {
    if (!activeCurriculum) return [];
    return [...activeCurriculum.units]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .flatMap((u, uIdx) =>
        u.topics.map(t => ({
          ...t,
          unitId: u.id,
          unitOrder: u.order || uIdx + 1,
          unitTitle: u.title,
          norm: normalizeTopicForDisplay(t),
        }))
      );
  }, [activeCurriculum]);

  const selectedTopic = useMemo(() => {
    if (selectedTopicId) return allTopics.find(t => t.id === selectedTopicId) || allTopics[0];
    const nextPending = allTopics.find(t => t.status !== "covered" && t.norm.completedEjes.length < t.norm.ejes.length);
    return nextPending || allTopics[0];
  }, [allTopics, selectedTopicId]);

  const normSelected = selectedTopic?.norm;
  const isCurrentTopicCovered =
    selectedTopic?.status === "covered" ||
    (normSelected ? normSelected.ejes.length > 0 && normSelected.completedEjes.length >= normSelected.ejes.length : false);

  const nextPendingEje = useMemo(() => {
    if (!normSelected) return null;
    return normSelected.ejes.find(e => !normSelected.completedEjes.includes(e)) || null;
  }, [normSelected]);

  const nextSuggestedTopic = useMemo(() => {
    if (!selectedTopic) return null;
    const currentIndex = allTopics.findIndex(t => t.id === selectedTopic.id);
    return allTopics.slice(currentIndex + 1).find(t => t.status !== "covered") || allTopics[currentIndex + 1] || null;
  }, [allTopics, selectedTopic]);

  const activePeriodNum = useMemo(() => {
    const p = masterData?.activePeriod || "p2";
    if (p.includes("1")) return 1;
    if (p.includes("3")) return 3;
    return 2;
  }, [masterData?.activePeriod]);

  const periodProgress = 65;
  const curriculumProgress = coverage.overallPercentage;

  if (!activeCurriculum || allTopics.length === 0) {
    return (
      <section className="bg-white border border-outline-variant rounded-[2rem] p-8 text-center shadow-sm">
        <p className="text-sm text-on-surface-variant font-bold italic uppercase tracking-widest opacity-40">
          Sin currículo asignado
        </p>
      </section>
    );
  }

  // Enriquecer el topic que se envía a GeniallyWizard y SlideViewer con la Higra y sus 3 hilos
  const enrichedTopicForPresentation = selectedTopic && normSelected
    ? {
        ...selectedTopic,
        title: normSelected.higra,
        tuhPutkamna: `${normSelected.higra}: ${normSelected.ejes.join(" · ")}`,
        ejes: normSelected.ejes,
        saber: normSelected.saber,
        hacer: normSelected.hacer,
        ser: normSelected.ser,
        panapain: normSelected.panapain,
        nanpaskas: normSelected.nanpaskas,
        satIshkit: normSelected.satIshkit,
        katkinAizpa: normSelected.katkinAizpa,
      }
    : selectedTopic;

  return (
    <div className="space-y-6">
      {/* ── CUMPLIMIENTO DE LA HIGRA EN TODOS LOS PERIODOS ── */}
      <section className="bg-white border border-outline-variant rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-900">
                Cumplimiento de la Higra
              </h3>
              <p className="text-[9px] font-bold text-indigo-500 uppercase">
                Periodo Activo {activePeriodNum} · {coverage.completedEjes}/{coverage.totalEjes} temas impartidos
              </p>
            </div>
          </div>
          <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            {curriculumProgress}%
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-[9px] font-black uppercase mb-1 px-1">
              <span className="text-slate-400">Cumplimiento Total de Temas de la Higra</span>
              <span className={`font-black ${curriculumProgress < periodProgress - 10 ? "text-rose-500" : "text-emerald-600"}`}>
                {coverage.completedEjes}/{coverage.totalEjes} ({curriculumProgress}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  curriculumProgress < periodProgress - 10 ? "bg-rose-500" : "bg-emerald-500"
                }`}
                style={{ width: `${curriculumProgress}%` }}
              />
            </div>
          </div>

          {/* Resumen rápido de los 3 periodos */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {coverage.periods.map(p => (
              <div
                key={p.unitId}
                className={`p-2 rounded-xl border text-center ${
                  p.percentage === 100
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                    : p.percentage > 0
                    ? "bg-amber-50/70 border-amber-200 text-amber-800"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                <p className="text-[8px] font-black uppercase tracking-widest">Periodo {p.order}</p>
                <p className="text-xs font-black mt-0.5">
                  {p.completedEjes}/{p.totalEjes}
                </p>
                <p className="text-[8px] font-bold uppercase opacity-75">{p.percentage}% temas</p>
              </div>
            ))}
          </div>
        </div>

        {curriculumProgress < periodProgress - 10 && (
          <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-3">
            <TrendingUp size={16} className="text-rose-500 rotate-180 shrink-0" />
            <p className="text-[9px] font-bold text-rose-700 uppercase leading-tight">
              Alerta: Faltan {coverage.totalEjes - coverage.completedEjes} temas de la Higra por dictar para cumplir el cronograma.
            </p>
          </div>
        )}
      </section>

      {/* ── SELECTOR DE HIGRA Y PREPARACIÓN DE CLASE SOBRE LA HIGRA ── */}
      <section className="bg-white border border-outline-variant rounded-[2rem] shadow-xl overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <div>
              <h2 className="text-[12px] font-black text-on-surface uppercase tracking-widest">
                Higra de la Sesión (Tuh Putkamna)
              </h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase">
                La clase se prepara sobre la Higra y sus Hilos (Saber, Hacer, Ser)
              </p>
            </div>
          </div>
          {isCurrentTopicCovered ? (
            <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase px-3 py-1 rounded-full border border-emerald-200">
              Higra Cubierta
            </span>
          ) : normSelected ? (
            <span className="bg-amber-100 text-amber-800 text-[9px] font-black uppercase px-3 py-1 rounded-full border border-amber-200">
              {normSelected.completedEjes.length}/{normSelected.ejes.length} Temas
            </span>
          ) : null}
        </div>

        <div className="p-6 space-y-6">
          <div className="relative">
            <select
              value={selectedTopic?.id}
              onChange={e => setSelectedTopicId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 pr-10 text-xs font-black uppercase tracking-tight focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
            >
              {allTopics.map(t => (
                <option key={t.id} value={t.id} className="font-bold">
                  P{t.unitOrder} ({t.id}) · HIGRA: {t.norm.higra} [{t.norm.completedEjes.length}/{t.norm.ejes.length} temas]
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={20} />
          </div>

          {selectedTopic && normSelected && (
            <div className="space-y-5">
              {/* Card Pedagógica IA basada en la Higra, el próximo tema y los 3 hilos */}
              <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                  <BrainCircuit size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-yellow-300 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-85">
                      Recomendación Pedagógica IA · {selectedTopic.unitTitle}
                    </span>
                  </div>
                  <h5 className="text-sm font-black uppercase italic mb-2 leading-tight pr-8">
                    {isCurrentTopicCovered
                      ? `Higra Completada: ${normSelected.higra}`
                      : `Higra del Conocimiento: ${normSelected.higra}`}
                  </h5>
                  <p className="text-[11px] font-bold opacity-95 leading-relaxed mb-4">
                    {isCurrentTopicCovered
                      ? `Ya cumpliste todos los temas de "${normSelected.higra}". ${
                          nextSuggestedTopic
                            ? `Te sugerimos avanzar a la siguiente Higra: "${nextSuggestedTopic.norm.higra}".`
                            : "¡Has completado todas las Higras del currículo!"
                        }`
                      : `Tema foco para hoy: "${nextPendingEje || normSelected.ejes[0]}". Articula el Hilo SABER (${normSelected.saber.slice(
                          0,
                          85
                        )}...) con actividades de "${normSelected.satIshkit.split(/[,\n]/)[0] || "trabajo colaborativo"}".`}
                  </p>

                  {isCurrentTopicCovered && nextSuggestedTopic ? (
                    <button
                      onClick={() => setSelectedTopicId(nextSuggestedTopic.id)}
                      className="w-full py-3.5 bg-white text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-300 hover:text-black transition-all"
                    >
                      Cargar Siguiente Higra ({nextSuggestedTopic.norm.higra}) <ArrowRight size={16} />
                    </button>
                  ) : (
                    <div className="flex gap-2 flex-wrap">
                      <div className="px-3 py-1.5 bg-white/15 rounded-full flex items-center gap-1.5">
                        <Lightbulb size={12} className="text-yellow-300 shrink-0" />
                        <span className="text-[8px] font-black uppercase tracking-tight">
                          Temas cumplidos: {normSelected.completedEjes.length}/{normSelected.ejes.length}
                        </span>
                      </div>
                      <div className="px-3 py-1.5 bg-yellow-300/20 rounded-full flex items-center gap-1.5 border border-yellow-300/30">
                        <Sparkles size={12} className="text-yellow-300 shrink-0" />
                        <span className="text-[8px] font-black uppercase tracking-tight text-yellow-100">
                          Hilos: Saber · Hacer · Ser activos
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Detalle de la Higra, Checklist de Temas de la Higra y los 3 Hilos (Saber, Hacer, Ser) */}
              <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-200 space-y-5">
                {/* ACCIONES DIDÁCTICAS DE PRESENTACIÓN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowWizard(true)}
                    className="py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-indigo-500/20 border border-indigo-400 group"
                  >
                    <Wand2 size={18} className="text-yellow-300 group-hover:rotate-12 transition-transform" />
                    Generar Clase (3 preguntas)
                  </button>

                  <button
                    onClick={() => setIsPresenting(true)}
                    className="py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-emerald-500/20 border border-emerald-400"
                  >
                    <Play size={18} className="fill-current text-white" />
                    Proyectar Clase
                  </button>
                </div>

                {/* 1. TEMAS DE LA HIGRA DEL CONOCIMIENTO (Checklist en vivo) */}
                <div className="p-4 bg-white rounded-2xl border border-primary/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                      Tuh Putkamna · Temas de la Higra ({normSelected.higra})
                    </span>
                    <span className="text-[9px] font-black text-slate-500 uppercase">
                      {normSelected.completedEjes.length}/{normSelected.ejes.length} dictados
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {normSelected.ejes.map((eje, idx) => {
                      const checked = isCurrentTopicCovered || normSelected.completedEjes.includes(eje);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() =>
                            toggleTopicEje(
                              activeCurriculum.id!,
                              selectedTopic.unitId,
                              selectedTopic.id,
                              eje,
                              normSelected.ejes
                            )
                          }
                          className={`w-full text-left flex items-center gap-2.5 p-2 rounded-xl border text-[11px] transition-all ${
                            checked
                              ? "bg-emerald-50 border-emerald-200 text-emerald-900 font-bold"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:border-primary/40 font-medium"
                          }`}
                        >
                          {checked ? (
                            <CheckSquare size={15} className="text-emerald-600 shrink-0" />
                          ) : (
                            <Square size={15} className="text-slate-400 shrink-0" />
                          )}
                          <span className="flex-1">{eje}</span>
                          <span
                            className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                              checked ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {checked ? "Dictado" : "Por dictar"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. PIANKAMMU MI: HILOS DEL SABER (SABER, HACER, SER) */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <Target size={14} className="text-primary" />
                    <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
                      Piankammu Mi · Hilos del Saber (Saber · Hacer · Ser)
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="p-3 bg-white rounded-xl border border-emerald-200">
                      <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest block mb-0.5">
                        Hilo SABER
                      </span>
                      <p className="text-[11px] font-semibold text-slate-700 leading-relaxed">{normSelected.saber}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-blue-200">
                      <span className="text-[8px] font-black text-blue-700 uppercase tracking-widest block mb-0.5">
                        Hilo HACER
                      </span>
                      <p className="text-[11px] font-semibold text-slate-700 leading-relaxed">{normSelected.hacer}</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-violet-200">
                      <span className="text-[8px] font-black text-violet-700 uppercase tracking-widest block mb-0.5">
                        Hilo SER
                      </span>
                      <p className="text-[11px] font-semibold text-slate-700 leading-relaxed">{normSelected.ser}</p>
                    </div>
                  </div>
                </div>

                {/* 3. SABIDURÍAS Y METODOLOGÍA TEJIENDO APRENDO */}
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div>
                    <span className="text-[8px] font-black text-primary uppercase block mb-1">
                      Pianaizpa · Sabidurías (Pañapain Propias y Ñanpaskas Interculturales)
                    </span>
                    <p className="text-[11px] font-bold text-slate-700 leading-relaxed">
                      <strong className="text-emerald-700">Propia:</strong> {normSelected.panapain || "Articulación con el territorio Awá."}
                      {" · "}
                      <strong className="text-indigo-700">Intercultural:</strong> {normSelected.nanpaskas || "Diálogo de saberes universales."}
                    </p>
                  </div>

                  <div>
                    <span className="text-[8px] font-black text-amber-700 uppercase block mb-1">
                      Sat Ishkit Kamtana · Tejiendo Aprendo (Metodología)
                    </span>
                    <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
                      {normSelected.satIshkit || "Trabajo colaborativo, talleres prácticos y socialización en minga."}
                    </p>
                  </div>
                </div>

                {!isCurrentTopicCovered ? (
                  <button
                    onClick={() => updateTopicStatus(activeCurriculum.id!, selectedTopic.unitId, selectedTopic.id, "covered")}
                    className="w-full mt-2 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={16} />
                    Marcar toda la Higra ({normSelected.ejes.length} temas) como Cubierta
                  </button>
                ) : (
                  <button
                    onClick={() => updateTopicStatus(activeCurriculum.id!, selectedTopic.unitId, selectedTopic.id, "active")}
                    className="w-full mt-2 py-3 bg-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
                  >
                    Reabrir Higra para repaso
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ASISTENTE WIZARD (3 PREGUNTAS) */}
      {showWizard && enrichedTopicForPresentation && activeCurriculum && selectedTopic && (
        <GeniallyWizard
          topic={enrichedTopicForPresentation}
          onClose={() => setShowWizard(false)}
          onGenerate={async slides => {
            setActiveCustomSlides(slides);
            setShowWizard(false);
            setIsPresenting(true);
            updateTopicSlides(activeCurriculum.id!, selectedTopic.unitId, selectedTopic.id, slides).catch(() => {});
          }}
        />
      )}

      {/* VISOR DE PRESENTACIONES */}
      {isPresenting && enrichedTopicForPresentation && (
        <SlideViewer
          key={`${enrichedTopicForPresentation.id}-${activeCustomSlides ? "custom" : "default"}`}
          topic={enrichedTopicForPresentation}
          customSlides={activeCustomSlides}
          onClose={() => {
            setIsPresenting(false);
            setActiveCustomSlides(undefined);
          }}
        />
      )}
    </div>
  );
}
