import React from "react";
import {
  Clock,
  Target,
  CheckCircle2,
  Zap,
  Award,
  Briefcase,
  ChevronRight,
  Flame,
  BrainCircuit,
} from "lucide-react";
import { Course, Profile } from "../../../types";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
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
}

export function DashboardSidebar({
  profile,
  courses = [],
  claimingQuestId,
  handleClaimQuest,
  onNavigateToSertifikasi,
  onNavigateToSimulasi,
  onNavigateToKarier,
}: DashboardSidebarProps) {
  const streakDays = Math.max(0, profile.streak || 0);
  const weeklyTarget = Math.max(1, profile.weeklyTargetDays || 5);
  const weeklyXp = profile.weeklyXp || 0;
  const activeDaySlots = Math.min(7, streakDays);

  const completedLessonsCount = courses.reduce(
    (sum, course) => sum + (course.lessons?.filter((l) => l.completed).length || 0),
    0
  );

  // Determine today's Monday-first index (0=Sen ... 6=Min) using Asia/Jakarta timezone
  const dayNames = ["S", "S", "R", "K", "J", "S", "M"];
  const jakartaWeekdayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
  }).format(new Date());
  const weekdayMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const todayIdx = weekdayMap[jakartaWeekdayStr] ?? 0;

  const weeklyBars = dayNames.map((label, idx) => {
    const daysAgo = (todayIdx - idx + 7) % 7;
    const isActiveDay = activeDaySlots > 0 && daysAgo < activeDaySlots;
    const isToday = idx === todayIdx;
    return {
      day: label,
      isToday,
      isActive: isActiveDay,
      heightPct: isActiveDay ? (isToday ? 100 : 78) : 14,
    };
  });

  // Real activity feed aggregated from actual user records
  const recentActivities: Array<{ id: string; title: string; subtitle: string; type: "cert" | "quiz" }> = [];
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
    <aside className="space-y-4 lg:sticky lg:top-4" aria-label="Sidebar Progres & Aktivitas">
      {/* 1. REAL WEEKLY CONSISTENCY SUMMARY */}
      <Card variant="default" padding="sm" className="space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-display font-bold text-sm text-zinc-950 dark:text-white">
              Konsistensi Minggu Ini
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {weeklyXp} XP
          </span>
        </div>

        {/* 7-Day Real Activity Indicator Bars */}
        <div className="pt-1">
          <div className="flex items-end justify-between gap-1.5 h-16 px-1">
            {weeklyBars.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-t-sm overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className={`w-full rounded-t-sm transition-all duration-300 ${
                      d.isActive
                        ? d.isToday
                          ? "bg-emerald-600 dark:bg-emerald-500"
                          : "bg-emerald-400/80 dark:bg-emerald-600/80"
                        : "bg-zinc-200 dark:bg-zinc-700/70"
                    }`}
                    style={{ height: `${d.heightPct}%` }}
                    title={d.isActive ? "Hari aktif belajar" : "Belum aktif"}
                  />
                </div>
                <span className={`text-xs ${d.isToday ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-zinc-400"}`}>
                  {d.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-medium truncate">
            <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              Streak {streakDays}h / target {weeklyTarget}h
            </span>
          </span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0 tabular-nums">
            {completedLessonsCount} modul
          </span>
        </div>
      </Card>

      {/* 2. TARGET & MISI HARIAN (DAILY QUESTS) */}
      {topDailyQuests.length > 0 && (
        <Card variant="default" padding="sm" className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Target className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-display font-bold text-sm text-zinc-950 dark:text-white">
                Misi Harian
              </h3>
            </div>
            <Badge variant="warning" size="sm">
              +{topDailyQuests.reduce((acc, q) => acc + q.xpReward, 0)} XP
            </Badge>
          </div>

          <div className="space-y-2">
            {topDailyQuests.map((quest) => {
              const isReady = quest.completed && !quest.claimed;
              const progress = Math.min((quest.current / Math.max(1, quest.target)) * 100, 100);

              return (
                <div
                  key={quest.id}
                  className="p-2.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200/60 dark:border-zinc-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-800 dark:text-zinc-200 truncate">{quest.title}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">+{quest.xpReward} XP</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <ProgressBar value={progress} variant="primary" size="xs" />
                    </div>
                    {quest.claimed ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Diklaim
                      </span>
                    ) : isReady ? (
                      <Button
                        variant="accent"
                        size="sm"
                        disabled={claimingQuestId === quest.id}
                        onClick={() => handleClaimQuest(quest.id)}
                        className="py-0.5 px-2 text-xs h-6"
                      >
                        Klaim
                      </Button>
                    ) : (
                      <span className="text-xs font-medium text-zinc-400 shrink-0 tabular-nums">
                        {quest.current}/{quest.target}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 3. REAL RECENT ACTIVITY */}
      <Card variant="default" padding="sm" className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Aktivitas Terakhir
          </h3>
          <span className="text-xs text-zinc-400 font-mono">{recentActivities.length} entri</span>
        </div>

        {recentActivities.length > 0 ? (
          <div className="space-y-2.5 text-xs">
            {recentActivities.map((item) => (
              <div key={item.id} className="flex items-start gap-2.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    item.type === "cert"
                      ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
                      : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {item.type === "cert" ? <Award className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{item.title}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed py-1">
            Belum ada riwayat kuis atau sertifikat. Selesaikan modul pertamamu hari ini.
          </p>
        )}
      </Card>

      {/* 4. QUICK CAREER ECOSYSTEM SHORTCUTS */}
      <Card variant="default" padding="sm" className="space-y-2">
        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-1">
          Layanan &amp; Persiapan Karier
        </h3>

        <div className="space-y-1">
          <button
            type="button"
            onClick={onNavigateToSertifikasi}
            className="w-full p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center justify-between transition-colors text-left cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Sertifikasi &amp; Proyek Praktik</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={onNavigateToSimulasi}
            className="w-full p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center justify-between transition-colors text-left cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Simulasi Wawancara &amp; TKD</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={onNavigateToKarier}
            className="w-full p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-200 text-xs font-semibold flex items-center justify-between transition-colors text-left cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Lowongan Mitra Industri</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </Card>
    </aside>
  );
}
