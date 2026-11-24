import React from "react";
import { Compass, ArrowRight, BookOpen, Clock, Star } from "lucide-react";
import { Course } from "../../../types";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import defaultCourseImg from "../../../assets/images/course_tech_engineering_1794974031663.jpg";

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
  onNavigateToKatalog
}: RecommendedCoursesSectionProps) {
  // Take top 2-3 recommendations for a clean dashboard preview
  const displayCourses = filteredRecommendedCourses.slice(0, 3);

  return (
    <section className="space-y-3.5" aria-labelledby="recommended-courses-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 
            id="recommended-courses-heading"
            className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight"
          >
            Rekomendasi Kursus Terpilih
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Tingkatkan keahlian dengan kurikulum berbasis proyek standar industri.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNavigateToKatalog}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Lihat Semua di Katalog
        </Button>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs font-bold"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      
      {displayCourses.length === 0 ? (
        <Card variant="flat" padding="md" className="text-center py-8">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Tidak ada kursus pada kategori ini.
          </p>
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={() => setSelectedCategory("semua")}>
              Tampilkan Semua Kategori
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayCourses.map(course => {
            const progress = getCourseProgress(course);
            return (
              <Card
                key={course.id}
                variant="interactive"
                padding="none"
                onClick={() => onNavigateToCourse(course.id)}
                className="group flex flex-col justify-between overflow-hidden"
              >
                <div className="space-y-2.5">
                  <div className="h-32 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                    <img
                      src={course.image || defaultCourseImg}
                      alt={course.title}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = defaultCourseImg;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold">
                      {course.category}
                    </div>
                  </div>

                  <div className="px-3.5 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-500" />
                        4.8
                      </span>
                      <span>&bull;</span>
                      <span>{course.lessons?.length || 0} Materi</span>
                      <span>&bull;</span>
                      <span>{course.difficulty || "Pemula"}</span>
                    </div>

                    <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {course.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {course.description || "Pelajari konsep mendalam dan bangun portofolio proyek terstandarisasi."}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 mt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                    {progress > 0 ? `Lanjutkan (${progress}%)` : "Lihat Silabus"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
