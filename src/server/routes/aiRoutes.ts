import { Router } from "express";
import { AIController } from "../controllers/aiController.js";
import { aiLimiter } from "../middlewares/rateLimiters.js";
import { requireAuth, requireRegistered } from "../middlewares/authMiddleware.js";

const router = Router();

// Core AI Mentorship & Evaluation
router.post("/mentor/chat", requireRegistered, aiLimiter, AIController.mentorChat);
router.post("/jobs/interview", requireRegistered, aiLimiter, AIController.hrInterview);
router.post("/simulasi/evaluate-star", requireRegistered, aiLimiter, AIController.evaluateSTAR);
router.post("/projects/submit", requireRegistered, aiLimiter, AIController.submitProject);
router.post("/project/assist", requireRegistered, aiLimiter, AIController.projectAssist);
router.get("/projects/reviews", requireAuth, AIController.getProjectReviews);

// Adaptive AI Assessments (CAT)
router.post("/assessments/adaptive/start", requireRegistered, aiLimiter, AIController.startAdaptive);
router.post("/assessments/adaptive/:assessmentId/answer", requireRegistered, aiLimiter, AIController.answerAdaptive);
router.get("/assessments/adaptive/history", requireAuth, AIController.getAdaptiveHistory);

// CV ATS Builder & AI Optimization
router.get("/cv", requireAuth, AIController.listCvs);
router.post("/cv", requireRegistered, AIController.saveCv);
router.post("/cv/analyze", requireRegistered, aiLimiter, AIController.analyzeCv);

// Real-Time Mock Interview History & Lifecycle
router.get("/interviews/history", requireAuth, AIController.getInterviewHistory);
router.post("/interviews/start", requireRegistered, aiLimiter, AIController.startInterview);
router.post("/interviews/:sessionId/complete", requireRegistered, aiLimiter, AIController.completeInterview);

export default router;
