import { useState } from "react";
import { Building2, Activity, ShieldCheck, Flame, Layers } from "lucide-react";
import { Profile } from "../types";
import { SimulasiTKDTab } from "./simulasi/SimulasiTKDTab";
import { SimulasiSTARTab } from "./simulasi/SimulasiSTARTab";
import { SimulasiKraepelinTab } from "./simulasi/SimulasiKraepelinTab";
import { SimulasiTahapKerjaTab } from "./simulasi/SimulasiTahapKerjaTab";

interface LatihanSimulasiKerjaViewProps {
  profile: Profile;
  onAddXp?: (xp: number) => void;
}

export function LatihanSimulasiKerjaView({ profile, onAddXp }: LatihanSimulasiKerjaViewProps) {
  const [activeTab, setActiveTab] = useState<"decision" | "tkd" | "kraepelin" | "interview">("decision");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="p-6 bg-slate-900 text-white rounded-3xl relative overflow-hidden shadow-xl">
        <div className="max-w-2xl relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
            <Building2 className="w-3.5 h-3.5" />
            Simulasi Rekrutmen & Ujian Industri
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Simulasi Kerja & Rekrutmen FHCI BUMN</h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Pusat simulasi kasus keputusan kerja multi-tahap, CAT TKD, tes ketahanan Kraepelin, dan latihan wawancara STAR untuk mempersiapkan karir industri Anda.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("decision")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "decision"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Simulasi Keputusan Skenario (Multi-Tahap)</span>
        </button>

        <button
          onClick={() => setActiveTab("tkd")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "tkd"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>CAT TKD & AKHLAK</span>
        </button>

        <button
          onClick={() => setActiveTab("kraepelin")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "kraepelin"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>Tes Kraepelin & Speed Math</span>
        </button>

        <button
          onClick={() => setActiveTab("interview")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "interview"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Wawancara STAR & HRD AI</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "decision" && <SimulasiTahapKerjaTab onAddXp={onAddXp} />}
      {activeTab === "tkd" && <SimulasiTKDTab onAddXp={onAddXp} />}
      {activeTab === "kraepelin" && <SimulasiKraepelinTab onAddXp={onAddXp} />}
      {activeTab === "interview" && <SimulasiSTARTab />}
    </div>
  );
}

