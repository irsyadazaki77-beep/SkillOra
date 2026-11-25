import React, { useState, useMemo } from "react";
import {
  Search,
  Heart,
  Grid,
  List,
  RefreshCw,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Course, Profile } from "../types";
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

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState<
    "Semua" | "Belum Dimulai" | "Sedang Dipelajari" | "Selesai"
  >("Semua");
  const [selectedSort, setSelectedSort] = useState<"Populer" | "Terbaru" | "Durasi">("Populer");
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [layout, setLayout] = useState<"grid" | "list">("grid");

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
        (selectedStatus === "Belum Dimulai" && percentage === 0) ||
        (selectedStatus === "Sedang Dipelajari" && percentage > 0 && percentage < 100) ||
        (selectedStatus === "Selesai" && percentage === 100);

      const matchBookmark = !showOnlyBookmarked || bookmarkedCourses.includes(c.id);

      return matchSearch && matchCategory && matchDifficulty && matchStatus && matchBookmark;
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
    bookmarkedCourses,
  ]);

  const hasActiveFilters =
    Boolean(search) ||
    selectedCategory !== "Semua" ||
    selectedDifficulty !== "Semua" ||
    selectedStatus !== "Semua" ||
    showOnlyBookmarked;

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("Semua");
    setSelectedDifficulty("Semua");
    setSelectedStatus("Semua");
    setSelectedSort("Populer");
    setShowOnlyBookmarked(false);
  };

  return (
    <div className="w-full py-1 sm:py-2 space-y-5 relative z-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div className="space-y-1">
          <p className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
            {courses.length} Jalur Pelatihan · Pra-Tes · Modul · Lab AI · Sertifikasi
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-zinc-950 dark:text-white">
            Katalog Pelatihan Industri
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm max-w-2xl">
            Setiap pelatihan dilengkapi Pra-Tes Diagnostik, materi dengan Cek Paham & Flashcard SM-2, studi kasus berevaluasi AI, dan Ujian Sertifikasi Akhir.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
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
