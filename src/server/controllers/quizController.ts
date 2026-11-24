import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { QuizService } from "../services/quizService.js";

export class QuizController {
  static async startSession(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await QuizService.startSession(req.userId!, req.body);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "START_QUIZ_ERROR", message: err.message }
      });
    }
  }

  static async getSession(req: AuthenticatedRequest, res: Response) {
    try {
      const { attemptId } = req.params;
      const data = await QuizService.getSession(req.userId!, attemptId);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(404).json({
        success: false,
        error: { code: "QUIZ_NOT_FOUND", message: err.message }
      });
    }
  }

  static async saveDraft(req: AuthenticatedRequest, res: Response) {
    try {
      const { attemptId, answers, flaggedQuestions } = req.body;
      const data = await QuizService.saveDraft(req.userId!, attemptId, answers, flaggedQuestions);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "SAVE_DRAFT_ERROR", message: err.message }
      });
    }
  }

  static async submitSession(req: AuthenticatedRequest, res: Response) {
    try {
      const { attemptId, answers, timeSpentSeconds } = req.body;
      if (!attemptId) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_REQUEST", message: "attemptId wajib disertakan" }
        });
      }
      const data = await QuizService.submitSession(req.userId!, attemptId, answers, timeSpentSeconds);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "SUBMIT_QUIZ_ERROR", message: err.message }
      });
    }
  }

  static async getHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await QuizService.getAttemptHistory(req.userId!);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message }
      });
    }
  }
}
