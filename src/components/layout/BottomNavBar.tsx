"use client";

import Link from "next/link";
import { LayoutDashboard, Users, Radio, Calendar, BookOpen, BarChart3, HelpCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";

export default function BottomNavBar() {
  const pathname = usePathname();
  const { profile } = useApp();

  const navItems = [
    { label: "Inicio", icon: LayoutDashboard, path: "/" },
    { label: "Estudiantes", icon: Users, path: "/estudiantes" },
    { label: "Clase", icon: Radio, path: "/clase-en-vivo", hideForSuper: true },
    { label: "Horario", icon: Calendar, path: "/horario", hideForSuper: true },
    { label: "Currículo", icon: BookOpen, path: "/curriculo", hideForSuper: true },
    { label: "Reportes", icon: BarChart3, path: "/reportes" },
    { label: "Ayuda", icon: HelpCircle, path: "/ayuda" },
  ].filter(item => !(profile.isSuperAdmin && item.hideForSuper));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 flex items-center justify-around h-16 px-1 z-40 shadow-xl select-none print:hidden no-print">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center min-w-[46px] py-1.5 px-1 rounded-xl transition-all active:scale-95 ${
              isActive 
                ? "text-teal-700 font-black bg-teal-50 shadow-2xs" 
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <item.icon size={18} strokeWidth={isActive ? 2.6 : 2} />
            <span className={`text-[8.5px] uppercase tracking-tighter truncate max-w-[50px] text-center mt-0.5 ${
              isActive ? "font-black opacity-100" : "font-semibold opacity-70"
            }`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
