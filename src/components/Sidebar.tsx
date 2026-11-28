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
  FileText,
  Award,
  Zap,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Compass,
  HeartHandshake,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Profile } from "../types";
import { SkilloraLogo } from "./SkilloraLogo";
import { ROUTES } from "../routes";

interface SidebarProps {
  profile: Profile;
  onLogout: () => void;
}

function getUserInitials(name?: string): string {
  if (!name) return "SK";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
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
    { id: ROUTES.learning.catalog, label: "Katalog Kursus", icon: BookOpen },
    { id: ROUTES.lab.root, label: "Lab Praktik", icon: Terminal },
    { id: ROUTES.arena.root, label: "Arena & Liga", icon: Trophy },
    { id: ROUTES.career.jobs, label: "Bursa Karier", icon: Briefcase },
  ];

  const workspaceShortcuts = [
    { id: ROUTES.learning.lmsWorkspace, label: "Ruang LMS Fokus", icon: Layers },
    { id: ROUTES.learning.practice, label: "Latihan & Soal", icon: Zap },
    { id: ROUTES.learning.project, label: "Sertifikasi", icon: Award },
    { id: ROUTES.career.cvBuilder, label: "CV ATS Builder", icon: FileText },
    { id: ROUTES.community.forum, label: "Forum Diskusi", icon: Users },
    { id: ROUTES.community.collaboration, label: "Kolaborasi Tim", icon: MessageSquare },
  ];

  const partnerItems: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  }> = [];
  if (
    accountRole === "mentor" ||
    accountRole === "admin" ||
    profile.role?.toLowerCase() === "developer"
  ) {
    partnerItems.push({ id: ROUTES.mentor.root, label: "Portal Mentor", icon: ShieldCheck });
    partnerItems.push({ id: ROUTES.lms, label: "Kelola Kurikulum", icon: Layers });
  }
  if (
    accountRole === "recruiter" ||
    accountRole === "admin" ||
    profile.role?.toLowerCase() === "developer"
  ) {
    partnerItems.push({ id: ROUTES.recruiter.root, label: "Portal HRD", icon: Building2 });
  }

  const roleText =
    accountRole === "recruiter"
      ? "Recruiter"
      : accountRole === "mentor"
      ? "Mentor"
      : accountRole === "admin"
      ? "Admin"
      : "Pelajar";

  const initials = getUserInitials(profile.name);

  return (
    <aside
      className={`hidden lg:flex shrink-0 flex-col border-r border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#0c0c0e] h-full relative z-30 transition-[width] duration-200 ease-out ${
        collapsed ? "w-[68px]" : "w-[236px]"
      }`}
    >
      {/* Brand Header (Zero-Pill Brand Zone) */}
      <div className="h-14 flex items-center justify-between px-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80">
        {!collapsed ? (
          <Link
            to={ROUTES.learning.root}
            className="flex items-center min-w-0 cursor-pointer"
            aria-label="Skillora Beranda"
          >
            <SkilloraLogo variant="full" size="sm" />
          </Link>
        ) : (
          <Link
            to={ROUTES.learning.root}
            className="mx-auto cursor-pointer"
            aria-label="Skillora Beranda"
          >
            <SkilloraLogo variant="icon" size="sm" />
          </Link>
        )}

        {!collapsed && (
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label="Ciutkan sidebar"
            title="Ciutkan sidebar"
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer shrink-0"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center pt-2.5">
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label="Lebarkan sidebar"
            title="Lebarkan sidebar"
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Rail */}
      <div className={`flex-1 overflow-y-auto ${collapsed ? "px-2 py-3 space-y-4" : "px-3 py-4 space-y-5"}`}>
        <div>
          {!collapsed && (
            <p className="px-2.5 mb-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              Ruang utama
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
                  className={`flex items-center ${
                    collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-2.5 py-2"
                  } rounded-lg text-[13px] transition-colors whitespace-nowrap ${
                    active
                      ? "bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-950 dark:text-white font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/70 font-medium"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"
                    }`}
                    strokeWidth={active ? 2.1 : 1.75}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          {!collapsed && (
            <p className="px-2.5 mb-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
              Alat &amp; komunitas
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
                  className={`flex items-center ${
                    collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-2.5 py-1.5"
                  } rounded-lg text-[13px] transition-colors whitespace-nowrap ${
                    active
                      ? "bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-950 dark:text-white font-semibold"
                      : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/70 font-medium"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"
                    }`}
                    strokeWidth={active ? 2.1 : 1.75}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {partnerItems.length > 0 && (
          <div>
            {!collapsed && (
              <p className="px-2.5 mb-1.5 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                Portal mitra
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
                    className={`flex items-center ${
                      collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-2.5 py-1.5"
                    } rounded-lg text-[13px] transition-colors whitespace-nowrap ${
                      active
                        ? "bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-950 dark:text-white font-semibold"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/70 font-medium"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500"
                      }`}
                      strokeWidth={active ? 2.1 : 1.75}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Quiet Footer */}
      <div className="p-2.5 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-1">
        <Link
          to={ROUTES.brand}
          title={collapsed ? "Identitas Brand" : undefined}
          className={`flex items-center ${
            collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-1.5"
          } rounded-lg text-xs font-medium transition-colors ${
            isActive(ROUTES.brand)
              ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/70"
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          {!collapsed && <span className="truncate">Identitas Brand</span>}
        </Link>

        <Link
          to={ROUTES.upgrade}
          title={collapsed ? (isSponsorOrPartner ? "Mitra Aktif" : "Program Mitra HRD") : undefined}
          className={`flex items-center ${
            collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-1.5"
          } rounded-lg text-xs font-medium transition-colors ${
            isActive(ROUTES.upgrade)
              ? "bg-zinc-100 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 font-semibold"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/70"
          }`}
        >
          <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          {!collapsed && (
            <span className="truncate">
              {isSponsorOrPartner ? "Mitra & Sponsor" : "Dukung Beasiswa"}
            </span>
          )}
        </Link>

        <div
          className={`flex items-center ${
            collapsed ? "justify-center flex-col gap-2 pt-2" : "justify-between gap-2 px-2 pt-2 mt-1 border-t border-zinc-100 dark:border-zinc-800/80"
          }`}
        >
          <Link
            to={ROUTES.profile.root}
            title={collapsed ? `${profile.name} (${roleText})` : undefined}
            className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5 min-w-0 flex-1"} hover:opacity-85 transition-opacity`}
          >
            <div className="w-7 h-7 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center text-[11px] font-semibold tracking-tight shrink-0">
              {initials}
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
            className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
});

export default Sidebar;
