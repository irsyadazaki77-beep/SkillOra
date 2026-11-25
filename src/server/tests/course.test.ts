import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import courseRoutes from "../routes/courseRoutes.js";
import { userContextMiddleware } from "../middlewares/authMiddleware.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { CourseRepository } from "../repositories/CourseRepository.js";
import { NotificationRepository } from "../repositories/NotificationRepository.js";
import { adminAuth } from "../../lib/firebase-admin.js";
import { parseVideoUrl } from "../../utils/videoUtils.js";

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
  },
}));

vi.mock("../repositories/NotificationRepository.js", () => ({
  NotificationRepository: {
    addNotification: vi.fn(),
  },
}));

describe("Free Course Enrollment & Video Parsing Tests", () => {
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
    } as any);
  });

  it("blocks guest-demo-token from enrolling with 403 FORBIDDEN", async () => {
    const res = await request(testApp)
      .post("/api/v1/courses/course_demo_1/enroll")
      .set("Authorization", "Bearer guest-demo-token");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error?.code).toBe("FORBIDDEN");
  });

  it("allows registered user to enroll in a course for free", async () => {
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValue({
      uid: "uid-student-42",
      email: "siswa@example.com",
      name: "Budi",
    } as any);
    vi.mocked(UserRepository.getOrCreateUser).mockResolvedValue({
      id: 42,
      uid: "uid-student-42",
      role: "Student",
      accountRole: "student",
    } as any);
    vi.mocked(UserRepository.getFullProfile).mockResolvedValue({
      id: 42,
      uid: "uid-student-42",
      accountRole: "student",
    } as any);
    vi.mocked(CourseRepository.enrollCourse).mockResolvedValue({
      enrolled: true,
      alreadyEnrolled: false,
      enrolledCount: 15,
      courseTitle: "Full-Stack Web Gratis",
    });

    const res = await request(testApp)
      .post("/api/v1/courses/course_demo_1/enroll")
      .set("Authorization", "Bearer valid-firebase-token");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      enrolled: true,
      alreadyEnrolled: false,
      enrolledCount: 15,
    });
    expect(CourseRepository.enrollCourse).toHaveBeenCalledWith(42, "course_demo_1");
    expect(NotificationRepository.addNotification).toHaveBeenCalledTimes(1);
  });

  it("parses YouTube, Vimeo, and MP4 URLs safely while blocking javascript: URLs", () => {
    expect(parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      kind: "youtube",
      embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0",
      originalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    expect(parseVideoUrl("https://youtu.be/abc123XYZ")).toEqual({
      kind: "youtube",
      embedUrl: "https://www.youtube-nocookie.com/embed/abc123XYZ?rel=0",
      originalUrl: "https://youtu.be/abc123XYZ",
    });

    expect(parseVideoUrl("https://vimeo.com/123456789")?.kind).toBe("vimeo");
    expect(parseVideoUrl("https://cdn.example.com/lesson.mp4")?.kind).toBe("video");
    expect(parseVideoUrl("javascript:alert(1)")).toBeNull();
  });
});
