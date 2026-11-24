import React, { memo } from "react";
import {
  BookOpen,
  Briefcase,
  Users,
  LogOut,
  Building2,
  Compass,
  Award,
  ShoppingBag,
  MessageSquare,
  Zap,
  Sparkles,
  UserCircle,
  BarChart2,
  Bookmark,
  BrainCircuit,
  FileText,
  Mic,
  GraduationCap,
  Calendar,
  Layers,
  ShieldCheck,
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
    const params = new URLSearchParams(location.search);

    if (path === ROUTES.learning.root) {
      return location.pathname === ROUTES.learning.root || location.pathname === "/";
    }
    if (path === ROUTES.career.jobs) {
      if (params.get("tab") === "lamaran") return false;
      return location.pathname === ROUTES.career.jobs;
    }
    if (path === `${ROUTES.career.jobs}?tab=lamaran`) {
      return location.pathname === ROUTES.career.jobs && params.get("tab") === "lamaran";
    }
    if (path === ROUTES.profile.root) {
      return location.pathname === ROUTES.profile.root;
    }
    return location.pathname.startsWith(path);
  };

  const navGroups: Array<{
    title: string;
    items: Array<{ id: string; label: string; icon: any }>;
  }> = [
    {
      title: "PEMBELAJARAN",
      items: [
        { id: ROUTES.learning.root, label: "Beranda Belajar", icon: BookOpen },
        { id: ROUTES.learning.catalog, label: "Katalog Kursus", icon: Compass },
        { id: ROUTES.learning.practice, label: "Latihan & Kuis", icon: Zap },
        { id: ROUTES.learning.project, label: "Proyek & Sertifikat", icon: Award },
      ],
    },
    {
      title: "KARIER & AI SUITE",
      items: [
        { id: ROUTES.career.jobs, label: "Bursa Kerja", icon: Briefcase },
        { id: `${ROUTES.career.jobs}?tab=lamaran`, label: "Lamaran Saya", icon: Bookmark },
        { id: ROUTES.career.adaptive, label: "Asesmen AI Adaptif", icon: BrainCircuit },
        { id: ROUTES.career.cvBuilder, label: "CV ATS Builder", icon: FileText },
        { id: ROUTES.career.voiceInterview, label: "Mock Interview Suara", icon: Mic },
        { id: ROUTES.career.simulation, label: "Simulasi BUMN & STAR", icon: Building2 },
        { id: ROUTES.career.scholarship, label: "Pusat Beasiswa", icon: GraduationCap },
      ],
    },
    {
      title: "KOMUNITAS & MENTOR",
      items: [
        { id: ROUTES.community.forum, label: "Forum Diskusi", icon: Users },
        { id: ROUTES.community.collaboration, label: "Ruang Kolaborasi", icon: MessageSquare },
        { id: ROUTES.community.event, label: "Event & Webinar", icon: Calendar },
        { id: ROUTES.career.mentoring, label: "Mentoring 1-on-1", icon: UserCircle },
      ],
    },
  ];

  const partnerItems: Array<{ id: string; label: string; icon: any }> = [];
  if (accountRole === "mentor" || accountRole === "admin") {
    partnerItems.push({ id: ROUTES.mentor.root, label: "Portal Mentor & Review", icon: ShieldCheck });
    partnerItems.push({ id: ROUTES.lms, label: "Kelola Kurikulum LMS", icon: Layers });
  }
  if (accountRole === "recruiter" || accountRole === "admin") {
    partnerItems.push({ id: ROUTES.recruiter.root, label: "Portal HRD & Rekrutmen", icon: Building2 });
  }
  if (partnerItems.length > 0) {
    navGroups.push({
      title: "PORTAL MITRA",
      items: partnerItems,
    });
  }

  navGroups.push({
    title: "AKUN & BILLING",
    items: [
      { id: ROUTES.profile.root, label: "Profil & Peran", icon: UserCircle },
      { id: ROUTES.profile.analytics, label: "Analitik & Leaderboard", icon: BarChart2 },
      { id: ROUTES.profile.shop, label: "Toko Gems", icon: ShoppingBag },
      { id: ROUTES.upgrade, label: isPro ? "Skillora PRO Aktif" : "Upgrade Pro & Billing", icon: Sparkles },
    ],
  });

  const roleText =
    accountRole === "recruiter"
      ? "Recruiter HRD"
      : accountRole === "mentor"
      ? "Mentor / Dosen"
      : accountRole === "admin"
      ? "Admin LMS"
      : "Mahasiswa";

  return (
    <div className="hidden lg:flex w-[256px] flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/95 z-40 h-full relative">
      {/* Brand */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800">
        <Link to={ROUTES.learning.root} className="flex items-center cursor-pointer group" aria-label="Skillora Dashboard">
          <SkilloraLogo variant="full" size="md" />
        </Link>
        {isPro && (
          <span className="text-[11px] font-bold tracking-wide text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md">
            PRO
          </span>
        )}
      </div>

      {/* User Mini Profile */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        <Link
          to={ROUTES.profile.root}
          className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg overflow-hidden shrink-0 border border-white dark:border-slate-600">
            {profile.selectedAvatar || profile.avatar || "🦁"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900 dark:text-white truncate text-xs font-display">{profile.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium tabular-nums">
              {roleText} • Lv. {profile.level || 1}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <div className="px-3 mb-1.5 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {group.title}
            </div>
            {group.items.map((item) => {
              const active = isActive(item.id);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.id}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors group ${
                    active
                      ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      active
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                    }`}
                    strokeWidth={active ? 2.4 : 1.9}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
        <button
          onClick={onLogout}
          aria-label="Keluar dari Akun"
          className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors font-semibold text-xs cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Aplikasi</span>
        </button>
      </div>
    </div>
  );
});

export default Sidebar;


