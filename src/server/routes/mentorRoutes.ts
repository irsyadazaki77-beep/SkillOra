import { Router, Response } from "express";
import { AuthenticatedRequest, requireAccountRole, requireAuth, requireRegistered } from "../middlewares/authMiddleware.js";
import { MentorService } from "../services/mentorService.js";
import { sanitizeString } from "../middlewares/validateInput.js";

const router = Router();

// Mentor Project Review Queue
router.get("/mentor/submissions", requireAccountRole("mentor", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const list = await MentorService.getSubmissionsQueue();
    return res.json({ success: true, data: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
  }
});

router.post("/mentor/submissions/:id/review", requireAccountRole("mentor", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "ID submission tidak valid" } });
    const updated = await MentorService.reviewSubmission(req.userId!, id, {
      score: Number(req.body.score),
      status: req.body.status,
      feedback: sanitizeString(req.body.feedback, 2000),
      strengths: req.body.strengths,
      weaknesses: req.body.weaknesses,
    });
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
  }
});

// Mentoring 1-on-1 Slots & Bookings
router.get("/mentoring/slots", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const slots = await MentorService.getMentoringSlots(req.userId);
    return res.json({ success: true, data: slots });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
  }
});

router.post("/mentoring/slots", requireAccountRole("mentor", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const created = await MentorService.createMentoringSlot(req.userId!, req.body);
    return res.json({ success: true, data: created });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
  }
});

router.post("/mentoring/slots/:slotId/book", requireRegistered, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await MentorService.bookMentoringSlot(
      req.userId!,
      req.params.slotId,
      sanitizeString(req.body?.notes || "", 500)
    );
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
  }
});

router.get("/mentoring/my-bookings", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const bookings = await MentorService.getMyBookings(req.userId!);
    return res.json({ success: true, data: bookings });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
  }
});

router.put("/mentoring/bookings/:id", requireAccountRole("mentor", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "ID booking tidak valid" } });
    const updated = await MentorService.updateBooking(req.userId!, id, req.body);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    const status = err.message?.includes("Akses ditolak") ? 403 : 400;
    return res.status(status).json({ success: false, error: { code: status === 403 ? "FORBIDDEN" : "BAD_REQUEST", message: err.message } });
  }
});

export default router;
