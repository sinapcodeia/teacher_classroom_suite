import assert from "node:assert/strict";
import * as XLSX from "xlsx";
import {
  processSapredWorkbookInstance,
  sortStudentsBySapredOrder,
  parseSapredRoomFromSheet,
  resolveSapredSubject,
} from "../src/lib/sapredConnector";
import type { Student } from "../src/context/AppContext";

const AVAILABLE_SUBJECTS = ["TECNOLOGÍA", "FÍSICA", "MATEMÁTICAS", "ÉTICA"];

// 1. Verificar parseo de secciones y asignaturas sobre el archivo real ING_NOTAS.XLS
const wb = XLSX.readFile("scratch/ING_NOTAS.XLS");
assert.equal(wb.SheetNames.length, 12, "ING_NOTAS.XLS debe tener 12 hojas");

const sheet0 = wb.Sheets[wb.SheetNames[0]];
const rows0 = XLSX.utils.sheet_to_json<unknown[]>(sheet0, { header: 1, defval: "" });
const room0 = parseSapredRoomFromSheet(wb.SheetNames[0], String(rows0[3]?.[1] ?? ""));
assert.deepEqual(room0, { grade: "5°", course: "1", roomKey: "5-1" });

assert.equal(resolveSapredSubject("TECNOLOGÃA PROPIA E INFORMÃTICA", "5-1__TPI", "60", AVAILABLE_SUBJECTS), "TECNOLOGÍA");
assert.equal(resolveSapredSubject("FISICA", "6-6__FIS", "36", AVAILABLE_SUBJECTS), "FÍSICA");
assert.equal(resolveSapredSubject("MATEMÃÂTICAS", "6-6__MATE", "4", AVAILABLE_SUBJECTS), "MATEMÁTICAS");
assert.equal(resolveSapredSubject("Ã‰TICA Y VALORES", "8-2__ETIC", "9", AVAILABLE_SUBJECTS), "ÉTICA");

// 2. Construir estudiantes exactos desde las 12 hojas del archivo real + notas en p2 (incluyendo 0.0)
const studentsMap = new Map<string, Student>();
const expectedOrder5_1: string[] = [];

for (const sName of wb.SheetNames) {
  const sRows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sName], { header: 1, defval: "" });
  const rInfo = parseSapredRoomFromSheet(sName, String(sRows[3]?.[1] ?? ""))!;
  const hIdx = sRows.findIndex(r => Array.isArray(r) && r.some(c => String(c).trim().toUpperCase() === "CODIGO"));
  for (let i = hIdx + 1; i < sRows.length; i++) {
    const row = sRows[i];
    const first = String(row?.[0] ?? "").trim().toUpperCase();
    if (!first || first === "CONVENCIONES" || first.startsWith("ELABORADO POR")) break;
    const code = String(row[0]).replace(/\.0+$/, "").trim();
    if (sName === "5-1__TPI") expectedOrder5_1.push(code);
    if (!studentsMap.has(code)) {
      const apTokens = String(row[1] ?? "").trim().split(/\s+/).filter(Boolean);
      const nmTokens = String(row[2] ?? "").trim().split(/\s+/).filter(Boolean);
      const ap1 = apTokens[0] || "AP";
      const ap2 = apTokens.slice(1).join(" ");
      const nm1 = nmTokens[0] || "NM";
      const nm2 = nmTokens.slice(1).join(" ");
      studentsMap.set(code, {
        id: `st-${code}`,
        nroDocumento: code,
        tipoDocumento: "T.I.",
        primerApellido: ap1,
        segundoApellido: ap2,
        primerNombre: nm1,
        segundoNombre: nm2,
        fechaNacimiento: "2012-01-01",
        genero: "M",
        grado: rInfo.grade,
        curso: rInfo.course,
        avgGrade: 0,
        attendance: "100%",
        isActive: true,
        grades: [],
        detailedGrades: {
          "TECNOLOGÍA": {
            p2: {
              sb: [0, 4.5, null, null, null, null, null, null],
              sbh: [4.0, null, null, null, null, null, null, null],
              sr: [4.2, null, null, null, null],
              cv: [4.8, null, null],
              aut: 4.9,
              rec: 3.5,
            },
          },
        },
      });
    }
  }
}

const fullStudents = Array.from(studentsMap.values());
const wbClean = XLSX.readFile("scratch/ING_NOTAS.XLS");
const resOk = processSapredWorkbookInstance(XLSX, wbClean, fullStudents, AVAILABLE_SUBJECTS, "p2");

assert.equal(resOk.hasBlockingErrors, false, `No debe haber errores bloqueantes, encontrados: ${JSON.stringify(resOk.novelties)}`);
assert.equal(resOk.totalSheets, 12);
assert.deepEqual(resOk.sapredOrders["5-1"], expectedOrder5_1, "Debe preservar el orden exacto de SAPRED para 5-1");

// Verificar que SB1=0 y AUT=4.9 fueron escritos en la fila 7 de 5-1__TPI y que PARC/REC/DEF no existen
const filledRows0 = XLSX.utils.sheet_to_json<unknown[]>(resOk.workbook.Sheets["5-1__TPI"], { header: 1, defval: "" });
assert.equal(filledRows0[6].length, 28, "Encabezado SAPRED debe mantenerse en 28 columnas hasta AUT");
assert.equal(filledRows0[7][3], 0, "SB1 debe conservar el 0.0 real");
assert.equal(filledRows0[7][4], 4.5, "SB2 debe ser 4.5");
assert.equal(filledRows0[7][27], 4.9, "AUT debe ser 4.9");

// Verificar sortStudentsBySapredOrder
const reversed5_1 = fullStudents.filter(s => s.grado === "5°" && s.curso === "1").reverse();
const sorted5_1 = sortStudentsBySapredOrder(reversed5_1, resOk.sapredOrders);
assert.deepEqual(
  sorted5_1.map(s => s.nroDocumento),
  expectedOrder5_1,
  "sortStudentsBySapredOrder debe restaurar exactamente el orden no alfabético de SAPRED"
);

// 3. Probar regla Todo o Nada: agregar estudiante nuevo en EduManager que falta en SAPRED
const wbBlocked = XLSX.readFile("scratch/ING_NOTAS.XLS");
const studentsWithExtra: Student[] = [
  ...fullStudents,
  {
    id: "st-nuevo-999",
    nroDocumento: "9999999999",
    tipoDocumento: "T.I.",
    primerApellido: "NUEVO",
    segundoApellido: "INGRESO",
    primerNombre: "JUAN",
    segundoNombre: "",
    fechaNacimiento: "2012-01-01",
    genero: "M",
    grado: "5°",
    curso: "1",
    avgGrade: 0,
    attendance: "100%",
    isActive: true,
    grades: [],
  },
];
const resBlocked = processSapredWorkbookInstance(XLSX, wbBlocked, studentsWithExtra, AVAILABLE_SUBJECTS, "p2");
assert.equal(resBlocked.hasBlockingErrors, true, "Debe bloquear si falta un estudiante matriculado en SAPRED");
assert.ok(resBlocked.novelties.some(n => n.type === "FALTA_EN_SAPRED" && n.codigo === "9999999999"));

console.log("OK test-sapred-connector: todas las aserciones pasaron (12 hojas ING_NOTAS.XLS + orden + Todo o Nada).");
