"use client";

import React, { useState } from "react";
import { Topic, Slide } from "@/context/AppContext";
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Wand2, BookOpen, Target, HelpCircle, Rocket, X } from "lucide-react";

interface GeniallyWizardProps {
  topic: Topic;
  onClose: () => void;
  onGenerate: (slides: Slide[]) => Promise<void>;
}

export default function GeniallyWizard({ topic, onClose, onGenerate }: GeniallyWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Respuestas del docente a las 3 preguntas
  const [q1Goal, setQ1Goal] = useState<string>("Explicación conceptual con ejemplos prácticos");
  const [q2Activity, setQ2Activity] = useState<string>("Desafío con preguntas y respuestas ocultas (Flip-Cards)");
  const [q3Emphasis, setQ3Emphasis] = useState<string>("Articulación con Saberes Propios del Territorio Awá");

  const optionsQ1 = [
    { label: "Explicación Conceptual", desc: "Enfocado en definir ideas clave de forma clara y visual." },
    { label: "Caso Práctico o Aplicado", desc: "Resolver un problema del mundo real o del territorio." },
    { label: "Debate y Reflexión", desc: "Preguntas abiertas para motivar la participación de los alumnos." },
  ];

  const optionsQ2 = [
    { label: "Tarjetas Giratorias (Flip-Cards)", desc: "Muestra un reto en el frente y la respuesta al dar clic." },
    { label: "Quiz Gamificado", desc: "Preguntas con opciones múltiples y retroalimentación inmediata." },
    { label: "Infografía Detallada", desc: "Énfasis visual con gráficos e infografía isométrica." },
  ];

  const optionsQ3 = [
    { label: "Saberes Propios y Territorio Awá", desc: "Conectar el tema con la cultura e identidad local." },
    { label: "Ciencia y Tecnología Intercultural", desc: "Combinar tecnología moderna con metodología institucional." },
    { label: "Evaluación Rápida de Comprensión", desc: "Verificar si la clase entendió los conceptos esenciales." },
  ];

  const handleGenerate = async () => {
    setLoading(true);

    // Generación inteligente y automática de 5 diapositivas pedagógicas humanizadas
    const generatedSlides: Slide[] = [
      {
        id: `${topic.id}-gen-1`,
        type: "title",
        title: topic.title,
        content: `¡Bienvenidos a una nueva aventura de aprendizaje! Hoy descubriremos "${topic.title}" con curiosidad, trabajo en equipo y empatía.`,
      },
      {
        id: `${topic.id}-gen-2`,
        type: "split",
        title: "Conectando con Nuestro Entorno",
        content: topic.tuhPutkamna 
          ? `Hilo del Saber: ${topic.tuhPutkamna}. En nuestro territorio y vida cotidiana, este concepto nos ayuda a comprender mejor el mundo que nos rodea.`
          : `Enfoque pedagógico: ${q3Emphasis}. Exploraremos "${topic.title}" relacionándolo con situaciones reales, la naturaleza y nuestro día a día.`,
        imageUrl: "/mock-isometric.png",
        imagePrompt: `Infografía técnica isométrica CGI fotorrealista sobre: "${topic.title}". Enfoque humano e intercultural: ${q3Emphasis}.`,
      },
      {
        id: `${topic.id}-gen-3`,
        type: "split",
        title: "Saberes Propios y Territorio",
        content: topic.panapain 
          ? `🌿 Sabiduría Propia: ${topic.panapain}. ${topic.nanpaskas ? `💡 Conocimiento Intercultural: ${topic.nanpaskas}` : ''}`
          : `El diálogo entre los saberes de nuestra comunidad y el conocimiento tecnológico fortalece nuestra identidad, autonomía y creatividad.`,
        imageUrl: "/mock-isometric.png",
      },
      {
        id: `${topic.id}-gen-4`,
        type: "flipcard",
        title: "Reto de Curiosidad y Reflexión",
        content: `¿Cómo podemos aplicar lo aprendido sobre "${topic.title}" para ayudar a nuestros compañeros y cuidar nuestro entorno?`,
        flipContent: topic.satIshkit
          ? `✨ Metodología Tejiendo Aprendo: ${topic.satIshkit}`
          : `¡Genial! Al aprender "${topic.title}", desarrollamos capacidad crítica, respetamos los saberes comunitarios y resolvemos problemas con empatía.`,
      },
      {
        id: `${topic.id}-gen-5`,
        type: "quiz",
        title: "¡Desafío de Campeones!",
        content: `¿Cuál es la actitud más valiosa al explorar "${topic.title}" el día de hoy?`,
        quizOptions: [
          { text: `Aprender con curiosidad, empatía y aplicarlo en el territorio (${q3Emphasis})`, isCorrect: true },
          { text: "Memorizar conceptos sin relacionarlos con la vida real", isCorrect: false },
          { text: "Completar la tarea con afán sin dialogar en grupo", isCorrect: false },
        ],
      },
    ];

    try {
      await onGenerate(generatedSlides);
    } catch (err) {
      console.error("Error generando clase:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* HEADER */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-300">
              <Wand2 size={22} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Generador Didáctico de Clase</span>
              <h2 className="text-xl font-black uppercase text-white tracking-tight">{topic.title}</h2>
            </div>
          </div>
          
          <p className="text-xs text-white/70 mt-2 font-medium">
            Responde 3 preguntas sencillas y la Inteligencia Artificial armará la clase interactiva automáticamente.
          </p>

          {/* Stepper indicator */}
          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-2 rounded-full transition-all duration-500 ${step === s ? "w-12 bg-yellow-400" : step > s ? "w-4 bg-emerald-400" : "w-4 bg-white/20"}`} 
              />
            ))}
            <span className="ml-auto text-[10px] font-black uppercase text-white/50">Paso {step} de 3</span>
          </div>
        </div>

        {/* BODY (LAS 3 PREGUNTAS) */}
        <div className="p-6 md:p-8 space-y-6">
          
          {/* PASO 1: ¿Qué objetivo quieres lograr? */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center">1</span>
                <h3 className="text-sm md:text-base font-black text-on-surface uppercase tracking-tight">
                  ¿Cuál es el objetivo principal de la sesión?
                </h3>
              </div>

              <div className="space-y-3 pt-2">
                {optionsQ1.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setQ1Goal(opt.label)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start justify-between ${
                      q1Goal === opt.label 
                        ? "border-primary bg-primary/5 text-primary shadow-md" 
                        : "border-outline-variant hover:border-primary/40 bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <div>
                      <p className="font-black text-xs uppercase">{opt.label}</p>
                      <p className="text-[11px] text-on-surface-variant font-medium mt-1">{opt.desc}</p>
                    </div>
                    {q1Goal === opt.label && <CheckCircle2 size={20} className="text-primary flex-shrink-0 mt-1" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASO 2: ¿Qué tipo de actividad prefieres? */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center">2</span>
                <h3 className="text-sm md:text-base font-black text-on-surface uppercase tracking-tight">
                  ¿Qué estilo de interacción quieres para tus alumnos?
                </h3>
              </div>

              <div className="space-y-3 pt-2">
                {optionsQ2.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setQ2Activity(opt.label)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start justify-between ${
                      q2Activity === opt.label 
                        ? "border-secondary bg-secondary/5 text-secondary shadow-md" 
                        : "border-outline-variant hover:border-secondary/40 bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <div>
                      <p className="font-black text-xs uppercase">{opt.label}</p>
                      <p className="text-[11px] text-on-surface-variant font-medium mt-1">{opt.desc}</p>
                    </div>
                    {q2Activity === opt.label && <CheckCircle2 size={20} className="text-secondary flex-shrink-0 mt-1" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASO 3: ¿En qué aspecto enfatizar? */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center">3</span>
                <h3 className="text-sm md:text-base font-black text-on-surface uppercase tracking-tight">
                  ¿En qué quieres poner el mayor énfasis?
                </h3>
              </div>

              <div className="space-y-3 pt-2">
                {optionsQ3.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => setQ3Emphasis(opt.label)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start justify-between ${
                      q3Emphasis === opt.label 
                        ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-md" 
                        : "border-outline-variant hover:border-emerald-500/40 bg-surface-container-low text-on-surface"
                    }`}
                  >
                    <div>
                      <p className="font-black text-xs uppercase">{opt.label}</p>
                      <p className="text-[11px] text-on-surface-variant font-medium mt-1">{opt.desc}</p>
                    </div>
                    {q3Emphasis === opt.label && <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-1" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* NAVEGACIÓN ENTRE PASOS Y BOTÓN FINAL */}
          <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
            {step > 1 ? (
              <button
                onClick={() => setStep((step - 1) as 1 | 2)}
                className="px-5 py-3 rounded-2xl border border-outline-variant text-xs font-black uppercase text-on-surface-variant hover:bg-surface-container transition-all flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Anterior
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                onClick={() => setStep((step + 1) as 2 | 3)}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
              >
                Siguiente <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl shadow-emerald-200 disabled:opacity-50"
              >
                {loading ? (
                  <>Creando clase...</>
                ) : (
                  <>
                    <Rocket size={18} /> ¡Generar y Proyectar Clase!
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
