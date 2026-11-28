import http from "http";
import publicRoutes from "./src/server/routes/publicRoutes.js";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import dotenv from "dotenv";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };

import { apiLimiter } from "./src/server/middlewares/rateLimiters.js";
import { userContextMiddleware, requireAuth, requireRegistered } from "./src/server/middlewares/authMiddleware.js";
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
import upgradeRoutes from "./src/server/routes/upgradeRoutes.js";
import { UserRepository } from "./src/server/repositories/UserRepository.js";
import { NotificationRepository } from "./src/server/repositories/NotificationRepository.js";
import { UserService } from "./src/server/services/userService.js";
import { attachWsHub } from "./src/server/wsHub.js";
import { ensureSchema } from "./src/server/db/ensureSchema.js";
import { ensureSeeded } from "./src/server/db/seedData.js";
import { globalErrorHandler } from "./src/server/middlewares/errorHandler.js";
import { pool } from "./src/db/index.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
app.disable("x-powered-by");

const allowedOrigins = (process.env.CORS_ORIGINS || process.env.APP_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""))
  .filter(Boolean);

function isAllowedCorsOrigin(origin: string, reqHosts: string[]): boolean {
  const normalized = origin.trim().replace(/\/+$/, "");
  if (allowedOrigins.includes(normalized)) return true;

  try {
    const parsed = new URL(normalized);
    const parsedHost = parsed.host.toLowerCase();
    if (reqHosts.some((h) => h && h === parsedHost)) {
      return true;
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".run.app") ||
      host.endsWith(".googleusercontent.com") ||
      host.endsWith(".aistudio.google.com")
    ) {
      if (process.env.NODE_ENV !== "production" || host.endsWith(".run.app")) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}

// Same-origin Firebase Auth reverse proxy (prevents third-party cookie / storage partitioning failures in Google Sign-In)
const FIREBASE_AUTH_HOST = (firebaseConfig.authDomain || "").trim().toLowerCase();

app.get("/__/firebase/init.json", (req, res) => {
  const forwardedHost = String(req.headers["x-forwarded-host"] || req.headers.host || "")
    .split(",")[0]
    ?.trim();
  const useSameOriginDomain =
    Boolean(forwardedHost) &&
    (forwardedHost.endsWith(".run.app") || forwardedHost.endsWith(".ai.studio"));

  res.setHeader("Cache-Control", "no-store");
  res.json({
    apiKey: firebaseConfig.apiKey,
    authDomain: useSameOriginDomain ? forwardedHost : firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    messagingSenderId: firebaseConfig.messagingSenderId,
    appId: firebaseConfig.appId,
  });
});

app.use("/__/auth", async (req, res) => {
  try {
    if (!FIREBASE_AUTH_HOST) {
      return res.status(503).send("Firebase authDomain tidak dikonfigurasi.");
    }
    const rawUrl = req.originalUrl || "/__/auth/handler";
    if (!rawUrl.startsWith("/__/auth/") || rawUrl.includes("..") || rawUrl.includes("\\") || rawUrl.includes("@")) {
      return res.status(400).send("Invalid auth proxy path");
    }

    const targetUrl = new URL(rawUrl, `https://${FIREBASE_AUTH_HOST}`);
    if (targetUrl.hostname.toLowerCase() !== FIREBASE_AUTH_HOST) {
      return res.status(400).send("Invalid auth proxy target");
    }

    const forwardHeaders: Record<string, string> = {};
    const passThroughKeys = ["accept", "accept-language", "content-type", "cookie", "user-agent"];
    for (const key of passThroughKeys) {
      const val = req.headers[key];
      if (typeof val === "string" && val) {
        forwardHeaders[key] = val;
      }
    }

    let bodyBuffer: Buffer | undefined;
    if (req.method === "POST" || req.method === "PUT") {
      const chunks: Buffer[] = [];
      let totalBytes = 0;
      for await (const chunk of req) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        totalBytes += buf.length;
        if (totalBytes > 64 * 1024) {
          return res.status(413).send("Payload too large");
        }
        chunks.push(buf);
      }
      bodyBuffer = Buffer.concat(chunks);
    }

    const upstream = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: forwardHeaders,
      body: bodyBuffer ? new Uint8Array(bodyBuffer) : undefined,
      redirect: "manual",
    });

    res.status(upstream.status);
    const contentType = upstream.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);
    const location = upstream.headers.get("location");
    if (location) res.setHeader("Location", location);
    const cacheControl = upstream.headers.get("cache-control");
    if (cacheControl) res.setHeader("Cache-Control", cacheControl);

    const getSetCookie = (upstream.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
    const setCookies = typeof getSetCookie === "function" ? getSetCookie.call(upstream.headers) : [];
    if (setCookies.length > 0) {
      res.setHeader("Set-Cookie", setCookies);
    } else {
      const singleCookie = upstream.headers.get("set-cookie");
      if (singleCookie) res.setHeader("Set-Cookie", singleCookie);
    }

    const data = Buffer.from(await upstream.arrayBuffer());
    return res.send(data);
  } catch (err) {
    console.error("Firebase auth proxy error:", err);
    return res.status(502).send("Gagal menghubungi layanan autentikasi Firebase.");
  }
});

// Compression for faster API & asset responses
app.use(compression({ threshold: 1024 }));

// Security Middlewares (compatible with iframe previews and Google OAuth popups)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: false,
    originAgentCluster: false,
    xFrameOptions: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);
app.use((req, res, next) => {
  const forwardedHosts = String(req.headers["x-forwarded-host"] || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  const directHost = String(req.headers.host || "").trim().toLowerCase();
  const reqHosts = [...forwardedHosts, ...(directHost ? [directHost] : [])];
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (isAllowedCorsOrigin(origin, reqHosts)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })(req, res, next);
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ limit: "2mb", extended: true }));

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
apiRouter.use(upgradeRoutes);
apiRouter.use(publicRoutes);

// Notifications & Sync Endpoints
apiRouter.get("/notifications", requireAuth, async (req: any, res, next) => {
  try {
    const userRow = await UserRepository.getOrCreateUser(
      req.userId,
      req.userEmail || "guest@skillora.app",
      req.userName || "Tamu Skillora"
    );
    const list = await NotificationRepository.getNotifications(userRow.id);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
});

apiRouter.post("/notifications/clear", requireRegistered, async (req: any, res, next) => {
  try {
    const userRow = await UserRepository.getOrCreateUser(
      req.userId,
      req.userEmail || "guest@skillora.app",
      req.userName || "Tamu Skillora"
    );
    await NotificationRepository.clearNotifications(userRow.id);
    res.json({ success: true, data: { notifications: [] } });
  } catch (err) {
    next(err);
  }
});

apiRouter.post("/sync", requireRegistered, async (req: any, res, next) => {
  try {
    if (req.body && req.body.profile) {
      await UserService.syncUser(req.userId, req.body.profile);
    }
    const profile = await UserRepository.getFullProfile(req.userId);
    res.json({ success: true, data: { profile } });
  } catch (err) {
    next(err);
  }
});

// Health & Readiness Endpoint
apiRouter.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({
      success: true,
      data: {
        status: "ok",
        database: "connected",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    return res.status(503).json({
      success: false,
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Database tidak dapat dijangkau.",
      },
    });
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

apiRouter.use(globalErrorHandler);

// Apply rate limiting and mount API Router to both /api/v1 and /api
app.use("/api/v1", apiLimiter, apiRouter);
app.use("/api", apiLimiter, apiRouter);

const PORT = 3000;

async function startServer() {
  // Ensure missing columns/tables exist before seeding and serving requests
  await ensureSchema();
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
    app.use(
      "/assets",
      express.static(path.join(distPath, "assets"), {
        maxAge: "1y",
        immutable: true,
      })
    );
    app.use(
      express.static(distPath, {
        maxAge: "1h",
        setHeaders: (res, filePath) => {
          if (filePath.endsWith(".html")) {
            res.setHeader("Cache-Control", "no-cache");
          }
        },
      })
    );
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Skillora Platform Backend & WebSocket Server running on http://0.0.0.0:${PORT}`);
  });

  const shutdown = (signal: string) => {
    console.log(`\n${signal} received. Shutting down Skillora gracefully...`);
    httpServer.close(async () => {
      try {
        await pool.end();
      } catch {
        // ignore pool close errors on shutdown
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

if (!process.env.VITEST) {
  startServer();
}
export { app };
