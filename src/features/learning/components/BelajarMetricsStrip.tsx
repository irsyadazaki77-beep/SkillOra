import React from "react";
import { BookOpen, Flame, Zap, Award } from "lucide-react";
import { Course, Profile } from "../../../types";
import { Card } from "../../../components/ui/Card";

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
  skillGapPercentage,
  targetRole,
  completedCoursesCount,
  certifiedCoursesCount,
  profile,
  onNavigateToKatalog,
  onOpenCalculator,
  onNavigateToSertifikasi,
  onNavigateToAnalitik
}: BelajarMetricsStripProps) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Ringkasan Statistik Pembelajaran">
      {/* Metric 1: Modul Aktif */}
      <Card
        variant="interactive"
        padding="sm"
        onClick={onNavigateToKatalog}
        className="group flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold">Kursus Aktif</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="pt-2">
          <div className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white">
            {activeCourses.length} Kursus
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
            {primaryActiveCourse ? primaryActiveCourse.title : "Mulai kursus pertamamu"}
          </p>
        </div>
      </Card>

      {/* Metric 2: Streak & Konsistensi */}
      <Card
        variant="interactive"
        padding="sm"
        onClick={onNavigateToAnalitik}
        className="group flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold">Streak Belajar</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Flame className="w-3.5 h-3.5 fill-amber-500" />
          </div>
        </div>
        <div className="pt-2">
          <div className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white">
            {profile.streak || 0} Hari
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
            Konsistensi aktif harian
          </p>
        </div>
      </Card>

      {/* Metric 3: Total XP & Level */}
      <Card
        variant="interactive"
        padding="sm"
        onClick={onNavigateToAnalitik}
        className="group flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold">Level & XP</span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 fill-blue-500" />
          </div>
        </div>
        <div className="pt-2">
          <div className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white">
            Level {profile.level || 1}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
            {profile.xp || 0} XP terkumpul
          </p>
        </div>
      </Card>

      {/* Metric 4: Sertifikasi Industri */}
      <Card
        variant="interactive"
        padding="sm"
        onClick={onNavigateToSertifikasi}
        className="group flex flex-col justify-between"
      >
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span className="text-xs font-semibold">Sertifikasi</span>
          <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Award className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="pt-2">
          <div className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white">
            {certifiedCoursesCount} Diterbitkan
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-medium">
            {completedCoursesCount} Kursus Diselesaikan
          </p>
        </div>
      </Card>
    </section>
  );
}
