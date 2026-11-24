import { db } from "../../db/index.js";
import {
  users,
  companies,
  userAchievements,
  bookmarks,
  jobBookmarks,
  quizAttempts,
  courses,
  lessons,
  notifications,
  certificates,
  projectSubmissions,
  interviewSessions,
  adaptiveAssessments,
} from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { NotificationRepository } from "./NotificationRepository.js";
import { safeParse } from "../../utils/safeJson.js";

export class UserRepository {
  static async getOrCreateUser(uid: string, email: string = "user@skillora.app", name: string = "Siswa") {
    let userRow = await db.query.users.findFirst({
      where: eq(users.uid, uid),
    });

    if (!userRow) {
      const isDemoUser = uid === "user-dev-default" || email === "guest@skillora.app";
      const initialValues = {
        uid,
        email: email || (isDemoUser ? "guest@skillora.app" : "user@skillora.app"),
        name: name || (isDemoUser ? "Tamu Skillora" : "Siswa"),
        level: isDemoUser ? 3 : 1,
        xp: isDemoUser ? 1350 : 0,
        gems: isDemoUser ? 150 : 100,
        streak: isDemoUser ? 6 : 0,
        streakFreezes: 0,
        lastActive: new Date().toISOString(),
        role: "Pelajar Siap Kerja",
        accountRole: "student",
        subscriptionTier: "free",
        certCredits: 1,
        avatar: "🦁",
        username: (email || "user").split("@")[0],
        hasCompletedOnboarding: isDemoUser,
        mentorTone: "friendly",
        notifyEmail: true,
        notifyDaily: true,
        notifySound: true,
        weeklyXp: isDemoUser ? 480 : 0,
        careerStage: "learning" as const,
        skills: ["React", "HTML5", "CSS3", "JavaScript"],
        unlockedAvatars: ["🦁"],
        purchasedItems: [],
        certifiedCourses: [],
        bookmarkedLessons: [],
        dailyQuests: [
          { id: "dq_1", title: "Selesaikan 1 Kuis Praktik", target: 1, current: 0, xpReward: 100, gemsReward: 10, completed: false, claimed: false },
          { id: "dq_2", title: "Gunakan Kiat Mentor AI di Kuis", target: 1, current: 0, xpReward: 50, gemsReward: 5, completed: false, claimed: false },
          { id: "dq_3", title: "Bookmark/Simpan 1 Kursus Baru", target: 1, current: 0, xpReward: 50, gemsReward: 5, completed: false, claimed: false }
        ],
      };

      const inserted = await db
        .insert(users)
        .values(initialValues)
        .onConflictDoUpdate({
          target: users.uid,
          set: { lastActive: new Date().toISOString() },
        })
        .returning();
      userRow = inserted[0];

      await UserRepository.initializeAchievements(userRow.id, userRow.streak, userRow.gems);

      await db.insert(notifications).values({
        userId: userRow.id,
        text: "Selamat bergabung di Skillora! Mulai perjalanan karier dan sertifikasi Anda hari ini.",
        type: "system",
      });
    }

    return userRow;
  }

  static async initializeAchievements(dbUserId: number, streak: number, gems: number) {
    const existing = await db
      .select({ achievementId: userAchievements.achievementId })
      .from(userAchievements)
      .where(eq(userAchievements.userId, dbUserId));
    const existingSet = new Set(existing.map((e) => e.achievementId));

    const defaults = [
      { id: "ach_1", title: "Pembelajar Pertama", description: "Selesaikan kuis pertamamu dengan skor minimal 70%", icon: "🥇", target: 1, current: 0, unlocked: false, xpReward: 150, gemsReward: 20 },
      { id: "ach_2", title: "Master Skor Sempurna", description: "Dapatkan skor 100% sempurna pada kuis", icon: "🏆", target: 1, current: 0, unlocked: false, xpReward: 250, gemsReward: 35 },
      { id: "ach_3", title: "Raja Konsistensi", description: "Pertahankan streak belajar selama 3 hari berturut-turut", icon: "🔥", target: 3, current: streak, unlocked: streak >= 3, xpReward: 200, gemsReward: 25 },
      { id: "ach_4", title: "Kolektor Gem", description: "Kumpulkan total 100 Gems di dompetmu", icon: "💎", target: 100, current: gems, unlocked: gems >= 100, xpReward: 150, gemsReward: 20 },
      { id: "ach_5", title: "Pustakawan Kursus", description: "Simpan 3 kursus pilihan di daftar favorit", icon: "❤️", target: 3, current: 0, unlocked: false, xpReward: 150, gemsReward: 15 },
      { id: "ach_6", title: "Simulasi Karir", description: "Selesaikan 1 sesi latihan simulasi kerja/wawancara", icon: "💼", target: 1, current: 0, unlocked: false, xpReward: 200, gemsReward: 30 }
    ];

    for (const ach of defaults) {
      if (existingSet.has(ach.id)) continue;
      await db.insert(userAchievements).values({
        userId: dbUserId,
        achievementId: ach.id,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        target: ach.target,
        current: ach.current,
        unlocked: ach.unlocked,
        xpReward: ach.xpReward,
        gemsReward: ach.gemsReward,
        claimed: false,
      });
    }
  }

  static async checkAndUpdateStreak(dbUserId: number) {
    const userRow = await db.query.users.findFirst({
      where: eq(users.id, dbUserId),
    });

    if (!userRow) return;

    const now = new Date();
    if (!userRow.lastActive) {
      await UserRepository.updateUserRow(dbUserId, { lastActive: now.toISOString() });
      return;
    }

    const lastActiveDate = new Date(userRow.lastActive);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last = new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate());

    const diffTime = today.getTime() - last.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      const newStreak = userRow.streak + 1;
      let bonusGems = 10;
      let message = `Streak belajar ${newStreak} hari! Bonus ${bonusGems} Gems.`;

      if (newStreak % 7 === 0) {
        bonusGems = 100;
        message = `Streak mingguan (${newStreak} hari)! Bonus ${bonusGems} Gems ditambahkan.`;
      }

      await UserRepository.updateUserRow(dbUserId, {
        streak: newStreak,
        gems: userRow.gems + bonusGems,
        lastActive: now.toISOString(),
        updatedAt: new Date(),
      });

      await NotificationRepository.addNotification(dbUserId, message);
    } else if (diffDays > 1) {
      let purchasedItems = safeParse<string[]>(userRow.purchasedItems, []);
      const hasFreezeItem = purchasedItems.includes("streak-freeze");

      if (userRow.streakFreezes > 0 || hasFreezeItem) {
        let newFreezes = userRow.streakFreezes;
        if (newFreezes > 0) newFreezes -= 1;
        if (hasFreezeItem) {
          purchasedItems = purchasedItems.filter((i) => i !== "streak-freeze");
        }

        await UserRepository.updateUserRow(dbUserId, {
          streakFreezes: newFreezes,
          purchasedItems,
          lastActive: now.toISOString(),
          updatedAt: new Date(),
        });

        await NotificationRepository.addNotification(
          dbUserId,
          `Streak Freeze otomatis digunakan! Streak ${userRow.streak} hari Anda aman.`
        );
      } else {
        await UserRepository.updateUserRow(dbUserId, {
          canRepairStreak: true,
          lostStreakCount: userRow.streak,
          streak: 1,
          lastActive: now.toISOString(),
          updatedAt: new Date(),
        });

        await NotificationRepository.addNotification(
          dbUserId,
          `Streak terputus. Anda dapat memulihkan Streak ${userRow.streak} Hari di Toko Gems.`
        );
      }
    } else if (diffDays === 0) {
      await UserRepository.updateUserRow(dbUserId, { lastActive: now.toISOString() });
    }

    await UserRepository.checkAndUpdateAchievements(dbUserId);
  }

  static async checkAndUpdateAchievements(dbUserId: number) {
    const userRow = await db.query.users.findFirst({
      where: eq(users.id, dbUserId),
    });

    if (!userRow) return;

    const bookmarkedCoursesRows = await db
      .select({ courseId: courses.courseId })
      .from(bookmarks)
      .innerJoin(courses, eq(bookmarks.courseId, courses.id))
      .where(eq(bookmarks.userId, dbUserId));

    const achievementsList = await db.query.userAchievements.findMany({
      where: eq(userAchievements.userId, dbUserId),
    });

    for (const ach of achievementsList) {
      let updatedCurrent = ach.current;
      if (ach.achievementId === "ach_3") {
        updatedCurrent = userRow.streak;
      } else if (ach.achievementId === "ach_4") {
        updatedCurrent = userRow.gems;
      } else if (ach.achievementId === "ach_5") {
        updatedCurrent = bookmarkedCoursesRows.length;
      }

      const shouldUnlock = updatedCurrent >= ach.target && !ach.unlocked;

      if (updatedCurrent !== ach.current || shouldUnlock) {
        await db
          .update(userAchievements)
          .set({
            current: updatedCurrent,
            unlocked: ach.unlocked || shouldUnlock,
            unlockedAt: shouldUnlock ? new Date().toISOString().split("T")[0] : ach.unlockedAt,
          })
          .where(eq(userAchievements.id, ach.id));
      }
    }
  }

  static async getFullProfile(uid: string) {
    const userRow = await UserRepository.getOrCreateUser(
      uid,
      uid === "user-dev-default" ? "guest@skillora.app" : "user@skillora.app",
      uid === "user-dev-default" ? "Tamu Skillora" : "Siswa"
    );

    await UserRepository.checkAndUpdateStreak(userRow.id);

    const updatedUserRow =
      (await db.query.users.findFirst({
        where: eq(users.id, userRow.id),
      })) || userRow;

    const companyRow = updatedUserRow.companyId
      ? await db.query.companies.findFirst({ where: eq(companies.id, updatedUserRow.companyId) })
      : null;

    const bookmarkedCoursesRows = await db
      .select({ courseId: courses.courseId })
      .from(bookmarks)
      .innerJoin(courses, eq(bookmarks.courseId, courses.id))
      .where(eq(bookmarks.userId, updatedUserRow.id));
    const bookmarkedCourses = bookmarkedCoursesRows.map((r) => r.courseId);

    const bookmarkedJobsRows = await db
      .select({ jobId: jobBookmarks.jobId })
      .from(jobBookmarks)
      .where(eq(jobBookmarks.userId, updatedUserRow.id));
    const bookmarkedJobs = bookmarkedJobsRows.map((r) => r.jobId);

    const attemptsRows = await db
      .select({
        id: quizAttempts.id,
        courseId: courses.courseId,
        courseTitle: courses.title,
        lessonId: lessons.lessonId,
        lessonTitle: lessons.title,
        score: quizAttempts.score,
        passed: quizAttempts.passed,
        createdAt: quizAttempts.createdAt,
      })
      .from(quizAttempts)
      .innerJoin(courses, eq(quizAttempts.courseId, courses.id))
      .innerJoin(lessons, eq(quizAttempts.lessonId, lessons.id))
      .where(eq(quizAttempts.userId, updatedUserRow.id));

    const quizAttemptsList = attemptsRows.map((att) => ({
      id: `att_${att.id}`,
      courseId: att.courseId,
      courseTitle: att.courseTitle,
      lessonId: att.lessonId,
      lessonTitle: att.lessonTitle,
      score: att.score,
      maxScore: 100,
      percentage: att.score,
      completedAt: att.createdAt ? att.createdAt.toISOString() : new Date().toISOString(),
      xpEarned: att.passed ? 100 : 25,
      gemsEarned: att.passed ? 15 : 5,
    }));

    const userCertificatesRows = await db
      .select()
      .from(certificates)
      .where(eq(certificates.userId, updatedUserRow.id))
      .orderBy(desc(certificates.issuedAt));

    const userCoursesRows = await db.select().from(courses);
    const courseTitleMap = new Map(userCoursesRows.map((c) => [c.courseId, { title: c.title, partner: c.partner }]));

    const certRecords = userCertificatesRows.map((c) => {
      const meta = courseTitleMap.get(c.courseId);
      return {
        id: c.certificateId,
        courseId: c.courseId,
        courseTitle: meta?.title || c.courseId,
        partner: meta?.partner || "Skillora Academy",
        issueDate: c.issuedAt.toISOString().split("T")[0],
        verificationCode: c.verificationCode || c.certificateId,
        score: c.score || 85,
        recipientName: c.recipientName,
      };
    });

    const userSubmissions = await db
      .select()
      .from(projectSubmissions)
      .where(eq(projectSubmissions.userId, updatedUserRow.id))
      .orderBy(desc(projectSubmissions.submittedAt));

    const portfolioProjects = userSubmissions.map((sub) => {
      const meta = courseTitleMap.get(sub.courseId);
      return {
        id: `proj_${sub.id}`,
        title: meta?.title || sub.courseId,
        category: "Proyek Sertifikasi",
        githubUrl: sub.projectUrl,
        description: sub.studentCodeNotes || "Proyek portofolio tersertifikasi di Skillora.",
        techStack: [],
        status: sub.status === "PASS" ? ("Verified & Passed" as const) : sub.status === "RETRY" ? ("Needs Revision" as const) : ("Under Review" as const),
        submittedAt: sub.submittedAt ? sub.submittedAt.toISOString() : new Date().toISOString(),
      };
    });

    let achievementsList = await db.query.userAchievements.findMany({
      where: eq(userAchievements.userId, updatedUserRow.id),
    });

    if (achievementsList.length === 0) {
      await UserRepository.initializeAchievements(updatedUserRow.id, updatedUserRow.streak, updatedUserRow.gems);
      achievementsList = await db.query.userAchievements.findMany({
        where: eq(userAchievements.userId, updatedUserRow.id),
      });
    }

    const achievements = achievementsList.map((ach) => ({
      id: ach.achievementId,
      title: ach.title,
      description: ach.description,
      icon: ach.icon,
      target: ach.target,
      current: ach.current,
      unlocked: ach.unlocked,
      unlockedAt: ach.unlockedAt || null,
      xpReward: ach.xpReward,
      gemsReward: ach.gemsReward,
      claimed: ach.claimed,
    }));

    const skills = safeParse<any[]>(updatedUserRow.skills, ["React", "HTML5", "CSS3", "JavaScript"]);
    const certifiedCourses = safeParse<string[]>(updatedUserRow.certifiedCourses, []);
    const unlockedAvatars = safeParse<string[]>(updatedUserRow.unlockedAvatars, ["🦁"]);
    const purchasedItems = safeParse<string[]>(updatedUserRow.purchasedItems, []);
    const dailyQuests = safeParse<any[]>(updatedUserRow.dailyQuests, []);
    const bookmarkedLessons = safeParse<string[]>(updatedUserRow.bookmarkedLessons, []);

    const isProActive =
      updatedUserRow.subscriptionTier === "pro" &&
      (!updatedUserRow.subscriptionExpiresAt || updatedUserRow.subscriptionExpiresAt.getTime() > Date.now());

    const milestones = [
      { id: 1, name: "Selesaikan Latihan & Kuis (Dapatkan XP)", status: updatedUserRow.xp > 0 ? "completed" : "current", date: updatedUserRow.xp > 0 ? "2026-06-30" : null },
      { id: 2, name: "Sertifikasi Projek Pertama (Evaluasi Mentor/AI)", status: certifiedCourses.length > 0 ? "completed" : updatedUserRow.xp > 0 ? "current" : "upcoming", date: null },
      { id: 3, name: "Kolaborasi Tim Projek Industri Riil", status: ["collaborating", "applied", "hired"].includes(updatedUserRow.careerStage) ? "completed" : "upcoming", date: null },
      { id: 4, name: "Matchmaking & Profiling Bursa Kerja", status: ["applied", "hired"].includes(updatedUserRow.careerStage) ? "completed" : "upcoming", date: null },
      { id: 5, name: "Penyaluran Kerja di Perusahaan Mitra", status: updatedUserRow.careerStage === "hired" ? "completed" : "upcoming", date: null },
    ];

    return {
      id: updatedUserRow.id,
      uid: updatedUserRow.uid,
      name: updatedUserRow.name,
      email: updatedUserRow.email,
      role: updatedUserRow.role,
      accountRole: updatedUserRow.accountRole || "student",
      subscriptionTier: isProActive ? "pro" : "free",
      subscriptionExpiresAt: updatedUserRow.subscriptionExpiresAt ? updatedUserRow.subscriptionExpiresAt.toISOString() : null,
      certCredits: updatedUserRow.certCredits ?? 1,
      companyId: updatedUserRow.companyId || null,
      company: companyRow || null,
      mentorSpecialty: updatedUserRow.mentorSpecialty || null,
      mentorHeadline: updatedUserRow.mentorHeadline || null,
      xp: updatedUserRow.xp,
      gems: updatedUserRow.gems,
      level: updatedUserRow.level,
      streak: updatedUserRow.streak,
      streakFreezes: updatedUserRow.streakFreezes,
      lastActive: updatedUserRow.lastActive,
      skills,
      certifiedCourses,
      certificates: certRecords,
      portfolioProjects,
      careerStage: updatedUserRow.careerStage,
      dailyClaimedLast: updatedUserRow.dailyClaimedLast,
      purchasedItems,
      activeBoosterUntil: updatedUserRow.activeBoosterUntil ? updatedUserRow.activeBoosterUntil.getTime() : null,
      bookmarkedJobs,
      quizCombo: 0,
      theme: "light",
      titles: [isProActive ? "Skillora Pro Member" : "Pembelajar Aktif"],
      unlockedAvatars,
      selectedAvatar: updatedUserRow.avatar || "🦁",
      isDevMode: updatedUserRow.role === "Developer" || updatedUserRow.accountRole === "admin",
      weeklyXp: updatedUserRow.weeklyXp,
      canRepairStreak: updatedUserRow.canRepairStreak,
      lostStreakCount: updatedUserRow.lostStreakCount,
      dailyQuizXpCount: updatedUserRow.dailyQuizXpCount,
      lastQuizXpDate: updatedUserRow.lastQuizXpDate,
      bookmarkedCourses,
      bookmarkedLessons,
      quizAttempts: quizAttemptsList,
      dailyQuests,
      achievements,
      milestones,
      hasCompletedOnboarding: updatedUserRow.hasCompletedOnboarding,
      onboardingGoal: updatedUserRow.onboardingGoal,
      selectedLevelPref: updatedUserRow.selectedLevelPref,
      bio: updatedUserRow.bio,
      mentorTone: updatedUserRow.mentorTone,
      notifyEmail: updatedUserRow.notifyEmail,
      notifyDaily: updatedUserRow.notifyDaily,
      notifySound: updatedUserRow.notifySound,
    };
  }

  static async updateUserRow(dbUserId: number, values: Partial<typeof users.$inferInsert>) {
    await db.update(users).set(values).where(eq(users.id, dbUserId));
  }

  static async getLeaderboard(currentUid: string) {
    const currentUserProfile = await UserRepository.getFullProfile(currentUid);

    const allUsers = await db.select().from(users);

    const weeklyList = [...allUsers]
      .sort((a, b) => b.weeklyXp - a.weeklyXp)
      .slice(0, 10)
      .map((u, index) => ({
        rank: index + 1,
        name: u.name,
        avatar: u.avatar || "🦁",
        level: u.level,
        xp: u.xp,
        weeklyXp: u.weeklyXp,
        title: u.role || "Pelajar Siap Kerja",
        isCurrentUser: u.id === currentUserProfile.id,
      }));

    const allTimeList = [...allUsers]
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10)
      .map((u, index) => ({
        rank: index + 1,
        name: u.name,
        avatar: u.avatar || "🦁",
        level: u.level,
        xp: u.xp,
        weeklyXp: u.weeklyXp,
        title: u.role || "Pelajar Siap Kerja",
        isCurrentUser: u.id === currentUserProfile.id,
      }));

    return {
      weekly: weeklyList,
      allTime: allTimeList,
      resetDaysRemaining: 3,
    };
  }
}
