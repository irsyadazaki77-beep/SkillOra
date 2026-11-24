import React, { useState } from "react";
import {
  Award,
  Zap,
  RotateCcw,
  Share2,
  CheckCircle2,
  XCircle,
  Flag,
  Clock,
  Sparkles,
  ChevronDown,
  Gem,
  ArrowRight
} from "lucide-react";
import { QuizSubmissionResult, UserAnswerHistoryItem } from "../types";
import { RenderFormattedQuestion } from "../utils/formatQuestion";

interface QuizResultModalProps {
  result: QuizSubmissionResult;
  flaggedQuestions?: Record<number, boolean>;
  handleRetryWrongQuestions: (wrongHistory: UserAnswerHistoryItem[]) => void;
  startQuizSession: (title: string, subtitle: string, mode: any, courseId?: string, lessonId?: string) => void;
  exitQuiz: () => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function QuizResultModal({
  result,
  flaggedQuestions = {},
  handleRetryWrongQuestions,
  startQuizSession,
  exitQuiz,
  showToast
}: QuizResultModalProps) {
  const [filterTab, setFilterTab] = useState<"all" | "wrong" | "correct" | "flagged">("all");

  const {
    score,
    passed,
    correctCount,
    wrongCount,
    unansweredCount,
    totalQuestions,
    earnedXp,
    earnedGems,
    timeSpentSeconds,
    answersHistory
  } = result;

  const wrongAnswers = answersHistory.filter(h => !h.isCorrect);

  const filteredHistory = answersHistory.filter(item => {
    if (filterTab === "wrong") return !item.isCorrect;
    if (filterTab === "correct") return item.isCorrect;
    if (filterTab === "flagged") return Boolean(flaggedQuestions[item.questionIndex]);
    return true;
  });

  const handleShare = () => {
    const text = `Saya berhasil meraih skor ${score}% (+${earnedXp} XP & +${earnedGems} Gems) pada evaluasi latihan di Skillora! 🚀`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (showToast) showToast("Teks pencapaian disalin ke clipboard!", "success");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Hero Score Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden text-center space-y-6">
        <div className="space-y-2 max-w-md mx-auto">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-lg text-2xl ${
            passed
              ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20"
              : "bg-gradient-to-br from-amber-500 to-rose-600 text-white shadow-amber-500/20"
          }`}>
            {passed ? "🏆" : "💡"}
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {passed ? "Kuis Berhasil Diselesaikan!" : "Tetap Semangat & Latih Ulang!"}
          </h2>
          <p className="text-xs text-slate-500">
            {passed
              ? "Kompetensi berhasil terverifikasi dengan hasil memuaskan."
              : "Tinjau pembahasan konsep di bawah ini untuk memperkuat pemahaman Anda."}
          </p>
        </div>

        {/* Score & Rewards Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Skor Akhir</span>
            <span className={`text-2xl font-black ${passed ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
              {score}%
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Reward XP & Gems</span>
            <div className="flex items-center justify-center gap-2 mt-0.5">
              <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                <Zap className="w-4 h-4" /> +{earnedXp}
              </span>
              <span className="text-base font-extrabold text-amber-500 flex items-center gap-0.5">
                <Gem className="w-3.5 h-3.5" /> +{earnedGems}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Akurasi Soal</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {correctCount} <span className="text-xs text-slate-400 font-normal">/ {totalQuestions}</span>
            </span>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-semibold block">Waktu Selesai</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-indigo-500" /> {timeSpentSeconds}s
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {wrongAnswers.length > 0 && (
            <button
              onClick={() => handleRetryWrongQuestions(wrongAnswers)}
              className="py-3 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Latih Ulang {wrongAnswers.length} Soal Salah</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan</span>
          </button>

          <button
            onClick={exitQuiz}
            className="py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>Kembali ke Beranda</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detailed Evaluation Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Review & Pembahasan Jawaban
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tinjau kunci jawaban dan penjelasan mendalam untuk setiap nomor soal.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto no-scrollbar">
            {[
              { id: "all" as const, label: `Semua (${answersHistory.length})` },
              { id: "wrong" as const, label: `Salah (${wrongCount})` },
              { id: "correct" as const, label: `Benar (${correctCount})` },
              { id: "flagged" as const, label: `Ragu-ragu (${Object.values(flaggedQuestions).filter(Boolean).length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterTab === tab.id
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Question Cards List */}
        <div className="space-y-4">
          {filteredHistory.map((item, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border space-y-3 ${
                item.isCorrect
                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                  : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">
                    Soal #{item.questionIndex + 1}
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    item.isCorrect
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                  }`}>
                    {item.isCorrect ? "Benar" : "Salah"}
                  </span>
                  {flaggedQuestions[item.questionIndex] && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Flag className="w-2.5 h-2.5" /> Ditandai Ragu
                    </span>
                  )}
                </div>

                {item.competencyTag && (
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/40">
                    #{item.competencyTag}
                  </span>
                )}
              </div>

              <div className="text-sm font-semibold text-slate-900 dark:text-white">
                <RenderFormattedQuestion text={item.questionText} />
              </div>

              {/* Selected vs Correct Option */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className={`p-3 rounded-xl border ${
                  item.isCorrect
                    ? "bg-emerald-100/50 border-emerald-300 text-emerald-900 dark:text-emerald-200"
                    : "bg-rose-100/50 border-rose-300 text-rose-900 dark:text-rose-200"
                }`}>
                  <span className="font-bold block text-xs uppercase opacity-75">Jawaban Anda:</span>
                  <span>{item.selectedOption !== -1 && item.options[item.selectedOption] ? item.options[item.selectedOption] : "Tidak Dijawab"}</span>
                </div>

                {!item.isCorrect && (
                  <div className="p-3 rounded-xl border bg-emerald-100/50 border-emerald-300 text-emerald-900 dark:text-emerald-200">
                    <span className="font-bold block text-xs uppercase opacity-75">Kunci Jawaban Benar:</span>
                    <span>{item.options[item.correctOption]}</span>
                  </div>
                )}
              </div>

              {item.explanation && (
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700">
                  <strong className="text-slate-900 dark:text-white block mb-0.5">💡 Pembahasan:</strong>
                  {item.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
