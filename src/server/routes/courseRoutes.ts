import { Router } from "express";
import { CourseController } from "../controllers/courseController.js";
import { requireAccountRole, requireAuth, requireRegistered } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/courses", CourseController.getCourses);
router.post("/courses/complete-lesson", requireRegistered, CourseController.completeLesson);
router.get("/quiz/flash", requireAuth, CourseController.getFlashChallenge);
router.post("/quiz/flash/claim", requireRegistered, CourseController.claimFlashChallenge);

// LMS Management Routes (Mentor & Admin)
router.get("/lms/courses", requireAccountRole("mentor", "admin"), CourseController.getLmsCourses);
router.post("/courses", requireAccountRole("mentor", "admin"), CourseController.createCourse);
router.put("/courses/:id", requireAccountRole("mentor", "admin"), CourseController.updateCourse);
router.delete("/courses/:id", requireAccountRole("mentor", "admin"), CourseController.deleteCourse);
router.post("/courses/:id/lessons", requireAccountRole("mentor", "admin"), CourseController.addLesson);

export default router;
