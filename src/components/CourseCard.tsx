import React, { memo } from "react";
import { Clock, BarChart, Heart, Star, ChevronRight, PlayCircle, Award, CheckCircle2, BookOpen } from "lucide-react";
import { Course } from "../types";
import { motion } from "motion/react";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { getCourseProgress } from "../utils/courseUtils";
import defaultCourseImg from "../assets/images/course_tech_engineering_1794974031663.jpg";

interface CourseCardProps {
  course: Course;
  progress?: number;
  isBookmarked?: boolean;
  onBookmarkToggle?: (id: string) => void;
  onClick: () => void;
  layout?: "grid" | "list";
}

export const CourseCard = memo(function CourseCard({
  course,
  progress: customProgress,
  isBookmarked = false,
  onBookmarkToggle,
  onClick,
  layout = "grid",
}: CourseCardProps) {
  const { percentage, completedCount, totalCount, status, isCompleted } = getCourseProgress(course);
  const effectiveProgress = customProgress !== undefined ? customProgress : percentage;
  const rating = course.rating || 4.9;

  // Primary CTA label & icon determination
  let ctaLabel = "Mulai Belajar";
  let ctaVariant: "primary" | "secondary" | "subtle" = "secondary";
  let ctaIcon = <PlayCircle className="w-3.5 h-3.5" />;

  if (isCompleted || effectiveProgress === 100) {
    ctaLabel = "Lihat Sertifikat";
    ctaVariant = "subtle";
    ctaIcon = <Award className="w-3.5 h-3.5" />;
  } else if (effectiveProgress > 0) {
    ctaLabel = "Lanjutkan Belajar";
    ctaVariant = "primary";
    ctaIcon = <ChevronRight className="w-3.5 h-3.5" />;
  }

  if (layout === "list") {
    return (
      <motion.div
        whileHover={{ y: -2, transition: { duration: 0.15 } }}
        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-4 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-card transition-all cursor-pointer group flex flex-col sm:flex-row relative overflow-hidden gap-3.5"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div className="w-full sm:w-44 h-32 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden relative shrink-0">
          <img
            src={course.image || defaultCourseImg}
            alt={course.title}
            width="176"
            height="128"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = defaultCourseImg;
            }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute top-2 left-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs text-xs font-semibold px-2 py-0.5 rounded-md text-slate-800 dark:text-slate-200 flex items-center gap-1 border border-slate-200/50 dark:border-slate-700/50 shadow-2xs">
            <span>{course.logo}</span>
            <span className="truncate max-w-[100px]">{course.partner}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 justify-between py-0.5">
          <div>
            <div className="flex justify-between items-start gap-2 mb-1">
              <h4 className="font-display font-bold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {course.title}
              </h4>
              {onBookmarkToggle && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmarkToggle(course.id);
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    isBookmarked
                      ? "bg-rose-50 text-rose-500 dark:bg-rose-950/40"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                  aria-label={isBookmarked ? "Hapus dari tersimpan" : "Simpan kursus"}
                >
                  <Heart className={`w-4 h-4 ${isBookmarked ? "fill-rose-500" : ""}`} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{rating}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <BarChart className="w-3.5 h-3.5" />
                <span>{course.difficulty}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{course.duration}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{totalCount} Sesi</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-500 dark:text-slate-400">
                  {completedCount}/{totalCount} Sesi Selesai
                </span>
                <span className={effectiveProgress === 100 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-700 dark:text-slate-300"}>
                  {effectiveProgress}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    effectiveProgress === 100 ? "bg-emerald-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${effectiveProgress}%` }}
                />
              </div>
            </div>

            <Button
              variant={ctaVariant}
              size="sm"
              rightIcon={ctaIcon}
            >
              {ctaLabel}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-card transition-all duration-200 group cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Thumbnail Aspect Ratio */}
      <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <img
          src={course.image || defaultCourseImg}
          alt={course.title}
          width="320"
          height="180"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = defaultCourseImg;
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

        {onBookmarkToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBookmarkToggle(course.id);
            }}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center transition-all z-10 cursor-pointer ${
              isBookmarked
                ? "bg-rose-50 text-rose-500 shadow-xs"
                : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs text-slate-600 dark:text-slate-300 hover:text-slate-900"
            }`}
            aria-label={isBookmarked ? "Hapus dari tersimpan" : "Simpan kursus"}
          >
            <Heart className={`w-4 h-4 ${isBookmarked ? "fill-rose-500" : ""}`} />
          </button>
        )}

        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs text-xs font-semibold px-2 py-0.5 rounded-md text-slate-800 dark:text-slate-200 flex items-center gap-1 border border-slate-200/50 dark:border-slate-700/50 shadow-2xs">
            <span>{course.logo}</span>
            <span className="truncate max-w-[120px]">{course.partner}</span>
          </div>

          <div className="flex items-center gap-1 text-white text-xs font-semibold bg-slate-900/70 backdrop-blur-xs px-2 py-0.5 rounded-md">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{rating}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-2">
          {course.category && (
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
              {course.category}
            </span>
          )}
          <h3 className="font-display font-bold text-slate-900 dark:text-white text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {course.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
          <span className="flex items-center gap-1">
            <BarChart className="w-3.5 h-3.5" />
            <span>{course.difficulty}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{course.duration}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{totalCount} Sesi</span>
          </span>
        </div>

        {/* Card Footer & Progress */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            {effectiveProgress === 0 ? (
              <Badge variant="neutral" size="sm" dot>
                Belum Dimulai
              </Badge>
            ) : effectiveProgress === 100 ? (
              <Badge variant="success" size="sm" dot>
                Selesai (100%)
              </Badge>
            ) : (
              <Badge variant="primary" size="sm" dot>
                {effectiveProgress}% Selesai
              </Badge>
            )}
            <span className="text-slate-400 dark:text-slate-500 text-xs">
              {completedCount}/{totalCount} Sesi
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${effectiveProgress}%` }}
              className={`h-full rounded-full transition-all duration-300 ${
                effectiveProgress === 100 ? "bg-emerald-500" : "bg-blue-600"
              }`}
            />
          </div>

          <Button
            variant={ctaVariant}
            size="sm"
            fullWidth
            rightIcon={ctaIcon}
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

export default CourseCard;
