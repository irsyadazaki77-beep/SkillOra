import { Router, Response } from "express";
import { AuthenticatedRequest, requireAdmin } from "../middlewares/authMiddleware.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { CourseRepository } from "../repositories/CourseRepository.js";

const router = Router();

router.post("/developer/toggle", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { isDevMode } = req.body;
    const userRow = await UserRepository.getOrCreateUser(req.userId!, req.userEmail || "user@skillora.app", req.userName || "Siswa");

    await UserRepository.updateUserRow(userRow.id, {
      role: isDevMode ? "Developer" : "Pelajar Siap Kerja",
      updatedAt: new Date(),
    });

    const profile = await UserRepository.getFullProfile(req.userId!);

    return res.json({ success: true, data: { profile } });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: err.message }
    });
  }
});

router.post("/developer/unlock-certificates", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRow = await UserRepository.getOrCreateUser(req.userId!, req.userEmail || "user@skillora.app", req.userName || "Siswa");
    const allCourses = await CourseRepository.getCourses(userRow.id);

    const allCourseIds = allCourses.map((c: any) => c.id);

    await UserRepository.updateUserRow(userRow.id, {
      certifiedCourses: allCourseIds,
      xp: userRow.xp + 2500,
      gems: userRow.gems + 500,
      level: Math.max(userRow.level, 10),
      careerStage: "certified",
      updatedAt: new Date(),
    });

    const profile = await UserRepository.getFullProfile(req.userId!);
    return res.json({
      success: true,
      data: { profile, courses: allCourses }
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: err.message }
    });
  }
});

router.post("/developer/reset", requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRow = await UserRepository.getOrCreateUser(req.userId!, req.userEmail || "user@skillora.app", req.userName || "Siswa");

    await UserRepository.updateUserRow(userRow.id, {
      role: "Pelajar Siap Kerja",
      xp: 1350,
      gems: 150,
      level: 3,
      certifiedCourses: [],
      careerStage: "learning",
      updatedAt: new Date(),
    });

    const profile = await UserRepository.getFullProfile(req.userId!);
    return res.json({ success: true, data: { profile } });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: err.message }
    });
  }
});

export default router;
