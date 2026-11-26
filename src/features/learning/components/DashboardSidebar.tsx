import React from "react";
import { 
  Clock, 
  Target, 
  CheckCircle2, 
  Zap, 
  Award, 
  Briefcase, 
  ChevronRight,
  TrendingUp,
  BrainCircuit
} from "lucide-react";
import { Profile } from "../../../types";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { ProgressBar } from "../../../components/ui/ProgressBar";

interface DashboardSidebarProps {
  profile: Profile;
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
  claimingQuestId,
  handleClaimQuest,
  handleGetFlashChallenge,
  onNavigateToSertifikasi,
  onNavigateToSimulasi,
  onNavigateToKarier,
  onNavigateToKomunitas
}: DashboardSidebarProps) {
  // Weekly 7-day study activity representation
  const weeklyDays = [
    { day: "S", hours: 1.2, isToday: false },
    { day: "S", hours: 2.0, isToday: false },
    { day: "R", hours: 0.8, isToday: false },
    { day: "K", hours: 1.5, isToday: false },
    { day: "J", hours: 2.5, isToday: true },
    { day: "S", hours: 3.0, isToday: false },
    { day: "M", hours: 1.8, isToday: false }
  ];

  const maxHours = 3.0;
  const topDailyQuests = (profile.dailyQuests || []).slice(0, 2);

  return (
    <aside className="space-y-4 lg:sticky lg:top-4" aria-label="Sidebar Progres & Aktivitas">
      {/* 1. WEEKLY ACTIVITY SUMMARY */}
      <Card variant="default" padding="sm" className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
              Aktivitas 7 Hari Terakhir
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
            12.8 Jam
          </span>
        </div>

        {/* Clean 7-day mini bar chart */}
        <div className="pt-1">
          <div className="flex items-end justify-between gap-1.5 h-16 px-1">
            {weeklyDays.map((d, i) => {
              const heightPct = Math.round((d.hours / maxHours) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-sm overflow-hidden flex flex-col justify-end h-full">
                    <div 
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        d.isToday ? "bg-emerald-600 dark:bg-emerald-500" : "bg-slate-300 dark:bg-slate-700 group-hover:bg-emerald-400"
                      }`}
                      style={{ height: `${heightPct}%` }}
                      title={`${d.hours} jam`}
                    />
                  </div>
                  <span className={`text-xs ${d.isToday ? "font-bold text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>Konsistensi mingguan meningkat</span>
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">+25%</span>
        </div>
      </Card>

      {/* 2. TARGET & MISI HARIAN (DAILY QUESTS) */}
      {topDailyQuests.length > 0 && (
        <Card variant="default" padding="sm" className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Target className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                Misi Harian
              </h3>
            </div>
            <Badge variant="warning" size="sm">
              +{topDailyQuests.reduce((acc, q) => acc + q.xpReward, 0)} XP
            </Badge>
          </div>

          <div className="space-y-2">
            {topDailyQuests.map(quest => {
              const isReady = quest.completed && !quest.claimed;
              const progress = Math.min((quest.current / quest.target) * 100, 100);

              return (
                <div 
                  key={quest.id} 
                  className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200/60 dark:border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800 dark:text-slate-200 truncate">{quest.title}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">+{quest.xpReward} XP</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <ProgressBar
                        value={progress}
                        variant="primary"
                        size="xs"
                      />
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
                      <span className="text-xs font-medium text-slate-400 shrink-0">
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

      {/* 3. RECENT ACTIVITY OR RECENT ACHIEVEMENT */}
      <Card variant="default" padding="sm" className="space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Aktivitas Terakhir
          </h3>
          <span className="text-xs text-slate-400">Hari ini</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                Menyelesaikan Modul Pengantar
              </p>
              <p className="text-xs text-slate-400">2 jam yang lalu &bull; +20 XP</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <Zap className="w-3 h-3 fill-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                Streak 7 Hari Tercapai
              </p>
              <p className="text-xs text-slate-400">Kemarin &bull; Konsistensi Terjaga</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 4. QUICK CAREER ECOSYSTEM SHORTCUTS */}
      <Card variant="default" padding="sm" className="space-y-2">
        <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          Layanan & Persiapan Karir
        </h3>

        <div className="space-y-1">
          <button 
            onClick={onNavigateToSertifikasi}
            className="w-full p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors text-left cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Sertifikasi & Proyek Praktik</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button 
            onClick={onNavigateToSimulasi}
            className="w-full p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors text-left cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Simulasi Wawancara & TKD</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button 
            onClick={onNavigateToKarier}
            className="w-full p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors text-left cursor-pointer group"
          >
            <span className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Lowongan Mitra Industri</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </Card>
    </aside>
  );
}
