import React, { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Flame, Gem, Bell, CheckCircle, Award, BookOpen, Briefcase, MessageSquare, ExternalLink, Settings, X, Check, Filter, Sun, Moon, Search, Compass, Target, Sparkles, GraduationCap } from "lucide-react";
import { Profile } from "../types";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SkilloraLogo } from "./SkilloraLogo";
import { ROUTES } from "../routes";
import { Modal } from "./ui/Modal";

interface TopNavbarProps {
  profile: Profile;
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

export const TopNavbar = memo(function TopNavbar({
  profile,
  darkMode,
  setDarkMode,
  showNotifications,
  setShowNotifications,
  showProfileDropdown,
  setShowProfileDropdown,
  notifications,
  handleClearNotifications,
  handleClaimDaily,
  handleBuyFreeze,
  onLogout,
  onOpenMentorChat
}: TopNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Search Palette state
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Notification states & categorization
  const [activeTab, setActiveTab] = useState<string>("semua");
  const [showPreferencesModal, setShowPreferencesModal] = useState<boolean>(false);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);
  
  // Preferences toggles
  const [prefQuiz, setPrefQuiz] = useState<boolean>(true);
  const [prefJobs, setPrefJobs] = useState<boolean>(true);
  const [prefStreak, setPrefStreak] = useState<boolean>(true);

  // Command palette shortcut & Escape close for dropdowns
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal(prev => !prev);
      } else if (e.key === "Escape") {
        if (showNotifications) setShowNotifications(false);
        if (showProfileDropdown) setShowProfileDropdown(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showNotifications, showProfileDropdown, setShowNotifications, setShowProfileDropdown]);

  const isMentorOrAdmin = ["mentor", "admin"].includes(profile?.accountRole || "") || profile?.role?.toLowerCase() === "developer";
  const isRecruiterOrAdmin = ["recruiter", "admin"].includes(profile?.accountRole || "") || profile?.role?.toLowerCase() === "developer";

  // Quick navigation items for search (filtered by user role)
  const quickNavItems = [
    { title: "Dasbor Pembelajaran", category: "Menu", icon: BookOpen, path: ROUTES.learning.root },
    { title: "Katalog Kursus", category: "Kursus", icon: GraduationCap, path: ROUTES.learning.catalog },
    { title: "Asesmen AI Adaptif (CAT)", category: "AI Suite", icon: Target, path: ROUTES.career.adaptive },
    { title: "CV ATS Builder & Audit AI", category: "AI Suite", icon: Briefcase, path: ROUTES.career.cvBuilder },
    { title: "Mock Interview Suara Real-Time", category: "AI Suite", icon: MessageSquare, path: ROUTES.career.voiceInterview },
    { title: "Bursa Kerja & Magang", category: "Karir", icon: Briefcase, path: ROUTES.career.jobs },
    { title: "Sertifikasi & Proyek", category: "Sertifikasi", icon: Award, path: ROUTES.learning.project },
    ...(isMentorOrAdmin ? [{ title: "Portal Mentor & Kelola LMS", category: "Portal Mitra", icon: GraduationCap, path: ROUTES.mentor.root }] : []),
    ...(isRecruiterOrAdmin ? [{ title: "Portal HRD & Rekrutmen", category: "Portal Mitra", icon: Briefcase, path: ROUTES.recruiter.root }] : []),
    { title: "Forum Komunitas & Kolaborasi", category: "Komunitas", icon: MessageSquare, path: ROUTES.community.forum },
    { title: "Upgrade Skillora PRO & Billing", category: "Billing", icon: Sparkles, path: ROUTES.upgrade },
    { title: "Jelajahi Platform", category: "Navigasi", icon: Compass, path: "/jelajahi" },
  ];

  const filteredNavItems = quickNavItems.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Normalize backend notifications ({ id, text, time, type, read }) to display model
  const normalizedBackendNotifs = Array.isArray(notifications)
    ? notifications.map((n: any, idx: number) => {
        const messageText = n.message || n.text || "";
        const category =
          n.category ||
          (n.type === "job"
            ? "Lowongan"
            : n.type === "certification" || n.type === "reward"
              ? "Gamifikasi"
              : "Pembelajaran");
        const title =
          n.title ||
          (category === "Lowongan"
            ? "Pembaruan Karir"
            : category === "Gamifikasi"
              ? "Pencapaian & Hadiah"
              : "Aktivitas Belajar");
        const link =
          n.link ||
          (category === "Lowongan"
            ? ROUTES.career.jobs
            : category === "Gamifikasi"
              ? ROUTES.learning.project
              : undefined);
        return {
          ...n,
          id: n.id || `notif_${idx}`,
          title,
          message: messageText,
          category,
          link,
          timeLabel: n.time || "",
        };
      })
    : [];

  const initialNotifs = normalizedBackendNotifs.length > 0 ? normalizedBackendNotifs : [
    { id: "1", title: "Kuis Baru Tersedia", message: "Kuis React Fundamentals level 2 siap dikerjakan!", type: "info", category: "Pembelajaran", link: ROUTES.learning.root, timeLabel: "Baru saja" },
    { id: "2", title: "Lowongan Cocok dengan Skill", message: "Tokopedia membuka lowongan Junior Frontend Developer.", type: "reward", category: "Lowongan", link: ROUTES.career.jobs, timeLabel: "Hari ini" },
    { id: "3", title: "Streak 5 Hari Dicapai!", message: "Selamat! Anda mendapatkan bonus 50 XP & 10 Gems.", type: "success", category: "Gamifikasi", link: ROUTES.profile.analytics, timeLabel: "Hari ini" }
  ];

  // Deduplicate notifications by message content or id
  const uniqueNotifications = Array.from(
    new Map(initialNotifs.map(item => [item.message || item.title || item.id, item])).values()
  );

  const isRead = (id: string) => readNotifIds.includes(id);

  const toggleMarkRead = (id: string) => {
    if (isRead(id)) {
      setReadNotifIds(prev => prev.filter(i => i !== id));
    } else {
      setReadNotifIds(prev => [...prev, id]);
    }
  };

  const markAllRead = () => {
    setReadNotifIds(uniqueNotifications.map(n => n.id));
  };

  const filteredNotifs = uniqueNotifications.filter(n => {
    if (activeTab === "semua") return true;
    return (n.category || "Pembelajaran").toLowerCase() === activeTab.toLowerCase();
  });

  const unreadNotifsCount = uniqueNotifications.filter(n => !isRead(n.id)).length;

  return (
    <header className="sticky top-0 pt-safe bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/80 z-40 transition-colors duration-300 shadow-[0_1px_12px_rgba(0,0,0,0.02)]">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-[52px] sm:h-[58px]">
          {/* Left Logo & Brand (Mobile Only) */}
          <div className="flex lg:hidden items-center gap-6">
            <Link to="/" className="flex items-center cursor-pointer group">
              <SkilloraLogo variant="full" size="sm" darkMode={darkMode} />
            </Link>
          </div>

          {/* Spacer for desktop */}
          <div className="hidden lg:flex items-center flex-1 max-w-sm mx-4">
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/60 dark:hover:bg-slate-700/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-slate-500 dark:text-slate-400 text-xs font-medium transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                <span>Cari kursus, simulasi, lowongan...</span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Side Controls & Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Search Icon Button */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Pencarian Quick"
            >
              <Search className="w-5 h-5" />
            </button>
            {/* Streak Indicator */}
            <div 
              onClick={() => navigate("/profil")}
              className="flex items-center gap-1.5 sm:gap-2 bg-amber-50/80 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors border border-amber-200/50 dark:border-amber-800/40 text-slate-800 dark:text-slate-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer shrink-0 shadow-sm"
              title="Streak Harian"
            >
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 fill-amber-500" />
              <span>{profile.streak} <span className="hidden xs:inline sm:inline">Hari</span></span>
            </div>

            {/* Gems Indicator */}
            <div 
              onClick={() => navigate("/profil/toko")}
              className="flex items-center gap-1.5 sm:gap-2 bg-emerald-50/80 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-200/50 dark:border-emerald-800/40 text-slate-800 dark:text-slate-200 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer shrink-0 shadow-sm"
              title="Toko Gems"
            >
              <Gem className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 fill-emerald-500" />
              <span>{profile.gems} <span className="hidden xs:inline sm:inline">Gems</span></span>
            </div>

            {/* Owl Mentor AI Button */}
            {onOpenMentorChat && (
              <button
                onClick={onOpenMentorChat}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer active:scale-95 shrink-0"
                title="Tanya AI Mentor"
              >
                <span className="text-sm sm:text-base">🦉</span>
                <span className="hidden sm:inline">AI Mentor</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              aria-label={darkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              title={darkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 transition-all text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-700" />
              )}
            </button>

            {/* Notifications Toggle */}
            <div className="relative">
              <button
                aria-label="Notifications"
                aria-expanded={showNotifications}
                aria-haspopup="true"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileDropdown(false);
                }}
                className={`p-2 rounded-full transition-colors cursor-pointer ${
                  showNotifications ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-emerald-600 text-white text-xs font-bold w-2.5 h-2.5 flex items-center justify-center rounded-full ring-2 ring-white dark:ring-slate-900">
                  </span>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div role="dialog" aria-modal="true" className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-80 sm:w-88 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl z-50 overflow-hidden origin-top-right flex flex-col max-h-[85vh]"
                    >
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between sticky top-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Notifikasi</h3>
                          {unreadNotifsCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 font-bold text-xs">
                              {unreadNotifsCount} Baru
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={markAllRead}
                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            Tandai Dibaca
                          </button>
                          <button
                            onClick={() => setShowPreferencesModal(true)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            title="Preferensi Notifikasi"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Category Tabs */}
                      <div className="flex items-center gap-1 p-2 bg-slate-100/60 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-700 overflow-x-auto hide-scrollbar text-xs font-bold">
                        {["semua", "pembelajaran", "lowongan", "gamifikasi"].map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer whitespace-nowrap ${
                              activeTab === tab
                                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                                : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>

                      {/* List */}
                      <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-700/60">
                        {filteredNotifs.length === 0 ? (
                          <div className="p-8 text-center space-y-1">
                            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Belum Ada Notifikasi</p>
                            <p className="text-xs text-slate-400">Notifikasi kategori ini akan tampil di sini.</p>
                          </div>
                        ) : (
                          filteredNotifs.map((n) => {
                            const readStatus = isRead(n.id);
                            return (
                              <div
                                key={n.id}
                                className={`p-4 transition-colors flex gap-3 relative group ${
                                  readStatus ? "bg-white dark:bg-slate-800 opacity-75" : "bg-emerald-50/30 dark:bg-emerald-950/20"
                                }`}
                              >
                                <div className="mt-0.5 shrink-0">
                                  {n.category === "Lowongan" ? (
                                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                                      <Briefcase className="w-4 h-4" />
                                    </div>
                                  ) : n.category === "Gamifikasi" ? (
                                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                                      <Award className="w-4 h-4" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                                      <BookOpen className="w-4 h-4" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{n.title}</h4>
                                    <button
                                      onClick={() => toggleMarkRead(n.id)}
                                      className="text-xs text-slate-400 hover:text-emerald-600"
                                    >
                                      {readStatus ? "Tandai Belum Dibaca" : "✓ Dibaca"}
                                    </button>
                                  </div>

                                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{n.message}</p>
                                  
                                  {n.link && (
                                    <button
                                      onClick={() => {
                                        toggleMarkRead(n.id);
                                        setShowNotifications(false);
                                        navigate(n.link);
                                      }}
                                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
                                    >
                                      <span>Buka Halaman</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
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

            {/* User Profile Dropdown Toggle */}
            <div className="relative ml-2">
              <button
                aria-label="User profile menu"
                aria-expanded={showProfileDropdown}
                aria-haspopup="true"
                onClick={() => {
                  setShowProfileDropdown(!showProfileDropdown);
                  setShowNotifications(false);
                }}
                className={`flex items-center justify-center rounded-full p-0.5 transition-all border-2 cursor-pointer ${
                  showProfileDropdown ? "border-emerald-500" : "border-transparent hover:border-slate-300"
                }`}
              >
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-base overflow-hidden border border-slate-200">
                  {profile.selectedAvatar || "🦁"}
                </div>
              </button>
              
              <AnimatePresence>
                {showProfileDropdown && (
                  <>
                    <div role="dialog" aria-modal="true" className="fixed inset-0 z-40" onClick={() => setShowProfileDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl z-50 overflow-hidden origin-top-right"
                    >
                      <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center text-base">
                            {profile.selectedAvatar || "🦁"}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{profile.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile.email || "user@skillora.id"}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-2 border-b border-slate-100 dark:border-slate-700">
                        <div className="grid grid-cols-2 gap-2 p-1">
                          <div className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <span className="text-xs text-slate-400 uppercase font-bold">Level</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{profile.level || 1}</span>
                          </div>
                          <div className="flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            <span className="text-xs text-slate-400 uppercase font-bold">XP</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{profile.xp || 1250}</span>
                          </div>
                          <div className="flex flex-col items-center p-2 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/40 dark:border-amber-800/30">
                            <span className="text-xs text-amber-600 dark:text-amber-400 uppercase font-bold flex items-center gap-1">
                              <Flame className="w-3 h-3 fill-amber-500" /> Streak
                            </span>
                            <span className="text-sm font-bold text-amber-900 dark:text-amber-200">{profile.streak || 0} Hari</span>
                          </div>
                          <div className="flex flex-col items-center p-2 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/40 dark:border-emerald-800/30">
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold flex items-center gap-1">
                              <Gem className="w-3 h-3 fill-emerald-600" /> Gems
                            </span>
                            <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200">{profile.gems || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 space-y-1 text-xs font-bold">
                        <button
                          onClick={() => {
                            navigate("/profil");
                            setShowProfileDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-slate-700 dark:text-slate-200 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4 text-emerald-500" />
                          <span>Profil & Pengaturan</span>
                        </button>
                        <button
                          onClick={() => {
                            onLogout();
                            setShowProfileDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Keluar</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* NOTIFICATION PREFERENCES MODAL */}
      <Modal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        title={
          <span className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-600" />
            <span>Preferensi Notifikasi</span>
          </span>
        }
        size="sm"
        footer={
          <button onClick={() => setShowPreferencesModal(false)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 transition-colors text-white font-bold text-xs rounded-xl cursor-pointer">
            Simpan Preferensi
          </button>
        }
      >
        <div className="space-y-3">
          <label className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl cursor-pointer">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Pengingat Kuis & Modul</span>
            <input type="checkbox" checked={prefQuiz} onChange={e => setPrefQuiz(e.target.checked)} className="w-4 h-4 accent-emerald-600" aria-label="Pengingat Kuis dan Modul" />
          </label>

          <label className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl cursor-pointer">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Rekomendasi Lowongan Baru</span>
            <input type="checkbox" checked={prefJobs} onChange={e => setPrefJobs(e.target.checked)} className="w-4 h-4 accent-emerald-600" aria-label="Rekomendasi Lowongan Baru" />
          </label>

          <label className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl cursor-pointer">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Peringatan Streak Harian</span>
            <input type="checkbox" checked={prefStreak} onChange={e => setPrefStreak(e.target.checked)} className="w-4 h-4 accent-emerald-600" aria-label="Peringatan Streak Harian" />
          </label>
        </div>
      </Modal>
      {/* Command Palette Search Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearchModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Pencarian Pintar"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative z-10"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <input aria-label="Ketik navigasi, modul, atau halaman..."
                  type="text"
                  autoFocus
                  placeholder="Ketik navigasi, modul, atau halaman..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                {filteredNavItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Tidak ada hasil untuk &quot;{searchQuery}&quot;
                  </div>
                ) : (
                  filteredNavItems.map((item, idx) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setShowSearchModal(false);
                          setSearchQuery("");
                          navigate(item.path);
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {item.title}
                            </div>
                            <div className="text-xs text-slate-400">
                              {item.category}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 font-medium group-hover:translate-x-0.5 transition-transform">
                          Buka →
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Navigasi Pintar Skillora</span>
                <span>Tekan <kbd className="font-mono bg-white dark:bg-slate-800 px-1 rounded border border-slate-200 dark:border-slate-700">ESC</kbd> untuk tutup</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
});

export default TopNavbar;




