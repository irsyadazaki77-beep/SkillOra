import React, { useEffect, useState } from "react";
import {
  Clock,
  Flag,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { CourseExamRecord, Profile } from "../../types";
import { trainingApi } from "../../api/apiClient";

interface CourseExamRunnerProps {
  courseId: string;
  courseTitle: string;
  examType: "pretest" | "final";
  pretestBaselineScore?: number | null;
  onProfileUpdate?: (profile: Profile) => void;
  onCompleted?: () => void;
  onOpenLesson?: (lessonId: string) => void;
  onOpenCertificates?: () => void;
  onClose: () => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

interface ExamQuestionItem {
  id: string;
  lessonId: string;
  lessonTitle: string;
  text: string;
  options: string[];
  competencyTag: string;
}

export function CourseExamRunner({
  courseId,
  courseTitle,
  examType,
  pretestBaselineScore,
  onProfileUpdate,
  onCompleted,
  onOpenLesson,
  onOpenCertificates,
  onClose,
  showToast,
}: CourseExamRunnerProps) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ExamQuestionItem[]>([]);
  const [passingScore, setPassingScore] = useState(examType === "final" ? 75 : 60);
  const [totalDuration, setTotalDuration] = useState(300);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const [result, setResult] = useState<{
    exam: CourseExamRecord;
    reviewItems: Array<{
      id: string;
      text: string;
      lessonId: string;
      lessonTitle: string;
      selectedOption: number;
      correctOption: number;
      isCorrect: boolean;
      explanation: string;
      competencyTag: string;
    }>;
    certificateIssued: boolean;
  } | null>(null);

  const [showReviewList, setShowReviewList] = useState(false);

  const loadExam = async () => {
    try {
      setLoading(true);
      setResult(null);
      setAnswers({});
      setFlagged(new Set());
      setCurrentIdx(0);
      const data = await trainingApi.getExamQuestions(courseId, examType);
      setQuestions(data.questions || []);
      setPassingScore(data.passingScore);
      setTotalDuration(data.durationSeconds);
      setSecondsLeft(data.durationSeconds);
    } catch (err: any) {
      showToast?.(err?.message || "Gagal memuat soal ujian.", "error");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExam();
  }, [courseId, examType]);

  // Countdown timer
  useEffect(() => {
    if (loading || result || submitting) return;
    if (secondsLeft <= 0) {
      handleSubmit();
      return;
    }
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [loading, result, submitting, secondsLeft]);

  const handleSubmit = async () => {
    if (submitting || result) return;
    setSubmitting(true);
    try {
      const elapsed = Math.max(5, totalDuration - secondsLeft);
      const res = await trainingApi.submitCourseExam(courseId, {
        examType,
        answers,
        questionIds: questions.map((q) => q.id),
        durationSeconds: elapsed,
      });
      setResult({
        exam: res.exam,
        reviewItems: res.reviewItems,
        certificateIssued: res.certificateIssued,
      });
      if (res.profile && onProfileUpdate) {
        onProfileUpdate(res.profile);
      }
      onCompleted?.();
      showToast?.(
        res.certificateIssued
          ? `Selamat! Lulus Ujian Akhir (${res.exam.score}%) & Sertifikat Terverifikasi diterbitkan.`
          : `${examType === "final" ? "Ujian Akhir" : "Pra-Tes"} selesai — Skor ${res.exam.score}%`,
        res.exam.passed ? "success" : "info"
      );
    } catch (err: any) {
      showToast?.(err?.message || "Gagal mengumpulkan ujian.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 space-y-4">
        <div className="h-5 w-60 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-28 w-full bg-zinc-100 dark:bg-zinc-800/70 rounded-xl animate-pulse" />
        <div className="h-12 w-full bg-zinc-100 dark:bg-zinc-800/70 rounded-xl animate-pulse" />
      </div>
    );
  }

  // --- RESULT & COMPETENCY ANALYTICS VIEW ---
  if (result) {
    const { exam, reviewItems, certificateIssued } = result;
    const gain =
      examType === "final" && typeof pretestBaselineScore === "number"
        ? exam.score - pretestBaselineScore
        : null;

    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{examType === "final" ? "Tahap 4 · Ujian Sertifikasi Akhir" : "Tahap 1 · Pra-Tes Diagnostik"}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{formatTimer(exam.durationSeconds)}</span>
            </div>
            <h2 className="text-xl font-bold font-display text-zinc-950 dark:text-white">
              {courseTitle}
            </h2>
            <div className="flex items-center gap-2 pt-1">
              {exam.passed ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  {examType === "final" ? "Lulus Sertifikasi Kompetensi" : "Baseline Kompetensi Terpetakan"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  {examType === "final"
                    ? `Belum Mencapai Ambang Lulus (${passingScore}%)`
                    : "Baseline Awal Terpetakan — Siap Belajar Modul"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5 font-mono tabular-nums">
            <div className="text-right">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Skor Akhir</div>
              <div className="text-3xl font-bold text-zinc-950 dark:text-white">{exam.score}%</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {exam.correctCount}/{exam.totalQuestions} benar · +{exam.earnedXp} XP
              </div>
            </div>
            {gain !== null && (
              <div className="pl-5 border-l border-zinc-200 dark:border-zinc-800 text-right">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Learning Gain</div>
                <div
                  className={`text-2xl font-bold ${
                    gain >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                  }`}
                >
                  {gain >= 0 ? `+${gain}%` : `${gain}%`}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  dari Pra-Tes {pretestBaselineScore}%
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Certificate Banner if issued */}
          {certificateIssued && (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    Sertifikat Kompetensi Terverifikasi Diterbitkan
                  </div>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                    Keahlian pelatihan ini otomatis ditambahkan ke profil dan portofolio publik Anda.
                  </p>
                </div>
              </div>
              {onOpenCertificates && (
                <button
                  type="button"
                  onClick={onOpenCertificates}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  Lihat Sertifikat
                </button>
              )}
            </div>
          )}

          {/* Competency Breakdown Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-white">
                Analitik Penguasaan per Kompetensi
              </h3>
              <div className="space-y-3">
                {exam.competencyBreakdown.map((item) => {
                  const isWeak = item.accuracy < 75;
                  return (
                    <div key={item.topic} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate pr-2">
                          {item.topic}
                        </span>
                        <span
                          className={`font-mono tabular-nums font-semibold shrink-0 ${
                            isWeak
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {item.accuracy}% ({item.correct}/{item.total}) · {isWeak ? "Perlu Ulasan" : "Kuat"}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isWeak ? "bg-amber-500" : "bg-emerald-600"
                          }`}
                          style={{ width: `${item.accuracy}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Diagnostic Summary */}
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <span>Analisis Diagnostik AI & Rencana Perbaikan</span>
              </div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                {exam.aiDiagnostic ||
                  "Tinjau kembali topik dengan akurasi di bawah 75% melalui modul bacaan dan flashcard Spaced Repetition."}
              </p>
              {exam.weakTopics.length > 0 && (
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-semibold text-zinc-900 dark:text-white">Prioritas Ulasan: </span>
                  {exam.weakTopics.join(" · ")}
                </div>
              )}
            </div>
          </div>

          {/* Toggle Detailed Question Review */}
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowReviewList((s) => !s)}
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 underline cursor-pointer"
              >
                {showReviewList ? "Sembunyikan Pembahasan Soal" : `Lihat Pembahasan Lengkap (${reviewItems.length} Soal)`}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadExam}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Ulangi {examType === "final" ? "Ujian" : "Pra-Tes"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer"
                >
                  Kembali ke Pelatihan
                </button>
              </div>
            </div>

            {showReviewList && (
              <div className="space-y-3">
                {reviewItems.map((item, i) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-xs font-semibold text-zinc-900 dark:text-white">
                        {i + 1}. {item.text}
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold shrink-0 ${
                          item.isCorrect
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {item.isCorrect ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Benar
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Keliru
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">Pembahasan: </span>
                      {item.explanation}
                    </p>
                    {!item.isCorrect && onOpenLesson && (
                      <button
                        type="button"
                        onClick={() => onOpenLesson(item.lessonId)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Pelajari ulang: {item.lessonTitle}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- ACTIVE EXAM INTERFACE ---
  const currentQ = questions[currentIdx];
  const answeredCount = Object.keys(answers).length;
  const isFlagged = currentQ ? flagged.has(currentQ.id) : false;

  const toggleFlag = () => {
    if (!currentQ) return;
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) next.delete(currentQ.id);
      else next.add(currentQ.id);
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Top Exam Bar */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {examType === "final" ? "Tahap 4 · Ujian Sertifikasi Akhir" : "Tahap 1 · Pra-Tes Diagnostik"} · Ambang Lulus {passingScore}%
          </div>
          <h2 className="text-base font-bold font-display text-zinc-950 dark:text-white">
            {courseTitle}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`inline-flex items-center gap-1.5 font-mono tabular-nums text-sm font-bold px-3 py-1.5 rounded-lg border ${
              secondsLeft <= 60
                ? "border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white bg-zinc-50 dark:bg-zinc-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            {formatTimer(secondsLeft)}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Main Two-Zone Exam Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Question Canvas */}
        <div className="lg:col-span-8 p-6 space-y-6 lg:border-r border-zinc-200 dark:border-zinc-800">
          {currentQ && (
            <>
              <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-mono tabular-nums">
                  Soal {currentIdx + 1} dari {questions.length} · {currentQ.competencyTag}
                </span>
                <button
                  type="button"
                  onClick={toggleFlag}
                  className={`inline-flex items-center gap-1 font-medium cursor-pointer ${
                    isFlagged
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  {isFlagged ? "Ditandai Ragu" : "Tandai Ragu"}
                </button>
              </div>

              <p className="text-base sm:text-lg font-semibold text-zinc-950 dark:text-white leading-relaxed">
                {currentQ.text}
              </p>

              <div className="space-y-2.5">
                {currentQ.options.map((opt, optIdx) => {
                  const selected = answers[currentQ.id] === optIdx;
                  const letter = String.fromCharCode(65 + optIdx);
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: optIdx }))}
                      className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        selected
                          ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 text-zinc-950 dark:text-white"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                          selected
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="text-sm leading-relaxed">{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 disabled:opacity-40 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Sebelumnya
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 text-xs font-semibold cursor-pointer"
                  >
                    Selanjutnya <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleSubmit}
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Menilai Jawaban..." : "Kumpulkan & Lihat Analitik"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Question Map Sidebar */}
        <div className="lg:col-span-4 p-6 bg-zinc-50/70 dark:bg-zinc-950/50 space-y-5">
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-zinc-900 dark:text-white">Navigasi Nomor Soal</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
              Terjawab {answeredCount} / {questions.length} · Ditandai {flagged.size}
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIdx;
              const isAnswered = answers[q.id] !== undefined;
              const isMarked = flagged.has(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIdx(idx)}
                  className={`h-9 rounded-lg font-mono text-xs font-semibold border transition-colors cursor-pointer ${
                    isCurrent
                      ? "border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-950"
                      : isMarked
                        ? "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                        : isAnswered
                          ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300"
                          : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          >
            {submitting
              ? "Menganalisis Kompetensi..."
              : `Selesaikan & Nilai (${answeredCount}/${questions.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
