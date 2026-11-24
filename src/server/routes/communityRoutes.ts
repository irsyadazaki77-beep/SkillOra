import { Router, Response } from "express";
import { AuthenticatedRequest, requireAuth, requireRegistered } from "../middlewares/authMiddleware.js";
import { CommunityCatalogService } from "../services/communityCatalogService.js";

const router = Router();

router.get("/scholarships", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await CommunityCatalogService.getScholarships();
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
  }
});

router.get("/events", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await CommunityCatalogService.getEvents(req.userId);
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
  }
});

router.post("/events/:eventId/register", requireRegistered, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await CommunityCatalogService.registerEvent(req.userId!, req.params.eventId);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
  }
});

export default router;
