import React from "react";
import { ArrowRight } from "lucide-react";
import { Course } from "../../../types";
import { Button } from "../../../components/ui/Button";
import defaultCourseImg from "../../../assets/images/course_tech_engineering_1794974031663.jpg";
import { resolveCourseImage } from "../../../utils/resolveAsset";

interface RecommendedCoursesSectionProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  filteredRecommendedCourses: Course[];
  getCourseProgress: (course: Course) => number;
  onNavigateToCourse: (courseId: string) => void;
  onNavigateToKatalog: () => void;
}

export function RecommendedCoursesSection({
  categories,
  selectedCategory,
  setSelectedCategory,
  filteredRecommendedCourses,
  getCourseProgress,
  onNavigateToCourse,
  onNavigateToKatalog,
}: RecommendedCoursesSectionProps) {
  const displayCourses = filteredRecommendedCourses.slice(0, 3);

  return (
    <section className="space-y-4" aria-labelledby="recommended-courses-heading">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-0.5">
          <h2
            id="recommended-courses-heading"
            className="font-display font-semibold text-base sm:text-[17px] text-zinc-950 dark:text-zinc-50 tracking-tight"
          >
            Rekomendasi kursus
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Kurikulum berbasis proyek untuk mempercepat kesiapan kerja.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateToKatalog}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Semua katalog
        </Button>
      </div>

      {/* Segmented Category Filter Control */}
      <div className="inline-flex items-center p-1 bg-zinc-100/90 dark:bg-zinc-900 rounded-lg border border-zinc-200/80 dark:border-zinc-800 overflow-x-auto max-w-full hide-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              selectedCategory === cat
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-2xs"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {displayCourses.length === 0 ? (
        <div className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-8 text-center space-y-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Belum ada kursus yang cocok pada kategori ini.
          </p>
          <Button variant="outline" size="sm" onClick={() => setSelectedCategory("semua")}>
            Tampilkan semua kategori
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {displayCourses.map((course) => {
            const progress = getCourseProgress(course);
            return (
              <button
                key={course.id}
                type="button"
                onClick={() => onNavigateToCourse(course.id)}
                className="group text-left bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl overflow-hidden flex flex-col justify-between transition-colors cursor-pointer"
              >
                <div>
                  <div className="aspect-[16/10] bg-zinc-100 dark:bg-zinc-900 overflow-hidden border-b border-zinc-200/70 dark:border-zinc-800/80">
                    <img
                      src={resolveCourseImage(course.image)}
                      alt={course.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = defaultCourseImg;
                      }}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-4 space-y-1.5">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      <span className="font-medium text-emerald-700 dark:text-emerald-400">
                        {course.category}
                      </span>
                      {" · "}
                      {course.lessons?.length || 0} bab
                      {" · "}
                      {course.difficulty || "Pemula"}
                    </p>

                    <h3 className="font-display font-semibold text-sm text-zinc-950 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
                      {course.title}
                    </h3>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 tabular-nums">
                    {progress > 0 ? `Lanjutkan (${progress}%)` : "Buka silabus"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
