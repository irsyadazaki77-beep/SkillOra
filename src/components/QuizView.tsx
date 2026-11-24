import { useState, useEffect, useMemo, useCallback } from "react";
import { Course, Lesson, Profile, Question } from "../types";
import { playSound } from "../utils/sound";
import { QuizHeader } from "./quiz/QuizHeader";
import { QuizResultView } from "./quiz/QuizResultView";
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ChevronRight, 
  Shuffle, 
  Award, 
  HelpCircle, 
  ShieldAlert,
  Lightbulb,
  Book,
  Flag,
  Bookmark,
  Flame,
  Keyboard,
  ArrowLeft,
  RotateCcw
} from "lucide-react";
import { courseApi } from "../api/apiClient";
import confetti from "canvas-confetti";

interface QuizModalProps {
  course: Course;
  lesson: Lesson;
  profile: Profile;
  onClose: () => void;
  onQuizComplete: (xpEarned: number, leveledUp: boolean, newProfile: Profile, newCourses: Course[]) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

// Helper component to render code snippets inside question text nicely
function RenderFormattedQuestion({ text }: { text: string }) {
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const parts = text.split(codeBlockRegex);

  if (parts.length > 1) {
    return (
      <div className="space-y-3">
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            return (
              <div key={index} className="my-3 rounded-xl bg-slate-950 border border-slate-800 p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto shadow-inner leading-relaxed">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2 text-xs text-slate-500 font-sans uppercase font-bold">
                  <span>Kode Contoh</span>
                  <span>JSX / TS</span>
                </div>
                <pre className="whitespace-pre-wrap">{part.trim()}</pre>
              </div>
            );
          }
          return (
            <p key={index} className="leading-relaxed font-medium">
              {part}
            </p>
          );
        })}
      </div>
    );
  }

  const inlineParts = text.split(/`([^`]+)`/g);
  return (
    <p className="leading-relaxed font-medium">
      {inlineParts.map((part, i) => (
        i % 2 === 1 ? (
          <code key={i} className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-300 font-mono text-xs border border-slate-200 dark:border-slate-700">
            {part}
          </code>
        ) : (
          part
        )
      ))}
    </p>
  );
}

// Utility array shuffler (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type DifficultyLevel = "Pemula" | "Menengah" | "Sulit";

export function QuizView({
  course,
  lesson: initialLesson,
  profile,
  onClose,
  onQuizComplete,
  showToast
}: QuizModalProps) {
  const [activeLessonId] = useState(initialLesson.id);
  const activeLesson = course.lessons.find(l => l.id === activeLessonId) || course.lessons[0];

  const [difficulty, setDifficulty] = useState<DifficultyLevel>("Pemula");
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(true);

  // Time limit per question based on difficulty
  const getTimeLimit = useCallback((diff: DifficultyLevel) => {
    switch (diff) {
      case "Pemula": return 45;
      case "Menengah": return 30;
      case "Sulit": return 15;
      default: return 30;
    }
  }, []);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hearts, setHearts] = useState(3);
  const [timeLeft, setTimeLeft] = useState(getTimeLimit(difficulty));
  const [showGameSummary, setShowGameSummary] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);

  // Interactive Quiz State
  const [showAiHint, setShowAiHint] = useState<boolean>(false);
  const [showFormulaSheet, setShowFormulaSheet] = useState<boolean>(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [comboCount, setComboCount] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Question[]>([]);

  const [userAnswersHistory, setUserAnswersHistory] = useState<any[]>([]);

  // Process and shuffle questions & options
  const preparedQuestions = useMemo(() => {
    const rawQuestions = activeLesson.questions || [];
    let processed: Question[] = rawQuestions.map((q) => {
      if (!isShuffleEnabled) return q;

      const originalCorrectOption = q.options[q.answerIndex];
      const shuffledOptions = shuffleArray(q.options);
      const newAnswerIndex = shuffledOptions.indexOf(originalCorrectOption);

      return {
        ...q,
        options: shuffledOptions,
        answerIndex: newAnswerIndex
      };
    });

    if (isShuffleEnabled) {
      processed = shuffleArray(processed);
    }

    return processed;
  }, [activeLesson, isShuffleEnabled]);

  const questions = preparedQuestions;
  const currentQuestion = questions[currentQuestionIndex];

  // Reset timer on question or difficulty change
  useEffect(() => {
    setTimeLeft(getTimeLimit(difficulty));
  }, [currentQuestionIndex, difficulty, getTimeLimit]);

  const handleCheckAnswer = useCallback((optionIdx: number) => {
    if (isAnswerChecked || !currentQuestion) return;
    setSelectedOption(optionIdx);
    setIsAnswerChecked(true);

    const correct = optionIdx === currentQuestion.answerIndex;
    setIsCorrect(correct);

    if (correct) {
      if (soundEnabled) playSound("correct");
      setComboCount(prev => {
        const newCombo = prev + 1;
        setMaxCombo(m => Math.max(m, newCombo));
        return newCombo;
      });
    } else {
      if (soundEnabled) playSound("wrong");
      setComboCount(0);
      setHearts(prev => Math.max(0, prev - 1));
    }

    setUserAnswersHistory(prev => [
      ...prev,
      {
        questionIndex: currentQuestionIndex,
        questionText: currentQuestion.text,
        selectedOption: optionIdx,
        correctOption: currentQuestion.answerIndex,
        isCorrect: correct,
        explanation: currentQuestion.explanation,
        options: currentQuestion.options,
        competencyTag: currentQuestion.competencyTag || course.title
      }
    ]);
  }, [isAnswerChecked, currentQuestion, soundEnabled, currentQuestionIndex, course.title]);

  useEffect(() => {
    if (showGameSummary || isAnswerChecked || !currentQuestion || hearts === 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleCheckAnswer(-1); // timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQuestionIndex, showGameSummary, isAnswerChecked, currentQuestion, hearts, difficulty, handleCheckAnswer]);

  const handleNextQuestion = useCallback(() => {
    setIsAnswerChecked(false);
    setSelectedOption(null);
    setHintUsed(false);
    setShowAiHint(false);
    setTimeLeft(getTimeLimit(difficulty));

    if (currentQuestionIndex < questions.length - 1 && hearts > 0) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleCompleteQuiz();
    }
  }, [currentQuestionIndex, questions.length, hearts, difficulty, getTimeLimit]);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    if (showGameSummary || !currentQuestion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (!isAnswerChecked) {
        if (e.key === "1" || e.key.toLowerCase() === "a") {
          if (currentQuestion.options[0]) handleCheckAnswer(0);
        } else if (e.key === "2" || e.key.toLowerCase() === "b") {
          if (currentQuestion.options[1]) handleCheckAnswer(1);
        } else if (e.key === "3" || e.key.toLowerCase() === "c") {
          if (currentQuestion.options[2]) handleCheckAnswer(2);
        } else if (e.key === "4" || e.key.toLowerCase() === "d") {
          if (currentQuestion.options[3]) handleCheckAnswer(3);
        } else if (e.key.toLowerCase() === "f") {
          setFlaggedQuestions(prev => ({ ...prev, [currentQuestionIndex]: !prev[currentQuestionIndex] }));
        } else if (e.key.toLowerCase() === "h") {
          setShowAiHint(prev => !prev);
        }
      } else {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNextQuestion();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion, isAnswerChecked, showGameSummary, currentQuestionIndex, handleCheckAnswer, handleNextQuestion]);

  const handleToggleBookmarkCurrentQuestion = () => {
    if (!currentQuestion) return;
    setBookmarkedQuestions(prev => {
      const exists = prev.some(q => q.id === currentQuestion.id || q.text === currentQuestion.text);
      if (exists) {
        if (showToast) showToast("Soal dihapus dari favorit.", "info");
        return prev.filter(q => q.id !== currentQuestion.id && q.text !== currentQuestion.text);
      } else {
        if (showToast) showToast("Soal berhasil disimpan ke bank favorit!", "success");
        return [...prev, currentQuestion];
      }
    });
  };

  const handleCompleteQuiz = async () => {
    setShowGameSummary(true);
    const correctCount = userAnswersHistory.filter(h => h.isCorrect).length;
    const calcScore = Math.round((correctCount / (questions.length || 1)) * 100);

    if (calcScore >= 70) {
      try {
        confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    }

    const multiplier = difficulty === "Sulit" ? 1.6 : difficulty === "Menengah" ? 1.3 : 1.0;
    const comboBonus = maxCombo >= 3 ? 1.2 : 1.0;
    const earnedXp = Math.round(Math.max(50, calcScore * 2) * multiplier * comboBonus);

    const wrongAnswers = userAnswersHistory
      .filter(h => !h.isCorrect)
      .map(h => ({
        id: `q_${h.questionIndex}`,
        text: h.questionText,
        options: h.options,
        answerIndex: h.correctOption,
        explanation: h.explanation,
        competencyTag: h.competencyTag
      }));

    try {
      const data = await courseApi.completeLesson(
        course.id,
        activeLesson.id,
        earnedXp,
        100,
        wrongAnswers,
        hintUsed,
        difficulty
      );
      if (data && data.profile) {
        onQuizComplete(earnedXp, data.leveledUp, data.profile, data.courses);
        if (soundEnabled) playSound("levelUp");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswerChecked(false);
    setHearts(3);
    setTimeLeft(getTimeLimit(difficulty));
    setShowGameSummary(false);
    setUserAnswersHistory([]);
    setComboCount(0);
    setMaxCombo(0);
  };

  const isCurrentBookmarked = currentQuestion && bookmarkedQuestions.some(bq => bq.id === currentQuestion.id || bq.text === currentQuestion.text);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 md:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        <QuizHeader
          lessonTitle={activeLesson.title}
          courseTitle={course.title}
          hearts={hearts}
          timeLeft={timeLeft}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(prev => !prev)}
          onToggleSidebar={() => setShowSidebar(prev => !prev)}
          onClose={onClose}
        />

        {!showGameSummary ? (
          <div className="p-4 md:p-6 space-y-4 overflow-y-auto flex-1">
            
            {/* Difficulty Level & Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Kesulitan:</span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  {(["Pemula", "Menengah", "Sulit"] as DifficultyLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      disabled={isAnswerChecked}
                      onClick={() => {
                        if (soundEnabled) playSound("click");
                        setDifficulty(lvl);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                        difficulty === lvl
                          ? lvl === "Sulit"
                            ? "bg-rose-500 text-white shadow-sm"
                            : lvl === "Menengah"
                            ? "bg-amber-500 text-white shadow-sm"
                            : "bg-blue-600 text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* AI Hint Button */}
                <button
                  onClick={() => setShowAiHint(prev => !prev)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                    showAiHint
                      ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-400"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400"
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  <span>Petunjuk [H]</span>
                </button>

                {/* Formula Sheet Toggle */}
                <button
                  onClick={() => setShowFormulaSheet(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer"
                >
                  <Book className="w-3.5 h-3.5 text-blue-500" />
                  <span>Kaidah</span>
                </button>

                {/* Bookmark Toggle */}
                <button aria-label="Aksi Bookmark"
                  onClick={handleToggleBookmarkCurrentQuestion}
                  className={`p-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    isCurrentBookmarked
                      ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border-indigo-300"
                      : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}
                  title="Simpan Soal"
                >
                  <Bookmark className={`w-3.5 h-3.5 ${isCurrentBookmarked ? "fill-indigo-500 text-indigo-500" : ""}`} />
                </button>

                {/* Shuffle Button */}
                <button
                  onClick={() => {
                    if (soundEnabled) playSound("click");
                    setIsShuffleEnabled(prev => !prev);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                    isShuffleEnabled
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Acak</span>
                </button>
              </div>
            </div>

            {/* Question Jump Dots */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {questions.map((_, idx) => {
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = userAnswersHistory.some(h => h.questionIndex === idx);
                const isFlagged = flaggedQuestions[idx];

                let dotStyle = "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700";
                if (isAnswered) dotStyle = "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800";
                if (isFlagged) dotStyle = "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold";
                if (isCurrent) dotStyle += " ring-2 ring-blue-500 font-black scale-105";

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setSelectedOption(null);
                      setIsAnswerChecked(false);
                      setShowAiHint(false);
                    }}
                    className={`w-7 h-7 rounded-lg text-xs font-bold border flex items-center justify-center shrink-0 transition-all cursor-pointer ${dotStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {currentQuestion ? (
              <>
                {/* Question Text Box */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                      Pertanyaan #{currentQuestionIndex + 1} &bull; {currentQuestion.competencyTag || course.title}
                    </span>
                    <button
                      onClick={() => setFlaggedQuestions(prev => ({ ...prev, [currentQuestionIndex]: !prev[currentQuestionIndex] }))}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border transition-colors cursor-pointer ${
                        flaggedQuestions[currentQuestionIndex]
                          ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                          : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Flag className={`w-3 h-3 ${flaggedQuestions[currentQuestionIndex] ? "fill-amber-500 text-amber-500" : ""}`} />
                      <span>{flaggedQuestions[currentQuestionIndex] ? "Ragu" : "Tandai Ragu [F]"}</span>
                    </button>
                  </div>

                  <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                    <RenderFormattedQuestion text={currentQuestion.text} />
                  </div>

                  {/* AI Hint Panel */}
                  {showAiHint && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/80 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Petunjuk Logika AI:</span>
                      </div>
                      <p className="text-xs leading-relaxed opacity-95">
                        {currentQuestion.hint || "Perhatikan kata kunci dan struktur pertanyaan secara sistematis."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Options List */}
                <div className="space-y-2.5">
                  {currentQuestion.options.map((opt, i) => {
                    const isSelected = selectedOption === i;
                    const letterOption = String.fromCharCode(65 + i);

                    let borderClass = "border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200";

                    if (isAnswerChecked) {
                      if (i === currentQuestion.answerIndex) {
                        borderClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/20";
                      } else if (isSelected) {
                        borderClass = "border-red-500 bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200 font-bold";
                      }
                    } else if (isSelected) {
                      borderClass = "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold";
                    }

                    return (
                      <button
                        key={i}
                        disabled={isAnswerChecked}
                        onClick={() => handleCheckAnswer(i)}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm border transition-all cursor-pointer flex items-center justify-between shadow-2xs group ${borderClass}`}
                      >
                        <div className="flex items-start gap-3 min-w-0 pr-2">
                          <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border ${
                            isAnswerChecked && i === currentQuestion.answerIndex
                              ? "bg-emerald-600 border-emerald-500 text-white"
                              : isAnswerChecked && isSelected
                              ? "bg-red-600 border-red-500 text-white"
                              : isSelected
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500"
                          }`}>
                            {letterOption}
                          </span>
                          <span className="font-medium leading-relaxed mt-0.5">{opt}</span>
                        </div>

                        {isAnswerChecked && i === currentQuestion.answerIndex && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />
                        )}
                        {isAnswerChecked && isSelected && i !== currentQuestion.answerIndex && (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Immediate Feedback Box */}
                {isAnswerChecked && (
                  <div className={`p-4 rounded-2xl border text-xs space-y-2 shadow-sm ${
                    isCorrect
                      ? "bg-emerald-50/90 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800"
                      : "bg-red-50/90 text-red-950 border-red-300 dark:bg-red-950/80 dark:text-red-200 dark:border-red-800"
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <div className="flex items-center gap-2">
                        {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                        <span>{isCorrect ? "Jawaban Kamu Tepat! 🎉" : "Jawaban Kurang Tepat 💡"}</span>
                      </div>
                      <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-md bg-white/60 dark:bg-black/30 border border-current/20">
                        {currentQuestion.competencyTag || course.title}
                      </span>
                    </div>

                    {!isCorrect && (
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white/70 dark:bg-black/40 p-2 rounded-xl border border-red-200/50">
                        🔑 Kunci Jawaban: <span className="text-emerald-700 dark:text-emerald-400 font-bold">{currentQuestion.options[currentQuestion.answerIndex]}</span>
                      </div>
                    )}

                    <p className="text-xs leading-relaxed opacity-90 pt-1">
                      <strong>Pembahasan AI:</strong> {currentQuestion.explanation}
                    </p>
                  </div>
                )}

                {/* Bottom Next Button */}
                <div className="pt-2">
                  {isAnswerChecked ? (
                    <button
                      onClick={handleNextQuestion}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-xs md:text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      <span>{currentQuestionIndex < questions.length - 1 ? "Lanjut Ke Soal Berikutnya [Enter]" : "Lihat Hasil & Evaluasi"}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <div className="text-center text-xs text-slate-400 flex items-center justify-center gap-2 py-1">
                      <Keyboard className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tekan A/B/C/D atau 1-4 untuk memilih jawaban</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400">Tidak ada pertanyaan pada modul ini.</div>
            )}

            {/* Formula Sheet Modal */}
            {showFormulaSheet && (
              <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 max-w-md w-full space-y-3 text-slate-800 dark:text-slate-100 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Book className="w-4 h-4 text-blue-500" />
                      <span>Kaidah & Rumus Penting</span>
                    </div>
                    <button onClick={() => setShowFormulaSheet(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
                  </div>
                  <div className="space-y-2 text-xs leading-relaxed">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h4 className="font-bold text-blue-600 dark:text-blue-400">Prinsip Komponen & State</h4>
                      <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">
                        Immutability pada state React penting agar pencocokan virtual DOM berjalan optimal.
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <h4 className="font-bold text-amber-600 dark:text-amber-400">Tips Penalaran Tes</h4>
                      <p className="text-xs mt-1 text-slate-600 dark:text-slate-300">
                        Eliminasi pilihan jawaban yang bertolak belakang secara logika sebelum memilih.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFormulaSheet(false)}
                    className="w-full py-2 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Tutup Kaidah
                  </button>
                </div>
              </div>
            )}

          </div>
        ) : (
          <QuizResultView
            score={Math.round((userAnswersHistory.filter(h => h.isCorrect).length / (questions.length || 1)) * 100)}
            xpEarned={Math.max(50, Math.round((userAnswersHistory.filter(h => h.isCorrect).length / (questions.length || 1)) * 100) * 2)}
            totalQuestions={questions.length}
            answersHistory={userAnswersHistory}
            course={course}
            onRestart={handleRestart}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
