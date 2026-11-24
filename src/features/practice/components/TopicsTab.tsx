import React from "react";
import { Search, Filter, Sparkles, BookOpen, CheckCircle2, ChevronRight } from "lucide-react";
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
  startQuizSession
}: TopicsTabProps) {
  const categories = ["Semua", "Web Development", "Backend Development", "TKD BUMN", "UI/UX", "Data Science"];

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input aria-label="Cari topik, materi, atau nama kursus..."
            type="text"
            placeholder="Cari topik, materi, atau nama kursus..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <select aria-label="Input field"
            value={selectedDifficulty}
            onChange={e => setSelectedDifficulty(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Semua">Semua Level</option>
            <option value="Pemula">Pemula</option>
            <option value="Menengah">Menengah</option>
            <option value="Sulit">Sulit</option>
          </select>

          <select aria-label="Input field"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Semua">Semua Status</option>
            <option value="Selesai">Sudah Selesai</option>
            <option value="Belum">Belum Dikerjakan</option>
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Topics Grid */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 p-6">
          <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Tidak ada topik latihan yang sesuai
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Coba sesuaikan kata kunci pencarian atau ganti filter kategori/level untuk menemukan latihan yang tersedia.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic) => (
            <div
              key={`${topic.courseId}_${topic.lessonId}`}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
                    {topic.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {topic.difficulty}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                    {topic.lessonTitle}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                    {topic.courseTitle}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {topic.questionsCount} Soal
                  </span>
                  {topic.bestScore > 0 && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      Skor: {topic.bestScore}%
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    startQuizSession(
                      `Latihan: ${topic.lessonTitle}`,
                      `${topic.courseTitle} • ${topic.category}`,
                      "topic",
                      topic.courseId,
                      topic.lessonId
                    );
                  }}
                  className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
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
