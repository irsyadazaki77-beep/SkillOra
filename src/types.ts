export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  profile?: Profile;
  courses?: Course[];
  [key: string]: any;
}

export interface UserAuthContext {
  userId: string;
  token?: string;
  role?: string;
}

export interface Milestone {
  id: number;
  name: string;
  status: "completed" | "current" | "upcoming";
  date: string | null;
}

export interface Profile {
  appliedJobs?: Record<string, string>;
  savedJobs?: string[];
  activeCourses?: any[];
  name: string;
  role: string;
  xp: number;
  gems: number;
  level: number;
  avatar?: string;
  email?: string;
  streak: number;
  streakFreezes?: number;
  lastActive: string;
  skills: string[];
  certifiedCourses: string[];
  careerStage: "learning" | "certified" | "collaborating" | "applied" | "hired";
  milestones: Milestone[];
  dailyClaimedLast?: string | null;
  bookmarkedJobs?: string[];
  quizCombo?: number;
  theme?: string;
  titles?: string[];
  purchasedItems?: string[];
  activeBoosterUntil?: number | null;
  unlockedAvatars?: string[];
  selectedAvatar?: string;
  isDevMode?: boolean;
  hasCompletedOnboarding?: boolean;
  learningGoal?: string;
  selectedLevelPref?: string;
  learningGoalPath?: "magang" | "kerja" | "freelance" | "bumn";
  portfolioProjects?: PortfolioProject[];
  bookmarkedLessons?: string[];
  bookmarkedCourses?: string[];
  quizAttempts?: QuizAttempt[];
  dailyQuests?: DailyQuest[];
  achievements?: Achievement[];
  weeklyXp?: number;
  canRepairStreak?: boolean;
  lostStreakCount?: number;
  dailyQuizXpCount?: number;
  lastQuizXpDate?: string;
  certificates?: CertificateRecord[];
  simulationHistory?: SimulationAttempt[];
  accountRole?: "student" | "mentor" | "recruiter" | "admin";
  subscriptionTier?: "free" | "pro";
  subscriptionExpiresAt?: string | null;
  certCredits?: number;
  companyId?: number | null;
  company?: CompanyProfile | null;
  mentorSpecialty?: string | null;
  mentorHeadline?: string | null;
  bio?: string;
  mentorTone?: string;
  notifyEmail?: boolean;
  notifyDaily?: boolean;
  notifySound?: boolean;
  portfolioSlug?: string | null;
  portfolioPublic?: boolean;
  portfolioHeadline?: string | null;
  campusName?: string | null;
  majorName?: string | null;
  leagueTier?: "bronze" | "silver" | "gold" | "platinum" | "grandmaster" | string;
}

export interface CompanyProfile {
  id: number;
  name: string;
  industry: string;
  logo: string;
  location: string;
  website?: string | null;
  description?: string | null;
  verified?: boolean;
}

export interface BillingProduct {
  id: string;
  type: "pro_monthly" | "pro_yearly" | "gems_pack" | "cert_voucher";
  name: string;
  subtitle: string;
  priceIdr: number;
  gemsGranted?: number;
  certCreditsGranted?: number;
  proDaysGranted?: number;
  badge?: string;
  features: string[];
}

export interface OrderRecord {
  orderCode: string;
  productType: string;
  productId: string;
  productName: string;
  amountIdr: number;
  paymentMethod: string;
  status: "pending" | "paid" | "failed" | string;
  paidAt?: string | null;
  createdAt: string;
  metadata?: {
    virtualAccount?: string;
    qrisPayload?: string;
  };
}

export interface WalletLedgerEntry {
  id: number;
  currency: "gems" | "cert_credits" | string;
  delta: number;
  balanceAfter: number;
  reason: string;
  referenceId?: string | null;
  createdAt: string;
}

export interface AdaptiveQuestionView {
  id: string;
  difficulty: number;
  prompt: string;
  options: string[];
  competencyTag: string;
}

export interface AdaptiveAssessmentState {
  assessmentId: string;
  category?: string;
  status: "in_progress" | "completed";
  currentDifficulty: number;
  abilityScore: number;
  questionNumber: number;
  maxQuestions: number;
  question?: AdaptiveQuestionView;
  feedback?: {
    isCorrect: boolean;
    correctOption: number;
    explanation: string;
    competencyTag: string;
    previousDifficulty: number;
  };
  history?: Array<{
    questionId: string;
    difficulty: number;
    prompt: string;
    options: string[];
    selectedOption: number;
    correctOption: number;
    isCorrect: boolean;
    explanation: string;
    competencyTag: string;
  }>;
  weakTopics?: string[];
  aiSummary?: string;
  earnedXp?: number;
  earnedGems?: number;
  profile?: Profile;
}

export interface CvDocument {
  id?: number;
  title: string;
  targetRole: string;
  summary: string;
  experiences: Array<{ role: string; company: string; period: string; bullets: string[] }>;
  education: Array<{ school: string; degree: string; year: string; gpa?: string }>;
  projects: Array<{ name: string; link?: string; impact: string }>;
  skills: string[];
  atsScore?: number;
  atsFeedback?: CvAtsFeedback | null;
  updatedAt?: string;
}

export interface CvAtsFeedback {
  atsScore: number;
  keywordMatches: string[];
  missingKeywords: string[];
  improvedSummary: string;
  bulletImprovements: string[];
  formattingTips: string[];
}

export interface InterviewTranscriptTurn {
  speaker: "candidate" | "interviewer";
  text: string;
  timestamp: string;
}

export interface InterviewSessionRecord {
  sessionId: string;
  jobId?: string | null;
  jobTitle: string;
  companyName: string;
  mode: "voice" | "text" | string;
  transcript: InterviewTranscriptTurn[];
  overallScore?: number | null;
  communicationScore?: number | null;
  starScore?: number | null;
  technicalScore?: number | null;
  strengths?: string[];
  improvements?: string[];
  summaryFeedback?: string | null;
  durationSeconds?: number | null;
  status: "active" | "completed" | string;
  createdAt: string;
  completedAt?: string | null;
}

export interface RecruiterOverview {
  company: CompanyProfile | null;
  jobs: Array<{
    id: string;
    dbId: number;
    title: string;
    company: string;
    logo: string;
    salary: string;
    location: string;
    jobType: string;
    requiredSkills: string[];
    description: string;
    status: "active" | "closed" | string;
    applicantCount: number;
    createdAt: string;
  }>;
  applicants: Array<{
    applicationId: number;
    jobId: string;
    jobTitle: string;
    status: string;
    hrNotes?: string | null;
    interviewAt?: string | null;
    coverNote?: string | null;
    appliedAt: string;
    candidate: {
      id: number;
      name: string;
      email: string;
      avatar: string;
      level: number;
      xp: number;
      skills: string[];
      certifiedCourses: string[];
      careerStage: string;
    };
    cv?: CvDocument | null;
  }>;
  metrics: {
    activeJobs: number;
    totalApplicants: number;
    interviewStage: number;
    offeredStage: number;
  };
}

export interface MentorSubmissionItem {
  id: number;
  courseId: string;
  courseTitle: string;
  projectTitle: string;
  projectUrl: string;
  studentCodeNotes: string;
  status: string;
  score: number | null;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  earnedCertificateId: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  student: {
    id: number;
    name: string;
    email: string;
    avatar: string;
    level: number;
  } | null;
}

export interface MentoringSlot {
  id: string;
  dbId: number;
  mentorUserId?: number | null;
  mentorName: string;
  mentorRole: string;
  mentorCompany: string;
  mentorAvatar: string;
  topic: string;
  scheduleLabel: string;
  durationMinutes: number;
  priceGems: number;
  maxQuota: number;
  bookedCount: number;
  status: string;
  isBookedByMe: boolean;
}

export interface MentoringBooking {
  id: number;
  slotId: string;
  topic: string;
  scheduleLabel: string;
  mentorName: string;
  mentorCompany: string;
  studentName: string;
  studentEmail: string;
  notes: string;
  mentorNotes: string;
  meetingLink: string;
  status: string;
  createdAt: string;
}

export interface ScholarshipItem {
  id: string;
  title: string;
  provider: string;
  degree: string;
  coverage: string;
  deadline: string;
  location: string;
  description: string;
  requirements: string[];
  applyUrl: string;
}

export interface EventItem {
  id: string;
  title: string;
  speaker: string;
  speakerRole: string;
  category: string;
  dateLabel: string;
  timeLabel: string;
  quota: number;
  registeredCount: number;
  xpReward: number;
  description: string;
  isRegistered: boolean;
}

export interface CertificateRecord {
  id: string;
  courseId: string;
  courseTitle: string;
  partner: string;
  issueDate: string;
  verificationCode: string;
  score: number;
  theme?: string;
  recipientName: string;
}

export interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  githubUrl?: string;
  demoUrl?: string;
  imageUrl?: string;
  description: string;
  techStack: string[];
  status: "Under Review" | "Verified & Passed" | "Needs Revision";
  submittedAt: string;
}

export interface SimulationAttempt {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  type: "STAR" | "TKD" | "Kraepelin" | "DecisionSimulation";
  difficulty: "Pemula" | "Menengah" | "Industri";
  score: number;
  completedAt: string;
  specificFeedback: string[];
  stageScores?: { stage1: number; stage2: number; stage3: number };
}

export interface QuizAttempt {
  id: string;
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  difficulty?: "Pemula" | "Menengah" | "Sulit";
  wrongAnswersCount: number;
  wrongAnswers: Question[];
  completedAt: string;
  xpEarned?: number;
  gemsEarned?: number;
}

export interface DailyQuest {
  id: string;
  title: string;
  target: number;
  current: number;
  xpReward: number;
  gemsReward: number;
  completed: boolean;
  claimed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  current: number;
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
  rewardXp?: number;
  gemsReward?: number;
  rewardGems?: number;
  claimed?: boolean;
}

export interface LeaderboardUser {
  userId?: string;
  rank: number;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  weeklyXp: number;
  title: string;
  levelTitle?: string;
  streak?: number;
  isCurrentUser?: boolean;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  competencyTag?: string;
  hint?: string;
}

export interface ContentBlock {
  id: string;
  type: "text" | "video" | "code" | "image";
  content: string; // text content, video URL, etc.
  language?: string;
}

export interface Assessment {
  id: string;
  type: "practice" | "certification";
  questions: Question[];
  randomizeQuestions?: boolean;
  antiCheatEnabled?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  xp: number;
  completed: boolean;
  questions: Question[]; // legacy support for existing data
  
  // New features for learning experience
  type?: "video" | "text" | "interactive";
  contentBlocks?: ContentBlock[];
  learningObjectives?: string[];
  prerequisites?: string[];
  estimatedMinutes?: number;
  videoUrl?: string;
  transcript?: string;
  notes?: string;
  isBookmarked?: boolean;
  assessments?: Assessment[];
  competency?: string;
  sources?: { title: string; url: string; category?: string }[];
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface RubricCriterion {
  id: string;
  description: string;
  maxScore: number;
}

export interface ProjectRubric {
  title: string;
  description: string;
  rubric: string; // legacy support
  
  // New features
  detailedRubric?: RubricCriterion[];
}

export interface Course {
  id: string;
  title: string;
  difficulty: "Pemula" | "Menengah" | "Lanjutan";
  partner: string;
  rating?: number;
  enrolledCount?: number;
  category?: string;
  logo: string;
  image: string;
  duration: string;
  xpReward: number;
  skills: string[];
  lessons: Lesson[]; // legacy flat structure
  project: ProjectRubric;
  description?: string;
  
  // New features for course quality & authoring
  status?: "draft" | "review" | "published";
  version?: string;
  author?: string;
  reviewer?: string;
  modules?: Module[]; // new nested structure
}

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  currentXP: number;
}

export interface TeamTask {
  id: string;
  title: string;
  assignee: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority?: "Rendah" | "Sedang" | "Tinggi";
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export interface CollabRoom {
  id: string;
  courseId: string;
  title: string;
  members: TeamMember[];
  tasks: TeamTask[];
  chat: ChatMessage[];
  projectUrl: string;
  status: "Belum Dikirim" | "Menunggu Penilaian AI Mentor" | "Selesai (Lolos!)";
}

export interface JobVacancy {
  id: string;
  title: string;
  company: string;
  logo: string;
  salary: string;
  location: string;
  requiredSkills: string[];
  description: string;
  matchPercentage: number;
  status: "Tersedia" | "Terkirim" | "Undangan Wawancara Dijadwalkan" | string;
  hrNotes?: string | null;
  interviewAt?: string | null;
}

export interface SystemNotification {
  id: string;
  text?: string;
  time?: string;
  type?: "system" | "team" | "quiz" | "certification" | "job" | "info" | "reward" | "success" | "warning";
  read?: boolean;
  title?: string;
  message?: string;
  timestamp?: number;
  category?: string;
  link?: string;
}

export interface MentorReview {
  status: "PASS" | "RETRY";
  score: number;
  strengths: string[];
  weaknesses: string[];
  mentorFeedbackText: string;
  earnedCertificateId?: string;
  awardedXp: number;
  awardedGems: number;
  reviewedAt: string;
  submittedCode: string;
}

export interface CertificationDetails {
  id: string;
  title: string;
  issuedAt: string;
  expiresAt?: string;
  score: number;
  scoreBreakdown?: Record<string, number>;
  evidenceUrl?: string;
  reviewer?: string;
  competencies?: string[];
  status: "valid" | "revoked" | "appealed";
}

export interface AIChatHistory {
  userId: string;
  conversationId: string;
  messages: {
    role: "user" | "model";
    content: string;
    timestamp: string;
  }[];
}

// --- Skillora 2.0 Domain Types ---

export interface LabTestCase {
  id: string;
  label: string;
  expression: string;
  expected: any;
}

export interface LabRubricCriterion {
  id: string;
  title: string;
  weight: number;
  description: string;
}

export interface LabChallenge {
  id: string;
  title: string;
  track: "frontend" | "backend_sql" | "data" | "bumn_case" | string;
  difficulty: "Pemula" | "Menengah" | "Lanjutan" | string;
  estimatedMinutes: number;
  language: "javascript" | "sql" | "case_markdown" | string;
  summary: string;
  promptMarkdown: string;
  starterCode: string;
  hints: string[];
  testCases: LabTestCase[];
  rubricCriteria: LabRubricCriterion[];
  skills: string[];
  xpReward: number;
  gemsReward: number;
  bestScore?: number | null;
  passed?: boolean;
  attemptsCount?: number;
}

export interface LabSubmissionRecord {
  id: number;
  challengeId: string;
  codeOrAnswer: string;
  testPassedCount: number;
  testTotalCount: number;
  score: number;
  rubricScores: Array<{ criterion: string; score: number; comment: string }>;
  aiFeedback: string;
  strengths: string[];
  improvements: string[];
  refactoredSnippet?: string | null;
  passed: boolean;
  earnedXp: number;
  earnedGems: number;
  createdAt: string;
}

export interface LessonNoteRecord {
  courseId: string;
  lessonId: string;
  content: string;
  isPinned: boolean;
  updatedAt: string;
}

export interface RoadmapTaskItem {
  id: string;
  title: string;
  type: "course" | "lab" | "arena" | "career" | string;
  targetPath: string;
  estimatedMinutes: number;
  completed: boolean;
}

export interface RoadmapWeek {
  weekNumber: number;
  theme: string;
  objective: string;
  tasks: RoadmapTaskItem[];
}

export interface StudyRoadmapRecord {
  id: number;
  targetRole: string;
  hoursPerWeek: number;
  summary: string;
  weeks: RoadmapWeek[];
  progressPercent: number;
  updatedAt: string;
}

export interface LeagueStandingRow {
  rank: number;
  name: string;
  avatar: string;
  level: number;
  weeklyXp: number;
  totalXp: number;
  campusName?: string | null;
  leagueTier: string;
  zone: "promote" | "safe" | "relegate";
  isCurrentUser: boolean;
}

export interface LeagueOverview {
  currentTier: string;
  nextTier: string | null;
  myRank: number;
  myWeeklyXp: number;
  daysRemaining: number;
  tiers: Array<{ id: string; label: string; minXp: number }>;
  standings: LeagueStandingRow[];
}

export interface TryoutPackage {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  questionCount: number;
  description: string;
  xpReward: number;
  questions: Array<{
    id: string;
    prompt: string;
    options: string[];
    competencyTag: string;
  }>;
  lastAttempt?: TryoutAttemptRecord | null;
}

export interface TryoutAttemptRecord {
  id: number;
  tryoutId: string;
  title: string;
  category: string;
  score: number;
  maxScore: number;
  correctCount: number;
  totalQuestions: number;
  subtestScores: Array<{ topic: string; correct: number; total: number; accuracy: number }>;
  durationSeconds: number;
  percentile: number;
  createdAt: string;
}

export interface TalentMatchJob {
  jobId: string;
  title: string;
  company: string;
  logo: string;
  location: string;
  salary: string;
  jobType: string;
  matchScore: number;
  skillMatchScore: number;
  labBonus: number;
  certBonus: number;
  matchedSkills: string[];
  missingSkills: string[];
  recommendedAction: string;
  recommendedPath: string;
  status: string;
}

export interface PublicPortfolioData {
  slug: string;
  name: string;
  avatar: string;
  role: string;
  headline: string;
  bio: string;
  campusName?: string | null;
  majorName?: string | null;
  level: number;
  xp: number;
  streak: number;
  leagueTier: string;
  skills: string[];
  stats: {
    verifiedCertificates: number;
    passedLabs: number;
    avgLabScore: number;
    avgAssessmentScore: number;
  };
  certificates: Array<{
    id: string;
    courseTitle: string;
    partner: string;
    issueDate: string;
    score: number;
  }>;
  labHighlights: Array<{
    challengeId: string;
    title: string;
    track: string;
    score: number;
    passedAt: string;
  }>;
  projects: Array<{
    id: string;
    title: string;
    url: string;
    score: number;
    notes: string;
    reviewedAt: string;
  }>;
}

export interface CampusCohortItem {
  id: string;
  campusName: string;
  city: string;
  programTitle: string;
  targetRole: string;
  activeStudents: number;
  avgReadiness: number;
  certifiedCount: number;
  featuredLabs: string[];
  isJoined?: boolean;
}

