import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { BILLING_CATALOG } from "../services/billingService.js";
import { PeerReviewService } from "../services/peerReviewService.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { CourseRepository } from "../repositories/CourseRepository.js";
import courseRoutes from "../routes/courseRoutes.js";
import { userContextMiddleware } from "../middlewares/authMiddleware.js";
import { adminAuth } from "../../lib/firebase-admin.js";
import { runJsInWorker, runSqlSandboxPreview } from "../../utils/sandboxRunner.js";
import { db } from "../../db/index.js";

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
    getCourses: vi.fn(),
    getCourseByCourseId: vi.fn(),
    enrollCourse: vi.fn(),
    addLesson: vi.fn(),
    getLearningPaths: vi.fn(),
    enrollLearningPath: vi.fn(),
  },
}));

vi.mock("../repositories/NotificationRepository.js", () => ({
  NotificationRepository: {
    addNotification: vi.fn(),
  },
}));

vi.mock("../../db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

describe("Phase 1-4 Free Education Mission, Learning Paths, Sandbox & Peer Review Tests", () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use("/api/v1", userContextMiddleware, courseRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValue({
      id: 1,
      uid: "user-dev-default",
      role: "Guest",
      accountRole: "student",
      xp: 100,
      weeklyXp: 100,
    } as any);
  });

  it("Phase 1: BILLING_CATALOG contains zero student paywalls (no cert_voucher or student pro gating)", () => {
    const blockedStudentPaywalls = BILLING_CATALOG.filter(
      (item) => item.type === "cert_voucher" || item.type === "pro_monthly" || item.type === "pro_yearly"
    );
    expect(blockedStudentPaywalls).toHaveLength(0);
    expect(BILLING_CATALOG.some((item) => item.type === "sponsor_scholarship")).toBe(true);
    expect(BILLING_CATALOG.some((item) => item.type === "hrd_partner")).toBe(true);
  });

  it("Phase 2: blocks guest-demo-token from enrolling in a Learning Path and allows registered user", async () => {
    const guestRes = await request(testApp)
      .post("/api/v1/learning-paths/path-software-cloud/enroll")
      .set("Authorization", "Bearer guest-demo-token");
    expect(guestRes.status).toBe(403);

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "uid-learner-99",
      email: "sari@example.com",
      name: "Sari",
    } as any);
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValue({
      id: 99,
      uid: "uid-learner-99",
      role: "Student",
      accountRole: "student",
    } as any);
    vi.mocked(UserRepository.getFullProfile).mockResolvedValue({
      id: 99,
      uid: "uid-learner-99",
      accountRole: "student",
    } as any);
    vi.mocked(CourseRepository.enrollLearningPath).mockResolvedValue({
      slug: "path-software-cloud",
      title: "Jalur Software & Cloud Engineer",
      enrolledCourses: 4,
    });

    const authRes = await request(testApp)
      .post("/api/v1/learning-paths/path-software-cloud/enroll")
      .set("Authorization", "Bearer valid-token");

    expect(authRes.status).toBe(200);
    expect(authRes.body.data.enrolledCourses).toBe(4);
    expect(CourseRepository.enrollLearningPath).toHaveBeenCalledWith(99, "path-software-cloud");
  });

  it("Phase 3: sandboxRunner executes JS tests safely and guards SQL preview against DML/DDL", async () => {
    const jsResult = await runJsInWorker("function sum(a, b) { return a + b; }", [
      { label: "Adds two numbers", expression: "sum(2, 3)", expected: 5 },
    ]);
    expect(jsResult.timedOut).toBe(false);
    expect(jsResult.results[0].passed).toBe(true);

    const badJs = await runJsInWorker("function broken( {", [
      { label: "Syntax fail", expression: "broken()", expected: true },
    ]);
    expect(badJs.results[0].passed).toBe(false);
    expect(badJs.results[0].details).toContain("Syntax Error");

    const okSql = runSqlSandboxPreview("SELECT merchant_id, city FROM merchants;");
    expect(okSql.valid).toBe(true);
    expect(okSql.rows.length).toBeGreaterThan(0);

    const dropSql = runSqlSandboxPreview("DROP TABLE users;");
    expect(dropSql.valid).toBe(false);
  });

  it("Phase 3: PeerReviewService rejects short feedback and prevents self-review", async () => {
    await expect(
      PeerReviewService.submitReview("uid-1", {
        submissionId: 10,
        score: 90,
        feedback: "Bagus",
      })
    ).rejects.toThrow("minimal 25 karakter");

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ id: 10, userId: 1, courseId: "react-tokopedia" }]),
      }),
    } as any);

    await expect(
      PeerReviewService.submitReview("uid-1", {
        submissionId: 10,
        score: 90,
        feedback: "Arsitektur komponennya rapi sekali dan README mudah dipahami.",
      })
    ).rejects.toThrow("tidak dapat mereview proyek milik Anda sendiri");
  });
});
