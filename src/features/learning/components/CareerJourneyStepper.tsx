import { CheckCircle2, BookOpen, Award, FileText, Briefcase, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Profile } from "../../../types";
import { ROUTES } from "../../../routes";

interface CareerJourneyStepperProps {
  profile: Profile;
  hasActiveOrCompletedCourse: boolean;
}

export function CareerJourneyStepper({ profile, hasActiveOrCompletedCourse }: CareerJourneyStepperProps) {
  const navigate = useNavigate();

  const hasCert = (profile.certificates?.length || 0) > 0 || (profile.certifiedCourses?.length || 0) > 0;
  const isCareerReady = ["applied", "hired"].includes(profile.careerStage || "");
  const hasSkills = (profile.skills?.length || 0) >= 4;

  const steps = [
    {
      step: 1,
      title: "1. Belajar & Kuis",
      subtitle: "Pahami materi & kumpulkan XP",
      done: hasActiveOrCompletedCourse || (profile.xp || 0) > 0,
      path: ROUTES.learning.catalog,
      icon: BookOpen,
    },
    {
      step: 2,
      title: "2. Proyek & Sertifikat",
      subtitle: "Validasi skill dengan portofolio",
      done: hasCert,
      path: ROUTES.learning.project,
      icon: Award,
    },
    {
      step: 3,
      title: "3. CV ATS & Interview",
      subtitle: "Audit CV & latihan wawancara AI",
      done: isCareerReady || (hasCert && hasSkills),
      path: ROUTES.career.cvBuilder,
      icon: FileText,
    },
    {
      step: 4,
      title: "4. Lamar Kerja",
      subtitle: "Matchmaking ke perusahaan mitra",
      done: isCareerReady,
      path: ROUTES.career.jobs,
      icon: Briefcase,
    },
  ];

  const currentIdx = steps.findIndex((s) => !s.done);
  const activeStepNumber = currentIdx === -1 ? 4 : steps[currentIdx].step;

  return (
    <section
      aria-label="Alur Perjalanan Belajar hingga Kerja"
      className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-subtle"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Panduan Alur Skillora
          </span>
          <h2 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white">
            4 Langkah Terarah dari Belajar hingga Siap Kerja
          </h2>
        </div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          Fokus saat ini:{" "}
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            Langkah {activeStepNumber} dari 4
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {steps.map((item) => {
          const Icon = item.icon;
          const isCurrent = item.step === activeStepNumber && !item.done;

          return (
            <button
              key={item.step}
              type="button"
              onClick={() => navigate(item.path)}
              className={`group text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                item.done
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-900/50 hover:border-emerald-300"
                  : isCurrent
                    ? "bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 ring-1 ring-blue-500/20 hover:bg-blue-50"
                    : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  item.done
                    ? "bg-emerald-600 text-white"
                    : isCurrent
                      ? "bg-blue-600 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                }`}
              >
                {item.done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-display font-bold text-xs text-slate-900 dark:text-white truncate">
                    {item.title}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                  {item.subtitle}
                </p>
                <span
                  className={`inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                    item.done
                      ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                      : isCurrent
                        ? "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300"
                        : "bg-slate-200/70 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {item.done ? "Selesai" : isCurrent ? "Langkah Berikutnya" : "Tahap Lanjut"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
