import React, { useMemo } from "react";
import { Search, BookOpen, ChevronRight } from "lucide-react";
import { Course } from "../../../types";
import { ModeLatihan } from "../types";

interface TopicItem {
  courseId: string;
  lessonId: string;
  courseTitle: string;
  lessonTitle: string;
  category: string;
  questionsCount: number;
  difficulty: string;
  isCompleted: boolean;
  bestScore: number;
}

interface TopicsTabProps {
  filteredTopics: TopicItem[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedDifficulty: string;
  setSelectedDifficulty: (d: string) => void;
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
  courses: Course[];
  startQuizSession: (
    title: string,
    subtitle: string,
    mode: ModeLatihan,
    courseId?: string,
    lessonId?: string
  ) => void;
}

export function TopicsTab({
  filteredTopics,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedDifficulty,
  setSelectedDifficulty,
  selectedStatus,
  setSelectedStatus,
  courses,
  startQuizSession,
}: TopicsTabProps) {
  const categories = useMemo(() => {
    const dynamicCats = Array.from(
      new Set(
        (Array.isArray(courses) ? courses : [])
          .map((c) => c.category?.trim())
          .filter((cat): cat is string => Boolean(cat))
      )
    );
    return ["Semua", ...dynamicCats];
  }, [courses]);

  return (
    <div className="space-y-5">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            aria-label="Cari materi atau nama pelatihan"
            type="text"
            placeholder="Cari materi atau nama pelatihan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-950 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <select
            aria-label="Filter tingkat kesulitan"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="py-2 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="Semua">Semua Tingkat</option>
            <option value="Pemula">Pemula</option>
            <option value="Menengah">Menengah</option>
            <option value="Lanjutan">Lanjutan</option>
            <option value="Sulit">Sulit</option>
          </select>

          <select
            aria-label="Filter status pengerjaan"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="Selesai">Sudah Selesai</option>
            <option value="Belum">Belum Dikerjakan</option>
          </select>
        </div>
      </div>

      {/* Dynamic Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? "bg-emerald-600 text-white"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Topics Grid */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2.5 p-6">
          <BookOpen className="w-9 h-9 text-zinc-300 dark:text-zinc-600 mx-auto" />
          <h3 className="text-base font-display font-bold text-zinc-800 dark:text-zinc-200">
            Tidak ada materi latihan yang cocok
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau pilih kategori "Semua" untuk melihat seluruh latihan yang tersedia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic) => (
            <div
              key={`${topic.courseId}_${topic.lessonId}`}
              className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 transition-colors flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 truncate">
                    {topic.category}
                  </span>
                  <span className="text-xs font-semibold text-zinc-400 shrink-0">
                    {topic.difficulty}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-zinc-950 dark:text-white line-clamp-1">
                    {topic.lessonTitle}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                    {topic.courseTitle}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">
                    {topic.questionsCount} Soal
                  </span>
                  {topic.bestScore > 0 && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                      Terbaik: {topic.bestScore}%
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    startQuizSession(
                      `Latihan: ${topic.lessonTitle}`,
                      `${topic.courseTitle} • ${topic.category}`,
                      "topic",
                      topic.courseId,
                      topic.lessonId
                    )
                  }
                  className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Mulai</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
