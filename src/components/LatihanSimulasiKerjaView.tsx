import { useState, useEffect, useCallback } from "react";
import { Building2, ShieldCheck, Flame, Layers, History } from "lucide-react";
import { Profile, SimulationAttemptRecord } from "../types";
import { trainingApi } from "../api/apiClient";
import { SimulasiTKDTab } from "./simulasi/SimulasiTKDTab";
import { SimulasiSTARTab } from "./simulasi/SimulasiSTARTab";
import { SimulasiKraepelinTab } from "./simulasi/SimulasiKraepelinTab";
import { SimulasiTahapKerjaTab } from "./simulasi/SimulasiTahapKerjaTab";

interface LatihanSimulasiKerjaViewProps {
  profile: Profile;
  onAddXp?: (xp: number) => void;
  onProfileUpdate?: (profile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

const SIM_TYPE_LABELS: Record<string, string> = {
  tkd: "CAT TKD & AKHLAK",
  kraepelin: "Psikotes Kraepelin",
  decision: "Keputusan Kerja",
  star: "Wawancara STAR AI",
};

export function LatihanSimulasiKerjaView({
  onAddXp,
  onProfileUpdate,
  showToast,
}: LatihanSimulasiKerjaViewProps) {
  const [activeTab, setActiveTab] = useState<"decision" | "tkd" | "kraepelin" | "interview">(
    "tkd"
  );
  const [recentSimulations, setRecentSimulations] = useState<SimulationAttemptRecord[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const list = await trainingApi.getSimulationHistory();
      setRecentSimulations(Array.isArray(list) ? list : []);
    } catch {
      // silent fallback
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const tabs = [
    { id: "tkd" as const, label: "Tes TKD & AKHLAK (20 Soal)", icon: Building2 },
    { id: "kraepelin" as const, label: "Tes Ketelitian Kraepelin", icon: Flame },
    { id: "decision" as const, label: "Studi Kasus Kerja (4 Skenario)", icon: Layers },
    { id: "interview" as const, label: "Latihan Wawancara HRD AI", icon: ShieldCheck },
  ];

  return (
    <div className="w-full space-y-5">
      {/* Modern Editorial SaaS Header */}
      <header className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
              Simulasi Seleksi Kerja Gratis · BUMN · CPNS · Perusahaan
            </p>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-zinc-950 dark:text-white">
              Simulasi Tes Kerja, Psikotes &amp; Wawancara AI
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Berlatih soal TKD &amp; AKHLAK 20 nomor, tes ketelitian angka Kraepelin, simulasi pengambilan keputusan di kantor, serta latihan menjawab wawancara HRD dengan penilaian AI.
            </p>
          </div>

          {recentSimulations.length > 0 && (
            <div className="flex items-center gap-4 px-4 py-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-xs font-mono tabular-nums shrink-0">
              <div>
                <span className="text-zinc-500 block text-[11px]">Total Sesi</span>
                <span className="font-bold text-zinc-950 dark:text-white">
                  {recentSimulations.length} Riwayat
                </span>
              </div>
              <div className="h-7 w-px bg-zinc-200 dark:bg-zinc-800" />
              <div>
                <span className="text-zinc-500 block text-[11px]">Skor Terakhir</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {recentSimulations[0].score}/100
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Single-Line Tab Bar */}
        <div className="flex items-center gap-1.5 pt-4 border-t border-zinc-200 dark:border-zinc-800 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Active Simulation Tab */}
      {activeTab === "tkd" && (
        <SimulasiTKDTab
          onAddXp={onAddXp}
          onProfileUpdate={onProfileUpdate}
          onSimulationRecorded={loadHistory}
          showToast={showToast}
        />
      )}
      {activeTab === "kraepelin" && (
        <SimulasiKraepelinTab
          onAddXp={onAddXp}
          onProfileUpdate={onProfileUpdate}
          onSimulationRecorded={loadHistory}
          showToast={showToast}
        />
      )}
      {activeTab === "decision" && (
        <SimulasiTahapKerjaTab
          onAddXp={onAddXp}
          onProfileUpdate={onProfileUpdate}
          onSimulationRecorded={loadHistory}
          showToast={showToast}
        />
      )}
      {activeTab === "interview" && (
        <SimulasiSTARTab
          onProfileUpdate={onProfileUpdate}
          onSimulationRecorded={loadHistory}
          showToast={showToast}
        />
      )}

      {/* Cloud-Saved Simulation History Strip */}
      {recentSimulations.length > 0 && (
        <section className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-600" />
              Riwayat Simulasi Tersimpan di Cloud ({recentSimulations.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {recentSimulations.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                    {SIM_TYPE_LABELS[item.simType] || item.simType}
                  </p>
                  <p className="font-semibold text-zinc-950 dark:text-white truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    {new Date(item.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="font-mono font-bold text-sm tabular-nums text-zinc-950 dark:text-white shrink-0">
                  {item.score}/100
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
