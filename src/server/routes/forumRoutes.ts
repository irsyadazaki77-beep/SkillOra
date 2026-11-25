import { Router, Response } from "express";
import { AuthenticatedRequest, requireAuth, requireRegistered } from "../middlewares/authMiddleware.js";
import { ForumService } from "../services/forumService.js";
import { sanitizeString } from "../middlewares/validateInput.js";

const router = Router();

router.get("/forum", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const posts = await ForumService.getForumPosts();
    return res.json({ success: true, data: posts });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
  }
});

router.post("/forum", requireRegistered, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const title = sanitizeString(req.body.title, 200);
    const content = sanitizeString(req.body.content, 2000);
    const { tags } = req.body;
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Judul dan Konten wajib diisi" }
      });
    }

    const posts = await ForumService.createPost(req.userId!, title, content, tags);
    return res.json({ success: true, data: posts });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: err.message }
    });
  }
});

router.post("/forum/:id/reply", requireRegistered, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const content = sanitizeString(req.body.content, 1500);
    if (!content) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Isi balasan wajib diisi" } });
    }
    const posts = await ForumService.replyPost(req.userId!, req.params.id, content);
    return res.json({ success: true, data: posts });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
  }
});

router.post("/forum/:id/upvote", requireRegistered, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const posts = await ForumService.upvotePost(req.userId!, req.params.id);
    return res.json({ success: true, data: posts });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: err.message }
    });
  }
});

router.get("/collaboration/rooms", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rooms = await ForumService.getCollaborationRooms();
    return res.json({ success: true, data: rooms });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message } });
  }
});

router.post("/collaboration/rooms", requireRegistered, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const title = sanitizeString(req.body.title, 150);
    if (!title) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Nama tim wajib diisi" } });
    }
    const rooms = await ForumService.createCollaborationRoom(req.userId!, { title, courseId: req.body.courseId });
    return res.json({ success: true, data: rooms });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: err.message } });
  }
});

router.post("/collaboration/chat", requireRegistered, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId, text } = req.body;
    const cleanText = sanitizeString(text, 1000);
    if (!cleanText) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Pesan tidak boleh kosong" } });
    }
    const chat = await ForumService.postChat(req.userId!, roomId, cleanText);
    return res.json({ success: true, data: { messages: chat } });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: "BAD_REQUEST", message: err.message }
    });
  }
});

router.post("/collaboration/tasks", requireRegistered, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId, title, assignee, priority } = req.body;
    const cleanTitle = sanitizeString(title, 200);
    if (!roomId || !cleanTitle) {
      return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "roomId dan judul tugas wajib diisi" } });
    }
    const tasks = await ForumService.createTask(req.userId!, roomId, { title: cleanTitle, assignee, priority });
    return res.json({ success: true, data: { tasks } });
  } catch (err: any) {
    const status = err.message?.includes("Akses ditolak") ? 403 : 400;
    return res.status(status).json({ success: false, error: { code: status === 403 ? "FORBIDDEN" : "BAD_REQUEST", message: err.message } });
  }
});

router.post("/collaboration/task-status", requireRegistered, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId, taskId, status } = req.body;
    const tasks = await ForumService.updateTaskStatus(req.userId!, roomId, taskId, status);
    return res.json({ success: true, data: { tasks } });
  } catch (err: any) {
    const status = err.message?.includes("Akses ditolak") ? 403 : 400;
    return res.status(status).json({
      success: false,
      error: { code: status === 403 ? "FORBIDDEN" : "BAD_REQUEST", message: err.message }
    });
  }
});

router.post("/collaboration/submit-project", requireRegistered, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roomId, projectUrl } = req.body;
    const cleanUrl = sanitizeString(projectUrl, 500);
    const room = await ForumService.submitProject(req.userId!, roomId, cleanUrl);
    return res.json({ success: true, data: room });
  } catch (err: any) {
    const status = err.message?.includes("Akses ditolak") ? 403 : 400;
    return res.status(status).json({
      success: false,
      error: { code: status === 403 ? "FORBIDDEN" : "BAD_REQUEST", message: err.message }
    });
  }
});

export default router;
