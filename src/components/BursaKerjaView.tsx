import { useState, useRef, useEffect } from "react";
import { Search, MapPin, Briefcase, RefreshCw, Sparkles, FileText, Heart, X, CheckCircle2, Bookmark, Lightbulb, ExternalLink, Filter, Layers, Clock, Calculator, Target, BookOpen } from "lucide-react";
import { JobVacancy, Profile } from "../types";
import { InterviewChatScreen } from "./InterviewChatScreen";
import { CareerReadinessCalculator } from "./CareerReadinessCalculator";
import { motion, AnimatePresence } from "motion/react";
import { playSound } from "../utils/sound";
import { EmptyState } from "./EmptyState";
import { useNavigate, useLocation } from "react-router-dom";

interface BursaKerjaViewProps {
  jobs: JobVacancy[];
  profile: Profile;
  jobQuery: string;
  setJobQuery: (q: string) => void;
  jobFilterLocation: string;
  setJobFilterLocation: (l: string) => void;
  jobFilterSalary: string;
  setJobFilterSalary: (s: string) => void;
  handleApplyJob: (id: string) => void;
  handleApplyJobsMassal: () => void;
  handleStartInterview: (job: JobVacancy) => void;
  activeInterviewJob: JobVacancy | null;
  closeInterview: () => void;
  interviewChat: { sender: "user" | "hr"; text: string }[];
  interviewInput: string;
  setInterviewInput: (input: string) => void;
  handleSendInterviewMessage: () => void;
  loadingInterview: boolean;
  handleBookmarkJob?: (id: string) => void;
}

export function BursaKerjaView({
  jobs,
  profile,
  jobQuery,
  setJobQuery,
  jobFilterLocation,
  setJobFilterLocation,
  jobFilterSalary,
  setJobFilterSalary,
  handleApplyJob,
  handleApplyJobsMassal,
  handleStartInterview,
  activeInterviewJob,
  closeInterview,
  interviewChat,
  interviewInput,
  setInterviewInput,
  handleSendInterviewMessage,
  loadingInterview,
  handleBookmarkJob,
}: BursaKerjaViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const interviewEndRef = useRef<HTMLDivElement | null>(null);

  // Expanded filters: Skill, Work Type, Level, Bookmark Only
  const [filterSkill, setFilterSkill] = useState<string>("semua");
  const [filterWorkType, setFilterWorkType] = useState<string>("semua");
  const [filterLevel, setFilterLevel] = useState<string>("semua");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [filterAppStatus, setFilterAppStatus] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") === "lamaran" ? "dilamar" : "semua";
  });

  const favoriteJobIds = profile.bookmarkedJobs || [];
  const appliedJobsMap = profile.appliedJobs || {};

  const [cvSummary, setCvSummary] = useState<string>("Saya adalah junior React Developer berfokus pada performansi frontend.");
  const [cvScore, setCvScore] = useState<number | null>(null);
  const [analyzingCV, setAnalyzingCV] = useState<boolean>(false);
  const [cvSuggestions, setCvSuggestions] = useState<string[]>([]);
  const [showCvOptimizer, setShowCvOptimizer] = useState<boolean>(false);
  const [showCalculator, setShowCalculator] = useState<boolean>(true);
  const [selectedJobDetail, setSelectedJobDetail] = useState<JobVacancy | null>(null);

  // User skills baseline
  const userSkills = (profile.skills && profile.skills.length > 0)
    ? profile.skills.map((s: any) => (typeof s === "string" ? s : s.name).toLowerCase())
    : ["react", "javascript", "tailwind css", "html", "css", "git", "frontend"];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("tab") === "lamaran") {
      setFilterAppStatus("dilamar");
    } else {
      setFilterAppStatus("semua");
    }
  }, [location.search]);

  useEffect(() => {
    if (interviewEndRef.current) {
      interviewEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [interviewChat, loadingInterview]);

  const safeJobs = Array.isArray(jobs) ? jobs : [];
  const filteredJobs = safeJobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(jobQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(jobQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(jobQuery.toLowerCase());

    const matchesLocation =
      jobFilterLocation === "semua" ||
      job.location.toLowerCase().includes(jobFilterLocation.toLowerCase()) ||
      (jobFilterLocation === "remote" && job.location.toLowerCase().includes("remote"));

    let matchesSalary = true;
    if (jobFilterSalary === "tinggi") {
      const numericVal = parseInt(job.salary.replace(/[^0-9]/g, "")) || 0;
      matchesSalary = numericVal >= 10000000;
    } else if (jobFilterSalary === "sedang") {
      const numericVal = parseInt(job.salary.replace(/[^0-9]/g, "")) || 0;
      matchesSalary = numericVal < 10000000 && numericVal >= 5000000;
    }

    const matchesSkill = filterSkill === "semua" || job.requiredSkills.some(s => s.toLowerCase().includes(filterSkill.toLowerCase()));
    
    let matchesWorkType = true;
    if (filterWorkType !== "semua") {
      matchesWorkType = job.location.toLowerCase().includes(filterWorkType.toLowerCase()) ||
                        job.description.toLowerCase().includes(filterWorkType.toLowerCase());
    }

    let matchesLevel = true;
    if (filterLevel !== "semua") {
      matchesLevel = job.title.toLowerCase().includes(filterLevel.toLowerCase()) ||
                     job.description.toLowerCase().includes(filterLevel.toLowerCase());
    }

    const matchesFavorite = !showFavoritesOnly || favoriteJobIds.includes(job.id);

    let matchesAppStatus = true;
    const currentStatus = appliedJobsMap[job.id] || "Belum Dilamar";
    if (filterAppStatus === "disimpan") matchesAppStatus = favoriteJobIds.includes(job.id);
    else if (filterAppStatus === "dilamar") matchesAppStatus = currentStatus !== "Belum Dilamar";
    else if (filterAppStatus === "interview") matchesAppStatus = currentStatus === "Wawancara AI";
    else if (filterAppStatus === "diterima") matchesAppStatus = currentStatus === "Diterima";

    return matchesSearch && matchesLocation && matchesSalary && matchesSkill && matchesWorkType && matchesLevel && matchesFavorite && matchesAppStatus;
  });

  const toggleFavorite = (jobId: string) => {
    playSound("click");
    if (handleBookmarkJob) {
      handleBookmarkJob(jobId);
    }
  };

  const handleApply = (jobId: string) => {
    playSound("claim");
    handleApplyJob(jobId);
  };

  const getJobMatchPercentage = (jobSkills: string[]) => {
    if (!jobSkills || jobSkills.length === 0) return 100;
    const matchedCount = jobSkills.filter(sk => userSkills.some(us => us.includes(sk.toLowerCase()) || sk.toLowerCase().includes(us))).length;
    return Math.min(100, Math.round((matchedCount / jobSkills.length) * 100) + 20);
  };

  const getMissingSkills = (jobSkills: string[]) => {
    return jobSkills.filter(sk => !userSkills.some(us => us.includes(sk.toLowerCase()) || sk.toLowerCase().includes(us)));
  };

  const handleOptimizeCV = () => {
    playSound("laser");
    setAnalyzingCV(true);
    setTimeout(() => {
      setAnalyzingCV(false);
      setCvScore(88);
      setCvSuggestions([
        "Saran AI: Tambahkan sertifikat kuis 'State Management' untuk menaikkan nilai lamaran Anda.",
        "Saran AI: Sebutkan keahlian 'Tailwind CSS & TypeScript' secara spesifik pada kalimat pembuka CV.",
      ]);
      playSound("success");
    }, 1000);
  };

  return (
    <div id="view-kerja" className="space-y-6 animate-in fade-in duration-200 w-full pb-16 lg:pb-8 pt-2">
      
      {activeInterviewJob ? (
        <InterviewChatScreen
          activeInterviewJob={activeInterviewJob}
          setActiveInterviewJob={() => closeInterview()}
          profile={profile}
          interviewChat={interviewChat}
          interviewInput={interviewInput}
          setInterviewInput={setInterviewInput}
          handleSendInterviewMessage={handleSendInterviewMessage}
          loadingInterview={loadingInterview}
        />
      ) : (
        <>
          {/* HEADER BANNER */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md border border-slate-800">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 border border-blue-400/30">
                <Briefcase className="w-3.5 h-3.5" /> Bursa Kerja & Penyelarasan Skill
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight leading-snug">
                Portal Karir Mitra Skillora
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Temukan lowongan yang sesuai dengan keahlian Anda, dapatkan rekomendasi skill yang perlu dipelajari, dan ikuti simulasi Wawancara AI.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className={`w-full sm:w-auto font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                  showCalculator
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-2xs"
                    : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <Calculator className="w-4 h-4 text-emerald-300" />
                <span>{showCalculator ? "Sembunyikan Kalkulator" : "Kalkulator Gaji & Skill"}</span>
              </button>

              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`w-full sm:w-auto font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                  showFavoritesOnly
                    ? "bg-rose-600 text-white border-rose-500"
                    : "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <Heart className={`w-4 h-4 ${showFavoritesOnly ? "fill-white" : ""}`} />
                <span>Favorit ({favoriteJobIds.length})</span>
              </button>

              <button
                onClick={() => setShowCvOptimizer(!showCvOptimizer)}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{showCvOptimizer ? "Sembunyikan AI CV" : "Optimasi CV AI"}</span>
              </button>

              <button
                onClick={() => {
                  playSound("claim");
                  handleApplyJobsMassal();
                }}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🚀 Salurkan Otomatis</span>
              </button>
            </div>
          </div>

          {/* CAREER ACTION FLOW: Profile -> Gap -> Courses -> Jobs */}
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700/60 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800/50 mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> Career Readiness Path
                </div>
                <h2 className="text-xl font-display font-bold text-slate-900 dark:text-white">Alur Kesiapan Karir Anda</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Lengkapi profil dan asah skill untuk membuka lebih banyak peluang kerja yang relevan.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Connector lines (Desktop only) */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 dark:bg-slate-700 -z-10 -translate-y-1/2"></div>
              
              {/* Step 1: Profile Completeness */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center text-center relative shadow-sm z-0">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center font-bold text-lg mb-3 shadow-xs border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">1. Kelengkapan Profil</h3>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 mb-1">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <span className="text-xs font-bold text-emerald-600">85% Lengkap</span>
                <button className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2">Lengkapi CV & Portfolio</button>
              </div>

              {/* Step 2: Skill Gap */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center text-center relative shadow-sm z-0">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center font-bold text-lg mb-3 shadow-xs border border-amber-200 dark:border-amber-800">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">2. Skill Gap Analysis</h3>
                <p className="text-xs text-slate-500 leading-tight my-2">Terdapat 3 skill utama yang sering dicari namun belum Anda kuasai (mis: TypeScript, Docker).</p>
                <button 
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="mt-1 text-xs font-bold bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors shadow-2xs"
                >
                  Hitung Target Gaji
                </button>
              </div>

              {/* Step 3: Recommended Courses */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center text-center relative shadow-sm z-0">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center font-bold text-lg mb-3 shadow-xs border border-blue-200 dark:border-blue-800">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">3. Rekomendasi Belajar</h3>
                <p className="text-xs text-slate-500 leading-tight my-2">2 kursus direkomendasikan untuk menutupi Skill Gap Anda.</p>
                <button onClick={() => navigate("/belajar/katalog")} className="mt-1 text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-2xs">
                  Lihat Kursus
                </button>
              </div>

              {/* Step 4: Recommended Jobs */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center text-center relative shadow-sm z-0">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center font-bold text-lg mb-3 shadow-xs border border-purple-200 dark:border-purple-800">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">4. Rekomendasi Lowongan</h3>
                <p className="text-xs text-slate-500 leading-tight my-2">12 lowongan dengan tingkat kecocokan di atas 80% siap dilamar.</p>
                <button onClick={() => { setFilterAppStatus("semua"); setJobQuery(""); }} className="mt-1 text-xs font-bold bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors shadow-2xs">
                  Eksplor Lowongan
                </button>
              </div>
            </div>
          </div>

          {/* CAREER READINESS & SALARY CALCULATOR */}
          <AnimatePresence>
            {showCalculator && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-6">
                <CareerReadinessCalculator />
              </motion.div>
            )}
          </AnimatePresence>

          {/* COLLAPSIBLE CV OPTIMIZER WIDGET */}
          <AnimatePresence>
            {showCvOptimizer && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/60 shadow-xs grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-base font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <span>Skillora AI CV Optimizer</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      Tuliskan ringkasan profil Anda untuk dipindai oleh sistem AI kami sesuai standar rekrutmen mitra.
                    </p>
                    <textarea aria-label="Input field" value={cvSummary} onChange={(e) => setCvSummary(e.target.value)} rows={3} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-white outline-none resize-none" />
                    <button onClick={handleOptimizeCV} disabled={analyzingCV || !cvSummary.trim()} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-2 disabled:opacity-50 cursor-pointer">
                      {analyzingCV ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
                      <span>{analyzingCV ? "Menganalisis..." : "Analisis Ringkasan"}</span>
                    </button>
                  </div>

                  <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Skor Kelayakan CV</span>
                      {cvScore ? (
                        <div className="space-y-3">
                          <div className="flex items-baseline gap-1">
                            <span className="font-display text-4xl font-bold text-white">{cvScore}</span>
                            <span className="text-xs text-slate-400">/100</span>
                          </div>
                          <ul className="text-xs text-slate-300 space-y-2">
                            {cvSuggestions.map((s, idx) => (
                              <li key={idx} className="flex gap-2 items-start bg-slate-800 p-2 rounded-lg text-xs">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Belum dianalisis. Klik tombol untuk memindai.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* APPLICATION STATUS TABS (Feature 8) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
            <button
              onClick={() => setFilterAppStatus("semua")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                filterAppStatus === "semua"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
            >
              Semua Lowongan
            </button>
            <button
              onClick={() => setFilterAppStatus("disimpan")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                filterAppStatus === "disimpan"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
            >
              ❤️ Disimpan ({favoriteJobIds.length})
            </button>
            <button
              onClick={() => setFilterAppStatus("dilamar")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                filterAppStatus === "dilamar"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
            >
              📩 Sudah Dilamar ({Object.keys(appliedJobsMap).length})
            </button>
            <button
              onClick={() => setFilterAppStatus("interview")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                filterAppStatus === "interview"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
            >
              🎙️ Scheduled AI Interview
            </button>
            <button
              onClick={() => setFilterAppStatus("diterima")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                filterAppStatus === "diterima"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
            >
              🎉 Diterima
            </button>
          </div>

          {/* MULTI-FILTER BAR: SEARCH, SKILL, LOCATION, TYPE, LEVEL */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Cari Posisi / Perusahaan</label>
                <div className="relative">
                  <input aria-label="Contoh: Frontend, Tokopedia" type="text" placeholder="Contoh: Frontend, Tokopedia" value={jobQuery} onChange={(e) => setJobQuery(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-500" />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Filter Skill</label>
                <select aria-label="Input field" value={filterSkill} onChange={(e) => setFilterSkill(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none cursor-pointer">
                  <option value="semua">Semua Skill</option>
                  <option value="react">React / Frontend</option>
                  <option value="node">Node.js / Backend</option>
                  <option value="python">Python / AI</option>
                  <option value="ui/ux">UI/UX Design</option>
                  <option value="docker">Docker / DevOps</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Lokasi</label>
                <select aria-label="Input field" value={jobFilterLocation} onChange={(e) => setJobFilterLocation(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none cursor-pointer">
                  <option value="semua">Semua Lokasi</option>
                  <option value="jakarta">Jakarta</option>
                  <option value="bandung">Bandung</option>
                  <option value="yogyakarta">Yogyakarta</option>
                  <option value="remote">Remote (WFA)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Level Karir</label>
                <select aria-label="Input field" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-900 dark:text-white outline-none cursor-pointer">
                  <option value="semua">Semua Level</option>
                  <option value="junior">Junior / Entry</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                </select>
              </div>

              <button
                onClick={() => {
                  setJobQuery("");
                  setJobFilterLocation("semua");
                  setJobFilterSalary("semua");
                  setFilterSkill("semua");
                  setFilterWorkType("semua");
                  setFilterLevel("semua");
                  setShowFavoritesOnly(false);
                }}
                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-bold py-2 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer h-[34px]"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset Filter
              </button>
            </div>
          </div>

          {/* VACANCY LIST */}
          {filteredJobs.length === 0 ? (
            <EmptyState
              variant="search"
              title="Tidak Ada Lowongan Ditemukan"
              description="Coba ubah kata kunci pencarian atau sesuaikan filter keahlian dan lokasi."
              onRetry={() => {
                setJobQuery("");
                setJobFilterLocation("semua");
                setJobFilterSalary("semua");
                setFilterSkill("semua");
                setShowFavoritesOnly(false);
              }}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredJobs.map((job) => {
                const isFav = favoriteJobIds.includes(job.id);
                const matchPct = getJobMatchPercentage(job.requiredSkills);
                const missingSkills = getMissingSkills(job.requiredSkills);
                const appStatus = appliedJobsMap[job.id] || "Belum Dilamar";

                return (
                  <div
                    key={job.id}
                    className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 sm:p-4.5 border border-slate-200/80 dark:border-slate-700/60 hover:shadow-md transition-all flex flex-col justify-between gap-3 relative group"
                  >
                    <button
                      onClick={() => toggleFavorite(job.id)}
                      className="absolute top-4 right-4 text-slate-300 dark:text-slate-600 hover:text-rose-500 transition-colors p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full cursor-pointer"
                      title="Bookmark Lowongan"
                    >
                      <Heart className={`w-4.5 h-4.5 ${isFav ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl shrink-0">
                          {job.logo}
                        </div>
                        <div className="min-w-0 pr-6">
                          <h3 className="font-display font-bold text-slate-900 dark:text-white text-base truncate group-hover:text-blue-600 transition-colors">
                            {job.title}
                          </h3>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{job.company}</p>
                        </div>
                      </div>

                      {/* Match & Application Status */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                          {matchPct}% MATCH SKILL
                        </span>

                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                          appStatus === "Belum Dilamar" ? "bg-slate-100 text-slate-600" :
                          appStatus === "Terkirim" ? "bg-blue-100 text-blue-700" :
                          appStatus === "Ditinjau" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          Status: {appStatus}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 font-medium bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span>{job.salary}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Missing Skill Warning Badge */}
                      {missingSkills.length > 0 && (
                        <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs space-y-1">
                          <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <Lightbulb className="w-3 h-3 text-amber-500" /> Skill Kurang:
                          </span>
                          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                            {missingSkills.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
                      <button
                        onClick={() => setSelectedJobDetail(job)}
                        className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold px-3 py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> Detail & Skill Match
                      </button>

                      {appStatus === "Belum Dilamar" ? (
                        <button
                          onClick={() => handleApply(job.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-xs cursor-pointer"
                        >
                          Kirim Lamaran
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            playSound("click");
                            handleStartInterview(job);
                          }}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          Mulai Wawancara AI
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedJobDetail && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700"
            >
              <div className="p-5 bg-slate-900 text-white flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl border border-white/20">
                    {selectedJobDetail.logo}
                  </div>
                  <div>
                    <h3 className="text-base font-display font-bold">{selectedJobDetail.title}</h3>
                    <p className="text-xs text-slate-300 font-medium">{selectedJobDetail.company} • {selectedJobDetail.location}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedJobDetail(null)} className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-800/40 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300">Skor Kesesuaian Skill</span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{getJobMatchPercentage(selectedJobDetail.requiredSkills)}% Match</span>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-1">Deskripsi Pekerjaan</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {selectedJobDetail.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-1.5">Keahlian Dibutuhkan</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJobDetail.requiredSkills.map((sk, idx) => {
                      const isMatched = userSkills.some(us => us.includes(sk.toLowerCase()) || sk.toLowerCase().includes(us));
                      return (
                        <span key={idx} className={`text-xs px-2.5 py-1 rounded-md font-semibold border ${
                          isMatched ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          {sk} {isMatched ? "✓" : "(Kurang)"}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {getMissingSkills(selectedJobDetail.requiredSkills).length > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-xl space-y-2">
                    <h5 className="font-bold text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>Rekomendasi Pembelajaran Skill</span>
                    </h5>
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      Anda belum menguasai: <b>{getMissingSkills(selectedJobDetail.requiredSkills).join(", ")}</b>. Tingkatkan peluang diterima dengan mengambil modul terkait di katalog!
                    </p>
                    <button onClick={() => { setSelectedJobDetail(null); navigate("/belajar/katalog"); }} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer">
                      <ExternalLink className="w-3.5 h-3.5" /> Pelajari di Katalog Skillora
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2">
                <button onClick={() => setSelectedJobDetail(null)} className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer">
                  Tutup
                </button>
                <button
                  onClick={() => {
                    handleApply(selectedJobDetail.id);
                    setSelectedJobDetail(null);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  Lamar Sekarang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default BursaKerjaView;

