"use client";

import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function TopAppBar() {
  const { profile } = useApp();
  const pathname = usePathname();

  const navLinks = [
    { label: "Inicio", path: "/" },
    { label: "Estudiantes", path: "/estudiantes" },
    { label: "Currículo", path: "/curriculo" },
    { label: "Clase", path: "/clase-en-vivo" },
    { label: "Horario", path: "/horario" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-outline-variant shadow-sm flex items-center px-3 md:px-6 gap-3">
      {/* Logo — ancho fijo */}
      <div className="flex items-center gap-2 shrink-0 w-[120px] md:w-[160px]">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
          TD
        </div>
        <div className="hidden sm:flex flex-col leading-none overflow-hidden">
          <span className="text-[10px] font-black tracking-tighter uppercase italic text-on-surface truncate">EduManager</span>
          <span className="text-[6px] font-black bg-primary/10 text-primary px-1 py-0.5 rounded mt-0.5 uppercase tracking-widest w-fit">
            {profile.role}
          </span>
        </div>
      </div>

      {/* Navegación Central — toma el espacio restante */}
      <nav className="hidden md:flex flex-1 items-center justify-center gap-1 min-w-0">
        {navLinks.map(link => (
          <Link
            key={link.path}
            href={link.path}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all ${
              pathname === link.path
                ? "bg-primary/10 text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Derecha — ancho fijo */}
      <div className="ml-auto shrink-0 flex items-center gap-2">
        <Link
          href="/admin"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            pathname === "/admin"
              ? "bg-primary text-white shadow-lg"
              : "bg-on-surface text-white hover:bg-primary"
          }`}
        >
          <ShieldCheck size={14} />
          <span>Administración</span>
        </Link>
      </div>
    </header>
  );
}
