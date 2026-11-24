import React, { useState, useEffect } from "react";
import {
  Brain,
  Play,
  CheckCircle2,
  XCircle,
  Sparkles,
  History,
  TrendingUp,
  ChevronRight,
  RotateCcw,
  Award,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adaptiveApi } from "../api/apiClient";
import { AdaptiveAssessmentState, Profile } from "../types";
import { playSound } from "../utils/sound";
import { ROUTES } from "../routes";

interface AdaptiveAssessmentViewProps {
  profile: Profile;
  onProfileUpdate?: (profile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

const CATEGORIES = [
  { id: "TKD BUMN", label: "TKD & AKHLAK BUMN", desc: "Verbal, numerik, silogisme, dan tata nilai AKHLAK" },
  { id: "React & Frontend", label: "React & Frontend", desc: "Hooks, reconciliation, TypeScript, state caching" },
  { id: "Backend & SQL", label: "Backend & SQL", desc: "PostgreSQL, concurrency locking, REST API design" },
  { id: "Situational Judgment", label: "Situational Judgment", desc: "Pengambilan keputusan & etika kerja industri" },
  { id: "Data Analytics", label: "Data & Product Analytics", desc: "Metrik produk, funnel, dan penalaran statistik" },
];

export function AdaptiveAssessmentView({
  profile,
  onProfileUpdate,
  showToast,
}: AdaptiveAssessmentViewProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"test" | "history">("test");
  const [selectedCategory, setSelectedCategory] = useState<string>("TKD BUMN");
  const [questionCount, setQuestionCount] = useState<number>(6);
  const [session, setSession] = useState<AdaptiveAssessmentState | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await adaptiveApi.getHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleStart = async () => {
    setLoading(true);
    setSelectedOption(null);
    try {
      const res = await adaptiveApi.start(selectedCategory, questionCount);
      setSession(res);
      playSound("click");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal memulai asesmen adaptif.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!session || selectedOption === null || submitting) return;
    setSubmitting(true);
    try {
      const res = await adaptiveApi.answer(session.assessmentId, selectedOption);
      if (res.feedback?.isCorrect) {
        playSound("correct");
      } else {
        playSound("wrong");
      }
      setSession(res);
      setSelectedOption(null);
      if (res.status === "completed") {
        if (res.profile && onProfileUpdate) {
          onProfileUpdate(res.profile);
        }
        playSound("levelUp");
        showToast?.(
          `Asesmen selesai! Skor Kemampuan: ${res.abilityScore}/100 (+${res.earnedXp || 0} XP)`,
          "success"
        );
        loadHistory();
      }
    } catch (err: any) {
      showToast?.(err?.message || "Gagal mengirim jawaban.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const difficultyLabel = (lvl: number) => {
    if (lvl <= 1) return "Dasar";
    if (lvl === 2) return "Menengah Bawah";
    if (lvl === 3) return "Menengah";
    if (lvl === 4) return "Menengah Atas";
    return "Industri Senior";
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Brain className="w-4 h-4" />
            <span>Computerized Adaptive Testing (CAT) · Gemini 4</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Asesmen Kompetensi AI Adaptif
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Tingkat kesulitan soal (Level 1–5) menyesuaikan jawaban Anda secara dinamis untuk mengukur skor kemampuan riil serta memetakan topik kelemahan secara presisi.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("test")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "test"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Play className="w-3.5 h-3.5" /> Sesi Asesmen
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              loadHistory();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5" /> Riwayat ({history.length})
          </button>
        </div>
      </div>

      {activeTab === "history" ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Riwayat Evaluasi Adaptif</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium tabular-nums">
              {history.length} Sesi Tersimpan
            </span>
          </div>

          {loadingHistory ? (
            <p className="text-sm text-slate-500 py-8 text-center">Memuat riwayat asesmen...</p>
          ) : history.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-sm text-slate-500">Belum ada riwayat asesmen adaptif yang diselesaikan.</p>
              <button
                type="button"
                onClick={() => setActiveTab("test")}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Mulai Asesmen Pertama
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.assessmentId}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">{item.category}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 tabular-nums">{item.questionCount} Soal</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        {new Date(item.completedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.aiSummary}
                    </p>
                    {Array.isArray(item.weakTopics) && item.weakTopics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                          Perlu Ditingkatkan:
                        </span>
                        {item.weakTopics.map((tag: string) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Skor Kemampuan</span>
                      <span className="font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {item.abilityScore}/100
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : !session ? (
        /* Setup Screen */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                1. Pilih Domain Kompetensi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Sistem akan mengkalibrasi tingkat kesulitan soal sejak pertanyaan kedua berdasarkan akurasi jawaban Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                      active
                        ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <p className="font-bold text-sm text-slate-900 dark:text-white">{cat.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{cat.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                2. Konfigurasi Sesi
              </h2>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Jumlah Soal Evaluasi
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 6, 8, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`py-2.5 rounded-xl text-xs font-bold border cursor-pointer tabular-nums ${
                        questionCount === num
                          ? "bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Topik Terpilih</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedCategory}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kesulitan Awal</span>
                  <span className="font-bold text-emerald-600">Level 2 / 5</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Potensi Reward</span>
                  <span className="font-bold text-amber-600 tabular-nums">Hingga +{60 + questionCount * 20} XP & 25 Gems</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStart}
              disabled={loading}
              className="w-full py-3.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? "Menyiapkan Soal Adaptif..." : "Mulai Asesmen Adaptif"}</span>
            </button>
          </div>
        </div>
      ) : session.status === "completed" ? (
        /* Completed Diagnostic Summary */
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Laporan Diagnostik CAT Selesai
                </span>
                <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {session.category || selectedCategory}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  {session.aiSummary}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 shrink-0">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                  <span className="text-xs text-slate-500 block">Ability Score</span>
                  <span className="font-display text-2xl font-bold text-emerald-600 tabular-nums">
                    {session.abilityScore}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center">
                  <span className="text-xs text-slate-500 block">XP Diperoleh</span>
                  <span className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                    +{session.earnedXp || 0}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                  <span className="text-xs text-slate-500 block">Gems</span>
                  <span className="font-display text-2xl font-bold text-amber-600 tabular-nums">
                    +{session.earnedGems || 0}
                  </span>
                </div>
              </div>
            </div>

            {Array.isArray(session.weakTopics) && session.weakTopics.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Topik yang Perlu Diperkuat
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {session.weakTopics.map((topic) => (
                      <span
                        key={topic}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.learning.catalog)}
                  className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Pelajari di Katalog Kursus
                </button>
              </div>
            )}

            {/* Question Review List */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Tinjauan Soal & Kalibrasi Kesulitan
              </h3>
              {(session.history || []).map((h, idx) => (
                <div
                  key={h.questionId + idx}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
                      Soal {idx + 1} • Level {h.difficulty}/5 ({h.competencyTag})
                    </span>
                    {h.isCorrect ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Benar
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Kurang Tepat
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{h.prompt}</p>
                  <p className="text-slate-600 dark:text-slate-300">
                    <strong>Jawaban Benar:</strong> {h.options?.[h.correctOption]}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{h.explanation}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSession(null)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Asesmen Adaptif Baru
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Active Adaptive Question Screen */
        <div className="space-y-5">
          {/* Calibration Status Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 block">Progres Sesi</span>
              <span className="font-display text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                Soal {session.questionNumber} / {session.maxQuestions}
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Kalibrasi Kesulitan</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  Level {session.currentDifficulty}/5 · {difficultyLabel(session.currentDifficulty)}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <div
                    key={lvl}
                    className={`h-2 rounded-full transition-all ${
                      lvl <= session.currentDifficulty
                        ? "bg-indigo-600 dark:bg-indigo-500"
                        : "bg-slate-200 dark:bg-slate-800"
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 block">Estimasi Ability Score</span>
              <span className="font-display text-xl font-bold text-emerald-600 tabular-nums">
                {session.abilityScore} / 100
              </span>
            </div>
          </div>

          {/* Previous Feedback Toast Banner */}
          {session.feedback && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-1 ${
                session.feedback.isCorrect
                  ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                  : "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
              }`}
            >
              <p className="font-bold flex items-center gap-1.5">
                {session.feedback.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Jawaban sebelumnya tepat! Kesulitan soal berikutnya dinaikkan.
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    Jawaban sebelumnya kurang tepat ({session.feedback.competencyTag}). Kesulitan disesuaikan.
                  </>
                )}
              </p>
              <p className="opacity-90 leading-relaxed">{session.feedback.explanation}</p>
            </div>
          )}

          {/* Question Card */}
          {session.question && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-emerald-600 uppercase tracking-wider">
                    {session.question.competencyTag}
                  </span>
                  <span className="tabular-nums font-semibold">
                    Bobot Kesulitan: {session.question.difficulty}/5
                  </span>
                </div>
                <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {session.question.prompt}
                </h2>
              </div>

              <div className="space-y-3">
                {session.question.options.map((opt, idx) => {
                  const chosen = selectedOption === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedOption(idx)}
                      className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        chosen
                          ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          chosen
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSession(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Batalkan Sesi
                </button>
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={selectedOption === null || submitting}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <span>{submitting ? "Mengkalibrasi Soal..." : "Kirim & Lanjut"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdaptiveAssessmentView;
