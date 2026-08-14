"use client";

import Link from "next/link";
import { LayoutDashboard, Users, Radio, Settings, ShieldCheck, Calendar, BookOpen, FileText, BarChart3 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function BottomNavBar() {
  const pathname = usePathname();

  const { profile } = useApp();

  const navItems = [
    { label: "Inicio", icon: LayoutDashboard, path: "/" },
    { label: "Estudiantes", icon: Users, path: "/estudiantes" },
    { label: "Clase", icon: Radio, path: "/clase-en-vivo", hideForSuper: true },
    { label: "Agenda", icon: FileText, path: "/agenda", hideForSuper: true },
    { label: "Horario", icon: Calendar, path: "/horario", hideForSuper: true },
    { label: "Currículo", icon: BookOpen, path: "/curriculo", hideForSuper: true },
    { label: "Reportes", icon: BarChart3, path: "/reportes" },
  ].filter(item => !(profile.isSuperAdmin && item.hideForSuper));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-outline-variant/30 flex items-center justify-around h-16 px-1 pb-1 z-50 overflow-x-auto scrollbar-none shadow-lg">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center min-w-[52px] py-1 px-1 rounded-xl transition-all touch-target-friendly ${
              isActive ? "text-primary scale-105 bg-primary/10 font-bold" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[8px] font-black uppercase tracking-tighter truncate max-w-[56px] text-center ${isActive ? "opacity-100" : "opacity-70"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
