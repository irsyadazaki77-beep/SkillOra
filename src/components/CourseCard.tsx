import React, { memo } from "react";
import { Heart, Star, ChevronRight, PlayCircle, Award } from "lucide-react";
import { Course } from "../types";
import { motion } from "motion/react";
import { Button } from "./ui/Button";
import { getCourseProgress } from "../utils/courseUtils";
import defaultCourseImg from "../assets/images/course_tech_engineering_1794974031663.jpg";
import { resolveCourseImage } from "../utils/resolveAsset";

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
  const { percentage, completedCount, totalCount, isCompleted } = getCourseProgress(course);
  const effectiveProgress = customProgress !== undefined ? customProgress : percentage;
  const rating = course.rating || 4.9;
  const labCount = course.linkedLabIds?.length || 0;

  let ctaLabel = "Mulai Jalur 4 Tahap";
  let ctaVariant: "primary" | "secondary" | "subtle" = "secondary";
  let ctaIcon = <PlayCircle className="w-3.5 h-3.5" />;

  if (isCompleted || effectiveProgress === 100) {
    ctaLabel = "Ujian & Sertifikat";
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
        whileHover={{ y: -1, transition: { duration: 0.15 } }}
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 sm:p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer group flex flex-col sm:flex-row relative overflow-hidden gap-4"
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
        <div className="w-full sm:w-48 h-32 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative shrink-0">
          <img
            src={resolveCourseImage(course.image)}
            alt={course.title}
            width="192"
            height="128"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = defaultCourseImg;
            }}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/65 via-transparent to-transparent" />
          <span className="absolute bottom-2 left-2.5 text-[11px] font-semibold text-white truncate max-w-[160px]">
            {course.partner}
          </span>
        </div>

        <div className="flex-1 flex flex-col min-w-0 justify-between gap-2.5">
          <div>
            <div className="flex justify-between items-start gap-2 mb-1">
              <div className="min-w-0">
                <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                  {course.category || "Pelatihan Industri"}
                </p>
                <h4 className="font-display font-bold text-zinc-950 dark:text-white text-sm sm:text-base group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {course.title}
                </h4>
              </div>
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
                      : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                  aria-label={isBookmarked ? "Hapus dari tersimpan" : "Simpan pelatihan"}
                >
                  <Heart className={`w-4 h-4 ${isBookmarked ? "fill-rose-500" : ""}`} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">100% Gratis</span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 text-zinc-800 dark:text-zinc-200 font-semibold">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {rating}
              </span>
              <span>·</span>
              <span>{course.difficulty}</span>
              <span>·</span>
              <span>{course.duration}</span>
              <span>·</span>
              <span>{totalCount} Sesi</span>
              {typeof course.enrolledCount === "number" && course.enrolledCount > 0 && (
                <>
                  <span>·</span>
                  <span>{course.enrolledCount} peserta</span>
                </>
              )}
              {course.isEnrolled && (
                <>
                  <span>·</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Terdaftar ✓</span>
                </>
              )}
              {labCount > 0 && (
                <>
                  <span>·</span>
                  <span className="text-emerald-700 dark:text-emerald-400">{labCount} Lab & AI</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs font-mono tabular-nums mb-1">
                <span className="text-zinc-500 dark:text-zinc-400">
                  {completedCount}/{totalCount} Sesi
                </span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {effectiveProgress}%
                </span>
              </div>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${effectiveProgress}%` }}
                />
              </div>
            </div>

            <Button variant={ctaVariant} size="sm" rightIcon={ctaIcon}>
              {ctaLabel}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors duration-200 group cursor-pointer"
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
      {/* Thumbnail */}
      <div className="relative aspect-video w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <img
          src={resolveCourseImage(course.image)}
          alt={course.title}
          width="320"
          height="180"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = defaultCourseImg;
          }}
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 ease-out"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/75 via-zinc-950/15 to-transparent" />

        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span className="px-2 py-0.5 rounded-md bg-emerald-600/95 text-white text-[10px] font-bold tracking-wide shadow-xs">
            100% Gratis
          </span>
          {course.isEnrolled && (
            <span className="px-2 py-0.5 rounded-md bg-zinc-950/80 text-emerald-300 text-[10px] font-semibold">
              Terdaftar ✓
            </span>
          )}
        </div>

        {onBookmarkToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onBookmarkToggle(course.id);
            }}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors z-10 cursor-pointer ${
              isBookmarked
                ? "bg-rose-50 text-rose-500"
                : "bg-zinc-950/55 text-white hover:bg-zinc-950/80"
            }`}
            aria-label={isBookmarked ? "Hapus dari tersimpan" : "Simpan pelatihan"}
          >
            <Heart className={`w-4 h-4 ${isBookmarked ? "fill-rose-500" : ""}`} />
          </button>
        )}

        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs">
          <span className="font-semibold truncate max-w-[170px]">{course.partner}</span>
          <span className="inline-flex items-center gap-1 font-mono tabular-nums font-semibold">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            {rating}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="mb-2 space-y-1">
          {course.category && (
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
              {course.category}
            </span>
          )}
          <h3 className="font-display font-bold text-zinc-950 dark:text-white text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            {course.title}
          </h3>
        </div>

        {/* Unboxed Metadata Strip (Zero-Pill) */}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums mb-4 leading-relaxed">
          {course.difficulty} · {course.duration} · {totalCount} Sesi
          {typeof course.enrolledCount === "number" && course.enrolledCount > 0
            ? ` · ${course.enrolledCount} peserta`
            : ""}
          {labCount > 0 ? ` · ${labCount} Lab` : ""}
        </p>

        {/* Footer & Progress */}
        <div className="mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
            <span
              className={
                effectiveProgress === 100
                  ? "text-emerald-700 dark:text-emerald-400 font-semibold"
                  : effectiveProgress > 0
                  ? "text-zinc-900 dark:text-zinc-200 font-semibold"
                  : "text-zinc-500 dark:text-zinc-400"
              }
            >
              {effectiveProgress === 0
                ? "4 Tahap · Belum Mulai"
                : effectiveProgress === 100
                ? "Selesai 100%"
                : `${effectiveProgress}% Berjalan`}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500">
              {completedCount}/{totalCount}
            </span>
          </div>

          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${effectiveProgress}%` }}
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
            />
          </div>

          <Button variant={ctaVariant} size="sm" fullWidth rightIcon={ctaIcon}>
            {ctaLabel}
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

export default CourseCard;
