import React, { useState, useMemo } from "react";
import { 
  Search, 
  Clock, 
  BarChart, 
  Heart, 
  Grid, 
  List, 
  Filter, 
  RefreshCw, 
  Layers, 
  X, 
  BookOpen, 
  Sparkles, 
  Award,
  SlidersHorizontal
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Course, Profile } from "../types";
import { CourseCard } from "./CourseCard";
import { useDebounce } from "../hooks/useDebounce";
import { getCourseProgress } from "../utils/courseUtils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";

interface KatalogKursusViewProps {
  courses: Course[];
  profile: Profile;
  onBookmarkToggle: (courseId: string) => void;
}

export function KatalogKursusView({ courses, profile, onBookmarkToggle }: KatalogKursusViewProps) {
  const navigate = useNavigate();
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 250);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState<"Semua" | "Belum Dimulai" | "Sedang Dipelajari" | "Selesai">("Semua");
  const [selectedSort, setSelectedSort] = useState<"Populer" | "Terbaru" | "Durasi">("Populer");
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  // Derive unique categories with course count
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: courses.length };
    courses.forEach(c => {
      if (c.category) {
        counts[c.category] = (counts[c.category] || 0) + 1;
      }
    });
    return counts;
  }, [courses]);

  const categories = useMemo(() => {
    return Object.keys(categoryCounts);
  }, [categoryCounts]);

  const difficulties = ["Semua", "Pemula", "Menengah", "Lanjutan"];
  const bookmarkedCourses = profile.bookmarkedCourses || [];

  // Filter courses
  const filteredCourses = useMemo(() => {
    const safeList = Array.isArray(courses) ? courses : [];
    const filtered = safeList.filter(c => {
      // 1. Search by title, skills or partner
      const searchLower = debouncedSearch.toLowerCase().trim();
      const matchSearch = !searchLower || 
        c.title.toLowerCase().includes(searchLower) || 
        c.partner.toLowerCase().includes(searchLower) ||
        (c.skills && c.skills.some(skill => skill.toLowerCase().includes(searchLower)));

      // 2. Category
      const matchCategory = selectedCategory === "Semua" || c.category === selectedCategory;

      // 3. Difficulty
      const matchDifficulty = selectedDifficulty === "Semua" || c.difficulty === selectedDifficulty;

      // 4. Progress status
      const { percentage, status } = getCourseProgress(c);
      const matchStatus = 
        selectedStatus === "Semua" || 
        (selectedStatus === "Belum Dimulai" && percentage === 0) ||
        (selectedStatus === "Sedang Dipelajari" && percentage > 0 && percentage < 100) ||
        (selectedStatus === "Selesai" && percentage === 100);

      // 5. Bookmark
      const matchBookmark = !showOnlyBookmarked || bookmarkedCourses.includes(c.id);

      return matchSearch && matchCategory && matchDifficulty && matchStatus && matchBookmark;
    });
    
    // Sort logic
    if (selectedSort === "Populer") {
      filtered.sort((a, b) => {
        const ratingA = a.rating || 4.8;
        const ratingB = b.rating || 4.8;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (b.xpReward || 0) - (a.xpReward || 0);
      });
    } else if (selectedSort === "Terbaru") {
      // Keep natural list order or id
      filtered.sort((a, b) => b.id.localeCompare(a.id));
    } else if (selectedSort === "Durasi") {
      filtered.sort((a, b) => (a.lessons?.length || 0) - (b.lessons?.length || 0));
    }

    return filtered;
  }, [courses, debouncedSearch, selectedCategory, selectedDifficulty, selectedStatus, selectedSort, showOnlyBookmarked, bookmarkedCourses]);

  // Active filters for tags
  const activeFilters = useMemo(() => {
    const list: { key: string; label: string; value: string; onClear: () => void }[] = [];
    if (search) {
      list.push({ key: "search", label: "Pencarian", value: `"${search}"`, onClear: () => setSearch("") });
    }
    if (selectedCategory !== "Semua") {
      list.push({ key: "category", label: "Kategori", value: selectedCategory, onClear: () => setSelectedCategory("Semua") });
    }
    if (selectedDifficulty !== "Semua") {
      list.push({ key: "difficulty", label: "Tingkat", value: selectedDifficulty, onClear: () => setSelectedDifficulty("Semua") });
    }
    if (selectedStatus !== "Semua") {
      list.push({ key: "status", label: "Status", value: selectedStatus, onClear: () => setSelectedStatus("Semua") });
    }
    if (showOnlyBookmarked) {
      list.push({ key: "bookmarked", label: "Filter", value: "Favorit Tersimpan", onClear: () => setShowOnlyBookmarked(false) });
    }
    return list;
  }, [search, selectedCategory, selectedDifficulty, selectedStatus, showOnlyBookmarked]);

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategory("Semua");
    setSelectedDifficulty("Semua");
    setSelectedStatus("Semua");
    setSelectedSort("Populer");
    setShowOnlyBookmarked(false);
  };

  return (
    <div className="w-full py-1 sm:py-2 font-sans space-y-5 sm:space-y-6 relative z-10 animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight text-slate-900 dark:text-white">
              Katalog Kursus
            </h1>
            <Badge variant="neutral" size="sm">
              {courses.length} Kursus
            </Badge>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm max-w-2xl">
            Pilih jalur belajar bersertifikat industri dan bangun portofolio karier Anda dengan materi terstruktur.
          </p>
        </div>

        {/* Action button controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Bookmark filter toggle */}
          <button
            type="button"
            onClick={() => setShowOnlyBookmarked(!showOnlyBookmarked)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              showOnlyBookmarked
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 shadow-2xs"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${showOnlyBookmarked ? "fill-rose-500 text-rose-500" : ""}`} />
            <span>Tersimpan ({bookmarkedCourses.length})</span>
          </button>

          {/* Grid/List layout toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setLayout("grid")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                layout === "grid"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Tampilan Grid"
              aria-label="Tampilan Grid"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setLayout("list")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                layout === "list"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              title="Tampilan List"
              aria-label="Tampilan List"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Category Pills Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          const count = categoryCounts[cat] || 0;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isSelected
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <span>{cat}</span>
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full font-extrabold ${
                  isSelected
                    ? "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 group">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input aria-label="Cari kursus, topik, materi, atau mitra..."
              type="text"
              placeholder="Cari kursus, topik, materi, atau mitra..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-3 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium text-xs sm:text-sm text-slate-900 dark:text-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Dropdown Filters */}
          <div className="flex items-center gap-2">
            {/* Difficulty */}
            <select aria-label="Input field"
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
            >
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>
                  {diff === "Semua" ? "Semua Tingkat" : diff}
                </option>
              ))}
            </select>

            {/* Status */}
            <select aria-label="Input field"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Sedang Dipelajari">Sedang Dipelajari</option>
              <option value="Belum Dimulai">Belum Dimulai</option>
              <option value="Selesai">Selesai (100%)</option>
            </select>

            {/* Sort */}
            <select aria-label="Input field"
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="Populer">Terpopuler</option>
              <option value="Terbaru">Terbaru</option>
              <option value="Durasi">Durasi Terpendek</option>
            </select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter Aktif:
            </span>
            {activeFilters.map((filter) => (
              <div
                key={filter.key}
                className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-lg pl-2 pr-1.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300"
              >
                <span>{filter.label}:</span>
                <span className="font-bold">{filter.value}</span>
                <button
                  type="button"
                  onClick={filter.onClear}
                  className="hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded p-0.5 transition-colors cursor-pointer"
                  aria-label={`Hapus filter ${filter.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors ml-1 cursor-pointer"
            >
              Reset Semua
            </button>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
        <span>
          Menampilkan <strong className="text-slate-900 dark:text-white">{filteredCourses.length}</strong> kursus
        </span>
      </div>

      {/* Course List / Grid */}
      {filteredCourses.length === 0 ? (
        <div className="text-center py-12 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl">
            🔍
          </div>
          <h3 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Tidak ada kursus yang cocok
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs max-w-sm">
            Coba ubah kata kunci pencarian atau bersihkan filter untuk menemukan materi yang diinginkan.
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
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4"
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
