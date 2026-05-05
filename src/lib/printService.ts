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

const INSTITUTION = "INSTITUCIÓN EDUCATIVA TÉCNICO AMBIENTAL BAJO MIRA Y FRONTERA";
const SUB_HEADER  = "EduManager — Sistema de Gestión Docente";

function baseStyles(): string {
  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Arial', sans-serif; font-size: 11px; color: #111; padding: 20px 24px; }
      h1 { font-size: 13px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
      h2 { font-size: 11px; font-weight: 700; color: #444; margin-top: 2px; }
      .header { text-align: center; border-bottom: 2px solid #1a56db; padding-bottom: 10px; margin-bottom: 14px; }
      .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 10px; color: #555; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #1a56db; color: #fff; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 8px; text-align: left; }
      td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10px; }
      tr:nth-child(even) td { background: #f8faff; }
      .sign { margin-top: 40px; display: flex; justify-content: space-around; }
      .sign-line { text-align: center; width: 180px; }
      .sign-line hr { border: none; border-top: 1px solid #333; margin-bottom: 6px; }
      .sign-line p { font-size: 9px; text-transform: uppercase; font-weight: 700; color: #555; }
      .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #aaa; }
      @media print { body { padding: 10px; } }
    </style>
  `;
}

function nowStr(): string {
  return new Date().toLocaleDateString("es-CO", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
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

export function printStudentsByCourse(
  students: Student[],
  course: string,
  teacherName: string
) {
  const list = students.filter(s => s.curso === course && s.isActive !== false)
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

  open(`<!DOCTYPE html><html><head><title>Listado ${course}</title>${baseStyles()}</head><body>
    <div class="header">
      <h1>${INSTITUTION}</h1>
      <h2>${SUB_HEADER}</h2>
    </div>
    <div class="meta">
      <span><strong>Curso:</strong> ${course} &nbsp;|&nbsp; <strong>Total:</strong> ${list.length} estudiantes</span>
      <span><strong>Docente:</strong> ${teacherName}</span>
      <span>${nowStr()}</span>
    </div>
    <table>
      <thead><tr><th>#</th><th>Nombre Completo</th><th>Documento</th><th>Género</th><th>Firma / Visto</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="sign">
      <div class="sign-line"><hr/><p>Firma Docente</p></div>
      <div class="sign-line"><hr/><p>Firma Coordinación</p></div>
    </div>
    <div class="footer">EduManager · IETABA · Impreso el ${nowStr()}</div>
  </body></html>`);
}

export function printStudentsByGrade(
  students: Student[],
  grade: string,
  teacherName: string
) {
  const list = students.filter(s => normalizeGrade(s.grado) === grade && s.isActive !== false)
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

  open(`<!DOCTYPE html><html><head><title>Grado ${grade}</title>${baseStyles()}</head><body>
    <div class="header">
      <h1>${INSTITUTION}</h1>
      <h2>${SUB_HEADER}</h2>
    </div>
    <div class="meta">
      <span><strong>Grado:</strong> ${grade} &nbsp;|&nbsp; <strong>Total:</strong> ${list.length} estudiantes</span>
      <span><strong>Docente:</strong> ${teacherName}</span>
      <span>${nowStr()}</span>
    </div>
    <table>
      <thead><tr><th>#</th><th>Curso</th><th>Nombre Completo</th><th>Documento</th><th>Género</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">EduManager · IETABA · Impreso el ${nowStr()}</div>
  </body></html>`);
}

export function printAttendanceSheet(
  students: Student[],
  course: string,
  teacherName: string,
  subject: string,
  dateStr?: string
) {
  const list = students.filter(s => s.curso === course && s.isActive !== false)
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

  open(`<!DOCTYPE html><html><head><title>Asistencia ${course}</title>${baseStyles()}</head><body>
    <div class="header">
      <h1>${INSTITUTION}</h1>
      <h2>PLANILLA DE ASISTENCIA · ${SUB_HEADER}</h2>
    </div>
    <div class="meta">
      <span><strong>Curso:</strong> ${course} &nbsp;|&nbsp; <strong>Materia:</strong> ${subject}</span>
      <span><strong>Docente:</strong> ${teacherName}</span>
      <span><strong>Fecha:</strong> ${dateStr || nowStr()}</span>
    </div>
    <table>
      <thead><tr><th>#</th><th>Nombre Completo</th><th>✓ Presente</th><th>✗ Ausente</th><th>Observaciones</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="sign">
      <div class="sign-line"><hr/><p>Firma Docente</p></div>
      <div class="sign-line"><hr/><p>Visto Bueno Coordinación</p></div>
    </div>
    <div class="footer">EduManager · IETABA · Planilla generada el ${nowStr()}</div>
  </body></html>`);
}

export function printWeeklySchedule(
  schedule: Array<{ day: string; subject: string; course: string; startTime: string; endTime: string }>,
  teacherName: string
) {
  const DAYS = ["LUNES","MARTES","MIÉRCOLES","JUEVES","VIERNES"];
  const rows = schedule
    .sort((a,b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.startTime.localeCompare(b.startTime))
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
    <div class="header">
      <h1>${INSTITUTION}</h1>
      <h2>HORARIO SEMANAL · ${teacherName.toUpperCase()}</h2>
    </div>
    <div class="meta">
      <span>${nowStr()}</span>
    </div>
    <table>
      <thead><tr><th>#</th><th>Día</th><th>Horario</th><th>Materia</th><th>Curso</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">EduManager · IETABA</div>
  </body></html>`);
}
