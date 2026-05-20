/**
 * printService.ts
 * Opens a printer-ready HTML page in a new tab.
 * No external PDF library needed — browser Print to PDF works perfectly.
 */

import { normalizeGrade } from "@/context/AppContext";

interface Student {
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  nroDocumento: string;
  tipoDocumento: string;
  grado: string;
  curso: string;
  genero: string;
  attendance?: string;
  avgGrade?: number;
  isActive?: boolean;
}

const INSTITUTION = "INSTITUCIÓN EDUCATIVA INDÍGENA TÉCNICA AGROAMBIENTAL BILINGÜE AWÁ - IETABA";

function baseStyles(): string {
  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 40px; background: #fff; }
      
      /* Typography & Branding */
      h1 { font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.02em; color: #0f172a; margin-bottom: 4px; }
      .brand-accent { color: #2563eb; }
      
      /* Executive Dashboard Layout */
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 25px 0; }
      .stat-card { padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; background: #f8fafc; }
      .stat-card.accent-blue { background: #eff6ff; border-color: #dbeafe; }
      .stat-card.accent-red { background: #fef2f2; border-color: #fee2e2; }
      .stat-card.accent-green { background: #f0fdf4; border-color: #dcfce7; }
      
      .stat-label { font-size: 9px; font-weight: 800; color: #64748b; text-transform: uppercase; tracking: 0.1em; margin-bottom: 8px; }
      .stat-value { font-size: 24px; font-weight: 900; color: #0f172a; }
      .stat-sub { font-size: 10px; font-weight: 600; color: #94a3b8; margin-top: 4px; }

      /* Table Styles */
      .report-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 20px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
      .report-table th { background: #f1f5f9; color: #475569; font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 12px 15px; text-align: left; border-bottom: 2px solid #e2e8f0; }
      .report-table td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 10px; vertical-align: middle; }
      .report-table tr:last-child td { border-bottom: none; }
      
      /* Badges & Indicators */
      .badge { padding: 4px 8px; rounded: 6px; font-size: 9px; font-weight: 800; text-transform: uppercase; }
      .badge-blue { background: #dbeafe; color: #1e40af; }
      .badge-red { background: #fee2e2; color: #991b1b; }
      .badge-green { background: #dcfce7; color: #166534; }
      
      .perf-bar { height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; width: 60px; margin-top: 4px; }
      .perf-fill { height: 100%; border-radius: 3px; }

      .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; color: #94a3b8; font-size: 9px; }
      
      @media print { 
        body { padding: 20px; }
        .stats-grid { gap: 10px; }
        .stat-card { break-inside: avoid; }
      }
    </style>
  `;
}

function nowFullStr(): string {
  const d = new Date();
  const date = d.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
  const time = d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return `${date} | ${time}`;
}

function standardHeader(
  title: string,
  meta: { grade?: string; course?: string; teacher: string; subject?: string; period?: string }
): string {
  return `
    <style>
      .doc-header-unified { border-bottom: 3px solid #1a56db; padding-bottom: 15px; margin-bottom: 20px; }
      .inst-title { font-size: 16px; font-weight: 900; color: #1e3a8a; text-align: center; margin-bottom: 4px; }
      .inst-sub { font-size: 10px; font-weight: 700; color: #64748b; text-align: center; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 15px; }
      .doc-meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
      .meta-item { font-size: 10px; color: #334155; }
      .meta-item strong { color: #1e293b; text-transform: uppercase; }
      .doc-title-main { font-size: 20px; font-weight: 900; color: #111; margin: 15px 0 5px; text-transform: uppercase; }
    </style>
    <div class="doc-header-unified">
      <div class="inst-title">${INSTITUTION}</div>
      <div class="inst-sub">EduManager — Sistema de Gestión Docente v2.4</div>
      <div class="doc-meta-grid">
        <div class="meta-item"><strong>Docente:</strong> ${meta.teacher.toUpperCase()}</div>
        <div class="meta-item"><strong>Fecha/Hora:</strong> ${nowFullStr()}</div>
        <div class="meta-item"><strong>Grado/Curso:</strong> ${meta.grade || ""}${meta.course ? ` — ${meta.course}` : ""}</div>
        <div class="meta-item"><strong>Materia:</strong> ${meta.subject || "GENERAL"}</div>
        <div class="meta-item"><strong>Periodo:</strong> ${meta.period || "N/A"}</div>
      </div>
      <h1 class="doc-title-main">${title}</h1>
    </div>
  `;
}

function fullName(s: Student): string {
  return [s.primerNombre, s.segundoNombre, s.primerApellido, s.segundoApellido]
    .filter(Boolean).join(" ").toUpperCase();
}

function open(html: string) {
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 600);
}

// ── PUBLIC FUNCTIONS ──────────────────────────────────────────────────────────

export function printStudentsByCourse(students: Student[], course: string, teacherName: string) {
  const list = students
    .filter(s => s.curso === course && s.isActive !== false)
    .sort((a, b) => a.primerApellido.localeCompare(b.primerApellido));

  const rows = list.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${fullName(s)}</td>
      <td>${s.tipoDocumento} ${s.nroDocumento}</td>
      <td>${s.genero}</td>
      <td style="width:60px"></td>
    </tr>
  `).join("");

  open(`<!DOCTYPE html><html><head><title>LISTADO_${course.toUpperCase()}</title>${baseStyles()}</head><body>
    ${standardHeader("Listado Oficial de Estudiantes", { course, teacher: teacherName })}
    <table>
      <thead><tr><th>#</th><th>Nombre Completo</th><th>Documento</th><th>Género</th><th>Firma / Visto</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="sign">
      <div class="sign-line"><hr/><p>Firma Docente</p></div>
      <div class="sign-line"><hr/><p>Firma Coordinación</p></div>
    </div>
    <div class="footer">EduManager · IETABA · Generado el ${nowFullStr()}</div>
  </body></html>`);
}

export function printStudentsByGrade(students: Student[], grade: string, teacherName: string) {
  const list = students
    .filter(s => normalizeGrade(s.grado) === grade && s.isActive !== false)
    .sort((a, b) => a.curso.localeCompare(b.curso) || a.primerApellido.localeCompare(b.primerApellido));

  const rows = list.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${s.curso}</td>
      <td>${fullName(s)}</td>
      <td>${s.tipoDocumento} ${s.nroDocumento}</td>
      <td>${s.genero}</td>
    </tr>
  `).join("");

  open(`<!DOCTYPE html><html><head><title>CONSOLIDADO_${grade.replace('°', '')}</title>${baseStyles()}</head><body>
    ${standardHeader(`Consolidado Grado ${grade}`, { grade, teacher: teacherName })}
    <table>
      <thead><tr><th>#</th><th>Curso</th><th>Nombre Completo</th><th>Documento</th><th>Género</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">EduManager · IETABA · Generado el ${nowFullStr()}</div>
  </body></html>`);
}

export function printAttendanceSheet(
  students: Student[],
  course: string,
  teacherName: string,
  subject: string,
  _dateStr?: string
) {
  const list = students
    .filter(s => s.curso === course && s.isActive !== false)
    .sort((a, b) => a.primerApellido.localeCompare(b.primerApellido));

  const rows = list.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${fullName(s)}</td>
      <td style="width:50px;text-align:center"></td>
      <td style="width:50px;text-align:center"></td>
      <td style="width:120px"></td>
    </tr>
  `).join("");

  open(`<!DOCTYPE html><html><head><title>ASISTENCIA_${course.toUpperCase()}_${subject.toUpperCase()}</title>${baseStyles()}</head><body>
    ${standardHeader("Planilla de Control de Asistencia", { course, teacher: teacherName, subject })}
    <table>
      <thead><tr><th>#</th><th>Nombre Completo</th><th>✓ Presente</th><th>✗ Ausente</th><th>Observaciones</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="sign">
      <div class="sign-line"><hr/><p>Firma Docente</p></div>
      <div class="sign-line"><hr/><p>Visto Bueno Coordinación</p></div>
    </div>
    <div class="footer">EduManager · IETABA · Generado el ${nowFullStr()}</div>
  </body></html>`);
}

export function printWeeklySchedule(
  schedule: Array<{ day: string; subject: string; course: string; startTime: string; endTime: string }>,
  teacherName: string
) {
  const DAYS = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES"];
  const rows = schedule
    .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime))
    .map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${s.day}</td>
        <td>${s.startTime} – ${s.endTime}</td>
        <td>${s.subject}</td>
        <td>${s.course}</td>
      </tr>
    `).join("");

  open(`<!DOCTYPE html><html><head><title>Horario Semanal</title>${baseStyles()}</head><body>
    ${standardHeader("Horario Semanal Docente", { teacher: teacherName })}
    <table>
      <thead><tr><th>#</th><th>Día</th><th>Horario</th><th>Materia</th><th>Curso</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">EduManager · IETABA</div>
  </body></html>`);
}

export function printPedagogicalPlan(
  data: {
    summary: string;
    lesson: string;
    workshop: string;
    activity: string;
    exam: string;
    grade: string;
    subject: string;
  },
  teacherName: string,
  type: "full" | "lesson" | "workshop" | "activity" | "exam" = "full"
) {
  const titles: Record<string, string> = {
    full: "Planeación Pedagógica Integral",
    lesson: "I. Desarrollo de Clase",
    workshop: "II. Taller de Aplicación",
    activity: "III. Actividad Lúdica — Tejiendo Aprendo",
    exam: "IV. Evaluación de Competencias",
  };

  const moduleColors: Record<string, string> = {
    lesson: "#1a56db",
    workshop: "#006c4a",
    activity: "#ca8a04",
    exam: "#ba1a1a",
  };

  const allModules = [
    { id: "lesson", title: "I. DESARROLLO DE CLASE", body: data.lesson },
    { id: "workshop", title: "II. TALLER DE APLICACIÓN", body: data.workshop },
    { id: "activity", title: "III. ACTIVIDAD LÚDICA — TEJIENDO APRENDO", body: data.activity },
    { id: "exam", title: "IV. EVALUACIÓN DE COMPETENCIAS", body: data.exam },
  ];

  const filtered = type === "full" ? allModules : allModules.filter(m => m.id === type);

  const contentHtml = filtered.map(m => `
    <div style="margin-bottom: 30px; page-break-inside: avoid; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
      <div style="background: ${moduleColors[m.id]}; color: #fff; padding: 12px 20px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">
        ${m.title}
      </div>
      <div style="padding: 24px; line-height: 1.8; font-size: 12px; color: #333; background: #fff;">
        ${m.body.replace(/\n/g, "<br/>")}
      </div>
      <div style="background: #f9fafb; padding: 10px 20px; border-top: 1px solid #eee; font-size: 9px; color: #888; display: flex; justify-content: space-between;">
        <span>Firma Docente: _______________________</span>
        <span>Visto Bueno Coordinación: __________</span>
      </div>
    </div>
  `).join("");

  open(`<!DOCTYPE html><html><head><title>PLANEACION_${data.subject.toUpperCase()}_${data.grade.replace('°', '')}</title>${baseStyles()}</head><body>
    ${standardHeader(titles[type], { grade: data.grade, teacher: teacherName, subject: data.subject })}
    ${contentHtml}
    <div class="footer">Recurso generado por IA pedagógica optimizada para IETABA. ${nowFullStr()}</div>
  </body></html>`);
}

export function printGradesTable(
  students: any[],
  meta: { grade: string; course: string; teacher: string; subject: string; period?: string }
) {
  const columns = [
    ...Array.from({ length: 8 }, (_, i) => ({ id: `SB${i + 1}`, type: "SB", idx: i })),
    ...Array.from({ length: 8 }, (_, i) => ({ id: `SBH${i + 1}`, type: "SBH", idx: i })),
    ...Array.from({ length: 5 }, (_, i) => ({ id: `SR${i + 1}`, type: "SR", idx: i })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `CV${i + 1}`, type: "CV", idx: i })),
    { id: "AUT", type: "AUT", idx: 0 },
    { id: "DEF", type: "DEF", idx: 0 }
  ];

  const getGradeValue = (st: any, colType: string, index: number, subject: string, periodId?: string) => {
    const pid = (periodId || "p2").toLowerCase();
    
    // 1. Try NEW DetailedGrades Structure (High Precision)
    if (st.detailedGrades?.[subject]?.[pid]) {
      const d = st.detailedGrades[subject][pid];
      if (colType === "SB") return d.sb[index] !== null ? d.sb[index].toFixed(1) : "";
      if (colType === "SBH") return d.sbh[index] !== null ? d.sbh[index].toFixed(1) : "";
      if (colType === "SR") return d.sr[index] !== null ? d.sr[index].toFixed(1) : "";
      if (colType === "CV") return d.cv[index] !== null ? d.cv[index].toFixed(1) : "";
      if (colType === "AUT") return d.aut !== null ? d.aut.toFixed(1) : "";
      if (colType === "DEF") {
        const getAvg = (vals: (number | null)[]) => {
          const valid = vals.filter(v => v !== null) as number[];
          return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
        };
        const sbAvg = getAvg(d.sb);
        const sbhAvg = getAvg(d.sbh);
        const srAvg = getAvg(d.sr);
        const cvAvg = getAvg(d.cv);
        const aut = d.aut || 0;
        const final = (sbAvg * 0.3) + (sbhAvg * 0.4) + (srAvg * 0.2) + (cvAvg * 0.05) + (aut * 0.05);
        return final > 0 ? final.toFixed(1) : "0.0";
      }
    }

    // 2. Fallback to Legacy st.grades (History based)
    const stGrades = st.grades as any[] | undefined;
    if (!stGrades) return "";
    const subjectGrades = stGrades.filter(g => g.title?.includes(`[${subject}]`));
    
    if (colType === "DEF") {
      const validScores = subjectGrades.filter(g => g.type !== 'participation').map(g => g.score);
      const baseAvg = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;
      const bonus = subjectGrades.filter(g => g.type === 'participation').reduce((a, b) => a + (b.score * 0.02), 0);
      const final = Math.min(5.0, baseAvg + bonus);
      return final > 0 ? final.toFixed(1) : "0.0";
    }

    let filtered: any[] = [];
    if (colType === "SB") filtered = subjectGrades.filter(g => g.type === "exam");
    else if (colType === "SBH") filtered = subjectGrades.filter(g => g.type === "activity");
    else if (colType === "SR") filtered = subjectGrades.filter(g => g.type === "participation");
    else if (colType === "CV") filtered = subjectGrades.filter(g => g.type === "participation").slice(5);
    else if (colType === "AUT") filtered = subjectGrades.filter(g => g.title?.toUpperCase().includes("AUTO"));
    
    const grade = filtered[index];
    return grade ? grade.score.toFixed(1) : "";
  };

  const rows = students.map((st) => {
    const colCells = columns.map(col => {
      const val = getGradeValue(st, col.type, col.idx, meta.subject, meta.period);
      const isDef = col.type === "DEF";
      const color = val && parseFloat(val) < 3.0 ? "color:#ba1a1a; font-weight:bold;" : "";
      const bgColor = isDef ? "background:#f8fafc;" : "";
      return `<td style="border:1px solid #000; text-align:center; ${color} ${bgColor} ${isDef ? 'font-weight:900;' : ''}">${val}</td>`;
    }).join("");

    return `
      <tr>
        <td style="border:1px solid #000; text-align:center; font-size:8px;">${st.nroDocumento}</td>
        <td style="border:1px solid #000; font-weight:bold;">${st.primerApellido} ${st.segundoApellido}</td>
        <td style="border:1px solid #000;">${st.primerNombre} ${st.segundoNombre}</td>
        ${colCells}
      </tr>
    `;
  }).join("");

  const headerCells = columns.map(c => {
    const isDef = c.id === "DEF";
    return `<th style="border:1px solid #000; background:${isDef ? '#1e3a8a' : '#f1f5f9'}; color:${isDef ? '#fff' : '#000'}; font-size:7px; padding:2px; width:${isDef ? '35px' : '25px'};">${c.id}</th>`;
  }).join("");

  open(`<!DOCTYPE html><html><head><title>SABANA_${meta.subject.toUpperCase()}_${meta.grade.replace('°', '')}_${meta.course}_${(meta.period || '').toUpperCase()}</title>${baseStyles()}
    <style>
      @page { size: landscape; margin: 0.5cm; }
      table { border: 1px solid #000; table-layout: fixed; }
      td, th { border: 1px solid #000 !important; font-size: 8px !important; padding: 2px 4px !important; }
      .inst-title { font-size: 14px !important; }
    </style>
  </head><body>
    ${standardHeader("Sábana Auxiliar de Calificaciones", meta)}
    <table>
      <thead>
        <tr>
          <th style="width:70px">CODIGO</th>
          <th style="width:140px">APELLIDO</th>
          <th style="width:140px">NOMBRE</th>
          ${headerCells}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="sign">
      <div class="sign-line"><hr/><p>Firma Docente</p></div>
      <div class="sign-line"><hr/><p>Vo.Bo. Coordinación</p></div>
    </div>
    <div class="footer">IETABA · Premium Suite · Generado el ${nowFullStr()} | © 2026 Powered by Sinapcode</div>
  </body></html>`);
}
export function printInstitutionalStudentReport(students: Student[], teacherName: string) {
  const active = students.filter(s => s.isActive !== false);
  const avgGrade = active.length > 0 ? (active.reduce((acc, s) => acc + (s.avgGrade || 0), 0) / active.length) : 0;
  const atRisk = active.filter(s => (s.avgGrade || 0) < 3.0).length;
  const topPerf = active.filter(s => (s.avgGrade || 0) >= 4.0).length;

  const rows = active
    .sort((a, b) => a.primerApellido.localeCompare(b.primerApellido))
    .map((s, i) => {
      const avg = s.avgGrade || 0;
      const perfColor = avg >= 4.0 ? "#166534" : avg < 3.0 ? "#991b1b" : "#1e293b";
      const perfBg = avg >= 4.0 ? "#dcfce7" : avg < 3.0 ? "#fee2e2" : "#f1f5f9";
      const initials = `${s.primerApellido[0]}${s.primerNombre[0]}`;
      
      return `
        <tr>
          <td style="width: 40px; text-align: center; color: #94a3b8; font-weight: 800;">${i + 1}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 24px; height: 24px; border-radius: 6px; background: ${perfBg}; color: ${perfColor}; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 900;">${initials}</div>
              <div>
                <div style="font-weight: 800; color: #0f172a;">${fullName(s)}</div>
                <div style="font-size: 8px; color: #64748b; text-transform: uppercase;">${s.tipoDocumento} ${s.nroDocumento}</div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-blue" style="background:#f1f5f9; color:#475569;">${normalizeGrade(s.grado)} — ${s.curso}</span></td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 900; color: ${perfColor}; min-width: 25px;">${avg.toFixed(1)}</span>
              <div class="perf-bar"><div class="perf-fill" style="width: ${(avg/5)*100}%; background: ${perfColor};"></div></div>
            </div>
          </td>
          <td style="text-align: center;"><span class="badge ${s.attendance === '100%' ? 'badge-green' : 'badge-blue'}">${s.attendance || '0%'}</span></td>
        </tr>
      `;
    }).join("");

  open(`<!DOCTYPE html><html><head><title>REPORTE_INSTITUCIONAL_${new Date().getFullYear()}</title>${baseStyles()}</head><body>
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
      <div>
        <h1>Reporte Institucional <span class="brand-accent">de Estudiantes</span></h1>
        <p style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em;">IETABA · Gestión de Matrícula y Rendimiento</p>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; font-weight: 900; color: #0f172a;">IETABA PREMIUM SUITE</div>
        <div style="font-size: 9px; color: #94a3b8; font-weight: 700;">${nowFullStr()}</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card accent-blue">
        <div class="stat-label">Población Total</div>
        <div class="stat-value">${active.length}</div>
        <div class="stat-sub">Estudiantes Activos</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Promedio Grupal</div>
        <div class="stat-value">${avgGrade.toFixed(2)}</div>
        <div class="stat-sub">Escala 0.0 - 5.0</div>
      </div>
      <div class="stat-card accent-green">
        <div class="stat-label">Nivel Superior</div>
        <div class="stat-value">${topPerf}</div>
        <div class="stat-sub">${active.length > 0 ? ((topPerf/active.length)*100).toFixed(0) : 0}% de Excelencia</div>
      </div>
      <div class="stat-card accent-red">
        <div class="stat-label">Riesgo Académico</div>
        <div class="stat-value">${atRisk}</div>
        <div class="stat-sub">Casos Detectados</div>
      </div>
    </div>

    <table class="report-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Estudiante / Documento</th>
          <th>Grado/Curso</th>
          <th>Rendimiento</th>
          <th style="text-align: center;">Asistencia</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="sign" style="margin-top: 60px;">
      <div class="sign-line"><hr/><p>Firma del Docente</p></div>
      <div class="sign-line"><hr/><p>Secretaría Académica</p></div>
      <div class="sign-line"><hr/><p>Rectoría / Coordinación</p></div>
    </div>

    <div class="footer">
      <div>© 2026 Powered by Sinapcode · IETABA · Colombia</div>
      <div>Documento Oficial generado por EduManager Platinum Edition</div>
      <div>Página 1 de 1</div>
    </div>
  </body></html>`);
}
