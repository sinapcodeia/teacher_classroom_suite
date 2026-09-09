
// ── SANITIZACIÓN MILITAR CONTRA INYECCIÓN XSS (Security Hardening) ──
function escapeHtml(unsafe: any): string {
  if (unsafe === null || unsafe === undefined) return "";
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * printService.ts
 * Opens a printer-ready HTML page in a new tab.
 * No external PDF library needed — browser Print to PDF works perfectly.
 */

import {
  APP_VERSION_LABEL,
  APP_NAME,
  APP_EDITION,
  INSTITUTION_NAME,
  INSTITUTION_FULL_NAME_UPPER,
  INSTITUTION_LOCATION,
  APP_BRAND,
  normalizeGrade,
} from "@/lib/constants";


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
      <div class="inst-sub">${APP_NAME} — Sistema de Gestión Docente ${APP_VERSION_LABEL}</div>
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
    <div class="footer">${APP_NAME} · ${INSTITUTION_NAME} · Generado el ${nowFullStr()}</div>
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
    <div class="footer">${APP_NAME} · ${INSTITUTION_NAME} · Generado el ${nowFullStr()}</div>
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
    <div class="footer">${APP_NAME} · ${INSTITUTION_NAME} · Generado el ${nowFullStr()}</div>
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
    <div class="footer">${APP_NAME} · ${INSTITUTION_NAME}</div>
  </body></html>`);
}

export function printPedagogicalPlan(
  data: {
    summary: string;
    lesson: string;
    workshop: string;
    activity: string;
    exam: string;
    teacherGuide?: string;
    piar?: string;
    lecturaTejido?: string;
    grade: string;
    subject: string;
  },
  teacherName: string,
  type: "full" | "lesson" | "workshop" | "activity" | "exam" | "teacherGuide" | "piar" | "lecturaTejido" = "full"
) {
  const titles: Record<string, string> = {
    full: "Planeación Pedagógica Integral",
    lesson: "I. Desarrollo de Clase",
    workshop: "II. Taller de Aplicación",
    activity: "III. Actividad Lúdica — Tejiendo Aprendo",
    exam: "IV. Evaluación de Competencias",
    teacherGuide: "V. Guía Exclusiva del Docente",
    piar: "Adaptación Curricular Individual (PIAR)",
    lecturaTejido: "Guía de Lectura y Transcripción: El Tejido Ancestral"
  };

  const moduleColors: Record<string, string> = {
    lesson: "#1a56db",
    workshop: "#006c4a",
    activity: "#ca8a04",
    exam: "#ba1a1a",
    teacherGuide: "#7c3aed",
    piar: "#d97706",
    lecturaTejido: "#059669"
  };

  const allModules = [
    { id: "lesson", title: "I. DESARROLLO DE CLASE", body: data.lesson },
    { id: "workshop", title: "II. TALLER DE APLICACIÓN", body: data.workshop },
    { id: "activity", title: "III. ACTIVIDAD LÚDICA — TEJIENDO APRENDO", body: data.activity },
    { id: "exam", title: "IV. EVALUACIÓN DE COMPETENCIAS", body: data.exam },
  ];

  if (data.teacherGuide) {
    allModules.push({ id: "teacherGuide", title: "V. GUÍA EXCLUSIVA DEL DOCENTE", body: data.teacherGuide });
  }
  if (data.piar) {
    allModules.push({ id: "piar", title: "ADAPTACIÓN CURRICULAR INDIVIDUAL (PIAR)", body: data.piar });
  }
  if (data.lecturaTejido) {
    allModules.push({ id: "lecturaTejido", title: "GUÍA DE LECTURA Y TRANSCRIPCIÓN: EL TEJIDO ANCESTRAL", body: data.lecturaTejido });
  }

  const filtered = type === "full" ? allModules : allModules.filter(m => m.id === type);

  const contentHtml = filtered.map(m => {
    const isWorkshopModule = m.id === "workshop";
    const isLecturaTejido = m.id === "lecturaTejido";
    const bodyStyle = isWorkshopModule
      ? `padding: 16px; line-height: 1.6; font-size: 10.5px; color: #1e293b; background: #fff; column-count: 2; column-gap: 24px; column-rule: 1px dashed #cbd5e1; text-align: justify;`
      : isLecturaTejido
        ? `padding: 30px; line-height: 2.0; font-size: 12.5px; color: #0f172a; background: #fff; text-align: justify; font-family: 'Georgia', serif; border-left: 4px solid #059669;`
        : `padding: 24px; line-height: 1.8; font-size: 12px; color: #333; background: #fff;`;

    return `
      <div style="margin-bottom: 30px; page-break-inside: avoid; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
        <div style="background: ${moduleColors[m.id]}; color: #fff; padding: 12px 20px; font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">
          ${m.title}
        </div>
        <div style="${bodyStyle}">
          ${m.body.replace(/\n/g, "<br/>")}
        </div>
        <div style="background: #f9fafb; padding: 10px 20px; border-top: 1px solid #eee; font-size: 9px; color: #888; display: flex; justify-content: space-between; align-items: center;">
          <span>Firma Docente: _______________________</span>
          <span style="color: #cbd5e1; font-weight: 600; font-size: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Ing. Antonio Rodriguez Burgos</span>
          <span>Visto Bueno Coordinación: __________</span>
        </div>
      </div>
    `;
  }).join("");

  const customStyles = type === "workshop" || type === "full" || type === "lecturaTejido" || type === "piar" ? `
    <style>
      body { padding: 25px !important; }
      @media print {
        body { padding: 15px !important; }
        @page { margin: 0.6cm !important; }
      }
    </style>
  ` : "";

  open(`<!DOCTYPE html><html><head><title>PLANEACION_${data.subject.toUpperCase()}_${data.grade.replace('°', '')}</title>${baseStyles()}${customStyles}</head><body>
    ${standardHeader(titles[type], { grade: data.grade, teacher: teacherName, subject: data.subject })}
    ${contentHtml}
    <div class="footer">Recurso generado por IA pedagógica optimizada para IETABA. ${nowFullStr()}</div>
  </body></html>`);
}

export function printRecoveryPlan(
  data: {
    studentName: string;
    documentId: string;
    subject: string;
    grade: string;
    course: string;
    average: number;
    planText: string;
  },
  teacherName: string
) {
  open(`<!DOCTYPE html><html><head><title>PLAN_NIVELACION_${data.studentName.replace(/\s+/g, "_")}</title>${baseStyles()}
    <style>
      body { padding: 30px !important; }
      @media print {
        body { padding: 15px !important; }
        @page { margin: 0.8cm !important; }
      }
    </style>
  </head><body>
    ${standardHeader("Plan Estratégico de Nivelación Escolar", { grade: data.grade, course: data.course, teacher: teacherName, subject: data.subject })}
    <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 16px; padding: 20px; margin-bottom: 25px;">
      <h3 style="font-size: 13px; font-weight: 900; text-transform: uppercase; color: #1e40af; margin-bottom: 8px;">Ficha Técnica del Estudiante</h3>
      <p style="font-size: 11px; color: #1e3a8a; line-height: 1.6;">
        • <strong>Estudiante:</strong> ${data.studentName.toUpperCase()}<br/>
        • <strong>Documento:</strong> ${data.documentId}<br/>
        • <strong>Promedio Parcial Obtenido:</strong> <span style="color:#ba1a1a; font-weight:900;">${data.average.toFixed(2)} / 5.0</span> (Nivel de Desempeño Bajo)<br/>
        • <strong>Objetivo del Plan:</strong> Superar las dificultades académicas y afianzar las competencias del periodo.
      </p>
    </div>
    <div style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; margin-bottom: 30px;">
      <div style="background: #3b82f6; color: #fff; padding: 12px 20px; font-weight: 900; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">
        Actividades de Refuerzo y Compromisos Académicos
      </div>
      <div style="padding: 24px; line-height: 1.8; font-size: 12px; color: #334155; background: #fff; text-align: justify;">
        ${data.planText.replace(/\n/g, "<br/>")}
      </div>
      <div style="background: #f8fafc; padding: 15px 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #64748b; display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center;">
        <div>_______________________<br/>Firma Estudiante</div>
        <div>_______________________<br/>Firma Docente</div>
        <div>_______________________<br/>Acudiente / Familia</div>
      </div>
    </div>
    <div class="footer">Documento oficial de control pedagógico · ${INSTITUTION_NAME} · Generado por ${APP_NAME} ${APP_EDITION}</div>
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
    <div class="footer">${INSTITUTION_NAME} · ${APP_EDITION} · Generado el ${nowFullStr()} | © ${new Date().getFullYear()} Powered by ${APP_BRAND}</div>
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
      <div>© ${new Date().getFullYear()} Powered by ${APP_BRAND} · ${INSTITUTION_NAME} · ${INSTITUTION_LOCATION}</div>
      <div>Documento Oficial generado por ${APP_NAME} ${APP_EDITION}</div>
      <div>Página 1 de 1</div>
    </div>
  </body></html>`);
}

export function printMissingGradesReport(
  students: any[],
  meta: { grade: string; course: string; teacher: string; subject: string; period: string }
) {
  const activeStudents = students.filter(s => s.isActive !== false);
  const subject = meta.subject;
  const pid = meta.period.toLowerCase();

  // Columns specification (same as page.tsx)
  const columns = [
    ...Array.from({ length: 8 }, (_, i) => ({ id: `SB${i + 1}`, type: "SB", idx: i })),
    ...Array.from({ length: 8 }, (_, i) => ({ id: `SBH${i + 1}`, type: "SBH", idx: i })),
    ...Array.from({ length: 5 }, (_, i) => ({ id: `SR${i + 1}`, type: "SR", idx: i })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `CV${i + 1}`, type: "CV", idx: i })),
    { id: "AUT", type: "AUT", idx: 0 }
  ];

  // Helper to extract value
  const getVal = (st: any, colType: string, index: number) => {
    if (st.detailedGrades?.[subject]?.[pid]) {
      const d = st.detailedGrades[subject][pid];
      if (colType === "SB") return (d.sb && typeof d.sb[index] === 'number') ? d.sb[index].toFixed(1) : "";
      if (colType === "SBH") return (d.sbh && typeof d.sbh[index] === 'number') ? d.sbh[index].toFixed(1) : "";
      if (colType === "SR") return (d.sr && typeof d.sr[index] === 'number') ? d.sr[index].toFixed(1) : "";
      if (colType === "CV") return (d.cv && typeof d.cv[index] === 'number') ? d.cv[index].toFixed(1) : "";
      if (colType === "AUT") return typeof d.aut === 'number' ? d.aut.toFixed(1) : "";
    }
    return "";
  };

  // Determine active columns (columns where at least one student in the filtered group has a grade)
  const activeCols = columns.filter(col => {
    return activeStudents.some(st => getVal(st, col.type, col.idx) !== "");
  });

  // Calculate missing grades for each student
  const missingData = activeStudents.map(st => {
    const missingExams: string[] = [];
    const missingTasks: string[] = [];
    let totalActiveCount = 0;
    let filledActiveCount = 0;

    activeCols.forEach(col => {
      totalActiveCount++;
      const val = getVal(st, col.type, col.idx);
      if (val !== "") {
        filledActiveCount++;
      } else {
        if (col.type === "SB") {
          missingExams.push(col.id);
        } else {
          missingTasks.push(col.id);
        }
      }
    });

    const isTotallyEmpty = totalActiveCount > 0 && filledActiveCount === 0;
    const hasMissingExams = missingExams.length > 0;
    const hasMissingTasks = missingTasks.length > 0;

    let alertType: "COMPLETO" | "SIN_NOTAS" | "EXAMEN_PENDIENTE" | "TAREA_PENDIENTE" = "COMPLETO";
    if (totalActiveCount > 0) {
      if (isTotallyEmpty) alertType = "SIN_NOTAS";
      else if (hasMissingExams) alertType = "EXAMEN_PENDIENTE";
      else if (hasMissingTasks) alertType = "TAREA_PENDIENTE";
    }

    return {
      student: st,
      alertType,
      missingExams,
      missingTasks,
      hasPending: alertType !== "COMPLETO"
    };
  }).filter(item => item.hasPending); // Only include students with pending grades/exams

  // Generate list rows
  const rows = missingData
    .sort((a, b) => a.student.primerApellido.localeCompare(b.student.primerApellido))
    .map((item, i) => {
      const s = item.student;
      let statusLabel = "";
      let statusClass = "";
      let details = "";

      if (item.alertType === "SIN_NOTAS") {
        statusLabel = "Sin Calificaciones";
        statusClass = "badge-red";
        details = "El alumno no registra ninguna calificación en este periodo.";
      } else if (item.alertType === "EXAMEN_PENDIENTE") {
        statusLabel = "Examen Pendiente";
        statusClass = "badge-red";
        details = `Examen faltante: <strong>${item.missingExams.join(', ')}</strong>${item.missingTasks.length > 0 ? `. Actividades faltantes: ${item.missingTasks.join(', ')}` : ''}`;
      } else {
        statusLabel = "Actividades Pendientes";
        statusClass = "badge-blue";
        details = `Actividades/Talleres faltantes: <strong>${item.missingTasks.join(', ')}</strong>`;
      }

      return `
        <tr>
          <td style="width: 40px; text-align: center; color: #94a3b8; font-weight: 800;">${i + 1}</td>
          <td>
            <div style="font-weight: 800; color: #0f172a;">${fullName(s)}</div>
            <div style="font-size: 8px; color: #64748b; text-transform: uppercase;">${s.tipoDocumento} ${s.nroDocumento}</div>
          </td>
          <td><span class="badge ${statusClass}">${statusLabel}</span></td>
          <td style="color: #475569; font-size: 9.5px; line-height: 1.4;">${details}</td>
        </tr>
      `;
    }).join("");

  // Executive summary counts
  const totalStudents = activeStudents.length;
  const pendingCount = missingData.length;
  const sinNotasCount = missingData.filter(m => m.alertType === "SIN_NOTAS").length;
  const examenesPendientesCount = missingData.filter(m => m.alertType === "EXAMEN_PENDIENTE").length;

  open(`<!DOCTYPE html><html><head><title>INFORME_PENDIENTES_${meta.grade}_${meta.course}</title>${baseStyles()}</head><body>
    ${standardHeader("Informe de Calificaciones Faltantes y Pendientes", {
      grade: meta.grade,
      course: meta.course,
      teacher: meta.teacher,
      subject: meta.subject,
      period: meta.period.toUpperCase()
    })}

    <div style="margin-top: 10px;">
      <h2 style="font-size: 14px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin-bottom: 5px;">INFORME DE CALIFICACIONES FALTANTES Y EVALUACIONES PENDIENTES</h2>
      <p style="font-size: 9.5px; color: #475569; line-height: 1.4; margin-bottom: 20px;">
        Este informe detalla los alumnos que presentan novedades de registro académico o evaluaciones pendientes en el periodo actual. Se solicita a la coordinación pedagógica e institucional realizar el seguimiento respectivo.
      </p>
    </div>

    <div class="stats-grid">
      <div class="stat-card accent-blue">
        <div class="stat-label">Total Estudiantes</div>
        <div class="stat-value">${totalStudents}</div>
        <div class="stat-sub">Matriculados en el grupo</div>
      </div>
      <div class="stat-card accent-red">
        <div class="stat-label">Con Pendientes</div>
        <div class="stat-value">${pendingCount}</div>
        <div class="stat-sub">Requieren intervención (${totalStudents > 0 ? ((pendingCount / totalStudents) * 100).toFixed(0) : 0}%)</div>
      </div>
      <div class="stat-card accent-red" style="background: #fffbeb; border-color: #fde68a;">
        <div class="stat-label">Sin Notas</div>
        <div class="stat-value">${sinNotasCount}</div>
        <div class="stat-sub">Inasistencia o sin registrar</div>
      </div>
      <div class="stat-card accent-blue" style="background: #faf5ff; border-color: #e9d5ff;">
        <div class="stat-label">Exámenes Faltantes</div>
        <div class="stat-value">${examenesPendientesCount}</div>
        <div class="stat-sub">Evaluaciones escritas sin nota</div>
      </div>
    </div>

    <table class="report-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Estudiante / Documento</th>
          <th>Estado Alerta</th>
          <th>Detalle de Notas Pendientes (Columnas Activas)</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="4" style="text-align: center; color: #166534; font-weight: 800; padding: 30px; background: #f0fdf4;">¡Excelente! Todos los alumnos tienen sus notas al día en este periodo y asignatura.</td></tr>`}
      </tbody>
    </table>

    <div class="sign" style="margin-top: 60px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center;">
      <div class="sign-line" style="border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 9px; color: #475569;">
        <strong>${meta.teacher.toUpperCase()}</strong><br/>Docente de Área
      </div>
      <div class="sign-line" style="border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 9px; color: #475569;">
        <strong>COORDINACIÓN PEDAGÓGICA</strong><br/>IETABA Awá
      </div>
      <div class="sign-line" style="border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 9px; color: #475569;">
        <strong>PADRE DE FAMILIA / ACUDIENTE</strong><br/>Firma de Enterado
      </div>
    </div>

    <div class="footer" style="margin-top: 80px; padding-top: 15px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; color: #94a3b8; font-size: 8px;">
      <div>${INSTITUTION_NAME} · ${INSTITUTION_LOCATION}</div>
      <div>Documento de Control Pedagógico Oficial · Generado por ${APP_NAME} ${APP_EDITION}</div>
    </div>
  </body></html>`);
}





export function printCopilotLessonPlan(
  plan: any,
  meta: { topic: string; grade: string; subject: string; teacher: string }
) {
  const content = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');
      
      @media print { 
        * { 
          -webkit-print-color-adjust: exact !important; 
          print-color-adjust: exact !important; 
        }
        body { margin: 0; padding: 0; }
        .page-break { page-break-inside: avoid; }
      }
      
      body {
        font-family: 'Inter', sans-serif;
        color: #27272a;
        background: white;
        margin: 0;
        padding: 50px 60px;
        line-height: 1.7;
      }

      .header-meta {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.2em;
        color: #71717a;
        margin-bottom: 24px;
        border-bottom: 1px solid #f4f4f5;
        padding-bottom: 16px;
        display: flex;
        justify-content: space-between;
      }

      .document-title {
        font-family: 'Playfair Display', serif;
        font-size: 32px;
        font-weight: 700;
        color: #18181b;
        margin: 0 0 12px 0;
        line-height: 1.2;
      }

      .topic-name {
        font-size: 18px;
        font-weight: 400;
        color: #3f3f46;
        margin: 0 0 48px 0;
        max-width: 90%;
        position: relative;
        padding-bottom: 16px;
      }

      /* Subtle pastel underline for the main topic */
      .topic-name::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 60px;
        height: 3px;
        background: #c7d2fe; /* Soft pastel indigo */
        border-radius: 2px;
      }

      .grid-meta {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 32px;
        margin-bottom: 48px;
        padding-left: 20px;
        border-left: 2px solid #e0e7ff; /* Soft pastel line */
      }

      .meta-block p {
        margin: 0;
      }

      .meta-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #71717a;
        margin-bottom: 4px;
      }

      .meta-value {
        font-size: 14px;
        font-weight: 500;
        color: #18181b;
      }

      .section {
        margin-bottom: 48px;
      }

      .section-title {
        font-family: 'Playfair Display', serif;
        font-size: 20px;
        font-weight: 600;
        color: #18181b;
        margin: 0 0 20px 0;
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .section-title::after {
        content: "";
        flex: 1;
        height: 1px;
        background: #f4f4f5;
      }

      .text-content {
        font-size: 14px;
        font-weight: 400;
        color: #3f3f46;
        line-height: 1.8;
      }

      .phase-block {
        margin-bottom: 24px;
        padding-left: 16px;
      }

      .phase-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #27272a;
        margin: 0 0 8px 0;
        display: flex;
        align-items: center;
      }

      /* Subtle pastel lines for each phase */
      .phase-inicio { border-left: 3px solid #fde68a; } /* Pastel Amber */
      .phase-desarrollo { border-left: 3px solid #bfdbfe; } /* Pastel Blue */
      .phase-practica { border-left: 3px solid #bbf7d0; } /* Pastel Green */
      .phase-cierre { border-left: 3px solid #e9d5ff; } /* Pastel Purple */

      ul.materials-list {
        list-style-type: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      ul.materials-list li {
        font-size: 12px;
        color: #52525b;
        padding: 6px 16px;
        background: #ffffff;
        border: 1px solid #e4e4e7;
        border-radius: 4px;
        box-shadow: 2px 2px 0px #f4f4f5; /* Subtle drop shadow */
      }

      .footer {
        margin-top: 80px;
        padding-top: 24px;
        border-top: 1px solid #f4f4f5;
        display: flex;
        justify-content: space-between;
        font-size: 10px;
        color: #a1a1aa;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
    </style>
    
    <div style="max-width: 800px; margin: 0 auto;">
      
      <div class="header-meta">
        <span>Diseño de Secuencia Didáctica</span>
        <span>${new Date().toLocaleDateString('es-CO')}</span>
      </div>

      <h1 class="document-title">Planeación Pedagógica</h1>
      <h2 class="topic-name">${meta.topic}</h2>

      <div class="grid-meta">
        <div class="meta-block">
          <div class="meta-label">Institución Educativa</div>
          <div class="meta-value">${INSTITUTION_FULL_NAME_UPPER}</div>
        </div>
        <div class="meta-block">
          <div class="meta-label">Docente Responsable</div>
          <div class="meta-value">${meta.teacher.toUpperCase()}</div>
        </div>
        <div class="meta-block">
          <div class="meta-label">Área / Asignatura</div>
          <div class="meta-value">${meta.subject.toUpperCase()}</div>
        </div>
        <div class="meta-block">
          <div class="meta-label">Grado Académico</div>
          <div class="meta-value">${meta.grade}</div>
        </div>
      </div>

      <div class="section page-break">
        <h3 class="section-title">Objetivo de Aprendizaje</h3>
        <div class="text-content">${plan.objective}</div>
      </div>

      <div class="section page-break">
        <h3 class="section-title">Desarrollo de la Clase</h3>
        
        <div class="phase-block phase-inicio">
          <div class="phase-label">I. Inicio / Exploración</div>
          <div class="text-content">${plan.warmup}</div>
        </div>
        
        <div class="phase-block phase-desarrollo">
          <div class="phase-label">II. Estructuración Cognitiva</div>
          <div class="text-content">${plan.development}</div>
        </div>
        
        <div class="phase-block phase-practica">
          <div class="phase-label">III. Transferencia y Práctica</div>
          <div class="text-content">${plan.activity}</div>
        </div>
        
        <div class="phase-block phase-cierre">
          <div class="phase-label">IV. Cierre y Evaluación</div>
          <div class="text-content">${plan.assessment}</div>
        </div>
      </div>

      <div class="section page-break" style="border-left: 3px solid #e2e8f0; padding-left: 16px;">
        <h3 class="section-title" style="margin-bottom: 8px;">Trabajo Autónomo</h3>
        <div class="text-content">${plan.homework}</div>
      </div>

      <div class="section page-break" style="margin-top: 40px;">
        <h3 class="section-title">Materiales Requeridos</h3>
        <ul class="materials-list">
          ${plan.materials.map((m: string) => `<li>${m}</li>`).join('')}
        </ul>
      </div>

      <div class="footer">
        <span>SinapCode IA • EduManager v2.8</span>
        <span>Documento Confidencial</span>
      </div>

    </div>
  `;

  open(content);
}




import { calculatePeriodGrades } from "./gradeUtils";

export function printExecutiveReport(
  students: any[],
  teacherProfile: any,
  masterData: any
) {
  if (!students || students.length === 0) {
    if (typeof window !== "undefined") alert("Aviso: No hay registros de estudiantes disponibles para generar el informe.");
    return;
  }
  const activePeriod = (masterData.activePeriod || "p2").toLowerCase();
  const pName = activePeriod.toUpperCase();
  const dateStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  // 1. DATA CRUNCHING MULTIDIMENSIONAL & PERIOD-AWARE PROJECTION
  let totalGrades = 0;
  let passedCount = 0;
  let failedCount = 0;
  let recoveredCount = 0;
  let totalScoreSum = 0;

  // Sabidurías Awá (Global)
  const sabidurias = {
    sb: { name: "Saber (Conocimiento)", weight: "30%", sum: 0, count: 0, color: "#2563eb" },
    sbh: { name: "Saber-Hacer (Prácticas y Territorio)", weight: "40%", sum: 0, count: 0, color: "#059669" },
    sr: { name: "Ser (Identidad Awá y Valores)", weight: "20%", sum: 0, count: 0, color: "#7c3aed" },
    cv: { name: "Convivencia Comunitaria", weight: "5%", sum: 0, count: 0, color: "#d97706" },
    aut: { name: "Autoevaluación Consciente", weight: "5%", sum: 0, count: 0, color: "#db2777" }
  };

  // Matriz Desagregada por Grado-Curso y Asignatura
  const courseSubjectAnalytics: Record<string, {
    key: string;
    grado: string;
    curso: string;
    subject: string;
    totalEvaluated: number;
    passed: number;
    failed: number;
    recovery: number;
    scoreSum: number;
    totalAttendanceEvents: number;
    totalAbsences: number;
  }> = {};

  // Listado de Estudiantes en Alerta y Proyecciones
  const projectionAlerts: {
    st: any;
    grado: string;
    curso: string;
    subject: string;
    p1: number | null;
    p2: number | null;
    p3: number | null;
    accumulated: number;
    neededInP3: number;
    status: "safe" | "normal" | "warning" | "critical" | "passed_final" | "failed_final";
    statusLabel: string;
  }[] = [];

  const groups: Record<string, Record<string, any[]>> = {};

  const getAvg = (vals: (number | null)[] | null | undefined): number | null => {
    if (!vals) return null;
    const valid = (vals as (number | null)[]).filter((v): v is number => v !== null && v !== undefined);
    return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
  };

  students.forEach(st => {
    if (st.isActive === false) return;
    const g = normalizeGrade(st.grado || "SIN GRADO");
    const c = (st.curso || "1").toString().trim();
    const gCourse = `${g}-${c}`;

    let studentAbsences = 0;
    let studentTotalDays = 0;
    if (st.attendanceRecord) {
      const records = Object.values(st.attendanceRecord);
      studentTotalDays = records.length;
      studentAbsences = records.filter(v => v === 'absent').length;
    }

    if (st.detailedGrades) {
      Object.keys(st.detailedGrades).forEach(subject => {
        const subjectData = st.detailedGrades[subject];
        const d = subjectData ? subjectData[activePeriod] : null;

        if (d) {
          const matrixKey = `${gCourse}__${subject}`;

          if (!courseSubjectAnalytics[matrixKey]) {
            courseSubjectAnalytics[matrixKey] = {
              key: matrixKey,
              grado: g,
              curso: c,
              subject: subject,
              totalEvaluated: 0,
              passed: 0,
              failed: 0,
              recovery: 0,
              scoreSum: 0,
              totalAttendanceEvents: 0,
              totalAbsences: 0
            };
          }

          if (!groups[gCourse]) groups[gCourse] = {};
          if (!groups[gCourse][subject]) groups[gCourse][subject] = [];

          const grades = calculatePeriodGrades(d);
          const hasGrades = [d.sb, d.sbh, d.sr, d.cv, d.aut].some(arr => 
            Array.isArray(arr) ? arr.some(x => x !== null) : arr !== null
          );

          if (hasGrades) {
            groups[gCourse][subject].push({ st, grades });
            totalGrades++;
            totalScoreSum += grades.definitiva;

            const item = courseSubjectAnalytics[matrixKey];
            item.totalEvaluated++;
            item.scoreSum += grades.definitiva;
            item.totalAttendanceEvents += (studentTotalDays || 1);
            item.totalAbsences += studentAbsences;

            // Sabidurías
            const sbA = getAvg(d.sb);
            if (sbA !== null) { sabidurias.sb.sum += sbA; sabidurias.sb.count++; }
            const sbhA = getAvg(d.sbh);
            if (sbhA !== null) { sabidurias.sbh.sum += sbhA; sabidurias.sbh.count++; }
            const srA = getAvg(d.sr);
            if (srA !== null) { sabidurias.sr.sum += srA; sabidurias.sr.count++; }
            const cvA = getAvg(d.cv);
            if (cvA !== null) { sabidurias.cv.sum += cvA; sabidurias.cv.count++; }
            if (d.aut !== null && d.aut !== undefined) { sabidurias.aut.sum += d.aut; sabidurias.aut.count++; }

            const pRound = Number(grades.definitiva.toFixed(1));
            if (pRound >= 3.0) {
              passedCount++;
              item.passed++;
            } else {
              failedCount++;
              item.failed++;
            }

            if (grades.rec !== null) {
              recoveredCount++;
              item.recovery++;
            }

            // ── CÁLCULO DE PROYECCIÓN ANUAL DINÁMICA (SOLO P2 Y P3) ──
            if (activePeriod === "p2" || activePeriod === "p3") {
              const p1Data = subjectData?.p1 ? calculatePeriodGrades(subjectData.p1).definitiva : null;
              const p2Data = subjectData?.p2 ? calculatePeriodGrades(subjectData.p2).definitiva : null;
              const p3Data = subjectData?.p3 ? calculatePeriodGrades(subjectData.p3).definitiva : null;

              if (activePeriod === "p2" && p1Data !== null && p2Data !== null) {
                const sumP1P2 = p1Data + p2Data;
                const pointsNeededInP3 = Number((9.0 - sumP1P2).toFixed(2));
                const neededInP3 = pointsNeededInP3 <= 1.0 ? 1.0 : pointsNeededInP3;

                let status: "safe" | "normal" | "warning" | "critical" = "normal";
                let statusLabel = "";

                if (sumP1P2 >= 8.0) {
                  status = "safe";
                  statusLabel = "Meta Anual Alcanzada";
                } else if (neededInP3 <= 3.5) {
                  status = "normal";
                  statusLabel = `Meta P3: ${neededInP3.toFixed(1)}`;
                } else if (neededInP3 <= 5.0) {
                  status = "warning";
                  statusLabel = `Acompañamiento Prioritario (P3: ${neededInP3.toFixed(1)})`;
                } else {
                  status = "critical";
                  statusLabel = `Plan de Rescate Obligatorio (P3: ${neededInP3.toFixed(1)})`;
                }

                if (status === "warning" || status === "critical") {
                  projectionAlerts.push({
                    st, grado: g, curso: c, subject,
                    p1: p1Data, p2: p2Data, p3: null,
                    accumulated: Number((sumP1P2 / 2).toFixed(2)),
                    neededInP3, status, statusLabel
                  });
                }
              } else if (activePeriod === "p3" && p1Data !== null && p2Data !== null && p3Data !== null) {
                const finalYearAvg = Number(((p1Data + p2Data + p3Data) / 3).toFixed(2));
                const isPassed = finalYearAvg >= 3.0;
                projectionAlerts.push({
                  st, grado: g, curso: c, subject,
                  p1: p1Data, p2: p2Data, p3: p3Data,
                  accumulated: finalYearAvg,
                  neededInP3: 0,
                  status: isPassed ? "passed_final" : "failed_final",
                  statusLabel: isPassed ? "Promovido Satisfactoriamente" : "Requiere Plan de Nivelación Final"
                });
              }
            }
          }
        }
      });
    }
  });

  const passRate = totalGrades > 0 ? Math.round((passedCount / totalGrades) * 100) : 0;
  const failRate = totalGrades > 0 ? Math.round((failedCount / totalGrades) * 100) : 0;
  const globalAvg = totalGrades > 0 ? (totalScoreSum / totalGrades).toFixed(2) : "0.00";

  const sanitizeFilename = (str: string) => (str || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9_-]/g, "_").replace(/_+/g, "_");
  const teacherClean = sanitizeFilename(teacherProfile?.name || "DOCENTE");
  const normalizedFileName = `IETABA_INFORME_EJECUTIVO_${pName}_${teacherClean}_${new Date().getFullYear()}`;

  const getAusentismoBadge = (absences: number, totalEvents: number) => {
    if (totalEvents === 0 || absences === 0) {
      return { label: "Asistencia Ejemplar", bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" };
    }
    const rate = Math.round((absences / totalEvents) * 100);
    if (rate <= 5) {
      return { label: `Bajo (${rate}%)`, bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" };
    } else if (rate <= 15) {
      return { label: `Moderado (${rate}%)`, bg: "#fefce8", color: "#854d0e", border: "#fef08a" };
    } else {
      return { label: `Atención Requerida (${rate}%)`, bg: "#fef2f2", color: "#991b1b", border: "#fecaca" };
    }
  };

  let reportHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${normalizedFileName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; padding: 0 !important; background: #fff !important; }
          .page-break-before { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
          .no-print { display: none !important; }
          .print-container { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; }
          @page {
          margin: 0;
          size: A4 portrait;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .print-container {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 14mm 16mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .page-break-before { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
          .no-print { display: none !important; }
        }
        @media screen and (max-width: 640px) {
          body { padding: 8px !important; }
          .print-container { padding: 20px 14px !important; border-radius: 14px !important; }
          .bento-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .sabiduria-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 6px !important; }
          .bi-kpi-grid { grid-template-columns: 1fr !important; }
          .action-bar-top { flex-direction: column; gap: 10px; text-align: center; }
        }
        }

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1e293b;
          line-height: 1.5;
          margin: 0;
          padding: 20px;
          background: #f1f5f9;
        }

        /* Barra flotante de acciones rápidas para imprimir */
        .action-bar-top {
          position: sticky;
          top: 10px;
          z-index: 9999;
          max-width: 900px;
          margin: 0 auto 20px auto;
          background: #0f172a;
          color: white;
          padding: 12px 24px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 10px 25px rgba(15,23,42,0.3);
        }
        .btn-print {
          background: #2563eb;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: transform 0.2s, background 0.2s;
        }
        .btn-print:hover { background: #1d4ed8; transform: scale(1.02); }

        .print-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          padding: 40px 50px;
          border-radius: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }

        .print-container.borderless {
          border-radius: 0;
          box-shadow: none;
          padding-top: 15px;
        }

        .header-institucional { text-align: center; margin-bottom: 25px; position: relative; border-bottom: 2px solid #e2e8f0; padding-bottom: 18px; }
        .header-institucional h1 { font-weight: 900; font-size: 13.5px; margin: 0; color: #0f172a; letter-spacing: -0.01em; }
        .header-institucional h2 { font-weight: 700; font-size: 11px; margin: 4px 0; color: #1e3a8a; }
        .header-institucional p { font-size: 9.5px; margin: 1px 0; color: #64748b; }
        
        .report-badge {
          display: inline-block;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 4px 12px;
          border-radius: 20px;
          margin-top: 8px;
        }

        .fecha-dir { margin-top: 20px; font-size: 10.5px; color: #334155; }
        .saludo { margin-top: 14px; font-size: 11.5px; text-align: justify; color: #334155; line-height: 1.6; }

        .bento-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
        .bento-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; text-align: center; }
        .bento-card.highlight { background: linear-gradient(145deg, #f0fdf4, #dcfce7); border-color: #86efac; }
        .bento-card.highlight-blue { background: linear-gradient(145deg, #f0f9ff, #e0f2fe); border-color: #7dd3fc; }
        .bento-val { font-size: 28px; font-weight: 900; color: #0f172a; line-height: 1.1; margin-bottom: 4px; }
        .bento-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }

        .sabiduria-section {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 18px 22px;
          margin: 20px 0;
        }
        .section-title {
          font-size: 11.5px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-title::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 14px;
          background: #2563eb;
          border-radius: 2px;
        }

        .sabiduria-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin-top: 12px;
        }
        .sab-item {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          padding: 10px 8px;
          text-align: center;
        }
        .sab-val { font-size: 17px; font-weight: 900; color: #0f172a; }
        .sab-name { font-size: 8px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-top: 2px; line-height: 1.2; }
        .sab-weight { font-size: 7.5px; font-weight: 800; color: #94a3b8; margin-top: 3px; display: inline-block; background: #fff; padding: 1px 4px; border-radius: 4px; border: 1px solid #e2e8f0; }

        .matrix-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 9.5px;
          margin: 12px 0 25px 0;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .matrix-table th {
          background: #f1f5f9;
          font-weight: 800;
          color: #334155;
          text-transform: uppercase;
          font-size: 8px;
          letter-spacing: 0.05em;
          padding: 9px 8px;
          border-bottom: 2px solid #cbd5e1;
        }
        .matrix-table td {
          padding: 8px;
          text-align: center;
          border-bottom: 1px solid #f1f5f9;
          font-weight: 600;
        }
        .matrix-table tr:last-child td { border-bottom: none; }
        
        .grade-badge {
          background: #1e293b;
          color: white;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 5px;
          font-size: 9px;
        }
        .subject-badge {
          background: #eff6ff;
          color: #1e40af;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 5px;
          font-size: 8.5px;
          border: 1px solid #bfdbfe;
        }

        .micro-bar {
          width: 100%;
          height: 7px;
          background: #fee2e2;
          border-radius: 4px;
          overflow: hidden;
          display: flex;
        }
        .micro-fill { height: 100%; background: #22c55e; }

        .aus-badge {
          display: inline-block;
          padding: 2px 7px;
          border-radius: 5px;
          font-size: 8.5px;
          font-weight: 800;
        }

        .detail-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 10px;
          margin-bottom: 22px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .detail-table th {
          background: #f8fafc;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          font-size: 8.5px;
          letter-spacing: 0.05em;
          padding: 8px 10px;
          border-bottom: 2px solid #e2e8f0;
        }
        .detail-table td {
          padding: 7px 10px;
          text-align: center;
          border-bottom: 1px solid #f1f5f9;
        }
        .detail-table td.text-left { text-align: left; font-weight: 600; color: #1e293b; }

        .badge { display: inline-flex; align-items: center; padding: 3px 8px; border-radius: 6px; font-size: 8.5px; font-weight: 700; }
        .bg-green { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .bg-red { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .bg-yellow { background: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }

        .firma { margin-top: 50px; text-align: center; width: 280px; margin-left: auto; margin-right: auto; }
        .firma-line { border-bottom: 1px solid #94a3b8; margin-bottom: 6px; }
      </style>
    </head>
    <body>
      <div class="action-bar-top no-print">
        <div style="font-weight: 800; font-size: 12px; letter-spacing: 0.05em;">
          📄 Vista Previa de Impresión · IETABA Suite
        </div>
        <button onclick="window.print()" class="btn-print">
          🖨️ Imprimir / Guardar en PDF
        </button>
      </div>

      <div class="print-container">
        <!-- HEADER INSTITUCIONAL -->
        <div class="header-institucional">
          <img src="${baseUrl}/logo.png" style="width: 76px; height: auto; position: absolute; left: 0; top: 2px; image-rendering: -webkit-optimize-contrast; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));" onerror="this.style.display='none'">
          <div style="padding: 0 40px 0 85px;">
            <h1>UNIDAD INDIGENA DEL PUEBLO AWA "UNIPA"</h1>
          <h2>INSTITUCION EDUCATIVA INDIGENA TECNICA AGROAMBIENTAL BILINGÜE AWA "IETABA"</h2>
          <p>Licencia de Funcionamiento No. 398 del 28 de abril del 2004 · DANE 25207900204501 · NIT. 900000095-4</p>
          <p><i>Ambiente – Cultura – Ciencia</i></p>
          <div class="report-badge">${activePeriod === "p1" ? "INFORME GERENCIAL · DIAGNÓSTICO PEDAGÓGICO INICIAL (PERIODO 1)" :
              activePeriod === "p2" ? "INFORME GERENCIAL & ALERTA TEMPRANA DE PROYECCIÓN ANUAL (SIEEE)" :
              "INFORME GERENCIAL · BALANCE FINAL Y PROMOCIÓN DE AÑO LECTIVO"}</div>
          </div>
        </div>

        <div class="fecha-dir">
          <p><strong>Predio el Verde IETABA</strong>, ${dateStr}</p>
          <p>Para: <strong>RECTORÍA, COORDINACIÓN ACADÉMICA Y DIRECTORES DE GRADO</strong></p>
          <p>Docente Responsable: <strong>${escapeHtml(teacherProfile?.name || "DOCENTE")}</strong></p>
        </div>

        <div class="saludo">
          <p>Apreciada comunidad directiva y pedagógica,</p>
          <p>
            ${activePeriod === "p1" ? 
              "Comparto con ustedes el <strong>Diagnóstico Académico Inicial del Periodo 1</strong>. En este primer paso del año escolar, reconocemos los talentos y áreas de oportunidad de nuestros estudiantes, valorando sus saberes teóricos, vivenciales y comunitarios bajo el modelo propio Awá para trazar juntos las mejores rutas de aprendizaje." :
              activePeriod === "p2" ?
              "Presento el <strong>Consolidado de Acompañamiento y Alerta Temprana del Periodo 2</strong>. Habiendo recorrido dos etapas del año, nuestro propósito es tender puentes a tiempo: identificar con precisión y cariño pedagógico a los jóvenes que requieren apoyo adicional para que alcancen sus metas antes del cierre lectivo." :
              "Presento el <strong>Balance de Cierre del Año Lectivo</strong>. Celebramos el esfuerzo, la perseverancia y el crecimiento de cada estudiante a lo largo de los tres periodos, reconociendo a quienes lograron su promoción y disponiendo los planes de nivelación necesarios para quienes aún están en camino."}
          </p>
        </div>

        <!-- BENTO DASHBOARD GLOBAL -->
        <div class="bento-grid">
          <div class="bento-card highlight-blue">
            <div class="bento-val">${totalGrades}</div>
            <div class="bento-label">Registros Evaluados</div>
          </div>
          <div class="bento-card highlight">
            <div class="bento-val" style="color: #16a34a;">${passRate}%</div>
            <div class="bento-label">Aprobación Periodo</div>
          </div>
          <div class="bento-card" style="border-color: #fecaca; background: #fff5f5;">
            <div class="bento-val" style="color: #dc2626;">${failRate}%</div>
            <div class="bento-label">En Nivelación / Apoyo</div>
          </div>
          <div class="bento-card">
            <div class="bento-val" style="color: #2563eb;">${globalAvg}</div>
            <div class="bento-label">Promedio General</div>
          </div>
        </div>

        <!-- RENDIMIENTO POR SABIDURÍAS INSTITUCIONALES AWÁ -->
        <div class="sabiduria-section avoid-break">
          <div class="section-title">Valoración de Sabidurías (Dimensiones del Ser y Aprender Awá)</div>
          <div class="sabiduria-grid">
            <div class="sab-item">
              <div class="sab-val" style="color: ${sabidurias.sb.color}">${sabidurias.sb.count > 0 ? (sabidurias.sb.sum / sabidurias.sb.count).toFixed(2) : "—"}</div>
              <div class="sab-name">${sabidurias.sb.name}</div>
              <span class="sab-weight">${sabidurias.sb.weight}</span>
            </div>
            <div class="sab-item">
              <div class="sab-val" style="color: ${sabidurias.sbh.color}">${sabidurias.sbh.count > 0 ? (sabidurias.sbh.sum / sabidurias.sbh.count).toFixed(2) : "—"}</div>
              <div class="sab-name">${sabidurias.sbh.name}</div>
              <span class="sab-weight">${sabidurias.sbh.weight}</span>
            </div>
            <div class="sab-item">
              <div class="sab-val" style="color: ${sabidurias.sr.color}">${sabidurias.sr.count > 0 ? (sabidurias.sr.sum / sabidurias.sr.count).toFixed(2) : "—"}</div>
              <div class="sab-name">${sabidurias.sr.name}</div>
              <span class="sab-weight">${sabidurias.sr.weight}</span>
            </div>
            <div class="sab-item">
              <div class="sab-val" style="color: ${sabidurias.cv.color}">${sabidurias.cv.count > 0 ? (sabidurias.cv.sum / sabidurias.cv.count).toFixed(2) : "—"}</div>
              <div class="sab-name">${sabidurias.cv.name}</div>
              <span class="sab-weight">${sabidurias.cv.weight}</span>
            </div>
            <div class="sab-item">
              <div class="sab-val" style="color: ${sabidurias.aut.color}">${sabidurias.aut.count > 0 ? (sabidurias.aut.sum / sabidurias.aut.count).toFixed(2) : "—"}</div>
              <div class="sab-name">${sabidurias.aut.name}</div>
              <span class="sab-weight">${sabidurias.aut.weight}</span>
            </div>
          </div>
        </div>

        <!-- MATRIZ COMPARATIVA DESAGREGADA POR GRADO Y MATERIA -->
        <div class="avoid-break" style="margin-top: 20px;">
          <div class="section-title" style="margin-bottom: 6px;">Compendio Detallado por Asignatura y Curso</div>
          <table class="matrix-table">
            <thead>
              <tr>
                <th style="width: 14%; text-align: left; padding-left: 10px;">Grado / Curso</th>
                <th style="width: 22%; text-align: left;">Materia / Asignatura</th>
                <th style="width: 9%;">Evaluados</th>
                <th style="width: 9%;">Aprobados</th>
                <th style="width: 9%;">En Apoyo</th>
                <th style="width: 13%;">% Aprobación</th>
                <th style="width: 10%;">Promedio</th>
                <th style="width: 14%;">Asistencia</th>
              </tr>
            </thead>
            <tbody>
              ${Object.keys(courseSubjectAnalytics).sort().map(key => {
                const data = courseSubjectAnalytics[key];
                if (data.totalEvaluated === 0) return '';
                const pRate = Math.round((data.passed / data.totalEvaluated) * 100);
                const gAvg = (data.scoreSum / data.totalEvaluated).toFixed(2);
                const ausBadge = getAusentismoBadge(data.totalAbsences, data.totalAttendanceEvents);
                
                return `
                  <tr>
                    <td style="text-align: left; padding-left: 10px;">
                      <span class="grade-badge">${data.grado}-${data.curso}</span>
                    </td>
                    <td style="text-align: left;">
                      <span class="subject-badge">${data.subject}</span>
                    </td>
                    <td>${data.totalEvaluated}</td>
                    <td><strong style="color: #16a34a;">${data.passed}</strong></td>
                    <td><strong style="color: #dc2626;">${data.failed}</strong></td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 5px;">
                        <div class="micro-bar">
                          <div class="micro-fill" style="width: ${pRate}%;"></div>
                        </div>
                        <span style="font-size: 8px; font-weight: 800;">${pRate}%</span>
                      </div>
                    </td>
                    <td><strong style="color: #0f172a; font-size: 10.5px;">${gAvg}</strong></td>
                    <td>
                      <span class="aus-badge" style="background: ${ausBadge.bg}; color: ${ausBadge.color}; border: 1px solid ${ausBadge.border};">
                        ${ausBadge.label}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        ${activePeriod === "p2" ? `
        <!-- MÓDULO EXCLUSIVO P2: ALERTA TEMPRANA & PROYECCIÓN ANUAL (SIEEE) -->
        <div class="avoid-break" style="margin-top: 25px; background: #fff; border: 2px solid #fde047; border-radius: 18px; padding: 18px 22px;">
          <div class="section-title" style="color: #854d0e;">
            🌱 Plan de Acompañamiento Temprano & Proyección de Cierre de Año
          </div>
          <p style="font-size: 10px; color: #64748b; margin: 4px 0 12px 0;">
            Estudiantes priorizados para refuerzo pedagógico oportuno. Con un esfuerzo conjunto entre docente, familia y estudiante, aseguraremos su éxito al culminar el tercer periodo.
          </p>

          ${projectionAlerts.length > 0 ? `
          <table class="detail-table" style="margin-bottom: 0;">
            <thead>
              <tr>
                <th style="width: 32%; text-align: left;">Estudiante</th>
                <th style="width: 14%;">Curso / Materia</th>
                <th style="width: 10%;">Nota P1</th>
                <th style="width: 10%;">Nota P2</th>
                <th style="width: 12%;">Acumulado</th>
                <th style="width: 22%;">Meta para Periodo 3</th>
              </tr>
            </thead>
            <tbody>
              ${projectionAlerts.map(item => `
                <tr>
                  <td class="text-left">
                    <strong>${escapeHtml(item.st.primerApellido)} ${escapeHtml(item.st.segundoApellido || "")} ${escapeHtml(item.st.primerNombre)}</strong>
                  </td>
                  <td>${item.grado}-${item.curso} · ${item.subject}</td>
                  <td>${item.p1?.toFixed(1) || '—'}</td>
                  <td>${item.p2?.toFixed(1) || '—'}</td>
                  <td><strong>${item.accumulated.toFixed(1)}</strong></td>
                  <td>
                    <span class="badge ${item.status === 'critical' ? 'bg-red' : 'bg-yellow'}">
                      ${item.statusLabel}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : `
          <div style="text-align: center; padding: 15px; color: #166534; background: #f0fdf4; border-radius: 10px; font-weight: 700; font-size: 10.5px;">
            🌟 ¡Excelente trabajo en comunidad! Todos los estudiantes se encuentran en proyección favorable para superar sus metas de año.
          </div>
          `}
        </div>
        ` : activePeriod === "p3" ? `
        <!-- MÓDULO EXCLUSIVO P3: BALANCE DEFINITIVO DE PROMOCIÓN ANUAL -->
        <div class="avoid-break" style="margin-top: 25px; background: #fff; border: 2px solid #93c5fd; border-radius: 18px; padding: 18px 22px;">
          <div class="section-title" style="color: #1e40af;">
            🎓 Consolidado Definitivo de Promoción y Habilitaciones (Año Lectivo)
          </div>
          <table class="detail-table" style="margin-top: 10px; margin-bottom: 0;">
            <thead>
              <tr>
                <th style="width: 35%; text-align: left;">Estudiante</th>
                <th style="width: 15%;">Curso / Materia</th>
                <th style="width: 8%;">P1</th>
                <th style="width: 8%;">P2</th>
                <th style="width: 8%;">P3</th>
                <th style="width: 12%;">Definitiva Año</th>
                <th style="width: 14%;">Estatus Final</th>
              </tr>
            </thead>
            <tbody>
              ${projectionAlerts.map(item => `
                <tr>
                  <td class="text-left">
                    <strong>${escapeHtml(item.st.primerApellido)} ${escapeHtml(item.st.segundoApellido || "")} ${escapeHtml(item.st.primerNombre)}</strong>
                  </td>
                  <td>${item.grado}-${item.curso} · ${item.subject}</td>
                  <td>${item.p1?.toFixed(1) || '—'}</td>
                  <td>${item.p2?.toFixed(1) || '—'}</td>
                  <td>${item.p3?.toFixed(1) || '—'}</td>
                  <td><strong style="color: ${item.accumulated >= 3.0 ? '#16a34a' : '#dc2626'}; font-size: 11px;">${item.accumulated.toFixed(1)}</strong></td>
                  <td>
                    <span class="badge ${item.status === 'passed_final' ? 'bg-green' : 'bg-red'}">
                      ${item.statusLabel}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="saludo avoid-break" style="background: #f8fafc; padding: 14px 18px; border-radius: 14px; border: 1px solid #e2e8f0; margin-top: 15px;">
          <p style="margin: 0; color: #0f172a; font-size: 10.5px;"><strong>Reflexión y Compromisos para el Aprendizaje:</strong></p>
          <ul style="margin: 6px 0 0 0; font-size: 9.5px; color: #475569; padding-left: 18px; line-height: 1.6;">
            <li>Cada calificación es una oportunidad viva para reconocer el esfuerzo individual y guiar a cada estudiante con paciencia y constancia.</li>
            <li>En los casos donde se requiere mayor acompañamiento, convocaremos a los padres y acudientes en minga de diálogo pedagógico.</li>
            <li>Continuaremos entrelazando el saber teórico con la práctica agroambiental y el fortalecimiento de la identidad de nuestro pueblo Awá.</li>
          </ul>
        </div>
      </div>

      <!-- PÁGINAS DE DETALLE POR ASIGNATURA Y CURSO (TABLAS DE NIVELACIÓN) -->
      <div class="print-container borderless">
  `;

  Object.keys(groups).sort().forEach(grado => {
    Object.keys(groups[grado]).sort().forEach(subject => {
      const allSubjectStudents = groups[grado][subject];
      
      const targetStudents = allSubjectStudents.filter(item => {
        const pRound = Number(item.grades.parcial.toFixed(1));
        return item.grades.rec !== null || pRound < 3.0;
      });
      
      if (targetStudents.length > 0) {
        reportHtml += `
        <div class="avoid-break" style="margin-top: 18px;">
          <h3 class="section-title" style="font-size: 10.5px; margin-bottom: 6px;">CURSO: ${grado} — ASIGNATURA: ${subject}</h3>
          <table class="detail-table">
            <thead>
              <tr>
                <th style="width: 5%;">No.</th>
                <th style="width: 40%; text-align: left;">NOMBRES Y APELLIDOS</th>
                <th style="width: 15%;">DEFINITIVA</th>
                <th style="width: 15%;">NIVELACIÓN</th>
                <th style="width: 25%;">ESTADO PEDAGÓGICO</th>
              </tr>
            </thead>
            <tbody>
        `;

        targetStudents.sort((a,b) => a.st.primerApellido.localeCompare(b.st.primerApellido)).forEach((item, index) => {
          const g = item.grades;
          let obs = "";
          let badgeClass = "";
          
          if (g.rec !== null) {
            if (Number(g.rec.toFixed(1)) >= 3.0) {
              obs = "Superó los objetivos";
              badgeClass = "bg-green";
            } else {
              obs = "Asistió en proceso de nivelación";
              badgeClass = "bg-yellow";
            }
          } else {
            if (Number(g.parcial.toFixed(1)) < 3.0) {
              obs = "Requiere plan de acompañamiento";
              badgeClass = "bg-red";
            }
          }

          reportHtml += `
              <tr>
                <td><span style="color: #94a3b8; font-weight: 700;">${index + 1}</span></td>
                <td class="text-left">${escapeHtml(item.st.primerApellido)} ${escapeHtml(item.st.segundoApellido || "")} ${escapeHtml(item.st.primerNombre)}</td>
                <td><strong style="color: #0f172a;">${g.parcial.toFixed(1)}</strong></td>
                <td>${g.rec !== null ? `<strong style="color: #2563eb;">${g.rec.toFixed(1)}</strong>` : '<span style="color:#cbd5e1;">—</span>'}</td>
                <td><span class="badge ${badgeClass}">${obs}</span></td>
              </tr>
          `;
        });

        reportHtml += `
            </tbody>
          </table>
        </div>
        `;
      }
    });
  });

  reportHtml += `
        <div class="firma avoid-break">
          <div class="firma-line"></div>
          <div style="font-weight: 800; font-size: 11.5px; text-transform: uppercase; color: #0f172a;">${escapeHtml(teacherProfile?.name || "DOCENTE")}</div>
          <div style="font-size: 9.5px; color: #64748b; font-weight: 600;">DOCENTE DE ${masterData.subjects?.join(", ") || "ÁREA"}</div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; font-size: 8.5px; color: #94a3b8; line-height: 1.4;">
          <strong>Por la pervivencia e identidad del Pueblo Awá</strong><br>
          Unidad administrativa – Predio el Verde, resguardo el Gran Sábalo – El Diviso - Barbacoas Nariño<br>
          E-Mail: ietabaawa@yahoo.es
        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.title = normalizedFileName;
    printWindow.document.close();
  } else {
    // Fallback if popup blocked
    const blob = new Blob([reportHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }
}



// ═════════════════════════════════════════════════════════════════════════════
// 2. SUITE DE ANALÍTICA BI & INTELIGENCIA PEDAGÓGICA AVANZADA (FULL VECTORIAL)
// ═════════════════════════════════════════════════════════════════════════════

export function printAnalyticsReport(
  students: any[],
  teacherProfile: any,
  masterData: any
) {
  if (!students || students.length === 0) {
    if (typeof window !== "undefined") alert("Aviso: No hay registros de estudiantes disponibles para generar la analítica BI.");
    return;
  }
  const activePeriod = (masterData.activePeriod || "p2").toLowerCase();
  const pName = activePeriod.toUpperCase();
  const dateStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  // -- CRUNCHING DE BIG DATA PEDAGÓGICO --
  let totalGrades = 0;
  let sumGrades = 0;
  
  const genderStats = { M: { count: 0, sum: 0 }, F: { count: 0, sum: 0 } };
  const studentAverages = new Map<string, { st: any, totalDef: number, count: number }>();
  
  // Desglose Exhaustivo por Grado y Materia
  const detailedCourseSubjectBI: Record<string, {
    key: string;
    grado: string;
    curso: string;
    subject: string;
    total: number;
    superior: number;  // 4.6 - 5.0
    alto: number;      // 4.0 - 4.5
    basico: number;    // 3.0 - 3.9
    bajo: number;      // 1.0 - 2.9
    scoreSum: number;
    absences: number;
    attendanceEvents: number;
    femaleCount: number;
    maleCount: number;
    femaleSum: number;
    maleSum: number;
    aiInsight: string;
    pedagogicalAction: string;
  }> = {};

  students.forEach(st => {
    if (st.isActive === false) return;
    const g = normalizeGrade(st.grado || "SIN GRADO");
    const c = (st.curso || "1").toString().trim();
    const gCourse = `${g}-${c}`;

    let stAbsences = 0;
    let stEvents = 0;
    if (st.attendanceRecord) {
      const records = Object.values(st.attendanceRecord);
      stEvents = records.length;
      stAbsences = records.filter(v => v === 'absent').length;
    }

    const gen = st.genero?.toUpperCase().startsWith('F') ? 'F' : 'M';
    let stDefSum = 0;
    let stDefCount = 0;

    if (st.detailedGrades) {
      Object.keys(st.detailedGrades).forEach(subject => {
        const d = st.detailedGrades[subject][activePeriod];
        if (d) {
          const matrixKey = `${gCourse} · ${subject}`;

          if (!detailedCourseSubjectBI[matrixKey]) {
            detailedCourseSubjectBI[matrixKey] = {
              key: matrixKey,
              grado: g,
              curso: c,
              subject: subject,
              total: 0,
              superior: 0,
              alto: 0,
              basico: 0,
              bajo: 0,
              scoreSum: 0,
              absences: 0,
              attendanceEvents: 0,
              femaleCount: 0,
              maleCount: 0,
              femaleSum: 0,
              maleSum: 0,
              aiInsight: "",
              pedagogicalAction: ""
            };
          }

          const grades = calculatePeriodGrades(d);
          const hasGrades = [d.sb, d.sbh, d.sr, d.cv, d.aut].some(arr => 
            Array.isArray(arr) ? arr.some(x => x !== null) : arr !== null
          );

          if (hasGrades) {
            const def = Number(grades.definitiva.toFixed(1));
            totalGrades++;
            sumGrades += def;
            stDefSum += def;
            stDefCount++;

            genderStats[gen].count++;
            genderStats[gen].sum += def;

            const bItem = detailedCourseSubjectBI[matrixKey];
            bItem.total++;
            bItem.scoreSum += def;
            bItem.absences += stAbsences;
            bItem.attendanceEvents += (stEvents || 1);

            if (gen === 'F') { bItem.femaleCount++; bItem.femaleSum += def; }
            else { bItem.maleCount++; bItem.maleSum += def; }

            if (def >= 4.6) bItem.superior++;
            else if (def >= 4.0) bItem.alto++;
            else if (def >= 3.0) bItem.basico++;
            else bItem.bajo++;
          }
        }
      });
    }

    if (stDefCount > 0) {
      studentAverages.set(st.id, { st, totalDef: stDefSum, count: stDefCount });
    }
  });

  const globalAvg = totalGrades > 0 ? (sumGrades / totalGrades).toFixed(2) : "0.00";
  const avgM = genderStats.M.count > 0 ? (genderStats.M.sum / genderStats.M.count).toFixed(2) : "0.00";
  const avgF = genderStats.F.count > 0 ? (genderStats.F.sum / genderStats.F.count).toFixed(2) : "0.00";

  const sanitizeFilename = (str: string) => (str || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9_-]/g, "_").replace(/_+/g, "_");
  const teacherClean = sanitizeFilename(teacherProfile?.name || "DOCENTE");
  const normalizedFileName = `IETABA_ANALITICA_BI_${pName}_${teacherClean}_${new Date().getFullYear()}`;

  // ═════════════════════════════════════════════════════════════════════════════
  // MOTOR DE INTELIGENCIA PEDAGÓGICA HIPER-DINÁMICA & HUMANIZADA
  // ═════════════════════════════════════════════════════════════════════════════
  Object.keys(detailedCourseSubjectBI).forEach(k => {
    const item = detailedCourseSubjectBI[k];
    if (item.total === 0) return;
    
    const avg = Number((item.scoreSum / item.total).toFixed(2));
    const pSup = Math.round((item.superior / item.total) * 100);
    const pAlt = Math.round((item.alto / item.total) * 100);
    const pBas = Math.round((item.basico / item.total) * 100);
    const pBaj = Math.round((item.bajo / item.total) * 100);
    const passPercent = pSup + pAlt + pBas;
    const absRate = item.attendanceEvents > 0 ? Math.round((item.absences / item.attendanceEvents) * 100) : 0;
    
    const fAvg = item.femaleCount > 0 ? (item.femaleSum / item.femaleCount).toFixed(1) : null;
    const mAvg = item.maleCount > 0 ? (item.maleSum / item.maleCount).toFixed(1) : null;

    const subName = item.subject.toUpperCase();

    // Contexto Temático según la Asignatura
    let areaFocus = "en el desarrollo integral de las competencias";
    let subEmoji = "🌱";
    if (subName.includes("FÍSIC") || subName.includes("FISIC")) {
      areaFocus = "en la comprensión de leyes físicas, modelado de fenómenos naturales y pensamiento lógico";
      subEmoji = "⚡";
    } else if (subName.includes("TECNOLOG") || subName.includes("INFORMÁTIC")) {
      areaFocus = "en la apropiación tecnológica, alfabetización digital y desarrollo de proyectos prácticos";
      subEmoji = "💻";
    } else if (subName.includes("MATEMÁT") || subName.includes("MATEMAT")) {
      areaFocus = "en el razonamiento cuantitativo, cálculo aplicado y resolución de problemas cotidianos";
      subEmoji = "📐";
    } else if (subName.includes("ÉTIC") || subName.includes("ETIC") || subName.includes("RELIG")) {
      areaFocus = "en la vivencia de valores comunitarios, empatía, diálogo pacífico y cosmovisión Awá";
      subEmoji = "🤝";
    } else if (subName.includes("AGRO") || subName.includes("CIENC") || subName.includes("NATURAL")) {
      areaFocus = "en el cuidado del territorio agroambiental, soberanía alimentaria y saberes ancestrales";
      subEmoji = "🌿";
    }

    // 1. Diagnóstico del Rendimiento y Clima de Aula
    let narrative = "";
    if (pBaj === 0 && (pSup + pAlt) >= 60) {
      narrative = `${subEmoji} <strong>Desempeño Sobresaliente:</strong> El 100% del curso superó los objetivos con solidez ${areaFocus}. Destaca un ${pSup}%` +
        ` en nivel Superior (${item.superior} estudiantes) y ${pAlt}% en nivel Alto. El grupo demuestra gran autonomía y compromiso constante.`;
    } else if (pBaj === 0) {
      narrative = `${subEmoji} <strong>Consolidación Positiva:</strong> Plena aprobación grupal con promedio de ${avg}. Aunque no hay reprobación, la mayor concentración está en nivel Básico (${pBas}%), lo que invita a profundizar en retos más estimulantes para impulsar sus saberes hacia niveles de excelencia.`;
    } else if (pBaj <= 15) {
      narrative = `${subEmoji} <strong>Buen Ritmo con Foco Preventivo:</strong> El ${passPercent}% del curso avanza satisfactoriamente. Existen ${item.bajo} estudiante(s) (${pBaj}%) en zona de dificultad transitoria que requieren seguimiento cercano en talleres prácticos.`;
    } else {
      narrative = `${subEmoji} <strong>Grupo Prioritario de Acompañamiento:</strong> El ${pBaj}% (${item.bajo} estudiantes) presenta rezago significativo ${areaFocus}. ` +
        (absRate > 10 ? `Existe una correlación directa con la inasistencia (${absRate}% de ausentismo registrado). ` : '') +
        `Se requiere una intervención pedagógica flexible y oportuna.`;
    }

    // 2. Detalle de Equidad de Género y Factores Dinámicos
    let genderNote = "";
    if (fAvg && mAvg && Math.abs(Number(fAvg) - Number(mAvg)) >= 0.4) {
      const lider = Number(fAvg) > Number(mAvg) ? "las estudiantes mujeres (" + fAvg + ")" : "los estudiantes hombres (" + mAvg + ")";
      genderNote = ` En equidad grupal, se observa mayor dinamismo académico en ${lider}.`;
    }

    // 3. Recomendación Pedagógica Concreta
    let action = "";
    if (activePeriod === "p1") {
      action = `🎯 <strong>Ruta de Aprendizaje (P1):</strong> Afianzar hábitos de estudio, fomentar el trabajo en duplas colaborativas y dinamizar las actividades vivenciales en el aula.`;
    } else if (activePeriod === "p2") {
      if (pBaj > 0) {
        action = `🎯 <strong>Plan de Rescate Inmediato (P2):</strong> Asignar talleres de nivelación sobre los conceptos nodales y convocar a las familias de los ${item.bajo} estudiantes en riesgo para acordar compromisos antes de iniciar el Periodo 3.`;
      } else {
        action = `🎯 <strong>Proyección al Cierre (P2):</strong> Mantener el ritmo de entrega y motivar al grupo a consolidar su año lectivo con proyectos de aplicación comunitaria.`;
      }
    } else {
      action = `🎯 <strong>Balance Final (P3):</strong> Formalizar los planes de habilitación final para estudiantes no promovidos y felicitar al grupo por el camino recorrido.`;
    }

    item.aiInsight = narrative + genderNote;
    item.pedagogicalAction = action;
  });

  // Top 10 Cuadro de Honor
  const honorRoll = Array.from(studentAverages.values())
    .map(data => ({
      st: data.st,
      avg: Number((data.totalDef / data.count).toFixed(2))
    }))
    .filter(item => item.avg >= 3.5)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  let reportHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>${normalizedFileName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
        
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; padding: 0 !important; background: #fff !important; }
          .page-break-before { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
          .no-print { display: none !important; }
          .print-container { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; }
          @page {
          margin: 0;
          size: A4 portrait;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          .print-container {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 14mm 16mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }
          .page-break-before { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
          .no-print { display: none !important; }
        }
        @media screen and (max-width: 640px) {
          body { padding: 8px !important; }
          .print-container { padding: 20px 14px !important; border-radius: 14px !important; }
          .bento-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .sabiduria-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 6px !important; }
          .bi-kpi-grid { grid-template-columns: 1fr !important; }
          .action-bar-top { flex-direction: column; gap: 10px; text-align: center; }
        }
        }

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #1e293b;
          line-height: 1.5;
          margin: 0;
          padding: 20px;
          background: #f8fafc;
        }

        .action-bar-top {
          position: sticky;
          top: 10px;
          z-index: 9999;
          max-width: 920px;
          margin: 0 auto 20px auto;
          background: #042f2e;
          color: #ccfbf1;
          padding: 14px 24px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 10px 25px rgba(4,47,46,0.3);
          border: 1px solid #14b8a6;
        }
        .btn-print-bi {
          background: #0d9488;
          color: white;
          border: none;
          padding: 10px 22px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 11px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: transform 0.2s, background 0.2s;
        }
        .btn-print-bi:hover { background: #0f766e; transform: scale(1.02); }

        .print-container {
          max-width: 920px;
          margin: 0 auto;
          background: white;
          padding: 40px 50px;
          border-radius: 24px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.04);
        }

        .header-institucional { text-align: center; margin-bottom: 25px; position: relative; border-bottom: 2px solid #e2e8f0; padding-bottom: 18px; }
        .header-institucional h1 { font-weight: 900; font-size: 13.5px; margin: 0; color: #0f172a; }
        .header-institucional h2 { font-weight: 700; font-size: 11px; margin: 4px 0; color: #0d9488; }
        .header-institucional p { font-size: 9.5px; margin: 1px 0; color: #64748b; }
        
        .report-badge {
          display: inline-block;
          background: #f0fdfa;
          color: #0d9488;
          border: 1px solid #99f6e4;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 4px 12px;
          border-radius: 20px;
          margin-top: 8px;
        }

        .section-title {
          font-size: 11.5px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-title::before {
          content: '';
          display: inline-block;
          width: 4px;
          height: 14px;
          background: #0d9488;
          border-radius: 2px;
        }

        .bi-kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 20px 0; }
        .bi-kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px; text-align: center; }
        .bi-kpi-card.teal { background: linear-gradient(145deg, #f0fdfa, #ccfbf1); border-color: #5eead4; }
        
        .gender-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 18px 22px;
          margin: 20px 0;
        }
        .gender-row { display: flex; align-items: center; gap: 12px; margin-top: 10px; }
        .gender-label { width: 75px; font-size: 10px; font-weight: 800; color: #0f172a; }
        .gender-track { flex: 1; height: 14px; background: #f1f5f9; border-radius: 8px; overflow: hidden; display: flex; }
        .gender-fill-f { background: linear-gradient(90deg, #ec4899, #db2777); }
        .gender-fill-m { background: linear-gradient(90deg, #0ea5e9, #0284c7); }
        .gender-val { font-size: 11px; font-weight: 900; color: #0f172a; width: 45px; text-align: right; }

        .course-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 20px 24px;
          margin-bottom: 20px;
        }
        .course-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 12px;
          margin-bottom: 14px;
        }
        .course-tag {
          background: #0f172a;
          color: white;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 10px;
        }
        .course-subject {
          font-size: 12px;
          font-weight: 900;
          color: #0f172a;
          margin-left: 8px;
        }
        .course-avg {
          font-size: 16px;
          font-weight: 900;
          color: #0d9488;
        }

        .dist-stacked-bar {
          width: 100%;
          height: 18px;
          background: #f1f5f9;
          border-radius: 999px;
          display: flex;
          overflow: hidden;
          margin: 10px 0;
        }
        .dist-segment {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 900;
          color: white;
        }
        .dist-legend {
          display: flex;
          gap: 16px;
          font-size: 9px;
          font-weight: 700;
          color: #64748b;
          margin-top: 6px;
        }
        .dist-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 4px; }

        .ai-insight-box {
          background: #f0fdfa;
          border: 1px solid #ccfbf1;
          border-radius: 12px;
          padding: 12px 16px;
          margin-top: 14px;
          font-size: 10.5px;
          color: #0f766e;
          line-height: 1.6;
        }
        .ai-action-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 16px;
          margin-top: 8px;
          font-size: 10px;
          color: #334155;
          line-height: 1.5;
        }

        .table-honor {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 10px;
          margin-top: 10px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .table-honor th {
          background: #f8fafc;
          font-weight: 800;
          color: #334155;
          text-transform: uppercase;
          font-size: 8.5px;
          padding: 8px 10px;
          border-bottom: 2px solid #e2e8f0;
        }
        .table-honor td {
          padding: 8px 10px;
          text-align: center;
          border-bottom: 1px solid #f1f5f9;
        }
        .table-honor td.text-left { text-align: left; font-weight: 600; color: #1e293b; }

        .firma { margin-top: 50px; text-align: center; width: 280px; margin-left: auto; margin-right: auto; }
        .firma-line { border-bottom: 1px solid #94a3b8; margin-bottom: 6px; }
      </style>
    </head>
    <body>
      <div class="action-bar-top no-print">
        <div>
          <div style="font-weight: 900; font-size: 12px; letter-spacing: 0.05em;">
            📊 Suite de Inteligencia Académica BI · IETABA
          </div>
          <div style="font-size: 9.5px; color: #99f6e4; margin-top: 2px;">
            💡 Tip: En el cuadro de impresión, desmarca "Encabezados y pies de página" para un PDF limpio.
          </div>
        </div>
        <button onclick="window.print()" class="btn-print-bi">
          🖨️ Imprimir / Guardar en PDF
        </button>
      </div>

      <div class="print-container">
        <!-- HEADER INSTITUCIONAL -->
        <div class="header-institucional">
          <img src="${baseUrl}/logo.png" style="width: 76px; height: auto; position: absolute; left: 0; top: 2px; image-rendering: -webkit-optimize-contrast; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));" onerror="this.style.display='none'">
          <div style="padding: 0 40px 0 85px;">
            <h1>UNIDAD INDIGENA DEL PUEBLO AWA "UNIPA"</h1>
          <h2>INSTITUCION EDUCATIVA INDIGENA TECNICA AGROAMBIENTAL BILINGÜE AWA "IETABA"</h2>
          <p>Licencia de Funcionamiento No. 398 del 28 de abril del 2004 · DANE 25207900204501 · NIT. 900000095-4</p>
          <div class="report-badge">SUITE DE INTELIGENCIA ACADÉMICA & ANALÍTICA DE DESEMPEÑO (BI)</div>
          </div>
        </div>

        <div class="saludo">
          <p>Apreciada comunidad directiva y equipo pedagógico,</p>
          <p>
            Presentamos la <strong>Radiografía Integral de Inteligencia Pedagógica del Periodo ${pName}</strong>. Este compendio transforma los registros de evaluación en reflexiones cualitativas y cuantitativas profundas por cada grado y asignatura, identificando las fortalezas grupales y orientando con calidez las acciones de mejoramiento continuo.
          </p>
        </div>

        <!-- KPI BENTO -->
        <div class="bi-kpi-grid">
          <div class="bi-kpi-card teal">
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #0f766e; letter-spacing: 0.05em;">Promedio Institucional</div>
            <div style="font-size: 36px; font-weight: 900; color: #0f172a; margin: 4px 0;">${globalAvg}</div>
            <div style="font-size: 9.5px; color: #0d9488; font-weight: 600;">${totalGrades} evaluaciones consolidadas</div>
          </div>
          <div class="bi-kpi-card">
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Población Estudiantil</div>
            <div style="font-size: 36px; font-weight: 900; color: #0f172a; margin: 4px 0;">${studentAverages.size}</div>
            <div style="font-size: 9.5px; color: #64748b; font-weight: 600;">Estudiantes activos en seguimiento</div>
          </div>
          <div class="bi-kpi-card">
            <div style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Materias / Cursos</div>
            <div style="font-size: 36px; font-weight: 900; color: #0f172a; margin: 4px 0;">${Object.keys(detailedCourseSubjectBI).length}</div>
            <div style="font-size: 9.5px; color: #64748b; font-weight: 600;">Grupos analizados individualmente</div>
          </div>
        </div>

        <!-- PRODUCTIVIDAD Y EQUIDAD DE GÉNERO -->
        <div class="gender-box avoid-break">
          <div class="section-title">Equidad y Rendimiento por Género</div>
          <p style="font-size: 10px; color: #64748b; margin: 4px 0 10px 0;">Comparativo de promedios para garantizar igualdad de oportunidades y acompañamiento equilibrado.</p>
          
          <div class="gender-row">
            <div class="gender-label">👧 Mujeres</div>
            <div class="gender-track">
              <div class="gender-fill-f" style="width: ${Math.min(100, (Number(avgF)/5)*100)}%;"></div>
            </div>
            <div class="gender-val" style="color: #db2777;">${avgF}</div>
          </div>

          <div class="gender-row">
            <div class="gender-label">👦 Hombres</div>
            <div class="gender-track">
              <div class="gender-fill-m" style="width: ${Math.min(100, (Number(avgM)/5)*100)}%;"></div>
            </div>
            <div class="gender-val" style="color: #0284c7;">${avgM}</div>
          </div>
        </div>

        <!-- CUADRO DE HONOR -->
        <div class="avoid-break" style="margin-top: 25px;">
          <div class="section-title" style="color: #b45309;">🏆 Cuadro de Honor y Excelencia Pedagógica</div>
          <table class="table-honor">
            <thead>
              <tr>
                <th style="width: 8%;">Puesto</th>
                <th style="width: 45%; text-align: left;">Estudiante</th>
                <th style="width: 25%;">Grado / Curso</th>
                <th style="width: 22%;">Promedio Periodo</th>
              </tr>
            </thead>
            <tbody>
              ${honorRoll.map((h, i) => `
                <tr>
                  <td><strong style="color: ${i===0 ? '#eab308' : i===1 ? '#94a3b8' : i===2 ? '#b45309' : '#64748b'}; font-size: 11px;">#${i+1}</strong></td>
                  <td class="text-left">${escapeHtml(h.st.primerApellido)} ${escapeHtml(h.st.segundoApellido || "")} ${escapeHtml(h.st.primerNombre)}</td>
                  <td>${h.st.grado}-${h.st.curso || '1'}</td>
                  <td><strong style="color: #0d9488; font-size: 11px;">${h.avg.toFixed(2)}</strong></td>
                </tr>
              `).join('') || '<tr><td colspan="4">No hay datos de honor disponibles</td></tr>'}
            </tbody>
          </table>
        </div>

        <!-- COMPENDIO DETALLADO CURSO POR CURSO CON IA PEDAGÓGICA -->
        <div style="margin-top: 30px;">
          <div class="section-title" style="margin-bottom: 14px;">Compendio Analítico Desagregado por Grado y Asignatura</div>

          ${Object.keys(detailedCourseSubjectBI).sort().map(k => {
            const item = detailedCourseSubjectBI[k];
            if (item.total === 0) return '';
            const avg = (item.scoreSum / item.total).toFixed(2);
            const pSup = Math.round((item.superior / item.total) * 100);
            const pAlt = Math.round((item.alto / item.total) * 100);
            const pBas = Math.round((item.basico / item.total) * 100);
            const pBaj = Math.round((item.bajo / item.total) * 100);

            return `
            <div class="course-card avoid-break">
              <div class="course-header">
                <div style="display: flex; align-items: center;">
                  <span class="course-tag">${item.grado}-${item.curso}</span>
                  <span class="course-subject">${item.subject}</span>
                </div>
                <div>
                  <span style="font-size: 10px; font-weight: 700; color: #64748b; margin-right: 6px;">Promedio:</span>
                  <span class="course-avg">${avg}</span>
                </div>
              </div>

              <div style="font-size: 9.5px; font-weight: 700; color: #475569; margin-bottom: 4px;">
                Distribución de Desempeño (${item.total} Estudiantes):
              </div>

              <!-- Barra de Distribución Vectorial -->
              <div class="dist-stacked-bar">
                <div class="dist-segment" style="width: ${pSup}%; background: #059669;">${pSup > 5 ? pSup + '%' : ''}</div>
                <div class="dist-segment" style="width: ${pAlt}%; background: #10b981;">${pAlt > 5 ? pAlt + '%' : ''}</div>
                <div class="dist-segment" style="width: ${pBas}%; background: #f59e0b;">${pBas > 5 ? pBas + '%' : ''}</div>
                <div class="dist-segment" style="width: ${pBaj}%; background: #ef4444;">${pBaj > 5 ? pBaj + '%' : ''}</div>
              </div>

              <div class="dist-legend">
                <span><span class="dist-dot" style="background:#059669;"></span> Superior: ${item.superior} (${pSup}%)</span>
                <span><span class="dist-dot" style="background:#10b981;"></span> Alto: ${item.alto} (${pAlt}%)</span>
                <span><span class="dist-dot" style="background:#f59e0b;"></span> Básico: ${item.basico} (${pBas}%)</span>
                <span><span class="dist-dot" style="background:#ef4444;"></span> Bajo: ${item.bajo} (${pBaj}%)</span>
              </div>

              <!-- Diagnóstico de IA Humanizado y Dinámico por Asignatura -->
              <div class="ai-insight-box">
                ${item.aiInsight}
              </div>

              <!-- Plan de Acción Concreto -->
              <div class="ai-action-box">
                ${item.pedagogicalAction}
              </div>
            </div>
            `;
          }).join('')}
        </div>

        <div class="firma avoid-break">
          <div class="firma-line"></div>
          <div style="font-weight: 800; font-size: 11.5px; text-transform: uppercase; color: #0f172a;">${escapeHtml(teacherProfile?.name || "DOCENTE")}</div>
          <div style="font-size: 9.5px; color: #0d9488; font-weight: 600;">DOCENTE DE ${masterData.subjects?.join(", ") || "ÁREA"}</div>
        </div>

        <div style="text-align: center; margin-top: 40px; font-size: 8.5px; color: #94a3b8; line-height: 1.4;">
          <strong>Por la pervivencia e identidad del Pueblo Awá</strong><br>
          Unidad administrativa – Predio el Verde, resguardo el Gran Sábalo – El Diviso - Barbacoas Nariño<br>
          E-Mail: ietabaawa@yahoo.es
        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.title = normalizedFileName;
    printWindow.document.close();
  } else {
    const blob = new Blob([reportHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }
}
