import React, { memo, useState } from "react";
import {
  LayoutDashboard,
  Terminal,
  BookOpen,
  Trophy,
  Briefcase,
  Users,
  ShieldCheck,
  Building2,
  Layers,
  LogOut,
  Sparkles,
  FileText,
  Award,
  Zap,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Profile } from "../types";
import { SkilloraLogo } from "./SkilloraLogo";
import { ROUTES } from "../routes";

interface SidebarProps {
  profile: Profile;
  onLogout: () => void;
}

export const Sidebar = memo(function Sidebar({ profile, onLogout }: SidebarProps) {
  const location = useLocation();
  const accountRole = profile.accountRole || "student";
  const isSponsorOrPartner = profile.subscriptionTier === "pro";

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("skillora_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("skillora_sidebar_collapsed", String(next));
      } catch {
        // ignore storage restrictions
      }
      return next;
    });
  };

  const isActive = (path: string) => {
    if (path === ROUTES.learning.root) {
      return location.pathname === ROUTES.learning.root || location.pathname === "/";
    }
    if (path === ROUTES.lab.root) {
      return location.pathname.startsWith("/lab");
    }
    if (path === ROUTES.arena.root) {
      return location.pathname.startsWith("/arena");
    }
    if (path === ROUTES.learning.catalog) {
      return (
        location.pathname.startsWith("/belajar/katalog") ||
        location.pathname.startsWith("/belajar/kursus")
      );
    }
    if (path === ROUTES.career.jobs) {
      return location.pathname === ROUTES.career.jobs;
    }
    return location.pathname.startsWith(path);
  };

  const primaryPillars = [
    { id: ROUTES.learning.root, label: "Beranda Belajar", icon: LayoutDashboard },
    { id: ROUTES.lab.root, label: "Lab Praktik Kode", icon: Terminal },
    { id: ROUTES.learning.catalog, label: "Katalog Pelatihan", icon: BookOpen },
    { id: ROUTES.arena.root, label: "Arena Tryout & Lomba", icon: Trophy },
    { id: ROUTES.career.jobs, label: "Lowongan & Portofolio", icon: Briefcase },
  ];

  const workspaceShortcuts = [
    { id: ROUTES.learning.lmsWorkspace, label: "Ruang Belajar Fokus", icon: Layers },
    { id: ROUTES.learning.practice, label: "Latihan & Bank Soal", icon: Zap },
    { id: ROUTES.learning.project, label: "Proyek & Sertifikat", icon: Award },
    { id: ROUTES.career.cvBuilder, label: "CV & Wawancara AI", icon: FileText },
    { id: ROUTES.community.forum, label: "Forum Diskusi", icon: Users },
    { id: ROUTES.community.collaboration, label: "Kerja Kelompok", icon: MessageSquare },
  ];

  const partnerItems: Array<{ id: string; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }> = [];
  if (accountRole === "mentor" || accountRole === "admin" || profile.role?.toLowerCase() === "developer") {
    partnerItems.push({ id: ROUTES.mentor.root, label: "Portal Mentor", icon: ShieldCheck });
    partnerItems.push({ id: ROUTES.lms, label: "Kelola Kurikulum", icon: Layers });
  }
  if (accountRole === "recruiter" || accountRole === "admin" || profile.role?.toLowerCase() === "developer") {
    partnerItems.push({ id: ROUTES.recruiter.root, label: "Portal HRD", icon: Building2 });
  }

  const roleText =
    accountRole === "recruiter"
      ? "Recruiter HRD"
      : accountRole === "mentor"
      ? "Mentor"
      : accountRole === "admin"
      ? "Admin"
      : "Mahasiswa";

  return (
    <aside
      className={`hidden lg:flex shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 h-full relative z-30 transition-[width] duration-200 ease-out ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
    >
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80">
        {!collapsed ? (
          <Link to={ROUTES.learning.root} className="flex items-center gap-2 min-w-0 cursor-pointer" aria-label="Skillora Beranda">
            <SkilloraLogo variant="full" size="sm" />
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 shrink-0">
              GRATIS
            </span>
          </Link>
        ) : (
          <Link to={ROUTES.learning.root} className="mx-auto cursor-pointer" aria-label="Skillora Beranda">
            <SkilloraLogo variant="icon" size="sm" />
          </Link>
        )}

        {!collapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label="Ciutkan sidebar"
            title="Ciutkan sidebar"
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand toggle strip when collapsed */}
      {collapsed && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label="Lebarkan sidebar"
            title="Lebarkan sidebar"
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Body */}
      <div className={`flex-1 overflow-y-auto ${collapsed ? "px-2 py-3 space-y-4" : "px-3 py-4 space-y-6"}`}>
        {/* 5 Core Pillars */}
        <div>
          {!collapsed && (
            <p className="px-2.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Ruang Utama
            </p>
          )}
          <nav className="space-y-0.5" aria-label="Navigasi Utama">
            {primaryPillars.map((item) => {
              const active = isActive(item.id);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.id}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center ${collapsed ? "justify-center px-2 py-2.5" : "gap-2.5 px-2.5 py-2"} rounded-lg text-[13px] transition-colors ${
                    active
                      ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 font-medium"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"
                    }`}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Workspace Shortcuts */}
        <div>
          {!collapsed && (
            <p className="px-2.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Alat & Komunitas
            </p>
          )}
          <nav className="space-y-0.5" aria-label="Alat dan Komunitas">
            {workspaceShortcuts.map((item) => {
              const active = isActive(item.id);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.id}
                  title={collapsed ? item.label : undefined}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center ${collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-2.5 py-1.5"} rounded-lg text-[13px] transition-colors ${
                    active
                      ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 font-medium"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"
                    }`}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Conditional Partner Portals */}
        {partnerItems.length > 0 && (
          <div>
            {!collapsed && (
              <p className="px-2.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Portal Mitra
              </p>
            )}
            <nav className="space-y-0.5" aria-label="Portal Mitra">
              {partnerItems.map((item) => {
                const active = isActive(item.id);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    to={item.id}
                    title={collapsed ? item.label : undefined}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center ${collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-2.5 py-1.5"} rounded-lg text-[13px] transition-colors ${
                      active
                        ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-white font-semibold"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 font-medium"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"
                      }`}
                      strokeWidth={active ? 2.2 : 1.8}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Clean Footer: Scholarship Mission + Profile + Logout */}
      <div className="p-2.5 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
        <Link
          to={ROUTES.upgrade}
          title={collapsed ? (isSponsorOrPartner ? "Mitra & Sponsor Aktif" : "Sponsor & Mitra HRD") : undefined}
          className={`flex items-center ${
            collapsed ? "justify-center p-2" : "justify-between px-2.5 py-2"
          } rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-emerald-500/50 transition-colors text-xs font-semibold text-zinc-800 dark:text-zinc-200`}
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {!collapsed && <span>{isSponsorOrPartner ? "Mitra & Sponsor Aktif" : "Sponsor & Mitra HRD"}</span>}
          </span>
          {!collapsed && <span className="text-[11px] text-zinc-400">→</span>}
        </Link>

        <div className={`flex items-center ${collapsed ? "justify-center flex-col gap-2" : "justify-between gap-2 px-1.5"} pt-1`}>
          <Link
            to={ROUTES.profile.root}
            title={collapsed ? `${profile.name} (${roleText})` : undefined}
            className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5 min-w-0 flex-1"} hover:opacity-85 transition-opacity`}
          >
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-sm shrink-0">
              {profile.selectedAvatar || profile.avatar || "🦁"}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {profile.name}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate tabular-nums">
                  {roleText} · Lv.{profile.level || 1}
                </p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Keluar dari akun"
            title="Keluar"
            className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
});

export default Sidebar;
