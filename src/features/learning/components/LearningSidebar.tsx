import React from "react";
import { 
  Clock, 
  Sparkles, 
  Users, 
  Target, 
  CheckCircle2, 
  Zap, 
  Award, 
  Layers, 
  Briefcase, 
  ChevronRight 
} from "lucide-react";
import { Profile } from "../../../types";
import { DailyStudyTimerWidget } from "../../../components/DailyStudyTimerWidget";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { ProgressBar } from "../../../components/ui/ProgressBar";

interface LearningSidebarProps {
  profile: Profile;
  showToast?: (msg: string, type?: "success" | "error" | "info") => void;
  claimingQuestId: string | null;
  handleClaimQuest: (questId: string) => void;
  handleGetFlashChallenge?: () => void;
  onNavigateToSertifikasi: () => void;
  onNavigateToSimulasi: () => void;
  onNavigateToKarier: () => void;
  onNavigateToKomunitas: () => void;
}

export function LearningSidebar({
  profile,
  showToast,
  claimingQuestId,
  handleClaimQuest,
  handleGetFlashChallenge,
  onNavigateToSertifikasi,
  onNavigateToSimulasi,
  onNavigateToKarier,
  onNavigateToKomunitas
}: LearningSidebarProps) {
  const weeklyData = [
    { day: "Sen", hours: 1.2 },
    { day: "Sel", hours: 2.0 },
    { day: "Rab", hours: 0.8 },
    { day: "Kam", hours: 1.5 },
    { day: "Jum", hours: 2.5 },
    { day: "Sab", hours: 3.0 },
    { day: "Min", hours: 1.8 }
  ];

  return (
    <div className="space-y-5">
      {/* TIMER WIDGET */}
      <DailyStudyTimerWidget showToast={showToast} />
      
      {/* WEEKLY REPORT & ACTIVITY GRAPH WIDGET */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <span>Laporan Belajar Mingguan</span>
          </h2>
          <Badge variant="success" size="sm">
            +25% Konsistensi
          </Badge>
        </div>

        {/* Visual Bar Graph */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-end justify-between gap-1.5 h-20 px-2 pt-3">
            {weeklyData.map((d, i) => {
              const maxH = 3.0;
              const heightPct = Math.round((d.hours / maxH) * 100);
              const isToday = i === 4; // Jum
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 bg-slate-900 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow-subtle whitespace-nowrap z-20 pointer-events-none">
                    {d.hours} Jam
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-md overflow-hidden flex flex-col justify-end h-full">
                    <div 
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        isToday ? "bg-emerald-600" : "bg-emerald-200 dark:bg-emerald-950 group-hover:bg-emerald-400"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${isToday ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-slate-400"}`}>
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center pt-1">
          <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
            <span className="text-lg font-bold font-display text-emerald-600 dark:text-emerald-400">12.8 Jam</span>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Waktu Minggu Ini</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
            <span className="text-lg font-bold font-display text-emerald-600 dark:text-emerald-400">12 Sub-Bab</span>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Modul Diselesaikan</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
          <p className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Rekomendasi AI Konsistensi:</span>
          </p>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            Kecepatan belajarmu meningkat 25% dibanding minggu lalu. Selesaikan 1 kuis lagi untuk mempertahankan streak {profile.streak || 0} hari!
          </p>
        </div>
      </div>

      {/* STUDY GROUPS WIDGET */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span>Kelompok Belajar Aktif</span>
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToKomunitas}
          >
            Lihat Semua
          </Button>
        </div>

        <div className="space-y-2">
          {[
            { title: "React & Frontend Squad", members: 18, topic: "Hooks & State" },
            { title: "Persiapan TKD BUMN 2026", members: 42, topic: "TPA & Kraepelin" },
            { title: "UI/UX Portfolio Crew", members: 25, topic: "Figma System" }
          ].map((grp, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white">{grp.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{grp.members} Anggota &bull; {grp.topic}</p>
              </div>
              <Button 
                variant="secondary"
                size="sm"
                onClick={onNavigateToKomunitas}
              >
                Gabung
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* TARGET & MISI HARIAN (DAILY QUESTS) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <span>Target & Misi Harian</span>
          </h2>
        </div>

        {/* DAILY QUESTS LIST */}
        {profile.dailyQuests && profile.dailyQuests.length > 0 && (
          <div className="space-y-2.5">
            {profile.dailyQuests.slice(0, 3).map(quest => {
              const isReady = quest.completed && !quest.claimed;
              return (
                <div key={quest.id} className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-900 dark:text-white truncate">{quest.title}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">+{quest.xpReward} XP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <ProgressBar
                        value={Math.min((quest.current / quest.target) * 100, 100)}
                        variant="primary"
                        size="sm"
                      />
                    </div>
                    {quest.claimed ? (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Diklaim
                      </span>
                    ) : isReady ? (
                      <Button
                        variant="accent"
                        size="sm"
                        disabled={claimingQuestId === quest.id}
                        onClick={() => handleClaimQuest(quest.id)}
                      >
                        Klaim
                      </Button>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">
                        {quest.current}/{quest.target}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUICK SHORTCUTS & CAREER READINESS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-3">
        <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>Program Kesiapan Karir</span>
        </h2>

        {handleGetFlashChallenge && (
          <button 
            onClick={handleGetFlashChallenge}
            className="w-full p-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs flex items-center justify-between transition-all shadow-subtle cursor-pointer active:scale-98"
          >
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 fill-white" />
              <span>Tantangan Kilat Harian (+50 XP)</span>
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <button 
          onClick={onNavigateToSertifikasi}
          className="w-full p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-semibold rounded-xl text-xs flex items-center justify-between transition-all border border-slate-200/70 dark:border-slate-800 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Proyek & Sertifikasi Industri</span>
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button 
          onClick={onNavigateToSimulasi}
          className="w-full p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-semibold rounded-xl text-xs flex items-center justify-between transition-all border border-slate-200/70 dark:border-slate-800 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Simulasi Tes TKD BUMN & Wawancara STAR</span>
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button 
          onClick={onNavigateToKarier}
          className="w-full p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-semibold rounded-xl text-xs flex items-center justify-between transition-all border border-slate-200/70 dark:border-slate-800 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Lowongan Mitra Industri</span>
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
