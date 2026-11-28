import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { JobVacancy, Profile } from "../../../types";
import { JobSearchFilter } from "../components/JobSearchFilter";
import { JobCard } from "../components/JobCard";
import { JobDetailModal } from "../components/JobDetailModal";
import { Briefcase, Bookmark, Layers, AlertCircle, FileText, Mic, Brain, Globe, GraduationCap } from "lucide-react";
import { playSound } from "../../../utils/sound";
import { EmptyState } from "../../../components/EmptyState";
import { InterviewChatScreen } from "../../../components/InterviewChatScreen";
import { ROUTES } from "../../../routes";
import {
  TalentMatchSection,
  PortfolioSettingsPanel,
  CampusHubPanel,
} from "../../../components/CareerHubExpansion";

interface CareerViewProps {
  jobs: JobVacancy[];
  profile: Profile;
  onProfileUpdate?: (profile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
  handleApplyJob: (id: string, cvDocumentId?: number | null, coverNote?: string) => void;
  handleBookmarkJob?: (id: string) => void;
  handleStartInterview: (job: JobVacancy) => void;
  activeInterviewJob: JobVacancy | null;
  setActiveInterviewJob: (job: JobVacancy | null) => void;
  interviewChat: { sender: "user" | "hr"; text: string }[];
  interviewInput: string;
  setInterviewInput: (input: string) => void;
  handleSendInterviewMessage: () => void;
  loadingInterview: boolean;
}

type CareerTab = "semua" | "portofolio" | "kampus" | "disimpan" | "lamaran";

export function CareerView({
  jobs,
  profile,
  onProfileUpdate,
  showToast,
  handleApplyJob,
  handleBookmarkJob,
  activeInterviewJob,
  setActiveInterviewJob,
  interviewChat,
  interviewInput,
  setInterviewInput,
  handleSendInterviewMessage,
  loadingInterview,
}: CareerViewProps) {
  const navigate = useNavigate();
  const routeLocation = useLocation();

  const resolveTabFromUrl = (): CareerTab => {
    const tabParam = new URLSearchParams(routeLocation.search).get("tab");
    if (tabParam === "portofolio" || routeLocation.pathname === "/karier/portofolio") return "portofolio";
    if (tabParam === "kampus" || routeLocation.pathname === "/karier/kampus") return "kampus";
    if (tabParam === "lamaran") return "lamaran";
    if (tabParam === "disimpan") return "disimpan";
    return "semua";
  };

  const [activeTab, setActiveTab] = useState<CareerTab>(resolveTabFromUrl);
  const [selectedJob, setSelectedJob] = useState<JobVacancy | null>(null);

  useEffect(() => {
    setActiveTab(resolveTabFromUrl());
  }, [routeLocation.search, routeLocation.pathname]);

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
      if (activeTab === "disimpan" && !favoriteJobIds.includes(job.id)) return false;
      if (activeTab === "lamaran" && !appliedJobsMap[job.id]) return false;

      const matchesSearch =
        query === "" ||
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.company.toLowerCase().includes(query.toLowerCase()) ||
        job.description.toLowerCase().includes(query.toLowerCase()) ||
        job.requiredSkills.some((s: string) => s.toLowerCase().includes(query.toLowerCase()));
      if (!matchesSearch) return false;

      if (location !== "semua" && !job.location.toLowerCase().includes(location.toLowerCase())) {
        return false;
      }
      if (
        workType !== "semua" &&
        !job.title.toLowerCase().includes(workType.toLowerCase()) &&
        !job.description.toLowerCase().includes(workType.toLowerCase())
      ) {
        return false;
      }
      if (level !== "semua" && !job.title.toLowerCase().includes(level.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [jobs, activeTab, query, location, workType, level, favoriteJobIds, appliedJobsMap]);

  const userSkills =
    profile.skills && profile.skills.length > 0
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
    <div className="space-y-6 w-full pb-16 lg:pb-8">
      {/* Editorial Career Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-5 pb-5 border-b border-zinc-200/90 dark:border-zinc-800/90">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Karier, Talent Match &amp; Ekosistem Kampus
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
            Konversi Skill Terverifikasi Menjadi Tawaran Kerja
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Cocokkan skor lab &amp; sertifikat Anda dengan lowongan mitra, kelola Portofolio Publik, dan gabung cohort kampus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigate(ROUTES.career.cvBuilder)}
            className="h-9 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            CV ATS Builder
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.career.adaptive)}
            className="h-9 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111114] hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <Brain className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Asesmen Adaptif
          </button>
          <button
            type="button"
            onClick={() => navigate(ROUTES.career.voiceInterview)}
            className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            <Mic className="w-3.5 h-3.5" />
            Mock Interview Suara
          </button>
        </div>
      </header>

      {/* Linear-style Underline Career Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-zinc-200/90 dark:border-zinc-800/90 hide-scrollbar">
        {[
          { id: "semua", label: "Talent Match & Bursa", icon: Briefcase },
          { id: "portofolio", label: "Portofolio Publik", icon: Globe },
          { id: "kampus", label: "Campus Hub", icon: GraduationCap },
          { id: "disimpan", label: `Tersimpan (${favoriteJobIds.length})`, icon: Bookmark },
          { id: "lamaran", label: `Lamaran (${Object.keys(appliedJobsMap).length})`, icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as CareerTab)}
              className={`relative px-3.5 py-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 tabular-nums ${
                isActive
                  ? "text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
              {tab.label}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-600 dark:bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {activeTab === "portofolio" ? (
        <PortfolioSettingsPanel
          profile={profile}
          onProfileUpdate={onProfileUpdate}
          showToast={showToast}
        />
      ) : activeTab === "kampus" ? (
        <CampusHubPanel
          profile={profile}
          onProfileUpdate={onProfileUpdate}
          showToast={showToast}
        />
      ) : (
        <>
          {activeTab === "semua" && (
            <TalentMatchSection
              onSelectJobId={(jobId) => {
                const matchJob = jobs.find((j) => j.id === jobId);
                if (matchJob) setSelectedJob(matchJob);
              }}
            />
          )}

          <JobSearchFilter onFilterChange={handleFilterChange} />

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
              icon={<AlertCircle className="w-12 h-12 text-zinc-300" />}
              title="Lowongan Tidak Ditemukan"
              description="Tidak ada lowongan yang cocok dengan filter atau pencarian Anda. Coba ubah kata kunci atau bersihkan filter."
              action={
                <button
                  onClick={() => handleFilterChange("", "semua", "semua", "semua")}
                  className="px-4 py-2 bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-lg text-xs font-semibold mt-2 cursor-pointer"
                >
                  Reset Pencarian
                </button>
              }
            />
          )}
        </>
      )}

      <JobDetailModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        isBookmarked={selectedJob ? favoriteJobIds.includes(selectedJob.id) : false}
        applicationStatus={selectedJob ? appliedJobsMap[selectedJob.id] || "Belum Dilamar" : "Belum Dilamar"}
        onToggleBookmark={handleBookmark}
        onApply={handleApply}
        userSkills={userSkills}
      />
    </div>
  );
}
