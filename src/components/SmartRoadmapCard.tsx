import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, CheckSquare, Square, ArrowUpRight, RefreshCw, Clock } from "lucide-react";
import { StudyRoadmapRecord } from "../types";
import { studyApi } from "../api/apiClient";

interface SmartRoadmapCardProps {
  defaultRole?: string;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

const TARGET_ROLES = [
  "Frontend Engineer",
  "Fullstack Engineer",
  "Backend & SQL Engineer",
  "Data Analyst",
  "Kesiapan Rekrutmen BUMN",
];

export function SmartRoadmapCard({ defaultRole = "Frontend Engineer", showToast }: SmartRoadmapCardProps) {
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState<StudyRoadmapRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [role, setRole] = useState(defaultRole);
  const [hours, setHours] = useState(8);
  const [activeWeek, setActiveWeek] = useState(1);

  useEffect(() => {
    studyApi
      .getRoadmap()
      .then((data) => {
        setRoadmap(data);
        if (data?.targetRole) setRole(data.targetRole);
        if (data?.hoursPerWeek) setHours(data.hoursPerWeek);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const next = await studyApi.generateRoadmap(role, hours);
      setRoadmap(next);
      setActiveWeek(1);
      showToast?.("Smart Roadmap 4 minggu berhasil disusun AI.", "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal menyusun roadmap belajar.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!roadmap) return;
    try {
      const updated = await studyApi.toggleRoadmapTask(roadmap.id, taskId);
      setRoadmap(updated);
    } catch (err: any) {
      showToast?.(err?.message || "Gagal memperbarui progres roadmap.", "error");
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 h-48 animate-pulse" />
    );
  }

  const selectedWeek = roadmap?.weeks.find((w) => w.weekNumber === activeWeek) || roadmap?.weeks[0];

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
            Smart Weekly Study Roadmap · AI Adaptif
          </p>
          <h2 className="font-display text-lg font-bold text-zinc-950 dark:text-white">
            {roadmap ? `Rencana 4 Minggu: ${roadmap.targetRole}` : "Susun Rencana Belajar 4 Minggu Anda"}
          </h2>
          {roadmap && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
              {roadmap.summary}
            </p>
          )}
        </div>

        {/* Inline Generator Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Target peran karier"
            className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-medium text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            {TARGET_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            aria-label="Jam belajar per minggu"
            className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-emerald-500"
          >
            {[5, 8, 12, 16].map((h) => (
              <option key={h} value={h}>
                {h} jam/mgg
              </option>
            ))}
          </select>

          <button
            disabled={generating}
            onClick={handleGenerate}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            {roadmap ? <RefreshCw className={`w-3.5 h-3.5 ${generating ? "animate-spin" : ""}`} /> : <Sparkles className="w-3.5 h-3.5" />}
            {generating ? "Menyusun..." : roadmap ? "Perbarui AI" : "Susun Roadmap"}
          </button>
        </div>
      </div>

      {roadmap && selectedWeek ? (
        <div className="space-y-4">
          {/* Progress Strip + Week Selector */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
              {roadmap.weeks.map((w) => (
                <button
                  key={w.weekNumber}
                  onClick={() => setActiveWeek(w.weekNumber)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    selectedWeek.weekNumber === w.weekNumber
                      ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                  }`}
                >
                  Minggu {w.weekNumber}
                </button>
              ))}
            </div>
            <span className="text-xs font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
              Progres Total: <strong className="text-emerald-600 dark:text-emerald-400">{roadmap.progressPercent}%</strong>
            </span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${roadmap.progressPercent}%` }}
            />
          </div>

          {/* Active Week Tasks */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              {selectedWeek.theme} — <span className="font-normal text-zinc-500 dark:text-zinc-400">{selectedWeek.objective}</span>
            </p>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              {selectedWeek.tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className="flex items-start gap-2.5 text-left min-w-0 flex-1 cursor-pointer"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={`text-xs font-medium ${
                          task.completed
                            ? "line-through text-zinc-400"
                            : "text-zinc-900 dark:text-zinc-100"
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <span className="uppercase">{task.type}</span>
                        <span>·</span>
                        <Clock className="w-3 h-3" />
                        <span>{task.estimatedMinutes} mnt</span>
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate(task.targetPath)}
                    className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    Buka
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400">
          Pilih target peran dan jam belajar per minggu di atas, lalu klik <strong>Susun Roadmap</strong> untuk membuat rencana belajar 4 minggu yang langsung terhubung ke Lab Interaktif, Kursus, dan Arena.
        </div>
      )}
    </section>
  );
}
