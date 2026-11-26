import { db } from "../../db/index.js";
import { users, walletLedger, notifications } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { UserRepository } from "../repositories/UserRepository.js";
import { CourseRepository } from "../repositories/CourseRepository.js";
import { NotificationRepository } from "../repositories/NotificationRepository.js";

function getJakartaDateStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export class CourseService {
  private static async assertCourseOwnership(userId: string, courseId: string) {
    const profile = await UserRepository.getFullProfile(userId);
    const existing = await CourseRepository.getCourseByCourseId(courseId);
    if (!existing) throw new Error("Kursus tidak ditemukan.");

    const isAdmin = profile.accountRole === "admin" || ["Admin", "Developer"].includes(profile.role);
    if (!isAdmin && existing.authorUserId && existing.authorUserId !== profile.id) {
      throw new Error("Akses ditolak: Anda hanya dapat mengelola kursus yang Anda buat.");
    }
    return { profile, existing };
  }

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

  static async updateCourse(userId: string, courseId: string, body: any) {
    await CourseService.assertCourseOwnership(userId, courseId);
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

  static async deleteCourse(userId: string, courseId: string) {
    await CourseService.assertCourseOwnership(userId, courseId);
    return CourseRepository.deleteCourse(courseId);
  }

  static async addLesson(userId: string, courseId: string, body: any) {
    await CourseService.assertCourseOwnership(userId, courseId);
    if (!body?.title || typeof body.title !== "string") {
      throw new Error("Judul materi wajib diisi.");
    }
    return CourseRepository.addLesson(courseId, {
      title: body.title,
      xp: body.xp,
      contentMarkdown: body.contentMarkdown,
      estimatedMinutes: body.estimatedMinutes,
      questions: body.questions,
      inlineChecks: body.inlineChecks,
      flashcards: body.flashcards,
      videoUrl: body.videoUrl,
    });
  }

  static async getLearningPaths(userId?: string) {
    if (!userId) return CourseRepository.getLearningPaths(0);
    const profile = await UserRepository.getFullProfile(userId);
    return CourseRepository.getLearningPaths(profile.id);
  }

  static async enrollLearningPath(userId: string, slug: string) {
    const profile = await UserRepository.getFullProfile(userId);
    const result = await CourseRepository.enrollLearningPath(profile.id, slug);
    await NotificationRepository.addNotification(
      profile.id,
      `🧭 Terdaftar gratis pada jalur '${result.title}' (${result.enrolledCourses} kursus siap belajar)!`
    );
    return result;
  }

  static async claimLearningPathCertificate(userId: string, slug: string) {
    const profile = await UserRepository.getFullProfile(userId);
    const res = await CourseRepository.claimLearningPathCertificate(profile.id, profile.name, slug);
    if (!res.alreadyIssued) {
      await NotificationRepository.addNotification(
        profile.id,
        `🏆 Selamat! Sertifikat Spesialisasi '${res.title}' berhasil diterbitkan gratis ke akun Anda.`
      );
    }
    return res;
  }

  static async updateLesson(userId: string, courseId: string, lessonId: string, body: any) {
    await CourseService.assertCourseOwnership(userId, courseId);
    return CourseRepository.updateLesson(courseId, lessonId, body || {});
  }

  static async deleteLesson(userId: string, courseId: string, lessonId: string) {
    await CourseService.assertCourseOwnership(userId, courseId);
    return CourseRepository.deleteLesson(courseId, lessonId);
  }

  static async getLmsAnalytics() {
    return CourseRepository.getLmsAnalytics();
  }

  static async enrollCourse(userId: string, courseId: string) {
    const profile = await UserRepository.getFullProfile(userId);
    const result = await CourseRepository.enrollCourse(profile.id, courseId);
    if (!result.alreadyEnrolled) {
      await NotificationRepository.addNotification(
        profile.id,
        `🎓 Berhasil mendaftar kursus gratis '${result.courseTitle}'. Selamat belajar tanpa batas di SkillOra!`
      );
    }
    return {
      enrolled: result.enrolled,
      alreadyEnrolled: result.alreadyEnrolled,
      enrolledCount: result.enrolledCount,
    };
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

  static async claimFlashChallenge(userId: string, selectedIdx: number) {
    const challenge = CourseService.getFlashChallenge();
    const isCorrect = selectedIdx === challenge.correctIdx;
    if (!isCorrect) {
      return {
        correct: false,
        alreadyClaimed: false,
        rewardXP: 0,
        rewardGems: 0,
        profile: await UserRepository.getFullProfile(userId),
      };
    }

    const todayStr = getJakartaDateStr();
    const refId = `flash_${todayStr}`;

    const result = await db.transaction(async (tx) => {
      const [userRow] = await tx.select().from(users).where(eq(users.uid, userId)).for("update");
      if (!userRow) throw new Error("Pengguna tidak ditemukan.");

      const existing = await tx
        .select()
        .from(walletLedger)
        .where(eq(walletLedger.userId, userRow.id));

      if (existing.some((entry) => entry.referenceId === refId)) {
        return { alreadyClaimed: true };
      }

      const newXp = userRow.xp + challenge.rewardXP;
      const newGems = userRow.gems + challenge.rewardGems;
      const newLevel = Math.floor(newXp / 500) + 1;

      await tx
        .update(users)
        .set({
          xp: newXp,
          weeklyXp: userRow.weeklyXp + challenge.rewardXP,
          gems: newGems,
          level: newLevel,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userRow.id));

      await tx.insert(walletLedger).values({
        userId: userRow.id,
        currency: "gems",
        delta: challenge.rewardGems,
        balanceAfter: newGems,
        reason: "Hadiah Flash Challenge Harian",
        referenceId: refId,
      });

      await tx.insert(notifications).values({
        userId: userRow.id,
        text: `⚡ Flash Challenge selesai! +${challenge.rewardXP} XP dan +${challenge.rewardGems} Gems ditambahkan!`,
        type: "system",
        read: false,
      });

      return { alreadyClaimed: false };
    });

    const profile = await UserRepository.getFullProfile(userId);
    return {
      correct: true,
      alreadyClaimed: result.alreadyClaimed,
      rewardXP: result.alreadyClaimed ? 0 : challenge.rewardXP,
      rewardGems: result.alreadyClaimed ? 0 : challenge.rewardGems,
      profile,
    };
  }
}
