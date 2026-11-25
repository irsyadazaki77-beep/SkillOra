import { Course, Lesson, Profile, Question } from "../../types";

export type ModeLatihan = "lesson" | "quick" | "topic" | "simulation" | "wrong";
export type DifficultyLevel = "Pemula" | "Menengah" | "Sulit";
export type HubTab = "drills" | "adaptive" | "flashcards" | "topics" | "mistakes" | "analytics";

export interface LatihanViewProps {
  courses: Course[];
  profile: Profile;
  onProfileUpdate: (newProfile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
  initialCourse?: Course | null;
  initialLesson?: Lesson | null;
}

export interface UserAnswerHistoryItem {
  questionIndex: number;
  questionId?: string;
  questionText: string;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  explanation?: string;
  options: string[];
  competencyTag?: string;
}

export interface ActiveQuizSession {
  attemptId: string;
  title: string;
  subtitle: string;
  mode: ModeLatihan;
  difficulty: DifficultyLevel;
  courseId?: string;
  lessonId?: string;
  questions: {
    id: string;
    text: string;
    options: string[];
    competencyTag?: string;
    hint?: string;
  }[];
  durationSeconds: number;
  remainingSeconds: number;
  expiresAt: string | null;
  startedAt: string;
}

export interface QuizSubmissionResult {
  attemptId: string;
  score: number;
  passed: boolean;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  totalQuestions: number;
  earnedXp: number;
  earnedGems: number;
  durationSeconds: number;
  timeSpentSeconds: number;
  answersHistory: UserAnswerHistoryItem[];
  profile: Profile;
}

