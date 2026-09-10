"use client";

import { useApp } from "@/context/AppContext";
import Link from "next/link";
import Image from "next/image";
import { APP_VERSION_LABEL } from "@/lib/version";
import { usePathname, useRouter } from "next/navigation";
import { 
  ShieldCheck, LogOut, ChevronDown, 
  CalendarDays, Sparkles, HelpCircle, Menu, X, LayoutDashboard,
  Users, Radio, Calendar, BookOpen, BarChart3, Settings as SettingsIcon, Building2
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { DeveloperEasterEggModal } from "@/components/shared/DeveloperEasterEggModal";

export default function TopAppBar() {
  const { profile, user, logout, isOnline, masterData } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Easter Egg State
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [countdownToast, setCountdownToast] = useState<string | null>(null);

  const handleLogoClick = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastClickTime;
    
    let newCount = 1;
    if (timeDiff < 1800) {
      newCount = logoClicks + 1;
    }
    
    setLastClickTime(now);
    setLogoClicks(newCount);

    if (newCount >= 7) {
      setLogoClicks(0);
      setCountdownToast(null);
      setShowEasterEgg(true);
    } else if (newCount >= 3) {
      const remaining = 7 - newCount;
      setCountdownToast(`¡A ${remaining} toques del Modo Creador!`);
    }
  }, [lastClickTime, logoClicks]);

  useEffect(() => {
    if (!countdownToast) return;
    const timer = setTimeout(() => {
      setCountdownToast(null);
      setLogoClicks(0);
    }, 2000);
    return () => clearTimeout(timer);
  }, [countdownToast, logoClicks]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cerrar menús al hacer clic fuera o navegar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setMobileDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    setMenuOpen(false);
    setMobileDrawerOpen(false);
    await logout();
    router.replace("/login");
  };

  const allLinks = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard, roles: ["RECTOR", "COORDINADOR", "BIENESTAR", "DOCENTE", "DOCENTE_DIRECTOR"] },
    { label: "Estudiantes", path: "/estudiantes", icon: Users, roles: ["RECTOR", "COORDINADOR", "BIENESTAR", "DOCENTE", "DOCENTE_DIRECTOR"] },
    { label: "Directorio", path: "/directorio", icon: Building2, roles: ["RECTOR", "COORDINADOR", "BIENESTAR", "DOCENTE", "DOCENTE_DIRECTOR"] },
    { label: "Currículo", path: "/curriculo", icon: BookOpen, roles: ["COORDINADOR", "DOCENTE", "DOCENTE_DIRECTOR"], hideForSuper: true },
    { label: "Clase en Vivo", path: "/clase-en-vivo", icon: Radio, roles: ["DOCENTE", "DOCENTE_DIRECTOR"], hideForSuper: true },
    { label: "Horario", path: "/horario", icon: Calendar, roles: ["COORDINADOR", "DOCENTE", "DOCENTE_DIRECTOR"], hideForSuper: true },
    { label: "Reportes", path: "/reportes", icon: BarChart3, roles: ["RECTOR", "COORDINADOR", "BIENESTAR", "DOCENTE", "DOCENTE_DIRECTOR"] },
    { label: "Centro de Ayuda", path: "/ayuda", icon: HelpCircle, roles: ["RECTOR", "COORDINADOR", "BIENESTAR", "DOCENTE", "DOCENTE_DIRECTOR"] },
  ];

  const navLinks = allLinks.filter(link => {
    const hasRole = link.roles.includes(profile.role);
    if (profile.isSuperAdmin && link.hideForSuper) return false;
    return hasRole;
  });
  const canSeeAdmin = profile.role === "RECTOR" || profile.role === "COORDINADOR";

  const initials = (profile.name || "U")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  const periodLabel =
    masterData?.activePeriod === "p1" ? "PERIODO 1" :
    masterData?.activePeriod === "p2" ? "PERIODO 2" :
    masterData?.activePeriod === "p3" ? "PERIODO 3" : "PERIODO";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 border-b print:hidden no-print ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl border-outline-variant/30 shadow-md"
            : "bg-white border-outline-variant/10"
        } flex items-center px-3 sm:px-4 md:px-8 gap-2 sm:gap-4`}
      >
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={() => setMobileDrawerOpen(o => !o)}
          className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
          title="Menú de Navegación"
          aria-label="Abrir Menú"
        >
          {mobileDrawerOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Branding with Easter Egg Trigger */}
        <div
          className="relative flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer group select-none active:scale-95 transition-transform"
          onClick={handleLogoClick}
          title="IETABA EduManager Suite"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center shadow-md overflow-hidden border border-outline-variant/10 relative group-hover:shadow-amber-500/20 group-hover:border-amber-400/50 transition-all">
            <Image
              src="/logo.png"
              alt="Logo IETABA"
              fill
              sizes="40px"
              className="object-contain p-1 group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-black tracking-tighter uppercase italic text-on-surface group-hover:text-amber-600 transition-colors">
              EduManager
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              <span className="text-[7px] font-black text-on-surface-variant uppercase tracking-[0.3em]">IETABA</span>
            </div>
          </div>

          {/* Easter Egg Floating Hint Pill */}
          {countdownToast && (
            <div className="absolute top-12 left-0 z-50 px-3 py-1 bg-slate-900 text-amber-400 rounded-full border border-amber-400/50 shadow-xl text-[10px] font-black tracking-wider whitespace-nowrap flex items-center gap-1.5 animate-bounce">
              <Sparkles size={12} className="text-amber-400 animate-spin" />
              {countdownToast}
            </div>
          )}
        </div>

        {/* Startup Divider */}
        <div className="hidden md:block w-px h-6 bg-outline-variant/30" />

        {/* Active Period Badge */}
        <div
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100 shadow-xs shrink-0"
          title="Periodo académico activo"
        >
          <CalendarDays size={13} className="text-indigo-500" />
          <span className="text-[9px] font-black text-indigo-700 uppercase tracking-widest">
            {periodLabel}
          </span>
          {masterData?.periodStatus?.[masterData?.activePeriod] === "open" && (
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </div>

        <div className="hidden md:block w-px h-6 bg-outline-variant/30" />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              href={link.path}
              className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
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

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cloud Sync Status */}
          {isOnline ? (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">En Línea</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-full border border-amber-200">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[8px] font-black text-amber-700 uppercase tracking-widest">Modo Local</span>
            </div>
          )}

          {/* Admin Access */}
          {canSeeAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                pathname === "/admin"
                  ? "bg-primary text-white shadow-md scale-105"
                  : "bg-surface-container-high text-on-surface hover:bg-primary hover:text-white"
              }`}
            >
              <ShieldCheck size={14} />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}

          {/* Profile Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-2xl bg-surface-container border border-outline-variant/10 hover:border-primary/30 transition-all"
            >
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt="Avatar"
                  width={30}
                  height={30}
                  className="rounded-xl object-cover shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7.5 h-7.5 rounded-xl bg-on-surface text-white flex items-center justify-center text-[10px] font-black">
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
              <div className="absolute right-0 top-12 w-72 bg-white/95 backdrop-blur-2xl rounded-[2rem] p-4 shadow-2xl border border-outline-variant/30 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-2xl border border-outline-variant/20 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-on-surface text-white flex items-center justify-center text-xs font-black shadow-md shrink-0">
                    {initials}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-black text-on-surface truncate uppercase leading-none mb-1">
                      {profile.name}
                    </p>
                    <p className="text-[9px] text-on-surface-variant truncate opacity-80 font-bold uppercase tracking-tighter">
                      {profile.role} • {profile.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Link
                    href="/configuracion"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[11px] font-black text-on-surface hover:bg-slate-100 transition-all text-left uppercase tracking-widest"
                  >
                    <SettingsIcon size={15} />
                    <span>Mi Configuración</span>
                  </Link>

                  <Link
                    href="/ayuda"
                    onClick={() => setMenuOpen(false)}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[11px] font-black text-teal-700 hover:bg-teal-50 transition-all text-left uppercase tracking-widest"
                  >
                    <HelpCircle size={15} />
                    <span>Centro de Ayuda & Manual</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[11px] font-black text-error hover:bg-rose-50 transition-all text-left uppercase tracking-widest"
                  >
                    <LogOut size={15} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>

                <div className="mt-2.5 pt-2.5 border-t border-outline-variant/10 text-center">
                  <p className="text-[8px] font-black text-on-surface-variant/40 uppercase tracking-[0.2em]">
                    {APP_VERSION_LABEL} · IETABA Suite
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── MOBILE SLIDE-OVER NAVIGATION DRAWER ──────────────────────────── */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setMobileDrawerOpen(false)} 
          />
          <div className="relative w-[280px] max-w-[80vw] h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            
            {/* Mobile Drawer Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                  <Image src="/logo.png" alt="Logo" width={22} height={22} className="object-contain" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight">EduManager</h4>
                  <p className="text-[8px] text-teal-300 font-bold uppercase tracking-widest">{periodLabel}</p>
                </div>
              </div>
              <button 
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile User Profile Summary */}
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden">
                <p className="text-[11px] font-black text-slate-800 truncate uppercase">{profile.name}</p>
                <p className="text-[8px] font-bold text-teal-700 uppercase tracking-wider">{profile.role}</p>
              </div>
            </div>

            {/* Mobile Nav Items */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {navLinks.map(link => {
                const isActive = pathname === link.path;
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.path}
                    href={link.path}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-teal-700 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <IconComponent size={17} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              <div className="pt-2 border-t border-slate-200 space-y-1">
                <Link
                  href="/configuracion"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-black text-slate-700 hover:bg-slate-100 uppercase tracking-wider"
                >
                  <SettingsIcon size={17} />
                  <span>Configuración</span>
                </Link>
              </div>
            </nav>

            {/* Mobile Drawer Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-black uppercase tracking-wider transition-all"
              >
                <LogOut size={15} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Developer Tribute Modal */}
      <DeveloperEasterEggModal
        isOpen={showEasterEgg}
        onClose={() => setShowEasterEgg(false)}
      />
    </>
  );
}
