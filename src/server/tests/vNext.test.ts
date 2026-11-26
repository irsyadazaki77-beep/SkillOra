import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import request from "supertest";
import express from "express";
import courseRoutes from "../routes/courseRoutes.js";
import jobRoutes from "../routes/jobRoutes.js";
import { userContextMiddleware } from "../middlewares/authMiddleware.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { CourseRepository } from "../repositories/CourseRepository.js";
import { CareerRepository } from "../repositories/CareerRepository.js";
import { UserService } from "../services/userService.js";
import { adminAuth } from "../../lib/firebase-admin.js";
import { db } from "../../db/index.js";
import { buildFrontendPreviewHtml, runSqlSandboxPreview } from "../../utils/sandboxRunner.js";

vi.mock("../../lib/firebase-admin.js", () => ({
  adminAuth: {
    verifyIdToken: vi.fn(),
  },
}));

vi.mock("../../db/index.js", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    transaction: vi.fn(),
  },
}));

vi.mock("../repositories/UserRepository.js", () => ({
  UserRepository: {
    getOrCreateUser: vi.fn(),
    getFullProfile: vi.fn(),
    updateUserRow: vi.fn(),
  },
}));

vi.mock("../repositories/CourseRepository.js", () => ({
  CourseRepository: {
    getCourses: vi.fn(),
    getCourseByCourseId: vi.fn(),
    enrollCourse: vi.fn(),
    addLesson: vi.fn(),
    updateLesson: vi.fn(),
    deleteLesson: vi.fn(),
    getLmsAnalytics: vi.fn(),
    getLearningPaths: vi.fn(),
    enrollLearningPath: vi.fn(),
    claimLearningPathCertificate: vi.fn(),
  },
}));

vi.mock("../repositories/CareerRepository.js", () => ({
  CareerRepository: {
    searchVerifiedTalents: vi.fn(),
    inviteTalent: vi.fn(),
  },
}));

vi.mock("../repositories/NotificationRepository.js", () => ({
  NotificationRepository: {
    addNotification: vi.fn(),
  },
}));

describe("SkillOra vNext 5-Pillar Tests", () => {
  const testApp = express();
  testApp.use(express.json());
  testApp.use("/api/v1", userContextMiddleware, courseRoutes);
  testApp.use("/api/v1", userContextMiddleware, jobRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValue({
      id: 1,
      uid: "user-dev-default",
      role: "Guest",
      accountRole: "student",
    } as any);
  });

  // Pilar 1: SQL Engine & Frontend Live Preview
  it("Pilar 1: evaluates SELECT/WHERE/GROUP BY/ORDER BY/LIMIT and blocks DDL/DML queries", () => {
    const filtered = runSqlSandboxPreview(
      "SELECT merchant_id, city, revenue_idr FROM merchants WHERE city = 'Jakarta' ORDER BY revenue_idr DESC LIMIT 1"
    );
    expect(filtered.valid).toBe(true);
    expect(filtered.rows).toHaveLength(1);
    expect(filtered.rows[0].merchant_id).toBe("M-105");

    const aggregated = runSqlSandboxPreview(
      "SELECT category, COUNT(*) AS total_merchant, SUM(orders_30d) AS sum_orders FROM merchants GROUP BY category ORDER BY sum_orders DESC"
    );
    expect(aggregated.valid).toBe(true);
    expect(aggregated.columns).toEqual(["category", "total_merchant", "sum_orders"]);
    expect(aggregated.rows[0].category).toBe("Kuliner");
    expect(aggregated.rows[0].total_merchant).toBe(3);

    const blocked = runSqlSandboxPreview("DROP TABLE merchants");
    expect(blocked.valid).toBe(false);

    const htmlDoc = buildFrontendPreviewHtml("<h1>Hello SkillOra</h1>");
    expect(htmlDoc).toContain("<!doctype html>");
    expect(htmlDoc).toContain("<h1>Hello SkillOra</h1>");
  });

  // Pilar 2: Specialization Certificate Claim
  it("Pilar 2: blocks guest claim, allows registered learner to claim specialization certificate, and rejects incomplete paths", async () => {
    const guestRes = await request(testApp)
      .post("/api/v1/learning-paths/path-software-cloud/claim-certificate")
      .set("Authorization", "Bearer guest-demo-token");
    expect(guestRes.status).toBe(403);

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "uid-grad-10",
      email: "grad@skillora.id",
      name: "Siti Aminah",
    } as any);
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValue({
      id: 10,
      uid: "uid-grad-10",
      role: "Learner",
      accountRole: "student",
    } as any);
    vi.mocked(UserRepository.getFullProfile).mockResolvedValue({
      id: 10,
      uid: "uid-grad-10",
      name: "Siti Aminah",
      accountRole: "student",
    } as any);

    vi.mocked(CourseRepository.claimLearningPathCertificate).mockResolvedValue({
      alreadyIssued: false,
      certificateId: "SPEC-PATH-SOFTWARE-CLOUD-10",
      verificationCode: "SPEC-PATH-SOFTWARE-CLOUD-10",
      title: "Spesialisasi: Software & Cloud Architecture",
    });

    const okRes = await request(testApp)
      .post("/api/v1/learning-paths/path-software-cloud/claim-certificate")
      .set("Authorization", "Bearer valid-grad-token");
    expect(okRes.status).toBe(200);
    expect(okRes.body.success).toBe(true);
    expect(okRes.body.data.certificateId).toBe("SPEC-PATH-SOFTWARE-CLOUD-10");

    vi.mocked(CourseRepository.claimLearningPathCertificate).mockRejectedValue(
      new Error("Selesaikan 100% kursus pada learning path sebelum mengklaim sertifikat spesialisasi.")
    );
    const incompleteRes = await request(testApp)
      .post("/api/v1/learning-paths/path-software-cloud/claim-certificate")
      .set("Authorization", "Bearer valid-grad-token");
    expect(incompleteRes.status).toBe(400);
  });

  // Pilar 3: Mentor Studio Lesson CRUD & Analytics
  it("Pilar 3: blocks non-mentor roles and authorizes mentor to edit/delete lessons and view LMS analytics", async () => {
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "uid-student-5",
      email: "s5@skillora.id",
    } as any);
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValue({
      id: 5,
      uid: "uid-student-5",
      role: "Learner",
      accountRole: "student",
    } as any);

    const forbiddenAnalytics = await request(testApp)
      .get("/api/v1/lms/analytics")
      .set("Authorization", "Bearer student-token");
    expect(forbiddenAnalytics.status).toBe(403);

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "uid-mentor-88",
      email: "mentor@skillora.id",
    } as any);
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValue({
      id: 88,
      uid: "uid-mentor-88",
      role: "Mentor",
      accountRole: "mentor",
    } as any);
    vi.mocked(UserRepository.getFullProfile).mockResolvedValue({
      id: 88,
      uid: "uid-mentor-88",
      role: "Mentor",
      accountRole: "mentor",
    } as any);
    vi.mocked(CourseRepository.getCourseByCourseId).mockResolvedValue({
      id: "course-1",
      dbId: 1,
      title: "Backend Node.js",
      mentorId: 88,
      lessons: [],
    } as any);

    vi.mocked(CourseRepository.updateLesson).mockResolvedValue({
      id: "course-1",
      dbId: 1,
      title: "Backend Node.js",
      lessons: [{ id: "lesson-101", title: "Modul Terupdate", duration: "15 Menit", type: "reading", content: "Isi baru" }],
    } as any);
    const updateRes = await request(testApp)
      .put("/api/v1/courses/course-1/lessons/lesson-101")
      .set("Authorization", "Bearer mentor-token")
      .send({ title: "Modul Terupdate", duration: "15 Menit", type: "reading", content: "Isi baru" });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.lessons[0].title).toBe("Modul Terupdate");

    vi.mocked(CourseRepository.deleteLesson).mockResolvedValue({
      id: "course-1",
      dbId: 1,
      title: "Backend Node.js",
      lessons: [],
    } as any);
    const deleteRes = await request(testApp)
      .delete("/api/v1/courses/course-1/lessons/lesson-101")
      .set("Authorization", "Bearer mentor-token");
    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.data.lessons).toHaveLength(0);

    vi.mocked(CourseRepository.getLmsAnalytics).mockResolvedValue([
      {
        courseId: "course-1",
        title: "Backend Node.js",
        lessonsCount: 4,
        enrollmentsCount: 12,
        completionsCount: 9,
        quizAttemptsCount: 8,
        avgQuizScore: 84,
      },
    ]);
    const analyticsRes = await request(testApp)
      .get("/api/v1/lms/analytics")
      .set("Authorization", "Bearer mentor-token");
    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.data[0].enrollmentsCount).toBe(12);
  });

  // Pilar 4: HRD Talent Invitation
  it("Pilar 4: blocks students from sending HRD invites and allows recruiter to invite verified talent", async () => {
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "uid-student-5",
      email: "s5@skillora.id",
    } as any);
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValue({
      id: 5,
      uid: "uid-student-5",
      role: "Learner",
      accountRole: "student",
    } as any);

    const blockedRes = await request(testApp)
      .post("/api/v1/recruiter/invite-talent")
      .set("Authorization", "Bearer student-token")
      .send({ candidateId: 12, jobTitle: "Frontend Dev", message: "Mari wawancara" });
    expect(blockedRes.status).toBe(403);

    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "uid-hrd-77",
      email: "hr@techindo.id",
    } as any);
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValue({
      id: 77,
      uid: "uid-hrd-77",
      role: "HRD",
      accountRole: "recruiter",
    } as any);
    vi.mocked(UserRepository.getFullProfile).mockResolvedValue({
      id: 77,
      uid: "uid-hrd-77",
      name: "HRD TechIndo",
      accountRole: "recruiter",
    } as any);
    vi.mocked(CareerRepository.inviteTalent).mockResolvedValue({
      invitationId: 501,
      candidateName: "Rama Wijaya",
      companyName: "TechIndo",
      jobTitle: "Backend Engineer",
      status: "sent",
    });

    const inviteRes = await request(testApp)
      .post("/api/v1/recruiter/invite-talent")
      .set("Authorization", "Bearer hrd-token")
      .send({
        candidateId: 12,
        companyName: "TechIndo",
        jobTitle: "Backend Engineer",
        message: "Kami tertarik dengan portofolio backend Anda.",
      });
    expect(inviteRes.status).toBe(200);
    expect(inviteRes.body.data.status).toBe("sent");
    expect(inviteRes.body.data.invitationId).toBe(501);
  });

  // Pilar 5: Free Weekly Target & 7-day Streak Saver Reward
  it("Pilar 5: clamps weeklyTargetDays cleanly and grants free Streak Saver every 7 consecutive days", async () => {
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValue({
      id: 9,
      uid: "uid-learner-9",
      role: "Pelajar Siap Kerja",
      accountRole: "student",
    } as any);
    vi.mocked(UserRepository.getFullProfile).mockResolvedValue({
      id: 9,
      uid: "uid-learner-9",
      weeklyTargetDays: 7,
      streak: 7,
      streakFreezes: 1,
    } as any);

    await UserService.updateSettings("uid-learner-9", { weeklyTargetDays: 99 });
    expect(UserRepository.updateUserRow).toHaveBeenCalledWith(
      9,
      expect.objectContaining({ weeklyTargetDays: 7 })
    );

    const setMock = vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
    const insertValuesMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(db.transaction).mockImplementation(async (callback: any) => {
      const tx = {
        select: () => ({
          from: () => ({
            where: () => ({
              for: async () => [
                {
                  id: 9,
                  uid: "uid-learner-9",
                  dailyClaimedLast: "2026-11-25",
                  xp: 300,
                  gems: 50,
                  level: 1,
                  streak: 6,
                  streakFreezes: 0,
                },
              ],
            }),
          }),
        }),
        update: () => ({ set: setMock }),
        insert: () => ({ values: insertValuesMock }),
      };
      return callback(tx);
    });

    const claimResult = await UserService.claimDaily("uid-learner-9");
    expect(claimResult.profile.streakFreezes).toBe(1);
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({
        streak: 7,
        streakFreezes: 1,
      })
    );
  });

  it("Schema Integrity: ensureSchema.ts guarantees CREATE TABLE IF NOT EXISTS for every pgTable in schema.ts", () => {
    const schemaSrc = fs.readFileSync(path.resolve(process.cwd(), "src/db/schema.ts"), "utf8");
    const ensureSrc = fs.readFileSync(path.resolve(process.cwd(), "src/server/db/ensureSchema.ts"), "utf8");

    const schemaTables = [...schemaSrc.matchAll(/pgTable\(\s*['"]([a-z0-9_]+)['"]/g)].map((m) => m[1]);
    expect(schemaTables.length).toBeGreaterThanOrEqual(48);

    const missingTables = schemaTables.filter(
      (tbl) => !new RegExp(`CREATE TABLE IF NOT EXISTS\\s+"${tbl}"`).test(ensureSrc)
    );
    expect(missingTables).toEqual([]);
  });
});
