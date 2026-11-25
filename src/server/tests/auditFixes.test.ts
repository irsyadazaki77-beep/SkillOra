import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import forumRoutes from "../routes/forumRoutes.js";
import { userContextMiddleware } from "../middlewares/authMiddleware.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { escapeHtml } from "../../utils/htmlUtils.js";

vi.mock("../../lib/firebase-admin.js", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
}));

vi.mock("../repositories/UserRepository.js", () => ({
  UserRepository: {
    getOrCreateUser: vi.fn(),
    getFullProfile: vi.fn(),
  },
}));

describe("Audit Fixes Regression Tests", () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use("/api/v1", userContextMiddleware, forumRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValue({
      id: 1,
      uid: "user-dev-default",
      role: "Guest",
      accountRole: "student",
    } as any);
  });

  it("blocks guest-demo-token on POST /api/v1/forum/:id/upvote with 403 FORBIDDEN", async () => {
    const res = await request(testApp)
      .post("/api/v1/forum/post-1/upvote")
      .set("Authorization", "Bearer guest-demo-token");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("FORBIDDEN");
  });

  it("escapes HTML special characters in exported certificates to prevent XSS", () => {
    const payload = `<script>alert("xss")</script> & 'Partner'`;
    const escaped = escapeHtml(payload);
    expect(escaped).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#39;Partner&#39;"
    );
    expect(escaped).not.toContain("<script>");
  });
});
