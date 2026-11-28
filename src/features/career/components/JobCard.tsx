import { MapPin, Bookmark, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { JobVacancy } from "../../../types";

interface JobCardProps {
  job: JobVacancy;
  isBookmarked: boolean;
  applicationStatus?: string; // "Belum Dilamar", "Terkirim", dll
  onToggleBookmark: (jobId: string) => void;
  onClick: (job: JobVacancy) => void;
  onApply: (jobId: string) => void;
}

function getCompanyInitials(company: string): string {
  const clean = (company || "SK").replace(/^(PT|CV|Bank|Perum)\s+/i, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase() || "SK";
}

export function JobCard({
  job,
  isBookmarked,
  applicationStatus = "Belum Dilamar",
  onToggleBookmark,
  onClick,
  onApply,
}: JobCardProps) {
  const isApplied = applicationStatus !== "Belum Dilamar";
  const initials = getCompanyInitials(job.company);

  return (
    <article
      className="bg-white dark:bg-[#111114] rounded-xl p-5 border border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer group flex flex-col h-full"
      onClick={() => onClick(job)}
    >
      {/* Top Row: Company Monogram + Bookmark */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-center font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate">
              {job.company}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-500 flex items-center gap-1 truncate mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{job.location}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(job.id);
          }}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
            isBookmarked
              ? "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
              : "border-transparent text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-700 dark:hover:text-zinc-200"
          }`}
          aria-label={isBookmarked ? "Hapus dari tersimpan" : "Simpan lowongan"}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Job Title & Unboxed Skill Metadata */}
      <div className="flex-1 space-y-2.5 mb-5">
        <h3 className="font-display font-semibold text-base text-zinc-950 dark:text-zinc-50 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
          {job.title}
        </h3>

        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed line-clamp-2">
            {job.requiredSkills.slice(0, 4).join(" · ")}
            {job.requiredSkills.length > 4 ? ` · +${job.requiredSkills.length - 4}` : ""}
          </p>
        )}
      </div>

      {/* Footer: Salary / Application Status + Single-Line Action */}
      <div className="pt-3.5 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-2 mt-auto">
        {isApplied ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 truncate">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{applicationStatus}</span>
          </span>
        ) : (
          <span className="text-xs font-mono font-medium tabular-nums text-zinc-700 dark:text-zinc-300 truncate">
            {job.salary ? job.salary : "Kompetitif"}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isApplied) onApply(job.id);
            else onClick(job);
          }}
          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            isApplied
              ? "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          }`}
        >
          <span>{isApplied ? "Lihat status" : "Lamar cepat"}</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
}
