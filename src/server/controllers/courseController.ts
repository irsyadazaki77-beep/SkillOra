import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { CourseService } from "../services/courseService.js";

export class CourseController {
  static async getCourses(req: AuthenticatedRequest, res: Response) {
    try {
      const courses = await CourseService.getCourses(req.userId, false);
      return res.json({ success: true, data: courses });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message }
      });
    }
  }

  static async getLmsCourses(req: AuthenticatedRequest, res: Response) {
    try {
      const courses = await CourseService.getCourses(req.userId, true);
      return res.json({ success: true, data: courses });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message }
      });
    }
  }

  static async completeLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await CourseService.completeLesson(req.userId!, req.body);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static getFlashChallenge(req: AuthenticatedRequest, res: Response) {
    return res.json({ success: true, data: CourseService.getFlashChallenge() });
  }

  static async claimFlashChallenge(req: AuthenticatedRequest, res: Response) {
    try {
      const selectedIdx = Number(req.body?.selectedIdx);
      const result = await CourseService.claimFlashChallenge(req.userId!, selectedIdx);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async createCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const created = await CourseService.createCourse(req.userId!, req.body);
      return res.json({ success: true, data: created });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async updateCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const updated = await CourseService.updateCourse(req.userId!, req.params.id, req.body);
      return res.json({ success: true, data: updated });
    } catch (err: any) {
      const status = err.message?.includes("Akses ditolak") ? 403 : 400;
      return res.status(status).json({
        success: false,
        error: { code: status === 403 ? "FORBIDDEN" : "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async deleteCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await CourseService.deleteCourse(req.userId!, req.params.id);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      const status = err.message?.includes("Akses ditolak") ? 403 : 400;
      return res.status(status).json({
        success: false,
        error: { code: status === 403 ? "FORBIDDEN" : "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async addLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const updatedCourse = await CourseService.addLesson(req.userId!, req.params.id, req.body);
      return res.json({ success: true, data: updatedCourse });
    } catch (err: any) {
      const status = err.message?.includes("Akses ditolak") ? 403 : 400;
      return res.status(status).json({
        success: false,
        error: { code: status === 403 ? "FORBIDDEN" : "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async enrollCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await CourseService.enrollCourse(req.userId!, req.params.id);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      const status = err.message?.includes("tidak ditemukan") ? 404 : 400;
      return res.status(status).json({
        success: false,
        error: { code: status === 404 ? "NOT_FOUND" : "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async getLearningPaths(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await CourseService.getLearningPaths(req.userId);
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message },
      });
    }
  }

  static async enrollLearningPath(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await CourseService.enrollLearningPath(req.userId!, req.params.slug);
      return res.json({ success: true, data });
    } catch (err: any) {
      const status = err.message?.includes("tidak ditemukan") ? 404 : 400;
      return res.status(status).json({
        success: false,
        error: { code: status === 404 ? "NOT_FOUND" : "BAD_REQUEST", message: err.message },
      });
    }
  }

  static async claimLearningPathCertificate(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await CourseService.claimLearningPathCertificate(req.userId!, req.params.slug);
      return res.json({ success: true, data });
    } catch (err: any) {
      const status = err.message?.includes("tidak ditemukan") ? 404 : 400;
      return res.status(status).json({
        success: false,
        error: { code: status === 404 ? "NOT_FOUND" : "BAD_REQUEST", message: err.message },
      });
    }
  }

  static async updateLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await CourseService.updateLesson(req.userId!, req.params.id, req.params.lessonId, req.body);
      return res.json({ success: true, data });
    } catch (err: any) {
      const status = err.message?.includes("Akses ditolak") ? 403 : 400;
      return res.status(status).json({
        success: false,
        error: { code: status === 403 ? "FORBIDDEN" : "BAD_REQUEST", message: err.message },
      });
    }
  }

  static async deleteLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await CourseService.deleteLesson(req.userId!, req.params.id, req.params.lessonId);
      return res.json({ success: true, data });
    } catch (err: any) {
      const status = err.message?.includes("Akses ditolak") ? 403 : 400;
      return res.status(status).json({
        success: false,
        error: { code: status === 403 ? "FORBIDDEN" : "BAD_REQUEST", message: err.message },
      });
    }
  }

  static async getLmsAnalytics(_req: AuthenticatedRequest, res: Response) {
    try {
      const data = await CourseService.getLmsAnalytics();
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message },
      });
    }
  }
}
