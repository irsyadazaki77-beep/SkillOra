import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Course, Profile } from "../../../types";

interface BelajarMetricsStripProps {
  activeCourses: Course[];
  primaryActiveCourse?: Course;
  skillGapPercentage: number;
  targetRole: string;
  completedCoursesCount: number;
  certifiedCoursesCount: number;
  profile: Profile;
  onNavigateToKatalog: () => void;
  onOpenCalculator: () => void;
  onNavigateToSertifikasi: () => void;
  onNavigateToAnalitik: () => void;
}

export function BelajarMetricsStrip({
  activeCourses,
  primaryActiveCourse,
  completedCoursesCount,
  certifiedCoursesCount,
  profile,
  onNavigateToKatalog,
  onNavigateToSertifikasi,
  onNavigateToAnalitik,
}: BelajarMetricsStripProps) {
  const metrics = [
    {
      label: "Kursus aktif",
      value: `${activeCourses.length}`,
      unit: "modul",
      detail: primaryActiveCourse ? primaryActiveCourse.title : "Belum ada kursus aktif",
      onClick: onNavigateToKatalog,
    },
    {
      label: "Konsistensi",
      value: `${profile.streak || 0}`,
      unit: "hari",
      detail: `Target ${profile.weeklyTargetDays ?? 5} hari/minggu`,
      onClick: onNavigateToAnalitik,
    },
    {
      label: "Progres level",
      value: `Lv.${profile.level || 1}`,
      unit: "",
      detail: `${(profile.xp || 0).toLocaleString("id-ID")} XP terkumpul`,
      onClick: onNavigateToAnalitik,
    },
    {
      label: "Sertifikasi",
      value: `${certifiedCoursesCount}`,
      unit: "terbit",
      detail: `${completedCoursesCount} kursus diselesaikan`,
      onClick: onNavigateToSertifikasi,
    },
  ];

  return (
    <section
      aria-label="Ringkasan Statistik Pembelajaran"
      className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x divide-zinc-200/80 dark:divide-zinc-800/80">
        {metrics.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className="group text-left p-4 sm:p-5 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/60 transition-colors cursor-pointer flex flex-col justify-between min-w-0"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {item.label}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0" />
            </div>
            <div className="mt-2.5 flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 tabular-nums">
                {item.value}
              </span>
              {item.unit && (
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {item.unit}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-1">
              {item.detail}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
