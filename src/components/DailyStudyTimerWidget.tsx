import { useState, useEffect } from "react";
import { Clock, Play, Pause, RotateCcw, Target, Sparkles, CheckCircle2, Award } from "lucide-react";
import { playSound } from "../utils/sound";
import { storage } from "../utils/storage";

interface DailyStudyTimerWidgetProps {
  onAddXp?: (amount: number) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function DailyStudyTimerWidget({ onAddXp, showToast }: DailyStudyTimerWidgetProps) {
  const [targetMinutes, setTargetMinutes] = useState<number>(() => storage.get("daily_target_mins", 15));
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() => storage.get("today_study_seconds", 0));
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isCompletedToday, setIsCompletedToday] = useState<boolean>(() => storage.get("target_claimed_today", false));

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          storage.set("today_study_seconds", next);
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const progressPercent = Math.min(Math.round((elapsedMinutes / targetMinutes) * 100), 100);

  // Auto-claim bonus when target reached
  useEffect(() => {
    if (elapsedMinutes >= targetMinutes && !isCompletedToday && targetMinutes > 0) {
      setIsCompletedToday(true);
      storage.set("target_claimed_today", true);
      playSound("levelUp");
      if (onAddXp) onAddXp(25);
      if (showToast) showToast(`🎉 Selamat! Target belajar ${targetMinutes} menit tercapai! (+25 XP)`, "success");
    }
  }, [elapsedMinutes, targetMinutes, isCompletedToday, onAddXp, showToast]);

  const handleToggleTimer = () => {
    playSound("click");
    setIsRunning(!isRunning);
  };

  const handleResetTimer = () => {
    playSound("click");
    setIsRunning(false);
    setElapsedSeconds(0);
    storage.set("today_study_seconds", 0);
  };

  const handleSelectTarget = (mins: number) => {
    playSound("click");
    setTargetMinutes(mins);
    storage.set("daily_target_mins", mins);
    if (elapsedMinutes < mins) {
      setIsCompletedToday(false);
      storage.set("target_claimed_today", false);
    }
  };

  const formatTime = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-3">
        <div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Target Belajar Harian
          </span>
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            <span>Pengingat & Stopwatch Fokus</span>
          </h3>
        </div>

        {isCompletedToday ? (
          <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Target Tercapai
          </span>
        ) : (
          <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg">
            {elapsedMinutes} / {targetMinutes} Mins
          </span>
        )}
      </div>

      {/* Target Selector Buttons */}
      <div className="flex items-center gap-2 text-xs font-bold">
        <span className="text-slate-500 dark:text-slate-400 text-xs">Set Target:</span>
        {[15, 30, 45, 60].map((mins) => (
          <button
            key={mins}
            onClick={() => handleSelectTarget(mins)}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              targetMinutes === mins
                ? "bg-emerald-600 text-white shadow-2xs font-bold"
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            {mins}m
          </button>
        ))}
      </div>

      {/* Timer Controls & Display */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-lg shadow-2xs border border-emerald-200/50">
            {formatTime(elapsedSeconds)}
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">
              {isRunning ? "Stopwatch Sedang Berjalan..." : "Stopwatch Diberhentikan"}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Selesai target untuk klaim +25 XP bonus harian.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleToggleTimer}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              isRunning
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? "Pause" : "Mulai Belajar"}</span>
          </button>

          <button aria-label="Aksi RotateCcw"
            onClick={handleResetTimer}
            className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all cursor-pointer"
            title="Reset Stopwatch"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>Progres Target Waktu</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
