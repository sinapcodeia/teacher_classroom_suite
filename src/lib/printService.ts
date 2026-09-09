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
  const activePeriod = masterData.activePeriod || "p2";
  const pName = activePeriod.toUpperCase();
  const dateStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });

  // 1. Crunch the Data
  let totalStudentsCount = 0;
  let totalGrades = 0;
  let passedCount = 0;
  let failedCount = 0;
  let recoveredCount = 0;

  const groups: Record<string, Record<string, any[]>> = {};

  students.forEach(st => {
    if (st.isActive === false) return;
    const g = `${st.grado}-${st.curso}`;
    
    if (st.detailedGrades) {
      Object.keys(st.detailedGrades).forEach(subject => {
        const d = st.detailedGrades[subject][activePeriod];
        if (d) {
          if (!groups[g]) groups[g] = {};
          if (!groups[g][subject]) groups[g][subject] = [];
          
          const grades = calculatePeriodGrades(d);
          const hasGrades = [d.sb, d.sbh, d.sr, d.cv, d.aut].some(arr => 
            Array.isArray(arr) ? arr.some(x => x !== null) : arr !== null
          );
          
          if (hasGrades) {
            groups[g][subject].push({ st, grades });
            totalGrades++;
            
            if (grades.rec !== null) {
               recoveredCount++;
               if (Number(grades.definitiva.toFixed(1)) >= 3.0) passedCount++; else failedCount++;
            } else {
               if (Number(grades.definitiva.toFixed(1)) >= 3.0) passedCount++; else failedCount++;
            }
          }
        }
      });
    }
  });

  const passRate = totalGrades > 0 ? Math.round((passedCount / totalGrades) * 100) : 0;
  const failRate = totalGrades > 0 ? Math.round((failedCount / totalGrades) * 100) : 0;
  const recRate = totalGrades > 0 ? Math.round((recoveredCount / totalGrades) * 100) : 0;

  let reportHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>INFORME ACADÉMICO - ${teacherProfile.name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');
        
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .page-break-before { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
          .no-print { display: none !important; }
          @page { margin: 1cm; size: letter; }
        }

        body {
          font-family: 'Inter', sans-serif;
          color: #334155;
          line-height: 1.6;
          margin: 0;
          padding: 20px 40px;
          background: #f8fafc;
        }

        .print-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          padding: 40px 60px;
          border-radius: 24px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.03);
        }

        .print-container.borderless {
          border-radius: 0;
          box-shadow: none;
          padding-top: 20px;
        }

        /* Membrete */
        .header-institucional { text-align: center; margin-bottom: 40px; position: relative; }
        .header-institucional h1 { font-weight: 900; font-size: 14px; margin: 0; color: #0f172a; letter-spacing: -0.02em; }
        .header-institucional h2 { font-weight: 700; font-size: 11px; margin: 6px 0; color: #1e293b; }
        .header-institucional p { font-size: 10px; margin: 2px 0; color: #64748b; }
        .fecha-dir { margin-top: 30px; font-size: 11px; color: #334155; }
        
        .saludo { margin-top: 24px; font-size: 12px; text-align: justify; color: #334155; font-weight: 400; }

        /* Modern Bento Grid */
        .bento-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 30px 0; }
        .bento-card { background: #ffffff; border: 1px solid #f1f5f9; border-radius: 20px; padding: 24px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); }
        .bento-card.highlight { background: linear-gradient(145deg, #f0f9ff, #e0f2fe); border-color: #bae6fd; }
        .bento-val { font-size: 36px; font-weight: 900; color: #0f172a; line-height: 1; margin-bottom: 8px; letter-spacing: -0.03em; }
        .bento-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }

        /* Visual Progress Bar (Modern replacement for donut) */
        .chart-container {
          grid-column: span 3;
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 20px;
          padding: 24px 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
        }
        .progress-bar-wrapper {
          width: 100%;
          height: 24px;
          background: #f1f5f9;
          border-radius: 999px;
          display: flex;
          overflow: hidden;
          margin: 16px 0;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }
        .segment { height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: white; transition: width 0.5s ease; }
        
        .legend-row { display: flex; gap: 24px; justify-content: center; margin-top: 16px; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: #475569; }
        .legend-dot { width: 12px; height: 12px; border-radius: 50%; }

        /* Tables (Minimalist) */
        .table-container { margin-top: 30px; }
        .table-title { font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 8px; }
        .table-title::before { content: ''; display: block; width: 4px; height: 14px; background: #3b82f6; border-radius: 4px; }
        
        table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 11px; margin-bottom: 40px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        th, td { padding: 10px 14px; text-align: center; border-bottom: 1px solid #f1f5f9; }
        th { background: #f8fafc; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
        tr:last-child td { border-bottom: none; }
        td.text-left { text-align: left; font-weight: 500; color: #1e293b; }
        
        .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 6px; font-size: 10px; font-weight: 600; line-height: 1; }
        .bg-green { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .bg-red { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        .bg-yellow { background: #fef9c3; color: #854d0e; border: 1px solid #fef08a; }

        .firma { margin-top: 80px; text-align: center; width: 300px; margin-left: auto; margin-right: auto; }
        .firma-line { border-bottom: 1px solid #cbd5e1; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="print-container">
        <!-- HEADER INSTITUCIONAL -->
        <div class="header-institucional">
          <img src="${window.location.origin}/logo.png" style="width: 50px; height: auto; position: absolute; left: 0; top: 0;" onerror="this.style.display='none'">
          <h1>UNIDAD INDIGENA DEL PUEBLO AWA "UNIPA"</h1>
          <h2>INSTITUCION EDUCATIVA INDIGENA TECNICA AGROAMBIENTAL BILINGÜE AWA "IETABA"</h2>
          <p>Licencia de Funcionamiento No. 398 del 28 de abril del 2004</p>
          <p>Emanada de la Secretaria Departamental de Educación y Cultura de Nariño</p>
          <p><strong>Código DANE 25207900204501 - NIT. 900000095-4</strong></p>
          <p><i>Ambiente – Cultura – Ciencia</i></p>
        </div>

        <div class="fecha-dir">
          <p>Predio el Verde IETABA, ${dateStr}</p>
          <br>
          <p>Señores (as)</p>
          <p><strong>DIRECTIVOS IETABA</strong></p>
          <p><strong>DIRECTORES (AS) DE GRADO - IETABA</strong></p>
        </div>

        <div class="saludo">
          <p>Cordial saludo,</p>
          <p>Espero que se encuentren muy bien.</p>
          <p>A través de este documento, les comparto el consolidado del rendimiento académico correspondiente al <strong>periodo ${pName}</strong>. El propósito de este reporte es brindarnos una radiografía clara del proceso de nuestros estudiantes, identificar a quienes requieren mayor acompañamiento y evaluar el impacto de los planes de nivelación de manera objetiva y humana.</p>
          <p>A continuación, detallo las métricas globales del curso y el estado actual de los estudiantes que presentan dificultades en sus áreas.</p>
        </div>

        <!-- BENTO DASHBOARD -->
        <div class="bento-grid">
          <div class="bento-card highlight">
            <div class="bento-val">${totalGrades}</div>
            <div class="bento-label">Estudiantes Evaluados</div>
          </div>
          <div class="bento-card">
            <div class="bento-val" style="color: #059669;">${passRate}%</div>
            <div class="bento-label">Aprobación General</div>
          </div>
          <div class="bento-card" style="border: 1px solid #fecaca; background: #fff5f5;">
            <div class="bento-val" style="color: #dc2626;">${recoveredCount}</div>
            <div class="bento-label">Requieren Nivelación</div>
          </div>

          <!-- TRENDING METRICS CHART (MODERN BAR) -->
          <div class="chart-container">
            <div style="display: flex; justify-content: space-between; align-items: flex-end;">
              <div>
                <h3 style="margin: 0 0 6px 0; font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">Distribución de Desempeño</h3>
                <p style="font-size: 11px; color: #64748b; margin: 0;">Representación visual del progreso académico del periodo.</p>
              </div>
            </div>
            
            <div class="progress-bar-wrapper">
              <div class="segment" style="width: ${passRate}%; background: linear-gradient(90deg, #34d399, #059669);">${passRate > 5 ? passRate + '%' : ''}</div>
              <div class="segment" style="width: ${recRate}%; background: linear-gradient(90deg, #facc15, #ca8a04);">${recRate > 5 ? recRate + '%' : ''}</div>
              <div class="segment" style="width: ${failRate}%; background: linear-gradient(90deg, #f87171, #dc2626);">${failRate > 5 ? failRate + '%' : ''}</div>
            </div>
            
            <div class="legend-row">
              <div class="legend-item">
                <span class="legend-dot" style="background: #059669; box-shadow: 0 2px 4px rgba(5,150,105,0.3);"></span> Aprobados
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background: #ca8a04; box-shadow: 0 2px 4px rgba(202,138,4,0.3);"></span> Nivelación
              </div>
              <div class="legend-item">
                <span class="legend-dot" style="background: #dc2626; box-shadow: 0 2px 4px rgba(220,38,38,0.3);"></span> Reprobados
              </div>
            </div>
          </div>
        </div>

        <div class="saludo avoid-break" style="background: #f8fafc; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 40px;">
          <p style="margin-top: 0; color: #0f172a;"><strong>Oportunidades de mejora observadas (Contexto General):</strong></p>
          <ul style="margin-bottom: 0; font-size: 11px; color: #475569; padding-left: 20px;">
            <li style="margin-bottom: 6px;">Dificultad de conectividad o inasistencia reiterada que interrumpe el hilo pedagógico.</li>
            <li style="margin-bottom: 6px;">Necesidad de mayor acompañamiento familiar en la entrega de actividades y talleres.</li>
            <li style="margin-bottom: 6px;">Falta de material de trabajo o cuadernos para el seguimiento en clase.</li>
            <li style="margin-bottom: 0;">Es fundamental reforzar la motivación y el trabajo en el aula tras episodios de ausencia.</li>
          </ul>
        </div>
      </div>

      <div class="print-container borderless">
  `;

  // --- TABLES ---
  
  Object.keys(groups).sort().forEach(grado => {
    Object.keys(groups[grado]).sort().forEach(subject => {
      const allSubjectStudents = groups[grado][subject];
      
      const targetStudents = allSubjectStudents.filter(item => {
        const pRound = Number(item.grades.parcial.toFixed(1));
        return item.grades.rec !== null || pRound < 3.0;
      });
      
      if (targetStudents.length > 0) {
        reportHtml += `
        <div class="avoid-break">
          <h3 class="table-title">GRADO: ${grado} — ${subject}</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 5%;">No.</th>
                <th style="width: 40%; text-align: left;">NOMBRES Y APELLIDOS</th>
                <th style="width: 15%;">DEFINITIVA</th>
                <th style="width: 15%;">NIVELACIÓN</th>
                <th style="width: 25%;">OBSERVACIÓN</th>
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
              obs = "Asistió sin aprobar";
              badgeClass = "bg-yellow";
            }
          } else {
            if (Number(g.parcial.toFixed(1)) < 3.0) {
              obs = "Requiere acompañamiento";
              badgeClass = "bg-red";
            }
          }

          reportHtml += `
              <tr>
                <td><span style="color: #94a3b8; font-weight: 700;">${index + 1}</span></td>
                <td class="text-left">${item.st.primerApellido} ${item.st.segundoApellido || ''} ${item.st.primerNombre}</td>
                <td><strong style="color: #0f172a;">${g.parcial.toFixed(1)}</strong></td>
                <td>${g.rec !== null ? `<strong style="color: #3b82f6;">${g.rec.toFixed(1)}</strong>` : '<span style="color:#cbd5e1;">—</span>'}</td>
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
          <div style="font-weight: 800; font-size: 12px; text-transform: uppercase; color: #0f172a;">${teacherProfile.name}</div>
          <div style="font-size: 10px; color: #64748b; font-weight: 600;">DOCENTE DE ${masterData.subjects?.join(", ") || "ÁREA"}</div>
        </div>
        
        <div style="text-align: center; margin-top: 50px; font-size: 9px; color: #94a3b8; line-height: 1.4;">
          <strong>Por la pervivencia e identidad del Pueblo Awa</strong><br>
          Unidad administrativa – Predio el Verde, resguardo el Gran Sábalo – El Diviso- Barbacoas Nariño<br>
          E-Mail: ietabaawa@yahoo.es
        </div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([reportHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}



export function printAnalyticsReport(
  students: any[],
  teacherProfile: any,
  masterData: any
) {
  const activePeriod = masterData.activePeriod || "p2";
  const pName = activePeriod.toUpperCase();
  const dateStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  const baseUrl = window.location.origin;

  // -- DATA CRUNCHING --
  let totalGrades = 0;
  let sumGrades = 0;
  
  const genderStats = { M: { count: 0, sum: 0 }, F: { count: 0, sum: 0 } };
  
  // For Honor Roll
  const studentAverages = new Map<string, { st: any, totalDef: number, count: number }>();
  
  // For Grade Distribution per Grade
  // grade -> { high: 0, basic: 0, low: 0 }
  const gradeDistribution: Record<string, { high: 0, basic: 0, low: 0 }> = {};

  students.forEach(st => {
    if (st.isActive === false) return;
    const g = st.grado;
    if (!gradeDistribution[g]) gradeDistribution[g] = { high: 0, basic: 0, low: 0 };
    
    let stDefSum = 0;
    let stDefCount = 0;

    if (st.detailedGrades) {
      Object.keys(st.detailedGrades).forEach(subject => {
        const d = st.detailedGrades[subject][activePeriod];
        if (d) {
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

            // Gender mapping (assume 'M'/'F' or 'Masculino'/'Femenino')
            const gen = st.genero?.toUpperCase().startsWith('F') ? 'F' : 'M';
            genderStats[gen].count++;
            genderStats[gen].sum += def;
            
            // Distribution
            if (def >= 4.0) gradeDistribution[g].high++;
            else if (def >= 3.0) gradeDistribution[g].basic++;
            else gradeDistribution[g].low++;
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

  // Top 10 Honor Roll
  const honorRoll = Array.from(studentAverages.values())
    .map(data => ({
      st: data.st,
      avg: Number((data.totalDef / data.count).toFixed(2))
    }))
    .filter(item => item.avg >= 3.5) // Only decent grades make it to honor roll
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  let reportHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>ANALÍTICA SOCIODEMOGRÁFICA - ${teacherProfile.name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');
        
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .page-break-before { page-break-before: always; }
          .avoid-break { page-break-inside: avoid; }
          .no-print { display: none !important; }
          @page { margin: 1cm; size: letter; }
        }

        body { font-family: 'Inter', sans-serif; color: #334155; line-height: 1.6; margin: 0; padding: 20px 40px; background: #f8fafc; }
        .print-container { max-width: 900px; margin: 0 auto; background: white; padding: 40px 60px; border-radius: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.03); }
        .print-container.borderless { border-radius: 0; box-shadow: none; padding-top: 20px; }

        .header-institucional { text-align: center; margin-bottom: 40px; position: relative; }
        .header-institucional h1 { font-weight: 900; font-size: 14px; margin: 0; color: #0f172a; letter-spacing: -0.02em; }
        .header-institucional h2 { font-weight: 700; font-size: 11px; margin: 6px 0; color: #1e293b; }
        .header-institucional p { font-size: 10px; margin: 2px 0; color: #64748b; }
        
        .saludo { margin-top: 24px; font-size: 12px; text-align: justify; color: #334155; font-weight: 400; }
        
        /* Modern BI Layout */
        .bi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
        .bi-card { background: #ffffff; border: 1px solid #f1f5f9; border-radius: 20px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
        .bi-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .bi-title::before { content: ''; display: block; width: 4px; height: 14px; background: #8b5cf6; border-radius: 4px; }
        
        /* Gender Bar */
        .gender-bar-container { display: flex; flex-direction: column; gap: 12px; }
        .gender-row { display: flex; align-items: center; gap: 12px; }
        .gender-label { width: 40px; font-size: 10px; font-weight: 800; color: #0f172a; }
        .gender-track { flex: 1; height: 12px; background: #f1f5f9; border-radius: 6px; overflow: hidden; position: relative; }
        .gender-fill.f { background: linear-gradient(90deg, #c084fc, #9333ea); }
        .gender-fill.m { background: linear-gradient(90deg, #38bdf8, #0284c7); }
        .gender-val { font-size: 11px; font-weight: 800; color: #0f172a; width: 30px; text-align: right; }
        
        /* Honor Roll Table */
        table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 11px; margin-bottom: 20px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        th, td { padding: 8px 12px; text-align: center; border-bottom: 1px solid #f1f5f9; }
        th { background: #f8fafc; font-weight: 700; color: #475569; text-transform: uppercase; font-size: 9px; letter-spacing: 0.05em; border-bottom: 2px solid #e2e8f0; }
        td.text-left { text-align: left; font-weight: 500; color: #1e293b; }
        
        /* Distribution Grid */
        .dist-row { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; border-bottom: 1px solid #f1f5f9; padding: 8px 0; font-size: 10px; }
        .dist-header { font-weight: 800; color: #475569; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        .dist-cell { text-align: center; font-weight: 600; }
        .dist-label { text-align: left; font-weight: 800; color: #0f172a; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; color: #fff; }

        .firma { margin-top: 80px; text-align: center; width: 300px; margin-left: auto; margin-right: auto; }
        .firma-line { border-bottom: 1px solid #cbd5e1; margin-bottom: 8px; }
      </style>
    </head>
    <body>
      <div class="print-container">
        <!-- HEADER -->
        <div class="header-institucional">
          <img src="${baseUrl}/logo.png" style="width: 50px; height: auto; position: absolute; left: 0; top: 0;" onerror="this.style.display='none'">
          <h1>UNIDAD INDIGENA DEL PUEBLO AWA "UNIPA"</h1>
          <h2>INSTITUCION EDUCATIVA INDIGENA TECNICA AGROAMBIENTAL BILINGÜE AWA "IETABA"</h2>
          <p><strong>ANALÍTICA SOCIODEMOGRÁFICA Y PEDAGÓGICA (BI)</strong></p>
          <p><i>Periodo Académico: ${pName} | Generado el ${dateStr}</i></p>
        </div>

        <div class="saludo">
          <p>El presente informe de <strong>Inteligencia de Datos (BI)</strong> ofrece un análisis multidimensional del desempeño académico cruzado con variables sociodemográficas. El objetivo de este reporte avanzado, diseñado con estándares de las principales plataformas educativas globales, es visualizar las brechas de rendimiento, identificar patrones de éxito y evaluar la distribución de competencias por grado.</p>
        </div>

        <div class="bi-grid">
          <!-- METRIC 1: Promedio Global -->
          <div class="bi-card" style="text-align: center; display: flex; flex-direction: column; justify-content: center; background: linear-gradient(145deg, #f0f9ff, #e0f2fe); border-color: #bae6fd;">
            <div style="font-size: 11px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Promedio Académico Global</div>
            <div style="font-size: 48px; font-weight: 900; color: #0f172a; line-height: 1;">${globalAvg}</div>
            <div style="font-size: 10px; color: #475569; margin-top: 8px;">Basado en ${totalGrades} calificaciones consolidadas</div>
          </div>

          <!-- METRIC 2: Productividad por Género -->
          <div class="bi-card">
            <div class="bi-title">Productividad por Género</div>
            <p style="font-size: 9px; color: #64748b; margin-top: -10px; margin-bottom: 16px;">Análisis de equidad y rendimiento segmentado.</p>
            <div class="gender-bar-container">
              <div class="gender-row">
                <div class="gender-label">Mujeres</div>
                <div class="gender-track">
                  <div class="gender-fill f" style="width: ${Math.min(100, (Number(avgF)/5)*100)}%; height: 100%;"></div>
                </div>
                <div class="gender-val">${avgF}</div>
              </div>
              <div class="gender-row">
                <div class="gender-label">Hombres</div>
                <div class="gender-track">
                  <div class="gender-fill m" style="width: ${Math.min(100, (Number(avgM)/5)*100)}%; height: 100%;"></div>
                </div>
                <div class="gender-val">${avgM}</div>
              </div>
            </div>
          </div>

          <!-- METRIC 3: Cuadro de Honor -->
          <div class="bi-card" style="grid-column: span 2;">
            <div class="bi-title" style="color: #059669;">Cuadro de Honor - Top Rendimiento</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 5%;">Rank</th>
                  <th style="text-align: left;">Estudiante</th>
                  <th>Grado</th>
                  <th>Promedio Periodo</th>
                </tr>
              </thead>
              <tbody>
                ${honorRoll.map((h, i) => `
                  <tr>
                    <td><strong style="color: ${i===0 ? '#eab308' : '#64748b'}">#${i+1}</strong></td>
                    <td class="text-left">${h.st.primerApellido} ${h.st.segundoApellido || ''} ${h.st.primerNombre}</td>
                    <td>${h.st.grado}</td>
                    <td><strong style="color: #0f172a;">${h.avg.toFixed(2)}</strong></td>
                  </tr>
                `).join('') || '<tr><td colspan="4">No hay datos suficientes</td></tr>'}
              </tbody>
            </table>
          </div>

          <!-- METRIC 4: Distribución por Grado -->
          <div class="bi-card avoid-break" style="grid-column: span 2;">
            <div class="bi-title">Distribución de Competencias por Grado</div>
            <p style="font-size: 10px; color: #64748b; margin-top: -10px; margin-bottom: 16px;">Volumen de notas en niveles de desempeño (Bajo, Básico, Alto/Superior).</p>
            
            <div class="dist-row dist-header">
              <div class="dist-label">Grado</div>
              <div class="dist-cell">Alto/Sup (4.0 - 5.0)</div>
              <div class="dist-cell">Básico (3.0 - 3.9)</div>
              <div class="dist-cell">Bajo (1.0 - 2.9)</div>
            </div>
            
            ${Object.keys(gradeDistribution).sort().map(g => {
              const d = gradeDistribution[g];
              const total = d.high + d.basic + d.low;
              if(total === 0) return '';
              
              const pHigh = Math.round((d.high/total)*100);
              const pBasic = Math.round((d.basic/total)*100);
              const pLow = Math.round((d.low/total)*100);

              return `
              <div class="dist-row">
                <div class="dist-label">${g}</div>
                <div class="dist-cell"><span style="color: #059669;">${d.high} (${pHigh}%)</span></div>
                <div class="dist-cell"><span style="color: #ca8a04;">${d.basic} (${pBasic}%)</span></div>
                <div class="dist-cell"><span style="color: #dc2626;">${d.low} (${pLow}%)</span></div>
              </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="firma avoid-break">
          <div class="firma-line"></div>
          <div style="font-weight: 800; font-size: 12px; text-transform: uppercase; color: #0f172a;">${teacherProfile.name}</div>
          <div style="font-size: 10px; color: #64748b; font-weight: 600;">DOCENTE DE ${masterData.subjects?.join(", ") || "ÁREA"}</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([reportHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
