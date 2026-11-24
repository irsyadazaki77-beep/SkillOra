import { Router } from "express";
import { QuizController } from "../controllers/quizController.js";
import { requireAuth, requireRegistered } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/quiz/start", requireAuth, QuizController.startSession);
router.get("/quiz/session/:attemptId", requireAuth, QuizController.getSession);
router.post("/quiz/save-draft", requireRegistered, QuizController.saveDraft);
router.post("/quiz/submit", requireRegistered, QuizController.submitSession);
router.get("/quiz/history", requireAuth, QuizController.getHistory);

export default router;
