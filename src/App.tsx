/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, lazy, Suspense } from "react";
import { ToastNotification } from "./components/ToastNotification";
import { Sidebar } from "./components/Sidebar";
import { PageSkeleton } from "./components/PageSkeleton";
import { LoadingScreen } from "./components/LoadingScreen";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { TopNavbar } from "./components/TopNavbar";
import { NetworkStatusBanner } from "./components/NetworkStatusBanner";
import { GuestModeBanner } from "./components/GuestModeBanner";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { motion, AnimatePresence } from "motion/react";
import { safeStorage } from "./utils/storage";
import { clearAuthQueryCache } from "./lib/queryClient";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import { Course } from "./types";
import { apiClient } from "./api/apiClient";
import { useAppEngine } from "./hooks/useAppEngine";
import { useAppHandlers, triggerConfetti } from "./hooks/useAppHandlers";

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
const InteractiveLabView = lazyWithRetry(() => import("./components/InteractiveLabView").then(m => ({ default: m.InteractiveLabView || (m as any).default })));
const ArenaView = lazyWithRetry(() => import("./components/ArenaView").then(m => ({ default: m.ArenaView || (m as any).default })));
const PublicPortfolioView = lazyWithRetry(() => import("./components/PublicPortfolioView").then(m => ({ default: m.PublicPortfolioView || (m as any).default })));
const LmsWorkspaceView = lazyWithRetry(() => import("./components/LmsWorkspaceView").then(m => ({ default: m.LmsWorkspaceView || (m as any).default })));
import type { CopilotContextInfo } from "./components/MentorChatSidebar";

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
  } = useAppEngine(isLoggedIn, location.pathname);
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
      "/belajar/lms": "Ruang LMS Terfokus",
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
      "/lab": "Interactive Coding & Case Lab",
      "/arena": "Arena Battle Quiz, Tryout & Liga",
      "/karier/portofolio": "Portofolio Publik",
      "/karier/kampus": "Campus & Cohort Hub",
    };

    const routeTitle =
      pathMap[location.pathname] ||
      (location.pathname.startsWith("/lab/")
        ? "Workspace Interactive Lab"
        : location.pathname.startsWith("/portfolio/")
        ? "Portofolio Terverifikasi"
        : location.pathname.startsWith("/katalog/")
        ? "Detail Kursus"
        : "Skillora - Platform Edukasi & Karier");
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

  const [mentorChatOpen, setMentorChatOpen] = useState(false);
  const [copilotContext, setCopilotContext] = useState<CopilotContextInfo | undefined>(undefined);
  const [activeCertificate, setActiveCertificate] = useState<Course | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const openCopilotWithContext = (ctx?: CopilotContextInfo) => {
    setCopilotContext(ctx);
    setMentorChatOpen(true);
  };

  const {
    currentQuizCourse,
    currentQuizLesson,
    projectUrl,
    setProjectUrl,
    studentCodeNotes,
    setStudentCodeNotes,
    submittingProject,
    projectBoilerplate,
    setProjectBoilerplate,
    loadingBoilerplate,
    chatMessage,
    setChatMessage,
    newSkillName,
    setNewSkillName,
    showAddSkillForm,
    setShowAddSkillForm,
    activeInterviewJob,
    setActiveInterviewJob,
    interviewChat,
    interviewInput,
    setInterviewInput,
    loadingInterview,
    activeFlashChallenge,
    setActiveFlashChallenge,
    selectedFlashOption,
    flashResult,
    handleClaimDaily,
    handleCreateForumPost,
    handleUpvoteForumPost,
    handleBuyFreeze,
    handleBuyItem,
    handleSetAvatar,
    handleStartInterview,
    handleSendInterviewMessage,
    handleGetProjectAssist,
    handleGetFlashChallenge,
    handleAnswerFlashChallenge,
    handleBookmarkCourse,
    handleBookmarkJob,
    handleAddSkillSubmit,
    startQuiz,
    handleProjectSubmit,
    handleSendMessage,
    handleMoveTask,
    handleCollabProjectSubmit,
    handleApplyJob,
    handleClearNotifications,
  } = useAppHandlers({
    profile,
    setProfile,
    setJobs,
    setRooms,
    setNotifications,
    setForumPosts,
    setReviews,
    loadData,
    navigate,
    showToast,
  });

  useEffect(() => {
    const mainEl = document.getElementById("main-content");
    if (!mainEl) return;
    const handleScroll = () => {
      setShowScrollTop(mainEl.scrollTop > 300);
    };
    mainEl.addEventListener("scroll", handleScroll);
    return () => mainEl.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const isPublicRoute =
    location.pathname.startsWith("/verify/") || location.pathname.startsWith("/portfolio/");

  if (isPublicRoute) {
    return (
      <>
        <ToastNotification toast={toast} setToast={setToast} />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/verify/:certificateId" element={<PublicCertificateVerifyView />} />
            <Route path="/portfolio/:slug" element={<PublicPortfolioView />} />
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
      <div className="flex h-[100dvh] bg-[#fafafa] dark:bg-[#09090b] relative overflow-hidden text-zinc-950 dark:text-zinc-100 transition-colors duration-200">
        
        {/* NEW DESKTOP SIDEBAR */}
        <Sidebar profile={profile} onLogout={handleLogout} />

        {/* MAIN CONTENT WRAPPER */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
          {/* UNIFIED PREMIUM TOP NAVBAR */}
          <div className="relative z-40">
          <TopNavbar
            profile={profile}
            courses={courses}
            jobs={jobs}
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
            onOpenMentorChat={() => openCopilotWithContext(undefined)}
          />
        </div>

        <GuestModeBanner profile={profile} onSignInClick={handleLogout} />

        {/* EXPANDED FULL-WIDTH MAIN CONTENT AREA */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-[#fafafa] dark:bg-[#09090b] flex flex-col relative w-full scroll-smooth z-10 transition-colors duration-200" tabIndex={-1}>
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
                  {location.pathname.startsWith("/belajar/kursus")
                    ? "Detail Kursus"
                    : location.pathname.startsWith("/belajar/proyek")
                      ? "Proyek & Sertifikat"
                      : location.pathname.startsWith("/belajar/latihan")
                        ? "Latihan & Kuis"
                        : location.pathname.startsWith("/belajar/katalog")
                          ? "Katalog Kursus"
                          : location.pathname === "/karier/cv-ats"
                            ? "CV ATS Builder"
                            : location.pathname === "/karier/mock-interview"
                              ? "Mock Interview"
                              : location.pathname === "/karier/asesmen-adaptif"
                                ? "Asesmen Adaptif"
                                : location.pathname.startsWith("/karier")
                                  ? "Bursa Kerja"
                                  : location.pathname === "/profil/toko"
                                    ? "Toko Gems"
                                    : location.pathname === "/profil/analitik"
                                      ? "Analitik"
                                      : location.pathname.split("/").pop()?.replace("-", " ")}
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
                <ErrorBoundary resetKey={location.pathname}>
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
                  <Route path="/belajar/lms" element={
                    <LmsWorkspaceView
                      courses={courses}
                      profile={profile}
                      onCoursesUpdated={setCourses}
                      onProfileUpdate={setProfile}
                      showToast={showToast}
                      onOpenCopilot={openCopilotWithContext}
                    />
                  } />
                  <Route path="/lms" element={<Navigate to="/belajar/lms" replace />} />
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
                      onOpenCopilot={openCopilotWithContext}
                    />
                  } />
                  {/* Flagship: Interactive Coding & Case Lab */}
                  <Route path="/lab" element={
                    <InteractiveLabView
                      profile={profile}
                      onProfileUpdate={setProfile}
                      showToast={showToast}
                      onOpenCopilot={openCopilotWithContext}
                    />
                  } />
                  <Route path="/lab/:id" element={
                    <InteractiveLabView
                      profile={profile}
                      onProfileUpdate={setProfile}
                      showToast={showToast}
                      onOpenCopilot={openCopilotWithContext}
                    />
                  } />
                  {/* Competitive Arena: Battle Quiz, Tryout Akbar & Weekly League */}
                  <Route path="/arena" element={
                    <ArenaView
                      profile={profile}
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
                        onProfileUpdate={setProfile}
                        showToast={showToast}
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
                  <Route path="/karier/portofolio" element={
                    profile ? (
                      <CareerView
                        jobs={jobs}
                        profile={profile}
                        onProfileUpdate={setProfile}
                        showToast={showToast}
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
                  <Route path="/karier/kampus" element={
                    profile ? (
                      <CareerView
                        jobs={jobs}
                        profile={profile}
                        onProfileUpdate={setProfile}
                        showToast={showToast}
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
                        onProfileUpdate={setProfile}
                        showToast={showToast}
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

      {/* Floating Scroll to Top & Mobile Bottom Navigation */}
      <MobileBottomNav showScrollTop={showScrollTop} />

      {/* ======================================================== */}
      {/* OVERLAY PANEL: SLIDE-OUT CAREER AI MENTOR SIDEBAR DRAWER */}
      {/* ======================================================== */}
      {mentorChatOpen && (
        <Suspense fallback={null}>
          <MentorChatSidebar 
            open={mentorChatOpen} 
            onClose={() => setMentorChatOpen(false)} 
            copilotContext={copilotContext}
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
