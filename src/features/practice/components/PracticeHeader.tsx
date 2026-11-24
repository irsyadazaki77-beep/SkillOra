import React from "react";
import { Zap, Target, BookOpen, RotateCcw, BarChart2, Flame } from "lucide-react";
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
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Pusat Latihan & Bank Soal</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Asah Kemampuan & Kesiapan Rekrutmen
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Pilih mode latihan kilat, telusuri topik spesifik, perbaiki kesalahan di bank evaluasi, atau pantau metrik analitik kesiapan tes Anda.
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/40 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Target className="w-3 h-3 text-indigo-400" /> Target Harian
              </span>
              <div className="text-base font-bold text-white">
                {questionsDoneToday} <span className="text-xs text-slate-400 font-normal">/ {dailyTarget} Soal</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500" 
                  style={{ width: `${dailyProgressPercent}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" /> Akurasi Rata-rata
              </span>
              <div className="text-base font-bold text-amber-400">
                {overallAccuracy}%
              </div>
              <span className="text-xs text-slate-400 block">Riwayat pengerjaan</span>
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <RotateCcw className="w-3 h-3 text-rose-400" /> Bank Salah
              </span>
              <div className="text-base font-bold text-rose-400">
                {wrongCount} Soal
              </div>
              <span className="text-xs text-slate-400 block">Perlu dievaluasi</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto no-scrollbar">
          {[
            { id: "drills" as HubTab, label: "Mode Latihan", icon: Zap },
            { id: "topics" as HubTab, label: "Pilihan Topik & Modul", icon: BookOpen },
            { id: "mistakes" as HubTab, label: `Bank Evaluasi (${wrongCount})`, icon: RotateCcw },
            { id: "analytics" as HubTab, label: "Analitik & Metrik", icon: BarChart2 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeHubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveHubTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-white text-indigo-950 shadow-md scale-100"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : ""}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
