import React, { useState, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Course, Lesson, Profile } from "../types";
import { courseApi, userApi } from "../api/apiClient";
import { BelajarHeader } from "../features/learning/components/BelajarHeader";
import { BelajarMetricsStrip } from "../features/learning/components/BelajarMetricsStrip";
import { ContinueLearningCard } from "../features/learning/components/ContinueLearningCard";
import { RecommendedNextActions } from "../features/learning/components/RecommendedNextActions";
import { RecommendedCoursesSection } from "../features/learning/components/RecommendedCoursesSection";
import { DashboardSidebar } from "../features/learning/components/DashboardSidebar";
import { NewUserOnboardingCard } from "../features/learning/components/NewUserOnboardingCard";

const AutoCvModal = lazy(() => import("./AutoCvModal").then(m => ({ default: m.AutoCvModal })));
const CareerReadinessCalculator = lazy(() => import("./CareerReadinessCalculator").then(m => ({ default: m.CareerReadinessCalculator })));

interface BelajarViewProps {
  courses: Course[];
  profile: Profile;
  onProfileUpdate: (newProfile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
  onNavigateToSertifikasi: () => void;
  handleGetFlashChallenge?: () => void;
  initialCourse?: Course | null;
  initialLesson?: Lesson | null;
  startQuiz?: (course: Course, lesson: Lesson) => void;
  [key: string]: any;
}

export function BelajarView({
  courses = [],
  profile,
  onProfileUpdate,
  showToast,
  onNavigateToSertifikasi,
  handleGetFlashChallenge
}: BelajarViewProps) {
  const navigate = useNavigate();
  const [targetRole, setTargetRole] = useState<string>("Frontend Engineer");
  const [showAutoCvModal, setShowAutoCvModal] = useState<boolean>(false);
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("semua");
  const [selectedActiveCourseIndex, setSelectedActiveCourseIndex] = useState<number>(0);
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);

  // Daily quest claiming handler
  const handleClaimQuest = async (questId: string) => {
    try {
      setClaimingQuestId(questId);
      const data = await userApi.claimDailyQuest(questId);
      if (data && data.profile) {
        onProfileUpdate(data.profile);
        if (showToast) showToast("Hadiah misi berhasil diklaim!", "success");
      }
    } catch (err: any) {
      if (showToast) showToast(err.message || "Gagal mengklaim misi.", "error");
    } finally {
      setClaimingQuestId(null);
    }
  };

  const safeCourses = useMemo(() => {
    return Array.isArray(courses) ? courses : [];
  }, [courses]);

  const getCourseProgress = (course: Course) => {
    if (!course || !Array.isArray(course.lessons) || course.lessons.length === 0) return 0;
    const completed = course.lessons.filter(l => l.completed).length;
    return Math.round((completed / course.lessons.length) * 100);
  };

  // Courses currently in progress (0 < progress < 100)
  const activeCourses = useMemo(() => {
    return safeCourses.filter(c => {
      const progress = getCourseProgress(c);
      return progress > 0 && progress < 100;
    });
  }, [safeCourses]);

  // Primary active course to focus on
  const primaryActiveCourse = useMemo(() => {
    if (activeCourses.length > 0) {
      const idx = Math.min(selectedActiveCourseIndex, activeCourses.length - 1);
      return activeCourses[idx];
    }
    // If no course in-progress, check if there is any started course or first course
    const uncompletedCourse = safeCourses.find(c => getCourseProgress(c) < 100);
    return uncompletedCourse || safeCourses[0];
  }, [safeCourses, activeCourses, selectedActiveCourseIndex]);

  const activeLesson = useMemo(() => {
    return primaryActiveCourse?.lessons?.find(l => !l.completed) || primaryActiveCourse?.lessons?.[0];
  }, [primaryActiveCourse]);

  // Skill Gap Calculation based on target role
  const roleSkillRequirements: Record<string, string[]> = {
    "Frontend Engineer": ["React", "TypeScript", "Tailwind CSS", "REST API", "Git"],
    "Fullstack Engineer": ["React", "Node.js", "Express", "TypeScript", "PostgreSQL", "Git"],
    "UI/UX Designer": ["Figma", "Design System", "User Research", "Wireframing", "Prototyping"],
    "Kesiapan BUMN & TPA": ["Kemampuan Verbal", "Penalaran Logis", "TKD BUMN", "Kemampuan Kuantitatif"]
  };

  const userSkillsList = useMemo(() => {
    return (profile?.skills || []).map((s: any) => (typeof s === "string" ? s : s.name).toLowerCase());
  }, [profile?.skills]);

  const requiredSkills = roleSkillRequirements[targetRole] || roleSkillRequirements["Frontend Engineer"];

  const skillGapAnalysis = useMemo(() => {
    const matched: string[] = [];
    const missing: string[] = [];

    requiredSkills.forEach(reqSkill => {
      const isMastered =
        userSkillsList.some(
          userSkill =>
            userSkill.includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(userSkill)
        ) || ((profile?.certifiedCourses || []).length > 0);

      if (isMastered) {
        matched.push(reqSkill);
      } else {
        missing.push(reqSkill);
      }
    });

    const gapPercentage = Math.round((matched.length / requiredSkills.length) * 100);
    return { matched, missing, gapPercentage };
  }, [requiredSkills, userSkillsList, profile]);

  const categories = ["semua", "Programming", "UI/UX", "BUMN", "Data"];

  const filteredRecommendedCourses = useMemo(() => {
    let list = safeCourses;
    if (selectedCategory !== "semua") {
      list = list.filter(
        c => c && c.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }
    return list.slice(0, 3);
  }, [safeCourses, selectedCategory]);

  const completedCoursesCount = profile?.certifiedCourses?.length || 0;
  const certifiedCoursesCount = profile?.certificates?.length || profile?.certifiedCourses?.length || 0;
  const isNewUser = activeCourses.length === 0 && completedCoursesCount === 0;

  return (
    <div className="animate-in fade-in duration-200 w-full pb-16 lg:pb-8 relative z-10 space-y-5 sm:space-y-6">
      {/* 1. GREETING & CONTEXT HEADER */}
      <BelajarHeader
        profile={profile}
        activeCourseTitle={primaryActiveCourse?.title}
        setShowAutoCvModal={setShowAutoCvModal}
        showCalculator={showCalculator}
        setShowCalculator={setShowCalculator}
      />

      {/* Expandable Career Readiness Calculator */}
      <AnimatePresence>
        {showCalculator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Suspense fallback={<div className="p-6 bg-white dark:bg-slate-800 rounded-2xl animate-pulse h-48" />}>
              <CareerReadinessCalculator />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. PROGRESS METRICS (3-4 KPI BERSIH) */}
      <BelajarMetricsStrip
        activeCourses={activeCourses}
        primaryActiveCourse={primaryActiveCourse}
        skillGapPercentage={skillGapAnalysis.gapPercentage}
        targetRole={targetRole}
        completedCoursesCount={completedCoursesCount}
        certifiedCoursesCount={certifiedCoursesCount}
        profile={profile}
        onNavigateToKatalog={() => navigate("/belajar/katalog")}
        onOpenCalculator={() => setShowCalculator(true)}
        onNavigateToSertifikasi={onNavigateToSertifikasi}
        onNavigateToAnalitik={() => navigate("/profil/analitik")}
      />

      {/* 3. MAIN DASHBOARD CONTENT (2-COLUMN BALANCED DESKTOP GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 items-start">
        {/* Left / Main Column (65% width) */}
        <main className="lg:col-span-2 space-y-5 sm:space-y-6 min-w-0">
          {/* Main Focus: Continue Learning OR New User Onboarding */}
          {isNewUser ? (
            <NewUserOnboardingCard
              userName={profile.name ? profile.name.split(" ")[0] : "Siswa"}
              courses={courses}
              onSelectCourse={(courseId) => navigate(`/belajar/kursus/${courseId}`)}
              onNavigateToKatalog={() => navigate("/belajar/katalog")}
            />
          ) : (
            <ContinueLearningCard
              primaryActiveCourse={primaryActiveCourse}
              activeCourses={activeCourses}
              selectedActiveCourseIndex={selectedActiveCourseIndex}
              setSelectedActiveCourseIndex={setSelectedActiveCourseIndex}
              activeLesson={activeLesson}
              getCourseProgress={getCourseProgress}
              onNavigateToCourse={(courseId) => navigate(`/belajar/kursus/${courseId}`)}
              onNavigateToLesson={(courseId, lessonId) => navigate(`/belajar/kursus/${courseId}/materi/${lessonId}`)}
              onNavigateToKatalog={() => navigate("/belajar/katalog")}
              onNavigateToSertifikasi={onNavigateToSertifikasi}
            />
          )}

          {/* Recommended Next Actions */}
          <RecommendedNextActions
            primaryActiveCourse={primaryActiveCourse}
            activeLesson={activeLesson}
            profile={profile}
            targetRole={targetRole}
            skillGapPercentage={skillGapAnalysis.gapPercentage}
            onNavigateToLesson={(courseId, lessonId) => navigate(`/belajar/kursus/${courseId}/materi/${lessonId}`)}
            onNavigateToCourse={(courseId) => navigate(`/belajar/kursus/${courseId}`)}
            onOpenSkillGapModal={() => setShowCalculator(true)}
            onGetFlashChallenge={handleGetFlashChallenge}
            onNavigateToSertifikasi={onNavigateToSertifikasi}
            onNavigateToSimulasi={() => navigate("/karier/simulasi")}
          />

          {/* Recommended Courses Section (Preview Ringkas) */}
          <RecommendedCoursesSection
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            filteredRecommendedCourses={filteredRecommendedCourses}
            getCourseProgress={getCourseProgress}
            onNavigateToCourse={(courseId) => navigate(`/belajar/kursus/${courseId}`)}
            onNavigateToKatalog={() => navigate("/belajar/katalog")}
          />
        </main>

        {/* Right / Sidebar Column (35% width) */}
        <DashboardSidebar
          profile={profile}
          claimingQuestId={claimingQuestId}
          handleClaimQuest={handleClaimQuest}
          handleGetFlashChallenge={handleGetFlashChallenge}
          onNavigateToSertifikasi={onNavigateToSertifikasi}
          onNavigateToSimulasi={() => navigate("/karier/simulasi")}
          onNavigateToKarier={() => navigate("/karier")}
          onNavigateToKomunitas={() => navigate("/komunitas")}
        />
      </div>

      {/* Auto CV Modal */}
      <AnimatePresence>
        {showAutoCvModal && (
          <Suspense fallback={null}>
            <AutoCvModal
              profile={profile}
              onClose={() => setShowAutoCvModal(false)}
              showToast={showToast}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}

export default BelajarView;
