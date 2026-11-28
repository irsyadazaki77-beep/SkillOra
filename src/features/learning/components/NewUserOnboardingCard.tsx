import React from "react";
import { ArrowRight } from "lucide-react";
import { Course } from "../../../types";
import { Button } from "../../../components/ui/Button";
import defaultCourseImg from "../../../assets/images/course_tech_engineering_1794974031663.jpg";
import { resolveCourseImage } from "../../../utils/resolveAsset";

interface NewUserOnboardingCardProps {
  userName: string;
  courses: Course[];
  onSelectCourse: (courseId: string) => void;
  onNavigateToKatalog: () => void;
}

export function NewUserOnboardingCard({
  userName,
  courses,
  onSelectCourse,
  onNavigateToKatalog,
}: NewUserOnboardingCardProps) {
  const starterCourses = courses.slice(0, 3);

  return (
    <section className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-zinc-200/80 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="space-y-1 max-w-xl">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Langkah pertama
          </p>
          <h2 className="font-display text-lg sm:text-xl font-bold text-zinc-950 dark:text-white tracking-tight">
            Mulai jalur belajarmu, {userName || "Siswa"}
          </h2>
          <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Pilih satu kursus fondasi di bawah ini untuk membuka progres belajar dan membangun portofolio proyek.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onNavigateToKatalog}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Semua Katalog
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/80 dark:divide-zinc-800/80">
        {starterCourses.map((course) => (
          <button
            key={course.id}
            type="button"
            onClick={() => onSelectCourse(course.id)}
            className="group text-left p-4 sm:p-5 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="space-y-3">
              <div className="aspect-[16/10] rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800">
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
              <div className="space-y-1">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {course.category} · {course.lessons?.length || 0} materi
                </p>
                <h3 className="font-display text-sm font-semibold text-zinc-950 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {course.title}
                </h3>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Mulai kursus
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
