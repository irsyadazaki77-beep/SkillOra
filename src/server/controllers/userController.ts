import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { UserService } from "../services/userService.js";

export class UserController {
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const profile = await UserService.getProfile(req.userId!);
      return res.json({ success: true, data: profile });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message }
      });
    }
  }

  static async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const profile = await UserService.updateSettings(req.userId!, req.body);
      return res.json({ success: true, data: { profile } });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async handleOnboarding(req: AuthenticatedRequest, res: Response) {
    try {
      const profile = await UserService.updateOnboarding(req.userId!, req.body);
      return res.json({ success: true, data: { profile } });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async registerRole(req: AuthenticatedRequest, res: Response) {
    try {
      const profile = await UserService.registerRole(req.userId!, req.body);
      return res.json({ success: true, data: { profile } });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async bookmarkCourse(req: AuthenticatedRequest, res: Response) {
    try {
      const { courseId } = req.body;
      if (!courseId) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "courseId wajib diisi" }
        });
      }
      const profile = await UserService.toggleBookmarkCourse(req.userId!, courseId);
      return res.json({ success: true, data: { profile } });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message }
      });
    }
  }

  static async bookmarkLesson(req: AuthenticatedRequest, res: Response) {
    try {
      const { lessonId } = req.body;
      if (!lessonId) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "lessonId wajib diisi" }
        });
      }
      const profile = await UserService.toggleBookmarkLesson(req.userId!, lessonId);
      return res.json({ success: true, data: { profile } });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message }
      });
    }
  }

  static async bookmarkJob(req: AuthenticatedRequest, res: Response) {
    try {
      const { jobId } = req.body;
      if (!jobId) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "jobId wajib diisi" }
        });
      }
      const profile = await UserService.toggleBookmarkJob(req.userId!, jobId);
      return res.json({ success: true, data: { profile } });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message }
      });
    }
  }

  static async claimDaily(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await UserService.claimDaily(req.userId!);
      return res.json({ success: true, data: result });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async buyItem(req: AuthenticatedRequest, res: Response) {
    try {
      const { itemId } = req.body;
      if (!itemId) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "itemId wajib diisi" }
        });
      }
      const profile = await UserService.buyItem(req.userId!, itemId);
      return res.json({ success: true, data: { profile } });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async repairStreak(req: AuthenticatedRequest, res: Response) {
    try {
      const profile = await UserService.repairStreak(req.userId!);
      return res.json({ success: true, data: { profile } });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async claimAchievement(req: AuthenticatedRequest, res: Response) {
    try {
      const { achievementId } = req.body;
      if (!achievementId) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "achievementId wajib diisi" }
        });
      }
      const profile = await UserService.claimAchievement(req.userId!, achievementId);
      return res.json({ success: true, data: { profile } });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async getLeaderboard(req: AuthenticatedRequest, res: Response) {
    try {
      const leaderboard = await UserService.getLeaderboard(req.userId!);
      return res.json({ success: true, data: leaderboard });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: { code: "SERVER_ERROR", message: err.message }
      });
    }
  }

  static async claimQuest(req: AuthenticatedRequest, res: Response) {
    try {
      const questId = req.body?.questId || req.params?.questId;
      const profile = await UserService.claimQuest(req.userId!, questId);
      return res.json({ success: true, data: { profile } });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async buyFreeze(req: AuthenticatedRequest, res: Response) {
    try {
      const profile = await UserService.buyItem(req.userId!, "streak-freeze");
      return res.json({ success: true, data: { profile } });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async setAvatar(req: AuthenticatedRequest, res: Response) {
    try {
      const { avatar } = req.body;
      const profile = await UserService.setAvatar(req.userId!, avatar);
      return res.json({ success: true, data: { profile } });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async addSkill(req: AuthenticatedRequest, res: Response) {
    try {
      const { skillName } = req.body;
      const profile = await UserService.addSkill(req.userId!, skillName);
      return res.json({ success: true, data: { profile } });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async addXp(req: AuthenticatedRequest, res: Response) {
    try {
      const xp = req.body.xp || req.body.amount;
      if (typeof xp !== "number" || xp <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Jumlah XP tidak valid." }
        });
      }
      const profile = await UserService.addXp(req.userId!, xp);
      return res.json({ success: true, data: { profile } });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async handleSyncAuth(req: AuthenticatedRequest, res: Response) {
    try {
      const profile = await UserService.syncUser(req.userId!, req.body);
      return res.json({ success: true, data: { profile } });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        error: { code: "BAD_REQUEST", message: err.message }
      });
    }
  }

  static async handleLogout(req: AuthenticatedRequest, res: Response) {
    return res.json({ success: true, data: {} });
  }
}
