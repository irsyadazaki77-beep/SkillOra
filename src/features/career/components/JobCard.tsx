import { MapPin, Briefcase, Clock, Bookmark, ChevronRight } from "lucide-react";
import { JobVacancy } from "../../../types";

interface JobCardProps {
  job: JobVacancy;
  isBookmarked: boolean;
  applicationStatus?: string; // "Belum Dilamar", "Terkirim", dll
  onToggleBookmark: (jobId: string) => void;
  onClick: (job: JobVacancy) => void;
  onApply: (jobId: string) => void;
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

  return (
    <div 
      className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full relative"
      onClick={() => onClick(job)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-2xl shrink-0">
          {job.logo || "🏢"}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleBookmark(job.id); }}
          className={`p-2 rounded-full transition-colors ${
            isBookmarked 
              ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30" 
              : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300"
          }`}
          aria-label={isBookmarked ? "Hapus dari tersimpan" : "Simpan lowongan"}
        >
          <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
        </button>
      </div>

      <div className="mb-4 flex-grow">
        <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {job.title}
        </h3>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{job.company}</p>
      </div>

      <div className="space-y-2 mb-5">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{job.location}</span>
        </div>
        
        {/* Simple skills preview */}
        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {job.requiredSkills.slice(0, 3).map((skill: string, idx: number) => (
              <span key={idx} className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                {skill}
              </span>
            ))}
            {job.requiredSkills.length > 3 && (
              <span className="px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs font-medium border border-slate-200/50 dark:border-slate-700/50">
                +{job.requiredSkills.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between mt-auto">
        {isApplied ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800/50">
            {applicationStatus}
          </div>
        ) : (
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {job.salary ? job.salary : "Gaji tidak ditampilkan"}
          </span>
        )}
        
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (!isApplied) onApply(job.id); 
            else onClick(job);
          }}
          className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
            isApplied
              ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50"
          }`}
        >
          {isApplied ? "Lihat Status" : "Lamar Cepat"}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
