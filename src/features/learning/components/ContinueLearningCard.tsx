import React from "react";
import { Play, Award, CheckCircle2, ArrowRight } from "lucide-react";
import { Course, Lesson } from "../../../types";
import { Button } from "../../../components/ui/Button";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import defaultCourseImg from "../../../assets/images/course_tech_engineering_1794974031663.jpg";
import { resolveCourseImage } from "../../../utils/resolveAsset";

interface ContinueLearningCardProps {
  primaryActiveCourse?: Course;
  activeCourses: Course[];
  selectedActiveCourseIndex: number;
  setSelectedActiveCourseIndex: (idx: number) => void;
  activeLesson?: Lesson;
  getCourseProgress: (course: Course) => number;
  onNavigateToCourse: (courseId: string) => void;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
  onNavigateToKatalog: () => void;
  onNavigateToSertifikasi?: () => void;
}

export function ContinueLearningCard({
  primaryActiveCourse,
  activeCourses,
  selectedActiveCourseIndex,
  setSelectedActiveCourseIndex,
  activeLesson,
  getCourseProgress,
  onNavigateToCourse,
  onNavigateToLesson,
  onNavigateToKatalog,
  onNavigateToSertifikasi,
}: ContinueLearningCardProps) {
  if (!primaryActiveCourse) return null;

  const progress = getCourseProgress(primaryActiveCourse);
  const isCompleted = progress === 100;
  const completedLessonsCount = primaryActiveCourse.lessons?.filter((l) => l.completed).length || 0;
  const totalLessonsCount = primaryActiveCourse.lessons?.length || 0;

  return (
    <section
      aria-labelledby="continue-learning-heading"
      className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden"
    >
      {/* Top Bar of Focal Card */}
      <div className="px-5 py-3.5 border-b border-zinc-200/70 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2
            id="continue-learning-heading"
            className="font-display text-sm font-semibold text-zinc-950 dark:text-zinc-50"
          >
            {isCompleted ? "Kursus diselesaikan" : "Lanjutkan belajar"}
          </h2>
          <span className="text-xs text-zinc-400">·</span>
          <span className="text-xs font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-medium">
            {progress}% selesai
          </span>
        </div>

        {activeCourses.length > 1 && (
          <div className="flex items-center gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-200/70 dark:border-zinc-800 overflow-x-auto hide-scrollbar">
            {activeCourses.map((c, idx) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedActiveCourseIndex(idx)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                  selectedActiveCourseIndex === idx
                    ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-2xs"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {c.title.split(" ")[0]} ({getCourseProgress(c)}%)
              </button>
            ))}
          </div>
        )}
      </div>

      {isCompleted ? (
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Semua {totalLessonsCount} materi selesai</span>
            </div>
            <h3 className="font-display text-lg font-bold text-zinc-950 dark:text-white tracking-tight">
              {primaryActiveCourse.title}
            </h3>
            <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400">
              Lanjutkan ke pengajuan proyek portofolio untuk menerbitkan sertifikat kompetensi terverifikasi.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToSertifikasi && (
              <Button
                variant="primary"
                size="sm"
                onClick={onNavigateToSertifikasi}
                leftIcon={<Award className="w-3.5 h-3.5" />}
              >
                Klaim Sertifikat
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onNavigateToKatalog}>
              Jelajahi Katalog
            </Button>
          </div>
        </div>
      ) : (
        /* Single-Elevation Split Layout (No Cards-Within-Cards) */
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
          <div
            onClick={() => onNavigateToCourse(primaryActiveCourse.id)}
            className="md:col-span-5 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 cursor-pointer group aspect-[16/10] md:aspect-auto md:min-h-[176px]"
          >
            <img
              src={resolveCourseImage(primaryActiveCourse.image)}
              alt={primaryActiveCourse.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = defaultCourseImg;
              }}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
              loading="lazy"
            />
          </div>

          <div className="md:col-span-7 flex flex-col justify-between gap-4 min-w-0">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  {primaryActiveCourse.category}
                </span>
                <span aria-hidden="true">·</span>
                <span>{primaryActiveCourse.difficulty || "Pemula"}</span>
                <span aria-hidden="true">·</span>
                <span>{primaryActiveCourse.duration || "4 Jam"}</span>
              </div>

              <h3
                onClick={() => onNavigateToCourse(primaryActiveCourse.id)}
                className="font-display text-lg sm:text-xl font-bold text-zinc-950 dark:text-white tracking-tight hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer line-clamp-2"
              >
                {primaryActiveCourse.title}
              </h3>

              <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 truncate">
                Materi berikutnya:{" "}
                <span className="text-zinc-900 dark:text-zinc-200 font-medium">
                  {activeLesson?.title || "Materi Pertama"}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">Progres modul</span>
                  <span className="font-mono tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
                    {completedLessonsCount} / {totalLessonsCount} bab
                  </span>
                </div>
                <ProgressBar value={progress} variant="primary" size="sm" />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    if (activeLesson) {
                      onNavigateToLesson(primaryActiveCourse.id, activeLesson.id);
                    } else {
                      onNavigateToCourse(primaryActiveCourse.id);
                    }
                  }}
                  leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                >
                  Lanjutkan Materi
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={() => onNavigateToCourse(primaryActiveCourse.id)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Lihat Silabus
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
