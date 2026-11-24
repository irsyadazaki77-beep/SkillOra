import { useState } from "react";
import { Calculator, DollarSign, Target, CheckCircle2, AlertCircle, ArrowRight, Sparkles, BookOpen } from "lucide-react";
import { playSound } from "../utils/sound";
import { useNavigate } from "react-router-dom";

interface SkillItem {
  id: string;
  name: string;
  weight: number; // percentage value
}

interface CareerRole {
  title: string;
  category: string;
  minSalary: number; // in Millions IDR
  maxSalary: number; // in Millions IDR
  requiredSkills: SkillItem[];
}

const CAREER_ROLES: CareerRole[] = [
  {
    title: "Frontend React Engineer",
    category: "Software Development",
    minSalary: 7,
    maxSalary: 14,
    requiredSkills: [
      { id: "react", name: "React.js & Hooks", weight: 25 },
      { id: "ts", name: "TypeScript Core", weight: 20 },
      { id: "tailwind", name: "Tailwind CSS & Responsive UI", weight: 15 },
      { id: "git", name: "Git & Version Control", weight: 15 },
      { id: "state", name: "State Management (Zustand/Redux)", weight: 15 },
      { id: "api", name: "REST API Integration", weight: 10 },
    ],
  },
  {
    title: "Fullstack Node.js Engineer",
    category: "Software Development",
    minSalary: 9,
    maxSalary: 18,
    requiredSkills: [
      { id: "react", name: "React.js Frontend", weight: 20 },
      { id: "node", name: "Node.js & Express API", weight: 25 },
      { id: "db", name: "PostgreSQL / MongoDB Database", weight: 20 },
      { id: "ts", name: "TypeScript Fullstack", weight: 15 },
      { id: "auth", name: "Auth & Security (JWT/OAuth)", weight: 10 },
      { id: "git", name: "Git & Deployment", weight: 10 },
    ],
  },
  {
    title: "Management Trainee (MT) BUMN",
    category: "BUMN & Corporate",
    minSalary: 8,
    maxSalary: 16,
    requiredSkills: [
      { id: "tkd", name: "Lolos Simulasi TKD BUMN (Skor > 75)", weight: 30 },
      { id: "star", name: "Metode Wawancara STAR", weight: 25 },
      { id: "english", name: "Bahasa Inggris Provisi (TOEIC/IELTS)", weight: 15 },
      { id: "kraepelin", name: "Ketahanan Kerja (Tes Kraepelin)", weight: 15 },
      { id: "leadership", name: "Leadership & Case Analysis", weight: 15 },
    ],
  },
  {
    title: "UI/UX Product Designer",
    category: "Design & Product",
    minSalary: 6,
    maxSalary: 13,
    requiredSkills: [
      { id: "figma", name: "Figma & Auto-Layout System", weight: 30 },
      { id: "research", name: "User Research & Usability Testing", weight: 20 },
      { id: "wireframe", name: "Wireframing & Prototyping", weight: 20 },
      { id: "ds", name: "Design System Tokens", weight: 15 },
      { id: "portfolio", name: "Portofolio Studi Kasus Live", weight: 15 },
    ],
  },
];

export function CareerReadinessCalculator() {
  const navigate = useNavigate();
  const [selectedRoleIndex, setSelectedRoleIndex] = useState<number>(0);
  const [checkedSkills, setCheckedSkills] = useState<Record<string, boolean>>({
    react: true,
    tailwind: true,
    git: true,
    tkd: true,
  });
  const [targetSalary, setTargetSalary] = useState<number>(8);

  const currentRole = CAREER_ROLES[selectedRoleIndex];

  const handleToggleSkill = (skillId: string) => {
    playSound("click");
    setCheckedSkills((prev) => ({ ...prev, [skillId]: !prev[skillId] }));
  };

  // Calculate readiness score
  const totalScore = currentRole.requiredSkills.reduce((acc, skill) => {
    return acc + (checkedSkills[skill.id] ? skill.weight : 0);
  }, 0);

  // Projected salary based on score
  const projectedSalary = Math.round(
    currentRole.minSalary +
      (totalScore / 100) * (currentRole.maxSalary - currentRole.minSalary)
  );

  return (
    <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800/50 mb-1">
            <Calculator className="w-3.5 h-3.5" /> Kalkulator Kesiapan Karir & Target Gaji
          </div>
          <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">
            Hitung Persentase Kelayakan & Ekspektasi Gaji
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Pilih target posisi karir dan tandai keahlian yang Anda miliki untuk melihat estimasi gaji realistis.
          </p>
        </div>

        {/* Role Selector */}
        <select aria-label="Input field"
          value={selectedRoleIndex}
          onChange={(e) => {
            playSound("click");
            setSelectedRoleIndex(Number(e.target.value));
          }}
          className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
        >
          {CAREER_ROLES.map((role, idx) => (
            <option key={idx} value={idx}>
              🎯 {role.title} ({role.category})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SKILLS CHECKLIST (2 COLS) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Tandai Keahlian & Kualifikasi yang Anda Kuasai:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentRole.requiredSkills.map((skill) => {
              const isChecked = !!checkedSkills[skill.id];
              return (
                <div
                  key={skill.id}
                  onClick={() => handleToggleSkill(skill.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isChecked
                      ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/60 shadow-2xs"
                      : "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                        isChecked
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {skill.name}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                    +{skill.weight}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* TARGET SALARY SLIDER */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-emerald-600" /> Target Ekspektasi Gaji Bulanan Anda:
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 text-sm font-extrabold">
                Rp {targetSalary}.000.000 / Bulan
              </span>
            </div>
            <input aria-label="Input field"
              type="range"
              min={currentRole.minSalary}
              max={currentRole.maxSalary + 5}
              value={targetSalary}
              onChange={(e) => setTargetSalary(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-400 font-semibold">
              <span>Min Industri: Rp {currentRole.minSalary}Jt</span>
              <span>Maks Industri: Rp {currentRole.maxSalary}Jt</span>
            </div>
          </div>
        </div>

        {/* RESULTS CARD (1 COL) */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-md border border-slate-800">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Hasil Analisis AI
              </span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Score Gauge */}
            <div className="text-center space-y-1 py-2">
              <span className="text-xs text-slate-400 font-semibold block">Skor Kesiapan Karir</span>
              <div className="inline-flex items-baseline gap-1 bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700">
                <span className={`font-display text-4xl font-extrabold ${
                  totalScore >= 75 ? "text-emerald-400" : totalScore >= 50 ? "text-amber-400" : "text-rose-400"
                }`}>
                  {totalScore}%
                </span>
                <span className="text-xs text-slate-400">/ 100%</span>
              </div>
              <p className="text-xs font-bold text-slate-300 mt-1">
                {totalScore >= 80
                  ? "🎉 Kategori: SANGAT SIAP DIREKRUT"
                  : totalScore >= 50
                  ? "⚡ Kategori: CUKUP SIAP (Butuh 1-2 Skill)"
                  : "📚 Kategori: PERLU TINGKATKAN SKILL"}
              </p>
            </div>

            {/* Salary Comparison */}
            <div className="space-y-2 text-xs bg-slate-800/80 p-3 rounded-xl border border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Estimasi Realistis:</span>
                <span className="font-bold text-emerald-400">Rp {projectedSalary}.000.000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Anda:</span>
                <span className="font-bold text-white">Rp {targetSalary}.000.000</span>
              </div>
              <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">Status Target:</span>
                {projectedSalary >= targetSalary ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Target Realistis!
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Butuh Tambah Skill (+Rp {targetSalary - projectedSalary}Jt)
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              playSound("click");
              navigate("/belajar/katalog");
            }}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Tingkatkan Skill di Katalog</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
