import React from "react";
import { Route } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";

export type GoalType = "magang" | "kerja" | "freelance" | "bumn";

interface LearningPathRoadmapProps {
  selectedGoal: GoalType;
  setSelectedGoal: (goal: GoalType) => void;
}

export function LearningPathRoadmap({
  selectedGoal,
  setSelectedGoal
}: LearningPathRoadmapProps) {
  const learningPaths = {
    magang: {
      title: "Path Magang Readiness (Internship 2026)",
      desc: "Dirancang untuk mahasiswa & fresh grad yang menargetkan posisi magang frontend/UI.",
      steps: [
        { title: "Pengenalan Frontend & HTML/CSS", status: "Selesai", progress: 100 },
        { title: "React Fundamentals & Component Architecture", status: "Sedang Berjalan", progress: 65 },
        { title: "Portofolio Proyek Praktik & Git Setup", status: "Mendatang", progress: 0 }
      ]
    },
    kerja: {
      title: "Path Karir Full-Time Engineer",
      desc: "Langkah lengkap dari dasar hingga sertifikasi standar industri & rekomendasi penyaluran.",
      steps: [
        { title: "Frontend & Fullstack Core Mastery", status: "Selesai", progress: 100 },
        { title: "Simulasi Wawancara HR & Technical Test", status: "Sedang Berjalan", progress: 40 },
        { title: "Review Proyek Portofolio Praktik", status: "Mendatang", progress: 0 }
      ]
    },
    freelance: {
      title: "Path Freelance & Client Services",
      desc: "Fokus pada pembuatan UI/UX kilat, pengerjaan proyek riil, dan penawaran jasa.",
      steps: [
        { title: "Fast-Track UI/UX & Tailwind Componenting", status: "Sedang Berjalan", progress: 80 },
        { title: "Portofolio Live Web & Case Studies", status: "Mendatang", progress: 0 }
      ]
    },
    bumn: {
      title: "Path Seleksi Kerja BUMN & CPNS 2026",
      desc: "Fokus latihan soal TKD, Tes Akhlak, TPA, dan Simulasi STAR Interview.",
      steps: [
        { title: "Bank Soal TKD & BUMN Mock Test", status: "Sedang Berjalan", progress: 50 },
        { title: "Simulasi Wawancara BUMN (AI HR)", status: "Mendatang", progress: 0 }
      ]
    }
  };

  const activePathDetails = learningPaths[selectedGoal];

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-subtle space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h2 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Route className="w-4 h-4" />
            </div>
            <span>Roadmap Learning Path Target Karir</span>
          </h2>
        </div>

        {/* Goal Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold shrink-0 overflow-x-auto hide-scrollbar">
          {(
            [
              { id: "magang", label: "🎓 Magang" },
              { id: "kerja", label: "💼 Full-Time" },
              { id: "freelance", label: "🚀 Freelance" },
              { id: "bumn", label: "🏢 BUMN / CPNS" }
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedGoal(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedGoal === tab.id
                  ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-2xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Path Details */}
      <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">{activePathDetails.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activePathDetails.desc}</p>
        </div>

        <div className="space-y-2 pt-1">
          {activePathDetails.steps.map((step, idx) => (
            <div 
              key={idx} 
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs shadow-subtle"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-800/40">
                  {idx + 1}
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{step.title}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant={
                    step.status === "Selesai" 
                      ? "success" 
                      : step.status === "Sedang Berjalan" 
                      ? "primary" 
                      : "neutral"
                  }
                  size="sm"
                >
                  {step.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
