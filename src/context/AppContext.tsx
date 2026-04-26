"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, writeBatch } from "firebase/firestore";

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
  present?: boolean;
  acudienteNombre?: string;
  acudienteTelefono?: string;
  isActive?: boolean;
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

  // Onboarding
  isProfileComplete: boolean;

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
  // USER MANAGEMENT
  allUsers: AppUser[];
  refreshUsers: () => Promise<void>;
  updateUserRole: (uid: string, role: Profile["role"]) => Promise<void>;
  createEmailUser: (email: string, pass: string, name: string, role: Profile["role"]) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  acceptTerms: () => Promise<void>;
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
const DEFAULT_SCHEDULE_BLOCKS: ScheduleBlock[] = [
  { id:"s1",  day:"LUNES",     startTime:"07:30", endTime:"08:30", subject:"TECNOLOGÍA",  grade:"8°", course:"8-3", color:"bg-amber-100 text-amber-900 border-amber-200" },
  { id:"s2",  day:"LUNES",     startTime:"08:30", endTime:"09:30", subject:"TECNOLOGÍA",  grade:"8°", course:"8-3", color:"bg-amber-100 text-amber-900 border-amber-200" },
  { id:"s3",  day:"LUNES",     startTime:"09:30", endTime:"10:00", subject:"MATEMÁTICAS", grade:"6°", course:"6-6", color:"bg-lime-100 text-lime-900 border-lime-200" },
  { id:"s4",  day:"LUNES",     startTime:"10:30", endTime:"11:30", subject:"TECNOLOGÍA",  grade:"6°", course:"6-3", color:"bg-emerald-100 text-emerald-900 border-emerald-200" },
  { id:"s5",  day:"LUNES",     startTime:"11:30", endTime:"12:30", subject:"TECNOLOGÍA",  grade:"6°", course:"6-3", color:"bg-emerald-100 text-emerald-900 border-emerald-200" },
  { id:"s6",  day:"MARTES",    startTime:"07:30", endTime:"08:30", subject:"TECNOLOGÍA",  grade:"6°", course:"6-6", color:"bg-sky-100 text-sky-900 border-sky-200" },
  { id:"s7",  day:"MARTES",    startTime:"08:30", endTime:"09:30", subject:"TECNOLOGÍA",  grade:"6°", course:"6-6", color:"bg-sky-100 text-sky-900 border-sky-200" },
  { id:"s8",  day:"MARTES",    startTime:"09:30", endTime:"10:00", subject:"TECNOLOGÍA",  grade:"9°", course:"9-2", color:"bg-pink-100 text-pink-900 border-pink-200" },
  { id:"s9",  day:"MARTES",    startTime:"10:30", endTime:"11:30", subject:"TECNOLOGÍA",  grade:"9°", course:"9-4", color:"bg-purple-100 text-purple-900 border-purple-200" },
  { id:"s10", day:"MARTES",    startTime:"11:30", endTime:"12:30", subject:"MATEMÁTICAS", grade:"6°", course:"6-6", color:"bg-lime-100 text-lime-900 border-lime-200" },
  { id:"s11", day:"MIÉRCOLES", startTime:"07:30", endTime:"08:30", subject:"TECNOLOGÍA",  grade:"7°", course:"7-4", color:"bg-blue-100 text-blue-900 border-blue-200" },
  { id:"s12", day:"MIÉRCOLES", startTime:"08:30", endTime:"09:30", subject:"TECNOLOGÍA",  grade:"7°", course:"7-4", color:"bg-blue-100 text-blue-900 border-blue-200" },
  { id:"s13", day:"MIÉRCOLES", startTime:"09:30", endTime:"10:00", subject:"TECNOLOGÍA",  grade:"6°", course:"6-3", color:"bg-emerald-100 text-emerald-900 border-emerald-200" },
  { id:"s14", day:"MIÉRCOLES", startTime:"12:30", endTime:"13:30", subject:"MATEMÁTICAS", grade:"6°", course:"6-6", color:"bg-lime-100 text-lime-900 border-lime-200" },
  { id:"s15", day:"JUEVES",    startTime:"07:30", endTime:"08:30", subject:"TECNOLOGÍA",  grade:"5°", course:"5-1", color:"bg-cyan-100 text-cyan-900 border-cyan-200" },
  { id:"s16", day:"JUEVES",    startTime:"09:30", endTime:"10:00", subject:"MATEMÁTICAS", grade:"6°", course:"6-6", color:"bg-lime-100 text-lime-900 border-lime-200" },
  { id:"s17", day:"JUEVES",    startTime:"11:30", endTime:"12:30", subject:"TECNOLOGÍA",  grade:"5°", course:"5-2", color:"bg-green-100 text-green-900 border-green-200" },
  { id:"s18", day:"JUEVES",    startTime:"12:30", endTime:"13:30", subject:"TECNOLOGÍA",  grade:"5°", course:"5-2", color:"bg-green-100 text-green-900 border-green-200" },
  { id:"s19", day:"VIERNES",   startTime:"07:30", endTime:"08:30", subject:"TECNOLOGÍA",  grade:"7°", course:"7-3", color:"bg-blue-100 text-blue-900 border-blue-200" },
  { id:"s20", day:"VIERNES",   startTime:"08:30", endTime:"09:30", subject:"TECNOLOGÍA",  grade:"7°", course:"7-3", color:"bg-blue-100 text-blue-900 border-blue-200" },
  { id:"s21", day:"VIERNES",   startTime:"09:30", endTime:"10:00", subject:"ÉTICA",       grade:"8°", course:"8-2", color:"bg-yellow-100 text-yellow-900 border-yellow-200" },
  { id:"s22", day:"VIERNES",   startTime:"10:30", endTime:"11:30", subject:"FÍSICA",      grade:"6°", course:"6-6", color:"bg-orange-100 text-orange-900 border-orange-200" },
  { id:"s23", day:"VIERNES",   startTime:"11:30", endTime:"12:30", subject:"MATEMÁTICAS", grade:"6°", course:"6-6", color:"bg-lime-100 text-lime-900 border-lime-200" },
  { id:"s24", day:"VIERNES",   startTime:"12:30", endTime:"13:30", subject:"FÍSICA",      grade:"7°", course:"7-2", color:"bg-orange-100 text-orange-900 border-orange-200" },
];

// ── PROVIDER ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionNotes, setSessionNotes] = useState("");
  const [profile, setProfile] = useState<TeacherProfile>(DEFAULT_PROFILE);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);

  const [masterData, setMasterData] = useState<MasterData>({
    subjects: ["TECNOLOGÍA", "MATEMÁTICAS", "FÍSICA", "ÉTICA"],
    grades: ["PRIMARIA", "6°", "7°", "8°", "9°", "10°", "11°"],
    teachers: ["ANTONIO RODRIGUEZ"],
    courses: ["5-1", "5-2", "6-3", "6-6", "7-2", "7-3", "7-4", "8-2", "8-3", "9-2", "9-4"],
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          const isSuperAdmin = SUPER_ADMINS.includes(firebaseUser.email || "");

          let savedData: Partial<TeacherProfile> = {};

          if (userDoc.exists()) {
            savedData = userDoc.data() as Partial<TeacherProfile>;
          } else {
            // Primer inicio de sesión — crear documento institucional para SuperAdmin
            const newDoc = {
              role: isSuperAdmin ? "RECTOR" : "DOCENTE",
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              isSuperAdmin,
              status: isSuperAdmin ? "ACTIVE" : "PENDING",
              acceptedTerms: false,
              // Los SuperAdmins no requieren completar el onboarding de docente
              isProfileComplete: isSuperAdmin ? true : false,
              firstName: "",
              lastName: "",
              phone: "",
              teachingGrades: [],
              teachingCourses: [],
              teachingSubjectsList: [],
              weeklySchedule: [],
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newDoc);
            savedData = newDoc as Partial<TeacherProfile>;
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

          try {
            const studentsSnap = await getDocs(collection(db, "students"));
            const firestoreStudents = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
            if (firestoreStudents.length > 0) setStudents(firestoreStudents);
          } catch (err) {
            console.warn("No se pudieron cargar estudiantes:", err);
          }

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

    return () => unsubscribe();
  }, []);

  // ── UPDATE PROFILE ─────────────────────────────────────────────────────────
  const updateProfile = async (updates: Partial<TeacherProfile>) => {
    if (!user) return;
    try {
      const merged: TeacherProfile = { ...profile, ...updates };

      if (updates.firstName !== undefined || updates.lastName !== undefined) {
        merged.name = `${merged.firstName} ${merged.lastName}`.trim().toUpperCase() || merged.name;
      }

      if (merged.firstName && merged.lastName && (merged.teachingGrades || []).length > 0) {
        merged.isProfileComplete = true;
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

  const addSubject = (subject: Omit<Subject, "id">) => {
    setSubjects(prev => [...prev, { ...subject, id: `sub-${Date.now()}` }]);
  };

  const updateSubject = (id: string, subject: Partial<Subject>) => {
    setSubjects(prev => prev.map(s => (s.id === id ? { ...s, ...subject } : s)));
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  return (
    <AppContext.Provider value={{
      user, authLoading, logout,
      profile, setProfile, updateProfile,
      subjects, setSubjects,
      students, setStudents, addStudent, importStudents, removeStudent, updateStudent,
      masterData, updateMasterData, removeMasterItem, updateMasterItem,
      addSubject, updateSubject, deleteSubject,
      schedule, setSchedule,
      sessionNotes, setSessionNotes,
      allUsers, refreshUsers, updateUserRole,
      createEmailUser, loginWithEmail, resetPassword, acceptTerms,
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
