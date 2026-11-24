import React from "react";
import { PlayCircle, BookOpen, ChevronRight, Award, CheckCircle2, Clock } from "lucide-react";
import { Course, Lesson } from "../../../types";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import defaultCourseImg from "../../../assets/images/course_tech_engineering_1794974031663.jpg";

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
  const completedLessonsCount = primaryActiveCourse.lessons?.filter(l => l.completed).length || 0;
  const totalLessonsCount = primaryActiveCourse.lessons?.length || 0;

  return (
    <Card variant="default" padding="md" className="space-y-4" aria-labelledby="continue-learning-heading">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <PlayCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 id="continue-learning-heading" className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              {isCompleted ? "Kursus Telah Selesai" : "Lanjutkan Pembelajaran"}
            </h2>
          </div>
        </div>

        {/* Course Switcher Pills if multiple active */}
        {activeCourses.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            <span className="text-xs text-slate-400 font-medium mr-1 hidden sm:inline">Pilih Kursus:</span>
            {activeCourses.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => setSelectedActiveCourseIndex(idx)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedActiveCourseIndex === idx
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {c.title.split(" ")[0]} ({getCourseProgress(c)}%)
              </button>
            ))}
          </div>
        )}
      </div>

      {isCompleted ? (
        /* Completed Course State */
        <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Selesai
              </div>
              <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
                {primaryActiveCourse.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Selamat! Kamu telah menyelesaikan semua {totalLessonsCount} materi pembelajaran.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
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
            <Button
              variant="secondary"
              size="sm"
              onClick={onNavigateToKatalog}
            >
              Pilih Kursus Baru
            </Button>
          </div>
        </div>
      ) : (
        /* Active Ongoing Course Card */
        <div className="flex flex-col md:flex-row gap-4 items-stretch p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800/80">
          {/* Thumbnail */}
          <div 
            onClick={() => onNavigateToCourse(primaryActiveCourse.id)}
            className="w-full md:w-48 h-32 md:h-auto rounded-xl bg-slate-200 dark:bg-slate-800 overflow-hidden relative shrink-0 cursor-pointer group shadow-xs"
          >
            <img
              src={primaryActiveCourse.image || defaultCourseImg}
              alt={primaryActiveCourse.title}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = defaultCourseImg;
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-xs font-bold">
              {primaryActiveCourse.category}
            </div>
          </div>
          
          {/* Content Details */}
          <div className="flex-1 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Badge variant="primary" size="sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                  Sedang Berjalan
                </Badge>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Tingkat: {primaryActiveCourse.difficulty || "Pemula"}
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">&bull;</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {primaryActiveCourse.duration || "4 Jam"}
                </span>
              </div>

              <h3 
                onClick={() => onNavigateToCourse(primaryActiveCourse.id)}
                className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1 cursor-pointer"
              >
                {primaryActiveCourse.title}
              </h3>
              
              {/* Active Next Lesson */}
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Materi Berikutnya:</span>
                <span className="text-slate-900 dark:text-white font-semibold truncate max-w-sm">
                  {activeLesson?.title || "Materi Pertama"}
                </span>
              </div>
            </div>
            
            {/* Progress Bar with ratio */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">
                  Progres Belajar ({progress}%)
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {completedLessonsCount} / {totalLessonsCount} Bab Selesai
                </span>
              </div>
              
              <ProgressBar
                value={progress}
                variant="primary"
                size="sm"
              />
            </div>

            {/* CTAs */}
            <div className="pt-1 flex flex-wrap items-center gap-2.5">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (activeLesson) {
                    onNavigateToLesson(primaryActiveCourse.id, activeLesson.id);
                  } else {
                    onNavigateToCourse(primaryActiveCourse.id);
                  }
                }}
                leftIcon={<PlayCircle className="w-4 h-4" />}
              >
                {activeLesson ? `Lanjutkan: ${activeLesson.title.slice(0, 24)}...` : "Lanjutkan Belajar"}
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => onNavigateToCourse(primaryActiveCourse.id)}
              >
                Buka Silabus
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
