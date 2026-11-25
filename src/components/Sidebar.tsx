import React, { memo } from "react";
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
  const isPro = profile.subscriptionTier === "pro";

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
    { id: ROUTES.learning.root, label: "Beranda & Roadmap", icon: LayoutDashboard },
    { id: ROUTES.lab.root, label: "Lab Interaktif AI", icon: Terminal },
    { id: ROUTES.learning.catalog, label: "Belajar & Kursus", icon: BookOpen },
    { id: ROUTES.arena.root, label: "Arena & Liga", icon: Trophy },
    { id: ROUTES.career.jobs, label: "Karier & Portofolio", icon: Briefcase },
  ];

  const workspaceShortcuts = [
    { id: ROUTES.learning.lmsWorkspace, label: "Ruang LMS (Fokus)", icon: Layers },
    { id: ROUTES.learning.practice, label: "Latihan & Bank Soal", icon: Zap },
    { id: ROUTES.learning.project, label: "Proyek & Sertifikat", icon: Award },
    { id: ROUTES.career.cvBuilder, label: "CV ATS & Interview AI", icon: FileText },
    { id: ROUTES.community.forum, label: "Forum Komunitas", icon: Users },
    { id: ROUTES.community.collaboration, label: "Ruang Kolaborasi", icon: MessageSquare },
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
    <aside className="hidden lg:flex w-[240px] shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 h-full relative z-30">
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <Link to={ROUTES.learning.root} className="flex items-center cursor-pointer" aria-label="Skillora Beranda">
          <SkilloraLogo variant="full" size="sm" />
        </Link>
        {isPro && (
          <span className="text-[11px] font-mono font-semibold tracking-wide text-emerald-700 dark:text-emerald-400">
            PRO
          </span>
        )}
      </div>

      {/* Navigation Body */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* 5 Core Pillars */}
        <div>
          <p className="px-2.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Ruang Utama
          </p>
          <nav className="space-y-0.5" aria-label="Navigasi Utama">
            {primaryPillars.map((item) => {
              const active = isActive(item.id);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.id}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors ${
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
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Workspace Shortcuts */}
        <div>
          <p className="px-2.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Alat & Komunitas
          </p>
          <nav className="space-y-0.5" aria-label="Alat dan Komunitas">
            {workspaceShortcuts.map((item) => {
              const active = isActive(item.id);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.id}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
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
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Conditional Partner Portals */}
        {partnerItems.length > 0 && (
          <div>
            <p className="px-2.5 mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Portal Mitra
            </p>
            <nav className="space-y-0.5" aria-label="Portal Mitra">
              {partnerItems.map((item) => {
                const active = isActive(item.id);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    to={item.id}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors ${
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
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Clean Footer: Scholarship Mission + Profile + Logout */}
      <div className="p-3 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2">
        <Link
          to={ROUTES.upgrade}
          className="flex items-center justify-between px-2.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:border-emerald-500/50 transition-colors text-xs font-semibold text-zinc-800 dark:text-zinc-200"
        >
          <span className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isPro ? "Mitra & Sponsor Aktif" : "Sponsor & Mitra HRD"}</span>
          </span>
          <span className="text-[11px] text-zinc-400">→</span>
        </Link>

        <div className="flex items-center justify-between gap-2 px-1.5 pt-1">
          <Link
            to={ROUTES.profile.root}
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-sm shrink-0">
              {profile.selectedAvatar || profile.avatar || "🦁"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {profile.name}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate tabular-nums">
                {roleText} · Lv.{profile.level || 1}
              </p>
            </div>
          </Link>
          <button
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
