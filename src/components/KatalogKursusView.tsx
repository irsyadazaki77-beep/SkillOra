import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Heart,
  Grid,
  List,
  RefreshCw,
  X,
  CheckCircle2,
  Compass,
  ArrowRight,
  Award,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Course, LearningPathRecord, Profile } from "../types";
import { courseApi } from "../api/apiClient";
import { queryKeys } from "../lib/queryKeys";
import { CourseCard } from "./CourseCard";
import { useDebounce } from "../hooks/useDebounce";
import { getCourseProgress } from "../utils/courseUtils";
import { Button } from "./ui/Button";

interface KatalogKursusViewProps {
  courses: Course[];
  profile: Profile;
  onBookmarkToggle: (courseId: string) => void;
}

export function KatalogKursusView({ courses, profile, onBookmarkToggle }: KatalogKursusViewProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState<
    "Semua" | "Terdaftar" | "Belum Dimulai" | "Sedang Dipelajari" | "Selesai"
  >("Semua");
  const [selectedSort, setSelectedSort] = useState<"Populer" | "Terbaru" | "Durasi">("Populer");
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [showOnlyEnrolled, setShowOnlyEnrolled] = useState(false);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [dbPaths, setDbPaths] = useState<LearningPathRecord[]>([]);
  const [enrollingPathSlug, setEnrollingPathSlug] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<LearningPathRecord | null>(null);
  const [claimingSpecSlug, setClaimingSpecSlug] = useState<string | null>(null);
  const [pathNotice, setPathNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    courseApi
      .getLearningPaths()
      .then((paths) => {
        if (active && Array.isArray(paths)) setDbPaths(paths);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [courses.length]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: courses.length };
    courses.forEach((c) => {
      if (c.category) {
        counts[c.category] = (counts[c.category] || 0) + 1;
      }
    });
    return counts;
  }, [courses]);

  const categories = useMemo(() => Object.keys(categoryCounts), [categoryCounts]);

  const difficulties = ["Semua", "Pemula", "Menengah", "Lanjutan"];
  const bookmarkedCourses = profile.bookmarkedCourses || [];
  const enrolledCoursesCount = useMemo(
    () => courses.filter((c) => c.isEnrolled).length,
    [courses]
  );

  // Curated free learning paths backed by PostgreSQL (with offline fallback)
  const careerPaths: LearningPathRecord[] = useMemo(() => {
    if (dbPaths.length > 0) return dbPaths;
    const groups = [
      {
        slug: "path-software-cloud",
        title: "Jalur Software & Cloud Engineer",
        description: "Dari fondasi pemrograman, database, hingga cloud & DevOps siap kerja.",
        targetRole: "Full-Stack / Cloud Engineer",
        level: "Pemula hingga Mahir",
        match: (c: Course) =>
          /tekno|cloud|devops|back|web|software|react|api/i.test(`${c.category || ""} ${c.title}`),
      },
      {
        slug: "path-ai-data-product",
        title: "Jalur AI, Data & Product Specialist",
        description: "Analisis data, otomatisasi AI, dan riset produk digital bersertifikat.",
        targetRole: "AI & Data Analyst / Product",
        level: "Menengah hingga Mahir",
        match: (c: Course) =>
          /ai|data|produk|ux|otomasi|analit/i.test(`${c.category || ""} ${c.title}`),
      },
      {
        slug: "path-bumn-cpns",
        title: "Jalur Persiapan BUMN, CPNS & Karier",
        description: "Latihan TKD, studi kasus industri, dan kesiapan wawancara tanpa biaya.",
        targetRole: "Officer / Management Trainee",
        level: "Terbuka Semua Latar Belakang",
        match: (c: Course) =>
          /bumn|cpns|finan|bisnis|karier/i.test(`${c.category || ""} ${c.title}`),
      },
    ];

    return groups
      .map((g) => {
        const items = courses.filter(g.match);
        const totalModules = items.reduce((sum, c) => sum + (c.lessons?.length || 0), 0);
        const progressPercent =
          items.length > 0
            ? Math.round(
                items.reduce((sum, c) => sum + getCourseProgress(c).percentage, 0) / items.length
              )
            : 0;
        return {
          slug: g.slug,
          title: g.title,
          description: g.description,
          targetRole: g.targetRole,
          level: g.level,
          courses: items.map((c, idx) => ({
            id: c.id,
            title: c.title,
            difficulty: c.difficulty,
            duration: c.duration,
            lessonsCount: c.lessons?.length || 0,
            completedLessonsCount: getCourseProgress(c).completedCount,
            isEnrolled: Boolean(c.isEnrolled),
            stepOrder: idx,
          })),
          totalModules,
          progressPercent,
          firstCourseId: items[0]?.id || courses[0]?.id || "",
          allEnrolled: items.length > 0 && items.every((c) => Boolean(c.isEnrolled)),
        };
      })
      .filter((p) => p.courses.length > 0);
  }, [dbPaths, courses]);

  const handleEnrollPath = async (slug: string) => {
    setEnrollingPathSlug(slug);
    try {
      await courseApi.enrollLearningPath(slug);
      await queryClient.invalidateQueries({ queryKey: queryKeys.courses.list() });
      const fresh = await courseApi.getLearningPaths();
      if (Array.isArray(fresh)) setDbPaths(fresh);
    } catch {
      // silent if offline or guest
    } finally {
      setEnrollingPathSlug(null);
    }
  };

  const handleClaimSpecializationCert = async (path: LearningPathRecord) => {
    setClaimingSpecSlug(path.slug);
    setPathNotice(null);
    try {
      const res = await courseApi.claimLearningPathCertificate(path.slug);
      setPathNotice(`Sertifikat Spesialisasi diterbitkan (ID: ${res.certificateId})!`);
      const fresh = await courseApi.getLearningPaths();
      if (Array.isArray(fresh)) {
        setDbPaths(fresh);
        const updated = fresh.find((p) => p.slug === path.slug);
        if (updated) setSelectedPath(updated);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile() });
    } catch (err: any) {
      setPathNotice(err?.message || "Selesaikan seluruh modul dalam jalur ini untuk mengklaim sertifikat.");
    } finally {
      setClaimingSpecSlug(null);
    }
  };

  const filteredCourses = useMemo(() => {
    const safeList = Array.isArray(courses) ? courses : [];
    const filtered = safeList.filter((c) => {
      const searchLower = debouncedSearch.toLowerCase().trim();
      const matchSearch =
        !searchLower ||
        c.title.toLowerCase().includes(searchLower) ||
        c.partner.toLowerCase().includes(searchLower) ||
        (c.category && c.category.toLowerCase().includes(searchLower)) ||
        (c.skills && c.skills.some((skill) => skill.toLowerCase().includes(searchLower)));

      const matchCategory = selectedCategory === "Semua" || c.category === selectedCategory;
      const matchDifficulty = selectedDifficulty === "Semua" || c.difficulty === selectedDifficulty;

      const { percentage } = getCourseProgress(c);
      const matchStatus =
        selectedStatus === "Semua" ||
        (selectedStatus === "Terdaftar" && Boolean(c.isEnrolled)) ||
        (selectedStatus === "Belum Dimulai" && percentage === 0) ||
        (selectedStatus === "Sedang Dipelajari" && percentage > 0 && percentage < 100) ||
        (selectedStatus === "Selesai" && percentage === 100);

      const matchBookmark = !showOnlyBookmarked || bookmarkedCourses.includes(c.id);
      const matchEnrolled = !showOnlyEnrolled || Boolean(c.isEnrolled);

      return matchSearch && matchCategory && matchDifficulty && matchStatus && matchBookmark && matchEnrolled;
    });

    if (selectedSort === "Populer") {
      filtered.sort((a, b) => {
        const ratingA = a.rating || 4.8;
        const ratingB = b.rating || 4.8;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (b.xpReward || 0) - (a.xpReward || 0);
      });
    } else if (selectedSort === "Terbaru") {
      filtered.sort((a, b) => b.id.localeCompare(a.id));
    } else if (selectedSort === "Durasi") {
      filtered.sort((a, b) => (a.lessons?.length || 0) - (b.lessons?.length || 0));
    }

    return filtered;
  }, [
    courses,
    debouncedSearch,
    selectedCategory,
    selectedDifficulty,
    selectedStatus,
    selectedSort,
    showOnlyBookmarked,
    showOnlyEnrolled,
    bookmarkedCourses,
  ]);

  const hasActiveFilters =
    Boolean(search) ||
    selectedCategory !== "Semua" ||
    selectedDifficulty !== "Semua" ||
    selectedStatus !== "Semua" ||
    showOnlyBookmarked ||
    showOnlyEnrolled;

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("Semua");
    setSelectedDifficulty("Semua");
    setSelectedStatus("Semua");
    setSelectedSort("Populer");
    setShowOnlyBookmarked(false);
    setShowOnlyEnrolled(false);
  };

  return (
    <div className="w-full space-y-6 relative z-10">
      {/* Editorial Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-5">
        <div className="space-y-1 max-w-2xl">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
            {courses.length} pelatihan industri · terbuka gratis
          </p>
          <h1 className="text-2xl sm:text-[28px] font-display font-bold tracking-tight text-zinc-950 dark:text-zinc-50 text-balance">
            Katalog Pelatihan Industri
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed">
            Setiap pelatihan dilengkapi pra-tes diagnostik, materi terstruktur, flashcard, studi kasus berevaluasi AI, dan sertifikat terverifikasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowOnlyEnrolled(!showOnlyEnrolled)}
            className={`h-8 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
              showOnlyEnrolled
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                : "bg-white dark:bg-[#111114] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Terdaftar ({enrolledCoursesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOnlyBookmarked(!showOnlyBookmarked)}
            className={`h-8 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
              showOnlyBookmarked
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300"
                : "bg-white dark:bg-[#111114] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showOnlyBookmarked ? "fill-rose-500 text-rose-500" : ""}`} />
            <span>Tersimpan ({bookmarkedCourses.length})</span>
          </button>

          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setLayout("grid")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                layout === "grid"
                  ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-2xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
              title="Tampilan Grid"
              aria-label="Tampilan Grid"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setLayout("list")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                layout === "list"
                  ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-2xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
              title="Tampilan List"
              aria-label="Tampilan List"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Segmented Category Strip */}
      <div className="inline-flex items-center p-1 bg-zinc-100/90 dark:bg-zinc-900 rounded-lg border border-zinc-200/80 dark:border-zinc-800 overflow-x-auto max-w-full hide-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = categoryCounts[cat] || 0;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-2xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <span>{cat}</span>
              <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-[#111114] rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              aria-label="Cari pelatihan, topik, kompetensi, atau mitra"
              type="text"
              placeholder="Cari pelatihan, topik, kompetensi, atau mitra..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-9 bg-zinc-50/70 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-emerald-600 dark:focus:border-emerald-500 outline-none transition-colors placeholder:text-zinc-400 text-[13px] text-zinc-950 dark:text-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter tingkat kesulitan"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="h-9 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200 outline-none focus:border-emerald-600 cursor-pointer"
            >
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>
                  {diff === "Semua" ? "Semua tingkat" : diff}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter status belajar"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="h-9 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200 outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="Semua">Semua status</option>
              <option value="Terdaftar">Sudah terdaftar</option>
              <option value="Sedang Dipelajari">Sedang dipelajari</option>
              <option value="Belum Dimulai">Belum dimulai</option>
              <option value="Selesai">Selesai (100%)</option>
            </select>

            <select
              aria-label="Urutkan pelatihan"
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="h-9 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200 outline-none focus:border-emerald-600 cursor-pointer"
            >
              <option value="Populer">Terpopuler</option>
              <option value="Terbaru">Terbaru</option>
              <option value="Durasi">Durasi terpendek</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
          <span className="tabular-nums">
            Menampilkan <strong className="text-zinc-950 dark:text-white font-semibold">{filteredCourses.length}</strong> dari {courses.length} pelatihan
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Reset filter
            </button>
          )}
        </div>
      </div>

      {/* Curated Career Learning Paths */}
      {careerPaths.length > 0 && !hasActiveFilters && (
        <section aria-label="Jalur Karier Terstruktur" className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
            <div>
              <h2 className="font-display font-semibold text-base text-zinc-950 dark:text-zinc-50 flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Jalur Karier Terstruktur</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Urutan kurikulum terarah dari fondasi hingga sertifikasi spesialisasi.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200/80 dark:divide-zinc-800/80">
            {careerPaths.map((path) => (
              <div key={path.slug} className="p-5 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                    <span>
                      {path.courses.length} kursus · {path.totalModules} modul
                    </span>
                    <span className="font-mono font-medium text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                      {path.progressPercent === 100 && <Award className="w-3.5 h-3.5 text-amber-500" />}
                      {path.progressPercent}%
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-[15px] text-zinc-950 dark:text-white leading-snug">
                    {path.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {path.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="w-full h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
                      style={{ width: `${path.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={path.allEnrolled || enrollingPathSlug === path.slug}
                      onClick={() => handleEnrollPath(path.slug)}
                      className={`h-8 px-2.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                        path.allEnrolled
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 cursor-default"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      }`}
                    >
                      {path.allEnrolled
                        ? "Terdaftar"
                        : enrollingPathSlug === path.slug
                        ? "..."
                        : "Daftar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPathNotice(null);
                        setSelectedPath(path);
                      }}
                      className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer whitespace-nowrap"
                    >
                      Silabus
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/belajar/lms?courseId=${encodeURIComponent(path.firstCourseId)}`)
                      }
                      className="flex-1 h-8 px-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-medium flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
                    >
                      <span>Mulai</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal Silabus Jalur Karier & Klaim Sertifikat Spesialisasi */}
      {selectedPath && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-xl w-full p-6 space-y-5 shadow-2xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200/80 dark:border-zinc-800 pb-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  Jalur spesialisasi · {selectedPath.targetRole}
                </p>
                <h3 className="font-display font-bold text-lg text-zinc-950 dark:text-white">
                  {selectedPath.title}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {selectedPath.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPath(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                aria-label="Tutup silabus jalur"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden">
              {selectedPath.courses.map((c, idx) => {
                const done = c.lessonsCount > 0 && c.completedLessonsCount >= c.lessonsCount;
                return (
                  <div
                    key={c.id}
                    className="p-3.5 bg-white dark:bg-[#111114] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 tabular-nums">
                        Tahap {idx + 1} · {c.difficulty} · {c.duration}
                      </p>
                      <h4 className="text-[13px] font-semibold text-zinc-950 dark:text-white truncate">
                        {c.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500 font-mono tabular-nums">
                        {c.completedLessonsCount}/{c.lessonsCount} modul selesai
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPath(null);
                        navigate(`/belajar/lms?courseId=${encodeURIComponent(c.id)}`);
                      }}
                      className={`h-8 px-3 rounded-lg text-xs font-medium shrink-0 cursor-pointer whitespace-nowrap ${
                        done
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60"
                          : "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950"
                      }`}
                    >
                      {done ? "Selesai" : "Buka kelas"}
                    </button>
                  </div>
                );
              })}
            </div>

            {pathNotice && (
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2.5 rounded-lg">
                {pathNotice}
              </p>
            )}

            <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-zinc-500 tabular-nums">
                Progres spesialisasi:{" "}
                <strong className="font-mono text-zinc-950 dark:text-white">
                  {selectedPath.progressPercent}%
                </strong>
              </span>
              {selectedPath.specializationCertId ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/verify/${selectedPath.specializationCertId}`)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Lihat Sertifikat Spesialisasi</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={selectedPath.progressPercent < 100 || claimingSpecSlug === selectedPath.slug}
                  onClick={() => handleClaimSpecializationCert(selectedPath)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>
                    {claimingSpecSlug === selectedPath.slug
                      ? "Menerbitkan..."
                      : selectedPath.progressPercent === 100
                        ? "Klaim Sertifikat Spesialisasi Gratis"
                        : "Tuntaskan 100% Untuk Sertifikat"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Course Grid / List */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-14 px-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center space-y-3">
          <h3 className="font-display text-base font-bold text-zinc-950 dark:text-white">
            Tidak ada pelatihan yang cocok
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs max-w-sm">
            Ubah kata kunci pencarian atau reset filter untuk melihat seluruh katalog pelatihan.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetFilters}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Reset Filter
          </Button>
        </div>
      ) : (
        <div
          className={
            layout === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "flex flex-col gap-3 max-w-4xl mx-auto w-full"
          }
        >
          {filteredCourses.map((course) => {
            const isBookmarked = bookmarkedCourses.includes(course.id);
            return (
              <CourseCard
                key={course.id}
                course={course}
                isBookmarked={isBookmarked}
                onBookmarkToggle={onBookmarkToggle}
                onClick={() => navigate(`/belajar/kursus/${course.id}`)}
                layout={layout}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default KatalogKursusView;
