import React, { useEffect, useState } from "react";
import {
  Crosshair,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Award,
} from "lucide-react";
import { Profile, Question } from "../../../types";
import { apiClient, trainingApi } from "../../../api/apiClient";
import { playSound } from "../../../utils/sound";
import { Button } from "../../../components/ui/Button";

type AdaptiveQuestion = Question & {
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  category: string;
};

interface AdaptiveDrillTabProps {
  onProfileUpdate: (profile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function AdaptiveDrillTab({ onProfileUpdate, showToast }: AdaptiveDrillTabProps) {
  const [loading, setLoading] = useState(true);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [prioritizedCount, setPrioritizedCount] = useState(0);
  const [questions, setQuestions] = useState<AdaptiveQuestion[]>([]);

  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(false);

  const loadDrill = async () => {
    try {
      setLoading(true);
      const data = await trainingApi.getAdaptiveDrill(8);
      setWeakTopics(data.weakTopics || []);
      setPrioritizedCount(data.prioritizedCount || 0);
      setQuestions(data.questions || []);
      setStarted(false);
      setCurrentIdx(0);
      setSelectedAnswers({});
      setFinished(false);
      setXpAwarded(false);
    } catch (err: any) {
      showToast?.(err?.message || "Gagal memuat paket Drill Adaptif.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrill();
  }, []);

  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.keys(selectedAnswers).length;
  const correctCount = questions.filter((q) => {
    const picked = selectedAnswers[q.id];
    const correctIdx = typeof q.answerIndex === "number" ? q.answerIndex : 0;
    return picked !== undefined && picked === correctIdx;
  }).length;

  const handleSelectOption = (optIdx: number) => {
    if (!currentQuestion || selectedAnswers[currentQuestion.id] !== undefined) return;
    const correctIdx =
      typeof currentQuestion.answerIndex === "number" ? currentQuestion.answerIndex : 0;
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion.id]: optIdx }));
    playSound(optIdx === correctIdx ? "correct" : "wrong");
  };

  const handleCompleteDrill = async () => {
    setFinished(true);
    playSound("levelUp");
    if (!xpAwarded && correctCount > 0) {
      setXpAwarded(true);
      const earned = Math.max(25, correctCount * 15);
      try {
        const res = await apiClient.post("/user/add-xp", { xp: earned });
        if (res?.profile) onProfileUpdate(res.profile);
        showToast?.(`Drill Adaptif tuntas! +${earned} XP ditambahkan.`, "success");
      } catch {
        // ignore xp error
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center">
        <p className="text-xs font-mono text-zinc-500">
          Menyusun paket soal adaptif berdasarkan riwayat akurasi Anda...
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-3">
        <h3 className="font-display font-bold text-base text-zinc-950 dark:text-white">
          Belum Ada Soal Tersedia
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Coba muat ulang untuk mengambil paket latihan adaptif lintas kursus.
        </p>
        <Button variant="secondary" size="sm" onClick={loadDrill} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Muat Ulang
        </Button>
      </div>
    );
  }

  if (finished) {
    const scorePct = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-6 max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div className="space-y-1">
            <p className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
              Hasil Drill Adaptif Kelemahan
            </p>
            <h2 className="text-xl font-display font-bold text-zinc-950 dark:text-white">
              Akurasi Sesi: <span className="font-mono tabular-nums">{scorePct}%</span>
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Anda menjawab benar {correctCount} dari {questions.length} soal prioritas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={loadDrill}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Buat Paket Adaptif Baru
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {questions.map((q, idx) => {
            const picked = selectedAnswers[q.id];
            const correctIdx = typeof q.answerIndex === "number" ? q.answerIndex : 0;
            const isCorrect = picked === correctIdx;
            return (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 space-y-2"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono text-zinc-500">
                    Soal {idx + 1} · {q.courseTitle}
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
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">{q.text}</p>
                {q.explanation && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    <strong className="text-zinc-900 dark:text-zinc-200">Pembahasan: </strong>
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5" />
              Adaptive Weak-Topic Drill
            </p>
            <h2 className="text-xl font-display font-bold text-zinc-950 dark:text-white">
              Latihan Otomatis Menyasar Topik Terlemah Anda
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Sistem memindai riwayat kuis, Pra-Tes, dan Ujian Akhir Anda untuk memilih {questions.length} soal paling berdampak dalam menutup celah kompetensi.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={() => setStarted(true)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Mulai Drill ({questions.length} Soal)
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-xs font-mono text-zinc-500">Topik Prioritas Terdeteksi</span>
            <p className="text-sm font-bold text-zinc-950 dark:text-white">
              {weakTopics.length > 0 ? weakTopics.join(" · ") : "Kalibrasi Lintas Jalur"}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-xs font-mono text-zinc-500">Soal Ditargetkan</span>
            <p className="text-sm font-bold font-mono tabular-nums text-zinc-950 dark:text-white">
              {prioritizedCount} Prioritas · {questions.length} Total
            </p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
            <span className="text-xs font-mono text-zinc-500">Umpan Balik</span>
            <p className="text-sm font-bold text-zinc-950 dark:text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600" /> Pembahasan Instan + XP
            </p>
          </div>
        </div>
      </div>
    );
  }

  const pickedOption = selectedAnswers[currentQuestion.id];
  const isAnswered = pickedOption !== undefined;
  const correctIdx =
    typeof currentQuestion.answerIndex === "number" ? currentQuestion.answerIndex : 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 space-y-5 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-4 text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
        <span>
          Soal {currentIdx + 1}/{questions.length} · {currentQuestion.courseTitle}
        </span>
        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
          Terjawab {answeredCount}/{questions.length} · Benar {correctCount}
        </span>
      </div>

      <h3 className="text-base sm:text-lg font-display font-bold text-zinc-950 dark:text-white leading-snug">
        {currentQuestion.text}
      </h3>

      <div className="space-y-2.5">
        {(currentQuestion.options || []).map((opt, idx) => {
          let style =
            "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 hover:border-emerald-500/60";
          if (isAnswered) {
            if (idx === correctIdx) {
              style =
                "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold";
            } else if (idx === pickedOption) {
              style =
                "border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200";
            } else {
              style =
                "border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600";
            }
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => handleSelectOption(idx)}
              className={`w-full text-left p-3.5 rounded-lg border text-sm transition-colors flex items-start gap-2.5 cursor-pointer disabled:cursor-default ${style}`}
            >
              <span className="font-mono text-xs font-bold mt-0.5 shrink-0">
                {String.fromCharCode(65 + idx)}.
              </span>
              <span className="flex-1">{opt}</span>
            </button>
          );
        })}
      </div>

      {isAnswered && currentQuestion.explanation && (
        <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          <strong className="text-zinc-950 dark:text-white">Pembahasan: </strong>
          {currentQuestion.explanation}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-zinc-800">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentIdx === 0}
          onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
        >
          Sebelumnya
        </Button>

        {currentIdx < questions.length - 1 ? (
          <Button
            variant="primary"
            size="sm"
            disabled={!isAnswered}
            onClick={() => setCurrentIdx((i) => i + 1)}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Soal Berikutnya
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            disabled={!isAnswered}
            onClick={handleCompleteDrill}
          >
            Lihat Ringkasan Hasil
          </Button>
        )}
      </div>
    </div>
  );
}
