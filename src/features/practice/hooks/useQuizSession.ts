import { useState, useEffect, useCallback, useRef } from "react";
import { Course, Lesson, Profile, Question } from "../../../types";
import { playSound } from "../../../utils/sound";
import { quizApi } from "../../../api/apiClient";
import confetti from "canvas-confetti";
import {
  DifficultyLevel,
  ModeLatihan,
  ActiveQuizSession,
  QuizSubmissionResult,
  UserAnswerHistoryItem
} from "../types";

interface UseQuizSessionProps {
  courses: Course[];
  profile: Profile;
  onProfileUpdate: (newProfile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
  initialCourse?: Course | null;
  initialLesson?: Lesson | null;
  paramCourseId?: string;
  paramLessonId?: string;
}

const ACTIVE_ATTEMPT_STORAGE_KEY = "skillora_active_quiz_attempt";

export function useQuizSession({
  courses,
  profile,
  onProfileUpdate,
  showToast,
  initialCourse,
  initialLesson,
  paramCourseId,
  paramLessonId,
}: UseQuizSessionProps) {
  // Session Configuration & Active State
  const [activeQuizSession, setActiveQuizSession] = useState<ActiveQuizSession | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Menengah");
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(true);

  // Active Runner State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(300);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  // Modals and UI Focus State
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [showConfirmExitModal, setShowConfirmExitModal] = useState(false);
  const [showQuestionGridDrawer, setShowQuestionGridDrawer] = useState(false);
  const [showAiHint, setShowAiHint] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  // Results State
  const [submissionResult, setSubmissionResult] = useState<QuizSubmissionResult | null>(null);
  const [resultFilterTab, setResultFilterTab] = useState<"all" | "wrong" | "correct" | "flagged">("all");

  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const draftSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Restore Active Session on Mount if page was refreshed
  useEffect(() => {
    const savedAttemptId = localStorage.getItem(ACTIVE_ATTEMPT_STORAGE_KEY);
    if (!savedAttemptId || activeQuizSession || submissionResult) return;

    let isMounted = true;
    const restoreSession = async () => {
      try {
        setIsLoadingSession(true);
        const data = await quizApi.getSession(savedAttemptId);
        if (!isMounted) return;

        if (data.status === "submitted" || data.isExpired) {
          localStorage.removeItem(ACTIVE_ATTEMPT_STORAGE_KEY);
          return;
        }

        setActiveQuizSession({
          attemptId: data.attemptId,
          title: data.title,
          subtitle: data.subtitle,
          mode: data.mode as ModeLatihan,
          difficulty: (data.difficulty as DifficultyLevel) || "Menengah",
          courseId: data.courseId,
          lessonId: data.lessonId,
          questions: data.questions,
          durationSeconds: data.durationSeconds,
          remainingSeconds: data.remainingSeconds,
          expiresAt: data.expiresAt,
          startedAt: data.startedAt
        });

        setSelectedAnswers(data.savedAnswers || {});
        const flaggedMap: Record<number, boolean> = {};
        (data.flaggedQuestions || []).forEach((idx: number) => {
          flaggedMap[idx] = true;
        });
        setFlaggedQuestions(flaggedMap);
        setTimeRemaining(data.remainingSeconds);
        startTimeRef.current = new Date(data.startedAt).getTime();
      } catch (e) {
        localStorage.removeItem(ACTIVE_ATTEMPT_STORAGE_KEY);
      } finally {
        if (isMounted) setIsLoadingSession(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [activeQuizSession, submissionResult]);

  // Launch initial course/lesson if requested from routing
  useEffect(() => {
    const targetCourse = initialCourse || (paramCourseId ? courses.find(c => c.id === paramCourseId) : null);
    const targetLesson = initialLesson || (targetCourse && paramLessonId ? targetCourse.lessons.find(l => l.id === paramLessonId) : null);

    if (targetCourse && targetLesson && !activeQuizSession && !submissionResult) {
      startQuizSession(
        targetLesson.title,
        `${targetCourse.title} • Modul Latihan`,
        "lesson",
        targetCourse.id,
        targetLesson.id
      );
    }
  }, [initialCourse, initialLesson, paramCourseId, paramLessonId, courses]);

  // Debounced draft saver to backend
  const triggerSaveDraft = useCallback((answers: Record<number, number>, flagged: Record<number, boolean>) => {
    if (!activeQuizSession?.attemptId) return;

    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }

    draftSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const flaggedList = Object.keys(flagged)
          .filter(k => flagged[Number(k)])
          .map(Number);
        await quizApi.saveDraft(activeQuizSession.attemptId, answers, flaggedList);
      } catch (e) {
        // silent fail on draft
      }
    }, 600);
  }, [activeQuizSession?.attemptId]);

  // Start a new Quiz Session via Backend
  const startQuizSession = async (
    title: string,
    subtitle: string,
    mode: ModeLatihan,
    courseId?: string,
    lessonId?: string
  ) => {
    try {
      setIsLoadingSession(true);
      if (!soundMuted) playSound("click");

      const res = await quizApi.startSession({
        mode,
        courseId,
        lessonId,
        difficulty,
        shuffle: isShuffleEnabled
      });

      const session: ActiveQuizSession = {
        attemptId: res.attemptId,
        title: res.title || title,
        subtitle: res.subtitle || subtitle,
        mode: res.mode as ModeLatihan,
        difficulty: (res.difficulty as DifficultyLevel) || difficulty,
        courseId: res.courseId || courseId,
        lessonId: res.lessonId || lessonId,
        questions: res.questions,
        durationSeconds: res.durationSeconds,
        remainingSeconds: res.durationSeconds,
        expiresAt: res.expiresAt,
        startedAt: res.startedAt
      };

      setActiveQuizSession(session);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setFlaggedQuestions({});
      setTimeRemaining(session.durationSeconds);
      setSubmissionResult(null);
      setShowConfirmSubmitModal(false);
      setShowConfirmExitModal(false);
      setShowQuestionGridDrawer(false);
      setShowAiHint(false);
      startTimeRef.current = Date.now();

      localStorage.setItem(ACTIVE_ATTEMPT_STORAGE_KEY, res.attemptId);
    } catch (err: any) {
      if (showToast) showToast(err.message || "Gagal memulai sesi kuis", "error");
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Timer Countdown Handler with accurate calculation
  useEffect(() => {
    if (!activeQuizSession || submissionResult) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      if (activeQuizSession.expiresAt) {
        const diff = Math.max(0, Math.floor((new Date(activeQuizSession.expiresAt).getTime() - Date.now()) / 1000));
        setTimeRemaining(diff);
        if (diff <= 0) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          handleAutoSubmitOnExpiry();
        }
      } else {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            handleAutoSubmitOnExpiry();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [activeQuizSession, submissionResult]);

  // Select / Change Answer for Current Question
  const handleSelectOption = (optionIndex: number) => {
    if (!activeQuizSession || isSubmitting) return;

    setSelectedAnswers(prev => {
      const updated = { ...prev, [currentQuestionIndex]: optionIndex };
      triggerSaveDraft(updated, flaggedQuestions);
      return updated;
    });

    if (!soundMuted) playSound("click");
  };

  // Toggle "Ragu-ragu" / Flag State
  const handleToggleFlag = (index?: number) => {
    const targetIdx = index !== undefined ? index : currentQuestionIndex;
    setFlaggedQuestions(prev => {
      const updated = { ...prev, [targetIdx]: !prev[targetIdx] };
      triggerSaveDraft(selectedAnswers, updated);
      return updated;
    });
    if (!soundMuted) playSound("click");
  };

  // Jump directly to a question
  const handleGoToQuestion = (index: number) => {
    if (!activeQuizSession) return;
    if (index >= 0 && index < activeQuizSession.questions.length) {
      setCurrentQuestionIndex(index);
      setShowAiHint(false);
      setShowQuestionGridDrawer(false);
      if (!soundMuted) playSound("click");
    }
  };

  const handleNextQuestion = () => {
    if (!activeQuizSession) return;
    if (currentQuestionIndex < activeQuizSession.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowAiHint(false);
      if (!soundMuted) playSound("click");
    } else {
      handleRequestSubmit();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowAiHint(false);
      if (!soundMuted) playSound("click");
    }
  };

  // Check if all questions are answered before submitting
  const handleRequestSubmit = () => {
    if (!activeQuizSession) return;
    const answeredCount = Object.keys(selectedAnswers).length;
    const totalCount = activeQuizSession.questions.length;

    if (answeredCount < totalCount) {
      setShowConfirmSubmitModal(true);
    } else {
      executeSubmit();
    }
  };

  // Auto-submit when time expires
  const handleAutoSubmitOnExpiry = () => {
    if (showToast) showToast("Waktu pengerjaan telah habis. Jawaban dikirim otomatis.", "info");
    executeSubmit();
  };

  // Authoritative Backend Submit Execution
  const executeSubmit = async () => {
    if (!activeQuizSession || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setShowConfirmSubmitModal(false);
      const timeSpentSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));

      const res = await quizApi.submitSession(
        activeQuizSession.attemptId,
        selectedAnswers,
        timeSpentSeconds
      );

      const result: QuizSubmissionResult = {
        attemptId: res.attemptId,
        score: res.score,
        passed: res.passed,
        correctCount: res.correctCount,
        wrongCount: res.wrongCount,
        unansweredCount: res.unansweredCount,
        totalQuestions: res.totalQuestions,
        earnedXp: res.earnedXp,
        earnedGems: res.earnedGems,
        durationSeconds: res.durationSeconds,
        timeSpentSeconds: res.timeSpentSeconds,
        answersHistory: res.answersHistory,
        profile: res.profile
      };

      setSubmissionResult(result);
      setActiveQuizSession(null);
      localStorage.removeItem(ACTIVE_ATTEMPT_STORAGE_KEY);

      if (res.profile) {
        onProfileUpdate(res.profile);
      }

      if (res.passed) {
        if (!soundMuted) playSound("levelUp");
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#6366f1", "#10b981", "#f59e0b"]
          });
        } catch (e) {}
      } else {
        if (!soundMuted) playSound("wrong");
      }
    } catch (err: any) {
      if (showToast) showToast(err.message || "Gagal mengirimkan lembar jawaban", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Exit Quiz with confirmation
  const handleExitQuiz = () => {
    setActiveQuizSession(null);
    setSubmissionResult(null);
    setShowConfirmExitModal(false);
    localStorage.removeItem(ACTIVE_ATTEMPT_STORAGE_KEY);
    if (!soundMuted) playSound("click");
  };

  // Practice Wrong Answers Remedial
  const handleRetryWrongAnswers = (wrongHistory: UserAnswerHistoryItem[]) => {
    if (wrongHistory.length === 0) return;
    startQuizSession(
      "Remedial Bank Soal Salah 🔄",
      `Latih Ulang ${wrongHistory.length} Soal Evaluasi`,
      "wrong"
    );
  };

  // Keyboard Shortcuts (1-4 / A-D, ArrowLeft / ArrowRight, F for Flag)
  useEffect(() => {
    if (!activeQuizSession || submissionResult || showConfirmExitModal || showConfirmSubmitModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const q = activeQuizSession.questions[currentQuestionIndex];
      if (!q) return;

      if (e.key === "1" || e.key.toLowerCase() === "a") {
        if (q.options[0]) handleSelectOption(0);
      } else if (e.key === "2" || e.key.toLowerCase() === "b") {
        if (q.options[1]) handleSelectOption(1);
      } else if (e.key === "3" || e.key.toLowerCase() === "c") {
        if (q.options[2]) handleSelectOption(2);
      } else if (e.key === "4" || e.key.toLowerCase() === "d") {
        if (q.options[3]) handleSelectOption(3);
      } else if (e.key === "5" || e.key.toLowerCase() === "e") {
        if (q.options[4]) handleSelectOption(4);
      } else if (e.key.toLowerCase() === "f") {
        handleToggleFlag();
      } else if (e.key === "ArrowLeft") {
        handlePrevQuestion();
      } else if (e.key === "ArrowRight") {
        handleNextQuestion();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeQuizSession, currentQuestionIndex, submissionResult, showConfirmExitModal, showConfirmSubmitModal]);

  return {
    // Session State
    activeQuizSession,
    difficulty,
    setDifficulty,
    isShuffleEnabled,
    setIsShuffleEnabled,
    isLoadingSession,

    // Active Runner State
    currentQuestionIndex,
    selectedAnswers,
    flaggedQuestions,
    timeRemaining,
    isSubmitting,
    showAiHint,
    setShowAiHint,
    isFocusMode,
    setIsFocusMode,
    soundMuted,
    setSoundMuted,

    // Drawer and Modals
    showQuestionGridDrawer,
    setShowQuestionGridDrawer,
    showConfirmSubmitModal,
    setShowConfirmSubmitModal,
    showConfirmExitModal,
    setShowConfirmExitModal,

    // Results State
    submissionResult,
    resultFilterTab,
    setResultFilterTab,

    // Handlers
    startQuizSession,
    handleSelectOption,
    handleToggleFlag,
    handleGoToQuestion,
    handleNextQuestion,
    handlePrevQuestion,
    handleRequestSubmit,
    executeSubmit,
    handleExitQuiz,
    handleRetryWrongAnswers
  };
}
