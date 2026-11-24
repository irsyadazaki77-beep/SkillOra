import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { AIService } from "../services/aiService.js";
import { AdaptiveQuizService } from "../services/adaptiveQuizService.js";
import { CvService } from "../services/cvService.js";
import { InterviewService } from "../services/interviewService.js";
import { UserService } from "../services/userService.js";
import { ProjectRepository } from "../repositories/ProjectRepository.js";
import { sanitizeString } from "../middlewares/validateInput.js";
import { safeParse } from "../../utils/safeJson.js";

export class AIController {
  static async mentorChat(req: AuthenticatedRequest, res: Response) {
    try {
      const cleanMessage = sanitizeString(req.body.message, 1000);
      const context = req.body.context || undefined;
      const result = await AIService.mentorChat(cleanMessage, context);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message }
      });
    }
  }

  static async hrInterview(req: AuthenticatedRequest, res: Response) {
    try {
      const { jobId } = req.body;
      const cleanMessage = sanitizeString(req.body.message, 1000);
      const result = await AIService.hrInterview(jobId, cleanMessage);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message }
      });
    }
  }

  static async evaluateSTAR(req: AuthenticatedRequest, res: Response) {
    try {
      const question = sanitizeString(req.body.question, 500);
      const situation = sanitizeString(req.body.situation, 1000);
      const action = sanitizeString(req.body.action, 1000);
      const resultText = sanitizeString(req.body.result, 1000);

      if (!situation || !action || !resultText) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Situasi, Aksi, dan Hasil wajib diisi." }
        });
      }

      const evaluation = await AIService.evaluateSTAR(question, situation, action, resultText);
      return res.json({ success: true, data: { evaluation } });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message }
      });
    }
  }

  static async submitProject(req: AuthenticatedRequest, res: Response) {
    try {
      const { courseId, projectUrl, studentCodeNotes } = req.body;
      if (!courseId || !projectUrl) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "courseId dan projectUrl wajib diisi." }
        });
      }

      const cleanUrl = sanitizeString(projectUrl, 500);
      const cleanNotes = sanitizeString(studentCodeNotes, 1000);

      const result = await AIService.submitProject(req.userId!, courseId, cleanUrl, cleanNotes);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async getProjectReviews(req: AuthenticatedRequest, res: Response) {
    try {
      const profile = await UserService.getProfile(req.userId!);
      const submissions = await ProjectRepository.getAllSubmissions(profile.id);

      const reviews: Record<string, any> = {};
      for (const sub of submissions) {
        reviews[sub.courseId] = {
          status: sub.status,
          score: sub.score,
          strengths: safeParse<string[]>(sub.strengths, []),
          weaknesses: safeParse<string[]>(sub.weaknesses, []),
          mentorFeedbackText: sub.feedback || "",
          earnedCertificateId: sub.earnedCertificateId || undefined,
          awardedXp: 300,
          awardedGems: 100,
          reviewedAt: sub.reviewedAt
            ? sub.reviewedAt.toISOString()
            : sub.submittedAt
            ? sub.submittedAt.toISOString()
            : new Date().toISOString(),
          submittedCode: sub.studentCodeNotes || ""
        };
      }
      return res.json({ success: true, data: reviews });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message }
      });
    }
  }

  // Adaptive AI Assessments
  static async startAdaptive(req: AuthenticatedRequest, res: Response) {
    try {
      const category = req.body?.category || "TKD BUMN";
      const maxQuestions = req.body?.maxQuestions || 6;
      const result = await AdaptiveQuizService.startAssessment(req.userId!, category, maxQuestions);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
    }
  }

  static async answerAdaptive(req: AuthenticatedRequest, res: Response) {
    try {
      const { selectedOption } = req.body;
      if (selectedOption === undefined || selectedOption === null) {
        return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Pilihan jawaban wajib diisi." } });
      }
      const result = await AdaptiveQuizService.answerQuestion(req.userId!, req.params.assessmentId, Number(selectedOption));
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
    }
  }

  static async getAdaptiveHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const history = await AdaptiveQuizService.getHistory(req.userId!);
      return res.json({ success: true, data: history });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
    }
  }

  // CV ATS Builder
  static async listCvs(req: AuthenticatedRequest, res: Response) {
    try {
      const docs = await CvService.listCvs(req.userId!);
      return res.json({ success: true, data: docs });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
    }
  }

  static async saveCv(req: AuthenticatedRequest, res: Response) {
    try {
      const doc = await CvService.saveCv(req.userId!, req.body);
      return res.json({ success: true, data: doc });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
    }
  }

  static async analyzeCv(req: AuthenticatedRequest, res: Response) {
    try {
      const feedback = await CvService.analyzeCvWithAts(req.userId!, req.body);
      return res.json({ success: true, data: feedback });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
    }
  }

  // Mock Interview Sessions
  static async getInterviewHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const history = await InterviewService.getHistory(req.userId!);
      return res.json({ success: true, data: history });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
    }
  }

  static async startInterview(req: AuthenticatedRequest, res: Response) {
    try {
      const session = await InterviewService.startSession(req.userId!, req.body || {});
      return res.json({ success: true, data: session });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
    }
  }

  static async completeInterview(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await InterviewService.completeSession(req.userId!, req.params.sessionId, req.body);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
    }
  }
}
