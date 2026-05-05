"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
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
  if (!raw) return "0°";
  const s = raw.toString().trim().toUpperCase();

  // Ya tiene el formato correcto
  if (s.endsWith("°") || s === "PRIMARIA" || s === "JARDÍN" || s === "PREESCOLAR" || s === "KÍNDER" || s === "TRANSICIÓN") return s;

  // Mapeo numérico
  const numMatch = s.match(/^(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1]);
    if (n === 0) return "PRIMARIA";
    return `${n}°`;
  }

  // Mapeo textual
  const wordMap: Record<string, string> = {
    CERO: "PRIMARIA", PRIM: "PRIMARIA", PRIMERO: "1°", SEGUNDO: "2°",
    TERCERO: "3°", CUARTO: "4°", QUINTO: "5°", SEXTO: "6°",
    SEPTIMO: "7°", SÉPTIMO: "7°", OCTAVO: "8°", NOVENO: "9°",
    DECIMO: "10°", DÉCIMO: "10°", ONCE: "11°", UNDECIMO: "11°", UNDÉCIMO: "11°",
    TRANSICION: "PRIMARIA", JARDIN: "PRIMARIA", KINDER: "PRIMARIA",
  };
  for (const [key, val] of Object.entries(wordMap)) {
    if (s.includes(key)) return val;
  }

  // Fallback: retorna tal cual en mayúsculas
  return s;
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
  title: string;
  date?: string;
  status: "covered" | "active" | "not_started";
  objectives?: string[];
  subtopics?: Subtopic[];
}

export interface Unit {
  id: string;
  title: string;
  order: number;
  topics: Topic[];
}

export interface Curriculum {
  id: string;
  subjectId: string; // e.g., "calculo-11"
  grade: string;
  units: Unit[];
}

interface Subject {
  id: string;
  name: string;
  courses: string;
  color: string;
}

interface Student {
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
  isActive?: boolean;
  grades?: { id: string, title: string, score: number, type: 'activity' | 'participation', date: string }[];
}

// Legacy format kept for backward-compat on some views
interface ScheduleEntry {
  day: string;
  time: string;
  subject: string;
  group: string;
  color: string;
}

interface MasterData {
  subjects: string[];
  grades: string[];
  teachers: string[];
  courses: string[]; // Grupos específicos (ej: 8-1, 8-2)
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
  setStudents: (students: Student[]) => void;
  addStudent: (student: Omit<Student, "id">) => void;
  importStudents: (incoming: Omit<Student, "id">[]) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  addGrade: (studentId: string, grade: { title: string, score: number, type: 'activity' | 'participation', date: string }) => Promise<void>;
  masterData: MasterData;
  updateMasterData: (key: keyof MasterData, list: string[]) => void;
  updateMasterItem: (key: keyof MasterData, oldItem: string, newItem: string) => void;
  removeMasterItem: (key: keyof MasterData, item: string) => void;
  addSubject: (subject: Omit<Subject, "id">) => void;
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  schedule: ScheduleEntry[];
  setSchedule: (schedule: ScheduleEntry[]) => void;
  sessionNotes: string;
  setSessionNotes: (notes: string) => void;
  agendaNotes: AgendaNote[];
  addAgendaNote: (note: Omit<AgendaNote, "id">) => Promise<void>;
  updateAgendaNote: (id: string, updates: Partial<AgendaNote>) => Promise<void>;
  // USER MANAGEMENT
  allUsers: AppUser[];
  refreshUsers: () => Promise<void>;
  updateUserRole: (uid: string, role: Profile["role"]) => Promise<void>;
  createEmailUser: (email: string, pass: string, name: string, role: Profile["role"]) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  acceptTerms: () => Promise<void>;
  saveDailyAttendance: (dateStr: string, records: Record<string, string>) => Promise<void>;
  // CURRICULUM
  curriculum: Curriculum[];
  updateTopicStatus: (curriculumId: string, unitId: string, topicId: string, status: Topic["status"]) => Promise<void>;
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
    group: b.course,
    color: b.color || BLOCK_COLORS[i % BLOCK_COLORS.length],
  }));
}

// ── DEFAULT SCHEDULE (sinapcodeia's real schedule as reference) ──────────────
// ── DEFAULT SCHEDULE (Official IETABA - Jesus Antonio Rodriguez) ──────────────
const DEFAULT_SCHEDULE_BLOCKS: ScheduleBlock[] = [
  { id:"s1",  day:"LUNES",     startTime:"07:30", endTime:"08:30", subject:"TECNOLOGÍA",  grade:"8°", course:"8-3", color:"bg-blue-100 text-blue-900 border-blue-200" },
  { id:"s2",  day:"LUNES",     startTime:"08:30", endTime:"09:30", subject:"TECNOLOGÍA",  grade:"8°", course:"8-3", color:"bg-blue-100 text-blue-900 border-blue-200" },
  { id:"s3",  day:"LUNES",     startTime:"09:30", endTime:"10:30", subject:"MATEMÁTICAS", grade:"6°", course:"6-6", color:"bg-emerald-100 text-emerald-900 border-emerald-200" },
  { id:"s4",  day:"LUNES",     startTime:"11:00", endTime:"11:50", subject:"TECNOLOGÍA",  grade:"6°", course:"6-3", color:"bg-purple-100 text-purple-900 border-purple-200" },
  { id:"s5",  day:"LUNES",     startTime:"11:50", endTime:"12:40", subject:"TECNOLOGÍA",  grade:"6°", course:"6-6", color:"bg-blue-100 text-blue-900 border-blue-200" },
  
  { id:"s6",  day:"MARTES",    startTime:"07:30", endTime:"08:30", subject:"TECNOLOGÍA",  grade:"6°", course:"6-6", color:"bg-blue-100 text-blue-900 border-blue-200" },
  { id:"s7",  day:"MARTES",    startTime:"08:30", endTime:"09:30", subject:"TECNOLOGÍA",  grade:"6°", course:"6-6", color:"bg-blue-100 text-blue-900 border-blue-200" },
  { id:"s8",  day:"MARTES",    startTime:"09:30", endTime:"10:30", subject:"TECNOLOGÍA",  grade:"9°", course:"9-2", color:"bg-rose-100 text-rose-900 border-rose-200" },
  { id:"s9",  day:"MARTES",    startTime:"11:00", endTime:"11:50", subject:"TECNOLOGÍA",  grade:"9°", course:"9-4", color:"bg-rose-100 text-rose-900 border-rose-200" },
  { id:"s10", day:"MARTES",    startTime:"11:50", endTime:"12:40", subject:"MATEMÁTICAS", grade:"6°", course:"6-6", color:"bg-emerald-100 text-emerald-900 border-emerald-200" },

  { id:"s11", day:"MIÉRCOLES", startTime:"07:30", endTime:"08:30", subject:"TECNOLOGÍA",  grade:"7°", course:"7-4", color:"bg-cyan-100 text-cyan-900 border-cyan-200" },
  { id:"s12", day:"MIÉRCOLES", startTime:"08:30", endTime:"09:30", subject:"TECNOLOGÍA",  grade:"7°", course:"7-4", color:"bg-cyan-100 text-cyan-900 border-cyan-200" },
  { id:"s13", day:"MIÉRCOLES", startTime:"09:30", endTime:"10:30", subject:"TECNOLOGÍA",  grade:"6°", course:"6-3", color:"bg-purple-100 text-purple-900 border-purple-200" },
  { id:"s14", day:"MIÉRCOLES", startTime:"12:40", endTime:"13:30", subject:"MATEMÁTICAS", grade:"6°", course:"6-6", color:"bg-emerald-100 text-emerald-900 border-emerald-200" },

  { id:"s15", day:"JUEVES",    startTime:"07:30", endTime:"08:30", subject:"TECNOLOGÍA",  grade:"5°", course:"5-1", color:"bg-amber-100 text-amber-900 border-amber-200" },
  { id:"s15b",day:"JUEVES",    startTime:"08:30", endTime:"09:30", subject:"TECNOLOGÍA",  grade:"5°", course:"5-1", color:"bg-amber-100 text-amber-900 border-amber-200" },
  { id:"s16", day:"JUEVES",    startTime:"09:30", endTime:"10:30", subject:"MATEMÁTICAS", grade:"6°", course:"6-6", color:"bg-emerald-100 text-emerald-900 border-emerald-200" },
  { id:"s17", day:"JUEVES",    startTime:"11:00", endTime:"11:50", subject:"TECNOLOGÍA",  grade:"5°", course:"5-2", color:"bg-lime-100 text-lime-900 border-lime-200" },
  { id:"s18", day:"JUEVES",    startTime:"11:50", endTime:"12:40", subject:"TECNOLOGÍA",  grade:"5°", course:"5-2", color:"bg-lime-100 text-lime-900 border-lime-200" },

  { id:"s19", day:"VIERNES",   startTime:"07:30", endTime:"08:30", subject:"TECNOLOGÍA",  grade:"7°", course:"7-3", color:"bg-cyan-100 text-cyan-900 border-cyan-200" },
  { id:"s20", day:"VIERNES",   startTime:"08:30", endTime:"09:30", subject:"TECNOLOGÍA",  grade:"7°", course:"7-3", color:"bg-cyan-100 text-cyan-900 border-cyan-200" },
  { id:"s21", day:"VIERNES",   startTime:"09:30", endTime:"10:30", subject:"ÉTICA",       grade:"8°", course:"8-2", color:"bg-orange-100 text-orange-900 border-orange-200" },
  { id:"s22", day:"VIERNES",   startTime:"11:00", endTime:"11:50", subject:"FÍSICA",      grade:"6°", course:"6-6", color:"bg-rose-100 text-rose-900 border-rose-200" },
  { id:"s23", day:"VIERNES",   startTime:"11:50", endTime:"12:40", subject:"MATEMÁTICAS", grade:"6°", course:"6-6", color:"bg-emerald-100 text-emerald-900 border-emerald-200" },
  { id:"s24", day:"VIERNES",   startTime:"12:40", endTime:"13:30", subject:"FÍSICA",      grade:"7°", course:"7-2", color:"bg-rose-100 text-rose-900 border-rose-200" },
];

// ── PROVIDER ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionNotes, setSessionNotes] = useState("");
  const [agendaNotes, setAgendaNotes] = useState<AgendaNote[]>([]);
  const [curriculum, setCurriculum] = useState<Curriculum[]>([]);
  const [profile, setProfile] = useState<TeacherProfile>(DEFAULT_PROFILE);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);

  const [masterData, setMasterData] = useState<MasterData>({
    subjects: ["TECNOLOGÍA", "MATEMÁTICAS", "FÍSICA", "ÉTICA"],
    grades: ["PRIMARIA", "6°", "7°", "8°", "9°", "10°", "11°"],
    teachers: ["ANTONIO RODRIGUEZ"],
    courses: ["5-1", "5-2", "6", "6-3", "6-6", "7-2", "7-3", "7-4", "8-2", "8-3", "9-2", "9-4"],
  });

  const [subjects, setSubjects] = useState<Subject[]>([
    { id: "sub-1", name: "TECNOLOGÍA",  courses: "8-3, 6-3, 6-6, 9-2, 9-4, 7-4, 5-1, 5-2, 7-3", color: "bg-blue-500" },
    { id: "sub-2", name: "MATEMÁTICAS", courses: "6-6", color: "bg-green-500" },
    { id: "sub-3", name: "FÍSICA",      courses: "6-6, 7-2", color: "bg-orange-500" },
    { id: "sub-4", name: "ÉTICA",       courses: "8-2", color: "bg-yellow-500" },
  ]);

  const [students, setStudents] = useState<Student[]>([]);

  // Schedule: derived from weeklySchedule in profile, with legacy fallback
  const [schedule, setSchedule] = useState<ScheduleEntry[]>(
    blocksToEntries(DEFAULT_SCHEDULE_BLOCKS)
  );

  // ── AUTH LISTENER ──────────────────────────────────────────────────────────
  useEffect(() => {
    let unsubs: Array<() => void> = [];

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Limpiar suscripciones previas al cambiar de estado de autenticación
      unsubs.forEach(unsub => unsub());
      unsubs = [];

      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          const isSuperAdmin = SUPER_ADMINS.includes(firebaseUser.email || "");

          let savedData: Partial<TeacherProfile> = {};

          if (userDoc.exists()) {
            savedData = userDoc.data() as Partial<TeacherProfile>;
            // Audit Log: Registrar última conexión
            await updateDoc(userDocRef, { lastLogin: new Date().toISOString() });
          } else {
            // Primer inicio de sesión — crear documento institucional para SuperAdmin
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
              lastLogin: new Date().toISOString(), // Audit Log Inicial
            };
            await setDoc(userDocRef, newDoc);
            savedData = newDoc as Partial<TeacherProfile>;
          }

          // ── AUTO-PATCH: docenciainformatica2025@gmail.com ──────────────────
          if (firebaseUser.email === "docenciainformatica2025@gmail.com" && (!savedData.weeklySchedule || savedData.weeklySchedule.length === 0)) {
            savedData.weeklySchedule = DEFAULT_SCHEDULE_BLOCKS;
            savedData.isProfileComplete = true;
            savedData.firstName = "JESUS ANTONIO";
            savedData.lastName = "RODRIGUEZ";
            await updateDoc(userDocRef, { 
              weeklySchedule: DEFAULT_SCHEDULE_BLOCKS,
              isProfileComplete: true,
              firstName: "JESUS ANTONIO",
              lastName: "RODRIGUEZ"
            });
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
            acceptedTerms: savedData.acceptedTerms || false,
            isSuperAdmin,
            teachingGrades: savedData.teachingGrades || [],
            teachingCourses: savedData.teachingCourses || [],
            teachingSubjectsList: savedData.teachingSubjectsList || [],
            isProfileComplete: isSuperAdmin ? true : (savedData.isProfileComplete || false),
            weeklySchedule: isSuperAdmin ? [] : (savedData.weeklySchedule || []),
          };

          setProfile(builtProfile);

          if (builtProfile.weeklySchedule && builtProfile.weeklySchedule.length > 0) {
            setSchedule(blocksToEntries(builtProfile.weeklySchedule));
          }

          // ── REAL-TIME STUDENTS SYNC ────────────────────────
          let unsubscribeStudents: () => void = () => {};
          const studentsQuery = query(collection(db, "students"), where("isActive", "==", true));
          unsubscribeStudents = onSnapshot(studentsQuery, (snap) => {
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
          }, (err) => {
            console.warn("Error en tiempo real (estudiantes):", err);
          });
          unsubs.push(unsubscribeStudents);

          // ── REAL-TIME AGENDA SYNC (Recent Only) ────────────────────────────
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const agendaQuery = query(
            collection(db, "agendaNotes"), 
            where("date", ">=", thirtyDaysAgo.toISOString())
          );

          const unsubscribeAgenda = onSnapshot(agendaQuery, (snap) => {
            const notes = snap.docs.map(d => ({ id: d.id, ...d.data() } as AgendaNote));
            setAgendaNotes(notes);
          }, (err) => {
            console.warn("Error en tiempo real (agenda):", err);
          });
          unsubs.push(unsubscribeAgenda);

          // ── REAL-TIME CURRICULUM SYNC ─────────────────────────────────────
          const unsubscribeCurriculum = onSnapshot(collection(db, "curriculum"), (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Curriculum));
            setCurriculum(items);
          }, (err) => {
            console.warn("Error en tiempo real (currículo):", err);
          });
          unsubs.push(unsubscribeCurriculum);

          setUser(firebaseUser);
          
        } catch (err) {
          console.error("Error al obtener perfil:", err);
        }
      } else {
        setUser(null);
        setProfile(DEFAULT_PROFILE);
        setSchedule(blocksToEntries(DEFAULT_SCHEDULE_BLOCKS));
      }

      setAuthLoading(false);
    });

    return () => {
      unsubscribe();
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  // ── UPDATE PROFILE ─────────────────────────────────────────────────────────
  const updateProfile = async (updates: Partial<TeacherProfile>) => {
    if (!user) return;
    try {
      const merged: TeacherProfile = { ...profile, ...updates };

      if (updates.firstName !== undefined || updates.lastName !== undefined) {
        merged.name = `${merged.firstName} ${merged.lastName}`.trim().toUpperCase() || merged.name;
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
    try {
      await updateDoc(doc(db, "users", user.uid), { acceptedTerms: true });
      setProfile(prev => ({ ...prev, acceptedTerms: true }));
    } catch (err) {
      console.error("Error al aceptar términos:", err);
    }
  };

  // ── PERSISTENCIA LOCAL (no students — Firestore es la fuente de verdad) ────
  useEffect(() => {
    const savedMasterData = localStorage.getItem("edu_masterData");
    const savedSubjects   = localStorage.getItem("edu_subjects");
    const savedNotes      = localStorage.getItem("edu_sessionNotes");
    localStorage.removeItem("edu_schedule");
    localStorage.removeItem("edu_students"); // clear old cache
    if (savedMasterData) {
      try { 
        const parsed = JSON.parse(savedMasterData);
        setMasterData({
          subjects: parsed.subjects || [],
          grades: parsed.grades || [],
          teachers: parsed.teachers || [],
          courses: parsed.courses || []
        }); 
      } catch { /* ignore */ }
    }
    if (savedSubjects)   try { setSubjects(JSON.parse(savedSubjects));   } catch { /* ignore */ }
    if (savedNotes) setSessionNotes(savedNotes);
  }, []);

  useEffect(() => {
    localStorage.setItem("edu_masterData",    JSON.stringify(masterData));
    localStorage.setItem("edu_subjects",      JSON.stringify(subjects));
    localStorage.setItem("edu_sessionNotes",  sessionNotes);
  }, [masterData, subjects, sessionNotes]);

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
        return {
          ...prev,
          grades: Array.from(new Set([...prev.grades, ...newGradesList])),
          courses: Array.from(new Set([...prev.courses, ...newCoursesList]))
        };
      }
      return prev;
    });
  }, [students]);

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
      const updated = prev[category].map(item => item === oldValue ? newValue : item);
      return { ...prev, [category]: updated };
    });
  };

  // ── HELPERS ───────────────────────────────────────────────────────────────
  const logout = async () => { await signOut(auth); };

  /** Actualiza datos maestros (grados/materias/docentes).
   *  Estrategia: SOLO AGREGA elementos nuevos, nunca elimina los existentes.
   *  Si se pasa una lista vacía, se ignora para proteger la información.
   */
  const updateMasterData = (key: keyof MasterData, listaNueva: string[]) => {
    setMasterData(prev => {
      // Si la lista nueva está vacía, no hacemos nada (protección contra borrado accidental)
      if (listaNueva.length === 0) return prev;
      // Fusionar: conservar todos los existentes + agregar los nuevos sin duplicados
      const fusionada = Array.from(new Set([...prev[key], ...listaNueva]));
      return { ...prev, [key]: fusionada };
    });
  };

  /** Elimina un elemento de datos maestros SOLO si se confirma explícitamente.
   *  Uso interno para borrados individuales desde la UI.
   */
  const removeMasterItem = (key: keyof MasterData, item: string) => {
    setMasterData(prev => ({ ...prev, [key]: prev[key].filter(i => i !== item) }));
  };

  const addStudent = (student: Omit<Student, "id">) => {
    setStudents(prev => [...prev, { ...student, id: `st-${Date.now()}` }]);
  };

  /** Importa estudiantes a Firestore con estrategia de fusión (merge):
   *  - Si el estudiante YA existe: actualiza solo los campos del CSV, conserva el resto
   *  - Si es NUEVO: lo crea
   *  - NUNCA elimina registros existentes
   */
  const importStudents = async (incoming: Omit<Student, "id">[]) => {
    const LIMITE_LOTE = 400; // Límite de Firestore es 500 por lote

    const conIds = incoming.map(s => ({
      ...s,
      id: `st-${s.nroDocumento}-${s.curso}`.replace(/\s+/g, "-"),
      isActive: true,
    }));

    // Fusionar en estado local primero (preserva campos extra existentes)
    setStudents(prev => {
      const mapa = new Map(prev.map(s => [s.id, s]));
      for (const nuevo of conIds) {
        const existente = mapa.get(nuevo.id);
        // Si ya existe, conservar sus campos extra y solo actualizar los del CSV
        mapa.set(nuevo.id, existente ? { ...existente, ...nuevo } : nuevo);
      }
      return Array.from(mapa.values());
    });

    // Escribir en Firestore en lotes con merge:true
    // merge:true garantiza que los campos NO incluidos en el CSV se conserven en Firestore
    for (let i = 0; i < conIds.length; i += LIMITE_LOTE) {
      const lote = writeBatch(db);
      const porcion = conIds.slice(i, i + LIMITE_LOTE);
      for (const estudiante of porcion) {
        lote.set(
          doc(db, "students", estudiante.id),
          estudiante,
          { merge: true } // ← CLAVE: nunca sobreescribe campos existentes no incluidos
        );
      }
      await lote.commit();
    }
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

  const addGrade = async (studentId: string, grade: { title: string, score: number, type: 'activity' | 'participation', date: string }) => {
    try {
      const student = students.find(s => s.id === studentId);
      if (!student) return;
      
      const newGrade = { ...grade, id: `grade-${Date.now()}` };
      const currentGrades = student.grades || [];
      const newGrades = [...currentGrades, newGrade];
      
      const validScores = newGrades.map(g => g.score);
      const newAvg = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 0;
      
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
      const updates: { id: string, record: any, student: Student }[] = [];

      // 1. Preparar las actualizaciones
      students.forEach(s => {
        const status = records[s.id];
        if (!status) return;
        
        const updatedRecord = { ...(s.attendanceRecord || {}), [dateStr]: status };
        updates.push({ 
          id: s.id, 
          record: updatedRecord, 
          student: { ...s, attendanceRecord: updatedRecord } 
        });
      });

      // 2. Ejecutar en lotes de Firestore
      for (let i = 0; i < updates.length; i += LIMITE_LOTE) {
        const batch = writeBatch(db);
        const chunk = updates.slice(i, i + LIMITE_LOTE);
        
        chunk.forEach(item => {
          const docRef = doc(db, "students", item.id);
          batch.update(docRef, { attendanceRecord: item.record });
        });
        
        await batch.commit();
      }

      // 3. Actualizar estado local una sola vez
      setStudents(prev => prev.map(s => {
        const update = updates.find(u => u.id === s.id);
        return update ? update.student : s;
      }));
      
    } catch (err) {
      console.error("Error al guardar asistencia masiva:", err);
      throw err; // Propagar para que la UI pueda manejarlo
    }
  };

  const addAgendaNote = async (note: Omit<AgendaNote, "id">) => {
    try {
      const newNote = { ...note, id: `note-${Date.now()}` };
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

      await updateDoc(doc(db, "curriculum", curriculumId), { units: newUnits });
    } catch (err) {
      console.error("Error al actualizar estado del tema:", err);
    }
  };

  return (
    <AppContext.Provider value={{
      user, authLoading, logout,
      profile, setProfile, updateProfile,
      subjects, setSubjects,
      students, setStudents, addStudent, importStudents, removeStudent, updateStudent, addGrade, saveDailyAttendance,
      masterData, updateMasterData, removeMasterItem, updateMasterItem,
      addSubject, updateSubject, deleteSubject,
      schedule, setSchedule,
      sessionNotes, setSessionNotes,
      agendaNotes, addAgendaNote, updateAgendaNote,
      allUsers, refreshUsers, updateUserRole,
      createEmailUser, loginWithEmail, resetPassword, acceptTerms,
      curriculum, updateTopicStatus,
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
