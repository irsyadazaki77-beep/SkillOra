/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from "react";
import {
  BookOpen,
  Award,
  Users,
  Briefcase,
  TrendingUp,
  Flame,
  Zap,
  Gem,
  Bell,
  Heart,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  X,
  Shield,
  Compass,
  MessageSquare,
  ArrowUp,
  UserCircle,
  Building2,
} from "lucide-react";
import { ToastNotification } from "./components/ToastNotification";
import { Sidebar } from "./components/Sidebar";
import { PageSkeleton } from "./components/PageSkeleton";
import { LoadingScreen } from "./components/LoadingScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { TopNavbar } from "./components/TopNavbar";
import { NetworkStatusBanner } from "./components/NetworkStatusBanner";
import { motion, AnimatePresence } from "motion/react";
import { safeStorage } from "./utils/storage";
import { clearAuthQueryCache } from "./lib/queryClient";
import { Routes, Route, Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { ROUTES } from "./routes";

import {
  Profile,
  Course,
  CollabRoom,
  JobVacancy,
  SystemNotification,
  Lesson,
  Question,
  MentorReview
} from "./types";
import { userApi, courseApi, jobApi, forumApi, notificationApi, devApi, aiApi, apiClient } from "./api/apiClient";
import { useAppEngine } from "./hooks/useAppEngine";

import { BelajarView } from "./components/BelajarView";
import { LoginView } from "./components/LoginView";

function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const storageKey = "skillora_lazy_reload_attempted";
    try {
      const mod = await factory();
      sessionStorage.removeItem(storageKey);
      return mod;
    } catch (err) {
      // Transient retry after short backoff (e.g., during Vite cold optimization)
      await new Promise((r) => setTimeout(r, 350));
      try {
        const mod = await factory();
        sessionStorage.removeItem(storageKey);
        return mod;
      } catch (retryErr) {
        if (!sessionStorage.getItem(storageKey)) {
          sessionStorage.setItem(storageKey, "1");
          window.location.reload();
        }
        throw retryErr;
      }
    }
  });
}

// Import modular pages/views with resilient code splitting
const MentorChatSidebar = lazyWithRetry(() => import("./components/MentorChatSidebar").then(m => ({ default: m.MentorChatSidebar || (m as any).default })));
const FlashChallengeModal = lazyWithRetry(() => import("./components/FlashChallengeModal").then(m => ({ default: m.FlashChallengeModal || (m as any).default })));
const CertificateModal = lazyWithRetry(() => import("./components/CertificateModal").then(m => ({ default: m.CertificateModal || (m as any).default })));
const PublicCertificateVerifyView = lazyWithRetry(() => import("./components/PublicCertificateVerifyView").then(m => ({ default: m.PublicCertificateVerifyView || (m as any).default })));
const OnboardingView = lazyWithRetry(() => import("./components/OnboardingView").then(m => ({ default: m.OnboardingView || (m as any).default })));

const KatalogKursusView = lazyWithRetry(() => import("./components/KatalogKursusView").then(m => ({ default: m.KatalogKursusView || (m as any).default })));
const DetailKursusView = lazyWithRetry(() => import("./components/DetailKursusView").then(m => ({ default: m.DetailKursusView || (m as any).default })));
const SertifikasiView = lazyWithRetry(() => import("./components/SertifikasiView").then(m => ({ default: m.SertifikasiView || (m as any).default })));
const AnalitikView = lazyWithRetry(() => import("./components/AnalitikView").then(m => ({ default: m.AnalitikView || (m as any).default })));
import type { ForumPost } from "./components/ForumView";
const ForumView = lazyWithRetry(() => import("./components/ForumView").then(m => ({ default: m.ForumView || (m as any).default })));
const MateriView = lazyWithRetry(() => import("./components/MateriView").then(m => ({ default: m.MateriView || (m as any).default })));

const ProfilView = lazyWithRetry(() => import("./components/ProfilView").then(m => ({ default: m.ProfilView || (m as any).default })));
const KelolaLmsView = lazyWithRetry(() => import("./components/KelolaLmsView").then(m => ({ default: m.KelolaLmsView || (m as any).default })));

const KolaborasiView = lazyWithRetry(() => import("./components/KolaborasiView").then(m => ({ default: m.KolaborasiView || (m as any).default })));
const TokoView = lazyWithRetry(() => import("./components/TokoView").then(m => ({ default: m.TokoView || (m as any).default })));
const CareerView = lazyWithRetry(() => import("./features/career/pages/CareerView").then(m => ({ default: m.CareerView })));
const JelajahiView = lazyWithRetry(() => import("./components/JelajahiView").then(m => ({ default: m.JelajahiView || (m as any).default })));
const EventWebinarView = lazyWithRetry(() => import("./components/EventWebinarView").then(m => ({ default: m.EventWebinarView || (m as any).default })));
const BeasiswaView = lazyWithRetry(() => import("./components/BeasiswaView").then(m => ({ default: m.BeasiswaView || (m as any).default })));
const MentoringView = lazyWithRetry(() => import("./components/MentoringView").then(m => ({ default: m.MentoringView || (m as any).default })));
import { Footer } from "./components/Footer";
const FaqView = lazyWithRetry(() => import("./components/FaqView").then(m => ({ default: m.FaqView || (m as any).default })));
const LatihanSimulasiKerjaView = lazyWithRetry(() => import("./components/LatihanSimulasiKerjaView").then(m => ({ default: m.LatihanSimulasiKerjaView || (m as any).default })));
const LatihanView = lazyWithRetry(() => import("./components/LatihanView").then(m => ({ default: m.LatihanView || (m as any).default })));
const PusatUpgradeView = lazyWithRetry(() => import("./components/PusatUpgradeView").then(m => ({ default: m.PusatUpgradeView || (m as any).default })));
const PortalMentorView = lazyWithRetry(() => import("./components/PortalMentorView").then(m => ({ default: m.PortalMentorView || (m as any).default })));
const PortalHrdView = lazyWithRetry(() => import("./components/PortalHrdView").then(m => ({ default: m.PortalHrdView || (m as any).default })));
const AdaptiveAssessmentView = lazyWithRetry(() => import("./components/AdaptiveAssessmentView").then(m => ({ default: m.AdaptiveAssessmentView || (m as any).default })));
const CvAtsBuilderView = lazyWithRetry(() => import("./components/CvAtsBuilderView").then(m => ({ default: m.CvAtsBuilderView || (m as any).default })));
const VoiceInterviewView = lazyWithRetry(() => import("./components/VoiceInterviewView").then(m => ({ default: m.VoiceInterviewView || (m as any).default })));

export default function App() {
  // Navigation & UI States
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("skillora_logged_in") === "true";
  });
  const {
    profile, setProfile,
    courses, setCourses,
    rooms, setRooms,
    jobs, setJobs,
    notifications, setNotifications,
    forumPosts, setForumPosts,
    reviews, setReviews,
    loading, setLoading,
    loadData
  } = useAppEngine(isLoggedIn);
  useEffect(() => {
    if (isLoggedIn && !loading && !profile) {
      safeStorage.clearAuthSession();
      clearAuthQueryCache();
      setIsLoggedIn(false);
    }
  }, [isLoggedIn, loading, profile]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("skillora_dark_mode") === "true";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("skillora_dark_mode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("skillora_dark_mode", "false");
    }
  }, [darkMode]);

  // Page title synchronization & scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    const pathMap: Record<string, string> = {
      "/": "Dashboard Belajar",
      "/belajar": "Dashboard Belajar",
      "/belajar/katalog": "Katalog Kursus",
      "/belajar/proyek": "Proyek Portfolio",
      "/jelajahi": "Eksplorasi Fitur",
      "/katalog": "Katalog Kursus",
      "/materi": "Materi Kursus",
      "/latihan": "Latihan & Kuis",
      "/sertifikasi": "Sertifikasi Kompetensi",
      "/analitik": "Analitik & Statistik",
      "/forum": "Komunitas & Forum",
      "/komunitas": "Komunitas & Forum",
      "/komunitas/kolaborasi": "Ruang Kolaborasi Tim",
      "/komunitas/event": "Event & Webinar Live",
      "/profil": "Profil Pengguna",
      "/profil/analitik": "Analitik Belajar",
      "/profil/toko": "Toko Gems & Rewards",
      "/lms": "Kelola LMS",
      "/kolaborasi": "Ruang Kolaborasi",
      "/toko": "Toko Hadiah",
      "/karir": "Bursa Kerja & Karir",
      "/karier": "Bursa Kerja & HR",
      "/karier/simulasi": "Simulasi Tes & Wawancara",
      "/karier/asesmen-adaptif": "Asesmen AI Adaptif (CAT)",
      "/karier/cv-ats": "CV ATS Builder & Audit AI",
      "/karier/mock-interview": "Mock Interview Suara AI",
      "/karier/beasiswa": "Pusat Beasiswa",
      "/karier/mentoring": "Mentoring 1-on-1",
      "/pusat-upgrade": "Pusat Upgrade & Billing",
      "/portal-mentor": "Portal Mentor & Reviewer",
      "/portal-hrd": "Portal Mitra HRD & ATS",
      "/kelola-lms": "Kelola LMS",
      "/simulasi": "Simulasi Kerja",
      "/faq": "Bantuan & FAQ",
      "/verify": "Verifikasi Sertifikat",
    };

    const routeTitle = pathMap[location.pathname] || (location.pathname.startsWith("/katalog/") ? "Detail Kursus" : "Skillora - Platform Edukasi");
    document.title = `${routeTitle} | Skillora`;
  }, [location.pathname]);


  // Logout handler
  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (e) {
      // fail silently
    }
    safeStorage.clearAuthSession();
    clearAuthQueryCache();
    setIsLoggedIn(false);
    setProfile(null);
    navigate("/belajar"); // Reset active tab to default
    showToast("Berhasil keluar dari sesi akun.", "info");
  };

  // Elegant Notification Toast State & Helper
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [toastTimeoutId, setToastTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    setToast({ message, type });
    const id = setTimeout(() => {
      setToast(null);
    }, 4000);
    setToastTimeoutId(id);
  };

  // Gamified Quiz Modal State
  const [currentQuizCourse, setCurrentQuizCourse] = useState<Course | null>(null);
  const [currentQuizLesson, setCurrentQuizLesson] = useState<Lesson | null>(null);

  // Project Submission / Certification Form States
  const [projectUrl, setProjectUrl] = useState("");
  const [studentCodeNotes, setStudentCodeNotes] = useState("");
  const [submittingProject, setSubmittingProject] = useState(false);
  const [projectBoilerplate, setProjectBoilerplate] = useState<string | null>(null);

  // Collaboration Chat State
  const [chatMessage, setChatMessage] = useState("");

  // New Skill input state
  const [newSkillName, setNewSkillName] = useState("");
  const [showAddSkillForm, setShowAddSkillForm] = useState(false);

  // User profile editor state

  // AI Mock Interview and AI Mentor Owl Chatbot
  const [activeInterviewJob, setActiveInterviewJob] = useState<JobVacancy | null>(null);
  const [interviewChat, setInterviewChat] = useState<{ sender: "user" | "hr"; text: string }[]>([]);
  const [interviewInput, setInterviewInput] = useState("");
  const [loadingInterview, setLoadingInterview] = useState(false);

  const [mentorChatOpen, setMentorChatOpen] = useState(false);
  const [loadingBoilerplate, setLoadingBoilerplate] = useState(false);

  const [activeCertificate, setActiveCertificate] = useState<Course | null>(null);
  const [verifiedCert, setVerifiedCert] = useState<{
    id: string;
    name: string;
    course: string;
    partner: string;
    date: string;
    theme: string;
  } | null>(null);
  const [activeFlashChallenge, setActiveFlashChallenge] = useState<{
    question: string;
    options: string[];
    correctIdx: number;
    rewardXP: number;
    rewardGems: number;
    explanation: string;
  } | null>(null);
  const [selectedFlashOption, setSelectedFlashOption] = useState<number | null>(null);
  const [flashResult, setFlashResult] = useState<string | null>(null);
  const [flashRewardClaimed, setFlashRewardClaimed] = useState(false);

  const [showScrollTop, setShowScrollTop] = useState(false);

  // Filter Jobs state
  const [jobQuery, setJobQuery] = useState("");
  const [jobFilterLocation, setJobFilterLocation] = useState("semua");
  const [jobFilterSalary, setJobFilterSalary] = useState("semua");

  // Claim Daily Rewards
  const handleClaimDaily = async () => {
    try {
      const data = await apiClient.post("/user/claim-daily");
      setProfile(data.profile);
      triggerConfetti("level");
      showToast("Hadiah harian berhasil diklaim! +100 XP & +10 Gems!", "success");
      const nData = await apiClient.get("/notifications");
      setNotifications(nData);
    } catch (e) {
      console.error(e);
      showToast("Gagal mengklaim hadiah harian.", "error");
    }
  };

  const handleCreateForumPost = async (title: string, content: string, tags: string[]) => {
    try {
      const data = await apiClient.post("/forum", { title, content, tags });
      setForumPosts(data);
      showToast("Postingan forum berhasil dibuat!", "success");
    } catch (e) {
      showToast("Gagal membuat postingan.", "error");
    }
  };

  const handleUpvoteForumPost = async (postId: string) => {
    try {
      const data = await apiClient.post(`/forum/${postId}/upvote`);
      setForumPosts(data);
    } catch (e) {
      // Handle error
    }
  };

  // Buy Streak Freeze
  const handleBuyFreeze = async () => {
    try {
      const data = await apiClient.post("/user/buy-freeze");
      setProfile(data.profile);
      triggerConfetti("level");
      showToast("Berhasil mengaktifkan perlindungan Streak Freeze!", "success");
      const nData = await apiClient.get("/notifications");
      setNotifications(nData);
    } catch (e) {
      console.error(e);
      showToast("Gagal membeli Streak Freeze.", "error");
    }
  };

  // Buy Store Item
  const handleBuyItem = async (itemId: string) => {
    try {
      const data = await apiClient.post("/user/buy-item", { itemId });
      setProfile(data.profile);
      triggerConfetti("quiz");
      showToast("Berhasil membeli item toko! Cek avatar barumu.", "success");
      const nData = await apiClient.get("/notifications");
      setNotifications(nData);
    } catch (e) {
      console.error(e);
      showToast("Gagal membeli item toko.", "error");
    }
  };

  // Set Profile Avatar
  const handleSetAvatar = async (avatar: string) => {
    try {
      const data = await apiClient.post("/user/set-avatar", { avatar });
      if (data?.profile) {
        setProfile(data.profile);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // HR Interview Chat
  const handleStartInterview = (job: JobVacancy) => {
    setActiveInterviewJob(job);
    setInterviewChat([
      {
        sender: "hr",
        text: `Halo Ahmad Zaki, senang bertemu dengan Anda. Saya Ibu Riska dari ${job.company}. Terima kasih sudah melamar posisi '${job.title}' melalui sistem penyaluran otomatis Skillora. Apakah Anda siap memulai simulasi wawancara teknis singkat hari ini?`
      }
    ]);
  };

  const handleSendInterviewMessage = async () => {
    if (!interviewInput.trim() || loadingInterview || !activeInterviewJob) return;
    const userMsg = interviewInput;
    setInterviewChat(prev => [...prev, { sender: "user", text: userMsg }]);
    setInterviewInput("");
    setLoadingInterview(true);
    try {
      const data = await apiClient.post("/jobs/interview", { jobId: activeInterviewJob.id, message: userMsg });
      setInterviewChat(prev => [...prev, { sender: "hr", text: data.response }]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInterview(false);
    }
  };

  // Get project assistance
  const handleGetProjectAssist = async (courseId: string) => {
    setLoadingBoilerplate(true);
    setProjectBoilerplate(null);
    try {
      const data = await apiClient.post("/project/assist", { courseId });
      setProjectBoilerplate(data.template);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBoilerplate(false);
    }
  };

  // Load Flash Challenge
  const handleGetFlashChallenge = async () => {
    setSelectedFlashOption(null);
    setFlashResult(null);
    setFlashRewardClaimed(false);
    try {
      const data = await courseApi.getFlashChallenge();
      setActiveFlashChallenge(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnswerFlashChallenge = (index: number) => {
    if (!activeFlashChallenge || flashResult) return;
    setSelectedFlashOption(index);
    const correct = index === activeFlashChallenge.correctIdx;
    if (correct) {
      setFlashResult("LULUS");
      triggerConfetti("quiz");
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          xp: prev.xp + activeFlashChallenge.rewardXP,
          gems: prev.gems + activeFlashChallenge.rewardGems
        };
      });
      setFlashRewardClaimed(true);
    } else {
      setFlashResult("ULANG");
    }
  };

  // Multi-apply (Mass apply)
  const handleBookmarkCourse = async (courseId: string) => {
    if (!profile) return;
    const currentBookmarks = profile.bookmarkedCourses || [];
    let updatedBookmarks: string[];
    const isBookmarked = currentBookmarks.includes(courseId);
    
    if (isBookmarked) {
      updatedBookmarks = currentBookmarks.filter(id => id !== courseId);
      showToast("Kursus dihapus dari daftar simpan.", "info");
    } else {
      updatedBookmarks = [...currentBookmarks, courseId];
      showToast("Kursus berhasil disimpan!", "success");
    }
    
    setProfile(prev => prev ? { ...prev, bookmarkedCourses: updatedBookmarks } : null);
    
    try {
      await apiClient.post("/user/bookmark-course", { courseId });
    } catch (e) {
      console.error("Gagal menyimpan bookmark ke server:", e);
    }
  };

  const handleBookmarkJob = async (jobId: string) => {
    // Optimistic Update
    const previousProfile = profile;
    if (profile) {
      const currentBookmarks = profile.bookmarkedJobs || [];
      const isBookmarked = currentBookmarks.includes(jobId);
      const newBookmarks = isBookmarked 
        ? currentBookmarks.filter(id => id !== jobId) 
        : [...currentBookmarks, jobId];
      
      setProfile({ ...profile, bookmarkedJobs: newBookmarks });
    }

    try {
      const data = await apiClient.post("/jobs/bookmark", { jobId });
      if (data?.profile) {
        setProfile(data.profile);
        showToast(data.profile.bookmarkedJobs?.includes(jobId) ? "Pekerjaan disimpan!" : "Pekerjaan dihapus dari simpanan.", "success");
      }
    } catch (e) {
      // Rollback on failure
      if (previousProfile) setProfile(previousProfile);
      showToast("Gagal menyimpan pekerjaan", "error");
    }
  };

  const handleApplyJobsMassal = async () => {
    const availableJobs = jobs.filter(j => j.status === "Tersedia");
    if (availableJobs.length === 0) return;
    triggerConfetti("certification");
    for (const job of availableJobs) {
      try {
        await apiClient.post("/jobs/apply", { jobId: job.id });
      } catch (e) {}
    }
    loadData();
  };

  

  useEffect(() => {
    const mainEl = document.getElementById("main-content");
    if (!mainEl) return;
    const handleScroll = () => {
      if (mainEl.scrollTop > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    mainEl.addEventListener("scroll", handleScroll);
    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, [location.pathname]); // re-bind when route changes

  // Handle Level-up/Success Confetti
  const triggerConfetti = async (type: "level" | "quiz" | "certification") => {
    const confetti = (await import("canvas-confetti")).default;
    if (type === "level") {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } else if (type === "quiz") {
      confetti({ particleCount: 80, spread: 50, colors: ["#a3e635", "#22c55e", "#eab308"] });
    } else {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: ["#3b82f6", "#10b981", "#eab308"] });
    }
  };

  const handleAddSkillSubmit = async () => {
    if (!newSkillName.trim()) return;
    try {
      const response = await apiClient.post("/user/add-skill", { skillName: newSkillName });
      const data = response;
      if (data && data.profile) {
        setProfile(data.profile);
        setNewSkillName("");
        setShowAddSkillForm(false);
        // Refresh jobs matchmaking live
        const jobsRes = await apiClient.get("/jobs");
        const jobsData = jobsRes;
        setJobs(jobsData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quiz Routing Logic
  const startQuiz = (course: Course, lesson: Lesson) => {
    setCurrentQuizCourse(course);
    setCurrentQuizLesson(lesson);
    navigate(`/belajar/kursus/${course.id}/latihan/${lesson.id}`);
  };

  // Submit project to AI Mentor
  const handleProjectSubmit = async (courseId: string) => {
    if (!projectUrl.trim()) return;
    setSubmittingProject(true);
    try {
      const data = await aiApi.submitProject(courseId, projectUrl, studentCodeNotes);
      if (data && data.review) {
        setReviews(prev => ({ ...prev, [courseId]: data.review }));
        setProfile(data.profile);
        triggerConfetti("certification");
        setProjectUrl("");
        setStudentCodeNotes("");
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingProject(false);
    }
  };

  // Chat message submit
  const handleSendMessage = async (roomId: string) => {
    if (!chatMessage.trim()) return;
    const userMsg = chatMessage;
    setChatMessage("");
    try {
      const data = await forumApi.postChat(roomId, userMsg);
      if (data && data.messages) {
        setRooms(prev =>
          prev.map(r => (r.id === roomId ? { ...r, chat: data.messages } : r))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Change task state in team board
  const handleMoveTask = async (roomId: string, taskId: string, newStatus: "todo" | "in-progress" | "review" | "done") => {
    try {
      const response = await apiClient.post("/collaboration/task-status", { roomId, taskId, status: newStatus });
      const data = response;
      if (data && data.tasks) {
        setRooms(prev =>
          prev.map(r => (r.id === roomId ? { ...r, tasks: data.tasks } : r))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Collaborative project
  const handleCollabProjectSubmit = async (roomId: string, url: string) => {
    try {
      const response = await apiClient.post("/collaboration/submit-project", { roomId, projectUrl: url });
      const data = response;
      if (data) {
        setRooms(prev =>
          prev.map(r => (r.id === roomId ? { ...r, status: "Menunggu Penilaian AI Mentor", projectUrl: url } : r))
        );
        setTimeout(() => {
          loadData();
        }, 1200);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Apply to industry job partner with optional CV ATS & coverNote
  const handleApplyJob = async (jobId: string, cvDocumentId?: number | null, coverNote?: string) => {
    try {
      const data = await jobApi.applyJob(jobId, cvDocumentId, coverNote);
      if (data && data.job) {
        setJobs(prev => prev.map(j => (j.id === jobId ? data.job : j)));
        setProfile(data.profile);
        triggerConfetti("certification");
        showToast("Lamaran berhasil dikirim!", "success");
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.response?.data?.message || err?.message || "Gagal mengirim lamaran.";
      showToast(msg, "error");
    }
  };

  // Clear system notifications
  const handleClearNotifications = async () => {
    try {
      await notificationApi.clearNotifications();
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const isVerifyRoute = location.pathname.startsWith("/verify/");

  if (isVerifyRoute) {
    return (
      <>
        <ToastNotification toast={toast} setToast={setToast} />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/verify/:certificateId" element={<PublicCertificateVerifyView />} />
          </Routes>
        </Suspense>
      </>
    );
  }


  if (!isLoggedIn) {
    return (
      <>
        {/* Toast notifications */}
        <ToastNotification toast={toast} setToast={setToast} />
        
        {/* Render beautiful immersive Login View */}
        <Suspense fallback={<LoadingScreen />}>
          <LoginView 
            onLoginSuccess={(newProfile) => {
              setProfile(newProfile);
              setIsLoggedIn(true);
            }} 
            showToast={showToast} 
          />
        </Suspense>
      </>
    );
  }

  if (loading || !profile) {
    return <LoadingScreen />;
  }

  if (!profile.hasCompletedOnboarding) {
    return (
      <>
        <ToastNotification toast={toast} setToast={setToast} />
        <Suspense fallback={<LoadingScreen />}>
          <OnboardingView 
            profile={profile} 
            onComplete={(updatedProfile) => {
              setProfile(updatedProfile);
              showToast("Onboarding selesai! Selamat datang.", "success");
            }} 
          />
        </Suspense>
      </>
    );
  }

  return (
    <>
      <NetworkStatusBanner />
      <div className="flex h-[100dvh] bg-white dark:bg-slate-950 relative overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-300">
        
        {/* NEW DESKTOP SIDEBAR */}
        <Sidebar profile={profile} onLogout={handleLogout} />

        {/* MAIN CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
          {/* UNIFIED PREMIUM TOP NAVBAR */}
          <div className="relative z-40">
          <TopNavbar
            profile={profile}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            showProfileDropdown={showProfileDropdown}
            setShowProfileDropdown={setShowProfileDropdown}
            notifications={notifications}
            handleClearNotifications={handleClearNotifications}
            handleClaimDaily={handleClaimDaily}
            onLogout={handleLogout}
            handleBuyFreeze={handleBuyFreeze}
            onOpenMentorChat={() => setMentorChatOpen(true)}
          />
        </div>

        {/* EXPANDED FULL-WIDTH MAIN CONTENT AREA */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-slate-50/40 dark:bg-slate-950/40 flex flex-col relative w-full scroll-smooth z-10 transition-colors duration-300" tabIndex={-1}>
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-8 pb-28 lg:pb-10 flex-1">
            {/* Elegant Sub-Tab Back Header for Mobile */}
            {location.pathname !== "/belajar" && location.pathname !== "/jelajahi" && location.pathname !== "/karier" && location.pathname !== "/komunitas" && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="lg:hidden flex items-center justify-between mb-6"
              >
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <span>←</span> Kembali
                </button>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {location.pathname.startsWith("/karier") ? "Bursa Kerja" : location.pathname === "/profil/toko" ? "Toko Gems" : location.pathname === "/profil/analitik" ? "Analisis" : location.pathname.split("/").pop()?.replace("-", " ")}
                </span>
              </motion.div>
            )}

            {/* Dynamic rendering of pages */}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <ErrorBoundary>
                  <Suspense fallback={<PageSkeleton />}><Routes location={location}>
                  <Route path="/" element={<Navigate to="/belajar" replace />} />
                  
                  {/* Belajar Loop */}
                  <Route path="/belajar" element={
                    <BelajarView
                      courses={courses}
                      profile={profile}
                      startQuiz={startQuiz}
                      reviews={reviews}
                      showAddSkillForm={showAddSkillForm}
                      setShowAddSkillForm={setShowAddSkillForm}
                      newSkillName={newSkillName}
                      setNewSkillName={setNewSkillName}
                      handleAddSkillSubmit={handleAddSkillSubmit}
                      onNavigateToSertifikasi={() => navigate('/belajar/proyek')}
                      showToast={showToast}
                      onProfileUpdate={setProfile}
                      handleGetFlashChallenge={handleGetFlashChallenge}
                    />
                  } />
                  
                  
                  <Route path="/belajar/katalog" element={
                    <KatalogKursusView 
                      courses={courses} 
                      profile={profile} 
                      onBookmarkToggle={handleBookmarkCourse} 
                    />
                  } />
                  <Route path="/belajar/kursus/:id" element={
                    <DetailKursusView 
                      courses={courses} 
                      startQuiz={startQuiz} 
                      profile={profile} 
                      onBookmarkToggle={handleBookmarkCourse} 
                      onProfileUpdate={setProfile}
                      showToast={showToast}
                    />
                  } />
                  <Route path="/belajar/kursus/:id/materi/:lessonId" element={
                    <MateriView 
                      courses={courses} 
                      profile={profile!} 
                      onProfileUpdate={setProfile}
                      showToast={showToast}
                    />
                  } />
                  <Route path="/belajar/kursus/:id/latihan/:lessonId" element={
                    <LatihanView
                      courses={courses}
                      profile={profile!}
                      onProfileUpdate={setProfile}
                      showToast={showToast}
                    />
                  } />
                  <Route path="/belajar/latihan" element={
                    <LatihanView
                      courses={courses}
                      profile={profile!}
                      onProfileUpdate={setProfile}
                      showToast={showToast}
                      initialCourse={currentQuizCourse}
                      initialLesson={currentQuizLesson}
                    />
                  } />

                  <Route path="/belajar/proyek" element={
                    <SertifikasiView
                      courses={courses}
                      profile={profile}
                      reviews={reviews}
                      projectUrl={projectUrl}
                      setProjectUrl={setProjectUrl}
                      studentCodeNotes={studentCodeNotes}
                      setStudentCodeNotes={setStudentCodeNotes}
                      submittingProject={submittingProject}
                      handleProjectSubmit={handleProjectSubmit}
                      projectBoilerplate={projectBoilerplate}
                      setProjectBoilerplate={setProjectBoilerplate}
                      loadingBoilerplate={loadingBoilerplate}
                      handleGetProjectAssist={handleGetProjectAssist}
                      setActiveCertificate={setActiveCertificate}
                      showToast={showToast}
                    />
                  } />

                  {/* Karier */}
                  <Route path="/karier" element={
                    profile ? (
                      <CareerView
                        jobs={jobs}
                        profile={profile}
                        handleApplyJob={handleApplyJob}
                        handleBookmarkJob={handleBookmarkJob}
                        handleStartInterview={handleStartInterview}
                        activeInterviewJob={activeInterviewJob}
                        setActiveInterviewJob={setActiveInterviewJob}
                        interviewChat={interviewChat}
                        interviewInput={interviewInput}
                        setInterviewInput={setInterviewInput}
                        handleSendInterviewMessage={handleSendInterviewMessage}
                        loadingInterview={loadingInterview}
                      />
                    ) : <Navigate to="/" />
                  } />
                  <Route path="/karier/simulasi" element={
                    profile ? (
                      <LatihanSimulasiKerjaView 
                        profile={profile} 
                        onAddXp={async (xp) => {
                          try {
                            const data = await apiClient.post("/user/add-xp", { xp });
                            if (data?.profile) {
                              setProfile(data.profile);
                            } else {
                              setProfile((prev) => prev ? { ...prev, xp: prev.xp + xp } : null);
                            }
                          } catch (e) {
                            setProfile((prev) => prev ? { ...prev, xp: prev.xp + xp } : null);
                          }
                          showToast(`+${xp} XP berhasil ditambahkan!`, "success");
                          triggerConfetti("quiz");
                        }} 
                      />
                    ) : <Navigate to="/" />
                  } />
                  <Route path="/karier/asesmen-adaptif" element={
                    profile ? (
                      <AdaptiveAssessmentView
                        profile={profile}
                        onProfileUpdate={setProfile}
                        showToast={showToast}
                      />
                    ) : <Navigate to="/" />
                  } />
                  <Route path="/karier/cv-ats" element={
                    profile ? (
                      <CvAtsBuilderView
                        profile={profile}
                        jobs={jobs}
                        showToast={showToast}
                      />
                    ) : <Navigate to="/" />
                  } />
                  <Route path="/karier/mock-interview" element={
                    profile ? (
                      <VoiceInterviewView
                        profile={profile}
                        jobs={jobs}
                        onProfileUpdate={setProfile}
                        showToast={showToast}
                      />
                    ) : <Navigate to="/" />
                  } />

                  {/* Redirect Legacy Simulation Routes to Standard Route */}
                  <Route path="/simulasi-kerja" element={<Navigate to="/karier/simulasi" replace />} />
                  <Route path="/belajar/simulasi" element={<Navigate to="/karier/simulasi" replace />} />
                  <Route path="/katalog-kursus" element={<Navigate to="/belajar/katalog" replace />} />
                  <Route path="/bursa-kerja" element={<Navigate to="/karier" replace />} />
                  <Route path="/sertifikasi" element={<Navigate to="/belajar/proyek" replace />} />
                  <Route path="/leaderboard" element={<Navigate to="/profil/analitik" replace />} />
                  <Route path="/latihan" element={<Navigate to="/belajar/latihan" replace />} />

                  {/* Jelajahi */}
                  <Route path="/jelajahi" element={
                    profile ? (
                      <JelajahiView
                        profile={profile}
                        onNavigate={(tab) => navigate(tab.startsWith("/") ? tab : `/${tab}`)}
                        onOpenFlashChallenge={handleGetFlashChallenge}
                        onOpenMentorChat={() => setMentorChatOpen(true)}
                      />
                    ) : <Navigate to="/" />
                  } />

                  {/* Komunitas */}
                  <Route path="/komunitas" element={
                    profile ? (
                      <ForumView
                        profile={profile}
                        posts={forumPosts}
                        handleCreatePost={handleCreateForumPost}
                        handleUpvote={handleUpvoteForumPost}
                        onPostsUpdated={setForumPosts}
                      />
                    ) : <Navigate to="/" />
                  } />
                  <Route path="/forum" element={<Navigate to="/komunitas" replace />} />

                  <Route path="/komunitas/kolaborasi" element={
                    <KolaborasiView
                      rooms={rooms}
                      chatMessage={chatMessage}
                      setChatMessage={setChatMessage}
                      handleSendMessage={handleSendMessage}
                      handleMoveTask={handleMoveTask}
                      handleCollabProjectSubmit={handleCollabProjectSubmit}
                      onRoomsUpdated={setRooms}
                      showToast={showToast}
                    />
                  } />
                  <Route path="/kolaborasi" element={<Navigate to="/komunitas/kolaborasi" replace />} />

                  <Route path="/komunitas/event" element={
                    <EventWebinarView onProfileUpdate={setProfile} showToast={showToast} />
                  } />

                  {/* Beasiswa & Mentoring */}
                  <Route path="/karier/beasiswa" element={<BeasiswaView />} />
                  <Route path="/karier/mentoring" element={
                    <MentoringView onProfileUpdate={setProfile} showToast={showToast} />
                  } />

                  {/* Profil */}
                  <Route path="/faq" element={<FaqView />} />
                  <Route path="/profil" element={
                    profile ? (
                      <ProfilView 
                        profile={profile} 
                        onSettingsSaved={(updatedProfile) => {
                          setProfile(updatedProfile);
                        }} 
                        showToast={showToast} 
                      />
                    ) : <Navigate to="/" />
                  } />
                  <Route path="/profil/analitik" element={
                    <AnalitikView profile={profile!} setProfile={(p) => setProfile(p)} showToast={showToast} />
                  } />
                  <Route path="/profil/toko" element={
                    profile ? (
                      <TokoView
                        profile={profile}
                        setProfile={setProfile}
                        handleClaimDaily={handleClaimDaily}
                        handleBuyItem={handleBuyItem}
                        handleSetAvatar={handleSetAvatar}
                        handleGetFlashChallenge={handleGetFlashChallenge}
                        showToast={showToast}
                      />
                    ) : <Navigate to="/" />
                  } />
                  <Route path="/pusat-upgrade" element={
                    <PusatUpgradeView
                      profile={profile}
                      onProfileUpdate={setProfile}
                      showToast={showToast}
                    />
                  } />

                  {/* Partner & Mentor Portals */}
                  <Route path="/portal-mentor" element={
                    ["mentor", "admin"].includes(profile?.accountRole || "") || profile?.role?.toLowerCase() === "developer" ? (
                      <PortalMentorView
                        profile={profile}
                        courses={courses}
                        onCoursesUpdated={setCourses}
                        showToast={showToast}
                      />
                    ) : <Navigate to="/belajar" replace />
                  } />

                  <Route path="/portal-hrd" element={
                    ["recruiter", "admin"].includes(profile?.accountRole || "") || profile?.role?.toLowerCase() === "developer" ? (
                      <PortalHrdView
                        profile={profile}
                        showToast={showToast}
                      />
                    ) : <Navigate to="/belajar" replace />
                  } />

                  {/* Kelola LMS */}
                  <Route path="/kelola-lms" element={
                    ["mentor", "admin"].includes(profile?.accountRole || "") || profile?.role?.toLowerCase() === "developer" ? (
                      <KelolaLmsView
                        courses={courses}
                        onCoursesUpdated={(updatedCourses) => setCourses(updatedCourses)}
                        showToast={showToast}
                      />
                    ) : <Navigate to="/belajar" replace />
                  } />

                  {/* 404 Fallback Route */}
                  <Route path="*" element={<Navigate to="/belajar" replace />} />
                </Routes></Suspense></ErrorBoundary>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* FOOTER */}
          {["/belajar", "/jelajahi", "/profil/toko", "/belajar/proyek", "/profil/analitik", "/komunitas"].includes(location.pathname) && <Footer />}
        </main>
        </div>
      </div>

      {/* Floating Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            onClick={() => document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 bg-slate-900/90 dark:bg-slate-100 dark:text-slate-900 text-white p-3 rounded-full shadow-lg hover:bg-slate-800 dark:hover:bg-white transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            aria-label="Kembali ke atas"
          >
            <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* MOBILE BOTTOM NAVIGATION TABS */}
      <nav 
        aria-label="Navigasi Mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 z-50 px-2 pt-1 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.04)]"
      >
        <div className="flex justify-around items-center max-w-md mx-auto relative z-10">
          {[
            { id: ROUTES.learning.root, name: "Beranda", icon: BookOpen },
            { id: ROUTES.learning.catalog, name: "Belajar", icon: Compass },
            { id: ROUTES.career.jobs, name: "Karier", icon: Briefcase },
            { id: ROUTES.community.root, name: "Komunitas", icon: Users },
            { id: ROUTES.profile.root, name: "Profil", icon: UserCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === ROUTES.learning.catalog 
              ? location.pathname.startsWith(ROUTES.learning.catalog) 
              : tab.id === ROUTES.learning.root 
                ? (location.pathname === "/" || location.pathname === ROUTES.learning.root) 
                : location.pathname.startsWith(tab.id);
            return (
              <Link
                key={tab.id}
                to={tab.id}
                aria-label={`Buka menu ${tab.name}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex flex-col items-center justify-center w-full min-h-[48px] py-1 relative transition-all active:scale-95 cursor-pointer ${
                  isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex flex-col items-center justify-center transition-colors">
                  <Icon className="w-5 h-5 mb-0.5" strokeWidth={isActive ? 2.5 : 2} />
                  <span className={`text-xs tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.name}</span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute top-0 w-8 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-b-full"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ======================================================== */}
      {/* OVERLAY PANEL: SLIDE-OUT CAREER AI MENTOR SIDEBAR DRAWER */}
      {/* ======================================================== */}
      {mentorChatOpen && (
        <Suspense fallback={null}>
          <MentorChatSidebar 
            open={mentorChatOpen} 
            onClose={() => setMentorChatOpen(false)} 
          />
        </Suspense>
      )}

      {/* ======================================================== */}
      {/* OVERLAY MODAL: LUXURIOUS QR-VERIFIED CERTIFICATE OVERLAY */}
      {/* ======================================================== */}
      {activeCertificate && (
        <Suspense fallback={null}>
          <CertificateModal 
              activeCertificate={activeCertificate} 
              setActiveCertificate={setActiveCertificate} 
              profile={profile} 
              showToast={showToast} 
              certId={activeCertificate ? reviews[activeCertificate.id]?.earnedCertificateId || '' : ''}
            />
        </Suspense>
      )}

      {/* ======================================================== */}
      {/* OVERLAY MODAL: DAILY FLASH CHALLENGE CONCEPTUAL TEST */}
      {/* ======================================================== */}
      {activeFlashChallenge && (
        <Suspense fallback={null}>
          <FlashChallengeModal
            activeFlashChallenge={activeFlashChallenge}
            setActiveFlashChallenge={setActiveFlashChallenge}
            selectedFlashOption={selectedFlashOption}
            flashResult={flashResult}
            handleAnswerFlashChallenge={handleAnswerFlashChallenge}
          />
        </Suspense>
      )}

      {/* ELEGANT TOAST NOTIFICATION */}
      <ToastNotification toast={toast} setToast={setToast} />

      </>
  );
}
