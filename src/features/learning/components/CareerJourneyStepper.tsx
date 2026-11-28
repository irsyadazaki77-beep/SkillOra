import { Check, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Profile } from "../../../types";
import { ROUTES } from "../../../routes";

interface CareerJourneyStepperProps {
  profile: Profile;
  hasActiveOrCompletedCourse: boolean;
}

export function CareerJourneyStepper({
  profile,
  hasActiveOrCompletedCourse,
}: CareerJourneyStepperProps) {
  const navigate = useNavigate();

  const hasCert =
    (profile.certificates?.length || 0) > 0 || (profile.certifiedCourses?.length || 0) > 0;
  const isCareerReady = ["applied", "hired"].includes(profile.careerStage || "");
  const hasSkills = (profile.skills?.length || 0) >= 4;

  const steps = [
    {
      step: 1,
      title: "Belajar & Kuis",
      subtitle: "Selesaikan modul inti",
      done: hasActiveOrCompletedCourse || (profile.xp || 0) > 0,
      path: ROUTES.learning.catalog,
    },
    {
      step: 2,
      title: "Proyek & Sertifikat",
      subtitle: "Validasi portofolio",
      done: hasCert,
      path: ROUTES.learning.project,
    },
    {
      step: 3,
      title: "CV ATS & Interview",
      subtitle: "Audit & simulasi AI",
      done: isCareerReady || (hasCert && hasSkills),
      path: ROUTES.career.cvBuilder,
    },
    {
      step: 4,
      title: "Lamar Kerja",
      subtitle: "Cocokkan lowongan mitra",
      done: isCareerReady,
      path: ROUTES.career.jobs,
    },
  ];

  const currentIdx = steps.findIndex((s) => !s.done);
  const activeStepNumber = currentIdx === -1 ? 4 : steps[currentIdx].step;

  return (
    <section
      aria-label="Alur Perjalanan Belajar hingga Kerja"
      className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden"
    >
      <div className="px-5 py-3 border-b border-zinc-200/70 dark:border-zinc-800/80 flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Alur persiapan karier
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
          Tahap{" "}
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            {activeStepNumber}/4
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/70 dark:divide-zinc-800/80">
        {steps.map((item) => {
          const isCurrent = item.step === activeStepNumber && !item.done;

          return (
            <button
              key={item.step}
              type="button"
              onClick={() => navigate(item.path)}
              className={`group text-left px-4 py-3.5 transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                isCurrent
                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30"
                  : "hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-6 h-6 rounded-full text-[11px] font-mono font-semibold flex items-center justify-center shrink-0 tabular-nums ${
                    item.done
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400"
                      : "border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {item.done ? <Check className="w-3.5 h-3.5" /> : item.step}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-100 truncate">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {item.subtitle}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors shrink-0" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
