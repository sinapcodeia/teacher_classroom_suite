"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Maximize, Minimize, CheckCircle } from "lucide-react";
import { Topic, Slide } from "@/context/AppContext";

interface SlideViewerProps {
  topic: Topic;
  customSlides?: Slide[];
  onClose: () => void;
}

export default function SlideViewer({ topic, customSlides, onClose }: SlideViewerProps) {
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Usa las diapositivas personalizadas pasadas directamente, las guardadas en topic, o el fallback contextual
  const slides: Slide[] = (customSlides && customSlides.length > 0)
    ? customSlides
    : (topic.slides && topic.slides.length > 0 ? topic.slides : [
    {
      id: `${topic.id}-slide-title`,
      type: "title",
      title: topic.title,
      content: topic.tuhPutkamna
        ? `Higra del Conocimiento: ${topic.tuhPutkamna}`
        : `Hilo del Saber – Periodo Académico IETABA`,
    },
    {
      id: `${topic.id}-slide-split`,
      type: "split",
      title: "Sabidurías y Competencias",
      content: topic.panapain
        ? `Saberes Propios: ${topic.panapain}. ${topic.nanpaskas ? `Saberes Interculturales: ${topic.nanpaskas}` : ''}`
        : `Exploraremos "${topic.title}" desde los saberes propios del pueblo Awá y su articulación con los conocimientos interculturales.`,
      imageUrl: "/mock-isometric.png",
      imagePrompt: `Infografía técnica isométrica CGI fotorrealista sobre el concepto: "${topic.title}".`,
    },
    {
      id: `${topic.id}-slide-flip`,
      type: "flipcard",
      title: topic.katkinAizpa ? "Ayudas Pedagógicas" : "Concepto Clave del Tema",
      content: topic.katkinAizpa
        ? `¿Qué herramientas pedagógicas usaremos para "${topic.title}"?`
        : `¿Cuál es la idea central de "${topic.title}" en nuestra malla curricular?`,
      flipContent: topic.katkinAizpa
        ? topic.katkinAizpa
        : (topic.satIshkit || `"${topic.title}" se aborda desde la metodología Tejiendo Aprendo, integrando el territorio y la identidad cultural Awá.`),
    },
    {
      id: `${topic.id}-slide-quiz`,
      type: "quiz",
      title: "Tejiendo Aprendo: Verificación",
      content: topic.satIshkit
        ? `Metodología: ${topic.satIshkit}`
        : `¿Estás listo para trabajar el tema "${topic.title}"?`,
      quizOptions: [
        { text: "¡Sí, comencemos!", isCorrect: true },
        { text: "Necesito un repaso previo", isCorrect: false }
      ]
    }
  ];

  const currentSlide = slides[currentSlideIdx];

  const handleNext = () => {
    setFlipped(false);
    setSelectedQuizOption(null);
    if (currentSlideIdx < slides.length - 1) setCurrentSlideIdx(prev => prev + 1);
  };

  const handlePrev = () => {
    setFlipped(false);
    setSelectedQuizOption(null);
    if (currentSlideIdx > 0) setCurrentSlideIdx(prev => prev - 1);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-xl flex flex-col font-sans" ref={containerRef}>
      
      {/* HEADER CONTROLS */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-white text-xs font-bold tracking-widest uppercase opacity-80">Modo Presentación</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={toggleFullscreen} className="p-3 bg-white/5 hover:bg-white/20 text-white rounded-full transition-all backdrop-blur-md border border-white/10">
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          <button onClick={onClose} className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full transition-all backdrop-blur-md border border-red-500/30">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* SLIDE CONTENT VIEWER */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 overflow-hidden relative">
        
        {/* Background Decorative Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black/0 to-black/0 pointer-events-none"></div>

        {/* Dynamic Slide Container with CSS transition */}
        <div key={currentSlide.id} className="w-full max-w-6xl w-full h-[80vh] bg-surface-container-low/5 rounded-[2rem] border border-white/10 shadow-2xl relative flex flex-col overflow-hidden animate-in fade-in zoom-in duration-500">
          
          {currentSlide.type === "title" && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
              <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-6 uppercase tracking-tighter leading-tight">
                {currentSlide.title}
              </h1>
              <p className="text-xl md:text-3xl text-white/60 font-medium max-w-3xl leading-relaxed">
                {currentSlide.content}
              </p>
            </div>
          )}

          {currentSlide.type === "split" && (
            <div className="flex-1 flex flex-col lg:flex-row h-full">
              <div className="w-full lg:w-1/3 p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-white/10 bg-black/40 backdrop-blur-sm">
                <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-tight">{currentSlide.title}</h2>
                <p className="text-lg text-white/70 leading-relaxed mb-8">{currentSlide.content}</p>
                {currentSlide.imagePrompt && (
                  <div className="mt-auto p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-2">Prompt de Generación IA</p>
                    <p className="text-xs text-white/50 italic">{currentSlide.imagePrompt}</p>
                  </div>
                )}
              </div>
              <div className="w-full lg:w-2/3 flex items-center justify-center bg-[#0a0f1a] relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 p-8 w-full h-full flex flex-col items-center justify-center">
                  <div className="w-full h-full max-h-[500px] rounded-2xl bg-gradient-to-br from-white/5 to-transparent flex items-center justify-center backdrop-blur-sm relative shadow-[0_0_50px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_80px_rgba(59,130,246,0.2)] transition-all duration-700 overflow-hidden border border-white/10">
                     <img 
                       src={currentSlide.imageUrl} 
                       alt="CGI Isometric Concept" 
                       className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700 group-hover:scale-105"
                     />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentSlide.type === "flipcard" && (
            <div className="flex-1 flex items-center justify-center p-12 perspective-1000">
               <div 
                 onClick={() => setFlipped(!flipped)}
                 className={`relative w-full max-w-2xl h-[400px] cursor-pointer transition-transform duration-700 preserve-3d ${flipped ? 'rotate-y-180' : ''}`}
               >
                 {/* Front */}
                 <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-600 to-blue-900 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl border border-white/20">
                    <h2 className="text-4xl font-black text-white mb-6 uppercase tracking-tight">{currentSlide.title}</h2>
                    <p className="text-xl text-white/80">{currentSlide.content}</p>
                    <div className="mt-12 px-6 py-2 bg-white/20 rounded-full animate-pulse text-white text-xs font-bold uppercase tracking-widest border border-white/30">Clic para revelar</div>
                 </div>
                 {/* Back */}
                 <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-emerald-600 to-teal-900 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center shadow-2xl border border-white/20">
                    <p className="text-3xl font-black text-white leading-tight">{currentSlide.flipContent}</p>
                 </div>
               </div>
            </div>
          )}

          {currentSlide.type === "quiz" && (
            <div className="flex-1 flex flex-col items-center justify-center p-12">
               <h2 className="text-4xl font-black text-white mb-4 uppercase tracking-tight">{currentSlide.title}</h2>
               <p className="text-xl text-white/70 mb-12">{currentSlide.content}</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                 {currentSlide.quizOptions?.map((opt, idx) => {
                   const isSelected = selectedQuizOption === idx;
                   const showResult = selectedQuizOption !== null;
                   
                   let btnStyle = "bg-white/10 border-white/20 hover:bg-white/20 text-white";
                   if (showResult) {
                     if (opt.isCorrect) btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                     else if (isSelected) btnStyle = "bg-red-500/20 border-red-500 text-red-400";
                     else btnStyle = "bg-white/5 border-white/10 text-white/30";
                   }

                   return (
                     <button 
                       key={idx}
                       disabled={showResult}
                       onClick={() => setSelectedQuizOption(idx)}
                       className={`p-8 rounded-2xl border-2 text-xl font-bold transition-all duration-300 flex items-center justify-between ${btnStyle}`}
                     >
                       <span>{opt.text}</span>
                       {showResult && opt.isCorrect && <CheckCircle size={24} className="text-emerald-400 animate-bounce" />}
                     </button>
                   );
                 })}
               </div>
            </div>
          )}

        </div>
      </div>

      {/* FOOTER NAVIGATION */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center z-50">
        <div className="flex items-center gap-6 bg-black/60 backdrop-blur-md px-8 py-4 rounded-[2rem] border border-white/10 shadow-2xl">
          <button 
            onClick={handlePrev}
            disabled={currentSlideIdx === 0}
            className={`p-3 rounded-full transition-all ${currentSlideIdx === 0 ? 'text-white/20' : 'text-white hover:bg-white/10'}`}
          >
            <ChevronLeft size={32} />
          </button>
          
          <div className="flex items-center gap-2">
            {slides.map((s, idx) => (
              <div 
                key={s.id} 
                className={`w-2 h-2 rounded-full transition-all duration-500 ${idx === currentSlideIdx ? 'w-8 bg-blue-400' : 'bg-white/30'}`}
              />
            ))}
          </div>

          <button 
            onClick={handleNext}
            disabled={currentSlideIdx === slides.length - 1}
            className={`p-3 rounded-full transition-all ${currentSlideIdx === slides.length - 1 ? 'text-white/20' : 'text-white hover:bg-white/10'}`}
          >
            <ChevronRight size={32} />
          </button>
        </div>
      </div>

    </div>
  );
}
