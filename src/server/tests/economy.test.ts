import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserService } from "../services/userService.js";
import { QuizService } from "../services/quizService.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { CourseService } from "../services/courseService.js";
import { db } from "../../db/index.js";

// Mock dependencies
vi.mock("../repositories/UserRepository.js", () => ({
  UserRepository: {
    getFullProfile: vi.fn(),
    updateUserRow: vi.fn(),
  },
}));

vi.mock("../repositories/CourseRepository.js", () => ({
  CourseRepository: {
    getCourses: vi.fn(),
    completeLesson: vi.fn(),
  },
}));

vi.mock("../repositories/NotificationRepository.js", () => ({
  NotificationRepository: {
    addNotification: vi.fn(),
  },
}));

vi.mock("../../db/index.js", () => {
  return {
    db: {
      transaction: vi.fn(async (cb) => {
        // mock transaction object
        const tx = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          for: vi.fn().mockResolvedValue([{}]),
          update: vi.fn().mockReturnThis(),
          set: vi.fn().mockReturnThis(),
          insert: vi.fn().mockReturnThis(),
          values: vi.fn().mockReturnThis(),
        };
        return cb(tx);
      }),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
    }
  }
});

describe("Economy & Gamification Exploit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. Daily Quest Exploit - Farming Same Quest
  it("should prevent claiming the same daily quest twice", async () => {
    const mockUser = {
      id: 1,
      uid: "user-123",
      xp: 0,
      gems: 0,
      dailyQuests: [
        { id: "dq_1", completed: true, claimed: true, xpReward: 50, gemsReward: 10 }
      ]
    };
    
    vi.mocked(UserRepository.getFullProfile).mockResolvedValueOnce(mockUser as any);
    
    await expect(UserService.claimQuest("user-123", "dq_1"))
      .rejects.toThrow("Quest tidak ditemukan atau tidak memenuhi syarat untuk klaim.");
  });

  // 2. Daily Quest Exploit - Claiming Uncompleted Quest
  it("should prevent claiming an uncompleted daily quest", async () => {
    const mockUser = {
      id: 1,
      uid: "user-123",
      xp: 0,
      gems: 0,
      dailyQuests: [
        { id: "dq_1", completed: false, claimed: false, xpReward: 50, gemsReward: 10 }
      ]
    };
    
    vi.mocked(UserRepository.getFullProfile).mockResolvedValueOnce(mockUser as any);
    
    await expect(UserService.claimQuest("user-123", "dq_1"))
      .rejects.toThrow("Quest tidak ditemukan atau tidak memenuhi syarat untuk klaim.");
  });

  // 3. Course Completion Exploit - No arbitrary XP
  it("should not accept arbitrary XP from completeLesson", async () => {
    // The completeLesson interface has been stripped of xpEarned, maxScore, wrongAnswers.
    // If the frontend tries to send xpEarned, it should be ignored by TS or stripped.
    const mockUser = { id: 1, uid: "user-123", xp: 100, gems: 50 };
    vi.mocked(UserRepository.getFullProfile).mockResolvedValue(mockUser as any);
    
    // Simulate frontend payload
    const payload = {
      courseId: "c1",
      lessonId: "l1",
      xpEarned: 9999 // This will be ignored since we removed it from the handler implementation
    } as any;

    try {
      await CourseService.completeLesson("user-123", payload);
    } catch(e) {
      // Ignored if course not found mock
    }
    
    // Because we removed gamification logic from completeLesson,
    // the user profile XP and Gems should not be updated via UserRepository.updateUserRow
    expect(UserRepository.updateUserRow).not.toHaveBeenCalled();
  });
});
