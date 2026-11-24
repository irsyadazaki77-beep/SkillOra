import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { JobVacancy, Profile } from "../../../types";
import { JobSearchFilter } from "../components/JobSearchFilter";
import { JobCard } from "../components/JobCard";
import { JobDetailModal } from "../components/JobDetailModal";
import { Briefcase, Bookmark, Layers, AlertCircle, FileText, Mic, Brain } from "lucide-react";
import { playSound } from "../../../utils/sound";
import { EmptyState } from "../../../components/EmptyState";
import { InterviewChatScreen } from "../../../components/InterviewChatScreen";
import { ROUTES } from "../../../routes";

interface CareerViewProps {
  jobs: JobVacancy[];
  profile: Profile;
  handleApplyJob: (id: string, cvDocumentId?: number | null, coverNote?: string) => void;
  handleBookmarkJob?: (id: string) => void;
  // Interview props
  handleStartInterview: (job: JobVacancy) => void;
  activeInterviewJob: JobVacancy | null;
  setActiveInterviewJob: (job: JobVacancy | null) => void;
  interviewChat: { sender: "user" | "hr"; text: string }[];
  interviewInput: string;
  setInterviewInput: (input: string) => void;
  handleSendInterviewMessage: () => void;
  loadingInterview: boolean;
}

export function CareerView({
  jobs,
  profile,
  handleApplyJob,
  handleBookmarkJob,
  activeInterviewJob,
  setActiveInterviewJob,
  interviewChat,
  interviewInput,
  setInterviewInput,
  handleSendInterviewMessage,
  loadingInterview
}: CareerViewProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"semua" | "disimpan" | "lamaran">("semua");
  const [selectedJob, setSelectedJob] = useState<JobVacancy | null>(null);

  // Filter States (synced by JobSearchFilter)
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("semua");
  const [workType, setWorkType] = useState("semua");
  const [level, setLevel] = useState("semua");

  const favoriteJobIds = profile.bookmarkedJobs || [];
  const appliedJobsMap = profile.appliedJobs || {};

  const handleFilterChange = (q: string, loc: string, wt: string, lvl: string) => {
    setQuery(q);
    setLocation(loc);
    setWorkType(wt);
    setLevel(lvl);
  };

  const filteredJobs = useMemo(() => {
    const safeJobs = Array.isArray(jobs) ? jobs : [];
    return safeJobs.filter((job) => {
      // Tab Filtering
      if (activeTab === "disimpan" && !favoriteJobIds.includes(job.id)) return false;
      if (activeTab === "lamaran" && !appliedJobsMap[job.id]) return false;

      // Text Search
      const matchesSearch =
        query === "" ||
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.company.toLowerCase().includes(query.toLowerCase()) ||
        job.description.toLowerCase().includes(query.toLowerCase()) ||
        job.requiredSkills.some((s: string) => s.toLowerCase().includes(query.toLowerCase()));
      if (!matchesSearch) return false;

      // Location Filter
      if (location !== "semua" && !job.location.toLowerCase().includes(location.toLowerCase())) {
        return false;
      }

      // Work Type Filter
      if (workType !== "semua" && !job.title.toLowerCase().includes(workType.toLowerCase()) && !job.description.toLowerCase().includes(workType.toLowerCase())) {
        return false;
      }

      // Level Filter
      if (level !== "semua" && !job.title.toLowerCase().includes(level.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [jobs, activeTab, query, location, workType, level, favoriteJobIds, appliedJobsMap]);

  // Derived user skills
  const userSkills = (profile.skills && profile.skills.length > 0)
    ? profile.skills.map((s: any) => (typeof s === "string" ? s : s.name).toLowerCase())
    : [];

  const handleApply = (jobId: string, cvDocumentId?: number | null, coverNote?: string) => {
    playSound("claim");
    handleApplyJob(jobId, cvDocumentId, coverNote);
    setSelectedJob(null);
  };

  const handleBookmark = (jobId: string) => {
    playSound("click");
    if (handleBookmarkJob) handleBookmarkJob(jobId);
  };

  if (activeInterviewJob) {
    return (
      <div className="w-full pb-16 lg:pb-8 pt-2">
        <InterviewChatScreen
          activeInterviewJob={activeInterviewJob}
          setActiveInterviewJob={setActiveInterviewJob}
          profile={profile}
          interviewChat={interviewChat}
          interviewInput={interviewInput}
          setInterviewInput={setInterviewInput}
          handleSendInterviewMessage={handleSendInterviewMessage}
          loadingInterview={loadingInterview}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 w-full pb-16 lg:pb-8 pt-2">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md border border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-3 py-1 rounded-md uppercase tracking-wider inline-flex items-center gap-1.5 border border-blue-400/30 mb-2">
            <Briefcase className="w-3.5 h-3.5" /> Bursa Kerja Skillora
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
            Temukan Karir Impianmu
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed mt-2 max-w-xl">
            Lamar pekerjaan dengan CV ATS teraudit AI, latih wawancara suara real-time, dan pantau respons langsung dari tim HRD mitra.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => navigate(ROUTES.career.cvBuilder)}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            CV ATS Builder
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.career.voiceInterview)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            Voice Mock Interview
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.career.adaptive)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Brain className="w-4 h-4 text-emerald-400" />
            Asesmen Adaptif
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold hide-scrollbar">
        <button
          onClick={() => setActiveTab("semua")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === "semua"
              ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
          }`}
        >
          <Briefcase className="w-4 h-4" /> Cari Lowongan
        </button>
        <button
          onClick={() => setActiveTab("disimpan")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === "disimpan"
              ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
          }`}
        >
          <Bookmark className="w-4 h-4" /> Lowongan Tersimpan ({favoriteJobIds.length})
        </button>
        <button
          onClick={() => setActiveTab("lamaran")}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === "lamaran"
              ? "bg-slate-900 dark:bg-blue-600 text-white shadow-xs"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
          }`}
        >
          <Layers className="w-4 h-4" /> Status Lamaran ({Object.keys(appliedJobsMap).length})
        </button>
      </div>

      {/* SEARCH AND FILTER */}
      <JobSearchFilter onFilterChange={handleFilterChange} />

      {/* CONTENT */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredJobs.map((job) => (
            <JobCard 
              key={job.id} 
              job={job} 
              isBookmarked={favoriteJobIds.includes(job.id)}
              applicationStatus={appliedJobsMap[job.id] || "Belum Dilamar"}
              onToggleBookmark={handleBookmark}
              onClick={setSelectedJob}
              onApply={handleApply}
            />
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={<AlertCircle className="w-12 h-12 text-slate-300" />}
          title="Lowongan Tidak Ditemukan"
          description="Tidak ada lowongan yang cocok dengan filter atau pencarian Anda. Coba ubah kata kunci atau bersihkan filter."
          action={
            <button
              onClick={() => handleFilterChange("", "semua", "semua", "semua")}
              className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl text-sm font-bold mt-2"
            >
              Reset Pencarian
            </button>
          }
        />
      )}

      <JobDetailModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        isBookmarked={selectedJob ? favoriteJobIds.includes(selectedJob.id) : false}
        applicationStatus={selectedJob ? (appliedJobsMap[selectedJob.id] || "Belum Dilamar") : "Belum Dilamar"}
        onToggleBookmark={handleBookmark}
        onApply={handleApply}
        userSkills={userSkills}
      />
    </div>
  );
}
