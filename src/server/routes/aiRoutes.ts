import { Router } from "express";
import { AIController } from "../controllers/aiController.js";
import { aiLimiter } from "../middlewares/rateLimiters.js";
import { requireAuth, requireRegistered } from "../middlewares/authMiddleware.js";

const router = Router();

// Core AI Mentorship & Evaluation
router.post("/mentor/chat", requireAuth, aiLimiter, AIController.mentorChat);
router.post("/jobs/interview", requireAuth, aiLimiter, AIController.hrInterview);
router.post("/simulasi/evaluate-star", requireAuth, aiLimiter, AIController.evaluateSTAR);
router.post("/projects/submit", requireRegistered, aiLimiter, AIController.submitProject);
router.get("/projects/reviews", requireAuth, aiLimiter, AIController.getProjectReviews);

// Adaptive AI Assessments (CAT)
router.post("/assessments/adaptive/start", requireAuth, aiLimiter, AIController.startAdaptive);
router.post("/assessments/adaptive/:assessmentId/answer", requireAuth, aiLimiter, AIController.answerAdaptive);
router.get("/assessments/adaptive/history", requireAuth, AIController.getAdaptiveHistory);

// CV ATS Builder & AI Optimization
router.get("/cv", requireAuth, AIController.listCvs);
router.post("/cv", requireRegistered, AIController.saveCv);
router.post("/cv/analyze", requireAuth, aiLimiter, AIController.analyzeCv);

// Real-Time Mock Interview History & Lifecycle
router.get("/interviews/history", requireAuth, AIController.getInterviewHistory);
router.post("/interviews/start", requireAuth, aiLimiter, AIController.startInterview);
router.post("/interviews/:sessionId/complete", requireAuth, aiLimiter, AIController.completeInterview);

export default router;
