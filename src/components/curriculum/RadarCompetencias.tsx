"use client";

import { useMemo } from "react";
import { Sparkles, HelpCircle, ShieldAlert, Award } from "lucide-react";

interface RadarCompetenciasProps {
  plan: {
    lesson: string;
    workshop: string;
    activity: string;
    exam: string;
  } | null;
}

export default function RadarCompetencias({ plan }: RadarCompetenciasProps) {
  // 1. Keyword search algorithm to calculate alignments
  const scores = useMemo(() => {
    if (!plan) {
      return { ancestral: 0, agro: 0, universal: 0 };
    }

    const text = `${plan.lesson} ${plan.workshop} ${plan.activity} ${plan.exam}`.toLowerCase();

    // Keywords lists
    const kAncestral = ["minga", "awa", "ancestral", "mayores", "cabildo", "resguardo", "comunitario", "katsa su", "saber", "tejido", "shingra", "canasto", "tradición", "oral", "tuh putkamna", "panapain", "nanpaskas"];
    const kAgro = ["agroambiental", "ambiente", "tierra", "cultivo", "parcela", "abono", "agua", "bosque", "quebrada", "ciclo", "producción", "siembra", "ecológico", "soberanía", "territorio"];
    const kUniversal = ["matemática", "física", "tecnología", "concepto", "cálculo", "fórmula", "ejemplo", "teoría", "analítico", "método", "científico", "lógico", "robótica", "parámetro", "resolver"];

    const countMatches = (keys: string[]) => {
      let count = 0;
      keys.forEach(k => {
        const matches = text.match(new RegExp(k, "g"));
        if (matches) count += matches.length;
      });
      return count;
    };

    const cAncestral = countMatches(kAncestral);
    const cAgro = countMatches(kAgro);
    const cUniversal = countMatches(kUniversal);

    // Normalize to premium percentages (between 60% and 98% for generated high-quality IETABA curriculum)
    const baseNormalize = (val: number) => {
      if (val === 0) return 0;
      return Math.min(98, Math.max(62, 60 + Math.min(38, val * 2.5)));
    };

    return {
      ancestral: baseNormalize(cAncestral),
      agro: baseNormalize(cAgro),
      universal: baseNormalize(cUniversal),
    };
  }, [plan]);

  // 2. Trigonometry coordinates for SVG Radar (Angles: 0°, 120°, 240°)
  // cx = 100, cy = 105, r = 70
  const points = useMemo(() => {
    const cx = 100;
    const cy = 105;
    const r = 70;

    const getCoord = (scorePercentage: number, angleDegrees: number) => {
      const radiusFraction = (scorePercentage / 100) * r;
      // Convert angle to radians (subtract 90 to place 0° at top)
      const rad = ((angleDegrees - 90) * Math.PI) / 180;
      const x = cx + radiusFraction * Math.cos(rad);
      const y = cy + radiusFraction * Math.sin(rad);
      return { x, y };
    };

    const pAncestral = getCoord(scores.ancestral || 50, 0);      // Top
    const pAgro = getCoord(scores.agro || 50, 120);          // Bottom-Right
    const pUniversal = getCoord(scores.universal || 50, 240);    // Bottom-Left

    return {
      pathStr: `${pAncestral.x},${pAncestral.y} ${pAgro.x},${pAgro.y} ${pUniversal.x},${pUniversal.y}`,
      pAncestral,
      pAgro,
      pUniversal,
    };
  }, [scores]);

  // 3. Dynamic educational feedback
  const feedback = useMemo(() => {
    if (!plan) return {
      title: "Esperando Planeación...",
      msg: "Genera o carga un plan pedagógico para diagnosticar el balance de competencias curriculares.",
      accent: "text-slate-400"
    };

    const minScore = Math.min(scores.ancestral, scores.agro, scores.universal);
    
    if (minScore === scores.ancestral) {
      return {
        title: "Fortalecer Dimensión Cultural",
        msg: "El plan posee alto rigor técnico, pero sugerimos entrelazar de forma más profunda las prácticas de los mayores Awá y la preservación oral del Awapit.",
        accent: "text-emerald-600 bg-emerald-50 border-emerald-100"
      };
    } else if (minScore === scores.agro) {
      return {
        title: "Aumentar Enfoque Agroambiental",
        msg: "Buen balance universal. Se recomienda incorporar actividades directas en la parcela escolar o reflexiones sobre el cuidado de Katsa Su (La Madre Tierra).",
        accent: "text-amber-600 bg-amber-50 border-amber-100"
      };
    } else {
      return {
        title: "Robustecer Fundamento Científico",
        msg: "Excelente tejido cultural. Para optimizar, introduce más ejercicios resueltos de ciencias exactas o algoritmos lógicos en los retos del taller.",
        accent: "text-blue-600 bg-blue-50 border-blue-100"
      };
    }
  }, [plan, scores]);

  return (
    <div className="bg-white border border-outline-variant/30 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
            <Award size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-on-surface uppercase tracking-tight">Rueda de Competencias</h4>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Alineador de Saberes IETABA</p>
          </div>
        </div>
        {plan && (
          <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
            DIAGNOSTICADO
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* SVG Radar Graphic */}
        <div className="flex justify-center relative">
          <svg width="200" height="200" className="w-48 h-48 drop-shadow-[0_4px_10px_rgba(0,0,0,0.05)]">
            {/* Concentric Guide Circles */}
            <circle cx="100" cy="105" r="70" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx="100" cy="105" r="50" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx="100" cy="105" r="30" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3,3" />
            
            {/* Axial lines */}
            <line x1="100" y1="105" x2="100" y2="35" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="100" y1="105" x2="160.6" y2="140" stroke="#cbd5e1" strokeWidth="1" />
            <line x1="100" y1="105" x2="39.4" y2="140" stroke="#cbd5e1" strokeWidth="1" />

            {/* Labels on SVG */}
            <text x="100" y="24" textAnchor="middle" className="text-[7.5px] font-black fill-emerald-600 uppercase tracking-wider">Ancestral</text>
            <text x="172" y="148" textAnchor="middle" className="text-[7.5px] font-black fill-amber-600 uppercase tracking-wider">Agroambiental</text>
            <text x="28" y="148" textAnchor="middle" className="text-[7.5px] font-black fill-blue-600 uppercase tracking-wider">Universal</text>

            {plan && (
              <>
                {/* Score Area Path with stunning HSL gradient styling */}
                <polygon
                  points={points.pathStr}
                  fill="rgba(37, 99, 235, 0.15)"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  className="transition-all duration-1000 ease-out"
                />
                {/* Visual points */}
                <circle cx={points.pAncestral.x} cy={points.pAncestral.y} r="4.5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
                <circle cx={points.pAgro.x} cy={points.pAgro.y} r="4.5" fill="#f59e0b" stroke="#fff" strokeWidth="1.5" />
                <circle cx={points.pUniversal.x} cy={points.pUniversal.y} r="4.5" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />
              </>
            )}
          </svg>
        </div>

        {/* Breakdown Progress Bars */}
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-wider">
              <span>Saberes Ancestrales Awá</span>
              <span className="text-emerald-600">{plan ? `${scores.ancestral.toFixed(0)}%` : "0%"}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${plan ? scores.ancestral : 0}%` }}
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-wider">
              <span>Desarrollo Agroambiental</span>
              <span className="text-amber-600">{plan ? `${scores.agro.toFixed(0)}%` : "0%"}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${plan ? scores.agro : 0}%` }}
                className="h-full bg-amber-500 rounded-full transition-all duration-1000 ease-out"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-wider">
              <span>Saberes Científicos Universales</span>
              <span className="text-blue-600">{plan ? `${scores.universal.toFixed(0)}%` : "0%"}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${plan ? scores.universal : 0}%` }}
                className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Feedback Block */}
      <div className={`mt-6 p-5 rounded-2xl border text-xs font-semibold leading-relaxed transition-all duration-500 flex items-start gap-3 ${plan ? feedback.accent : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
        <Sparkles size={16} className="mt-0.5 shrink-0 animate-pulse text-current" />
        <div>
          <strong className="block uppercase tracking-wider mb-1 text-[10px] font-black">{feedback.title}</strong>
          {feedback.msg}
        </div>
      </div>
    </div>
  );
}
