"use client";

import React, { useState, useCallback } from "react";
import { Topic, Slide } from "@/context/AppContext";
import {
  X, Plus, Trash2, Save, ChevronUp, ChevronDown,
  Type, Layout, RotateCcw, HelpCircle, Eye, Loader2,
  GripVertical, Image as ImageIcon, BookOpen
} from "lucide-react";

interface SlideEditorProps {
  topic: Topic & { unitId: string };
  curriculumId: string;
  onClose: () => void;
  onSave: (slides: Slide[]) => Promise<void>;
  onPreview: (slides: Slide[]) => void;
}

const SLIDE_TYPES: { value: Slide["type"]; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "title",    label: "Portada",      icon: <Type size={18} />,      desc: "Diapositiva de título del tema" },
  { value: "split",    label: "Visual + Texto",icon: <ImageIcon size={18} />,     desc: "Imagen CGI con texto al lado" },
  { value: "flipcard", label: "Tarjeta Giro",  icon: <RotateCcw size={18} />, desc: "Pregunta con respuesta oculta" },
  { value: "quiz",     label: "Quiz Rápido",   icon: <HelpCircle size={18} />,desc: "Pregunta de opción múltiple" },
];

function newSlide(type: Slide["type"], topicTitle: string, idx: number): Slide {
  const id = `custom-${Date.now()}-${idx}`;
  switch (type) {
    case "title":    return { id, type, title: topicTitle, content: "Hilo del Saber – IETABA" };
    case "split":    return { id, type, title: "Sabidurías y Competencias", content: "Escribe el contenido de esta diapositiva...", imageUrl: "/mock-isometric.png" };
    case "flipcard": return { id, type, title: "Pregunta al Aula", content: "Escribe tu pregunta aquí...", flipContent: "Escribe la respuesta aquí..." };
    case "quiz":     return { id, type, title: "Quiz Rápido", content: "¿Cuál de estas opciones es correcta?", quizOptions: [{ text: "Opción A (Correcta)", isCorrect: true }, { text: "Opción B", isCorrect: false }] };
  }
}

// ── EDITOR DE UN SLIDE INDIVIDUAL ────────────────────────────────────────
function SlideForm({ slide, onChange }: { slide: Slide; onChange: (updated: Slide) => void }) {
  const update = (patch: Partial<Slide>) => onChange({ ...slide, ...patch });

  const inputClass = "w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors";
  const labelClass = "block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2";

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Título de la Diapositiva</label>
        <input className={inputClass} value={slide.title} onChange={e => update({ title: e.target.value })} placeholder="Título..." />
      </div>

      {slide.type !== "flipcard" && (
        <div>
          <label className={labelClass}>{slide.type === "quiz" ? "Enunciado / Pregunta" : "Contenido Principal"}</label>
          <textarea className={`${inputClass} h-28 resize-none`} value={slide.content} onChange={e => update({ content: e.target.value })} placeholder="Escribe el contenido..." />
        </div>
      )}

      {slide.type === "split" && (
        <div>
          <label className={labelClass}>URL de la Imagen (opcional)</label>
          <input className={inputClass} value={slide.imageUrl || ""} onChange={e => update({ imageUrl: e.target.value })} placeholder="/mock-isometric.png" />
          <p className="text-[10px] text-white/30 mt-1">Deja en blanco para usar la imagen CGI isométrica predeterminada.</p>
        </div>
      )}

      {slide.type === "flipcard" && (
        <>
          <div>
            <label className={labelClass}>Pregunta (Frente de la Tarjeta)</label>
            <textarea className={`${inputClass} h-24 resize-none`} value={slide.content} onChange={e => update({ content: e.target.value })} placeholder="¿Pregunta para el aula?" />
          </div>
          <div>
            <label className={labelClass}>Respuesta (Reverso – se revela al clic)</label>
            <textarea className={`${inputClass} h-24 resize-none`} value={slide.flipContent || ""} onChange={e => update({ flipContent: e.target.value })} placeholder="Respuesta o concepto clave..." />
          </div>
        </>
      )}

      {slide.type === "quiz" && (
        <div>
          <label className={labelClass}>Opciones de Respuesta</label>
          <div className="space-y-2">
            {(slide.quizOptions || []).map((opt, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const updated = (slide.quizOptions || []).map((o, i) => ({ ...o, isCorrect: i === idx }));
                    update({ quizOptions: updated });
                  }}
                  className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-all ${opt.isCorrect ? "border-emerald-400 bg-emerald-400" : "border-white/30 bg-transparent"}`}
                  title="Marcar como correcta"
                />
                <input
                  className={`${inputClass} flex-1`}
                  value={opt.text}
                  onChange={e => {
                    const updated = (slide.quizOptions || []).map((o, i) => i === idx ? { ...o, text: e.target.value } : o);
                    update({ quizOptions: updated });
                  }}
                  placeholder={`Opción ${idx + 1}...`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = (slide.quizOptions || []).filter((_, i) => i !== idx);
                    update({ quizOptions: updated });
                  }}
                  className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {(slide.quizOptions || []).length < 4 && (
              <button
                type="button"
                onClick={() => update({ quizOptions: [...(slide.quizOptions || []), { text: "", isCorrect: false }] })}
                className="w-full py-2 border border-dashed border-white/20 rounded-xl text-white/40 text-xs hover:border-blue-500 hover:text-blue-400 transition-all"
              >
                + Añadir opción
              </button>
            )}
            <p className="text-[10px] text-white/30">Clic en el círculo verde para marcar la opción correcta.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── EDITOR PRINCIPAL ─────────────────────────────────────────────────────
export default function SlideEditor({ topic, onClose, onSave, onPreview }: SlideEditorProps) {
  const [slides, setSlides] = useState<Slide[]>(
    topic.slides && topic.slides.length > 0
      ? [...topic.slides]
      : [newSlide("title", topic.title, 0)]
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);

  const activeSlide = slides[activeIdx] || slides[0];

  const updateSlide = useCallback((updated: Slide) => {
    setSlides(prev => prev.map((s, i) => i === activeIdx ? updated : s));
  }, [activeIdx]);

  const addSlide = (type: Slide["type"]) => {
    const s = newSlide(type, topic.title, slides.length);
    setSlides(prev => [...prev, s]);
    setActiveIdx(slides.length);
    setShowTypeMenu(false);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length === 1) return;
    const updated = slides.filter((_, i) => i !== idx);
    setSlides(updated);
    setActiveIdx(Math.min(activeIdx, updated.length - 1));
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= slides.length) return;
    const updated = [...slides];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setSlides(updated);
    setActiveIdx(newIdx);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(slides);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = SLIDE_TYPES.find(t => t.value === activeSlide?.type)?.label || "Tipo";

  return (
    <div className="fixed inset-0 z-[9998] bg-[#04080f] flex flex-col font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── BARRA SUPERIOR ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#080d18] flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white/60">
            <BookOpen size={16} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">Editor de Clase</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <h1 className="text-sm font-black text-white truncate max-w-xs">{topic.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onPreview(slides)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
          >
            <Eye size={14} /> Vista Previa
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saved ? "¡Guardado!" : "Guardar Clase"}
          </button>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── PANEL IZQUIERDO: Lista de Slides ── */}
        <div className="w-64 bg-[#060b15] border-r border-white/10 flex flex-col flex-shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-white/10">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{slides.length} diapositiva(s)</p>
          </div>

          <div className="flex-1 p-3 space-y-2">
            {slides.map((s, idx) => {
              const tInfo = SLIDE_TYPES.find(t => t.value === s.type);
              return (
                <div
                  key={s.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`group relative p-3 rounded-xl cursor-pointer transition-all border ${activeIdx === idx ? "bg-blue-600/20 border-blue-500/40 text-white" : "bg-white/3 border-white/5 hover:bg-white/8 text-white/60"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black opacity-40 w-4 text-center">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black truncate">{s.title || "Sin título"}</p>
                      <p className="text-[9px] opacity-50 uppercase tracking-widest">{tInfo?.label}</p>
                    </div>
                  </div>

                  <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                    <button onClick={e => { e.stopPropagation(); moveSlide(idx, -1); }} className="p-1 hover:text-white" disabled={idx === 0}><ChevronUp size={12} /></button>
                    <button onClick={e => { e.stopPropagation(); moveSlide(idx, 1); }} className="p-1 hover:text-white" disabled={idx === slides.length - 1}><ChevronDown size={12} /></button>
                    <button onClick={e => { e.stopPropagation(); deleteSlide(idx); }} className="p-1 hover:text-red-400" disabled={slides.length === 1}><Trash2 size={12} /></button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón Añadir */}
          <div className="p-3 border-t border-white/10 relative">
            <button
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              <Plus size={14} /> Nueva Diapositiva
            </button>
            {showTypeMenu && (
              <div className="absolute bottom-16 left-3 right-3 bg-[#0f172a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10">
                {SLIDE_TYPES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => addSlide(t.value)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-all group"
                  >
                    <span className="text-blue-400 group-hover:text-emerald-400 transition-colors">{t.icon}</span>
                    <div>
                      <p className="text-xs font-black text-white">{t.label}</p>
                      <p className="text-[9px] text-white/30">{t.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── PANEL PRINCIPAL: Editor del Slide Activo ── */}
        {activeSlide && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white font-black text-lg">Editando diapositiva {activeIdx + 1}</h2>
                  <p className="text-white/40 text-xs uppercase tracking-widest font-bold">Tipo: {typeLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  {SLIDE_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => updateSlide({ ...activeSlide, type: t.value })}
                      title={t.label}
                      className={`p-2.5 rounded-xl transition-all border text-xs font-bold ${activeSlide.type === t.value ? "bg-blue-600 border-blue-500 text-white" : "bg-white/5 border-white/10 text-white/40 hover:border-white/30"}`}
                    >
                      {t.icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#080d18] border border-white/10 rounded-2xl p-6">
                <SlideForm slide={activeSlide} onChange={updateSlide} />
              </div>

              <p className="text-center text-white/20 text-[10px] mt-6 uppercase tracking-widest">Los cambios se guardan al presionar &quot;Guardar Clase&quot;</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
