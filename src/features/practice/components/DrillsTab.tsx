import React from "react";
import { Zap, Compass, RotateCcw, Award, Shuffle, Sparkles, ChevronRight, CheckCircle2 } from "lucide-react";
import { DifficultyLevel, HubTab, ModeLatihan } from "../types";

interface DrillsTabProps {
  difficulty: DifficultyLevel;
  setDifficulty: (d: DifficultyLevel) => void;
  isShuffleEnabled: boolean;
  setIsShuffleEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
  startQuizSession: (title: string, subtitle: string, mode: ModeLatihan, courseId?: string, lessonId?: string) => void;
  allAvailableQuestions: { question: any; courseTitle: string; lessonTitle: string }[];
  allWrongQuestions: { question: any; courseTitle: string; lessonTitle: string }[];
  setActiveHubTab: (tab: HubTab) => void;
}

export function DrillsTab({
  difficulty,
  setDifficulty,
  isShuffleEnabled,
  setIsShuffleEnabled,
  startQuizSession,
  allAvailableQuestions,
  allWrongQuestions,
  setActiveHubTab
}: DrillsTabProps) {
  return (
    <div className="space-y-6">
      {/* Session Controls: Difficulty & Shuffle */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tingkat Kesulitan:
          </span>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(["Pemula", "Menengah", "Sulit"] as DifficultyLevel[]).map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  difficulty === d
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsShuffleEnabled(prev => !prev)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isShuffleEnabled
                ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <Shuffle className={`w-3.5 h-3.5 ${isShuffleEnabled ? "text-indigo-600" : ""}`} />
            <span>Acak Urutan Soal: {isShuffleEnabled ? "Aktif" : "Mati"}</span>
          </button>
        </div>
      </div>

      {/* Grid of Practice Modes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Mode 1: Quick Quiz */}
        <div className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-3xl space-y-4 hover:shadow-lg transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Latihan Cepat Kilat
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              5 soal pilihan ganda acak dari berbagai modul untuk pemanasan harian berdurasi 3 menit.
            </p>
          </div>
          <button
            onClick={() => {
              startQuizSession("Latihan Cepat Kilat ⚡", "5 Soal Campuran Pilihan Ganda", "quick");
            }}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Mulai Pemanasan</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mode 2: Simulated Exam */}
        <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-800/40 rounded-3xl space-y-4 hover:shadow-lg transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Award className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Simulasi Ujian Kerja
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Mode tantangan intensif dengan batas waktu ketat & 10 soal untuk menguji kesiapan seleksi kerja.
            </p>
          </div>
          <button
            onClick={() => {
              startQuizSession("Simulasi Ujian Kerja 🎯", "10 Soal Berbatas Waktu Ketat", "simulation");
            }}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Uji Ketahanan</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mode 3: Mistakes Bank */}
        <div className="p-6 bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/30 dark:to-amber-950/20 border border-rose-200 dark:border-rose-800/40 rounded-3xl space-y-4 hover:shadow-lg transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Bank Evaluasi Salah
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Latih ulang soal-soal yang pernah Anda jawab keliru agar konsepnya benar-benar dipahami.
            </p>
          </div>
          <button
            onClick={() => {
              startQuizSession("Bank Evaluasi Jawaban Salah 🔄", "Latih ulang pemahaman konsep yang keliru", "wrong");
            }}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Latih Bank Soal Salah</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mode 4: Topic Based */}
        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800/40 rounded-3xl space-y-4 hover:shadow-lg transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-600/20">
              <Compass className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Pilihan Per Modul
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Pilih dari katalog ratusan latihan soal spesifik (React, TypeScript, SQL, TKD BUMN, dll).
            </p>
          </div>
          <button
            onClick={() => setActiveHubTab("topics")}
            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Buka Katalog Topik</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
