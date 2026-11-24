import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Brain, ChevronRight } from "lucide-react";
import { Course, Lesson, Profile, Question } from "../types";
import { ROUTES } from "../routes";
import { LatihanViewProps, HubTab } from "../features/practice/types";
import { useQuizSession } from "../features/practice/hooks/useQuizSession";
import { PracticeHeader } from "../features/practice/components/PracticeHeader";
import { DrillsTab } from "../features/practice/components/DrillsTab";
import { TopicsTab } from "../features/practice/components/TopicsTab";
import { MistakesTab } from "../features/practice/components/MistakesTab";
import { AnalyticsTab } from "../features/practice/components/AnalyticsTab";
import { QuizActiveScreen } from "../features/practice/components/QuizActiveScreen";
import { QuizResultModal } from "../features/practice/components/QuizResultModal";

export function LatihanView({
  courses,
  profile,
  onProfileUpdate,
  showToast,
  initialCourse,
  initialLesson
}: LatihanViewProps) {
  const { id: paramCourseId, lessonId: paramLessonId } = useParams();
  const navigate = useNavigate();

  // Navigation Hub Tab
  const [activeHubTab, setActiveHubTab] = useState<HubTab>("drills");

  // Topic Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("Semua");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("Semua");
  const [selectedStatus, setSelectedStatus] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Quiz Engine Hook
  const quiz = useQuizSession({
    courses,
    profile,
    onProfileUpdate,
    showToast,
    initialCourse,
    initialLesson,
    paramCourseId,
    paramLessonId,
  });

  // Daily target calculation
  const dailyTarget = 10;
  const questionsDoneToday = useMemo(() => {
    if (!profile.quizAttempts) return 0;
    const todayStr = new Date().toISOString().split("T")[0];
    return profile.quizAttempts
      .filter(a => a.completedAt && a.completedAt.includes(todayStr))
      .reduce((acc, curr) => acc + (curr.maxScore ? 5 : 3), 0);
  }, [profile.quizAttempts]);

  const dailyProgressPercent = Math.min(Math.round((questionsDoneToday / dailyTarget) * 100), 100);

  // Extract all questions across courses
  const allAvailableQuestions = useMemo(() => {
    const list: { question: Question; courseTitle: string; lessonTitle: string; courseId: string; lessonId: string }[] = [];
    const safeCourses = Array.isArray(courses) ? courses : [];
    safeCourses.forEach(c => {
      if (Array.isArray(c.lessons)) {
        c.lessons.forEach(l => {
          if (Array.isArray(l.questions) && l.questions.length > 0) {
            l.questions.forEach(q => {
              list.push({
                question: q,
                courseTitle: c.title,
                lessonTitle: l.title,
                courseId: c.id,
                lessonId: l.id
              });
            });
          }
        });
      }
    });
    return list;
  }, [courses]);

  // Extract accumulated wrong questions
  const allWrongQuestions = useMemo(() => {
    const wrongList: { question: Question; courseTitle: string; lessonTitle: string }[] = [];
    if (profile.quizAttempts) {
      profile.quizAttempts.forEach(attempt => {
        if (attempt.wrongAnswers && attempt.wrongAnswers.length > 0) {
          attempt.wrongAnswers.forEach(q => {
            wrongList.push({
              question: q,
              courseTitle: attempt.courseTitle || "Kuis Umum",
              lessonTitle: attempt.lessonTitle || "Latihan"
            });
          });
        }
      });
    }
    return wrongList;
  }, [profile.quizAttempts]);

  // Topic & Lesson list for Topic-based Practice
  const topicList = useMemo(() => {
    const topics: {
      courseId: string;
      lessonId: string;
      courseTitle: string;
      lessonTitle: string;
      category: string;
      questionsCount: number;
      difficulty: string;
      isCompleted: boolean;
      bestScore: number;
    }[] = [];

    const safeCourses = Array.isArray(courses) ? courses : [];
    safeCourses.forEach(c => {
      if (Array.isArray(c.lessons)) {
        c.lessons.forEach(l => {
          const qCount = Array.isArray(l.questions) ? l.questions.length : 0;
          if (qCount > 0) {
            const prevAttempt = profile.quizAttempts?.filter(a => a.lessonId === l.id);
            const bestScore = prevAttempt && prevAttempt.length > 0 
              ? Math.max(...prevAttempt.map(a => a.percentage || 0)) 
              : 0;

            topics.push({
              courseId: c.id,
              lessonId: l.id,
              courseTitle: c.title,
              lessonTitle: l.title,
              category: c.category || "Web Development",
              questionsCount: qCount,
              difficulty: c.difficulty || "Pemula",
              isCompleted: l.completed,
              bestScore
            });
          }
        });
      }
    });

    return topics;
  }, [courses, profile]);

  // Filtered Topic List
  const filteredTopics = useMemo(() => {
    return topicList.filter(t => {
      const matchCategory = selectedCategory === "Semua" || t.category.toLowerCase().includes(selectedCategory.toLowerCase()) || t.courseTitle.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchDifficulty = selectedDifficulty === "Semua" || t.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
      const matchStatus = selectedStatus === "Semua" 
        ? true 
        : selectedStatus === "Belum" 
        ? !t.isCompleted 
        : t.isCompleted;
      const matchSearch = !searchQuery || t.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase()) || t.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());

      return matchCategory && matchDifficulty && matchStatus && matchSearch;
    });
  }, [topicList, selectedCategory, selectedDifficulty, selectedStatus, searchQuery]);

  // Accuracy and analytics metrics
  const overallAccuracy = useMemo(() => {
    if (!profile.quizAttempts || profile.quizAttempts.length === 0) return 0;
    const totalScore = profile.quizAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    return Math.round(totalScore / profile.quizAttempts.length);
  }, [profile.quizAttempts]);

  const perfectAttemptsCount = useMemo(() => {
    return profile.quizAttempts?.filter(a => a.percentage === 100).length || 0;
  }, [profile.quizAttempts]);

  const totalXpEarned = useMemo(() => {
    return profile.quizAttempts?.reduce((acc, curr) => acc + (curr.xpEarned || 0), 0) || 0;
  }, [profile.quizAttempts]);

  const chartProgressData = useMemo(() => {
    if (!profile.quizAttempts || profile.quizAttempts.length === 0) {
      return [
        { name: "Sesi 1", Skor: 40, XP: 40, Topic: "Persiapan Latihan" },
        { name: "Sesi 2", Skor: 60, XP: 80, Topic: "Latihan Cepat" },
        { name: "Sesi 3", Skor: 50, XP: 60, Topic: "Pondasi Pemula" },
        { name: "Sesi 4", Skor: 80, XP: 120, Topic: "Kuis CSS Grid" },
        { name: "Sesi 5", Skor: 70, XP: 100, Topic: "Kuis JS Async" },
        { name: "Sesi 6", Skor: 100, XP: 180, Topic: "Simulasi TKD" },
      ];
    }
    return [...profile.quizAttempts]
      .reverse()
      .slice(-8)
      .map((attempt, idx) => ({
        name: `Sesi ${idx + 1}`,
        Skor: attempt.percentage || 0,
        XP: attempt.xpEarned || 0,
        Topic: attempt.courseTitle || "Kuis"
      }));
  }, [profile.quizAttempts]);

  const categoryProficiencyData = useMemo(() => {
    if (!profile.quizAttempts || profile.quizAttempts.length === 0) {
      return [
        { category: "Web Dev", Akurasi: 75, Selesai: 3 },
        { category: "Backend", Akurasi: 60, Selesai: 2 },
        { category: "TKD BUMN", Akurasi: 85, Selesai: 4 },
        { category: "UI/UX", Akurasi: 70, Selesai: 2 }
      ];
    }

    const categoriesMap: Record<string, { totalScore: number; count: number }> = {};
    profile.quizAttempts.forEach(attempt => {
      let cat = attempt.courseTitle || "Kuis Umum";
      if (cat.toLowerCase().includes("web") || cat.toLowerCase().includes("frontend") || cat.toLowerCase().includes("react")) {
        cat = "Web Dev";
      } else if (cat.toLowerCase().includes("backend") || cat.toLowerCase().includes("node") || cat.toLowerCase().includes("database") || cat.toLowerCase().includes("sql")) {
        cat = "Backend";
      } else if (cat.toLowerCase().includes("bumn") || cat.toLowerCase().includes("tkd")) {
        cat = "TKD BUMN";
      } else if (cat.toLowerCase().includes("ui") || cat.toLowerCase().includes("ux") || cat.toLowerCase().includes("design")) {
        cat = "UI/UX";
      } else {
        cat = "Lainnya";
      }

      if (!categoriesMap[cat]) {
        categoriesMap[cat] = { totalScore: 0, count: 0 };
      }
      categoriesMap[cat].totalScore += attempt.percentage || 0;
      categoriesMap[cat].count += 1;
    });

    return Object.keys(categoriesMap).map(cat => ({
      category: cat,
      Akurasi: Math.round(categoriesMap[cat].totalScore / categoriesMap[cat].count),
      Selesai: categoriesMap[cat].count
    }));
  }, [profile.quizAttempts]);

  // If Quiz is Completed & Result Ready
  if (quiz.submissionResult) {
    return (
      <QuizResultModal
        result={quiz.submissionResult}
        flaggedQuestions={quiz.flaggedQuestions}
        handleRetryWrongQuestions={quiz.handleRetryWrongAnswers}
        startQuizSession={quiz.startQuizSession}
        exitQuiz={quiz.handleExitQuiz}
        showToast={showToast}
      />
    );
  }

  // If Active Quiz Session is in progress
  if (quiz.activeQuizSession) {
    return (
      <QuizActiveScreen
        session={quiz.activeQuizSession}
        currentQuestionIndex={quiz.currentQuestionIndex}
        selectedAnswers={quiz.selectedAnswers}
        flaggedQuestions={quiz.flaggedQuestions}
        timeRemaining={quiz.timeRemaining}
        isSubmitting={quiz.isSubmitting}
        soundMuted={quiz.soundMuted}
        setSoundMuted={quiz.setSoundMuted}
        isFocusMode={quiz.isFocusMode}
        setIsFocusMode={quiz.setIsFocusMode}
        showAiHint={quiz.showAiHint}
        setShowAiHint={quiz.setShowAiHint}
        showQuestionGridDrawer={quiz.showQuestionGridDrawer}
        setShowQuestionGridDrawer={quiz.setShowQuestionGridDrawer}
        showConfirmSubmitModal={quiz.showConfirmSubmitModal}
        setShowConfirmSubmitModal={quiz.setShowConfirmSubmitModal}
        showConfirmExitModal={quiz.showConfirmExitModal}
        setShowConfirmExitModal={quiz.setShowConfirmExitModal}
        handleSelectOption={quiz.handleSelectOption}
        handleToggleFlag={quiz.handleToggleFlag}
        handleGoToQuestion={quiz.handleGoToQuestion}
        handleNextQuestion={quiz.handleNextQuestion}
        handlePrevQuestion={quiz.handlePrevQuestion}
        handleRequestSubmit={quiz.handleRequestSubmit}
        executeSubmit={quiz.executeSubmit}
        exitQuiz={quiz.handleExitQuiz}
      />
    );
  }

  // Default: Practice Hub View
  return (
    <div className="space-y-8">
      <PracticeHeader
        activeHubTab={activeHubTab}
        setActiveHubTab={setActiveHubTab}
        questionsDoneToday={questionsDoneToday}
        dailyTarget={dailyTarget}
        dailyProgressPercent={dailyProgressPercent}
        overallAccuracy={overallAccuracy}
        wrongCount={allWrongQuestions.length}
      />

      {/* Adaptive AI Assessment (CAT) Launcher Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 rounded-2xl p-5 border border-indigo-500/30 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 block mb-0.5">
              Computerized Adaptive Testing (CAT)
            </span>
            <h3 className="font-display font-bold text-base text-white">
              Uji Asesmen AI Adaptif Berjenjang (Level 1–5)
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Tingkat kesulitan soal otomatis beradaptasi dengan akurasi jawaban Anda, lengkap dengan Ability Score dan rekomendasi belajar diagnostik dari AI.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate(ROUTES.career.adaptive)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          <span>Mulai Asesmen Adaptif</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Hub Tabs Content */}
      {activeHubTab === "drills" && (
        <DrillsTab
          difficulty={quiz.difficulty}
          setDifficulty={quiz.setDifficulty}
          isShuffleEnabled={quiz.isShuffleEnabled}
          setIsShuffleEnabled={quiz.setIsShuffleEnabled}
          startQuizSession={quiz.startQuizSession}
          allAvailableQuestions={allAvailableQuestions}
          allWrongQuestions={allWrongQuestions}
          setActiveHubTab={setActiveHubTab}
        />
      )}

      {activeHubTab === "topics" && (
        <TopicsTab
          filteredTopics={filteredTopics}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedDifficulty={selectedDifficulty}
          setSelectedDifficulty={setSelectedDifficulty}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          courses={courses}
          startQuizSession={quiz.startQuizSession}
        />
      )}

      {activeHubTab === "mistakes" && (
        <MistakesTab
          allWrongQuestions={allWrongQuestions}
          startQuizSession={quiz.startQuizSession}
        />
      )}

      {activeHubTab === "analytics" && (
        <AnalyticsTab
          profile={profile}
          overallAccuracy={overallAccuracy}
          perfectAttemptsCount={perfectAttemptsCount}
          totalXpEarned={totalXpEarned}
          chartProgressData={chartProgressData}
          categoryProficiencyData={categoryProficiencyData}
        />
      )}
    </div>
  );
}

export default LatihanView;
