import React from "react";
import {
  ArrowLeft,
  Clock,
  Flag,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Lightbulb,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  Grid,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ActiveQuizSession } from "../types";
import { RenderFormattedQuestion } from "../utils/formatQuestion";

interface QuizActiveScreenProps {
  session: ActiveQuizSession;
  currentQuestionIndex: number;
  selectedAnswers: Record<number, number>;
  flaggedQuestions: Record<number, boolean>;
  timeRemaining: number;
  isSubmitting: boolean;
  soundMuted: boolean;
  setSoundMuted: (val: boolean | ((prev: boolean) => boolean)) => void;
  isFocusMode: boolean;
  setIsFocusMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  showAiHint: boolean;
  setShowAiHint: (val: boolean | ((prev: boolean) => boolean)) => void;
  showQuestionGridDrawer: boolean;
  setShowQuestionGridDrawer: (val: boolean | ((prev: boolean) => boolean)) => void;
  showConfirmSubmitModal: boolean;
  setShowConfirmSubmitModal: (val: boolean) => void;
  showConfirmExitModal: boolean;
  setShowConfirmExitModal: (val: boolean) => void;
  handleSelectOption: (optIdx: number) => void;
  handleToggleFlag: (idx?: number) => void;
  handleGoToQuestion: (idx: number) => void;
  handleNextQuestion: () => void;
  handlePrevQuestion: () => void;
  handleRequestSubmit: () => void;
  executeSubmit: () => void;
  exitQuiz: () => void;
}

export function QuizActiveScreen({
  session,
  currentQuestionIndex,
  selectedAnswers,
  flaggedQuestions,
  timeRemaining,
  isSubmitting,
  soundMuted,
  setSoundMuted,
  isFocusMode,
  setIsFocusMode,
  showAiHint,
  setShowAiHint,
  showQuestionGridDrawer,
  setShowQuestionGridDrawer,
  showConfirmSubmitModal,
  setShowConfirmSubmitModal,
  showConfirmExitModal,
  setShowConfirmExitModal,
  handleSelectOption,
  handleToggleFlag,
  handleGoToQuestion,
  handleNextQuestion,
  handlePrevQuestion,
  handleRequestSubmit,
  executeSubmit,
  exitQuiz
}: QuizActiveScreenProps) {
  const currentQuestion = session.questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  const totalQuestions = session.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = totalQuestions - answeredCount;
  const flaggedCount = Object.keys(flaggedQuestions).filter(k => flaggedQuestions[Number(k)]).length;
  const progressPercent = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
  const isCurrentFlagged = Boolean(flaggedQuestions[currentQuestionIndex]);
  const currentSelectedOption = selectedAnswers[currentQuestionIndex] !== undefined ? selectedAnswers[currentQuestionIndex] : null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`w-full max-w-4xl mx-auto space-y-4 sm:space-y-5 transition-all duration-300 ${isFocusMode ? "pt-1" : ""}`}>
      {/* Top Header Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Exit Button */}
          <button
            onClick={() => setShowConfirmExitModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>

          {/* Center Info: Title & Counter */}
          <div className="text-center">
            <span className="text-xs sm:text-xs font-bold text-indigo-600 dark:text-indigo-400 block uppercase tracking-wider truncate max-w-[200px] sm:max-w-xs">
              {session.title}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
              Soal {currentQuestionIndex + 1} <span className="text-slate-400 font-normal">/ {totalQuestions}</span>
            </span>
          </div>

          {/* Right Status Group: Timer, Grid, Audio, Focus */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Timer Badge */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                timeRemaining <= 60
                  ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300 animate-pulse border border-rose-200 dark:border-rose-800"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
              title="Sisa Waktu Pengerjaan"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(timeRemaining)}</span>
            </div>

            {/* Question Navigator Grid Button */}
            <button
              onClick={() => setShowQuestionGridDrawer(prev => !prev)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
              title="Buka Navigasi Nomor Soal"
            >
              <Grid className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">Navigasi ({answeredCount}/{totalQuestions})</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundMuted(prev => !prev)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title={soundMuted ? "Aktifkan Efek Suara" : "Bisukan Suara"}
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Focus Mode */}
            <button
              onClick={() => setIsFocusMode(prev => !prev)}
              className={`p-1.5 rounded-xl cursor-pointer ${
                isFocusMode
                  ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              title={isFocusMode ? "Nonaktifkan Mode Fokus" : "Aktifkan Mode Fokus"}
            >
              {isFocusMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Box */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Question Header & Auxiliary Tools */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/40">
            {currentQuestion.competencyTag || "Kompetensi Utama"}
          </span>

          <div className="flex items-center gap-2">
            {/* AI Hint Button */}
            {currentQuestion.hint && (
              <button
                onClick={() => setShowAiHint(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  showAiHint
                    ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50"
                }`}
                title="Lihat Petunjuk Soal"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Petunjuk</span>
              </button>
            )}

            {/* Ragu-ragu Flag Button */}
            <button
              onClick={() => handleToggleFlag(currentQuestionIndex)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isCurrentFlagged
                  ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-400/30"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
              title="Shortcut: Tekan F"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{isCurrentFlagged ? "Ditandai Ragu" : "Ragu-ragu"}</span>
            </button>
          </div>
        </div>

        {/* AI Hint Drawer */}
        <AnimatePresence>
          {showAiHint && currentQuestion.hint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs text-amber-900 dark:text-amber-200 space-y-1"
            >
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Petunjuk Penalaran:</span>
              </div>
              <p className="leading-relaxed">{currentQuestion.hint}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Question Text */}
        <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
          <RenderFormattedQuestion text={currentQuestion.text} />
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = currentSelectedOption === idx;
            const letterLabel = String.fromCharCode(65 + idx); // A, B, C, D

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-400 text-indigo-900 dark:text-indigo-100 font-semibold shadow-sm ring-1 ring-indigo-500/20"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                    }`}
                  >
                    {letterLabel}
                  </span>
                  <span className="text-xs sm:text-sm pt-0.5 leading-relaxed font-normal">
                    {option}
                  </span>
                </div>

                <span className="hidden sm:inline-block text-xs font-mono text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 shrink-0">
                  {idx + 1}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
          {/* Previous Button */}
          <button
            disabled={currentQuestionIndex === 0}
            onClick={handlePrevQuestion}
            className={`py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm border transition-all flex items-center gap-1.5 ${
              currentQuestionIndex === 0
                ? "border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Sebelumnya</span>
          </button>

          {/* Next or Submit Button */}
          <div className="flex items-center gap-2">
            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleRequestSubmit}
                disabled={isSubmitting}
                className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "Mengirim..." : "Kirim Jawaban"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question Grid Drawer */}
      <AnimatePresence>
        {showQuestionGridDrawer && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Grid className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Navigasi Lembar Soal
                  </h3>
                </div>
                <button
                  onClick={() => setShowQuestionGridDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Summary Legend */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium py-1">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                  <span className="block font-bold text-sm">{answeredCount}</span>
                  <span>Sudah Dijawab</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                  <span className="block font-bold text-sm">{flaggedCount}</span>
                  <span>Ragu-ragu</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <span className="block font-bold text-sm">{unansweredCount}</span>
                  <span>Belum Terisi</span>
                </div>
              </div>

              {/* Number Buttons Grid */}
              <div className="grid grid-cols-5 gap-2.5 pt-2">
                {session.questions.map((_, idx) => {
                  const isAnswered = selectedAnswers[idx] !== undefined;
                  const isFlagged = Boolean(flaggedQuestions[idx]);
                  const isCurrent = currentQuestionIndex === idx;

                  let btnStyle = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
                  if (isAnswered) {
                    btnStyle = "bg-emerald-600 text-white border-emerald-600 font-bold";
                  }
                  if (isFlagged) {
                    btnStyle = "bg-amber-500 text-white border-amber-500 font-bold";
                  }
                  if (isCurrent) {
                    btnStyle += " ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleGoToQuestion(idx)}
                      className={`h-11 rounded-xl border flex flex-col items-center justify-center text-xs transition-all cursor-pointer ${btnStyle}`}
                    >
                      <span>{idx + 1}</span>
                      {isFlagged && <span className="text-[8px]">Ragu</span>}
                    </button>
                  );
                })}
              </div>

              {/* Submit CTA inside Drawer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setShowQuestionGridDrawer(false);
                    handleRequestSubmit();
                  }}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim Lembar Jawaban Sekarang</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal Before Submit */}
      {showConfirmSubmitModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Kirim Lembar Jawaban?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Anda masih memiliki <strong className="text-rose-600 font-bold">{unansweredCount} soal</strong> yang belum dijawab dan <strong className="text-amber-600 font-bold">{flaggedCount} soal</strong> bertanda ragu-ragu.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl text-xs space-y-1.5 text-left border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Total Soal:</span>
                <span className="font-bold">{totalQuestions}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Sudah Dijawab:</span>
                <span className="font-bold">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-rose-600 dark:text-rose-400">
                <span>Belum Terisi:</span>
                <span className="font-bold">{unansweredCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmSubmitModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cek Ulang
              </button>
              <button
                onClick={executeSubmit}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal Before Exit */}
      {showConfirmExitModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hentikan Sesi Latihan?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Jawaban sementara Anda telah tersimpan. Namun jika sesi dihentikan sekarang, skor akhir tidak akan dinilai.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmExitModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Lanjutkan
              </button>
              <button
                onClick={exitQuiz}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
