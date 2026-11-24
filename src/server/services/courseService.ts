import { UserRepository } from "../repositories/UserRepository.js";
import { CourseRepository } from "../repositories/CourseRepository.js";
import { NotificationRepository } from "../repositories/NotificationRepository.js";

export class CourseService {
  static async getCourses(userId?: string, includeDrafts = false) {
    if (!userId) {
      return CourseRepository.getCourses(0, includeDrafts);
    }
    const profile = await UserRepository.getFullProfile(userId);
    const canSeeDrafts = includeDrafts || ["mentor", "admin"].includes(profile.accountRole);
    return CourseRepository.getCourses(profile.id, canSeeDrafts);
  }

  static async createCourse(userId: string, body: any) {
    if (!body?.title || typeof body.title !== "string" || !body.title.trim()) {
      throw new Error("Judul kursus wajib diisi.");
    }
    const profile = await UserRepository.getFullProfile(userId);
    const created = await CourseRepository.createCourse(profile.id, body);
    await NotificationRepository.addNotification(
      profile.id,
      `📚 Kursus baru '${created.title}' berhasil dipublikasikan ke katalog Skillora.`
    );
    return created;
  }

  static async updateCourse(courseId: string, body: any) {
    const updates: Record<string, any> = {};
    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.category !== undefined) updates.category = String(body.category).trim();
    if (body.difficulty !== undefined) updates.difficulty = String(body.difficulty);
    if (body.duration !== undefined) updates.duration = String(body.duration);
    if (body.xpReward !== undefined) updates.xpReward = Number(body.xpReward) || 500;
    if (body.partner !== undefined) updates.partner = String(body.partner);
    if (body.status !== undefined) updates.status = body.status === "draft" ? "draft" : "published";
    if (body.isProOnly !== undefined) updates.isProOnly = Boolean(body.isProOnly);
    if (Array.isArray(body.skills)) updates.skills = body.skills;
    if (body.projectTitle !== undefined) updates.projectTitle = String(body.projectTitle);
    if (body.projectDescription !== undefined) updates.projectDescription = String(body.projectDescription);
    if (body.projectRubric !== undefined) updates.projectRubric = String(body.projectRubric);

    return CourseRepository.updateCourse(courseId, updates);
  }

  static async deleteCourse(courseId: string) {
    return CourseRepository.deleteCourse(courseId);
  }

  static async addLesson(courseId: string, body: any) {
    if (!body?.title || typeof body.title !== "string") {
      throw new Error("Judul materi wajib diisi.");
    }
    return CourseRepository.addLesson(courseId, {
      title: body.title,
      xp: body.xp,
      contentMarkdown: body.contentMarkdown,
      estimatedMinutes: body.estimatedMinutes,
      questions: body.questions,
    });
  }

  static async completeLesson(userId: string, data: { courseId: string; lessonId: string }) {
    const { courseId, lessonId } = data;
    const profile = await UserRepository.getFullProfile(userId);

    const coursesList = await CourseRepository.getCourses(profile.id, true);
    const course = coursesList.find(c => c.id === courseId);
    if (!course) throw new Error("Kursus tidak ditemukan");

    const lesson = course.lessons.find(l => l.id === lessonId);
    if (!lesson) throw new Error("Pelajaran tidak ditemukan");

    const { isFirstTime } = await CourseRepository.completeLesson(profile.id, courseId, lessonId);

    const notifText = isFirstTime
      ? `📚 Materi '${lesson.title}' selesai dibaca!`
      : `🔄 Materi '${lesson.title}' diulas kembali!`;
    await NotificationRepository.addNotification(profile.id, notifText, "system");

    const updatedCourses = await CourseRepository.getCourses(profile.id);

    return {
      profile: await UserRepository.getFullProfile(userId),
      leveledUp: false,
      course: updatedCourses.find(c => c.id === courseId),
      courses: updatedCourses
    };
  }

  static getFlashChallenge() {
    return {
      question: "Manakah hook React yang paling cocok untuk melakukan fetch data dari API saat komponen pertama kali di-mount?",
      options: ["useState", "useEffect", "useMemo", "useRef"],
      correctIdx: 1,
      explanation: "useEffect memungkinkan kita menjalankan efek samping seperti sinkronisasi, subscription, atau fetch data setelah komponen di-render.",
      rewardGems: 15,
      rewardXP: 10
    };
  }
}
