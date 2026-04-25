"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
  isActive?: boolean; // Soporte para Borrado Lógico (Soft Delete)
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
  role: 'RECTOR' | 'COORDINADOR' | 'BIENESTAR' | 'DOCENTE';
}

interface AppContextType {
  profile: Profile;
  setProfile: (profile: Profile) => void;
  subjects: Subject[];
  setSubjects: (s: Subject[]) => void;
  students: Student[];
  setStudents: (students: Student[]) => void;
  addStudent: (student: Omit<Student, 'id'>) => void;
  masterData: MasterData;
  updateMasterData: (key: keyof MasterData, list: string[]) => void;
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  schedule: ScheduleEntry[];
  setSchedule: (schedule: ScheduleEntry[]) => void;
  sessionNotes: string;
  setSessionNotes: (notes: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sessionNotes, setSessionNotes] = useState("");
  const [profile, setProfile] = useState<Profile>({
    name: "ING. ANTONIO RODRIGUEZ BURGOS",
    email: "sinapcodeia@gmail.com",
    institution: "IETABA",
    location: "EL DIVISO / NARIÑO",
    role: "DOCENTE"
  });

  // CREDENCIALES (usadas para futura capa de autenticación)
  // Docente: sinapcodeia@gmail.com | Tomiko@6532
  // Rol: DOCENTE — sin permisos de borrado físico de datos de estudiantes

  const [masterData, setMasterData] = useState<MasterData>({
    subjects: ["TECNOLOGÍA", "MATEMÁTICAS", "FÍSICA", "ÉTICA"],
    grades: ["5-1", "5-2", "6-3", "6-6", "7-2", "7-3", "7-4", "8-2", "8-3", "9-2", "9-4"],
    teachers: ["ANTONIO RODRIGUEZ"]
  });

  const [subjects, setSubjects] = useState<Subject[]>([
    { id: "sub-1", name: "TECNOLOGÍA", courses: "8-3, 6-3, 6-6, 9-2, 9-4, 7-4, 5-1, 5-2, 7-3", color: "bg-blue-500" },
    { id: "sub-2", name: "MATEMÁTICAS", courses: "6-6", color: "bg-green-500" },
    { id: "sub-3", name: "FÍSICA", courses: "6-6, 7-2", color: "bg-orange-500" },
    { id: "sub-4", name: "ÉTICA", courses: "8-2", color: "bg-yellow-500" },
  ]);

  const [students, setStudents] = useState<Student[]>([]);

  const [schedule, setSchedule] = useState<ScheduleEntry[]>([
    // LUNES
    { day: "LUNES", time: "07:30 - 08:30", subject: "TECNOLOGÍA", group: "8-3", color: "bg-amber-100 text-amber-900 border-amber-200" },
    { day: "LUNES", time: "08:30 - 09:30", subject: "TECNOLOGÍA", group: "8-3", color: "bg-amber-100 text-amber-900 border-amber-200" },
    { day: "LUNES", time: "09:30 - 10:30", subject: "MATEMÁTICAS", group: "6-6", color: "bg-lime-100 text-lime-900 border-lime-200" },
    { day: "LUNES", time: "11:00 - 11:50", subject: "TECNOLOGÍA", group: "6-3", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
    { day: "LUNES", time: "11:50 - 12:40", subject: "TECNOLOGÍA", group: "6-3", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
    
    // MARTES
    { day: "MARTES", time: "07:30 - 08:30", subject: "TECNOLOGÍA", group: "6-6", color: "bg-sky-100 text-sky-900 border-sky-200" },
    { day: "MARTES", time: "08:30 - 09:30", subject: "TECNOLOGÍA", group: "6-6", color: "bg-sky-100 text-sky-900 border-sky-200" },
    { day: "MARTES", time: "09:30 - 10:30", subject: "TECNOLOGÍA", group: "9-2", color: "bg-pink-100 text-pink-900 border-pink-200" },
    { day: "MARTES", time: "11:00 - 11:50", subject: "TECNOLOGÍA", group: "9-4", color: "bg-purple-100 text-purple-900 border-purple-200" },
    { day: "MARTES", time: "11:50 - 12:40", subject: "MATEMÁTICAS", group: "6-6", color: "bg-lime-100 text-lime-900 border-lime-200" },

    // MIERCOLES
    { day: "MIERCOLES", time: "07:30 - 08:30", subject: "TECNOLOGÍA", group: "7-4", color: "bg-blue-100 text-blue-900 border-blue-200" },
    { day: "MIERCOLES", time: "08:30 - 09:30", subject: "TECNOLOGÍA", group: "7-4", color: "bg-blue-100 text-blue-900 border-blue-200" },
    { day: "MIERCOLES", time: "09:30 - 10:30", subject: "TECNOLOGÍA", group: "6-3", color: "bg-emerald-100 text-emerald-900 border-emerald-200" },
    { day: "MIERCOLES", time: "12:40 - 13:30", subject: "MATEMÁTICAS", group: "6-6", color: "bg-lime-100 text-lime-900 border-lime-200" },

    // JUEVES
    { day: "JUEVES", time: "07:30 - 08:30", subject: "TECNOLOGÍA", group: "5-1", color: "bg-cyan-100 text-cyan-900 border-cyan-200" },
    { day: "JUEVES", time: "09:30 - 10:30", subject: "MATEMÁTICAS", group: "6-6", color: "bg-lime-100 text-lime-900 border-lime-200" },
    { day: "JUEVES", time: "11:50 - 12:40", subject: "TECNOLOGÍA", group: "5-2", color: "bg-green-100 text-green-900 border-green-200" },
    { day: "JUEVES", time: "12:40 - 13:30", subject: "TECNOLOGÍA", group: "5-2", color: "bg-green-100 text-green-900 border-green-200" },

    // VIERNES
    { day: "VIERNES", time: "07:30 - 08:30", subject: "TECNOLOGÍA", group: "7-3", color: "bg-blue-100 text-blue-900 border-blue-200" },
    { day: "VIERNES", time: "08:30 - 09:30", subject: "TECNOLOGÍA", group: "7-3", color: "bg-blue-100 text-blue-900 border-blue-200" },
    { day: "VIERNES", time: "09:30 - 10:30", subject: "ÉTICA", group: "8-2", color: "bg-yellow-100 text-yellow-900 border-yellow-200" },
    { day: "VIERNES", time: "11:00 - 11:50", subject: "FISICA", group: "6-6", color: "bg-orange-100 text-orange-900 border-orange-200" },
    { day: "VIERNES", time: "11:50 - 12:40", subject: "MATEMÁTICAS", group: "6-6", color: "bg-lime-100 text-lime-900 border-lime-200" },
    { day: "VIERNES", time: "12:40 - 13:30", subject: "FISICA", group: "7-2", color: "bg-orange-100 text-orange-900 border-orange-200" },
  ]);

  // Persistencia — cargar al montar componente
  useEffect(() => {
    const savedProfile = localStorage.getItem("edu_profile");
    const savedMasterData = localStorage.getItem("edu_masterData");
    const savedSubjects = localStorage.getItem("edu_subjects");
    const savedStudents = localStorage.getItem("edu_students");
    const savedNotes = localStorage.getItem("edu_sessionNotes");
    
    // Limpiar cualquier horario cacheado para forzar el que está en código
    localStorage.removeItem("edu_schedule");

    if (savedProfile) {
      try { setProfile(JSON.parse(savedProfile)); } catch {}
    }
    if (savedMasterData) {
      try { setMasterData(JSON.parse(savedMasterData)); } catch {}
    }
    if (savedSubjects) {
      try { setSubjects(JSON.parse(savedSubjects)); } catch {}
    }
    if (savedStudents) {
      try { setStudents(JSON.parse(savedStudents)); } catch {}
    }
    if (savedNotes) {
      setSessionNotes(savedNotes);
    }
  }, []);

  // Persistencia — guardar al cambiar datos (horario excluido — siempre en código)
  useEffect(() => {
    localStorage.setItem("edu_profile", JSON.stringify(profile));
    localStorage.setItem("edu_masterData", JSON.stringify(masterData));
    localStorage.setItem("edu_subjects", JSON.stringify(subjects));
    localStorage.setItem("edu_students", JSON.stringify(students));
    localStorage.setItem("edu_sessionNotes", sessionNotes);
  }, [profile, masterData, subjects, students, sessionNotes]);

  const updateMasterData = (key: keyof MasterData, list: string[]) => {
    setMasterData(prev => ({ ...prev, [key]: list }));
  };

  const addStudent = (student: Omit<Student, 'id'>) => {
    const newStudent = { ...student, id: `st-${Date.now()}` };
    setStudents(prev => [...prev, newStudent]);
  };

  const addSubject = (subject: Omit<Subject, 'id'>) => {
    const newSubject = { ...subject, id: `sub-${Date.now()}` };
    setSubjects(prev => [...prev, newSubject]);
  };

  const updateSubject = (id: string, subject: Partial<Subject>) => {
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...subject } : s));
  };

  const deleteSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  return (
    <AppContext.Provider value={{ 
      profile, setProfile, 
      subjects, setSubjects,
      students, setStudents, addStudent,
      masterData, updateMasterData,
      addSubject, updateSubject, deleteSubject,
      schedule, setSchedule,
      sessionNotes, setSessionNotes
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
