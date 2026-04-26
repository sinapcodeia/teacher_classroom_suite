"use client";

import Link from "next/link";
import { LayoutDashboard, Users, Radio, Settings, ShieldCheck, Calendar, BookOpen } from "lucide-react";
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
  ].filter(item => !(profile.isSuperAdmin && item.hideForSuper));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant flex justify-around items-center h-20 px-4 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center gap-1 transition-all ${
              isActive ? "text-primary scale-110" : "text-on-surface-variant"
            }`}
          >
            <item.icon size={22} strokeWidth={isActive ? 3 : 2} />
            <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? "opacity-100" : "opacity-60"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
