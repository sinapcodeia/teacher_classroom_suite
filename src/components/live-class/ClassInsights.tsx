"use client";

import { useMemo, useRef } from "react";
import { Sparkles, AlertTriangle, Lightbulb, Users, ArrowUpRight, TrendingDown } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface ClassInsightsProps {
  course: string;
  subject: string;
}

export default function ClassInsights({ course, subject }: ClassInsightsProps) {
  const { myStudents } = useApp();

  const insights = useMemo(() => {
    const classStudents = myStudents.filter(s => s.curso === course && s.isActive !== false);
    if (classStudents.length === 0) return [];

    const results: { title: string, message: string, type: 'warning' | 'tip' | 'success', icon: any }[] = [];

    // 1. Análisis de Ausentismo
    const atRiskAbsence = classStudents.filter(s => {
      if (!s.attendanceRecord) return false;
      return Object.values(s.attendanceRecord).filter(v => v === 'absent').length >= 3;
    });

    if (atRiskAbsence.length > 0) {
      results.push({
        title: "Alerta de Deserción",
        message: `Hay ${atRiskAbsence.length} estudiantes con inasistencia crítica. Se sugiere citar a acudientes.`,
        type: 'warning',
        icon: AlertTriangle
      });
    }

    // 2. Análisis de Rendimiento y promedio grupal
    const classAvg = classStudents.reduce((acc, s) => acc + (s.avgGrade || 0), 0) / classStudents.length;

    const failingStudents = classStudents.filter(s => s.avgGrade > 0 && s.avgGrade < 3.0);
    if (failingStudents.length > 3) {
      results.push({
        title: "Refuerzo Necesario",
        message: `El ${Math.round((failingStudents.length / classStudents.length) * 100)}% del grupo tiene bajo rendimiento. Considera una sesión de nivelación.`,
        type: 'warning',
        icon: TrendingDown
      });
    } else {
      results.push({
        title: "Sugerencia IA",
        message: `El rendimiento promedio grupal es de ${classAvg.toFixed(1)} / 5.0. Estado: Estable y listo para continuar.`,
        type: 'success',
        icon: ArrowUpRight
      });
    }

    // 3. Sugerencia de Taller / Tarea IA Contextualizada y Territorial
    const sub = subject.toUpperCase();
    let aiSuggestion = {
      title: "Sugerencia de Taller IA",
      message: "La IA sugiere un Taller de Aplicación conceptual en parejas enfocado en el territorio con exposición al final.",
    };

    if (classAvg > 0) {
      if (classAvg < 3.5) {
        // Nivelación / Refuerzo
        if (sub.includes("MATEMÁTICAS")) {
          aiSuggestion = {
            title: "IA Sugiere: Nivelación con la Chagra",
            message: "Realizar un taller de sumas y conteo práctico usando productos recolectados en la chagra escolar (yuca, plátano) para afianzar operaciones básicas.",
          };
        } else if (sub.includes("TECNOLOGÍA") || sub.includes("INFORMÁTICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Spreadsheet Simplificado",
            message: "Diseñar una tabla simple de 3 columnas (Cosecha, Consumo, Excedente) en papel o equipo para organizar la producción de la vereda.",
          };
        } else if (sub.includes("FÍSICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Práctica de Fuerzas y Trapiche",
            message: "Explicar los conceptos de tensión y palancas comparándolos con el funcionamiento y tracción animal o motriz del trapiche panelero local.",
          };
        } else if (sub.includes("ÉTICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Círculo de Palabra y Minga",
            message: "Llevar a cabo una ronda de diálogo de 10 minutos basada en los valores Awá de ayuda mutua ('Minga') para resolver desacuerdos en el grupo.",
          };
        } else {
          aiSuggestion = {
            title: `IA Sugiere: Refuerzo de ${subject}`,
            message: `Elaborar un glosario visual de los términos principales de la clase de ${subject} y su relación con las labores del Diviso.`,
          };
        }
      } else if (classAvg >= 4.2) {
        // Avanzado / Profundización
        if (sub.includes("MATEMÁTICAS")) {
          aiSuggestion = {
            title: "IA Sugiere: Cestería y Simetría Awá",
            message: "Taller avanzado aplicando geometría espacial para diseñar patrones y simetrías circulares basadas en el tejido de canastos tradicionales.",
          };
        } else if (sub.includes("TECNOLOGÍA") || sub.includes("INFORMÁTICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Algoritmo de Riego Agroecológico",
            message: "Desarrollar un diagrama de flujo para programar un sistema de riego casero automatizado con materiales reciclados.",
          };
        } else if (sub.includes("FÍSICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Termodinámica y Evaporación",
            message: "Estudiar la transferencia de calor latente y la evaporación analizando el proceso de cocción del jugo de caña para hacer panela.",
          };
        } else if (sub.includes("ÉTICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Minga de Liderazgo Comunitario",
            message: "Elaborar un plan de acción grupal donde los estudiantes propongan soluciones a problemas de basura y agua en su vereda.",
          };
        } else {
          aiSuggestion = {
            title: `IA Sugiere: Profundización en ${subject}`,
            message: `Proyecto de investigación del rol de ${subject} en la soberanía alimentaria o protección del entorno indígena.`,
          };
        }
      } else {
        // Consolidación
        if (sub.includes("MATEMÁTICAS")) {
          aiSuggestion = {
            title: "IA Sugiere: Presupuesto y Comercio Local",
            message: "Taller de cálculo básico simulando compras, ventas y trueques cotidianos en la plaza o mercado comunitario de la región.",
          };
        } else if (sub.includes("TECNOLOGÍA") || sub.includes("INFORMÁTICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Inventario de Saberes Locales",
            message: "Estructurar una base de datos o tabla conceptual con las tecnologías tradicionales Awá y su importancia ecológica.",
          };
        } else if (sub.includes("FÍSICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Gravedad y Fluidos en Ríos",
            message: "Analizar el caudal y la velocidad del agua en las quebradas locales usando botellas flotantes como experimento práctico de campo.",
          };
        } else if (sub.includes("ÉTICA")) {
          aiSuggestion = {
            title: "IA Sugiere: Relación Territorio y Awá",
            message: "Debate guiado sobre cómo el cuidado del medio ambiente y los ríos fortalece la identidad del joven en la comunidad.",
          };
        } else {
          aiSuggestion = {
            title: `IA Sugiere: Aplicación de ${subject}`,
            message: `Dinámica de roles para exponer en grupos cómo el tema de hoy en ${subject} se conecta con el bienestar de Katsa Su.`,
          };
        }
      }
    }

    results.push({
      title: aiSuggestion.title,
      message: aiSuggestion.message,
      type: 'tip',
      icon: Lightbulb
    });

    return results;
  }, [myStudents, course, subject]);

  return (
    <section className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
          <Sparkles size={20} className="text-primary-container" />
        </div>
        <div>
          <h2 className="text-lg font-black uppercase tracking-tighter italic">Asistente IA IETABA</h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Análisis predictivo de aula</p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        {insights.map((insight, i) => (
          <div key={i} className={`p-4 rounded-2xl border flex gap-4 animate-in slide-in-from-right-4 duration-500 delay-${i * 100} ${
            insight.type === 'warning' ? 'bg-rose-500/10 border-rose-500/20' : 
            insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 
            'bg-blue-500/10 border-blue-500/20'
          }`}>
            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
              insight.type === 'warning' ? 'bg-rose-500/20 text-rose-400' : 
              insight.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 
              'bg-blue-500/20 text-blue-400'
            }`}>
              <insight.icon size={18} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start gap-2">
                <h3 className={`text-[11px] font-black uppercase tracking-widest mb-1 ${
                  insight.type === 'warning' ? 'text-rose-400' : 
                  insight.type === 'success' ? 'text-emerald-400' : 
                  'text-blue-400'
                }`}>{insight.title}</h3>
                {insight.type === 'tip' && (
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${insight.title}: ${insight.message}`);
                      alert("¡Sugerencia de taller copiada al portapapeles!");
                    }}
                    className="text-[8px] font-black text-blue-400 hover:text-white uppercase tracking-wider bg-blue-500/10 hover:bg-blue-500/30 px-2 py-0.5 rounded border border-blue-400/20 transition-all shrink-0"
                  >
                    Copiar
                  </button>
                )}
              </div>
              <p className="text-[11px] font-medium text-slate-300 leading-relaxed">{insight.message}</p>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 hover:text-white transition-all">
        Ver Reporte de IA Completo
      </button>
    </section>
  );
}
