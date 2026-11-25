import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import upgradeRoutes from "../routes/upgradeRoutes.js";
import { userContextMiddleware } from "../middlewares/authMiddleware.js";
import { UserRepository } from "../repositories/UserRepository.js";

vi.mock("../../lib/firebase-admin.js", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
}));

vi.mock("../repositories/UserRepository.js", () => ({
  UserRepository: {
    getOrCreateUser: vi.fn(),
    getFullProfile: vi.fn(),
    updateUserRow: vi.fn(),
  },
}));

describe("Upgrade Routes Security Guard Tests", () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use("/api/v1", userContextMiddleware, upgradeRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValue({
      id: 1,
      uid: "user-dev-default",
      role: "Guest",
      accountRole: "student",
    } as any);
  });

  const guestProtectedEndpoints: Array<{ method: "post" | "put" | "delete"; path: string; body?: any }> = [
    { method: "post", path: "/api/v1/labs/evaluate", body: { challengeId: "lab-1", codeOrAnswer: "const a = 1;" } },
    { method: "post", path: "/api/v1/notes", body: { courseId: "c1", lessonId: "l1", content: "catatan" } },
    { method: "delete", path: "/api/v1/notes?courseId=c1&lessonId=l1" },
    { method: "post", path: "/api/v1/roadmap/generate", body: { targetRole: "Frontend" } },
    { method: "post", path: "/api/v1/ai/copilot", body: { message: "halo" } },
    { method: "post", path: "/api/v1/arena/tryouts/submit", body: { tryoutId: "to-1", answers: {} } },
    { method: "put", path: "/api/v1/portfolio/settings", body: { portfolioSlug: "hack" } },
    { method: "post", path: "/api/v1/training/simulations/record", body: { simType: "tkd", title: "TKD", score: 100 } },
    { method: "post", path: "/api/v1/training/simulations/star-evaluate", body: { question: "Q", answer: "A".repeat(50) } },
  ];

  for (const ep of guestProtectedEndpoints) {
    it(`blocks guest-demo-token with 403 on ${ep.method.toUpperCase()} ${ep.path}`, async () => {
      const req = request(testApp)[ep.method](ep.path).set("Authorization", "Bearer guest-demo-token");
      const res = ep.body ? await req.send(ep.body) : await req;
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error?.code).toBe("FORBIDDEN");
    });
  }
});
