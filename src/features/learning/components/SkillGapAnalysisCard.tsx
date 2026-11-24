import React from "react";
import { BarChart2, CheckCircle2, AlertCircle } from "lucide-react";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { Select } from "../../../components/ui/Select";
import { Badge } from "../../../components/ui/Badge";

interface SkillGapAnalysisCardProps {
  targetRole: string;
  setTargetRole: (role: string) => void;
  skillGapAnalysis: {
    matched: string[];
    missing: string[];
    gapPercentage: number;
  };
  onNavigateToKatalog: () => void;
}

export function SkillGapAnalysisCard({
  targetRole,
  setTargetRole,
  skillGapAnalysis,
  onNavigateToKatalog
}: SkillGapAnalysisCardProps) {
  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BarChart2 className="w-4 h-4" />
            </div>
            <span>Analisis Kesenjangan Skill (Skill Gap)</span>
          </h2>
        </div>

        {/* Role Picker */}
        <div className="w-full sm:w-64">
          <Select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            options={[
              { value: "Frontend Engineer", label: "Target: Frontend Engineer" },
              { value: "Fullstack Engineer", label: "Target: Fullstack Engineer" },
              { value: "UI/UX Designer", label: "Target: UI/UX Designer" },
              { value: "Kesiapan BUMN & TPA", label: "Target: Seleksi BUMN & TKD" }
            ]}
          />
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-600 dark:text-slate-300">Tingkat Kesiapan Kebutuhan Industri</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold">{skillGapAnalysis.gapPercentage}% Terpenuhi</span>
        </div>

        <ProgressBar
          value={skillGapAnalysis.gapPercentage}
          variant={skillGapAnalysis.gapPercentage >= 80 ? "success" : "info"}
          size="md"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Matched skills */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Skill Dikuasai ({skillGapAnalysis.matched.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skillGapAnalysis.matched.length > 0 ? (
                skillGapAnalysis.matched.map((sk, i) => (
                  <Badge key={i} variant="success" size="sm">
                    {sk}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">Belum ada skill terkonfirmasi.</span>
              )}
            </div>
          </div>

          {/* Missing skills */}
          <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>Skill Perlu Dipelajari ({skillGapAnalysis.missing.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skillGapAnalysis.missing.length > 0 ? (
                skillGapAnalysis.missing.map((sk, i) => (
                  <button 
                    key={i} 
                    onClick={onNavigateToKatalog}
                    className="px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-semibold hover:bg-amber-200/80 dark:hover:bg-amber-800/80 cursor-pointer transition-colors border border-amber-200/60 dark:border-amber-700/50"
                  >
                    + {sk} (Pelajari)
                  </button>
                ))
              ) : (
                <span className="text-xs text-emerald-600 font-bold">Hebat! Semua skill target terpenuhi.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
