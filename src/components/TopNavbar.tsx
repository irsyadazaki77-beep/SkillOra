import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Flame,
  Gem,
  Bell,
  Award,
  BookOpen,
  Briefcase,
  ExternalLink,
  Sun,
  Moon,
  Search,
  Sparkles,
  Bot,
  Globe,
  BarChart2,
  UserCircle,
  LogOut,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import { Course, JobVacancy, Profile } from "../types";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SkilloraLogo } from "./SkilloraLogo";
import { ROUTES } from "../routes";
import { CommandPalette } from "./CommandPalette";

interface TopNavbarProps {
  profile: Profile;
  courses?: Course[];
  jobs?: JobVacancy[];
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  showNotifications: boolean;
  setShowNotifications: (v: boolean) => void;
  showProfileDropdown: boolean;
  setShowProfileDropdown: (v: boolean) => void;
  notifications: any[];
  handleClearNotifications: () => void;
  handleClaimDaily: () => void;
  handleBuyFreeze?: () => void;
  onLogout: () => void;
  onOpenMentorChat?: () => void;
}

function getBreadcrumb(pathname: string): { section: string; page: string } {
  if (pathname === "/" || pathname === "/belajar") {
    return { section: "Ruang Belajar", page: "Beranda & Roadmap" };
  }
  if (pathname.startsWith("/lab")) {
    return { section: "Lab Interaktif AI", page: pathname === "/lab" ? "Katalog Tantangan" : "Workspace Lab" };
  }
  if (pathname.startsWith("/arena")) {
    return { section: "Arena Kompetitif", page: "Battle Quiz, Tryout & Liga" };
  }
  if (pathname.startsWith("/belajar/lms")) {
    return { section: "Belajar", page: "Ruang LMS Terfokus" };
  }
  if (pathname.startsWith("/belajar/katalog")) {
    return { section: "Belajar", page: "Katalog Kursus" };
  }
  if (pathname.startsWith("/belajar/kursus")) {
    return { section: "Belajar", page: pathname.includes("/materi/") ? "Course Player" : "Detail Kursus" };
  }
  if (pathname.startsWith("/belajar/latihan")) {
    return { section: "Belajar", page: "Latihan & Bank Soal" };
  }
  if (pathname.startsWith("/belajar/proyek")) {
    return { section: "Belajar", page: "Proyek & Sertifikat" };
  }
  if (pathname === "/karier/cv-ats") {
    return { section: "Karier", page: "CV ATS Builder" };
  }
  if (pathname === "/karier/asesmen-adaptif") {
    return { section: "Karier", page: "Asesmen AI Adaptif" };
  }
  if (pathname === "/karier/mock-interview") {
    return { section: "Karier", page: "Mock Interview Suara" };
  }
  if (pathname === "/karier/simulasi") {
    return { section: "Karier", page: "Simulasi BUMN & STAR" };
  }
  if (pathname === "/karier/beasiswa") {
    return { section: "Karier", page: "Pusat Beasiswa" };
  }
  if (pathname === "/karier/mentoring") {
    return { section: "Karier", page: "Mentoring 1-on-1" };
  }
  if (pathname.startsWith("/karier")) {
    return { section: "Karier", page: "Talent Match, Portofolio & Kampus" };
  }
  if (pathname.startsWith("/komunitas/kolaborasi")) {
    return { section: "Komunitas", page: "Ruang Kolaborasi" };
  }
  if (pathname.startsWith("/komunitas/event")) {
    return { section: "Komunitas", page: "Event & Webinar" };
  }
  if (pathname.startsWith("/komunitas")) {
    return { section: "Komunitas", page: "Forum Diskusi" };
  }
  if (pathname === "/profil/analitik") {
    return { section: "Akun", page: "Analitik & Statistik" };
  }
  if (pathname === "/profil/toko") {
    return { section: "Akun", page: "Toko Gems" };
  }
  if (pathname.startsWith("/profil")) {
    return { section: "Akun", page: "Profil & Pengaturan" };
  }
  if (pathname === "/pusat-upgrade") {
    return { section: "Dampak Sosial", page: "Mitra HRD & Beasiswa" };
  }
  if (pathname === "/portal-mentor") {
    return { section: "Portal Mitra", page: "Mentor & Review" };
  }
  if (pathname === "/portal-hrd") {
    return { section: "Portal Mitra", page: "HRD & Rekrutmen" };
  }
  if (pathname === "/kelola-lms") {
    return { section: "Portal Mitra", page: "Kelola Kurikulum LMS" };
  }
  return { section: "Skillora", page: "Workspace" };
}

export const TopNavbar = memo(function TopNavbar({
  profile,
  courses = [],
  jobs = [],
  darkMode,
  setDarkMode,
  showNotifications,
  setShowNotifications,
  showProfileDropdown,
  setShowProfileDropdown,
  notifications,
  onLogout,
  onOpenMentorChat,
}: TopNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        if (showNotifications) setShowNotifications(false);
        if (showProfileDropdown) setShowProfileDropdown(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showNotifications, showProfileDropdown, setShowNotifications, setShowProfileDropdown]);

  const normalizedNotifs = (Array.isArray(notifications) ? notifications : []).map((n: any, idx: number) => ({
    id: String(n.id || `notif_${idx}`),
    title: n.title || (n.type === "job" ? "Pembaruan Karier" : n.type === "reward" ? "Pencapaian" : "Aktivitas Belajar"),
    message: n.message || n.text || "",
    category: n.type === "job" ? "Lowongan" : n.type === "reward" ? "Pencapaian" : "Belajar",
    link: n.link || (n.type === "job" ? ROUTES.career.jobs : undefined),
    timeLabel: n.time || "",
  }));

  const uniqueNotifications = Array.from(
    new Map(normalizedNotifs.map((item) => [item.message || item.id, item])).values()
  );
  const unreadCount = uniqueNotifications.filter((n) => !readNotifIds.includes(n.id)).length;
  const breadcrumb = getBreadcrumb(location.pathname);

  return (
    <>
      <header className="sticky top-0 pt-safe bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 z-40">
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* ZONE 1: Mobile Brand OR Desktop Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex lg:hidden items-center">
              <Link to={ROUTES.learning.root} aria-label="Skillora Beranda">
                <SkilloraLogo variant="full" size="sm" darkMode={darkMode} />
              </Link>
            </div>

            <nav aria-label="Breadcrumb" className="hidden lg:flex items-center gap-1.5 text-xs min-w-0">
              <span className="text-zinc-400 dark:text-zinc-500 font-medium truncate">{breadcrumb.section}</span>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 shrink-0" />
              <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate">{breadcrumb.page}</span>
            </nav>
          </div>

          {/* ZONE 2: Command Palette Trigger */}
          <div className="flex-1 max-w-md hidden sm:flex justify-center">
            <button
              onClick={() => setPaletteOpen(true)}
              className="w-full max-w-xs flex items-center justify-between px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 hover:border-zinc-300 dark:hover:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="truncate">Cari halaman, kursus, atau lab...</span>
              </span>
              <kbd className="ml-2 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* ZONE 3: Quiet Utilities (Mobile Search + Copilot + Notification Bell + Unified Profile Menu) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setPaletteOpen(true)}
              aria-label="Buka pencarian cepat"
              className="sm:hidden p-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            {onOpenMentorChat && (
              <button
                onClick={onOpenMentorChat}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-emerald-500/60 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                title="Buka Study Copilot AI"
              >
                <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden md:inline">Copilot</span>
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                aria-label="Notifikasi"
                aria-expanded={showNotifications}
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileDropdown(false);
                }}
                className="relative p-2 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400 ring-2 ring-white dark:ring-zinc-950" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          Notifikasi{unreadCount > 0 ? ` (${unreadCount})` : ""}
                        </span>
                        {uniqueNotifications.length > 0 && (
                          <button
                            onClick={() => setReadNotifIds(uniqueNotifications.map((n) => n.id))}
                            className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            Tandai dibaca
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                        {uniqueNotifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                            Belum ada notifikasi baru.
                          </div>
                        ) : (
                          uniqueNotifications.slice(0, 12).map((n) => {
                            const isRead = readNotifIds.includes(n.id);
                            return (
                              <div
                                key={n.id}
                                className={`p-3.5 text-xs space-y-1 ${
                                  isRead ? "opacity-65" : "bg-zinc-50/70 dark:bg-zinc-800/30"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                    {n.category === "Lowongan" ? (
                                      <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                                    ) : n.category === "Pencapaian" ? (
                                      <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                      <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                                    )}
                                    {n.title}
                                  </span>
                                  {n.timeLabel && <span className="text-[11px] text-zinc-400">{n.timeLabel}</span>}
                                </div>
                                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">{n.message}</p>
                                {n.link && (
                                  <button
                                    onClick={() => {
                                      setReadNotifIds((prev) => [...prev, n.id]);
                                      setShowNotifications(false);
                                      navigate(n.link!);
                                    }}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline pt-0.5 cursor-pointer"
                                  >
                                    Buka <ExternalLink className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Unified Profile Menu */}
            <div className="relative">
              <button
                aria-label="Menu profil"
                aria-expanded={showProfileDropdown}
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-sm">
                  {profile.selectedAvatar || profile.avatar || "🦁"}
                </div>
                <span className="hidden md:inline text-xs font-semibold text-zinc-800 dark:text-zinc-200 max-w-[110px] truncate">
                  {profile.name}
                </span>
              </button>

              <AnimatePresence>
                {showProfileDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      {/* Identity Summary */}
                      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {profile.name}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {profile.email || "pelajar@skillora.id"}
                        </p>
                        <div className="mt-2.5 flex items-center gap-3 text-[11px] font-mono tabular-nums text-zinc-600 dark:text-zinc-300">
                          <span className="inline-flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-amber-500" />
                            {profile.streak || 0}h
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Gem className="w-3.5 h-3.5 text-emerald-500" />
                            {profile.gems || 0}
                          </span>
                          <span>·</span>
                          <span>Lv.{profile.level || 1}</span>
                        </div>
                      </div>

                      {/* Unified Menu Items */}
                      <div className="p-1.5 space-y-0.5 text-xs">
                        <button
                          onClick={() => {
                            setDarkMode(!darkMode);
                          }}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                        >
                          <span className="flex items-center gap-2 font-medium">
                            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-500" />}
                            {darkMode ? "Mode Terang" : "Mode Gelap"}
                          </span>
                          <span className="text-[11px] text-zinc-400">{darkMode ? "Aktif" : "Mati"}</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate(`${ROUTES.career.jobs}?tab=portofolio`);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium cursor-pointer"
                        >
                          <Globe className="w-3.5 h-3.5 text-zinc-400" />
                          Portofolio Publik
                        </button>

                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate(ROUTES.profile.analytics);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium cursor-pointer"
                        >
                          <BarChart2 className="w-3.5 h-3.5 text-zinc-400" />
                          Analitik Belajar
                        </button>

                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate(ROUTES.profile.shop);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-zinc-400" />
                          Toko Gems
                        </button>

                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate(ROUTES.profile.root);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium cursor-pointer"
                        >
                          <UserCircle className="w-3.5 h-3.5 text-zinc-400" />
                          Profil & Pengaturan
                        </button>

                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            navigate(ROUTES.upgrade);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {profile.subscriptionTier === "pro" ? "Mitra & Sponsor Aktif" : "Dukung Beasiswa & Mitra HRD"}
                        </button>
                      </div>

                      <div className="p-1.5 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                          onClick={() => {
                            setShowProfileDropdown(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Keluar Aplikasi
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        profile={profile}
        courses={courses}
        jobs={jobs}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenCopilot={onOpenMentorChat}
      />
    </>
  );
});

export default TopNavbar;
