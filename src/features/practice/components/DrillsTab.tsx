import React from "react";
import { Zap, Compass, RotateCcw, Award, Shuffle, ChevronRight } from "lucide-react";
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
  setActiveHubTab,
}: DrillsTabProps) {
  return (
    <div className="space-y-5">
      {/* Session Controls: Difficulty & Shuffle */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Tingkat Kesulitan:
          </span>
          <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            {(["Pemula", "Menengah", "Sulit"] as DifficultyLevel[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  difficulty === d
                    ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsShuffleEnabled((prev) => !prev)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
            isShuffleEnabled
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
              : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          }`}
        >
          <Shuffle className={`w-3.5 h-3.5 ${isShuffleEnabled ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
          <span>Acak Urutan Soal: {isShuffleEnabled ? "Aktif" : "Mati"}</span>
        </button>
      </div>

      {/* Grid of Practice Modes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Mode 1: Quick Quiz */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 rounded-2xl space-y-4 transition-colors flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/70 dark:border-emerald-800/50">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-base font-display font-bold text-zinc-950 dark:text-white">
              Pemanasan 3 Menit
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              5 soal pilihan ganda singkat dari berbagai materi untuk menjaga ketajaman belajar harianmu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => startQuizSession("Pemanasan 3 Menit", "5 Soal Campuran Pilihan Ganda", "quick")}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Mulai Pemanasan</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mode 2: Simulated Exam */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 rounded-2xl space-y-4 transition-colors flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-200/70 dark:border-sky-800/50">
              <Award className="w-5 h-5" />
            </div>
            <h2 className="text-base font-display font-bold text-zinc-950 dark:text-white">
              Simulasi Tes Kerja
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              10 soal dengan pengatur waktu untuk melatih ketenangan dan kecepatanmu menghadapi seleksi kerja.
            </p>
          </div>
          <button
            type="button"
            onClick={() => startQuizSession("Simulasi Tes Kerja", "10 Soal Berbatas Waktu", "simulation")}
            className="w-full py-2.5 px-4 bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Mulai Simulasi</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mode 3: Mistakes Bank */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-rose-400/60 rounded-2xl space-y-4 transition-colors flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200/70 dark:border-rose-800/50">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h2 className="text-base font-display font-bold text-zinc-950 dark:text-white">
              Ulangi Soal yang Salah
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Kerjakan kembali pertanyaan yang sebelumnya masih keliru agar kamu benar-benar paham alasannya.
            </p>
          </div>
          <button
            type="button"
            onClick={() => startQuizSession("Ulangi Soal yang Salah", "Latih kembali materi yang sebelumnya keliru", "wrong")}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Latih Ulang Sekarang</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mode 4: Topic Based */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 rounded-2xl space-y-4 transition-colors flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/70 dark:border-amber-800/50">
              <Compass className="w-5 h-5" />
            </div>
            <h2 className="text-base font-display font-bold text-zinc-950 dark:text-white">
              Latihan per Materi Kursus
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Pilih latihan sesuai topik kursus yang sedang kamu pelajari (Web, Backend, SQL, Data, hingga BUMN).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveHubTab("topics")}
            className="w-full py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Pilih Materi</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
