import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import forumRoutes from "../routes/forumRoutes.js";
import userRoutes from "../routes/userRoutes.js";
import aiRoutes from "../routes/aiRoutes.js";
import { userContextMiddleware } from "../middlewares/authMiddleware.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { CourseRepository } from "../repositories/CourseRepository.js";
import { CourseService } from "../services/courseService.js";
import { escapeHtml } from "../../utils/htmlUtils.js";
import { assertSafeHttpUrl, assertOptionalSafeHttpUrl, toSafeExternalUrl } from "../../utils/urlUtils.js";
import { buildFrontendPreviewHtml } from "../../utils/sandboxRunner.js";
import { adminAuth } from "../../lib/firebase-admin.js";

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

vi.mock("../repositories/CourseRepository.js", () => ({
  CourseRepository: {
    getCourseByCourseId: vi.fn(),
    updateCourse: vi.fn(),
  },
}));

describe("Audit Fixes Regression Tests", () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use("/api/v1", userContextMiddleware, forumRoutes, userRoutes, aiRoutes);

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

  it("blocks guest-demo-token on POST /api/v1/user/onboarding with 403 FORBIDDEN", async () => {
    const res = await request(testApp)
      .post("/api/v1/user/onboarding")
      .set("Authorization", "Bearer guest-demo-token")
      .send({ accountRole: "mentor", name: "Hijacker" });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("FORBIDDEN");
  });

  it("rejects javascript: and data: URLs in URL helpers and project submission endpoint", async () => {
    expect(() => assertSafeHttpUrl("javascript:alert(1)", "URL Proyek")).toThrow(/http:\/\/ atau https:\/\//);
    expect(() => assertSafeHttpUrl("data:text/html,<script>alert(1)</script>", "URL Proyek")).toThrow(/http:\/\/ atau https:\/\//);
    expect(() => assertOptionalSafeHttpUrl("vbscript:msgbox(1)", "Website")).toThrow(/http:\/\/ atau https:\/\//);
    expect(toSafeExternalUrl("javascript:alert(1)")).toBeUndefined();
    expect(toSafeExternalUrl("https://github.com/skillora/demo")).toBe("https://github.com/skillora/demo");
    expect(toSafeExternalUrl("/verify/cert-123")).toBe("/verify/cert-123");
    expect(toSafeExternalUrl("//evil.example.com")).toBeUndefined();

    vi.mocked(adminAuth!.verifyIdToken).mockResolvedValueOnce({
      uid: "registered-student-1",
      email: "student@skillora.app",
      name: "Siswa Terdaftar",
    } as any);
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValueOnce({
      id: 99,
      uid: "registered-student-1",
      role: "Pelajar Siap Kerja",
      accountRole: "student",
    } as any);

    const res = await request(testApp)
      .post("/api/v1/projects/submit")
      .set("Authorization", "Bearer valid-student-token")
      .send({
        courseId: "react-tokopedia",
        projectUrl: "javascript:alert(document.cookie)",
        studentCodeNotes: "Test payload",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.message).toMatch(/http:\/\/ atau https:\/\//);
  });

  it("blocks non-admin mentor from modifying platform-seeded courses (authorUserId = null)", async () => {
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValueOnce({
      id: 42,
      uid: "mentor-42",
      role: "Mentor Industri",
      accountRole: "mentor",
    } as any);
    vi.mocked(CourseRepository.getCourseByCourseId).mockResolvedValueOnce({
      id: 10,
      courseId: "react-tokopedia",
      title: "React Enterprise",
      authorUserId: null,
    } as any);

    await expect(
      CourseService.updateCourse("mentor-42", "react-tokopedia", { title: "Defaced Course" })
    ).rejects.toThrow("Akses ditolak");
    expect(CourseRepository.updateCourse).not.toHaveBeenCalled();
  });

  it("escapes closing script tags inside buildFrontendPreviewHtml", () => {
    const html = buildFrontendPreviewHtml(`function test() { return "</script><img src=x onerror=alert(1)>"; }`);
    expect(html).not.toContain(`return "</script><img`);
    expect(html).toContain(`return "<\\/script><img`);
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
