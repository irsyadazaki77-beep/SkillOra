import { useState, useEffect, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Flag,
  RotateCcw,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { TKD_QUESTIONS } from "./simulasiData";
import { playSound } from "../../utils/sound";
import { Profile } from "../../types";
import { trainingApi } from "../../api/apiClient";

interface SimulasiTKDTabProps {
  onAddXp?: (xp: number) => void;
  onProfileUpdate?: (profile: Profile) => void;
  onSimulationRecorded?: () => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

const TOTAL_DURATION_SECONDS = 1200; // 20 mins for 20 questions

export function SimulasiTKDTab({
  onAddXp,
  onProfileUpdate,
  onSimulationRecorded,
  showToast,
}: SimulasiTKDTabProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (timerActive && timeLeft > 0 && !quizFinished) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 10 && prev > 1) playSound("laser");
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      handleFinish();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive, timeLeft, quizFinished]);

  const currentQ = TKD_QUESTIONS[currentIdx];

  const handleSelect = (idx: number) => {
    if (quizFinished) return;
    if (!timerActive) setTimerActive(true);
    playSound("click");
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: idx }));
  };

  const results = useMemo(() => {
    let correct = 0;
    const bySubtest: Record<string, { correct: number; total: number }> = {};

    TKD_QUESTIONS.forEach((q) => {
      if (!bySubtest[q.category]) {
        bySubtest[q.category] = { correct: 0, total: 0 };
      }
      bySubtest[q.category].total += 1;
      if (selectedAnswers[q.id] === q.correctIndex) {
        correct += 1;
        bySubtest[q.category].correct += 1;
      }
    });

    const score = Math.round((correct / TKD_QUESTIONS.length) * 100);
    const subtests = Object.entries(bySubtest).map(([category, stats]) => ({
      category,
      correct: stats.correct,
      total: stats.total,
      accuracy: Math.round((stats.correct / stats.total) * 100),
    }));

    return { correct, total: TKD_QUESTIONS.length, score, subtests };
  }, [selectedAnswers]);

  const handleFinish = async () => {
    if (quizFinished) return;
    setQuizFinished(true);
    setTimerActive(false);

    const score = results.score;
    const elapsedSeconds = TOTAL_DURATION_SECONDS - timeLeft;
    const earnedXp = score >= 70 ? 250 : 80;
    if (score >= 70) playSound("levelUp");

    try {
      const saved = await trainingApi.recordSimulation({
        simType: "tkd",
        title: "CAT TKD & AKHLAK BUMN (20 Soal)",
        score,
        metrics: {
          correct: results.correct,
          total: results.total,
          elapsedSeconds,
          subtests: results.subtests,
        },
        earnedXp,
      });
      if (saved?.profile) {
        onProfileUpdate?.(saved.profile);
      } else if (onAddXp && score >= 70) {
        onAddXp(earnedXp);
      }
      onSimulationRecorded?.();
      showToast?.(`Hasil CAT TKD (${score}%) tersimpan (+${earnedXp} XP).`, "success");
    } catch {
      if (onAddXp && score >= 70) onAddXp(earnedXp);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setFlagged({});
    setQuizFinished(false);
    setShowReview(false);
    setTimeLeft(TOTAL_DURATION_SECONDS);
    setTimerActive(true);
  };

  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="space-y-5">
      {/* Top CBT Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
            CBT Standar FHCI BUMN · 5 Subtes
          </p>
          <h3 className="font-display font-bold text-base text-zinc-950 dark:text-white">
            Simulasi CAT TKD & Core Values AKHLAK ({TKD_QUESTIONS.length} Soal)
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums mt-0.5">
            Verbal · Numerik · Silogisme · Figural/Spasial · AKHLAK · Terjawab {answeredCount}/{TKD_QUESTIONS.length}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold tabular-nums ${
              timeLeft <= 60 && timerActive
                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                : "bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </span>
          </div>

          {!timerActive && !quizFinished && (
            <button
              type="button"
              onClick={() => setTimerActive(true)}
              className="px-4 py-2 bg-zinc-950 dark:bg-zinc-100 hover:opacity-90 text-white dark:text-zinc-950 rounded-lg font-semibold text-xs cursor-pointer whitespace-nowrap"
            >
              Mulai Timer
            </button>
          )}

          {!quizFinished && (
            <button
              type="button"
              onClick={handleFinish}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs cursor-pointer whitespace-nowrap"
            >
              Kumpulkan
            </button>
          )}
        </div>
      </div>

      {!quizFinished ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Question Card */}
          <div className="lg:col-span-8 p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-5">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {currentQ.category} · {currentQ.subtopic}
              </span>
              <span className="tabular-nums">
                Soal {currentIdx + 1}/{TKD_QUESTIONS.length}
              </span>
            </div>

            <div className="text-sm sm:text-base font-semibold text-zinc-950 dark:text-white leading-relaxed whitespace-pre-line">
              {currentQ.question}
            </div>

            <div className="space-y-2.5">
              {currentQ.options.map((opt, i) => {
                const isSelected = selectedAnswers[currentQ.id] === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(i)}
                    className={`w-full text-left p-3.5 rounded-lg text-xs sm:text-sm border transition-colors cursor-pointer ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-200 font-semibold"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx((prev) => prev - 1)}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Sebelumnya
              </button>

              <button
                type="button"
                onClick={() =>
                  setFlagged((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))
                }
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  flagged[currentQ.id]
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                    : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Ragu-ragu</span>
              </button>

              {currentIdx < TKD_QUESTIONS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx((prev) => prev + 1)}
                  className="px-4 py-2 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Selanjutnya
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Selesaikan Ujian
                </button>
              )}
            </div>
          </div>

          {/* Question Navigator Grid */}
          <div className="lg:col-span-4 p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <h4 className="font-semibold text-zinc-950 dark:text-white">Navigasi Nomor Soal</h4>
              <span className="font-mono text-zinc-500 tabular-nums">
                {answeredCount}/{TKD_QUESTIONS.length}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {TKD_QUESTIONS.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isCurrent = idx === currentIdx;
                const isFlagged = flagged[q.id];

                let bg =
                  "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-transparent";
                if (isCurrent) {
                  bg = "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold";
                } else if (isFlagged) {
                  bg =
                    "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-semibold";
                } else if (isAnswered) {
                  bg =
                    "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-semibold";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-lg text-xs font-mono tabular-nums transition-colors cursor-pointer ${bg}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              Ambang batas kelulusan simulasi: 70%. Semua 5 subtes dianalisis terpisah setelah pengumpulan.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Score & Subtest Breakdown */}
          <div className="p-6 sm:p-7 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                    Hasil Simulasi CAT TKD & AKHLAK
                  </p>
                  <h3 className="font-display font-bold text-xl text-zinc-950 dark:text-white">
                    Skor Akhir: <span className="font-mono tabular-nums">{results.score}%</span>{" "}
                    <span className="text-sm font-normal text-zinc-500">
                      ({results.correct}/{results.total} benar)
                    </span>
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReview((prev) => !prev)}
                  className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                >
                  {showReview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {showReview ? "Tutup Pembahasan" : "Lihat Pembahasan"}
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-4 py-2 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Ulangi CAT
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Analitik Performa per Subtes
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.subtests.map((sub) => (
                  <div
                    key={sub.category}
                    className="p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {sub.category}
                      </span>
                      <span className="font-mono font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                        {sub.accuracy}% ({sub.correct}/{sub.total})
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          sub.accuracy >= 70 ? "bg-emerald-600" : "bg-amber-500"
                        }`}
                        style={{ width: `${sub.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Full Answer Review */}
          {showReview && (
            <div className="space-y-3">
              {TKD_QUESTIONS.map((q, idx) => {
                const picked = selectedAnswers[q.id];
                const isCorrect = picked === q.correctIndex;
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-zinc-500">
                        #{idx + 1} · {q.category} · {q.subtopic}
                      </span>
                      <span
                        className={`font-semibold inline-flex items-center gap-1 ${
                          isCorrect
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Benar
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Salah
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-zinc-950 dark:text-white whitespace-pre-line">
                      {q.question}
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      Kunci: {q.options[q.correctIndex]}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
