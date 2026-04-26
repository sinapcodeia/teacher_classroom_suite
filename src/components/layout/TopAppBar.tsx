"use client";

import { useApp } from "@/context/AppContext";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, LogOut, ChevronDown, Search, Bell, Command } from "lucide-react";
import { useState, useRef, useEffect } from "react";



export default function TopAppBar() {
  const { profile, user, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Efecto de scroll para el header
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.replace("/login");
  };

  const allLinks = [
    { label: "Dashboard", path: "/", roles: ["RECTOR", "COORDINADOR", "BIENESTAR", "DOCENTE"] },
    { label: "Estudiantes", path: "/estudiantes", roles: ["RECTOR", "COORDINADOR", "BIENESTAR", "DOCENTE"] },
    { label: "Currículo", path: "/curriculo", roles: ["RECTOR", "COORDINADOR", "DOCENTE"] },
    { label: "Clase", path: "/clase-en-vivo", roles: ["DOCENTE", "RECTOR"] },
    { label: "Horario", path: "/horario", roles: ["RECTOR", "COORDINADOR", "DOCENTE"] },
    { label: "Reportes", path: "/reportes", roles: ["RECTOR", "COORDINADOR", "BIENESTAR"] },
  ];

  const navLinks = allLinks.filter(link => link.roles.includes(profile.role));
  const canSeeAdmin = profile.role === "RECTOR" || profile.role === "COORDINADOR";

  const initials = (profile.name || "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-500 border-b ${
        scrolled 
          ? "bg-white/80 backdrop-blur-xl border-outline-variant/30 shadow-lg" 
          : "bg-white border-transparent"
      } flex items-center px-4 md:px-8 gap-6`}
    >
      {/* Branding - Startup Logo Style */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 bg-on-surface text-white rounded-xl flex items-center justify-center font-black text-sm shadow-xl shadow-on-surface/20">
          TD
        </div>
        <div className="hidden lg:flex flex-col leading-none">
          <span className="text-[11px] font-black tracking-tighter uppercase italic text-on-surface">
            EduManager
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
             <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
             <span className="text-[7px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Sincronizado</span>
          </div>
        </div>
      </div>

      {/* Startup Divider */}
      <div className="hidden md:block w-px h-6 bg-outline-variant/30" />

      {/* Dynamic Navigation */}
      <nav className="hidden md:flex items-center gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            href={link.path}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              pathname === link.path
                ? "bg-on-surface text-white shadow-md scale-105"
                : "text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search / Command Palette Shortcut */}
      <div className="hidden xl:flex items-center gap-3 px-4 py-2 bg-surface-container rounded-2xl border border-outline-variant/20 text-on-surface-variant/40 hover:border-primary/30 transition-all cursor-pointer group">
         <Search size={14} className="group-hover:text-primary transition-colors" />
         <span className="text-[9px] font-black uppercase tracking-widest">Buscar Registro...</span>
         <div className="flex items-center gap-1 ml-6 bg-white/50 px-1.5 py-0.5 rounded-md border border-outline-variant/10">
            <Command size={10} />
            <span className="text-[8px] font-bold">K</span>
         </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-all">
           <Bell size={18} />
           <div className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white" />
        </button>

        {/* Admin Access */}
        {canSeeAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              pathname === "/admin"
                ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105"
                : "bg-surface-container-high text-on-surface hover:bg-primary hover:text-white"
            }`}
          >
            <ShieldCheck size={14} />
            <span className="hidden lg:inline">Admin</span>
          </Link>
        )}

        {/* Profile Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-2xl bg-surface-container border border-outline-variant/10 hover:border-primary/30 transition-all"
          >
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt="Avatar"
                width={32}
                height={32}
                className="w-8 h-8 rounded-xl object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-on-surface text-white flex items-center justify-center text-[10px] font-black">
                {initials}
              </div>
            )}
            <ChevronDown
              size={12}
              className={`text-on-surface-variant transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Premium Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-12 w-72 glass rounded-[2rem] p-4 shadow-2xl animate-fade-in-up">
              {/* User Header */}
              <div className="flex items-center gap-4 p-4 bg-white/50 rounded-2xl border border-white mb-3">
                <div className="w-12 h-12 rounded-xl bg-on-surface text-white flex items-center justify-center text-xs font-black shadow-lg">
                  {initials}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[12px] font-black text-on-surface truncate uppercase leading-none mb-1">
                    {profile.name}
                  </p>
                  <p className="text-[9px] text-on-surface-variant truncate opacity-60 font-bold uppercase tracking-tighter">
                    {profile.role} • {profile.email}
                  </p>
                </div>
              </div>

              {/* Menu Links */}
              <div className="p-1 space-y-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-[11px] font-black text-error hover:bg-error/10 transition-all text-left uppercase tracking-widest"
                >
                  <LogOut size={16} />
                  <span>Cerrar Sesión</span>
                </button>
              </div>

              {/* Version Info */}
              <div className="mt-3 pt-3 border-t border-outline-variant/10 text-center">
                 <p className="text-[8px] font-black text-on-surface-variant/30 uppercase tracking-[0.3em]">
                   v 2.4.0 • Enterprise Edition
                 </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
