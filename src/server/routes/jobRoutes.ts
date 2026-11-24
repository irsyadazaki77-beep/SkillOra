import { Router, Response } from "express";
import { AuthenticatedRequest, requireAccountRole, requireAuth, requireRegistered } from "../middlewares/authMiddleware.js";
import { JobService } from "../services/jobService.js";
import { sanitizeString } from "../middlewares/validateInput.js";

const router = Router();

// Candidate Bursa Kerja routes
router.get("/jobs", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const jobs = await JobService.getJobs(req.userId!);
    return res.json({ success: true, data: jobs });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: err.message }
    });
  }
});

router.post("/jobs/apply", requireRegistered, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId, cvDocumentId, coverNote } = req.body;
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "jobId wajib diisi" }
      });
    }
    const result = await JobService.applyJob(
      req.userId!,
      jobId,
      cvDocumentId ? Number(cvDocumentId) : null,
      coverNote ? sanitizeString(coverNote, 1000) : undefined
    );
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: "BAD_REQUEST", message: err.message }
    });
  }
});

// Recruiter / HRD Portal routes
router.get("/recruiter/overview", requireAccountRole("recruiter", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const overview = await JobService.getRecruiterOverview(req.userId!);
    return res.json({ success: true, data: overview });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
  }
});

router.post("/recruiter/company", requireAccountRole("recruiter", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const company = await JobService.upsertCompany(req.userId!, req.body);
    return res.json({ success: true, data: company });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
  }
});

router.post("/recruiter/jobs", requireAccountRole("recruiter", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const created = await JobService.createRecruiterJob(req.userId!, req.body);
    return res.json({ success: true, data: created });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
  }
});

router.put("/recruiter/jobs/:jobId", requireAccountRole("recruiter", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = await JobService.updateRecruiterJob(req.userId!, req.params.jobId, req.body);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    const status = err.message?.includes("Akses ditolak") ? 403 : 400;
    return res.status(status).json({ success: false, error: { code: status === 403 ? "FORBIDDEN" : "BAD_REQUEST", message: err.message } });
  }
});

router.get("/recruiter/applicants", requireAccountRole("recruiter", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const overview = await JobService.getRecruiterOverview(req.userId!);
    return res.json({ success: true, data: overview.applicants });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
  }
});

router.put("/recruiter/applications/:id", requireAccountRole("recruiter", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const appId = Number(req.params.id);
    if (!appId) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "ID lamaran tidak valid" } });
    const updated = await JobService.updateApplicationStatus(req.userId!, appId, req.body);
    return res.json({ success: true, data: updated });
  } catch (err: any) {
    const status = err.message?.includes("Akses ditolak") ? 403 : 400;
    return res.status(status).json({ success: false, error: { code: status === 403 ? "FORBIDDEN" : "BAD_REQUEST", message: err.message } });
  }
});

router.get("/recruiter/talent", requireAccountRole("recruiter", "admin"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const talents = await JobService.searchTalent(q);
    return res.json({ success: true, data: talents });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
  }
});

export default router;
