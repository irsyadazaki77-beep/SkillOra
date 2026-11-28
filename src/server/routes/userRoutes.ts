import { Router } from "express";
import { UserController } from "../controllers/userController.js";
import { preventRoleEscalation } from "../middlewares/validateInput.js";
import { requireAuth, requireRegistered } from "../middlewares/authMiddleware.js";

const router = Router();

// Profile retrieval
router.get("/user/profile", requireAuth, UserController.getProfile);

// Onboarding & Role Registration
router.post("/user/onboarding", requireRegistered, UserController.handleOnboarding);
router.post("/user/register-role", requireRegistered, UserController.registerRole);

// Claims and daily
router.post("/user/claim-daily", requireRegistered, UserController.claimDaily);

// Store and inventory
router.post("/user/buy-item", requireRegistered, UserController.buyItem);
router.post("/user/buy-freeze", requireRegistered, UserController.buyFreeze);

// XP management
router.post("/user/add-xp", requireRegistered, UserController.addXp);

// Quests
router.post("/user/quests/:questId/claim", requireRegistered, UserController.claimQuest);

// Settings and Profile personalization
router.post("/user/update-settings", requireRegistered, preventRoleEscalation, UserController.updateSettings);
router.post("/user/set-avatar", requireRegistered, UserController.setAvatar);
router.post("/user/add-skill", requireRegistered, UserController.addSkill);

// Bookmarks
router.post("/user/bookmark-course", requireRegistered, UserController.bookmarkCourse);
router.post("/user/bookmark-lesson", requireRegistered, UserController.bookmarkLesson);
router.post("/jobs/bookmark", requireRegistered, UserController.bookmarkJob);

// Streak and Achievements repair/claim
router.post("/user/profile/repair-streak", requireRegistered, UserController.repairStreak);
router.post("/user/profile/claim-achievement", requireRegistered, UserController.claimAchievement);

// Leaderboard
router.get("/user/leaderboard", requireAuth, UserController.getLeaderboard);

// Authentication synchronization and state
router.post("/auth/sync", requireAuth, UserController.handleSyncAuth);
router.post("/auth/logout", UserController.handleLogout);

export default router;
