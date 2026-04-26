"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc } from "firebase/firestore";

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
}

interface Profile {
  name: string;
  email: string;
  institution: string;
  location: string;
  role: "RECTOR" | "COORDINADOR" | "BIENESTAR" | "DOCENTE";
  status: "ACTIVE" | "PENDING";
  acceptedTerms?: boolean;
  isSuperAdmin?: boolean;
}

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
  // DATA
  profile: Profile;
  setProfile: (profile: Profile) => void;
  subjects: Subject[];
  setSubjects: (s: Subject[]) => void;
  students: Student[];
  setStudents: (students: Student[]) => void;
  addStudent: (student: Omit<Student, "id">) => void;
  masterData: MasterData;
  updateMasterData: (key: keyof MasterData, list: string[]) => void;
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

  const DEFAULT_PROFILE: Profile = {
    name: "USUARIO",
    email: "",
    institution: "IETABA",
    location: "EL DIVISO / NARIÑO",
    role: "DOCENTE",
    status: "PENDING",
  };

const SUPER_ADMINS = ["sinapcodeia@gmail.com", "antonio_rburgos@msn.com"];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionNotes, setSessionNotes] = useState("");
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);

  const [masterData, setMasterData] = useState<MasterData>({
    subjects: ["TECNOLOGÍA", "MATEMÁTICAS", "FÍSICA", "ÉTICA"],
    grades: ["5-1", "5-2", "6-3", "6-6", "7-2", "7-3", "7-4", "8-2", "8-3", "9-2", "9-4"],
    teachers: ["ANTONIO RODRIGUEZ"],
  });

  const [subjects, setSubjects] = useState<Subject[]>([
    { id: "sub-1", name: "TECNOLOGÍA", courses: "8-3, 6-3, 6-6, 9-2, 9-4, 7-4, 5-1, 5-2, 7-3", color: "bg-blue-500" },
    { id: "sub-2", name: "MATEMÁTICAS", courses: "6-6", color: "bg-green-500" },
    { id: "sub-3", name: "FÍSICA", courses: "6-6, 7-2", color: "bg-orange-500" },
    { id: "sub-4", name: "ÉTICA", courses: "8-2", color: "bg-yellow-500" },
  ]);

  const [students, setStudents] = useState<Student[]>([]);

  const [schedule, setSchedule] = useState<ScheduleEntry[]>([
    { day: "LUNES", time: "07:30 - 08:30", subject: "TECNOLOGÍA", group: "8-3", color: "bg-amber-100 text-amber-900 border-amber-200" },
    { day: "LUNES", time: "08:30 - 09:30", subject: "TECNOLOGÍA", group: "8-3", color: "bg-amber-100 text-amber-900 border-amber-200" },
    { day: "LUNES", time: "09:30 - 10:30", subject: "MATEMÁTICAS", group: "6-6", color: "bg-lime-100 text-lime-900 border-lime-200" },
    { day: "LUNES", time: "11:00 - 11:50", subject: "TECNOLOGÍA", group: "6-3", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
    { day: "LUNES", time: "11:50 - 12:40", subject: "TECNOLOGÍA", group: "6-3", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
    { day: "MARTES", time: "07:30 - 08:30", subject: "TECNOLOGÍA", group: "6-6", color: "bg-sky-100 text-sky-900 border-sky-200" },
    { day: "MARTES", time: "08:30 - 09:30", subject: "TECNOLOGÍA", group: "6-6", color: "bg-sky-100 text-sky-900 border-sky-200" },
    { day: "MARTES", time: "09:30 - 10:30", subject: "TECNOLOGÍA", group: "9-2", color: "bg-pink-100 text-pink-900 border-pink-200" },
    { day: "MARTES", time: "11:00 - 11:50", subject: "TECNOLOGÍA", group: "9-4", color: "bg-purple-100 text-purple-900 border-purple-200" },
    { day: "MARTES", time: "11:50 - 12:40", subject: "MATEMÁTICAS", group: "6-6", color: "bg-lime-100 text-lime-900 border-lime-200" },
    { day: "MIERCOLES", time: "07:30 - 08:30", subject: "TECNOLOGÍA", group: "7-4", color: "bg-blue-100 text-blue-900 border-blue-200" },
    { day: "MIERCOLES", time: "08:30 - 09:30", subject: "TECNOLOGÍA", group: "7-4", color: "bg-blue-100 text-blue-900 border-blue-200" },
    { day: "MIERCOLES", time: "09:30 - 10:30", subject: "TECNOLOGÍA", group: "6-3", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
    { day: "MIERCOLES", time: "12:40 - 13:30", subject: "MATEMÁTICAS", group: "6-6", color: "bg-lime-100 text-lime-900 border-lime-200" },
    { day: "JUEVES", time: "07:30 - 08:30", subject: "TECNOLOGÍA", group: "5-1", color: "bg-cyan-100 text-cyan-900 border-cyan-200" },
    { day: "JUEVES", time: "09:30 - 10:30", subject: "MATEMÁTICAS", group: "6-6", color: "bg-lime-100 text-lime-900 border-lime-200" },
    { day: "JUEVES", time: "11:50 - 12:40", subject: "TECNOLOGÍA", group: "5-2", color: "bg-green-100 text-green-900 border-green-200" },
    { day: "JUEVES", time: "12:40 - 13:30", subject: "TECNOLOGÍA", group: "5-2", color: "bg-green-100 text-green-900 border-green-200" },
    { day: "VIERNES", time: "07:30 - 08:30", subject: "TECNOLOGÍA", group: "7-3", color: "bg-blue-100 text-blue-900 border-blue-200" },
    { day: "VIERNES", time: "08:30 - 09:30", subject: "TECNOLOGÍA", group: "7-3", color: "bg-blue-100 text-blue-900 border-blue-200" },
    { day: "VIERNES", time: "09:30 - 10:30", subject: "ÉTICA", group: "8-2", color: "bg-yellow-100 text-yellow-900 border-yellow-200" },
    { day: "VIERNES", time: "11:00 - 11:50", subject: "FISICA", group: "6-6", color: "bg-orange-100 text-orange-900 border-orange-200" },
    { day: "VIERNES", time: "11:50 - 12:40", subject: "MATEMÁTICAS", group: "6-6", color: "bg-lime-100 text-lime-900 border-lime-200" },
    { day: "VIERNES", time: "12:40 - 13:30", subject: "FISICA", group: "7-2", color: "bg-orange-100 text-orange-900 border-orange-200" },
  ]);

  // ── AUTH LISTENER ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          let role: Profile["role"] = "DOCENTE";
          let status: Profile["status"] = "PENDING";
          let acceptedTerms = false;

          if (userDoc.exists()) {
            const userData = userDoc.data();
            role = (userData.role as Profile["role"]) || "DOCENTE";
            status = (userData.status as Profile["status"]) || "ACTIVE";
            acceptedTerms = userData.acceptedTerms || false;
          } else {
            // Primer login
            const isSuperAdmin = SUPER_ADMINS.includes(firebaseUser.email || "");
            role = isSuperAdmin ? "RECTOR" : "DOCENTE";
            status = isSuperAdmin ? "ACTIVE" : "PENDING";
            acceptedTerms = false;

            await setDoc(userDocRef, {
              role,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              isSuperAdmin,
              status,
              acceptedTerms,
              createdAt: new Date().toISOString(),
            });
          }

          setProfile({
            name: (firebaseUser.displayName || DEFAULT_PROFILE.name).toUpperCase(),
            email: firebaseUser.email || "",
            institution: DEFAULT_PROFILE.institution,
            location: DEFAULT_PROFILE.location,
            role,
            status,
            acceptedTerms,
            isSuperAdmin: SUPER_ADMINS.includes(firebaseUser.email || ""),
          });
          setUser(firebaseUser);
        } catch (err) {
          console.error("Error al obtener perfil de usuario:", err);
        }
      } else {
        setUser(null);
        setProfile(DEFAULT_PROFILE);
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
        email,
        displayName: name,
        role,
        status: "ACTIVE", // Creado por admin -> Activo
        createdAt: new Date().toISOString()
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

  // ── PERSISTENCIA — cargar al montar ───────────────────────────────────────
  useEffect(() => {
    const savedMasterData = localStorage.getItem("edu_masterData");
    const savedSubjects = localStorage.getItem("edu_subjects");
    const savedStudents = localStorage.getItem("edu_students");
    const savedNotes = localStorage.getItem("edu_sessionNotes");

    localStorage.removeItem("edu_schedule"); 

    if (savedMasterData) try { setMasterData(JSON.parse(savedMasterData)); } catch { /* ignore */ }
    if (savedSubjects) try { setSubjects(JSON.parse(savedSubjects)); } catch { /* ignore */ }
    if (savedStudents) try { setStudents(JSON.parse(savedStudents)); } catch { /* ignore */ }
    if (savedNotes) setSessionNotes(savedNotes);
  }, []);

  // ── PERSISTENCIA — guardar al cambiar ─────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("edu_masterData", JSON.stringify(masterData));
    localStorage.setItem("edu_subjects", JSON.stringify(subjects));
    localStorage.setItem("edu_students", JSON.stringify(students));
    localStorage.setItem("edu_sessionNotes", sessionNotes);
  }, [masterData, subjects, students, sessionNotes]);

  // ── HELPERS ───────────────────────────────────────────────────────────────
  const logout = async () => {
    await signOut(auth);
  };

  const updateMasterData = (key: keyof MasterData, list: string[]) => {
    setMasterData((prev) => ({ ...prev, [key]: list }));
  };

  const addStudent = (student: Omit<Student, "id">) => {
    setStudents((prev) => [...prev, { ...student, id: `st-${Date.now()}` }]);
  };

  const addSubject = (subject: Omit<Subject, "id">) => {
    setSubjects((prev) => [...prev, { ...subject, id: `sub-${Date.now()}` }]);
  };

  const updateSubject = (id: string, subject: Partial<Subject>) => {
    setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, ...subject } : s)));
  };

  const deleteSubject = (id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        user, authLoading, logout,
        profile, setProfile,
        subjects, setSubjects,
        students, setStudents, addStudent,
        masterData, updateMasterData,
        addSubject, updateSubject, deleteSubject,
        schedule, setSchedule,
        sessionNotes, setSessionNotes,
        allUsers, refreshUsers, updateUserRole,
        createEmailUser, loginWithEmail, resetPassword, acceptTerms
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error("useApp must be used within an AppProvider");
  return context;
}
