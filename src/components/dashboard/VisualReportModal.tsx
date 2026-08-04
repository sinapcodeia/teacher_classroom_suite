"use client";

import { useRef, useEffect, useState } from "react";
import { X, Download, Award, BarChart3, HelpCircle, User } from "lucide-react";
import { Student } from "@/context/AppContext";

interface VisualReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  subject: string;
  period: string;
  teacherName: string;
  grade: string;
  course: string;
  aiInsightText?: string;
}

export default function VisualReportModal({
  isOpen,
  onClose,
  students,
  subject,
  period,
  teacherName,
  grade,
  course,
  aiInsightText
}: VisualReportModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<"diploma" | "infographic">("diploma");
  
  // States for Diploma
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [diplomaCategory, setDiplomaCategory] = useState<"excelencia" | "esfuerzo" | "minga">("excelencia");

  // Set default student on load
  useEffect(() => {
    if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].id);
    }
  }, [students, selectedStudentId]);

  // Redraw when parameters change
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    if (activeTab === "diploma") {
      const student = students.find(s => s.id === selectedStudentId);
      const studentName = student 
        ? `${student.primerNombre} ${student.primerApellido}` 
        : "Nombre del Estudiante";
      drawDiploma(canvas, studentName, diplomaCategory);
    } else {
      drawInfographic(canvas);
    }
  }, [isOpen, activeTab, selectedStudentId, diplomaCategory, students, subject, period, teacherName, grade, course]);

  if (!isOpen) return null;

  // ── DIPLOMA DRAWING LOGIC ──────────────────────────────────────────
  const drawDiploma = (canvas: HTMLCanvasElement, studentName: string, category: string) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensions
    canvas.width = 1000;
    canvas.height = 700;

    // 1. Background Gradient (Parchment look)
    const bgGrad = ctx.createRadialGradient(500, 350, 50, 500, 350, 600);
    bgGrad.addColorStop(0, "#fefcf9");
    bgGrad.addColorStop(1, "#f2e9d2");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1000, 700);

    // 2. Borders
    // Outer blue border
    ctx.lineWidth = 14;
    ctx.strokeStyle = "#0f172a"; // Slate-900
    ctx.strokeRect(30, 30, 940, 640);

    // Inner gold border
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#d97706"; // Amber-600
    ctx.strokeRect(42, 42, 916, 616);

    // 3. Draw Indigenous Corner Patterns (Awá Cestería style)
    const drawCornerPattern = (x: number, y: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.beginPath();
      // Zigzag traditional geometric lines
      ctx.moveTo(0, 0);
      ctx.lineTo(25, 0);
      ctx.lineTo(12, 12);
      ctx.lineTo(37, 12);
      ctx.lineTo(25, 25);
      ctx.lineTo(50, 25);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#d97706";
      ctx.stroke();
      ctx.restore();
    };

    drawCornerPattern(48, 48, 0);
    drawCornerPattern(952, 48, Math.PI / 2);
    drawCornerPattern(952, 652, Math.PI);
    drawCornerPattern(48, 652, -Math.PI / 2);

    // 4. Header Text
    ctx.textAlign = "center";
    ctx.fillStyle = "#1e293b";
    
    ctx.font = "bold 24px Georgia, serif";
    ctx.fillText("INSTITUCIÓN EDUCATIVA INTEGRAL AWÁ", 500, 95);
    
    ctx.font = "italic 16px Georgia, serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("IETABA Katsa Su — El Diviso, Nariño", 500, 120);
    ctx.font = "bold 9px Helvetica, sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("RESOLUCIÓN OFICIAL DE FUNCIONAMIENTO N° 1245 — ENFOQUE AGROAMBIENTAL", 500, 140);

    // Divider
    ctx.beginPath();
    ctx.moveTo(350, 160);
    ctx.lineTo(650, 160);
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. Title
    ctx.fillStyle = "#1e3b8b"; // Deep blue
    ctx.font = "bold italic 48px Georgia, serif";
    ctx.fillText("DIPLOMA DE HONOR", 500, 220);

    ctx.fillStyle = "#475569";
    ctx.font = "italic 18px Georgia, serif";
    ctx.fillText("Otorgado con orgullo y reconocimiento a:", 500, 270);

    // 6. Student Name
    ctx.fillStyle = "#b45309"; // Bronze gold
    ctx.font = "bold 38px Georgia, serif";
    ctx.fillText(studentName.toUpperCase(), 500, 325);

    // Line under name
    ctx.beginPath();
    ctx.moveTo(250, 345);
    ctx.lineTo(750, 345);
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 7. Reason Text
    ctx.fillStyle = "#334155";
    ctx.font = "16px Georgia, serif";
    
    let reasonText = "";
    if (category === "excelencia") {
      reasonText = `Por obtener un rendimiento académico sobresaliente en la asignatura de ${subject.toUpperCase()}`;
    } else if (category === "esfuerzo") {
      reasonText = `Por su valioso esfuerzo, constancia y superación académica en la asignatura de ${subject.toUpperCase()}`;
    } else {
      reasonText = `Por su destacado compañerismo, valores culturales y vivencia de la Minga en ${subject.toUpperCase()}`;
    }

    ctx.fillText(reasonText, 500, 385);
    ctx.fillText(`en el grado ${grade} - curso ${course} durante el ${period.toUpperCase()}`, 500, 410);
    ctx.fillText("como ejemplo de dedicación comunitaria en el territorio Katsa Su.", 500, 435);

    // Date
    const dateStr = new Date().toLocaleDateString("es-ES", {
      day: "numeric", month: "long", year: "numeric"
    });
    ctx.font = "italic 14px Georgia, serif";
    ctx.fillText(`Dado en El Diviso, a los ${dateStr}`, 500, 480);

    // 8. Signatures
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#64748b";

    // Teacher
    ctx.beginPath();
    ctx.moveTo(200, 580);
    ctx.lineTo(400, 580);
    ctx.stroke();
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 13px Georgia, serif";
    ctx.fillText(teacherName.toUpperCase(), 300, 598);
    ctx.font = "italic 11px Georgia, serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Docente de Asignatura", 300, 615);

    // Rector
    ctx.beginPath();
    ctx.moveTo(600, 580);
    ctx.lineTo(800, 580);
    ctx.stroke();
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 13px Georgia, serif";
    ctx.fillText("JESUS ANTONIO RODRIGUEZ", 700, 598);
    ctx.font = "italic 11px Georgia, serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Rector IETABA", 700, 615);

    // 9. Golden Seal
    ctx.beginPath();
    ctx.arc(500, 580, 46, 0, 2 * Math.PI);
    ctx.fillStyle = "#fbbf24"; // Bright amber
    ctx.fill();
    ctx.strokeStyle = "#d97706";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(500, 580, 40, 0, 2 * Math.PI);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#78350f";
    ctx.font = "bold 8px Helvetica, sans-serif";
    ctx.fillText("MÉRITO", 500, 574);
    ctx.fillText("ESCOLAR", 500, 584);
    ctx.font = "bold 7px Helvetica, sans-serif";
    ctx.fillText("★ IETABA ★", 500, 594);
  };

  // ── INFOGRAPHIC DRAWING LOGIC ──────────────────────────────────────
  const drawInfographic = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dimensions
    canvas.width = 800;
    canvas.height = 1100;

    // 1. Dark Slate Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 1100);
    bgGrad.addColorStop(0, "#0f172a"); // slate-900
    bgGrad.addColorStop(0.5, "#1e1b4b"); // indigo-950
    bgGrad.addColorStop(1, "#020617"); // slate-950
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 800, 1100);

    // Subway/grid pattern (subtle)
    ctx.strokeStyle = "rgba(255,255,255,0.02)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 800; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 1100);
      ctx.stroke();
    }
    for (let j = 0; j < 1100; j += 40) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(800, j);
      ctx.stroke();
    }

    // 2. Header Block
    ctx.fillStyle = "rgba(255,255,255,0.03)";
    ctx.fillRect(40, 40, 720, 130);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, 720, 130);

    ctx.textAlign = "left";
    ctx.fillStyle = "#38bdf8"; // sky-400
    ctx.font = "bold 10px Helvetica, sans-serif";
    ctx.fillText("INFORME ESTRATÉGICO DE AULA", 60, 70);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold italic 26px Georgia, serif";
    ctx.fillText(`${subject} — GRADO ${grade} - CURSO ${course}`, 60, 105);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 12px Helvetica, sans-serif";
    ctx.fillText(`Periodo: ${period.toUpperCase()}  |  Docente: ${teacherName}  |  IETABA Katsa Su`, 60, 135);

    // 3. Stats calculations
    const totalSt = students.length;
    const passedSt = students.filter(s => s.avgGrade >= 3.0).length;
    const failedSt = totalSt - passedSt;
    const passRate = totalSt > 0 ? Math.round((passedSt / totalSt) * 100) : 0;
    const classAvg = totalSt > 0
      ? parseFloat((students.reduce((acc, s) => acc + (s.avgGrade || 0), 0) / totalSt).toFixed(2))
      : 0;

    const drawStatCard = (x: number, y: number, w: number, h: number, title: string, value: string, color: string) => {
      ctx.fillStyle = "rgba(255,255,255,0.02)";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.strokeRect(x, y, w, h);

      ctx.textAlign = "center";
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 9px Helvetica, sans-serif";
      ctx.fillText(title.toUpperCase(), x + w/2, y + 25);

      ctx.fillStyle = color;
      ctx.font = "bold 36px Helvetica, sans-serif";
      ctx.fillText(value, x + w/2, y + 70);
    };

    drawStatCard(40, 200, 220, 100, "Promedio General", `${classAvg} / 5.0`, "#f59e0b");
    drawStatCard(290, 200, 220, 100, "Matrícula Activa", `${totalSt} Alumnos`, "#38bdf8");
    drawStatCard(540, 200, 220, 100, "Tasa de Aprobación", `${passRate}%`, "#10b981");

    // 4. Performance Chart (Distribution)
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fillRect(40, 330, 720, 250);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.strokeRect(40, 330, 720, 250);

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Georgia, serif";
    ctx.fillText("DISTRIBUCIÓN DE NOTAS Y RENDIMIENTO", 60, 365);

    const counts = { superior: 0, alto: 0, basico: 0, bajo: 0 };
    students.forEach(s => {
      const g = s.avgGrade || 0;
      if (g >= 4.6) counts.superior++;
      else if (g >= 4.0) counts.alto++;
      else if (g >= 3.0) counts.basico++;
      else counts.bajo++;
    });

    const chartData = [
      { label: "Superior (4.6 - 5.0)", count: counts.superior, color: "#10b981" },
      { label: "Alto (4.0 - 4.5)", count: counts.alto, color: "#3b82f6" },
      { label: "Básico (3.0 - 3.9)", count: counts.basico, color: "#f59e0b" },
      { label: "Bajo (1.0 - 2.9)", count: counts.bajo, color: "#ef4444" }
    ];

    let chartY = 410;
    chartData.forEach(item => {
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 11px Helvetica, sans-serif";
      ctx.fillText(item.label, 60, chartY + 12);

      // Background bar
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(230, chartY, 400, 16);

      // Fill bar
      const pct = totalSt > 0 ? item.count / totalSt : 0;
      ctx.fillStyle = item.color;
      ctx.fillRect(230, chartY, pct * 400, 16);

      // Statistics text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px Helvetica, sans-serif";
      ctx.fillText(`${item.count} est. (${Math.round(pct * 100)}%)`, 650, chartY + 12);

      chartY += 38;
    });

    // 5. Top 5 Students
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fillRect(40, 610, 345, 260);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.strokeRect(40, 610, 345, 260);

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Georgia, serif";
    ctx.fillText("CUADRO DE HONOR (EXCELENCIA)", 60, 645);

    const topSt = [...students]
      .filter(s => s.avgGrade)
      .sort((a, b) => b.avgGrade - a.avgGrade)
      .slice(0, 5);

    let stY = 690;
    topSt.forEach((st, idx) => {
      ctx.fillStyle = idx === 0 ? "#fbbf24" : "#ffffff";
      ctx.font = "bold 11px Helvetica, sans-serif";
      ctx.fillText(`★ #${idx + 1}`, 60, stY);

      ctx.fillStyle = "#e2e8f0";
      const name = `${st.primerApellido} ${st.primerNombre}`.toUpperCase();
      ctx.fillText(name.substring(0, 20), 100, stY);

      ctx.textAlign = "right";
      ctx.fillStyle = "#fbbf24";
      ctx.fillText(`${st.avgGrade.toFixed(1)}`, 360, stY);
      ctx.textAlign = "left";

      stY += 34;
    });

    // 6. AI & Territorial Context Insight
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fillRect(415, 610, 345, 260);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.strokeRect(415, 610, 345, 260);

    ctx.textAlign = "left";
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 15px Georgia, serif";
    ctx.fillText("INSIGHT DE IA Y PEDAGOGÍA AWÁ", 435, 645);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "italic 12px Georgia, serif";

    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
      const words = text.split(" ");
      let line = "";
      let currentY = y;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, x, currentY);
          line = words[n] + " ";
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, currentY);
    };

    const cleanInsight = aiInsightText || 
      "Sugerencia de taller de consolidación grupal. Implementar laboratorios de campo contextualizados con materiales agrícolas del Diviso.";
    wrapText(cleanInsight, 435, 685, 305, 18);

    // 7. Footer
    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 9px Helvetica, sans-serif";
    ctx.fillText("EDUMANAGER IETABA KATSA SU — INFOGRAFÍA DE CONTROL PEDAGÓGICO", 400, 1000);
    ctx.font = "italic 8px Helvetica, sans-serif";
    ctx.fillText("Generado offline de manera segura. Respeto al medio ambiente y cultura Awá.", 400, 1015);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = activeTab === "diploma" 
      ? `Diploma_${selectedStudentId || 'Estudiante'}.png`
      : `Infografia_${subject}_Grado_${grade}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
              <Award className="text-primary-container w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white text-lg font-black uppercase tracking-tight italic">Generador Visual Premium</h2>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mt-0.5">Diseño y exportación de recursos en tiempo real</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Workspace */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left panel: Controls */}
          <div className="w-full md:w-[320px] bg-slate-950/20 p-6 md:p-8 border-r border-white/5 overflow-y-auto space-y-6 flex flex-col justify-between shrink-0">
            <div className="space-y-6">
              {/* Select Category Tabs */}
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2.5">Recurso a Generar</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("diploma")}
                    className={`flex-1 py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all flex flex-col items-center gap-1.5 ${
                      activeTab === "diploma" 
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Award size={16} />
                    Diploma
                  </button>
                  <button
                    onClick={() => setActiveTab("infographic")}
                    className={`flex-1 py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all flex flex-col items-center gap-1.5 ${
                      activeTab === "infographic" 
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <BarChart3 size={16} />
                    Infografía
                  </button>
                </div>
              </div>

              {/* Dynamic Controls based on tab */}
              {activeTab === "diploma" ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Select Student */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Seleccionar Estudiante</label>
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-white text-xs font-semibold focus:outline-none focus:border-primary"
                    >
                      {students.map(s => (
                        <option key={s.id} value={s.id}>
                          {`${s.primerApellido} ${s.primerNombre}`.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Category */}
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tipo de Reconocimiento</label>
                    <select
                      value={diplomaCategory}
                      onChange={(e) => setDiplomaCategory(e.target.value as any)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-3 text-white text-xs font-semibold focus:outline-none focus:border-primary"
                    >
                      <option value="excelencia">Excelencia Académica (Promedio 4.0+)</option>
                      <option value="esfuerzo">Esfuerzo, Constancia y Superación</option>
                      <option value="minga">Compañerismo, Valores y Minga Awá</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <h4 className="text-[9px] font-black text-slate-200 uppercase tracking-wider mb-2">Datos de Infografía</h4>
                    <ul className="text-[10px] text-slate-400 font-bold space-y-1.5 uppercase">
                      <li>• Promedio: <span className="text-amber-400">Calculado</span></li>
                      <li>• Desempeños: <span className="text-emerald-400">Segmentados</span></li>
                      <li>• Cuadro de Honor: <span className="text-primary-container">Top 5 de clase</span></li>
                      <li>• Insight IA: <span className="text-sky-400">Contextualizado</span></li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-white/5">
              <button
                onClick={handleDownload}
                className="w-full py-4 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
              >
                <Download size={16} />
                Descargar PNG
              </button>
              <p className="text-[8px] text-slate-500 font-semibold uppercase tracking-widest text-center mt-3 leading-snug">
                El recurso se exporta con dimensiones de alta definición para impresión en físico.
              </p>
            </div>
          </div>

          {/* Right panel: Live Preview Canvas */}
          <div className="flex-1 bg-slate-950 p-6 md:p-8 flex items-center justify-center overflow-auto">
            <div className="max-w-full max-h-full flex items-center justify-center p-2 rounded-2xl bg-slate-900 border border-white/10 shadow-inner">
              <canvas 
                ref={canvasRef} 
                className="max-w-full max-h-[50vh] md:max-h-[60vh] object-contain shadow-2xl rounded-lg"
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
