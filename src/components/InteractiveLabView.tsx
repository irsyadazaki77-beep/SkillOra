import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Terminal,
  Play,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Lightbulb,
  ArrowLeft,
  History,
  Bot,
  ChevronRight,
  Award,
  Code2,
} from "lucide-react";
import { LabChallenge, LabSubmissionRecord, Profile } from "../types";
import { labApi } from "../api/apiClient";
import { resolveCourseImage } from "../utils/resolveAsset";
import { CopilotContextInfo } from "./MentorChatSidebar";
import { buildFrontendPreviewHtml, runJsInWorker, runSqlSandboxPreview, SqlPreviewResult } from "../utils/sandboxRunner";

interface InteractiveLabViewProps {
  profile: Profile;
  onProfileUpdate: (profile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
  onOpenCopilot?: (ctx: CopilotContextInfo) => void;
}

interface ClientTestResult {
  label: string;
  passed: boolean;
  details: string;
}

const TRACK_TABS = [
  { id: "semua", label: "Semua Lab" },
  { id: "frontend", label: "Frontend" },
  { id: "backend", label: "Backend & SQL" },
  { id: "data", label: "Data Analytics" },
  { id: "bumn", label: "BUMN Case" },
];

export function InteractiveLabView({
  onProfileUpdate,
  showToast,
  onOpenCopilot,
}: InteractiveLabViewProps) {
  const { id: routeLabId } = useParams();
  const navigate = useNavigate();

  const [challenges, setChallenges] = useState<LabChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackFilter, setTrackFilter] = useState("semua");

  // Workspace state
  const [code, setCode] = useState("");
  const [leftTab, setLeftTab] = useState<"brief" | "rubric" | "history">("brief");
  const [mobilePane, setMobilePane] = useState<"brief" | "editor">("editor");
  const [revealedHints, setRevealedHints] = useState(0);
  const [testResults, setTestResults] = useState<ClientTestResult[] | null>(null);
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);
  const [sqlPreview, setSqlPreview] = useState<SqlPreviewResult | null>(null);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [runningSandbox, setRunningSandbox] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [latestEvaluation, setLatestEvaluation] = useState<LabSubmissionRecord | null>(null);
  const [submissions, setSubmissions] = useState<LabSubmissionRecord[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      const list = await labApi.list();
      setChallenges(Array.isArray(list) ? list : []);
    } catch (err: any) {
      showToast?.(err?.message || "Gagal memuat katalog lab.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const activeLab = useMemo(() => {
    if (!routeLabId) return null;
    return challenges.find((c) => c.id === routeLabId) || null;
  }, [challenges, routeLabId]);

  useEffect(() => {
    if (!activeLab) return;
    setCode(activeLab.starterCode || "");
    setTestResults(null);
    setSandboxLogs([]);
    setSqlPreview(null);
    setLatestEvaluation(null);
    setRevealedHints(0);
    setLeftTab("brief");

    setLoadingSubs(true);
    labApi
      .getSubmissions(activeLab.id)
      .then((rows) => {
        setSubmissions(Array.isArray(rows) ? rows : []);
        if (rows && rows.length > 0) {
          setLatestEvaluation(rows[0]);
        }
      })
      .catch(() => setSubmissions([]))
      .finally(() => setLoadingSubs(false));
  }, [activeLab?.id]);

  const filteredChallenges = useMemo(() => {
    if (trackFilter === "semua") return challenges;
    return challenges.filter((c) => {
      const t = c.track.toLowerCase();
      if (trackFilter === "backend") return t.includes("backend") || t.includes("sql");
      return t.includes(trackFilter);
    });
  }, [challenges, trackFilter]);

  const completedCount = challenges.filter((c) => c.passed).length;

  const handleRunTests = async () => {
    if (!activeLab || runningSandbox) return;

    if (activeLab.language === "sql") {
      const preview = runSqlSandboxPreview(code);
      setSqlPreview(preview);
      setTestResults(null);
      showToast?.(preview.message, preview.valid ? "success" : "error");
      return;
    }

    if (activeLab.language !== "javascript") {
      showToast?.("Studi kasus teks/BUMN dievaluasi penuh menggunakan Evaluasi AI Rubrik.", "info");
      return;
    }

    setRunningSandbox(true);
    try {
      const execResult = await runJsInWorker(code, activeLab.testCases || [], 2000);
      setTestResults(execResult.results);
      setSandboxLogs(execResult.logs || []);
      const passedCount = execResult.results.filter((r) => r.passed).length;
      if (execResult.timedOut) {
        showToast?.("Sandbox dihentikan otomatis karena melebihi batas waktu 2 detik.", "error");
      } else {
        showToast?.(
          passedCount === execResult.results.length
            ? `Semua ${execResult.results.length} uji otomatis Web Worker lulus!`
            : `${passedCount} dari ${execResult.results.length} uji otomatis lulus.`,
          passedCount === execResult.results.length ? "success" : "info"
        );
      }
    } finally {
      setRunningSandbox(false);
    }
  };

  const handleEvaluateAi = async () => {
    if (!activeLab || evaluating) return;
    if (code.trim().length < 20) {
      showToast?.("Tuliskan implementasi atau analisis minimal 20 karakter terlebih dahulu.", "error");
      return;
    }

    let currentReport = testResults;
    if (activeLab.language === "javascript" && !currentReport) {
      const execResult = await runJsInWorker(code, activeLab.testCases || [], 2000);
      currentReport = execResult.results;
      setTestResults(currentReport);
      setSandboxLogs(execResult.logs || []);
    }

    const passedCount = currentReport ? currentReport.filter((r) => r.passed).length : 0;
    const totalCount = currentReport ? currentReport.length : 0;

    setEvaluating(true);
    try {
      const res = await labApi.evaluate({
        challengeId: activeLab.id,
        codeOrAnswer: code,
        testPassedCount: passedCount,
        testTotalCount: totalCount,
        testReport: currentReport || undefined,
      });

      setLatestEvaluation(res.submission);
      setSubmissions((prev) => [res.submission, ...prev]);
      if (res.profile) onProfileUpdate(res.profile);

      // Update challenge list stats locally
      setChallenges((prev) =>
        prev.map((c) =>
          c.id === activeLab.id
            ? {
                ...c,
                bestScore: Math.max(c.bestScore || 0, res.submission.score),
                passed: c.passed || res.submission.passed,
                attemptsCount: (c.attemptsCount || 0) + 1,
              }
            : c
        )
      );

      showToast?.(
        res.submission.passed
          ? `Lulus! Skor ${res.submission.score}/100 (+${res.submission.earnedXp} XP)`
          : `Evaluasi selesai: Skor ${res.submission.score}/100. Periksa saran perbaikan.`,
        res.submission.passed ? "success" : "info"
      );
    } catch (err: any) {
      showToast?.(err?.message || "Gagal mengevaluasi solusi.", "error");
    } finally {
      setEvaluating(false);
    }
  };

  // --- WORKSPACE VIEW (When a lab is selected) ---
  if (routeLabId && activeLab) {
    const canRunSandbox =
      (activeLab.language === "javascript" && activeLab.testCases.length > 0) ||
      activeLab.language === "sql";

    return (
      <div className="space-y-4 pb-4">
        {/* Top Workspace Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-zinc-200/90 dark:border-zinc-800/90">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate("/lab")}
              className="h-8 w-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
              aria-label="Kembali ke daftar lab"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{activeLab.track}</span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span>{activeLab.difficulty}</span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span className="font-mono">{activeLab.estimatedMinutes} mnt</span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-medium">
                  +{activeLab.xpReward} XP
                </span>
              </div>
              <h1 className="font-display text-lg sm:text-xl font-semibold text-zinc-950 dark:text-zinc-50 truncate">
                {activeLab.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenCopilot && (
              <button
                type="button"
                onClick={() =>
                  onOpenCopilot({
                    labTitle: activeLab.title,
                    codeSnippet: code,
                  })
                }
                className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:border-zinc-300 dark:hover:border-zinc-700 text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              >
                <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Tanya AI
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setCode(activeLab.starterCode);
                setTestResults(null);
              }}
              className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-medium text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Mobile Pane Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 lg:hidden">
          <button
            type="button"
            onClick={() => setMobilePane("editor")}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mobilePane === "editor"
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            Editor &amp; Uji Kode
          </button>
          <button
            type="button"
            onClick={() => setMobilePane("brief")}
            className={`py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mobilePane === "brief"
                ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs"
                : "text-zinc-500 dark:text-zinc-400"
            }`}
          >
            Brief &amp; Rubrik
          </button>
        </div>

        {/* 2-Zone Split Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT ZONE: Brief, Rubric, Hints, History */}
          <div className={`${mobilePane === "brief" ? "block" : "hidden lg:block"} lg:col-span-5 lg:sticky lg:top-4 bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden`}>
            {/* Underline Tab Strip */}
            <div className="flex border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-950/30 px-2 pt-1.5 gap-1">
              {[
                { id: "brief", label: "Brief Kasus" },
                { id: "rubric", label: "Rubrik & Uji" },
                { id: "history", label: `Riwayat (${submissions.length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setLeftTab(t.id as any)}
                  className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer tabular-nums ${
                    leftTab === t.id
                      ? "border-emerald-600 text-zinc-950 dark:text-zinc-50"
                      : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-5 space-y-5 max-h-[calc(100dvh-11rem)] overflow-y-auto">
              {leftTab === "brief" && (
                <>
                  <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                    {activeLab.promptMarkdown}
                  </div>

                  {/* Skills Verified */}
                  {activeLab.skills.length > 0 && (
                    <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Kompetensi terverifikasi
                      </p>
                      <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {activeLab.skills.join(" · ")}
                      </p>
                    </div>
                  )}

                  {/* Progressive Hints */}
                  {activeLab.hints.length > 0 && (
                    <div className="pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 tabular-nums">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                          Petunjuk bertahap ({revealedHints}/{activeLab.hints.length})
                        </span>
                        {revealedHints < activeLab.hints.length && (
                          <button
                            type="button"
                            onClick={() => setRevealedHints((h) => Math.min(activeLab.hints.length, h + 1))}
                            className="text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            Buka petunjuk #{revealedHints + 1}
                          </button>
                        )}
                      </div>
                      {revealedHints > 0 && (
                        <ul className="space-y-2">
                          {activeLab.hints.slice(0, revealedHints).map((hint, i) => (
                            <li
                              key={i}
                              className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50/70 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg p-3"
                            >
                              <span className="font-mono text-[11px] text-zinc-400 mr-2">#{i + 1}</span>
                              {hint}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </>
              )}

              {leftTab === "rubric" && (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Bobot penilaian rubrik AI (lulus ≥ 75)
                    </h3>
                    <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg">
                      {activeLab.rubricCriteria.map((rc, i) => (
                        <div key={i} className="p-3 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{rc.title}</span>
                            <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                              {rc.weight}%
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{rc.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeLab.testCases.length > 0 && (
                    <div className="space-y-2.5">
                      <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
                        Skenario uji otomatis ({activeLab.testCases.length})
                      </h3>
                      <div className="space-y-2">
                        {activeLab.testCases.map((tc, i) => (
                          <div
                            key={i}
                            className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 space-y-1 text-xs"
                          >
                            <p className="font-semibold text-zinc-800 dark:text-zinc-200">{tc.label}</p>
                            <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 break-all">
                              Expected: {JSON.stringify(tc.expected)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {leftTab === "history" && (
                <div className="space-y-3">
                  {loadingSubs ? (
                    <p className="text-xs text-zinc-500">Memuat riwayat evaluasi...</p>
                  ) : submissions.length === 0 ? (
                    <div className="py-8 text-center space-y-1">
                      <History className="w-6 h-6 text-zinc-300 dark:text-zinc-700 mx-auto" />
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Belum ada pengajuan untuk lab ini.
                      </p>
                    </div>
                  ) : (
                    submissions.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setLatestEvaluation(sub);
                          setCode(sub.codeOrAnswer);
                        }}
                        className="w-full text-left p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 transition-colors space-y-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold tabular-nums text-zinc-950 dark:text-white">
                            Skor {sub.score}/100
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              sub.passed
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            {sub.passed ? "Lulus" : "Perlu Revisi"}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {sub.aiFeedback}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT ZONE: Code / Case Editor + Test Output + AI Rubric Scorecard */}
          <div className={`${mobilePane === "editor" ? "block" : "hidden lg:block"} lg:col-span-7 space-y-4`}>
            {/* Editor Container */}
            <div className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/40 flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" />
                  {activeLab.language === "javascript"
                    ? "solution.js"
                    : activeLab.language === "sql"
                    ? "query.sql"
                    : "analisis-kasus.md"}
                </span>

                <div className="flex items-center gap-2">
                  {activeLab.track.toLowerCase().includes("frontend") && (
                    <button
                      type="button"
                      onClick={() => setShowLivePreview((p) => !p)}
                      className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                    >
                      {showLivePreview ? "Tutup Preview" : "Live Preview"}
                    </button>
                  )}

                  {canRunSandbox && (
                    <button
                      type="button"
                      onClick={handleRunTests}
                      disabled={runningSandbox}
                      className="h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-50 text-xs font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      {runningSandbox ? "Menjalankan..." : activeLab.language === "sql" ? "Preview SQL" : "Jalankan Uji"}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleEvaluateAi}
                    disabled={evaluating}
                    className="h-8 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {evaluating ? "Mengevaluasi..." : "Evaluasi AI"}
                  </button>
                </div>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                aria-label="Editor solusi Interactive Lab"
                className="w-full min-h-[300px] sm:min-h-[340px] p-4 bg-zinc-950 text-zinc-100 font-mono text-xs sm:text-[13px] leading-relaxed focus:outline-none resize-y"
              />
            </div>

            {showLivePreview && activeLab.track.toLowerCase().includes("frontend") && (
              <div className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-950/40 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  Live Frontend Preview (Sandboxed Iframe)
                </div>
                <iframe
                  title="Preview Hasil Frontend"
                  sandbox="allow-scripts"
                  srcDoc={buildFrontendPreviewHtml(code)}
                  className="w-full h-56 bg-white border-0"
                />
              </div>
            )}

            {/* Client Sandbox Test Runner Output */}
            {testResults && (
              <div className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Hasil eksekusi Web Worker sandbox
                  </h3>
                  <span className="text-xs font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {testResults.filter((t) => t.passed).length}/{testResults.length} Lulus
                  </span>
                </div>
                {sandboxLogs.length > 0 && (
                  <pre className="p-3 rounded-lg bg-zinc-950 text-emerald-300 font-mono text-[11px] overflow-x-auto">
                    {sandboxLogs.join("\n")}
                  </pre>
                )}
                <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-lg">
                  {testResults.map((res, idx) => (
                    <div key={idx} className="p-3 flex items-start gap-2.5 text-xs">
                      {res.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">{res.label}</p>
                        <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 break-all">
                          {res.details}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In-Browser SQL Preview Table */}
            {sqlPreview && (
              <div className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    SQL Sandbox Preview
                  </h3>
                  <span className={`text-xs font-medium ${sqlPreview.valid ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
                    {sqlPreview.valid ? "Query Valid" : "Perlu Perbaikan"}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{sqlPreview.message}</p>
                {sqlPreview.valid && sqlPreview.rows.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-zinc-200/80 dark:border-zinc-800/80">
                    <table className="w-full text-left text-[11px] font-mono tabular-nums">
                      <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200">
                        <tr>
                          {sqlPreview.columns.map((col) => (
                            <th key={col} className="px-3 py-2 border-b border-zinc-200/80 dark:border-zinc-800">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {sqlPreview.rows.map((r, rIdx) => (
                          <tr key={rIdx}>
                            {sqlPreview.columns.map((col) => (
                              <td key={col} className="px-3 py-2">{String(r[col] ?? "")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* AI Rubric Scorecard */}
            {latestEvaluation && (
              <div className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-5 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Laporan evaluasi rubrik AI
                    </p>
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 max-w-xl leading-relaxed">
                      {latestEvaluation.aiFeedback}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-3xl font-bold tabular-nums text-zinc-950 dark:text-white">
                      {latestEvaluation.score}
                      <span className="text-sm text-zinc-400 font-normal">/100</span>
                    </p>
                    <p
                      className={`text-xs font-semibold ${
                        latestEvaluation.passed
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {latestEvaluation.passed
                        ? `Lulus · +${latestEvaluation.earnedXp} XP`
                        : `Belum Lulus · +${latestEvaluation.earnedXp} XP`}
                    </p>
                  </div>
                </div>

                {/* Per-criterion bars */}
                {latestEvaluation.rubricScores.length > 0 && (
                  <div className="space-y-3">
                    {latestEvaluation.rubricScores.map((rs, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">{rs.criterion}</span>
                          <span className="font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
                            {rs.score}/100
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${Math.max(0, Math.min(100, rs.score))}%` }}
                          />
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{rs.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {latestEvaluation.strengths.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        Kekuatan Implementasi
                      </h4>
                      <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                        {latestEvaluation.strengths.map((s, i) => (
                          <li key={i}>· {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {latestEvaluation.improvements.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        Saran Perbaikan
                      </h4>
                      <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
                        {latestEvaluation.improvements.map((s, i) => (
                          <li key={i}>· {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Refactored Reference Snippet */}
                {latestEvaluation.refactoredSnippet && (
                  <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      Contoh Pendekatan / Refactor Referensi
                    </h4>
                    <pre className="p-3.5 rounded-lg bg-zinc-950 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
                      <code>{latestEvaluation.refactoredSnippet}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- CATALOG VIEW ---
  return (
    <div className="space-y-6 pb-16 lg:pb-8">
      {/* Editorial Header Banner */}
      <div className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Interactive Coding &amp; Case Lab
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight leading-tight">
              Uji Keterampilan Nyata di Sandbox Industri dengan Audit Rubrik AI
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
              Kerjakan tantangan Frontend, Backend &amp; SQL, Data Analytics, hingga studi kasus BUMN untuk memverifikasi skill dan meningkatkan Talent Match Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
            <div>
              <span className="font-mono text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50 block">
                {completedCount}/{challenges.length}
              </span>
              <span>Lab terverifikasi</span>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div>
              <span className="font-mono text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50 block">
                ≥ 75
              </span>
              <span>Ambang lulus rubrik</span>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div>
              <span className="font-mono text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 block">
                +5%
              </span>
              <span>Bonus Talent Match</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[190px] bg-zinc-950 border-t lg:border-t-0 lg:border-l border-zinc-200/80 dark:border-zinc-800/80">
          <img
            src={resolveCourseImage("editorial_coding_lab_1795521088285.jpg")}
            alt="Workspace Interactive Coding Lab Skillora"
            className="w-full h-full object-cover opacity-90"
          />
        </div>
      </div>

      {/* Segmented Track Filter */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-zinc-200/90 dark:border-zinc-800/90 hide-scrollbar">
        {TRACK_TABS.map((tab) => {
          const isActive = trackFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTrackFilter(tab.id)}
              className={`relative px-3.5 py-2.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? "text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-600 dark:bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Challenges Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-52 rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#111114] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChallenges.map((lab) => (
            <div
              key={lab.id}
              onClick={() => navigate(`/lab/${lab.id}`)}
              className="group bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700 rounded-xl p-5 flex flex-col justify-between gap-4 transition-colors cursor-pointer"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                  <span className="font-medium text-zinc-600 dark:text-zinc-400">
                    {lab.track} · {lab.difficulty}
                  </span>
                  {lab.passed ? (
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {lab.bestScore}/100
                    </span>
                  ) : (
                    <span className="font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lab.estimatedMinutes}m
                    </span>
                  )}
                </div>

                <h2 className="font-display text-base font-semibold text-zinc-950 dark:text-zinc-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                  {lab.title}
                </h2>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed line-clamp-3">
                  {lab.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
                  +{lab.xpReward} XP · +{lab.gemsReward} Gems
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 inline-flex items-center gap-1 transition-colors">
                  {lab.passed ? "Kerjakan Ulang" : "Mulai Lab"}
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default InteractiveLabView;
