import React from "react";
import { CheckCircle2, Award, Briefcase, ChevronRight, BrainCircuit } from "lucide-react";
import { Course, Profile } from "../../../types";
import { Button } from "../../../components/ui/Button";
import { ProgressBar } from "../../../components/ui/ProgressBar";

interface DashboardSidebarProps {
  profile: Profile;
  courses?: Course[];
  claimingQuestId: string | null;
  handleClaimQuest: (questId: string) => void;
  handleGetFlashChallenge?: () => void;
  onNavigateToSertifikasi: () => void;
  onNavigateToSimulasi: () => void;
  onNavigateToKarier: () => void;
  onNavigateToKomunitas: () => void;
  weeklyTarget?: number;
  savingWeeklyGoal?: boolean;
  onSetWeeklyTarget?: (days: number) => void;
}

export function DashboardSidebar({
  profile,
  courses = [],
  claimingQuestId,
  handleClaimQuest,
  onNavigateToSertifikasi,
  onNavigateToSimulasi,
  onNavigateToKarier,
  weeklyTarget: propWeeklyTarget,
  savingWeeklyGoal = false,
  onSetWeeklyTarget,
}: DashboardSidebarProps) {
  const streakDays = Math.max(0, profile.streak || 0);
  const weeklyTarget = Math.max(1, propWeeklyTarget ?? profile.weeklyTargetDays ?? 5);
  const weeklyXp = profile.weeklyXp || 0;
  const activeDaySlots = Math.min(7, streakDays);

  const completedLessonsCount = courses.reduce(
    (sum, course) => sum + (course.lessons?.filter((l) => l.completed).length || 0),
    0
  );

  const dayNames = ["S", "S", "R", "K", "J", "S", "M"];
  const jakartaWeekdayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
  }).format(new Date());
  const weekdayMap: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const todayIdx = weekdayMap[jakartaWeekdayStr] ?? 0;

  const weeklyBars = dayNames.map((label, idx) => {
    const daysAgo = (todayIdx - idx + 7) % 7;
    const isActiveDay = activeDaySlots > 0 && daysAgo < activeDaySlots;
    const isToday = idx === todayIdx;
    return {
      day: label,
      isToday,
      isActive: isActiveDay,
      heightPct: isActiveDay ? (isToday ? 100 : 76) : 14,
    };
  });

  const recentActivities: Array<{
    id: string;
    title: string;
    subtitle: string;
    type: "cert" | "quiz";
  }> = [];
  if (Array.isArray(profile.certificates)) {
    for (const cert of profile.certificates.slice(0, 2)) {
      recentActivities.push({
        id: `cert-${cert.id}`,
        title: `Sertifikat: ${cert.courseTitle}`,
        subtitle: `${cert.issueDate || "Terverifikasi"} · Skor ${cert.score ?? 100}`,
        type: "cert",
      });
    }
  }
  if (Array.isArray(profile.quizAttempts)) {
    for (const attempt of profile.quizAttempts.slice(0, 3)) {
      if (recentActivities.length >= 3) break;
      recentActivities.push({
        id: `quiz-${attempt.id}`,
        title: attempt.lessonTitle || attempt.courseTitle || "Latihan Kuis",
        subtitle: `${attempt.completedAt || "Selesai"} · Nilai ${attempt.percentage}%`,
        type: "quiz",
      });
    }
  }

  const topDailyQuests = (profile.dailyQuests || []).slice(0, 2);

  return (
    <aside
      className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl divide-y divide-zinc-200/80 dark:divide-zinc-800/80 lg:sticky lg:top-4"
      aria-label="Ringkasan Progres dan Aktivitas"
    >
      {/* 1. Weekly Consistency + Inline Target Selector */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="font-display font-semibold text-sm text-zinc-950 dark:text-zinc-50">
              Konsistensi mingguan
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums mt-0.5">
              Streak {streakDays} hari · {completedLessonsCount} bab selesai
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {weeklyXp} XP
          </span>
        </div>

        {/* 7-Day Minimalist Bar Strip */}
        <div className="flex items-end justify-between gap-2 h-14 px-0.5">
          {weeklyBars.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="w-full bg-zinc-100 dark:bg-zinc-800/80 rounded-sm overflow-hidden flex flex-col justify-end h-full">
                <div
                  className={`w-full rounded-sm transition-all duration-300 ${
                    d.isActive
                      ? d.isToday
                        ? "bg-emerald-600 dark:bg-emerald-500"
                        : "bg-emerald-500/60 dark:bg-emerald-600/70"
                      : "bg-zinc-200/80 dark:bg-zinc-700/60"
                  }`}
                  style={{ height: `${d.heightPct}%` }}
                  title={d.isActive ? "Hari aktif belajar" : "Belum aktif"}
                />
              </div>
              <span
                className={`text-[11px] font-mono ${
                  d.isToday
                    ? "font-semibold text-emerald-700 dark:text-emerald-400"
                    : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {d.day}
              </span>
            </div>
          ))}
        </div>

        {/* Inline Target Switcher (Consolidates former separate Weekly Goal Card) */}
        {onSetWeeklyTarget && (
          <div className="pt-1 flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Target · Saver: {profile.streakFreezes || 0}
            </span>
            <div className="inline-flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-900 rounded-md border border-zinc-200/70 dark:border-zinc-800">
              {[3, 5, 7].map((days) => (
                <button
                  key={days}
                  type="button"
                  disabled={savingWeeklyGoal}
                  onClick={() => onSetWeeklyTarget(days)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium tabular-nums transition-colors cursor-pointer ${
                    weeklyTarget === days
                      ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white font-semibold shadow-2xs"
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                  }`}
                >
                  {days}h
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Daily Quests */}
      {topDailyQuests.length > 0 && (
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-sm text-zinc-950 dark:text-zinc-50">
              Misi harian
            </h3>
            <span className="text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
              +{topDailyQuests.reduce((acc, q) => acc + q.xpReward, 0)} XP
            </span>
          </div>

          <div className="space-y-3">
            {topDailyQuests.map((quest) => {
              const isReady = quest.completed && !quest.claimed;
              const progress = Math.min((quest.current / Math.max(1, quest.target)) * 100, 100);

              return (
                <div key={quest.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">
                      {quest.title}
                    </span>
                    <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 shrink-0 tabular-nums">
                      +{quest.xpReward} XP
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex-1">
                      <ProgressBar value={progress} variant="primary" size="xs" />
                    </div>
                    {quest.claimed ? (
                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Selesai
                      </span>
                    ) : isReady ? (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={claimingQuestId === quest.id}
                        onClick={() => handleClaimQuest(quest.id)}
                        className="h-6 px-2 text-[11px]"
                      >
                        Klaim
                      </Button>
                    ) : (
                      <span className="text-[11px] font-mono text-zinc-400 shrink-0 tabular-nums">
                        {quest.current}/{quest.target}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Recent Activity */}
      <div className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-sm text-zinc-950 dark:text-zinc-50">
            Aktivitas terakhir
          </h3>
          <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
            {recentActivities.length}
          </span>
        </div>

        {recentActivities.length > 0 ? (
          <div className="space-y-2.5">
            {recentActivities.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 tabular-nums">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Belum ada riwayat kuis atau sertifikat. Selesaikan materi pertama Anda hari ini.
          </p>
        )}
      </div>

      {/* 4. Quick Career Links */}
      <div className="p-3">
        <div className="space-y-0.5">
          {[
            { label: "Sertifikasi & Proyek", icon: Award, onClick: onNavigateToSertifikasi },
            { label: "Simulasi Wawancara & TKD", icon: BrainCircuit, onClick: onNavigateToSimulasi },
            { label: "Lowongan Mitra Industri", icon: Briefcase, onClick: onNavigateToKarier },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <button
                key={link.label}
                type="button"
                onClick={link.onClick}
                className="w-full px-2.5 py-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-medium flex items-center justify-between transition-colors text-left cursor-pointer group"
              >
                <span className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                  <span>{link.label}</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
