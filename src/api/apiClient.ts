import {
  Profile,
  Course,
  JobVacancy,
  MentorReview,
  SystemNotification,
  BillingProduct,
  OrderRecord,
  WalletLedgerEntry,
  AdaptiveAssessmentState,
  CvDocument,
  CvAtsFeedback,
  InterviewSessionRecord,
  InterviewTranscriptTurn,
  RecruiterOverview,
  MentorSubmissionItem,
  MentoringSlot,
  MentoringBooking,
  ScholarshipItem,
  EventItem,
  LabChallenge,
  LabSubmissionRecord,
  LessonNoteRecord,
  StudyRoadmapRecord,
  LeagueOverview,
  TryoutPackage,
  TryoutAttemptRecord,
  TalentMatchJob,
  PublicPortfolioData,
  CampusCohortItem,
  Question,
  CourseTrainingOverview,
  CourseExamRecord,
  FlashcardQueueItem,
  TrainingAssignmentRecord,
  SimulationAttemptRecord,
  StarEvaluationResult,
} from "../types";
import { auth } from "../lib/firebase";

export async function getAuthTokenForWs(): Promise<string> {
  await auth.authStateReady();
  if (localStorage.getItem("skillora_guest_mode") === "true") {
    return "guest-demo-token";
  }
  const user = auth.currentUser;
  if (user) {
    try {
      return await user.getIdToken();
    } catch {
      return "";
    }
  }
  return "";
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number = 500, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  private baseUrl: string = "/api/v1";

  private async getHeaders(customHeaders: Record<string, string> = {}): Promise<Record<string, string>> {
    await auth.authStateReady();
    const user = auth.currentUser;
    let token = "";
    if (localStorage.getItem("skillora_guest_mode") === "true") {
      token = "guest-demo-token";
    } else if (user) {
      try {
        token = await user.getIdToken();
      } catch (e) {
        console.warn("Failed to get ID token", e);
      }
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const headers = await this.getHeaders((options.headers as Record<string, string>) || {});

    try {
      const response = await fetch(url, { ...options, headers });
      let data: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json().catch(() => ({}));
      } else {
        const text = await response.text().catch(() => "");
        data = { message: text };
      }

      if (!response.ok) {
        const rawMsg = data.error?.message || data.error || data.message || `Request failed with status ${response.status}`;
        const isGuestForbidden =
          response.status === 403 && localStorage.getItem("skillora_guest_mode") === "true";
        const errorMsg = isGuestForbidden
          ? "Mode Tamu hanya untuk melihat-lihat. Silakan daftar atau masuk dengan akun terdaftar untuk menyimpan progres & menggunakan AI."
          : rawMsg;
        throw new ApiError(errorMsg, response.status, data);
      }

      if (data && typeof data === "object") {
        if (data.success === false) {
          const errorMsg = data.error?.message || data.error || data.message || "Request returned unsuccessful status";
          throw new ApiError(errorMsg, response.status, data);
        }
        if (data.success === true && data.data !== undefined) {
          return data.data as T;
        }
      }

      return data as T;
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || "Network error occurred", 500);
    }
  }

  get<T = any>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T = any>(endpoint: string, body?: any, options: RequestInit = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined
    });
  }

  put<T = any>(endpoint: string, body?: any, options: RequestInit = {}) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined
    });
  }

  delete<T = any>(endpoint: string, options: RequestInit = {}) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();

// High-level API Service Modules
export const userApi = {
  getProfile: () => apiClient.get<Profile>("/user/profile"),
  addXp: (xp: number, reason?: string) => apiClient.post<{ profile: Profile }>("/user/add-xp", { xp, reason }),
  buyStoreItem: (itemId: string, cost: number, itemType: string) => apiClient.post<{ profile: Profile }>("/user/buy-item", { itemId, cost, itemType }),
  claimDailyStreak: () => apiClient.post<{ profile: Profile; levelUp: boolean }>("/user/claim-daily"),
  claimDailyQuest: (questId: string) => apiClient.post<{ profile: Profile }>(`/user/quests/${questId}/claim`),
  completeOnboarding: (data: {
    learningGoal: string;
    selectedLevelPref: string;
    role: string;
    accountRole?: "student" | "mentor" | "recruiter";
    companyName?: string;
    companyIndustry?: string;
    mentorSpecialty?: string;
    mentorHeadline?: string;
  }) => apiClient.post<{ profile: Profile }>("/user/onboarding", data),
  registerRole: (data: {
    accountRole: "student" | "mentor" | "recruiter";
    companyName?: string;
    companyIndustry?: string;
    companyLocation?: string;
    mentorSpecialty?: string;
    mentorHeadline?: string;
  }) => apiClient.post<{ profile: Profile }>("/user/register-role", data),
  updateSettings: (data: {
    name: string;
    role: string;
    email: string;
    bio?: string;
    mentorTone?: string;
    notifyEmail?: boolean;
    notifyDaily?: boolean;
    notifySound?: boolean;
  }) => apiClient.post<{ profile: Profile }>("/user/update-settings", data),
};

export const courseApi = {
  getCourses: () => apiClient.get<Course[]>("/courses"),
  getLmsCourses: () => apiClient.get<Course[]>("/lms/courses"),
  completeLesson: (
    courseId: string,
    lessonId: string,
    xpEarned: number,
    maxScore?: number,
    wrongAnswers?: any[],
    hintUsed?: boolean,
    difficulty?: string
  ) =>
    apiClient.post<{ profile: Profile; courses: Course[]; leveledUp: boolean; course: any }>("/courses/complete-lesson", {
      courseId,
      lessonId,
      xpEarned,
      maxScore,
      wrongAnswers,
      hintUsed,
      difficulty
    }),
  getFlashChallenge: () => apiClient.get<{
    question: string;
    options: string[];
    correctIdx: number;
    explanation: string;
    rewardGems: number;
    rewardXP: number;
  }>("/quiz/flash"),
  claimFlashChallenge: (selectedIdx: number) =>
    apiClient.post<{
      correct: boolean;
      alreadyClaimed: boolean;
      rewardXP: number;
      rewardGems: number;
      profile: Profile;
    }>("/quiz/flash/claim", { selectedIdx }),
  createCourse: (courseData: Partial<Course>) => apiClient.post<Course>("/courses", courseData),
  updateCourse: (id: string, courseData: Partial<Course>) => apiClient.put<Course>(`/courses/${id}`, courseData),
  deleteCourse: (id: string) => apiClient.delete<any>(`/courses/${id}`),
  enrollCourse: (courseId: string) =>
    apiClient.post<{ enrolled: boolean; alreadyEnrolled: boolean; enrolledCount: number }>(
      `/courses/${courseId}/enroll`
    ),
  addLesson: (
    courseId: string,
    lessonData: { title: string; xp?: number; estimatedMinutes?: number; contentMarkdown?: string; videoUrl?: string }
  ) => apiClient.post<any>(`/courses/${courseId}/lessons`, lessonData),
};

export const aiApi = {
  mentorChat: (message: string, context?: { courseTitle?: string; lessonTitle?: string; courseCategory?: string }) =>
    apiClient.post<{ response: string; isMock?: boolean }>("/mentor/chat", { message, context }),
  hrInterview: (jobId: string, message: string) => apiClient.post<{ response: string }>("/jobs/interview", { jobId, message }),
  evaluateStar: (question: string, situation: string, action: string, result: string) =>
    apiClient.post<{ evaluation: any }>("/simulasi/evaluate-star", { question, situation, action, result }),
  submitProject: (courseId: string, projectUrl: string, studentCodeNotes?: string) =>
    apiClient.post<{ review: MentorReview; profile: Profile }>("/projects/submit", { courseId, projectUrl, studentCodeNotes })
};

export const jobApi = {
  getJobs: () => apiClient.get<JobVacancy[]>("/jobs"),
  applyJob: (jobId: string, cvDocumentId?: number | null, coverNote?: string) =>
    apiClient.post<{ job: JobVacancy; profile: Profile }>("/jobs/apply", { jobId, cvDocumentId, coverNote })
};

export const recruiterApi = {
  getOverview: () => apiClient.get<RecruiterOverview>("/recruiter/overview"),
  upsertCompany: (data: { name: string; industry?: string; logo?: string; location?: string; website?: string; description?: string }) =>
    apiClient.post<any>("/recruiter/company", data),
  createJob: (data: { title: string; salary: string; location: string; jobType?: string; requiredSkills: string[]; description: string }) =>
    apiClient.post<any>("/recruiter/jobs", data),
  updateJob: (jobId: string, data: { status?: "active" | "closed"; title?: string; salary?: string; location?: string; description?: string }) =>
    apiClient.put<any>(`/recruiter/jobs/${jobId}`, data),
  updateApplicationStatus: (applicationId: number, data: { status: string; hrNotes?: string; interviewAt?: string | null }) =>
    apiClient.put<any>(`/recruiter/applications/${applicationId}`, data),
  searchTalent: (q?: string) => apiClient.get<any[]>(`/recruiter/talent${q ? `?q=${encodeURIComponent(q)}` : ""}`),
};

export const mentorApi = {
  getSubmissions: () => apiClient.get<MentorSubmissionItem[]>("/mentor/submissions"),
  reviewSubmission: (id: number, data: { score: number; status: "PASS" | "RETRY"; feedback: string; strengths?: string[]; weaknesses?: string[] }) =>
    apiClient.post<any>(`/mentor/submissions/${id}/review`, data),
};

export const mentoringApi = {
  getSlots: () => apiClient.get<MentoringSlot[]>("/mentoring/slots"),
  createSlot: (data: { topic: string; scheduleLabel: string; durationMinutes?: number; priceGems?: number; maxQuota?: number; mentorCompany?: string }) =>
    apiClient.post<any>("/mentoring/slots", data),
  bookSlot: (slotId: string, notes?: string) =>
    apiClient.post<{ booking: any; profile: Profile }>(`/mentoring/slots/${slotId}/book`, { notes }),
  getMyBookings: () => apiClient.get<MentoringBooking[]>("/mentoring/my-bookings"),
  updateBooking: (id: number, data: { status?: string; mentorNotes?: string; meetingLink?: string }) =>
    apiClient.put<any>(`/mentoring/bookings/${id}`, data),
};

export const forumApi = {
  getPosts: () => apiClient.get<any[]>("/forum"),
  createPost: (title: string, content: string, tags: string[]) => apiClient.post<any[]>("/forum", { title, content, tags }),
  replyPost: (postId: string, content: string) => apiClient.post<any[]>(`/forum/${postId}/reply`, { content }),
  upvotePost: (id: string) => apiClient.post<any[]>(`/forum/${id}/upvote`),
  getCollaborationRooms: () => apiClient.get<any[]>("/collaboration/rooms"),
  createCollaborationRoom: (title: string, courseId?: string) => apiClient.post<any[]>("/collaboration/rooms", { title, courseId }),
  postChat: (roomId: string, text: string) => apiClient.post<{ messages: any[] }>("/collaboration/chat", { roomId, text }),
  createTask: (roomId: string, title: string, assignee?: string, priority?: string) =>
    apiClient.post<{ tasks: any[] }>("/collaboration/tasks", { roomId, title, assignee, priority }),
  updateTaskStatus: (roomId: string, taskId: string, status: string) =>
    apiClient.post<{ tasks: any[] }>("/collaboration/task-status", { roomId, taskId, status }),
  submitCollabProject: (roomId: string, projectUrl: string) =>
    apiClient.post<any>("/collaboration/submit-project", { roomId, projectUrl }),
};

export const communityApi = {
  getScholarships: () => apiClient.get<ScholarshipItem[]>("/scholarships"),
  getEvents: () => apiClient.get<EventItem[]>("/events"),
  registerEvent: (eventId: string) => apiClient.post<{ events: EventItem[]; profile: Profile }>(`/events/${eventId}/register`),
};

export const billingApi = {
  getCatalog: () => apiClient.get<BillingProduct[]>("/billing/catalog"),
  getHistory: () => apiClient.get<{ orders: OrderRecord[]; ledger: WalletLedgerEntry[] }>("/billing/history"),
  createOrder: (productId: string, paymentMethod: string = "qris") =>
    apiClient.post<OrderRecord>("/billing/orders", { productId, paymentMethod }),
  confirmOrder: (orderCode: string) =>
    apiClient.post<{ alreadyPaid: boolean; order: OrderRecord; profile: Profile; orders: OrderRecord[]; ledger: WalletLedgerEntry[] }>(
      `/billing/orders/${orderCode}/confirm`
    ),
};

export const adaptiveApi = {
  start: (category: string = "TKD BUMN", maxQuestions: number = 6) =>
    apiClient.post<AdaptiveAssessmentState>("/assessments/adaptive/start", { category, maxQuestions }),
  answer: (assessmentId: string, selectedOption: number) =>
    apiClient.post<AdaptiveAssessmentState>(`/assessments/adaptive/${assessmentId}/answer`, { selectedOption }),
  getHistory: () => apiClient.get<any[]>("/assessments/adaptive/history"),
};

export const cvApi = {
  list: () => apiClient.get<CvDocument[]>("/cv"),
  save: (cv: CvDocument) => apiClient.post<CvDocument>("/cv", cv),
  analyze: (payload: { cvId?: number; targetJobId?: string; cvDraft: CvDocument }) =>
    apiClient.post<CvAtsFeedback>("/cv/analyze", payload),
};

export const interviewApi = {
  getHistory: () => apiClient.get<InterviewSessionRecord[]>("/interviews/history"),
  start: (params: { jobId?: string; jobTitle?: string; companyName?: string; mode?: "voice" | "text" }) =>
    apiClient.post<{ sessionId: string; jobTitle: string; companyName: string; mode: string; status: string }>("/interviews/start", params),
  complete: (sessionId: string, body?: { transcript?: InterviewTranscriptTurn[]; durationSeconds?: number }) =>
    apiClient.post<{ session: InterviewSessionRecord; profile: Profile }>(`/interviews/${sessionId}/complete`, body),
};

export const devApi = {
  toggleDevMode: (isDevMode: boolean) => apiClient.post<{ profile: Profile }>("/developer/toggle", { isDevMode }),
  unlockCertificates: () => apiClient.post<{ profile: Profile; courses: Course[] }>("/developer/unlock-certificates"),
  resetData: () => apiClient.post<{ profile: Profile }>("/developer/reset")
};

export const notificationApi = {
  getNotifications: () => apiClient.get<SystemNotification[]>("/notifications"),
  clearNotifications: () => apiClient.post<{ notifications: SystemNotification[] }>("/notifications/clear")
};

export const quizApi = {
  startSession: (params: {
    mode: "lesson" | "quick" | "simulation" | "wrong" | "topic";
    courseId?: string;
    lessonId?: string;
    difficulty?: "Pemula" | "Menengah" | "Sulit";
    questionCount?: number;
    shuffle?: boolean;
  }) => apiClient.post<{
    attemptId: string;
    title: string;
    subtitle: string;
    mode: string;
    difficulty: string;
    courseId?: string;
    lessonId?: string;
    totalQuestions: number;
    durationSeconds: number;
    startedAt: string;
    expiresAt: string;
    questions: {
      id: string;
      text: string;
      options: string[];
      competencyTag?: string;
      hint?: string;
    }[];
    savedAnswers: Record<string | number, number>;
    flaggedQuestions: number[];
  }>("/quiz/start", params),

  getSession: (attemptId: string) => apiClient.get<{
    attemptId: string;
    title: string;
    subtitle: string;
    mode: string;
    difficulty: string;
    courseId?: string;
    lessonId?: string;
    status: string;
    totalQuestions: number;
    durationSeconds: number;
    remainingSeconds: number;
    startedAt: string;
    expiresAt: string | null;
    questions: {
      id: string;
      text: string;
      options: string[];
      competencyTag?: string;
      hint?: string;
    }[];
    savedAnswers: Record<string | number, number>;
    flaggedQuestions: number[];
    isExpired: boolean;
  }>(`/quiz/session/${attemptId}`),

  saveDraft: (attemptId: string, answers: Record<string | number, number>, flaggedQuestions?: number[]) =>
    apiClient.post<{ success: boolean; savedAt: string }>("/quiz/save-draft", { attemptId, answers, flaggedQuestions }),

  submitSession: (attemptId: string, answers: Record<string | number, number>, timeSpentSeconds?: number) =>
    apiClient.post<{
      success: boolean;
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
      leveledUp: boolean;
      profile: Profile;
      answersHistory: {
        questionIndex: number;
        questionId: string;
        questionText: string;
        selectedOption: number;
        correctOption: number;
        isCorrect: boolean;
        explanation: string;
        options: string[];
        competencyTag?: string;
      }[];
    }>("/quiz/submit", { attemptId, answers, timeSpentSeconds }),

  getHistory: () => apiClient.get<any[]>("/quiz/history")
};

// --- Skillora 2.0 Upgrade APIs ---
export const labApi = {
  list: () => apiClient.get<LabChallenge[]>("/labs"),
  getSubmissions: (challengeId?: string) =>
    apiClient.get<LabSubmissionRecord[]>(
      challengeId ? `/labs/submissions?challengeId=${encodeURIComponent(challengeId)}` : "/labs/submissions"
    ),
  evaluate: (payload: {
    challengeId: string;
    codeOrAnswer: string;
    testPassedCount?: number;
    testTotalCount?: number;
    testReport?: Array<{ label: string; passed: boolean; details?: string }>;
  }) => apiClient.post<{ submission: LabSubmissionRecord; profile: Profile }>("/labs/evaluate", payload),
};

export const studyApi = {
  getNote: (courseId: string, lessonId: string) =>
    apiClient.get<LessonNoteRecord | null>(
      `/notes?courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`
    ),
  listNotes: () => apiClient.get<LessonNoteRecord[]>("/notes"),
  saveNote: (courseId: string, lessonId: string, content: string, isPinned = false) =>
    apiClient.post<LessonNoteRecord>("/notes", { courseId, lessonId, content, isPinned }),
  deleteNote: (courseId: string, lessonId: string) =>
    apiClient.delete<{ deleted: boolean }>(
      `/notes?courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`
    ),
  getRoadmap: () => apiClient.get<StudyRoadmapRecord | null>("/roadmap"),
  generateRoadmap: (targetRole: string, hoursPerWeek: number) =>
    apiClient.post<StudyRoadmapRecord>("/roadmap/generate", { targetRole, hoursPerWeek }),
  toggleRoadmapTask: (roadmapId: number, taskId: string) =>
    apiClient.post<StudyRoadmapRecord>("/roadmap/toggle", { roadmapId, taskId }),
  copilotChat: (
    message: string,
    context?: {
      pagePath?: string;
      courseTitle?: string;
      lessonTitle?: string;
      labTitle?: string;
      codeSnippet?: string;
    }
  ) => apiClient.post<{ response: string }>("/ai/copilot", { message, context }),
};

export const arenaApi = {
  getLeague: (tier?: string) =>
    apiClient.get<LeagueOverview>(tier ? `/arena/league?tier=${encodeURIComponent(tier)}` : "/arena/league"),
  listTryouts: () => apiClient.get<TryoutPackage[]>("/arena/tryouts"),
  submitTryout: (tryoutId: string, answers: Record<string, number>, durationSeconds: number) =>
    apiClient.post<{
      attempt: TryoutAttemptRecord;
      reviewItems: Array<{
        id: string;
        prompt: string;
        selectedOption: number;
        correctOption: number;
        isCorrect: boolean;
        explanation: string;
        competencyTag: string;
      }>;
      earnedXp: number;
      earnedGems: number;
      profile: Profile;
    }>("/arena/tryouts/submit", { tryoutId, answers, durationSeconds }),
  getRecentMatches: () =>
    apiClient.get<
      Array<{
        id: number;
        roomCode: string;
        topic: string;
        mode: string;
        participants: Array<{ name: string; score: number; correctCount: number; avatar?: string }>;
        winnerName: string | null;
        questionCount: number;
        finishedAt: string;
      }>
    >("/arena/matches"),
};

export const careerExpansionApi = {
  getTalentMatch: () => apiClient.get<TalentMatchJob[]>("/career/talent-match"),
  updatePortfolioSettings: (payload: {
    portfolioSlug?: string;
    portfolioPublic?: boolean;
    portfolioHeadline?: string;
    campusName?: string;
    majorName?: string;
    bio?: string;
  }) => apiClient.put<{ profile: Profile }>("/portfolio/settings", payload),
  listCampusCohorts: () => apiClient.get<CampusCohortItem[]>("/career/campus"),
  joinCampusCohort: (cohortId: string, majorName?: string) =>
    apiClient.post<{ profile: Profile; cohorts: CampusCohortItem[] }>("/career/campus/join", {
      cohortId,
      majorName,
    }),
};

export async function fetchPublicPortfolio(slug: string): Promise<PublicPortfolioData> {
  const res = await fetch(`/api/v1/public/portfolio/${encodeURIComponent(slug)}`);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error?.message || "Portofolio tidak ditemukan.");
  }
  return json.data as PublicPortfolioData;
}

// --- Training Engine 3.0 APIs ---
export const trainingApi = {
  getCourseOverview: (courseId: string) =>
    apiClient.get<CourseTrainingOverview>(`/training/course/${encodeURIComponent(courseId)}/overview`),

  getExamQuestions: (courseId: string, examType: "pretest" | "final") =>
    apiClient.get<{
      courseId: string;
      courseTitle: string;
      examType: "pretest" | "final";
      passingScore: number;
      durationSeconds: number;
      questions: Array<{
        id: string;
        lessonId: string;
        lessonTitle: string;
        text: string;
        options: string[];
        competencyTag: string;
      }>;
    }>(`/training/course/${encodeURIComponent(courseId)}/exam/${examType}`),

  submitCourseExam: (
    courseId: string,
    payload: {
      examType: "pretest" | "final";
      answers: Record<string, number>;
      questionIds: string[];
      durationSeconds: number;
    }
  ) =>
    apiClient.post<{
      exam: CourseExamRecord;
      reviewItems: Array<{
        id: string;
        text: string;
        lessonId: string;
        lessonTitle: string;
        selectedOption: number;
        correctOption: number;
        isCorrect: boolean;
        explanation: string;
        competencyTag: string;
      }>;
      certificateIssued: boolean;
      profile: Profile;
    }>(`/training/course/${encodeURIComponent(courseId)}/exam/submit`, payload),

  getFlashcardQueue: (courseId?: string) =>
    apiClient.get<{
      totalCount: number;
      dueCount: number;
      masteredCount: number;
      cards: FlashcardQueueItem[];
    }>(courseId ? `/training/flashcards?courseId=${encodeURIComponent(courseId)}` : "/training/flashcards"),

  reviewFlashcard: (payload: {
    courseId: string;
    lessonId: string;
    cardId: string;
    quality: "again" | "hard" | "good" | "easy";
  }) =>
    apiClient.post<{
      cardId: string;
      easeFactor: number;
      intervalDays: number;
      repetitions: number;
      lastQuality: string;
      nextReviewAt: string;
      earnedXp: number;
      profile: Profile;
    }>("/training/flashcards/review", payload),

  submitAssignment: (courseId: string, answerText: string) =>
    apiClient.post<{ assignment: TrainingAssignmentRecord; profile: Profile }>(
      `/training/course/${encodeURIComponent(courseId)}/assignment`,
      { answerText }
    ),

  getAdaptiveDrill: (count = 8) =>
    apiClient.get<{
      weakTopics: string[];
      prioritizedCount: number;
      questions: Array<
        Question & {
          courseId: string;
          courseTitle: string;
          lessonId: string;
          lessonTitle: string;
          category: string;
        }
      >;
    }>(`/training/adaptive-drill?count=${count}`),

  getSimulationHistory: (simType?: "tkd" | "kraepelin" | "decision" | "star") =>
    apiClient.get<SimulationAttemptRecord[]>(
      simType
        ? `/training/simulations/history?simType=${encodeURIComponent(simType)}`
        : "/training/simulations/history"
    ),

  recordSimulation: (payload: {
    simType: "tkd" | "kraepelin" | "decision" | "star";
    title: string;
    score: number;
    metrics: Record<string, any>;
    aiFeedback?: string;
    earnedXp?: number;
  }) =>
    apiClient.post<{ attempt: SimulationAttemptRecord; profile: Profile }>(
      "/training/simulations/record",
      payload
    ),

  evaluateStar: (payload: { question: string; answer: string; role?: string }) =>
    apiClient.post<{ evaluation: StarEvaluationResult; profile: Profile }>(
      "/training/simulations/star-evaluate",
      payload
    ),
};
