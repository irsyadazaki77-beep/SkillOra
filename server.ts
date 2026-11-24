import http from "http";
import publicRoutes from "./src/server/routes/publicRoutes.js";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";

import { apiLimiter } from "./src/server/middlewares/rateLimiters.js";
import { userContextMiddleware, requireAuth } from "./src/server/middlewares/authMiddleware.js";
import userRoutes from "./src/server/routes/userRoutes.js";
import courseRoutes from "./src/server/routes/courseRoutes.js";
import quizRoutes from "./src/server/routes/quizRoutes.js";
import aiRoutes from "./src/server/routes/aiRoutes.js";
import jobRoutes from "./src/server/routes/jobRoutes.js";
import forumRoutes from "./src/server/routes/forumRoutes.js";
import mentorRoutes from "./src/server/routes/mentorRoutes.js";
import communityRoutes from "./src/server/routes/communityRoutes.js";
import billingRoutes from "./src/server/routes/billingRoutes.js";
import devRoutes from "./src/server/routes/devRoutes.js";
import { UserRepository } from "./src/server/repositories/UserRepository.js";
import { NotificationRepository } from "./src/server/repositories/NotificationRepository.js";
import { UserService } from "./src/server/services/userService.js";
import { attachWsHub } from "./src/server/wsHub.js";
import { ensureSeeded } from "./src/server/db/seedData.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    xFrameOptions: false,
  })
);
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? false : "*",
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// API Router Setup
const apiRouter = express.Router();

// User Identity & Session Middleware
apiRouter.use(userContextMiddleware);

// API Route Modules
apiRouter.use(userRoutes);
apiRouter.use(courseRoutes);
apiRouter.use(quizRoutes);
apiRouter.use(aiRoutes);
apiRouter.use(jobRoutes);
apiRouter.use(forumRoutes);
apiRouter.use(mentorRoutes);
apiRouter.use(communityRoutes);
apiRouter.use(billingRoutes);
apiRouter.use(devRoutes);
apiRouter.use(publicRoutes);

// Notifications & Sync Endpoints
apiRouter.get("/notifications", requireAuth, async (req: any, res) => {
  try {
    const userRow = await UserRepository.getOrCreateUser(
      req.userId,
      req.userEmail || "guest@skillora.app",
      req.userName || "Tamu Skillora"
    );
    const list = await NotificationRepository.getNotifications(userRow.id);
    res.json({ success: true, data: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

apiRouter.post("/notifications/clear", requireAuth, async (req: any, res) => {
  try {
    const userRow = await UserRepository.getOrCreateUser(
      req.userId,
      req.userEmail || "guest@skillora.app",
      req.userName || "Tamu Skillora"
    );
    await NotificationRepository.clearNotifications(userRow.id);
    res.json({ success: true, data: { notifications: [] } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

apiRouter.post("/sync", requireAuth, async (req: any, res) => {
  try {
    if (req.body && req.body.profile) {
      await UserService.syncUser(req.userId, req.body.profile);
    }
    const profile = await UserRepository.getFullProfile(req.userId);
    res.json({ success: true, data: { profile } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// Explicit 404 handler for unhandled API endpoints
apiRouter.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `API endpoint ${req.method} ${req.originalUrl || req.baseUrl + req.path} tidak ditemukan`,
    },
  });
});

// Apply rate limiting and mount API Router to both /api/v1 and /api
app.use("/api/v1", apiLimiter, apiRouter);
app.use("/api", apiLimiter, apiRouter);

const PORT = 3000;

async function startServer() {
  // Ensure baseline catalog data is seeded idempotently into PostgreSQL
  ensureSeeded().catch((err) => console.warn("Initial seed warning:", err));

  const httpServer = http.createServer(app);
  attachWsHub(httpServer);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Skillora Platform Backend & WebSocket Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VITEST) {
  startServer();
}
export { app };
