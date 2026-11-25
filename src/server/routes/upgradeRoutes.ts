import { Router } from "express";
import { requireAuth, AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { aiLimiter } from "../middlewares/rateLimiters.js";
import { LabService } from "../services/labService.js";
import { StudyWorkspaceService } from "../services/studyWorkspaceService.js";
import { ArenaService } from "../services/arenaService.js";
import { CareerExpansionService } from "../services/careerExpansionService.js";
import { TrainingEngineService } from "../services/trainingEngineService.js";

const router = Router();

// --- Interactive Coding & Case Labs ---
router.get("/labs", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const data = await LabService.listChallenges(req.userId!);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get("/labs/submissions", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const challengeId = typeof req.query.challengeId === "string" ? req.query.challengeId : undefined;
    const data = await LabService.getSubmissions(req.userId!, challengeId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post("/labs/evaluate", requireAuth, aiLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const { challengeId, codeOrAnswer, testPassedCount, testTotalCount, testReport } = req.body || {};
    if (!challengeId || typeof codeOrAnswer !== "string") {
      return res.status(400).json({
        success: false,
        error: { message: "challengeId dan codeOrAnswer wajib diisi." },
      });
    }
    const data = await LabService.evaluateSubmission(req.userId!, {
      challengeId: String(challengeId),
      codeOrAnswer,
      testPassedCount: typeof testPassedCount === "number" ? testPassedCount : undefined,
      testTotalCount: typeof testTotalCount === "number" ? testTotalCount : undefined,
      testReport: Array.isArray(testReport) ? testReport : undefined,
    });
    res.json({ success: true, data });
  } catch (err: any) {
    const status = err.message?.includes("terlalu singkat") || err.message?.includes("tidak ditemukan") ? 400 : 500;
    res.status(status).json({ success: false, error: { message: err.message } });
  }
});

// --- Cloud Lesson Notes ---
router.get("/notes", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const courseId = typeof req.query.courseId === "string" ? req.query.courseId : undefined;
    const lessonId = typeof req.query.lessonId === "string" ? req.query.lessonId : undefined;
    const data = await StudyWorkspaceService.getNotes(req.userId!, courseId, lessonId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post("/notes", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { courseId, lessonId, content, isPinned } = req.body || {};
    if (!courseId || !lessonId || typeof content !== "string") {
      return res.status(400).json({
        success: false,
        error: { message: "courseId, lessonId, dan content wajib diisi." },
      });
    }
    const data = await StudyWorkspaceService.upsertNote(
      req.userId!,
      String(courseId),
      String(lessonId),
      content,
      Boolean(isPinned)
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.delete("/notes", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const courseId = String(req.query.courseId || req.body?.courseId || "");
    const lessonId = String(req.query.lessonId || req.body?.lessonId || "");
    if (!courseId || !lessonId) {
      return res.status(400).json({
        success: false,
        error: { message: "courseId dan lessonId wajib diisi." },
      });
    }
    const data = await StudyWorkspaceService.deleteNote(req.userId!, courseId, lessonId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// --- Smart Weekly Study Roadmap ---
router.get("/roadmap", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const data = await StudyWorkspaceService.getActiveRoadmap(req.userId!);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post("/roadmap/generate", requireAuth, aiLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const { targetRole, hoursPerWeek } = req.body || {};
    const data = await StudyWorkspaceService.generateRoadmap(
      req.userId!,
      typeof targetRole === "string" && targetRole.trim() ? targetRole.trim() : "Frontend Engineer",
      typeof hoursPerWeek === "number" ? hoursPerWeek : 8
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post("/roadmap/toggle", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { roadmapId, taskId } = req.body || {};
    if (!roadmapId || !taskId) {
      return res.status(400).json({
        success: false,
        error: { message: "roadmapId dan taskId wajib diisi." },
      });
    }
    const data = await StudyWorkspaceService.toggleRoadmapTask(req.userId!, Number(roadmapId), String(taskId));
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// --- Contextual Study Copilot ---
router.post("/ai/copilot", requireAuth, aiLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const { message, context } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: "Pesan tidak boleh kosong." },
      });
    }
    const data = await StudyWorkspaceService.copilotChat(req.userId!, message.trim(), context);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// --- Competitive Arena, Tryout Akbar & Weekly League ---
router.get("/arena/league", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const tier = typeof req.query.tier === "string" ? req.query.tier : undefined;
    const data = await ArenaService.getLeagueOverview(req.userId!, tier);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get("/arena/tryouts", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const data = await ArenaService.listTryouts(req.userId!);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post("/arena/tryouts/submit", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { tryoutId, answers, durationSeconds } = req.body || {};
    if (!tryoutId) {
      return res.status(400).json({
        success: false,
        error: { message: "tryoutId wajib diisi." },
      });
    }
    const data = await ArenaService.submitTryout(req.userId!, {
      tryoutId: String(tryoutId),
      answers: answers && typeof answers === "object" ? answers : {},
      durationSeconds: Number(durationSeconds || 60),
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.get("/arena/matches", requireAuth, async (_req: AuthenticatedRequest, res) => {
  try {
    const data = await ArenaService.getRecentMatches();
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// --- Career Expansion: Talent Matching, Public Portfolio Settings & Campus Hub ---
router.get("/career/talent-match", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const data = await CareerExpansionService.getTalentMatch(req.userId!);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.put("/portfolio/settings", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { portfolioSlug, portfolioPublic, portfolioHeadline, campusName, majorName, bio } = req.body || {};
    const profile = await CareerExpansionService.updatePortfolioSettings(req.userId!, {
      portfolioSlug,
      portfolioPublic,
      portfolioHeadline,
      campusName,
      majorName,
      bio,
    });
    res.json({ success: true, data: { profile } });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.get("/career/campus", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const data = await CareerExpansionService.listCampusCohorts(req.userId!);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post("/career/campus/join", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { cohortId, majorName } = req.body || {};
    if (!cohortId) {
      return res.status(400).json({
        success: false,
        error: { message: "cohortId wajib diisi." },
      });
    }
    const data = await CareerExpansionService.joinCampusCohort(req.userId!, String(cohortId), majorName);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

// --- Training Engine 3.0: 4-Stage Courses, Exams, Flashcards SM-2, AI Assignments & Simulations ---

router.get("/training/course/:courseId/overview", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const data = await TrainingEngineService.getCourseOverview(req.userId!, String(req.params.courseId));
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(404).json({ success: false, error: { message: err.message } });
  }
});

router.get("/training/course/:courseId/exam/:examType", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const examType = req.params.examType === "final" ? "final" : "pretest";
    const data = await TrainingEngineService.getExamQuestions(String(req.params.courseId), examType);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.post("/training/course/:courseId/exam/submit", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { examType, answers, questionIds, durationSeconds } = req.body || {};
    const resolvedType = examType === "final" ? "final" : "pretest";
    const data = await TrainingEngineService.submitCourseExam(req.userId!, {
      courseId: String(req.params.courseId),
      examType: resolvedType,
      answers: answers && typeof answers === "object" ? answers : {},
      questionIds: Array.isArray(questionIds) ? questionIds.map(String) : [],
      durationSeconds: Number(durationSeconds || 60),
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.get("/training/flashcards", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const courseId = typeof req.query.courseId === "string" ? req.query.courseId : undefined;
    const data = await TrainingEngineService.getFlashcardQueue(req.userId!, courseId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post("/training/flashcards/review", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { courseId, lessonId, cardId, quality } = req.body || {};
    if (!courseId || !lessonId || !cardId || !["again", "hard", "good", "easy"].includes(quality)) {
      return res.status(400).json({
        success: false,
        error: { message: "courseId, lessonId, cardId, dan quality (again/hard/good/easy) wajib valid." },
      });
    }
    const data = await TrainingEngineService.reviewFlashcard(req.userId!, {
      courseId: String(courseId),
      lessonId: String(lessonId),
      cardId: String(cardId),
      quality,
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.post("/training/course/:courseId/assignment", requireAuth, aiLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const { answerText } = req.body || {};
    if (typeof answerText !== "string" || answerText.trim().length < 40) {
      return res.status(400).json({
        success: false,
        error: { message: "Jawaban studi kasus minimal 40 karakter." },
      });
    }
    const data = await TrainingEngineService.evaluateCourseAssignment(
      req.userId!,
      String(req.params.courseId),
      answerText
    );
    res.json({ success: true, data });
  } catch (err: any) {
    const status = err.message?.includes("singkat") || err.message?.includes("tidak ditemukan") ? 400 : 500;
    res.status(status).json({ success: false, error: { message: err.message } });
  }
});

router.get("/training/adaptive-drill", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const count = Math.max(4, Math.min(15, Number(req.query.count || 8)));
    const data = await TrainingEngineService.getAdaptiveWeakDrill(req.userId!, count);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.get("/training/simulations/history", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const simType = typeof req.query.simType === "string" ? req.query.simType : undefined;
    const data = await TrainingEngineService.getSimulationHistory(req.userId!, simType);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

router.post("/training/simulations/record", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { simType, title, score, metrics, aiFeedback, earnedXp } = req.body || {};
    if (!["tkd", "kraepelin", "decision", "star"].includes(simType) || !title) {
      return res.status(400).json({
        success: false,
        error: { message: "simType dan title wajib diisi." },
      });
    }
    const data = await TrainingEngineService.saveSimulationAttempt(req.userId!, {
      simType,
      title: String(title),
      score: Number(score || 0),
      metrics: metrics && typeof metrics === "object" ? metrics : {},
      aiFeedback: typeof aiFeedback === "string" ? aiFeedback : undefined,
      earnedXp: typeof earnedXp === "number" ? earnedXp : undefined,
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { message: err.message } });
  }
});

router.post("/training/simulations/star-evaluate", requireAuth, aiLimiter, async (req: AuthenticatedRequest, res) => {
  try {
    const { question, answer, role } = req.body || {};
    if (!question || typeof answer !== "string" || answer.trim().length < 40) {
      return res.status(400).json({
        success: false,
        error: { message: "Pertanyaan dan jawaban wawancara STAR (minimal 40 karakter) wajib diisi." },
      });
    }
    const data = await TrainingEngineService.evaluateStarInterview(req.userId!, {
      question: String(question),
      answer,
      role: typeof role === "string" ? role : undefined,
    });
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;
