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
    <div className="w-full py-1 sm:py-2 space-y-5 relative z-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="space-y-1">
          <p className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
            {courses.length} Pelatihan · 100% Gratis Tanpa Paywall · Pra-Tes · Modul · Lab AI · Sertifikasi
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-zinc-950 dark:text-white">
            Katalog Pelatihan Industri
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">
            Setiap pelatihan terbuka gratis lengkap dengan Pra-Tes Diagnostik, materi video &amp; kode, Flashcard SM-2, studi kasus berevaluasi AI, dan sertifikat terverifikasi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowOnlyEnrolled(!showOnlyEnrolled)}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              showOnlyEnrolled
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Terdaftar ({enrolledCoursesCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOnlyBookmarked(!showOnlyBookmarked)}
            className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              showOnlyBookmarked
                ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300"
                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showOnlyBookmarked ? "fill-rose-500 text-rose-500" : ""}`} />
            <span>Tersimpan ({bookmarkedCourses.length})</span>
          </button>

          <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setLayout("grid")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                layout === "grid"
                  ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
              title="Tampilan Grid"
              aria-label="Tampilan Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setLayout("list")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                layout === "list"
                  ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
              title="Tampilan List"
              aria-label="Tampilan List"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = categoryCounts[cat] || 0;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950"
                  : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <span>{cat}</span>
              <span className="font-mono text-[11px] opacity-75 tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              aria-label="Cari pelatihan, topik, kompetensi, atau mitra"
              type="text"
              placeholder="Cari pelatihan, topik, kompetensi, atau mitra..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:border-emerald-500 outline-none transition-colors placeholder:text-zinc-400 text-xs sm:text-sm text-zinc-950 dark:text-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
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
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none focus:border-emerald-500 cursor-pointer"
            >
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>
                  {diff === "Semua" ? "Semua Tingkat" : diff}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter status belajar"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Terdaftar">Sudah Terdaftar</option>
              <option value="Sedang Dipelajari">Sedang Dipelajari</option>
              <option value="Belum Dimulai">Belum Dimulai</option>
              <option value="Selesai">Selesai (100%)</option>
            </select>

            <select
              aria-label="Urutkan pelatihan"
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-200 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="Populer">Terpopuler</option>
              <option value="Terbaru">Terbaru</option>
              <option value="Durasi">Durasi Terpendek</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          <span className="font-mono tabular-nums">
            Menampilkan <strong className="text-zinc-950 dark:text-white">{filteredCourses.length}</strong> dari {courses.length} pelatihan
          </span>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Curated Career Learning Paths */}
      {careerPaths.length > 0 && !hasActiveFilters && (
        <section aria-label="Jalur Karier Terstruktur" className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display font-bold text-sm sm:text-base text-zinc-950 dark:text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Jalur Karier Terstruktur (100% Gratis)</span>
            </h2>
            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
              Urutan belajar dari nol hingga siap kerja
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {careerPaths.map((path) => (
              <div
                key={path.slug}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    <span>{path.courses.length} Kursus · {path.totalModules} Modul</span>
                    <span className="inline-flex items-center gap-1">
                      {path.progressPercent === 100 && <Award className="w-3.5 h-3.5 text-amber-500" />}
                      {path.progressPercent}%
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-zinc-950 dark:text-white leading-snug">
                    {path.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {path.description}
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                      style={{ width: `${path.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={path.allEnrolled || enrollingPathSlug === path.slug}
                      onClick={() => handleEnrollPath(path.slug)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                        path.allEnrolled
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 cursor-default"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {path.allEnrolled
                        ? "Terdaftar ✓"
                        : enrollingPathSlug === path.slug
                          ? "..."
                          : "Daftar Jalur"}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/belajar/lms?courseId=${encodeURIComponent(path.firstCourseId)}`)}
                      className="flex-1 py-2 px-3 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <span>Mulai di LMS</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
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
