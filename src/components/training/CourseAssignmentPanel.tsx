import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Terminal,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  FileText,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  Course,
  CourseTrainingOverview,
  Profile,
  TrainingAssignmentRecord,
} from "../../types";
import { trainingApi } from "../../api/apiClient";
import { ROUTES } from "../../routes";

interface CourseAssignmentPanelProps {
  course: Course;
  overview: CourseTrainingOverview | null;
  onProfileUpdate?: (profile: Profile) => void;
  onOverviewRefresh: () => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

export function CourseAssignmentPanel({
  course,
  overview,
  onProfileUpdate,
  onOverviewRefresh,
  showToast,
}: CourseAssignmentPanelProps) {
  const navigate = useNavigate();
  const [answerText, setAnswerText] = useState(overview?.latestAssignment?.answerText || "");
  const [submitting, setSubmitting] = useState(false);
  const [latestResult, setLatestResult] = useState<TrainingAssignmentRecord | null>(
    overview?.latestAssignment || null
  );

  const activeResult = latestResult || overview?.latestAssignment || null;
  const wordCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;

  const casePrompt = course.casePrompt || {
    title: `Studi Kasus Praktik: ${course.title}`,
    scenario: course.project?.description || course.description || "Analisis kasus industri dan susun rekomendasi solusi terukur.",
    deliverables: [
      "Identifikasi akar masalah utama berbasis data/konteks skenario.",
      "Susun solusi teknis atau manajerial yang konkret dan realistis.",
      "Tetapkan metrik keberhasilan (KPI) serta mitigasi risiko utama.",
    ],
    rubricCriteria: [
      "Ketajaman Analisis Akar Masalah",
      "Kualitas & Kelayakan Solusi",
      "Kejelasan Struktur & Komunikasi",
      "Keterukuran Dampak Bisnis / KPI",
    ],
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (answerText.trim().length < 40) {
      showToast?.("Tulis jawaban analisis minimal 40 karakter terlebih dahulu.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await trainingApi.submitAssignment(course.id, answerText);
      setLatestResult(res.assignment);
      if (res.profile && onProfileUpdate) {
        onProfileUpdate(res.profile);
      }
      onOverviewRefresh();
      showToast?.(
        res.assignment.passed
          ? `Lulus Evaluasi AI! Skor ${res.assignment.score}/100 (+${res.assignment.earnedXp} XP)`
          : `Evaluasi AI selesai: Skor ${res.assignment.score}/100. Periksa saran perbaikan.`,
        res.assignment.passed ? "success" : "info"
      );
    } catch (err: any) {
      showToast?.(err?.message || "Gagal mengevaluasi tugas studi kasus.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Linked Interactive Coding / Case Labs */}
      {overview && overview.linkedLabs.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Sandbox Praktik Langsung Terhubung
              </p>
              <h3 className="text-base font-bold font-display text-zinc-950 dark:text-white">
                Interactive Coding & Case Lab Pelatihan Ini
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigate(ROUTES.lab.root)}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Semua Lab ({12}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {overview.linkedLabs.map((lab) => (
              <button
                key={lab.challengeId}
                type="button"
                onClick={() => navigate(ROUTES.lab.detail(lab.challengeId))}
                className="text-left p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-zinc-50/70 dark:bg-zinc-950/60 transition-colors cursor-pointer flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>{lab.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {lab.passed
                        ? `Lulus (${lab.bestScore}/100)`
                        : lab.bestScore > 0
                          ? `Skor Tertinggi ${lab.bestScore}`
                          : "Belum dikerjakan"}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-zinc-950 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {lab.title}
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-emerald-600 shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Written Case Study Studio with Deep AI Rubric Evaluation */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Tugas Studi Kasus Esai</span>
            <span aria-hidden="true">·</span>
            <span>Evaluasi Rubrik AI Mendalam</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Ambang Lulus 70/100</span>
          </div>
          <h3 className="text-lg font-bold font-display text-zinc-950 dark:text-white">
            {casePrompt.title}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {casePrompt.scenario}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Brief & Rubric Left Column */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-zinc-50/60 dark:bg-zinc-950/40 lg:border-r border-zinc-200 dark:border-zinc-800 space-y-5">
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                Poin Wajib dalam Jawaban (Deliverables)
              </h4>
              <ol className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed list-decimal pl-4">
                {casePrompt.deliverables.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ol>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                Rubrik Penilaian AI (Total 100 Poin)
              </h4>
              <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
                {casePrompt.rubricCriteria.map((r, i) => (
                  <li key={i} className="flex items-start justify-between gap-2">
                    <span>{i + 1}. {r}</span>
                    <span className="font-mono tabular-nums text-zinc-400 shrink-0">25 pts</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Submission Editor Right Column */}
          <form onSubmit={handleEvaluate} className="lg:col-span-7 p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <label htmlFor="case-answer-textarea" className="font-semibold text-zinc-900 dark:text-white">
                Jawaban Analisis & Rekomendasi Anda
              </label>
              <span className="font-mono tabular-nums">{wordCount} kata</span>
            </div>

            <textarea
              id="case-answer-textarea"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              rows={10}
              placeholder="Tulis jawaban terstruktur Anda (1. Akar Masalah, 2. Solusi Konkret, 3. Target KPI & Mitigasi)..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950 p-4 text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 resize-y"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                AI menilai ketajaman logika, kesesuaian deliverables, dan kelayakan eksekusi industri.
              </p>
              <button
                type="submit"
                disabled={submitting || answerText.trim().length < 40}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                {submitting ? "Mengevaluasi Rubrik AI..." : "Kirim & Evaluasi AI"}
              </button>
            </div>
          </form>
        </div>

        {/* AI Rubric Evaluation Result */}
        {activeResult && (
          <div className="p-5 sm:p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/60 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {activeResult.passed ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Lulus Evaluasi Rubrik AI
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4" /> Perlu Revisi (Target ≥ 70)
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Dievaluasi {new Date(activeResult.createdAt).toLocaleString("id-ID")} · +{activeResult.earnedXp} XP
                </p>
              </div>
              <div className="font-mono tabular-nums text-right">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Skor Rubrik</div>
                <div className="text-2xl font-bold text-zinc-950 dark:text-white">
                  {activeResult.score} / 100
                </div>
              </div>
            </div>

            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {activeResult.aiFeedback}
            </p>

            {/* Rubric Matrix */}
            {activeResult.rubricScores.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeResult.rubricScores.map((r, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-semibold text-zinc-900 dark:text-white">
                      <span>{r.criterion}</span>
                      <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 shrink-0">
                        {r.score}/{r.maxScore}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {r.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Kekuatan Utama Jawaban
                </h5>
                <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                  {activeResult.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  Area Perbaikan Spesifik
                </h5>
                <ul className="space-y-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                  {activeResult.improvements.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {activeResult.modelAnswerSummary && (
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
                <div className="text-xs font-bold text-zinc-900 dark:text-white">
                  Ringkasan Pendekatan Ideal (Referensi Mentor)
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                  {activeResult.modelAnswerSummary}
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
