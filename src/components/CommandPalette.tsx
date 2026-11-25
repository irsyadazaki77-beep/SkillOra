import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Search,
  X,
  ArrowRight,
  Terminal,
  Trophy,
  BookOpen,
  Briefcase,
  Compass,
  Users,
  Sparkles,
  Moon,
  Sun,
  Bot,
  Globe,
  FileText,
  BrainCircuit,
  Mic,
  Award,
  GraduationCap,
  ShieldCheck,
  Building2,
  Layers,
  CornerDownLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Course, JobVacancy, Profile } from "../types";
import { ROUTES } from "../routes";

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  group: "Navigasi Utama" | "Aksi Cepat" | "Kursus" | "Lowongan Kerja";
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string;
  action: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  profile: Profile;
  courses?: Course[];
  jobs?: JobVacancy[];
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  onOpenCopilot?: () => void;
}

export function CommandPalette({
  open,
  onClose,
  profile,
  courses = [],
  jobs = [],
  darkMode,
  setDarkMode,
  onOpenCopilot,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isMentorOrAdmin =
    ["mentor", "admin"].includes(profile?.accountRole || "") ||
    profile?.role?.toLowerCase() === "developer";
  const isRecruiterOrAdmin =
    ["recruiter", "admin"].includes(profile?.accountRole || "") ||
    profile?.role?.toLowerCase() === "developer";

  const portfolioSlug =
    profile.portfolioSlug ||
    `${(profile.name || "pelajar")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`;

  const allItems = useMemo<CommandItem[]>(() => {
    const go = (path: string) => () => {
      onClose();
      setQuery("");
      navigate(path);
    };

    const navItems: CommandItem[] = [
      {
        id: "nav-home",
        title: "Beranda & Smart Roadmap",
        subtitle: "Ringkasan belajar, target harian, dan rencana 4 minggu AI",
        group: "Navigasi Utama",
        icon: BookOpen,
        keywords: "dashboard home beranda roadmap",
        action: go(ROUTES.learning.root),
      },
      {
        id: "nav-lab",
        title: "Interactive Coding & Case Lab",
        subtitle: "Sandbox kode, SQL, dan studi kasus industri dengan rubrik AI",
        group: "Navigasi Utama",
        icon: Terminal,
        keywords: "coding sandbox lab sql react case ai",
        action: go(ROUTES.lab.root),
      },
      {
        id: "nav-arena",
        title: "Arena Battle Quiz, Tryout & Liga",
        subtitle: "Duel realtime WebSocket, Tryout Akbar, dan klasemen mingguan",
        group: "Navigasi Utama",
        icon: Trophy,
        keywords: "arena battle quiz tryout liga leaderboard kompetitif",
        action: go(ROUTES.arena.root),
      },
      {
        id: "nav-lms",
        title: "Ruang LMS (Fokus Belajar)",
        subtitle: "Pemutar modul Markdown, video, Q&A kursus, dan catatan cloud",
        group: "Navigasi Utama",
        icon: Layers,
        keywords: "lms fokus belajar kelas modul video",
        action: go(ROUTES.learning.lmsWorkspace),
      },
      {
        id: "nav-catalog",
        title: "Katalog Kursus & Jalur Karier Gratis",
        subtitle: "Jelajahi modul React, Backend, Data, dan BUMN 100% gratis",
        group: "Navigasi Utama",
        icon: Compass,
        keywords: "kursus katalog materi belajar jalur karier gratis",
        action: go(ROUTES.learning.catalog),
      },
      {
        id: "nav-project",
        title: "Proyek & Sertifikat Terverifikasi",
        subtitle: "Kumpulkan capstone proyek dan kelola sertifikat QR",
        group: "Navigasi Utama",
        icon: Award,
        keywords: "proyek sertifikat capstone",
        action: go(ROUTES.learning.project),
      },
      {
        id: "nav-career",
        title: "Karier, Talent Match & Bursa Kerja",
        subtitle: "Skor kecocokan lowongan berbasis lab, sertifikat, dan skill",
        group: "Navigasi Utama",
        icon: Briefcase,
        keywords: "karier bursa kerja lowongan talent match",
        action: go(ROUTES.career.jobs),
      },
      {
        id: "nav-cv",
        title: "CV ATS Builder & Audit AI",
        subtitle: "Susun CV standar ATS dan cek kecocokan kata kunci HRD",
        group: "Navigasi Utama",
        icon: FileText,
        keywords: "cv ats resume builder",
        action: go(ROUTES.career.cvBuilder),
      },
      {
        id: "nav-adaptive",
        title: "Asesmen AI Adaptif (CAT)",
        subtitle: "Pengujian tingkat kesulitan dinamis berbasis kompetensi",
        group: "Navigasi Utama",
        icon: BrainCircuit,
        keywords: "asesmen cat adaptif tes",
        action: go(ROUTES.career.adaptive),
      },
      {
        id: "nav-voice",
        title: "Mock Interview Suara AI",
        subtitle: "Latihan wawancara langsung berbasis suara real-time",
        group: "Navigasi Utama",
        icon: Mic,
        keywords: "interview wawancara suara voice",
        action: go(ROUTES.career.voiceInterview),
      },
      {
        id: "nav-community",
        title: "Forum & Ruang Kolaborasi",
        subtitle: "Diskusi teknis, proyek tim, event, dan mentoring 1-on-1",
        group: "Navigasi Utama",
        icon: Users,
        keywords: "forum komunitas kolaborasi event webinar",
        action: go(ROUTES.community.forum),
      },
      {
        id: "nav-campus",
        title: "Campus & Cohort Hub",
        subtitle: "Gabung program kesiapan karier kampus Anda",
        group: "Navigasi Utama",
        icon: GraduationCap,
        keywords: "kampus campus cohort universitas",
        action: go(`${ROUTES.career.jobs}?tab=kampus`),
      },
      {
        id: "nav-upgrade",
        title: "Beasiswa & Sponsor Mitra HRD",
        subtitle: "Program sponsor beasiswa terbuka dan rekrutmen B2B",
        group: "Navigasi Utama",
        icon: Sparkles,
        keywords: "beasiswa sponsor mitra hrd b2b gratis",
        action: go(ROUTES.upgrade),
      },
    ];

    if (isMentorOrAdmin) {
      navItems.push(
        {
          id: "nav-mentor",
          title: "Portal Mentor & Review",
          subtitle: "Nilai pengajuan proyek mahasiswa dan kelola jadwal",
          group: "Navigasi Utama",
          icon: ShieldCheck,
          action: go(ROUTES.mentor.root),
        },
        {
          id: "nav-lms",
          title: "Kelola Kurikulum LMS",
          subtitle: "Buat dan perbarui modul kursus",
          group: "Navigasi Utama",
          icon: Layers,
          action: go(ROUTES.lms),
        }
      );
    }

    if (isRecruiterOrAdmin) {
      navItems.push({
        id: "nav-hrd",
        title: "Portal HRD & Rekrutmen",
        subtitle: "Kelola lowongan perusahaan dan pelamar terverifikasi",
        group: "Navigasi Utama",
        icon: Building2,
        action: go(ROUTES.recruiter.root),
      });
    }

    const quickActions: CommandItem[] = [
      ...(onOpenCopilot
        ? [
            {
              id: "act-copilot",
              title: "Buka Study Copilot AI",
              subtitle: "Tanyakan konsep, debugging kode, atau strategi karier",
              group: "Aksi Cepat" as const,
              icon: Bot,
              keywords: "ai copilot mentor chat tanya",
              action: () => {
                onClose();
                setQuery("");
                onOpenCopilot();
              },
            },
          ]
        : []),
      {
        id: "act-theme",
        title: darkMode ? "Ubah ke Mode Terang" : "Ubah ke Mode Gelap",
        subtitle: "Sesuaikan kontras tampilan ruang kerja",
        group: "Aksi Cepat",
        icon: darkMode ? Sun : Moon,
        keywords: "tema dark light gelap terang",
        action: () => {
          setDarkMode(!darkMode);
          onClose();
        },
      },
      {
        id: "act-portfolio",
        title: "Buka Portofolio Publik Saya",
        subtitle: `/portfolio/${portfolioSlug}`,
        group: "Aksi Cepat",
        icon: Globe,
        keywords: "portofolio publik share link cv",
        action: go(`${ROUTES.career.jobs}?tab=portofolio`),
      },
    ];

    const courseItems: CommandItem[] = courses.slice(0, 12).map((c) => ({
      id: `course-${c.id}`,
      title: c.title,
      subtitle: `${c.category || "Kursus"} · ${c.difficulty || "Menengah"} · ${c.partner || "Skillora"}`,
      group: "Kursus",
      icon: BookOpen,
      keywords: `${c.category || ""} ${c.partner || ""}`,
      action: go(ROUTES.learning.courseDetail(c.id)),
    }));

    const jobItems: CommandItem[] = jobs.slice(0, 8).map((j) => ({
      id: `job-${j.id}`,
      title: j.title,
      subtitle: `${j.company} · ${j.location} · ${j.salary}`,
      group: "Lowongan Kerja",
      icon: Briefcase,
      keywords: `${j.company} ${j.location} ${(j.requiredSkills || []).join(" ")}`,
      action: go(ROUTES.career.jobs),
    }));

    return [...navItems, ...quickActions, ...courseItems, ...jobItems];
  }, [
    courses,
    jobs,
    darkMode,
    setDarkMode,
    onOpenCopilot,
    onClose,
    navigate,
    isMentorOrAdmin,
    isRecruiterOrAdmin,
    portfolioSlug,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return allItems.filter((item) => item.group === "Navigasi Utama" || item.group === "Aksi Cepat").slice(0, 14);
    }
    return allItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          (item.keywords && item.keywords.toLowerCase().includes(q)) ||
          item.group.toLowerCase().includes(q)
      )
      .slice(0, 16);
  }, [allItems, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 20);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (filtered.length > 0 ? (prev + 1) % filtered.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (filtered.length > 0 ? (prev - 1 + filtered.length) % filtered.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = filtered[activeIndex];
        if (selected) selected.action();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, filtered, activeIndex, onClose]);

  const grouped = useMemo(() => {
    const map = new Map<string, Array<CommandItem & { flatIndex: number }>>();
    filtered.forEach((item, idx) => {
      const list = map.get(item.group) || [];
      list.push({ ...item, flatIndex: idx });
      map.set(item.group, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <AnimatePresence>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Command Palette Skillora"
          className="fixed inset-0 z-70 flex items-start justify-center pt-16 sm:pt-24 px-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/50 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.14 }}
            className="relative z-10 w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
              <Search className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari halaman, kursus, lab interaktif, lowongan, atau aksi..."
                className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                aria-label="Cari di Command Palette"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Bersihkan
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Tutup pencarian"
                className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[380px] overflow-y-auto p-2 space-y-3">
              {grouped.length === 0 ? (
                <div className="py-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  Tidak ada hasil untuk &ldquo;{query}&rdquo;. Coba kata kunci seperti Lab, Arena, React, atau CV.
                </div>
              ) : (
                grouped.map(([groupName, items]) => (
                  <div key={groupName}>
                    <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      {groupName}
                    </div>
                    <div className="space-y-0.5">
                      {items.map((item) => {
                        const Icon = item.icon;
                        const isSelected = item.flatIndex === activeIndex;
                        return (
                          <button
                            key={item.id}
                            onMouseEnter={() => setActiveIndex(item.flatIndex)}
                            onClick={item.action}
                            className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white"
                                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Icon
                                className={`w-4 h-4 shrink-0 ${
                                  isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                                }`}
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold truncate">{item.title}</p>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>
                            <ArrowRight
                              className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                                isSelected ? "opacity-100 text-emerald-600 dark:text-emerald-400" : "opacity-0"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Keyboard Hint Footer */}
            <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="font-mono px-1 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px]">
                    ↑↓
                  </kbd>
                  navigasi
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="font-mono px-1 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px]">
                    <CornerDownLeft className="w-2.5 h-2.5 inline" />
                  </kbd>
                  buka
                </span>
              </div>
              <span>
                <kbd className="font-mono px-1 py-0.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-[10px]">
                  ESC
                </kbd>{" "}
                tutup
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default CommandPalette;
