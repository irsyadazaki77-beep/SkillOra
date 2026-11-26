import React from "react";
import { Zap, Target, BookOpen, RotateCcw, BarChart2, Flame, Layers, Crosshair } from "lucide-react";
import { HubTab } from "../types";

interface PracticeHeaderProps {
  activeHubTab: HubTab;
  setActiveHubTab: (tab: HubTab) => void;
  questionsDoneToday: number;
  dailyTarget: number;
  dailyProgressPercent: number;
  overallAccuracy: number;
  wrongCount: number;
}

export function PracticeHeader({
  activeHubTab,
  setActiveHubTab,
  questionsDoneToday,
  dailyTarget,
  dailyProgressPercent,
  overallAccuracy,
  wrongCount,
}: PracticeHeaderProps) {
  const tabs: { id: HubTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "drills", label: "Mode Latihan", icon: Zap },
    { id: "adaptive", label: "Latihan Bertingkat", icon: Crosshair },
    { id: "flashcards", label: "Kartu Hafalan", icon: Layers },
    { id: "topics", label: "Per Materi Kursus", icon: BookOpen },
    { id: "mistakes", label: `Soal Salah Saya (${wrongCount})`, icon: RotateCcw },
    { id: "analytics", label: "Statistik", icon: BarChart2 },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-white dark:bg-zinc-900 p-5 sm:p-6 border border-zinc-200 dark:border-zinc-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <p className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
              Pusat Latihan Gratis · Bank Soal &amp; Kartu Hafalan
            </p>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-zinc-950 dark:text-white">
              Latihan Soal &amp; Evaluasi Pemahaman
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Asah pemahamanmu lewat pemanasan cepat, simulasi tes kerja, kartu hafalan pengingat konsep, atau ulangi soal yang sebelumnya masih keliru.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-zinc-50 dark:bg-zinc-950/60 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0">
            <div className="space-y-1 min-w-[96px]">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                <Target className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Harian
              </span>
              <div className="text-base font-bold font-mono tabular-nums text-zinc-950 dark:text-white">
                {questionsDoneToday}/{dailyTarget}
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                  style={{ width: `${dailyProgressPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-1 min-w-[84px]">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500" /> Akurasi
              </span>
              <div className="text-base font-bold font-mono tabular-nums text-zinc-950 dark:text-white">
                {overallAccuracy}%
              </div>
              <span className="text-[11px] text-zinc-500 block">Rata-rata</span>
            </div>

            <div className="space-y-1 min-w-[84px]">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium flex items-center gap-1">
                <RotateCcw className="w-3 h-3 text-rose-500" /> Evaluasi
              </span>
              <div className="text-base font-bold font-mono tabular-nums text-zinc-950 dark:text-white">
                {wrongCount}
              </div>
              <span className="text-[11px] text-zinc-500 block">Soal salah</span>
            </div>
          </div>
        </div>

        {/* Clean Single-Line Tabs */}
        <div className="flex items-center gap-1.5 pt-4 border-t border-zinc-200 dark:border-zinc-800 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeHubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveHubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
