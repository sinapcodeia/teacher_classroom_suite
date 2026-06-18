"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { 
  doc, getDoc, setDoc, collection, getDocs, updateDoc, 
  writeBatch, onSnapshot, query, where 
} from "firebase/firestore";

// ── NORMALIZACIÓN DE GRADOS ────────────────────────────────────────────────────
// Convierte cualquier formato de grado del CSV al formato estándar del catálogo.
// Ej: "6", "SEXTO", "6to" → "6°" | "PRIMARIA", "0", "PRIM" → "PRIMARIA"
export function normalizeGrade(raw: string | undefined | null): string {
  if (!raw) return "PREESCOLAR";
  const s = raw.toString().trim().toUpperCase();

  // Mapeo específico de Preescolar/Transición
  if (s === "0" || s === "CERO" || s === "TRANSICIÓN" || s === "TRANSICION" || s === "PREESCOLAR" || s === "JARDÍN" || s === "JARDIN" || s === "KÍNDER" || s === "KINDER") {
    return "PREESCOLAR";
  }

  // Si ya tiene el formato correcto (N°)
  if (/^\d+°$/.test(s)) return s;

  // Mapeo numérico: Extraer solo el primer número
  // Esto evita que "5-1" o "6A" contaminen el grado
  const numMatch = s.match(/^(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1]);
    if (n === 0) return "PREESCOLAR";
    if (n >= 1 && n <= 11) return `${n}°`;
  }

  // Mapeo textual
  const wordMap: Record<string, string> = {
    PRIMERO: "1°", SEGUNDO: "2°", TERCERO: "3°", CUARTO: "4°", QUINTO: "5°", 
    SEXTO: "6°", SEPTIMO: "7°", SÉPTIMO: "7°", OCTAVO: "8°", NOVENO: "9°",
    DECIMO: "10°", DÉCIMO: "10°", ONCE: "11°", UNDECIMO: "11°", UNDÉCIMO: "11°",
  };
  
  for (const [key, val] of Object.entries(wordMap)) {
    if (s.includes(key)) return val;
  }

  // Fallback
  return s;
}

// ── FORMATEO DE TEXTO (Title Case) ─────────────────────────────────────────────
// Convierte "JUAN PEREZ" o "juan perez" → "Juan Perez"
export function toTitleCase(str: string | undefined | null): string {
  if (!str) return "";
  return str.toLowerCase().split(' ').map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

// ── TYPES ────────────────────────────────────────────────────────────────────

export interface ScheduleBlock {
  id: string;
  day: "LUNES" | "MARTES" | "MIÉRCOLES" | "JUEVES" | "VIERNES";
  startTime: string;  // "07:30"
  endTime: string;    // "08:30"
  subject: string;
  grade: string;      // "5°", "6°"
  course: string;     // "5-1", "6A"
  color?: string;
}

export interface AgendaNote {
  id: string;
  date: string;
  course: string;
  subject: string;
  grade?: string;
  type: "TASK" | "NO_CLASS" | "GENERAL";
  content: string;
  isCompleted?: boolean;
}


export interface Subtopic {
  title: string;
  status: "pending" | "next" | "completed";
}

export interface Topic {
  id: string;
  title: string; // piankammuMi (Hilos del Saber - Núcleo Temático)
  date?: string;
  status: "covered" | "active" | "not_started";
  
  // Nuevos campos institucionales Awá
  tuhPutkamna?: string; // Higra del Conocimiento
  panapain?: string;    // Competencias Sabidurías: Saberes Propios
  nanpaskas?: string;   // Competencias Sabidurías: Saberes Interculturales
  katkinAizpa?: string; // Ayudas Pedagógicas
  satIshkit?: string;   // Metodología (Tejiendo Aprendo)
  hijosSaber?: string;  // Hijos del Saber (Subtemas específicos)
  
  objectives?: string[]; // (Mantenido por compatibilidad)
  subtopics?: Subtopic[]; // (Mantenido por compatibilidad)
}

export interface Unit {
  id: string;
  title: string; // Primer Periodo, Segundo Periodo, Tercer Periodo
  order: number;
  topics: Topic[];
}

export interface Curriculum {
  id: string;
  subjectId: string; // e.g., "TECNOLOGÍA"
  grade: string;
  objective?: string; // Objetivo general de la materia (del Tejido de Aprendizaje)
  units: Unit[]; // Serán siempre 3 periodos
}

export type Grade = {
  id: string;
  title: string;
  score: number;
  type: 'activity' | 'participation' | 'exam';
  date: string;
  periodId?: string;
}

export type DetailedGrades = {
  sb: (number | null)[]; // Saber (8 slots)
  sbh: (number | null)[]; // Saber-Hacer (8 slots)
  sr: (number | null)[]; // Ser (5 slots)
  cv: (number | null)[]; // Convivencia (3 slots)
  aut: number | null;     // Autoevaluación
};

export const calculateDetailedFinal = (detailed: DetailedGrades) => {
  const getAvg = (vals: (number | null)[]) => {
    const valid = vals.filter(v => v !== null) as number[];
    return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
  };

  const sbAvg = getAvg(detailed.sb);
  const sbhAvg = getAvg(detailed.sbh);
  const srAvg = getAvg(detailed.sr);
  const cvAvg = getAvg(detailed.cv);
  const aut = detailed.aut || 0;

  // Pesos Institucionales IETABA
  // Saber (30%), Saber-Hacer (40%), Ser (20%), Convivencia (5%), Auto (5%)
  const final = (sbAvg * 0.3) + (sbhAvg * 0.4) + (srAvg * 0.2) + (cvAvg * 0.05) + (aut * 0.05);
  return Number(final.toFixed(1));
};

interface Subject {
  id: string;
  name: string;
  courses: string;
  color: string;
}

export interface Student {
  id: string;
  nroDocumento: string;
  tipoDocumento: string;
  primerApellido: string;
  segundoApellido: string;
  primerNombre: string;
  segundoNombre: string;
  curso: string;
  grado: string;
  fechaNacimiento: string;
  genero: string;
  avgGrade: number;
  attendance: string;
  attendanceRecord?: Record<string, string>;
  present?: boolean;
  acudienteNombre?: string;
  acudienteTelefono?: string;
  isActive: boolean;
  grades?: Grade[];
  detailedGrades?: Record<string, Record<string, DetailedGrades>>; // subjectId -> periodId -> grades
  observations?: string;
  audit?: {
    createdBy: string;
    createdAt: string;
    updatedBy?: string;
    updatedAt?: string;
  }
}

// Legacy format kept for backward-compat on some views
interface ScheduleEntry {
  day: string;
  time: string;
  subject: string;
  grade: string;
  group: string;
  color: string;
}

interface MasterData {
  subjects: string[];
  grades: string[];
  teachers: string[];
  courses: string[]; // Grupos específicos (ej: 8-1, 8-2)
  activePeriod: string;
  periodStatus: Record<string, "open" | "closed">;
}

export interface TeacherProfile {
  // Identity
  name: string;          // Full display name (UPPERCASE)
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  photoURL?: string;

  // Institution
  institution: string;
  location: string;

  // Role & Status
  role: "RECTOR" | "COORDINADOR" | "BIENESTAR" | "DOCENTE";
  status: "ACTIVE" | "PENDING";
  isSuperAdmin?: boolean;
  acceptedTerms?: boolean;

  // Teaching config
  teachingGrades: string[];    // ["1°","2°","5°","6°"]
  teachingCourses: string[];   // ["5-1","5-2","6-3"]
  teachingSubjectsList: string[]; // ["TECNOLOGÍA","MATEMÁTICAS"]

  // Onboarding & Activity
  isProfileComplete: boolean;
  lastLogin?: string;

  // Weekly schedule (structured)
  weeklySchedule: ScheduleBlock[];
}

// Backward compat alias
export type Profile = TeacherProfile;

interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: Profile["role"];
  status: "ACTIVE" | "PENDING";
  isSuperAdmin?: boolean;
  lastLogin?: string;
}

interface AppContextType {
  // AUTH
  user: User | null;
  authLoading: boolean;
  logout: () => Promise<void>;
  // PROFILE
  profile: TeacherProfile;
  setProfile: (profile: TeacherProfile) => void;
  updateProfile: (updates: Partial<TeacherProfile>) => Promise<void>;
  // DATA
  subjects: Subject[];
  setSubjects: (s: Subject[]) => void;
  students: Student[];
  myStudents: Student[]; // Lista filtrada por gobernanza
  studentsLoading: boolean;
  setStudents: (students: Student[]) => void;
  addStudent: (student: Omit<Student, "id">) => Promise<void>;
  importStudents: (incoming: Omit<Student, "id">[]) => Promise<{ novelties: any[], notFound: string[] }>;
  removeStudent: (id: string) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
   updateDetailedGrades: (studentId: string, subjectId: string, periodId: string, grades: DetailedGrades) => Promise<void>;
   importDetailedGrades: (subjectId: string, periodId: string, data: { studentId: string, detailed: DetailedGrades }[]) => Promise<void>;
   updateSingleDetailedGrade: (studentId: string, subjectId: string, periodId: string, category: keyof DetailedGrades, index: number, score: number | null) => Promise<void>;
  addGrade: (studentId: string, grade: Omit<Grade, "id">) => Promise<void>;
  masterData: MasterData;
  updateMasterData: (key: keyof MasterData, list: string[]) => void;
  updateMasterItem: (key: keyof MasterData, oldItem: string, newItem: string) => void;
  removeMasterItem: (key: keyof MasterData, item: string) => void;
  addSubject: (subject: Omit<Subject, "id">) => void;
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  schedule: ScheduleEntry[];
  setSchedule: (schedule: ScheduleEntry[]) => void;
  togglePeriodStatus: (periodId: string, status: "open" | "closed") => void;
  setActivePeriod: (periodId: string) => void;
  governanceStats: {
    birthdaysToday: Student[];
    birthdaysMonth: Student[];
    gender: { m: number; f: number; parity: number };
    extraedad: Student[];
    totalActive: number;
  };
  agendaNotes: AgendaNote[];
  addAgendaNote: (note: Omit<AgendaNote, "id">) => Promise<void>;
  updateAgendaNote: (id: string, updates: Partial<AgendaNote>) => Promise<void>;
  updateAgendaNotesBatch: (ids: string[], updates: Partial<AgendaNote>) => Promise<void>;
  deleteAgendaNotesBatch: (ids: string[]) => Promise<void>;
  clearAllAgendaNotes: () => Promise<void>;
  clearPendingTasks: () => Promise<void>;
  clearAllTasks: () => Promise<void>;
  // USER MANAGEMENT
  allUsers: AppUser[];
  refreshUsers: () => Promise<void>;
  updateUserRole: (uid: string, role: Profile["role"]) => Promise<void>;
  createEmailUser: (email: string, pass: string, name: string, role: Profile["role"]) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  acceptTerms: () => Promise<void>;
  saveDailyAttendance: (dateStr: string, records: Record<string, string>) => Promise<void>;
  isOnline: boolean;
  // CURRICULUM
  curriculum: Curriculum[];
  updateTopicStatus: (curriculumId: string, unitId: string, topicId: string, status: Topic["status"]) => Promise<void>;
  saveCurriculumLocal: (data: Curriculum) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_PROFILE: TeacherProfile = {
  name: "USUARIO",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  institution: "IETABA",
  location: "EL DIVISO / NARIÑO",
  role: "DOCENTE",
  status: "PENDING",
  acceptedTerms: false,
  isSuperAdmin: false,
  teachingGrades: [],
  teachingCourses: [],
  teachingSubjectsList: [],
  isProfileComplete: false,
  weeklySchedule: [],
};

const SUPER_ADMINS = ["sinapcodeia@gmail.com", "antonio_rburgos@msn.com"];

// ── SCHEDULE COLORS ───────────────────────────────────────────────────────────
const BLOCK_COLORS = [
  "bg-amber-100 text-amber-900 border-amber-200",
  "bg-sky-100 text-sky-900 border-sky-200",
  "bg-emerald-100 text-emerald-900 border-emerald-200",
  "bg-lime-100 text-lime-900 border-lime-200",
  "bg-purple-100 text-purple-900 border-purple-200",
  "bg-pink-100 text-pink-900 border-pink-200",
  "bg-orange-100 text-orange-900 border-orange-200",
  "bg-cyan-100 text-cyan-900 border-cyan-200",
];

/** Convert ScheduleBlock[] → legacy ScheduleEntry[] for backward compat */
function blocksToEntries(blocks: ScheduleBlock[]): ScheduleEntry[] {
  return blocks.map((b, i) => ({
    day: b.day,
    time: `${b.startTime} - ${b.endTime}`,
    subject: b.subject,
    grade: b.grade,
    group: b.course,
    color: b.color || BLOCK_COLORS[i % BLOCK_COLORS.length],
  }));
}

// ── DEFAULT SCHEDULE (Official IETABA - Jesus Antonio Rodriguez) ──────────────
const DEFAULT_SCHEDULE_BLOCKS: ScheduleBlock[] = [
  { id:"s1",  day:"LUNES",     startTime:"07:30", endTime:"08:30", subject:"TECNOLOGÍA",  grade:"8°", course:"3", color:"bg-blue-100 text-blue-900 border-blue-200" },
  { id:"s2",  day:"LUNES",     startTime:"08:30", endTime:"09:30", subject:"TECNOLOGÍA",  grade:"8°", course:"3", color:"bg-blue-100 text-blue-900 border-blue-200" },
  { id:"s3",  day:"LUNES",     startTime:"09:30", endTime:"10:30", subject:"MATEMÁTICAS", grade:"6°", course:"6", color:"bg-emerald-100 text-emerald-900 border-emerald-200" },
  { id:"s4",  day:"LUNES",     startTime:"11:00", endTime:"11:50", subject:"TECNOLOGÍA",  grade:"6°", course:"3", color:"bg-purple-100 text-purple-900 border-purple-200" },
  { id:"s5",  day:"LUNES",     startTime:"11:50", endTime:"12:40", subject:"TECNOLOGÍA",  grade:"6°", course:"6", color:"bg-blue-100 text-blue-900 border-blue-200" },
  
  { id:"s6",  day:"MARTES",    startTime:"07:30", endTime:"08:30", subject:"TECNOLOGÍA",  grade:"6°", course:"6", color:"bg-blue-100 text-blue-900 border-blue-200" },
  { id:"s7",  day:"MARTES",    startTime:"08:30", endTime:"09:30", subject:"TECNOLOGÍA",  grade:"6°", course:"6", color:"bg-blue-100 text-blue-900 border-blue-200" },
  { id:"s8",  day:"MARTES",    startTime:"09:30", endTime:"10:30", subject:"TECNOLOGÍA",  grade:"9°", course:"2", color:"bg-rose-100 text-rose-900 border-rose-200" },
  { id:"s9",  day:"MARTES",    startTime:"11:00", endTime:"11:50", subject:"TECNOLOGÍA",  grade:"9°", course:"4", color:"bg-rose-100 text-rose-900 border-rose-200" },
  { id:"s10", day:"MARTES",    startTime:"11:50", endTime:"12:40", subject:"MATEMÁTICAS", grade:"6°", course:"6", color:"bg-emerald-100 text-emerald-900 border-emerald-200" },

  { id:"s11", day:"MIÉRCOLES", startTime:"07:30", endTime:"08:30", subject:"TECNOLOGÍA",  grade:"7°", course:"4", color:"bg-cyan-100 text-cyan-900 border-cyan-200" },
  { id:"s12", day:"MIÉRCOLES", startTime:"08:30", endTime:"09:30", subject:"TECNOLOGÍA",  grade:"7°", course:"4", color:"bg-cyan-100 text-cyan-900 border-cyan-200" },
  { id:"s13", day:"MIÉRCOLES", startTime:"09:30", endTime:"10:30", subject:"TECNOLOGÍA",  grade:"6°", course:"3", color:"bg-purple-100 text-purple-900 border-purple-200" },
  { id:"s14", day:"MIÉRCOLES", startTime:"12:40", endTime:"13:30", subject:"MATEMÁTICAS", grade:"6°", course:"6", color:"bg-emerald-100 text-emerald-900 border-emerald-200" },

  { id:"s15", day:"JUEVES",    startTime:"07:30", endTime:"08:30", subject:"TECNOLOGÍA",  grade:"5°", course:"1", color:"bg-amber-100 text-amber-900 border-amber-200" },
  { id:"s15b",day:"JUEVES",    startTime:"08:30", endTime:"09:30", subject:"TECNOLOGÍA",  grade:"5°", course:"1", color:"bg-amber-100 text-amber-900 border-amber-200" },
  { id:"s16", day:"JUEVES",    startTime:"09:30", endTime:"10:30", subject:"MATEMÁTICAS", grade:"6°", course:"6", color:"bg-emerald-100 text-emerald-900 border-emerald-200" },
  { id:"s17", day:"JUEVES",    startTime:"11:00", endTime:"11:50", subject:"TECNOLOGÍA",  grade:"5°", course:"2", color:"bg-lime-100 text-lime-900 border-lime-200" },
  { id:"s18", day:"JUEVES",    startTime:"11:50", endTime:"12:40", subject:"TECNOLOGÍA",  grade:"5°", course:"2", color:"bg-lime-100 text-lime-900 border-lime-200" },

  { id:"s19", day:"VIERNES",   startTime:"07:30", endTime:"08:30", subject:"TECNOLOGÍA",  grade:"7°", course:"3", color:"bg-cyan-100 text-cyan-900 border-cyan-200" },
  { id:"s20", day:"VIERNES",   startTime:"08:30", endTime:"09:30", subject:"TECNOLOGÍA",  grade:"7°", course:"3", color:"bg-cyan-100 text-cyan-900 border-cyan-200" },
  { id:"s21", day:"VIERNES",   startTime:"09:30", endTime:"10:30", subject:"ÉTICA",       grade:"8°", course:"2", color:"bg-orange-100 text-orange-900 border-orange-200" },
  { id:"s22", day:"VIERNES",   startTime:"11:00", endTime:"11:50", subject:"FÍSICA",      grade:"6°", course:"6", color:"bg-rose-100 text-rose-900 border-rose-200" },
  { id:"s23", day:"VIERNES",   startTime:"11:50", endTime:"12:40", subject:"MATEMÁTICAS", grade:"6°", course:"6", color:"bg-emerald-100 text-emerald-900 border-emerald-200" },
  { id:"s24", day:"VIERNES",   startTime:"12:40", endTime:"13:30", subject:"FÍSICA",      grade:"7°", course:"2", color:"bg-rose-100 text-rose-900 border-rose-200" },
];

// ── PROVIDER ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const [agendaNotes, setAgendaNotes] = useState<AgendaNote[]>([]);
  const [curriculum, setCurriculum] = useState<Curriculum[]>([]);
  const [profile, setProfile] = useState<TeacherProfile>(DEFAULT_PROFILE);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  const [masterData, setMasterData] = useState<MasterData>({
    subjects: ["TECNOLOGÍA", "MATEMÁTICAS", "FÍSICA", "ÉTICA"],
    grades: ["PREESCOLAR", "1°", "2°", "3°", "4°", "5°", "6°", "7°", "8°", "9°", "10°", "11°"],
    teachers: ["ANTONIO RODRIGUEZ"],
    courses: ["1", "2", "3", "4", "5", "6"],
    activePeriod: "p2",
    periodStatus: { p1: "closed", p2: "open", p3: "closed" }
  });

  const [subjects, setSubjects] = useState<Subject[]>([
    { id: "sub-1", name: "TECNOLOGÍA",  courses: "1, 2, 3, 4, 5, 6", color: "bg-blue-500" },
    { id: "sub-2", name: "MATEMÁTICAS", courses: "6", color: "bg-green-500" },
    { id: "sub-3", name: "FÍSICA",      courses: "6, 2", color: "bg-orange-500" },
    { id: "sub-4", name: "ÉTICA",       courses: "2", color: "bg-yellow-500" },
  ]);

  const [students, setStudents] = useState<Student[]>([]);

  // ── GOBERNANZA DE DATOS (Governance) ─────────────────────────────────────────
  const myStudents = React.useMemo(() => {
    if (!profile || profile.isSuperAdmin || ["RECTOR", "COORDINADOR", "BIENESTAR"].includes(profile.role)) {
      return students;
    }
    return students.filter(s => {
      const gNormalized = normalizeGrade(s.grado).trim().toUpperCase();
      const sCurso = (s.curso || "").toString().trim().toUpperCase();
      const studentRoom = `${gNormalized}-${sCurso}`;
      
      const courseOnly = sCurso.includes('-') ? sCurso.split('-').pop()?.trim() : sCurso;
      const studentRoomAlt = `${gNormalized}-${courseOnly}`;
      
      const normalizedTeaching = (profile.teachingCourses || []).map(tc => {
        const parts = tc.split('-');
        if (parts.length === 2) {
          const g = normalizeGrade(parts[0]).trim().toUpperCase();
          const c = parts[1].trim().toUpperCase();
          return `${g}-${c}`;
        }
        return tc.trim().toUpperCase();
      });

      const matchesRoom = normalizedTeaching.includes(studentRoom) || normalizedTeaching.includes(studentRoomAlt);
      
      // Super Fallback: Si el grado coincide, lo mostramos (Gobernanza Relajada)
      const teacherGrades = (profile.teachingGrades || []).map(g => normalizeGrade(g).trim().toUpperCase());
      const matchesGrade = teacherGrades.includes(gNormalized);

      return matchesRoom || matchesGrade;
    });
  }, [students, profile]);

  // Schedule: derived from weeklySchedule in profile, with legacy fallback
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(
    blocksToEntries(DEFAULT_SCHEDULE_BLOCKS)
  );

  // ── AUTH LISTENER ──────────────────────────────────────────────────────────
  useEffect(() => {
    let unsubs: Array<() => void> = [];

    // --- MOCK/SANDBOX AUTHENTICATION BYPASS FOR LOCAL DEVELOPMENT ---
    if (typeof window !== "undefined" && localStorage.getItem("demo_role")) {
      const demoRole = localStorage.getItem("demo_role");
      const email = demoRole === "superadmin" ? "sinapcodeia@gmail.com" : "docenciainformatica2025@gmail.com";
      const isSuperAdmin = demoRole === "superadmin";
      
      const mockUser = {
        uid: "mock-uid-12345",
        email,
        displayName: isSuperAdmin ? "SUPER ADMIN DEMO" : "DOCENTE DEMO",
        photoURL: null,
      };

      const derivedCourses = Array.from(new Set(DEFAULT_SCHEDULE_BLOCKS.map(b => `${normalizeGrade(b.grade)}-${b.course}`)));
      const derivedGrades = Array.from(new Set(DEFAULT_SCHEDULE_BLOCKS.map(b => normalizeGrade(b.grade))));

      const builtProfile: TeacherProfile = {
        ...DEFAULT_PROFILE,
        name: isSuperAdmin ? "RECTOR DE DEMOSTRACIÓN" : "DOCENTE DE DEMOSTRACIÓN",
        firstName: isSuperAdmin ? "RECTOR" : "DOCENTE",
        lastName: "DEMOSTRACIÓN",
        phone: "3000000000",
        email,
        photoURL: "",
        role: isSuperAdmin ? "RECTOR" : "DOCENTE",
        status: "ACTIVE",
        acceptedTerms: true,
        isSuperAdmin,
        teachingGrades: isSuperAdmin ? [] : derivedGrades,
        teachingCourses: isSuperAdmin ? [] : derivedCourses,
        teachingSubjectsList: isSuperAdmin ? [] : ["TECNOLOGÍA", "MATEMÁTICAS", "FÍSICA", "ÉTICA"],
        isProfileComplete: true,
        weeklySchedule: isSuperAdmin ? [] : DEFAULT_SCHEDULE_BLOCKS,
      };

      setUser(mockUser as any);
      setProfile(builtProfile);
      setSchedule(blocksToEntries(builtProfile.weeklySchedule));

      const unsubscribeStudents = onSnapshot(collection(db, "students"), (snap) => {
        const firestoreStudents = snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            grado: normalizeGrade(data.grado as string),
            curso: (data.curso || "").toString().trim().toUpperCase(),
          } as Student;
        });
        setStudents(firestoreStudents);
        setStudentsLoading(false);
      }, (err) => {
        console.warn("Mock Mode: Could not fetch real-time students", err);
        setStudentsLoading(false);
      });
      unsubs.push(unsubscribeStudents);

      const unsubscribeAgenda = onSnapshot(collection(db, "agendaNotes"), (snap) => {
        const notes = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgendaNote));
        setAgendaNotes(notes);
      }, (err) => {
        console.warn("Mock Mode: Could not fetch real-time agenda", err);
      });
      unsubs.push(unsubscribeAgenda);

      const unsubscribeCurriculum = onSnapshot(collection(db, "curriculum"), (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Curriculum));
        setCurriculum(items);
      }, (err) => {
        console.warn("Mock Mode: Could not fetch real-time curriculum", err);
      });
      unsubs.push(unsubscribeCurriculum);

      setAuthLoading(false);
      return () => {
        unsubs.forEach(unsub => unsub());
      };
    }
    // --- END MOCK/SANDBOX AUTHENTICATION BYPASS ---

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Limpiar suscripciones previas al cambiar de estado de autenticación
      unsubs.forEach(unsub => unsub());
      unsubs = [];

      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const isSuperAdmin = SUPER_ADMINS.includes(firebaseUser.email || "");

        // 1. Verificar existencia/actualizar en segundo plano de manera no bloqueante
        const checkAndCreateUser = async () => {
          try {
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) {
              const newDoc = {
                role: isSuperAdmin ? "RECTOR" : "DOCENTE",
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                isSuperAdmin,
                status: isSuperAdmin ? "ACTIVE" : "PENDING",
                acceptedTerms: false,
                isProfileComplete: isSuperAdmin ? true : false,
                firstName: "",
                lastName: "",
                phone: "",
                teachingGrades: [],
                teachingCourses: [],
                teachingSubjectsList: [],
                weeklySchedule: [],
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
              };
              await setDoc(userDocRef, newDoc);
            } else {
              await updateDoc(userDocRef, { lastLogin: new Date().toISOString() });
            }
          } catch (e) {
            console.warn("Fallo no bloqueante en verificación de perfil (posiblemente offline):", e);
          }
        };
        checkAndCreateUser();

        // 2. Suscribir inmediatamente en tiempo real a todos los canales (carga instantánea desde caché local)
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (!docSnap.exists()) {
            const tempProfile: TeacherProfile = {
              ...DEFAULT_PROFILE,
              name: (firebaseUser.displayName || "USUARIO").toUpperCase(),
              email: firebaseUser.email || "",
              role: isSuperAdmin ? "RECTOR" : "DOCENTE",
              status: isSuperAdmin ? "ACTIVE" : "PENDING",
              isSuperAdmin,
            };
            setProfile(tempProfile);
            return;
          }
          const savedData = docSnap.data() as Partial<TeacherProfile>;
          
          // ── AUTO-PATCH: docenciainformatica2025@gmail.com ──────────────────
          if (firebaseUser.email === "docenciainformatica2025@gmail.com") {
            const updates: any = {};
            
            if (!savedData.firstName) {
              savedData.firstName = "JESUS ANTONIO";
              updates.firstName = "JESUS ANTONIO";
            }
            if (!savedData.lastName) {
              savedData.lastName = "RODRIGUEZ";
              updates.lastName = "RODRIGUEZ";
            }
            
            if ((savedData.weeklySchedule?.length ?? 0) === 0) {
              const derivedCourses = Array.from(new Set(DEFAULT_SCHEDULE_BLOCKS.map(b => `${normalizeGrade(b.grade)}-${b.course}`)));
              const derivedGrades = Array.from(new Set(DEFAULT_SCHEDULE_BLOCKS.map(b => normalizeGrade(b.grade))));
              
              savedData.weeklySchedule = DEFAULT_SCHEDULE_BLOCKS;
              savedData.teachingCourses = derivedCourses;
              savedData.teachingGrades = derivedGrades;
              
              updates.weeklySchedule = DEFAULT_SCHEDULE_BLOCKS;
              updates.teachingCourses = derivedCourses;
              updates.teachingGrades = derivedGrades;
            }
            
            if (Object.keys(updates).length > 0) {
              savedData.isProfileComplete = true;
              updates.isProfileComplete = true;
              updateDoc(userDocRef, updates).catch(e => console.warn("Offline patch", e));
            }
          }

          const currentSchedule = isSuperAdmin ? [] : (savedData.weeklySchedule || []);
          let currentCourses = savedData.teachingCourses || [];
          let currentGrades = savedData.teachingGrades || [];
          
          if (currentCourses.length === 0 && currentSchedule.length > 0) {
            currentCourses = Array.from(new Set(currentSchedule.map((b: any) => `${normalizeGrade(b.grade)}-${b.course}`)));
          }
          if (currentGrades.length === 0 && currentSchedule.length > 0) {
            currentGrades = Array.from(new Set(currentSchedule.map((b: any) => normalizeGrade(b.grade))));
          }

          const builtProfile: TeacherProfile = {
            ...DEFAULT_PROFILE,
            name: (
              savedData.firstName && savedData.lastName
                ? `${savedData.firstName} ${savedData.lastName}`
                : firebaseUser.displayName || "USUARIO"
            ).toUpperCase(),
            firstName: savedData.firstName || "",
            lastName: savedData.lastName || "",
            phone: savedData.phone || "",
            email: firebaseUser.email || "",
            photoURL: firebaseUser.photoURL || "",
            role: (savedData.role as Profile["role"]) || "DOCENTE",
            status: (savedData.status as Profile["status"]) || "ACTIVE",
            acceptedTerms: savedData.acceptedTerms || (typeof window !== "undefined" && localStorage.getItem(`edu_terms_accepted_${firebaseUser.uid}`) === "true") || false,
            isSuperAdmin,
            teachingGrades: currentGrades,
            teachingCourses: currentCourses,
            teachingSubjectsList: savedData.teachingSubjectsList || [],
            isProfileComplete: isSuperAdmin ? true : (savedData.isProfileComplete || false),
            weeklySchedule: currentSchedule,
          };

          setProfile(builtProfile);

          if (builtProfile.weeklySchedule && builtProfile.weeklySchedule.length > 0) {
            setSchedule(blocksToEntries(builtProfile.weeklySchedule));
          }
        }, (err) => {
          console.warn("Error en tiempo real (perfil):", err);
        });
        unsubs.push(unsubscribeProfile);

        // Estudiantes
        const studentsQuery = collection(db, "students");
        const unsubscribeStudents = onSnapshot(studentsQuery, (snap) => {
          const firestoreStudents = snap.docs.map(d => {
            const data = d.data();
            let computedAvg = data.avgGrade || 0;
            if (data.grades && data.grades.length > 0) {
              const validScores = data.grades.filter((g: any) => g.type !== 'participation').map((g: any) => g.score);
              const baseAvg = validScores.length > 0 ? validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length : 0;
              const bonus = data.grades.filter((g: any) => g.type === 'participation').reduce((a: number, b: any) => a + (b.score * 0.02), 0);
              computedAvg = Number(Math.min(5.0, baseAvg + bonus).toFixed(1));
            }

            return {
              id: d.id,
              ...data,
              avgGrade: computedAvg,
              grado: normalizeGrade(data.grado as string),
              curso: (data.curso || "").toString().trim().toUpperCase(),
            } as Student;
          });
          setStudents(firestoreStudents);
          setStudentsLoading(false);
        }, (err) => {
          console.warn("Error en tiempo real (estudiantes):", err);
          setStudentsLoading(false);
        });
        unsubs.push(unsubscribeStudents);

        // Agenda
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().slice(0, 10);
        const agendaQuery = query(
          collection(db, "agendaNotes"),
          where("date", ">=", thirtyDaysAgoStr)
        );
        const unsubscribeAgenda = onSnapshot(agendaQuery, (snap) => {
          const notes = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgendaNote));
          setAgendaNotes(notes);
        }, (err) => {
          console.warn("Error en tiempo real (agenda):", err);
        });
        unsubs.push(unsubscribeAgenda);

        // Currículo
        const unsubscribeCurriculum = onSnapshot(collection(db, "curriculum"), (snap) => {
          const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Curriculum));
          setCurriculum(items);
        }, (err) => {
          console.warn("Error en tiempo real (currículo):", err);
        });
        unsubs.push(unsubscribeCurriculum);

        setUser(firebaseUser);
      } else {
        setUser(null);
        setProfile(DEFAULT_PROFILE);
        setSchedule(blocksToEntries(DEFAULT_SCHEDULE_BLOCKS));
      }

      setAuthLoading(false);
    });

    // SAFETY TIMEOUT: Si en 10 segundos no ha respondido el Auth, forzamos salida del loader
    const safetyTimeout = setTimeout(() => {
      setAuthLoading(prev => {
        if (prev) console.warn("Safety Timeout: Auth tardando demasiado. Forzando resolución.");
        return false;
      });
    }, 10000);

    return () => {
      unsubscribe();
      unsubs.forEach(unsub => unsub());
      clearTimeout(safetyTimeout);
    };
  }, []);

  // ── UPDATE PROFILE ─────────────────────────────────────────────────────────
  const updateProfile = async (updates: Partial<TeacherProfile>) => {
    if (!user) return;
    try {
      const merged: TeacherProfile = { ...profile, ...updates };

      if (updates.firstName !== undefined || updates.lastName !== undefined) {
        merged.name = toTitleCase(`${merged.firstName} ${merged.lastName}`) || merged.name;
      }

      // isProfileComplete = tiene nombre Y (tiene grados manuales OR tiene horario configurado)
      const hasSchedule = (merged.weeklySchedule || []).length > 0;
      const hasManualGrades = (merged.teachingGrades || []).length > 0;
      if (merged.firstName && merged.lastName && (hasManualGrades || hasSchedule)) {
        merged.isProfileComplete = true;
      }

      // Sincronizar teachingCourses y teachingGrades automáticamente desde el horario
      if (hasSchedule) {
        const scheduleCourses = [...new Set(merged.weeklySchedule.map(b => b.course))];
        const scheduleGrades  = [...new Set(merged.weeklySchedule.map(b => b.grade))];
        const scheduleSubjects = [...new Set(merged.weeklySchedule.map(b => b.subject))];
        if (!hasManualGrades || (merged.teachingCourses || []).length === 0) {
          merged.teachingCourses = scheduleCourses;
          merged.teachingGrades = scheduleGrades;
          merged.teachingSubjectsList = scheduleSubjects;
        }
      }

      if (updates.weeklySchedule) {
        setSchedule(blocksToEntries(updates.weeklySchedule));
      }

      setProfile(merged);

      await updateDoc(doc(db, "users", user.uid), {
        firstName: merged.firstName,
        lastName: merged.lastName,
        phone: merged.phone,
        teachingGrades: merged.teachingGrades,
        teachingCourses: merged.teachingCourses,
        teachingSubjectsList: merged.teachingSubjectsList,
        weeklySchedule: merged.weeklySchedule,
        isProfileComplete: merged.isProfileComplete,
        displayName: merged.name,
      });
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      throw err;
    }
  };

  // ── USER MANAGEMENT ───────────────────────────────────────────────────────
  const refreshUsers = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList = usersSnap.docs.map(d => ({ uid: d.id, ...d.data() } as AppUser));
      setAllUsers(usersList);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  const updateUserRole = async (uid: string, role: Profile["role"]) => {
    try {
      await updateDoc(doc(db, "users", uid), { role, status: "ACTIVE" });
      await refreshUsers();
    } catch (err) {
      console.error("Error al actualizar rol de usuario:", err);
    }
  };

  const createEmailUser = async (email: string, pass: string, name: string, role: Profile["role"]) => {
    try {
      const { createUserWithEmailAndPassword } = await import("firebase/auth");
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      await setDoc(doc(db, "users", res.user.uid), {
        email, displayName: name, role, status: "ACTIVE",
        isProfileComplete: false, firstName: "", lastName: "",
        teachingGrades: [], teachingCourses: [], teachingSubjectsList: [],
        weeklySchedule: [], createdAt: new Date().toISOString(),
      });
      await refreshUsers();
    } catch (err) {
      console.error("Error al crear usuario por email:", err);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const resetPassword = async (email: string) => {
    const { sendPasswordResetEmail } = await import("firebase/auth");
    await sendPasswordResetEmail(auth, email);
  };

  const acceptTerms = async () => {
    if (!user) return;
    // 1. Update local state immediately (no esperar Firestore) para evitar bucle
    setProfile(prev => ({ ...prev, acceptedTerms: true }));
    // 2. Persistir localmente como fallback (sobrevive recargas cuando Firestore falla)
    try {
      localStorage.setItem(`edu_terms_accepted_${user.uid}`, "true");
    } catch { /* ignore */ }
    // 3. Intentar escribir en Firestore (puede fallar por reglas — no es bloqueante)
    try {
      await updateDoc(doc(db, "users", user.uid), { acceptedTerms: true });
    } catch (err) {
      console.warn("No se pudo persistir acceptedTerms en Firestore (reglas). Usando caché local.", err);
    }
  };

  // ── PERSISTENCIA LOCAL (Configuraciones y Caché de UI) ────────────────────
  useEffect(() => {
    const savedMasterData = localStorage.getItem("edu_masterData");
    const savedSubjects   = localStorage.getItem("edu_subjects");

    localStorage.removeItem("edu_schedule");
    localStorage.removeItem("edu_students"); // clear old cache
    
    if (savedMasterData) {
      try { 
        const parsed = JSON.parse(savedMasterData);
        setMasterData(prev => ({
          ...prev,
          subjects: parsed.subjects || prev.subjects,
          grades: parsed.grades || prev.grades,
          teachers: parsed.teachers || prev.teachers,
          courses: parsed.courses || prev.courses
        })); 
      } catch { /* ignore */ }
    }
    if (savedSubjects) try { setSubjects(JSON.parse(savedSubjects)); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem("edu_masterData", JSON.stringify(masterData));
    localStorage.setItem("edu_subjects", JSON.stringify(subjects));
  }, [masterData, subjects]);

  // ── AUTO-SYNC STUDENTS DATA TO MASTER DATA ────────────────────────────────
  useEffect(() => {
    if (students.length === 0) return;
    
    // Extraer grados y cursos únicos desde la colección de estudiantes (normalizados)
    const uniqueGrades = Array.from(new Set(students.map(s => normalizeGrade(s.grado)))).filter(Boolean) as string[];
    const uniqueCourses = Array.from(new Set(students.map(s => s.curso?.toUpperCase()))).filter(Boolean) as string[];

    setMasterData(prev => {
      let changed = false;
      const newGradesList = [...prev.grades];
      const newCoursesList = [...prev.courses];

      for (const g of uniqueGrades) {
        if (!newGradesList.includes(g)) {
          newGradesList.push(g);
          changed = true;
        }
      }

      for (const c of uniqueCourses) {
        if (!newCoursesList.includes(c)) {
          newCoursesList.push(c);
          changed = true;
        }
      }

      if (changed) {
        // Filtrar entradas mixtas previas (ej: "5-1") para mantener limpieza
        const cleanGrades = Array.from(new Set([...prev.grades, ...newGradesList])).filter(g => !g.includes("-"));
        const cleanCourses = Array.from(new Set([...prev.courses, ...newCoursesList])).filter(c => !c.includes("-"));

        return {
          ...prev,
          grades: cleanGrades,
          courses: cleanCourses
        };
      }
      return prev;
    });
  }, [students]);

  // NOTA: El auto-reparador de currículo fue eliminado porque causaba un bucle de
  // sobreescritura en Firestore (se activaba en cada cambio de estado de curriculum,
  // borrando los estados covered/active marcados por el docente). Si se requiere
  // una reparación de datos, debe ejecutarse como operación manual de administración.

  const updateStudent = async (id: string, updates: Partial<Student>) => {
    try {
      await updateDoc(doc(db, "students", id), updates);
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (err) {
      console.error("Error al actualizar estudiante:", err);
    }
  };

  const updateMasterItem = (category: keyof MasterData, oldValue: string, newValue: string) => {
    setMasterData(prev => {
      let finalValue = newValue;
      if (category === "grades") finalValue = normalizeGrade(newValue);
      const current = prev[category];
      if (Array.isArray(current)) {
        const updated = current.map(item => item === oldValue ? finalValue : item);
        return { ...prev, [category]: updated };
      }
      return prev;
    });
  };

  const removeMasterItem = (key: keyof MasterData, itemToDelete: string) => {
    setMasterData(prev => {
      const current = prev[key];
      if (Array.isArray(current)) {
        return { ...prev, [key]: current.filter(item => item !== itemToDelete) };
      }
      return prev;
    });
  };

  // ── HELPERS ───────────────────────────────────────────────────────────────
  const logout = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("demo_role");
    }
    await signOut(auth);
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  /** Actualiza datos maestros (grados/materias/docentes).
   *  Estrategia: SOLO AGREGA elementos nuevos, nunca elimina los existentes.
   *  Si se pasa una lista vacía, se ignora para proteger la información.
   */
  const updateMasterData = (key: keyof MasterData, listaNueva: string[]) => {
    setMasterData(prev => {
      if (listaNueva.length === 0) return prev;
      
      let finalLista = listaNueva;
      if (key === "grades") {
        finalLista = listaNueva.map(g => normalizeGrade(g));
      }
      
      const current = prev[key];
      if (Array.isArray(current)) {
        const fusionada = Array.from(new Set([...current, ...finalLista]));
        return { ...prev, [key]: fusionada };
      }
      return prev;
    });
  };

  /** Elimina un elemento de datos maestros SOLO si se confirma explícitamente.
   *  Uso interno para borrados individuales desde la UI.
   */
  const togglePeriodStatus = (periodId: string, status: "open" | "closed") => {
    setMasterData(prev => ({
      ...prev,
      periodStatus: { ...prev.periodStatus, [periodId]: status }
    }));
  };

  const setActivePeriod = (periodId: string) => {
    setMasterData(prev => ({ ...prev, activePeriod: periodId }));
  };

  const addStudent = async (student: Omit<Student, "id">) => {
    try {
      const cleanDoc = String(student.nroDocumento || "").trim();
      const studentId = `st-${cleanDoc || Date.now()}`.replace(/\s+/g, "-");
      const withAudit: Student = {
        ...student,
        id: studentId,
        grado: normalizeGrade(student.grado),
        curso: (student.curso || "").toString().trim().toUpperCase(),
        audit: {
          createdBy: profile.name || "SISTEMA",
          createdAt: new Date().toISOString()
        }
      } as Student;
      await setDoc(doc(db, "students", studentId), withAudit);
      setStudents(prev => {
        const mapa = new Map(prev.map(s => [s.id, s]));
        mapa.set(studentId, withAudit);
        return Array.from(mapa.values());
      });
    } catch (err) {
      console.error("Error al añadir estudiante en Firestore:", err);
      throw err;
    }
  };

  /** Importa estudiantes a Firestore con estrategia de fusión (merge):
   *  - Si el estudiante YA existe: actualiza solo los campos del CSV, conserva el resto
   *  - Si es NUEVO: lo crea
   *  - NUNCA elimina registros existentes
   */
  const importStudents = async (incoming: any[]) => {
    const LIMITE_LOTE = 400;
    const novelties: { student: string, oldRoom: string, newRoom: string }[] = [];
    const notFound: string[] = [];

    const conIds: Student[] = [];

    for (const s of incoming) {
      const studentId = `st-${s.nroDocumento}`.replace(/\s+/g, "-");
      const existing = students.find(ex => ex.id === studentId || ex.nroDocumento === s.nroDocumento);
      
      if (existing) {
        // Registrar novedad si cambia de salón
        if (normalizeGrade(existing.grado) !== normalizeGrade(s.grado) || existing.curso !== s.curso) {
          const nov = {
            student: `${existing.primerApellido} ${existing.primerNombre}`,
            document: existing.nroDocumento,
            oldRoom: `${existing.grado}-${existing.curso}`,
            newRoom: `${s.grado}-${s.curso}`
          };
          novelties.push(nov);

          // Crear TAREA automática para subsanar/atender el traslado
          addAgendaNote({
            date: new Date().toISOString().slice(0, 10),
            course: s.curso,
            subject: "GENERAL",
            type: "TASK",
            content: `[SUBSANAR] Confirmar traslado de alumno: ${nov.student} desde ${nov.oldRoom} hacia ${nov.newRoom}.`,
            isCompleted: false
          });
        }
        
        conIds.push({
          ...existing,
          grado: s.grado,
          curso: s.curso,
          isActive: true,
          audit: {
            createdBy: existing.audit?.createdBy || "SISTEMA",
            createdAt: existing.audit?.createdAt || new Date().toISOString(),
            updatedBy: profile.name || "SISTEMA",
            updatedAt: new Date().toISOString()
          }
        });
      } else if (s.primerNombre) {
        // Es un estudiante completamente nuevo (tiene nombre)
        conIds.push({
          ...s,
          id: studentId,
          isActive: true,
          avgGrade: s.avgGrade || 0,
          attendance: s.attendance || "100%",
          audit: {
            createdBy: profile.name || "SISTEMA",
            createdAt: new Date().toISOString()
          }
        });
      } else {
        // No existe y el docente no envió nombre (error de búsqueda)
        notFound.push(s.nroDocumento);
        
        // Crear TAREA automática para reporte de error de documento
        addAgendaNote({
          date: new Date().toISOString().slice(0, 10),
          course: s.curso || "SIN ASIGNAR",
          subject: "GENERAL",
          type: "TASK",
          content: `[ATENDER] Estudiante con Doc. ${s.nroDocumento} no encontrado en Base Maestra durante carga de salón ${s.grado}-${s.curso}.`,
          isCompleted: false
        });
      }
    }

    setStudents(prev => {
      const mapa = new Map(prev.map(s => [s.id, s]));
      for (const nuevo of conIds) {
        const existente = mapa.get(nuevo.id);
        mapa.set(nuevo.id, existente ? { ...existente, ...nuevo } : nuevo);
      }
      return Array.from(mapa.values());
    });

    for (let i = 0; i < conIds.length; i += LIMITE_LOTE) {
      const lote = writeBatch(db);
      const porcion = conIds.slice(i, i + LIMITE_LOTE);
      for (const estudiante of porcion) {
        lote.set(doc(db, "students", estudiante.id), estudiante, { merge: true });
      }
      await lote.commit();
    }
    return { novelties, notFound };
  };

  /** Mark a student as inactive in Firestore */
  const removeStudent = async (id: string) => {
    try {
      await updateDoc(doc(db, "students", id), { isActive: false });
    } catch {
      // doc may not exist in Firestore if it was only local
    }
    setStudents(prev => prev.map(s => s.id === id ? { ...s, isActive: false } : s));
  };

  const updateDetailedGrades = async (studentId: string, subjectId: string, periodId: string, detailed: DetailedGrades) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const subjectGrades = student.detailedGrades?.[subjectId] || {};
      const newDetailedGrades = {
        ...(student.detailedGrades || {}),
        [subjectId]: {
          ...subjectGrades,
          [periodId]: detailed
        }
      };

      const finalNote = calculateDetailedFinal(detailed);
      
      const updates = { 
        detailedGrades: newDetailedGrades,
        avgGrade: finalNote 
      };

      await updateDoc(doc(db, "students", studentId), updates);
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...updates } : s));
    } catch (err) {
      console.error("Error al actualizar notas detalladas:", err);
    }
  };

  /** Bulk update for detailed grades (Import strategy) */
  const importDetailedGrades = async (subjectId: string, periodId: string, data: { studentId: string, detailed: DetailedGrades }[]) => {
    try {
      const LIMITE_LOTE = 500;
      const allUpdates: { studentId: string, updates: any }[] = [];

      for (const item of data) {
        const student = students.find(s => s.id === item.studentId);
        if (!student) continue;

        const subjectGrades = student.detailedGrades?.[subjectId] || {};
        const newDetailedGrades = {
          ...(student.detailedGrades || {}),
          [subjectId]: {
            ...subjectGrades,
            [periodId]: item.detailed
          }
        };

        const finalNote = calculateDetailedFinal(item.detailed);
        const updates = { 
          detailedGrades: newDetailedGrades,
          avgGrade: finalNote 
        };
        allUpdates.push({ studentId: item.studentId, updates });
      }

      // Execute in batches
      for (let i = 0; i < allUpdates.length; i += LIMITE_LOTE) {
        const batch = writeBatch(db);
        const chunk = allUpdates.slice(i, i + LIMITE_LOTE);
        for (const up of chunk) {
          batch.update(doc(db, "students", up.studentId), up.updates);
        }
        await batch.commit();
      }

      // Update local state
      setStudents(prev => {
        const mapa = new Map(prev.map(s => [s.id, s]));
        for (const up of allUpdates) {
          const s = mapa.get(up.studentId);
          if (s) mapa.set(up.studentId, { ...s, ...up.updates });
        }
        return Array.from(mapa.values());
      });
    } catch (err) {
      console.error("Error en importación masiva de notas:", err);
      throw err;
    }
  };

  const updateSingleDetailedGrade = async (studentId: string, subjectId: string, periodId: string, category: keyof DetailedGrades, index: number, score: number | null) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const currentSubjectGrades = student.detailedGrades?.[subjectId]?.[periodId] || {
        sb: Array(8).fill(null),
        sbh: Array(8).fill(null),
        sr: Array(5).fill(null),
        cv: Array(3).fill(null),
        aut: null
      };

      const newCategoryData = [...(currentSubjectGrades[category] as (number|null)[])];
      if (category === 'aut') {
        currentSubjectGrades.aut = score;
      } else {
        newCategoryData[index] = score;
        (currentSubjectGrades[category] as (number|null)[]) = newCategoryData;
      }

      await updateDetailedGrades(studentId, subjectId, periodId, currentSubjectGrades);
    } catch (err) {
      console.error("Error al actualizar nota individual:", err);
    }
  };

  const addGrade = async (studentId: string, grade: Omit<Grade, "id">) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;
      
      const newGrade = { 
        ...grade, 
        periodId: grade.periodId || masterData.activePeriod || "p1",
        title: toTitleCase(grade.title),
        id: `grade-${Date.now()}` 
      };
      const currentGrades = student.grades || [];
      const newGrades = [...currentGrades, newGrade];
      
      const validScores = newGrades.filter(g => g.type !== 'participation').map(g => g.score);
      let newAvg = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;
      
      // Sumar bonificación por participación (0.1 por cada nota de 5.0)
      const bonus = newGrades.filter(g => g.type === 'participation').reduce((a, b) => a + (b.score * 0.02), 0);
      newAvg = Math.min(5.0, newAvg + bonus);
      
      const updates = { grades: newGrades, avgGrade: Number(newAvg.toFixed(1)) };
      
      await updateDoc(doc(db, "students", studentId), updates);
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...updates } : s));
    } catch (err) {
      console.error("Error al añadir nota:", err);
    }
  };

  const saveDailyAttendance = async (dateStr: string, records: Record<string, string>) => {
    try {
      const LIMITE_LOTE = 500;
      // Build a Map<id, updatedRecord> to avoid O(n²) lookup later
      const updatesMap = new Map<string, Record<string, string>>();

      // 1. Preparar las actualizaciones
      students.forEach(s => {
        const status = records[s.id];
        if (!status) return;
        const updatedRecord = { ...(s.attendanceRecord || {}), [dateStr]: status };
        updatesMap.set(s.id, updatedRecord);
      });

      if (updatesMap.size === 0) return;

      // 2. Ejecutar en lotes de Firestore
      const entries = Array.from(updatesMap.entries());
      for (let i = 0; i < entries.length; i += LIMITE_LOTE) {
        const batch = writeBatch(db);
        entries.slice(i, i + LIMITE_LOTE).forEach(([id, record]) => {
          batch.update(doc(db, "students", id), { attendanceRecord: record });
        });
        await batch.commit();
      }

      // 3. Actualizar estado local en O(n) usando el Map
      setStudents(prev => prev.map(s => {
        const newRecord = updatesMap.get(s.id);
        return newRecord ? { ...s, attendanceRecord: newRecord } : s;
      }));

    } catch (err) {
      console.error("Error al guardar asistencia masiva:", err);
      throw err; // Propagar para que la UI pueda manejarlo
    }
  };

  const addAgendaNote = async (note: Omit<AgendaNote, "id">) => {
    try {
      const newNote = { 
        ...note, 
        id: `note-${Date.now()}` 
      };
      await setDoc(doc(db, "agendaNotes", newNote.id), newNote);
      setAgendaNotes(prev => [...prev, newNote as AgendaNote]);
    } catch (err) {
      console.error("Error al añadir nota a la agenda:", err);
    }
  };

  const updateAgendaNote = async (id: string, updates: Partial<AgendaNote>) => {
    try {
      await updateDoc(doc(db, "agendaNotes", id), updates);
      setAgendaNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    } catch (err) {
      console.error("Error al actualizar nota de agenda:", err);
    }
  };

  const updateAgendaNotesBatch = async (ids: string[], updates: Partial<AgendaNote>) => {
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.update(doc(db, "agendaNotes", id), updates);
      });
      await batch.commit();
      setAgendaNotes(prev => prev.map(n => ids.includes(n.id) ? { ...n, ...updates } : n));
    } catch (err) {
      console.error("Error al actualizar notas en lote:", err);
    }
  };

  const deleteAgendaNotesBatch = async (ids: string[]) => {
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.delete(doc(db, "agendaNotes", id));
      });
      await batch.commit();
      setAgendaNotes(prev => prev.filter(n => !ids.includes(n.id)));
    } catch (err) {
      console.error("Error al eliminar notas en lote:", err);
    }
  };

  const clearPendingTasks = async () => {
    try {
      const batch = writeBatch(db);
      const pendingTasks = agendaNotes.filter(n => n.type === "TASK" && !n.isCompleted);
      pendingTasks.forEach(note => {
        batch.delete(doc(db, "agendaNotes", note.id));
      });
      await batch.commit();
      setAgendaNotes(prev => prev.filter(n => !(n.type === "TASK" && !n.isCompleted)));
    } catch (err) {
      console.error("Error al limpiar tareas pendientes:", err);
    }
  };

  const clearAllAgendaNotes = async () => {
    try {
      const batch = writeBatch(db);
      agendaNotes.forEach(note => {
        batch.delete(doc(db, "agendaNotes", note.id));
      });
      await batch.commit();
      setAgendaNotes([]);
    } catch (err) {
      console.error("Error al limpiar agenda completa:", err);
    }
  };

  const clearAllTasks = async () => {
    try {
      const batch = writeBatch(db);
      const allTasks = agendaNotes.filter(n => n.type === "TASK");
      allTasks.forEach(note => {
        batch.delete(doc(db, "agendaNotes", note.id));
      });
      await batch.commit();
      setAgendaNotes(prev => prev.filter(n => n.type !== "TASK"));
    } catch (err) {
      console.error("Error al eliminar todas las tareas:", err);
    }
  };

  const addSubject = (subject: Omit<Subject, "id">) => {
    setSubjects(prev => [...prev, { ...subject, id: `sub-${Date.now()}` }]);
  };

  const updateSubject = (id: string, subject: Partial<Subject>) => {
    setSubjects(prev => prev.map(s => (s.id === id ? { ...s, ...subject } : s)));
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };
  const updateTopicStatus = async (curriculumId: string, unitId: string, topicId: string, status: Topic["status"]) => {
    try {
      const cur = curriculum.find(c => c.id === curriculumId);
      if (!cur) return;

      const newUnits = cur.units.map(u => {
        if (u.id === unitId) {
          return {
            ...u,
            topics: u.topics.map(t => t.id === topicId ? { ...t, status } : t)
          };
        }
        return u;
      });

      // Optimistic update for fluid local interaction
      setCurriculum(prev => prev.map(c => c.id === curriculumId ? { ...c, units: newUnits } : c));

      await updateDoc(doc(db, "curriculum", curriculumId), { units: newUnits });
    } catch (err) {
      console.error("Error al actualizar estado del tema:", err);
    }
  };

  const saveCurriculumLocal = (data: Curriculum) => {
    setCurriculum(prev => {
      const idx = prev.findIndex(c => c.id === data.id);
      if (idx >= 0) {
        return prev.map(c => c.id === data.id ? data : c);
      }
      return [...prev, data];
    });
  };

  // --- ESTRATEGIA DE GOBERNANZA: KPIs DE POBLACIÓN Y CUMPLEAÑOS ---
  const governanceStats = useMemo(() => {
    // La gobernanza dicta que el docente solo ve sus alumnos, el admin ve todos
    const targetStudents = profile.isSuperAdmin ? students : myStudents;
    const active = targetStudents.filter(s => s.isActive !== false);
    
    const today = new Date();
    // Use local date parts to avoid UTC offset shifting the day in Colombia (UTC-5)
    const padZ = (n: number) => String(n).padStart(2, '0');
    const todayMD = `${padZ(today.getMonth() + 1)}-${padZ(today.getDate())}`; // MM-DD local
    const todayM  = padZ(today.getMonth() + 1); // MM local

    const birthdaysToday = active.filter(s => {
      if (!s.fechaNacimiento) return false;
      // Append T12:00:00 to force local noon, avoiding midnight UTC crossover
      const bDate = new Date(String(s.fechaNacimiento).slice(0, 10) + "T12:00:00");
      if (isNaN(bDate.getTime())) return false;
      const bMD = `${padZ(bDate.getMonth() + 1)}-${padZ(bDate.getDate())}`;
      return bMD === todayMD;
    });

    const birthdaysMonth = active.filter(s => {
      if (!s.fechaNacimiento) return false;
      const bDate = new Date(String(s.fechaNacimiento).slice(0, 10) + "T12:00:00");
      if (isNaN(bDate.getTime())) return false;
      return padZ(bDate.getMonth() + 1) === todayM;
    });

    // Análisis de Población (Piramidal)
    const gender = {
      m: active.filter(s => s.genero === "M").length,
      f: active.filter(s => s.genero === "F").length,
      parity: 0
    };
    gender.parity = active.length > 0 ? Math.round((Math.min(gender.m, gender.f) / Math.max(gender.m, gender.f)) * 100) : 0;

    // Extraedad: Análisis de riesgo pedagógico
    const extraedad = active.filter(s => {
      if (!s.fechaNacimiento) return false;
      const age = today.getFullYear() - new Date(s.fechaNacimiento).getFullYear();
      const gradeNum = parseInt(normalizeGrade(s.grado));
      if (isNaN(gradeNum)) return false;
      // Estándar: Grado + 6 o 7 años. Si tiene 2+ años de diferencia es extraedad.
      return age > (gradeNum + 8);
    });

    return {
      birthdaysToday,
      birthdaysMonth,
      gender,
      extraedad,
      totalActive: active.length
    };
  }, [students, myStudents, profile.isSuperAdmin]);

  return (
    <AppContext.Provider value={{
      user, authLoading, logout,
      profile, setProfile, updateProfile,
      subjects, setSubjects,
      students, myStudents, setStudents, addStudent, importStudents, removeStudent, updateStudent, updateDetailedGrades, importDetailedGrades, updateSingleDetailedGrade, addGrade, saveDailyAttendance,
      masterData, updateMasterData, updateMasterItem, removeMasterItem, togglePeriodStatus, setActivePeriod,
      addSubject, updateSubject, deleteSubject,
      schedule, setSchedule,
      agendaNotes, addAgendaNote, updateAgendaNote, updateAgendaNotesBatch, deleteAgendaNotesBatch, clearAllAgendaNotes, clearPendingTasks, clearAllTasks,
      allUsers, refreshUsers, updateUserRole,
      createEmailUser, loginWithEmail, resetPassword, acceptTerms,
      curriculum, updateTopicStatus, saveCurriculumLocal,
      governanceStats,
      studentsLoading,
      isOnline
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error("useApp must be used within an AppProvider");
  return context;
}
