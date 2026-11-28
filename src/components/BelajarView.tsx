import React, { useState, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Course, Lesson, Profile } from "../types";
import { userApi } from "../api/apiClient";
import { BelajarHeader } from "../features/learning/components/BelajarHeader";
import { BelajarMetricsStrip } from "../features/learning/components/BelajarMetricsStrip";
import { ContinueLearningCard } from "../features/learning/components/ContinueLearningCard";
import { RecommendedCoursesSection } from "../features/learning/components/RecommendedCoursesSection";
import { DashboardSidebar } from "../features/learning/components/DashboardSidebar";
import { NewUserOnboardingCard } from "../features/learning/components/NewUserOnboardingCard";
import { CareerJourneyStepper } from "../features/learning/components/CareerJourneyStepper";
import { SmartRoadmapCard } from "./SmartRoadmapCard";
import { Terminal, Trophy, ArrowUpRight, Compass, ChevronDown, ChevronUp } from "lucide-react";

const AutoCvModal = lazy(() => import("./AutoCvModal").then((m) => ({ default: m.AutoCvModal })));
const CareerReadinessCalculator = lazy(() =>
  import("./CareerReadinessCalculator").then((m) => ({ default: m.CareerReadinessCalculator }))
);

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
  handleGetFlashChallenge,
}: BelajarViewProps) {
  const navigate = useNavigate();
  const [targetRole] = useState<string>("Frontend Engineer");
  const [showAutoCvModal, setShowAutoCvModal] = useState<boolean>(false);
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [showRoadmap, setShowRoadmap] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("semua");
  const [selectedActiveCourseIndex, setSelectedActiveCourseIndex] = useState<number>(0);
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);
  const [savingWeeklyGoal, setSavingWeeklyGoal] = useState(false);

  const weeklyTarget = profile.weeklyTargetDays ?? 5;

  const handleSetWeeklyTarget = async (days: number) => {
    setSavingWeeklyGoal(true);
    try {
      const res = await userApi.updateSettings({ weeklyTargetDays: days });
      if (res?.profile) onProfileUpdate(res.profile);
      showToast?.(`Target konsistensi mingguan diatur ke ${days} hari/minggu.`, "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal menyimpan target mingguan.", "error");
    } finally {
      setSavingWeeklyGoal(false);
    }
  };

  const handleClaimQuest = async (questId: string) => {
    try {
      setClaimingQuestId(questId);
      const data = await userApi.claimDailyQuest(questId);
      if (data && data.profile) {
        onProfileUpdate(data.profile);
        showToast?.("Hadiah misi berhasil diklaim.", "success");
      }
    } catch (err: any) {
      showToast?.(err.message || "Gagal mengklaim misi.", "error");
    } finally {
      setClaimingQuestId(null);
    }
  };

  const safeCourses = useMemo(() => (Array.isArray(courses) ? courses : []), [courses]);

  const getCourseProgress = (course: Course) => {
    if (!course || !Array.isArray(course.lessons) || course.lessons.length === 0) return 0;
    const completed = course.lessons.filter((l) => l.completed).length;
    return Math.round((completed / course.lessons.length) * 100);
  };

  const activeCourses = useMemo(
    () =>
      safeCourses.filter((c) => {
        const progress = getCourseProgress(c);
        return progress > 0 && progress < 100;
      }),
    [safeCourses]
  );

  const primaryActiveCourse = useMemo(() => {
    if (activeCourses.length > 0) {
      const idx = Math.min(selectedActiveCourseIndex, activeCourses.length - 1);
      return activeCourses[idx];
    }
    const uncompletedCourse = safeCourses.find((c) => getCourseProgress(c) < 100);
    return uncompletedCourse || safeCourses[0];
  }, [safeCourses, activeCourses, selectedActiveCourseIndex]);

  const activeLesson = useMemo(
    () =>
      primaryActiveCourse?.lessons?.find((l) => !l.completed) ||
      primaryActiveCourse?.lessons?.[0],
    [primaryActiveCourse]
  );

  const roleSkillRequirements: Record<string, string[]> = {
    "Frontend Engineer": ["React", "TypeScript", "Tailwind CSS", "REST API", "Git"],
    "Fullstack Engineer": ["React", "Node.js", "Express", "TypeScript", "PostgreSQL", "Git"],
    "UI/UX Designer": ["Figma", "Design System", "User Research", "Wireframing", "Prototyping"],
    "Kesiapan BUMN & TPA": [
      "Kemampuan Verbal",
      "Penalaran Logis",
      "TKD BUMN",
      "Kemampuan Kuantitatif",
    ],
  };

  const userSkillsList = useMemo(
    () =>
      (profile?.skills || []).map((s: any) =>
        (typeof s === "string" ? s : s.name).toLowerCase()
      ),
    [profile?.skills]
  );

  const requiredSkills =
    roleSkillRequirements[targetRole] || roleSkillRequirements["Frontend Engineer"];

  const skillGapAnalysis = useMemo(() => {
    const matched: string[] = [];
    const missing: string[] = [];

    requiredSkills.forEach((reqSkill) => {
      const isMastered =
        userSkillsList.some(
          (userSkill) =>
            userSkill.includes(reqSkill.toLowerCase()) ||
            reqSkill.toLowerCase().includes(userSkill)
        ) || (profile?.certifiedCourses || []).length > 0;

      if (isMastered) matched.push(reqSkill);
      else missing.push(reqSkill);
    });

    const gapPercentage = Math.round((matched.length / requiredSkills.length) * 100);
    return { matched, missing, gapPercentage };
  }, [requiredSkills, userSkillsList, profile]);

  const categories = ["semua", "Programming", "UI/UX", "BUMN", "Data"];

  const filteredRecommendedCourses = useMemo(() => {
    let list = safeCourses;
    if (selectedCategory !== "semua") {
      list = list.filter(
        (c) => c && c.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }
    return list.slice(0, 3);
  }, [safeCourses, selectedCategory]);

  const completedCoursesCount = profile?.certifiedCourses?.length || 0;
  const certifiedCoursesCount =
    profile?.certificates?.length || profile?.certifiedCourses?.length || 0;
  const isNewUser = activeCourses.length === 0 && completedCoursesCount === 0;

  return (
    <div className="w-full relative z-10 space-y-6">
      {/* ZONE 1: Editorial Greeting Header */}
      <BelajarHeader
        profile={profile}
        activeCourseTitle={primaryActiveCourse?.title}
        setShowAutoCvModal={setShowAutoCvModal}
        showCalculator={showCalculator}
        setShowCalculator={setShowCalculator}
      />

      {/* Optional Expandable Career Readiness Calculator */}
      <AnimatePresence>
        {showCalculator && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
          >
            <Suspense
              fallback={
                <div className="p-6 bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl animate-pulse h-44" />
              }
            >
              <CareerReadinessCalculator />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ZONE 2: Unified Hairline KPI Strip */}
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

      {/* ZONE 3 & 4: Balanced 2-Column Editorial Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Focused Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {/* Primary Focal Anchor */}
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
              onNavigateToLesson={(courseId, lessonId) =>
                navigate(`/belajar/kursus/${courseId}/materi/${lessonId}`)
              }
              onNavigateToKatalog={() => navigate("/belajar/katalog")}
              onNavigateToSertifikasi={onNavigateToSertifikasi}
            />
          )}

          {/* Compact 4-Step Career Journey Rail */}
          <CareerJourneyStepper
            profile={profile}
            hasActiveOrCompletedCourse={activeCourses.length > 0 || completedCoursesCount > 0}
          />

          {/* Clean 2-Item Practice & Arena Strip (No Uppercase Shouting) */}
          <div className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/80 dark:divide-zinc-800/80">
            <button
              type="button"
              onClick={() => navigate("/lab")}
              className="group text-left p-5 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <Terminal className="w-3.5 h-3.5" />
                  Lab Praktik
                </span>
                <ArrowUpRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </div>
              <h3 className="font-display text-[15px] font-semibold text-zinc-950 dark:text-white">
                Interactive Coding &amp; Case Lab
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Uji kode JavaScript, SQL, dan studi kasus BUMN dengan audit rubrik terstruktur.
              </p>
            </button>

            <button
              type="button"
              onClick={() => navigate("/arena")}
              className="group text-left p-5 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  <Trophy className="w-3.5 h-3.5" />
                  Arena &amp; Liga
                </span>
                <ArrowUpRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </div>
              <h3 className="font-display text-[15px] font-semibold text-zinc-950 dark:text-white">
                Battle Quiz, Tryout &amp; Liga Mingguan
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Latihan kecepatan, tryout berbatas waktu, dan pemeringkatan divisi mingguan.
              </p>
            </button>
          </div>

          {/* Progressive Disclosure: AI Study Roadmap (On-Demand to keep Dashboard focused) */}
          <div className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowRoadmap((prev) => !prev)}
              className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-zinc-50/70 dark:hover:bg-zinc-900/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                    Rencana Belajar Mingguan AI
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    Susun jadwal target peran {targetRole} sesuai waktu luang Anda
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-300 shrink-0">
                {showRoadmap ? "Tutup" : "Buka"}
                {showRoadmap ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </span>
            </button>

            <AnimatePresence>
              {showRoadmap && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="p-5 pt-0 border-t border-zinc-200/70 dark:border-zinc-800/80"
                >
                  <div className="pt-4">
                    <SmartRoadmapCard defaultRole={targetRole} showToast={showToast} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Curated Recommended Courses */}
          <RecommendedCoursesSection
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            filteredRecommendedCourses={filteredRecommendedCourses}
            getCourseProgress={getCourseProgress}
            onNavigateToCourse={(courseId) => navigate(`/belajar/kursus/${courseId}`)}
            onNavigateToKatalog={() => navigate("/belajar/katalog")}
          />
        </div>

        {/* Unified Right Summary Column (4 cols) */}
        <div className="lg:col-span-4 min-w-0">
          <DashboardSidebar
            profile={profile}
            courses={safeCourses}
            claimingQuestId={claimingQuestId}
            handleClaimQuest={handleClaimQuest}
            handleGetFlashChallenge={handleGetFlashChallenge}
            onNavigateToSertifikasi={onNavigateToSertifikasi}
            onNavigateToSimulasi={() => navigate("/karier/simulasi")}
            onNavigateToKarier={() => navigate("/karier")}
            onNavigateToKomunitas={() => navigate("/komunitas")}
            weeklyTarget={weeklyTarget}
            savingWeeklyGoal={savingWeeklyGoal}
            onSetWeeklyTarget={handleSetWeeklyTarget}
          />
        </div>
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
