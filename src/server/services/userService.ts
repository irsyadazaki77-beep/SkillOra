import { UserRepository } from "../repositories/UserRepository.js";
import { NotificationRepository } from "../repositories/NotificationRepository.js";
import { CareerRepository } from "../repositories/CareerRepository.js";
import { db } from "../../db/index.js";
import { users, userAchievements, bookmarks, jobBookmarks, courses, notifications, walletLedger } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";
import { safeParse } from "../../utils/safeJson.js";
import type { AccountRole } from "../middlewares/authMiddleware.js";

const ROLE_DISPLAY_LABELS: Record<Exclude<AccountRole, "admin">, string> = {
  student: "Pelajar Siap Kerja",
  mentor: "Mentor & Dosen Industri",
  recruiter: "Recruiter / HRD Partner",
};

function getJakartaDateStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const MAX_SINGLE_XP_AWARD = 50;
const MAX_DAILY_MANUAL_XP = 200;

export class UserService {
  static async getProfile(userId: string) {
    return UserRepository.getFullProfile(userId);
  }

  static async updateSettings(userId: string, data: any) {
    const userRow = await UserRepository.getOrCreateUser(userId, data.email || "user@skillora.app", data.name || "Siswa");

    // Security check: Block restricted fields
    const forbiddenKeys = [
      "role",
      "accountRole",
      "subscriptionTier",
      "certCredits",
      "isDevMode",
      "xp",
      "gems",
      "certificates",
      "certifiedCourses",
      "achievement",
      "careerStage",
      "id",
    ];
    for (const key of forbiddenKeys) {
      if (data && data[key] !== undefined) {
        throw new Error("Aksi ditolak: Anda tidak diizinkan memodifikasi parameter sistem.");
      }
    }

    const { name, email, bio, mentorTone, notifyEmail, notifyDaily, notifySound, mentorSpecialty, mentorHeadline } = data;
    const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };

    if (name && typeof name === "string") {
      updates.name = name.trim();
    }
    if (email && typeof email === "string") {
      updates.email = email.trim();
    }
    if (typeof bio === "string") {
      updates.bio = bio.trim();
    }
    if (mentorTone && typeof mentorTone === "string") {
      updates.mentorTone = mentorTone;
    }
    if (typeof mentorSpecialty === "string") {
      updates.mentorSpecialty = mentorSpecialty.trim();
    }
    if (typeof mentorHeadline === "string") {
      updates.mentorHeadline = mentorHeadline.trim();
    }
    if (typeof notifyEmail === "boolean") {
      updates.notifyEmail = notifyEmail;
    }
    if (typeof notifyDaily === "boolean") {
      updates.notifyDaily = notifyDaily;
    }
    if (typeof notifySound === "boolean") {
      updates.notifySound = notifySound;
    }

    await UserRepository.updateUserRow(userRow.id, updates);

    await NotificationRepository.addNotification(
      userRow.id,
      "⚙️ Pengaturan profil berhasil diperbarui!"
    );

    return UserRepository.getFullProfile(userId);
  }

  static async updateOnboarding(
    userId: string,
    data: {
      goal?: string;
      level?: string;
      learningGoal?: string;
      accountRole?: string;
      companyName?: string;
      companyIndustry?: string;
      companyLocation?: string;
      mentorSpecialty?: string;
      mentorHeadline?: string;
    }
  ) {
    const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Siswa");

    let mappedLevel = "Pemula";
    if (data.level === "menengah") mappedLevel = "Menengah";
    else if (data.level === "lanjutan") mappedLevel = "Lanjutan";

    const updates: Partial<typeof users.$inferInsert> = {
      hasCompletedOnboarding: true,
      onboardingGoal: data.goal || data.learningGoal || userRow.onboardingGoal,
      selectedLevelPref: mappedLevel,
      updatedAt: new Date(),
    };

    if (data.accountRole && ["student", "mentor", "recruiter"].includes(data.accountRole)) {
      const targetRole = data.accountRole as Exclude<AccountRole, "admin">;
      updates.accountRole = targetRole;
      updates.role = ROLE_DISPLAY_LABELS[targetRole];

      if (targetRole === "mentor") {
        updates.mentorSpecialty = data.mentorSpecialty?.trim() || "Fullstack & Career Coaching";
        updates.mentorHeadline = data.mentorHeadline?.trim() || "Mentor Industri Terverifikasi";
      }

      if (targetRole === "recruiter" && data.companyName?.trim()) {
        const company = await CareerRepository.upsertCompany(userRow, {
          name: data.companyName.trim(),
          industry: data.companyIndustry?.trim() || "Teknologi & Digital",
          location: data.companyLocation?.trim() || "Jakarta, Indonesia",
        });
        updates.companyId = company.id;
      }
    }

    await UserRepository.updateUserRow(userRow.id, updates);

    await NotificationRepository.addNotification(
      userRow.id,
      "🎉 Selamat datang! Profil dan portal peran Skillora Anda telah dikonfigurasi."
    );

    return UserRepository.getFullProfile(userId);
  }

  static async registerRole(
    userId: string,
    data: {
      accountRole: "student" | "mentor" | "recruiter";
      companyName?: string;
      companyIndustry?: string;
      companyLocation?: string;
      mentorSpecialty?: string;
      mentorHeadline?: string;
    }
  ) {
    if (!["student", "mentor", "recruiter"].includes(data.accountRole)) {
      throw new Error("Peran akun tidak valid. Pilih student, mentor, atau recruiter.");
    }

    const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Pengguna Skillora");

    const updates: Partial<typeof users.$inferInsert> = {
      accountRole: data.accountRole,
      role: ROLE_DISPLAY_LABELS[data.accountRole],
      hasCompletedOnboarding: true,
      updatedAt: new Date(),
    };

    if (data.accountRole === "mentor") {
      updates.mentorSpecialty = data.mentorSpecialty?.trim() || userRow.mentorSpecialty || "Software & Career Mentorship";
      updates.mentorHeadline = data.mentorHeadline?.trim() || userRow.mentorHeadline || "Dosen & Praktisi Industri";
    }

    if (data.accountRole === "recruiter") {
      const company = await CareerRepository.upsertCompany(userRow, {
        name: data.companyName?.trim() || `${userRow.name} Talent Partner`,
        industry: data.companyIndustry?.trim() || "Teknologi & Digital",
        location: data.companyLocation?.trim() || "Jakarta, Indonesia",
      });
      updates.companyId = company.id;
    }

    await UserRepository.updateUserRow(userRow.id, updates);

    await NotificationRepository.addNotification(
      userRow.id,
      `🛡️ Peran portal Anda aktif sebagai ${ROLE_DISPLAY_LABELS[data.accountRole]}.`
    );

    return UserRepository.getFullProfile(userId);
  }

  static async toggleBookmarkCourse(userId: string, courseId: string) {
    const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Siswa");

    const course = await db.query.courses.findFirst({
      where: eq(courses.courseId, courseId),
    });

    if (course) {
      const existing = await db.select().from(bookmarks).where(
        and(eq(bookmarks.userId, userRow.id), eq(bookmarks.courseId, course.id))
      );

      if (existing.length > 0) {
        await db.delete(bookmarks).where(
          and(eq(bookmarks.userId, userRow.id), eq(bookmarks.courseId, course.id))
        );
      } else {
        await db.insert(bookmarks).values({
          userId: userRow.id,
          courseId: course.id,
        });
      }
    }

    await UserRepository.checkAndUpdateAchievements(userRow.id);
    return UserRepository.getFullProfile(userId);
  }

  static async toggleBookmarkLesson(userId: string, lessonId: string) {
    const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Siswa");

    const bookmarkedLessons = safeParse<string[]>(userRow.bookmarkedLessons, []);

    const idx = bookmarkedLessons.indexOf(lessonId);
    if (idx > -1) {
      bookmarkedLessons.splice(idx, 1);
    } else {
      bookmarkedLessons.push(lessonId);
    }

    await UserRepository.updateUserRow(userRow.id, {
      bookmarkedLessons: bookmarkedLessons,
      updatedAt: new Date(),
    });

    return UserRepository.getFullProfile(userId);
  }

  static async toggleBookmarkJob(userId: string, jobId: string) {
    const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Siswa");

    const existing = await db.select().from(jobBookmarks).where(
      and(eq(jobBookmarks.userId, userRow.id), eq(jobBookmarks.jobId, jobId))
    );

    if (existing.length > 0) {
      await db.delete(jobBookmarks).where(
        and(eq(jobBookmarks.userId, userRow.id), eq(jobBookmarks.jobId, jobId))
      );
    } else {
      await db.insert(jobBookmarks).values({
        userId: userRow.id,
        jobId,
      });
    }

    return UserRepository.getFullProfile(userId);
  }

  static async claimDaily(userId: string) {
    const rewardXp = 20;
    const rewardGems = 15;
    const { levelUp } = await db.transaction(async (tx) => {
      const [userRow] = await tx.select().from(users).where(eq(users.uid, userId)).for("update");
      if (!userRow) throw new Error("Pengguna tidak ditemukan.");

      const todayStr = getJakartaDateStr();

      if (userRow.dailyClaimedLast === todayStr) {
        throw new Error("Anda sudah melakukan Klaim Harian hari ini!");
      }

      const newXp = userRow.xp + rewardXp;
      const newGems = userRow.gems + rewardGems;
      const newLevel = Math.floor(newXp / 500) + 1;
      const leveledUp = newLevel > userRow.level;

      await tx.update(users).set({
        dailyClaimedLast: todayStr,
        xp: newXp,
        gems: newGems,
        level: newLevel,
        updatedAt: new Date(),
      }).where(eq(users.id, userRow.id));

      await tx.insert(walletLedger).values({
        userId: userRow.id,
        currency: "gems",
        delta: rewardGems,
        balanceAfter: newGems,
        reason: "Klaim Hadiah Harian",
        referenceId: `daily_${todayStr}`,
      });

      await tx.insert(notifications).values({
        userId: userRow.id,
        text: `🎁 Klaim Harian Sukses! +${rewardXp} XP dan +${rewardGems} Gems ditambahkan!`,
        type: "system",
        read: false,
      });

      return { levelUp: leveledUp };
    });

    const profile = await UserRepository.getFullProfile(userId);
    return { profile, levelUp, rewardXp, rewardGems };
  }

  static async buyItem(userId: string, itemId: string) {
    await db.transaction(async (tx) => {
      const [userRow] = await tx.select().from(users).where(eq(users.uid, userId)).for("update");
      if (!userRow) throw new Error("Pengguna tidak ditemukan.");

      const itemPrices: Record<string, { name: string; price: number }> = {
        "streak-freeze": { name: "Streak Freeze (Pengaman Konsistensi)", price: 100 },
        "xp-booster": { name: "XP Booster 2x (30 Menit)", price: 150 },
        "gold-cert": { name: "Sertifikat Emas Premium", price: 200 },
        "mystery-box": { name: "Mystery Box Epik", price: 250 },
        "refill-hearts": { name: "Isi Ulang 5 Nyawa", price: 50 },
        "avatar-owl": { name: "Avatar Burung Hantu (Duo OWL)", price: 80 },
        "avatar-astronaut": { name: "Avatar Kosmonot Developer", price: 120 },
      };

      const item = itemPrices[itemId];
      if (!item) throw new Error("Item Toko tidak ditemukan.");
      if (userRow.gems < item.price) {
        throw new Error(`Gems tidak cukup! Membutuhkan ${item.price} Gems.`);
      }

      const purchasedItems = safeParse<string[]>(userRow.purchasedItems, []);
      const unlockedAvatars = safeParse<string[]>(userRow.unlockedAvatars, ["🦁"]);

      let finalGems = userRow.gems - item.price;
      let extraNotification = "";
      const updates: Partial<typeof users.$inferInsert> = {
        gems: finalGems,
        updatedAt: new Date(),
      };

      if (!purchasedItems.includes(itemId)) {
        purchasedItems.push(itemId);
        updates.purchasedItems = purchasedItems;
      }

      if (itemId === "xp-booster") {
        updates.activeBoosterUntil = new Date(Date.now() + 30 * 60 * 1000);
      } else if (itemId === "streak-freeze") {
        updates.streakFreezes = userRow.streakFreezes + 1;
      } else if (itemId === "gold-cert") {
        updates.certCredits = (userRow.certCredits ?? 1) + 1;
      } else if (itemId === "mystery-box") {
        const bonusXp = 100 + Math.floor(Math.random() * 101); // 100-200 XP
        const bonusGems = 50 + Math.floor(Math.random() * 101); // 50-150 Gems
        const newXp = userRow.xp + bonusXp;
        finalGems += bonusGems;
        updates.xp = newXp;
        updates.level = Math.floor(newXp / 500) + 1;
        updates.gems = finalGems;
        updates.streakFreezes = userRow.streakFreezes + 1;
        extraNotification = ` Isi Mystery Box: +${bonusXp} XP, +${bonusGems} Gems & +1 Streak Freeze!`;
      } else if (itemId === "refill-hearts") {
        const newXp = userRow.xp + 25;
        updates.xp = newXp;
        updates.level = Math.floor(newXp / 500) + 1;
        extraNotification = " 5 Nyawa latihan dipulihkan penuh (+25 XP bonus semangat)!";
      } else if (itemId === "avatar-owl") {
        if (!unlockedAvatars.includes("🦉")) unlockedAvatars.push("🦉");
        updates.unlockedAvatars = unlockedAvatars;
        updates.avatar = "🦉";
      } else if (itemId === "avatar-astronaut") {
        if (!unlockedAvatars.includes("🚀")) unlockedAvatars.push("🚀");
        updates.unlockedAvatars = unlockedAvatars;
        updates.avatar = "🚀";
      }

      await tx.update(users).set(updates).where(eq(users.id, userRow.id));

      await tx.insert(walletLedger).values({
        userId: userRow.id,
        currency: "gems",
        delta: -item.price,
        balanceAfter: userRow.gems - item.price,
        reason: `Pembelian Toko: ${item.name}`,
        referenceId: itemId,
      });

      if (itemId === "mystery-box" && finalGems > userRow.gems - item.price) {
        const bonusGems = finalGems - (userRow.gems - item.price);
        await tx.insert(walletLedger).values({
          userId: userRow.id,
          currency: "gems",
          delta: bonusGems,
          balanceAfter: finalGems,
          reason: "Hadiah Mystery Box Epik",
          referenceId: itemId,
        });
      }

      await tx.insert(notifications).values({
        userId: userRow.id,
        text: `🛍️ Berhasil membeli '${item.name}' seharga ${item.price} Gems!${extraNotification}`,
        type: "system",
        read: false,
      });
    });

    return UserRepository.getFullProfile(userId);
  }

  static async repairStreak(userId: string) {
    await db.transaction(async (tx) => {
      const [userRow] = await tx.select().from(users).where(eq(users.uid, userId)).for("update");
      if (!userRow) throw new Error("Pengguna tidak ditemukan.");
      const cost = 80;

      if (!userRow.canRepairStreak) {
        throw new Error("Tidak ada streak yang dapat dipulihkan saat ini.");
      }
      if (userRow.gems < cost) {
        throw new Error(`Gems tidak cukup! Diperlukan ${cost} Gems untuk memulihkan streak.`);
      }

      const restored = userRow.lostStreakCount || 5;
      const newStreak = restored + 1;
      const newGems = userRow.gems - cost;

      await tx.update(users).set({
        gems: newGems,
        streak: newStreak,
        canRepairStreak: false,
        lostStreakCount: 0,
        updatedAt: new Date(),
      }).where(eq(users.id, userRow.id));

      await tx.insert(walletLedger).values({
        userId: userRow.id,
        currency: "gems",
        delta: -cost,
        balanceAfter: newGems,
        reason: "Pemulihan Streak Belajar",
        referenceId: "repair_streak",
      });

      await tx.insert(notifications).values({
        userId: userRow.id,
        text: `🔥 Hore! Streak ${newStreak} Hari Anda telah berhasil dipulihkan dengan ${cost} Gems!`,
        type: "system",
        read: false,
      });
    });

    return UserRepository.getFullProfile(userId);
  }

  static async claimAchievement(userId: string, achievementId: string) {
    await db.transaction(async (tx) => {
      const [userRow] = await tx.select().from(users).where(eq(users.uid, userId)).for("update");
      if (!userRow) throw new Error("Pengguna tidak ditemukan.");

      const [ach] = await tx.select().from(userAchievements).where(
        and(
          eq(userAchievements.userId, userRow.id),
          eq(userAchievements.achievementId, achievementId)
        )
      ).for("update");

      if (!ach) throw new Error("Prestasi tidak ditemukan.");
      if (!ach.unlocked) throw new Error("Prestasi ini belum terbuka!");
      if (ach.claimed) throw new Error("Hadiah prestasi ini sudah pernah diklaim!");

      await tx.update(userAchievements).set({ claimed: true }).where(eq(userAchievements.id, ach.id));

      const addXp = ach.xpReward || 150;
      const addGems = ach.gemsReward || 20;

      const newXp = userRow.xp + addXp;
      const newGems = userRow.gems + addGems;
      const newLevel = Math.floor(newXp / 500) + 1;

      await tx.update(users).set({
        xp: newXp,
        gems: newGems,
        level: newLevel,
        updatedAt: new Date(),
      }).where(eq(users.id, userRow.id));

      await tx.insert(walletLedger).values({
        userId: userRow.id,
        currency: "gems",
        delta: addGems,
        balanceAfter: newGems,
        reason: `Klaim Prestasi: ${ach.title}`,
        referenceId: achievementId,
      });

      await tx.insert(notifications).values({
        userId: userRow.id,
        text: `🏆 Hadiah '${ach.title}' diklaim! +${addXp} XP & +${addGems} Gems!`,
        type: "system",
        read: false,
      });
    });

    return UserRepository.getFullProfile(userId);
  }

  static async claimQuest(userId: string, questId?: string) {
    await db.transaction(async (tx) => {
      const [userRow] = await tx.select().from(users).where(eq(users.uid, userId)).for("update");
      if (!userRow) throw new Error("Pengguna tidak ditemukan.");

      const dailyQuests = safeParse<any[]>(userRow.dailyQuests, []);
      let questFound = false;
      let xpReward = 0;
      let gemsReward = 0;

      if (questId) {
        const q = dailyQuests.find((item: any) => item.id === questId);
        if (q) {
          if (q.claimed) throw new Error("Quest sudah diklaim.");
          if (!q.completed) throw new Error("Quest belum selesai.");
          q.claimed = true;
          xpReward = q.xpReward || 50;
          gemsReward = q.gemsReward || 10;
          questFound = true;
        }
      } else {
        const q = dailyQuests.find((item: any) => !item.claimed && item.completed);
        if (q) {
          q.claimed = true;
          xpReward = q.xpReward || 50;
          gemsReward = q.gemsReward || 10;
          questFound = true;
        }
      }

      if (!questFound) {
        throw new Error("Quest tidak ditemukan atau tidak memenuhi syarat untuk klaim.");
      }

      const newXp = userRow.xp + xpReward;
      const newGems = userRow.gems + gemsReward;
      const newLevel = Math.floor(newXp / 500) + 1;

      await tx.update(users).set({
        xp: newXp,
        gems: newGems,
        level: newLevel,
        dailyQuests: dailyQuests,
        updatedAt: new Date(),
      }).where(eq(users.id, userRow.id));

      await tx.insert(walletLedger).values({
        userId: userRow.id,
        currency: "gems",
        delta: gemsReward,
        balanceAfter: newGems,
        reason: "Klaim Quest Harian",
        referenceId: questId || "daily_quest",
      });

      await tx.insert(notifications).values({
        userId: userRow.id,
        text: `🎁 Berhasil mengklaim hadiah quest! +${xpReward} XP, +${gemsReward} Gems.`,
        type: "system",
        read: false,
      });
    });

    return UserRepository.getFullProfile(userId);
  }

  static async getLeaderboard(userId: string) {
    return UserRepository.getLeaderboard(userId);
  }

  static async addXp(userId: string, xpAmount: number) {
    const safeAmount = Math.min(Math.max(1, Math.floor(xpAmount)), MAX_SINGLE_XP_AWARD);
    const todayStr = getJakartaDateStr();

    await db.transaction(async (tx) => {
      const [userRow] = await tx.select().from(users).where(eq(users.uid, userId)).for("update");
      if (!userRow) throw new Error("Pengguna tidak ditemukan.");

      const alreadyEarnedToday = userRow.lastQuizXpDate === todayStr ? (userRow.dailyQuizXpCount || 0) : 0;
      const remainingAllowance = MAX_DAILY_MANUAL_XP - alreadyEarnedToday;
      if (remainingAllowance <= 0) {
        throw new Error(`Batas maksimum ${MAX_DAILY_MANUAL_XP} XP latihan harian telah tercapai. Kembali lagi besok!`);
      }

      const awarded = Math.min(safeAmount, remainingAllowance);
      const newXp = userRow.xp + awarded;
      const newLevel = Math.floor(newXp / 500) + 1;

      const updates: Partial<typeof users.$inferInsert> = {
        xp: newXp,
        weeklyXp: userRow.weeklyXp + awarded,
        level: newLevel,
        dailyQuizXpCount: alreadyEarnedToday + awarded,
        lastQuizXpDate: todayStr,
        updatedAt: new Date(),
      };

      await tx.update(users).set(updates).where(eq(users.id, userRow.id));

      if (newLevel > userRow.level) {
        await tx.insert(notifications).values({
          userId: userRow.id,
          text: `🎉 Selamat! Level Anda naik ke Level ${newLevel}!`,
          type: "system",
          read: false,
        });
      }
    });

    return UserRepository.getFullProfile(userId);
  }

  static async buyFreeze(userId: string) {
    return UserService.buyItem(userId, "streak-freeze");
  }

  static async setAvatar(userId: string, avatar: string) {
    const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Siswa");
    if (!avatar || typeof avatar !== "string") {
      throw new Error("Avatar tidak valid.");
    }
    const unlockedAvatars = safeParse<string[]>(userRow.unlockedAvatars, ["🦁"]);
    if (!unlockedAvatars.includes(avatar)) {
      throw new Error("Aksi ditolak: Avatar belum dibuka. Beli avatar ini di Toko Skillora terlebih dahulu.");
    }
    await UserRepository.updateUserRow(userRow.id, {
      avatar,
      updatedAt: new Date(),
    });
    return UserRepository.getFullProfile(userId);
  }

  static async addSkill(userId: string, skillName: string) {
    const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Siswa");
    if (skillName) {
      const skills = safeParse<any[]>(userRow.skills, ["React", "HTML5", "CSS3", "JavaScript"]);

      if (!skills.some((s: any) => (typeof s === "string" ? s : s.name).toLowerCase() === skillName.toLowerCase())) {
        skills.push({ name: skillName, level: "Menengah" });
        await UserRepository.updateUserRow(userRow.id, {
          skills: skills,
          updatedAt: new Date(),
        });
      }
    }
    return UserRepository.getFullProfile(userId);
  }

  static async syncUser(userId: string, data: any) {
    const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Siswa");

    if (data && typeof data === "object") {
      const profileData = data.profile || data;

      // Security check: Block restricted fields
      const forbiddenKeys = [
        "role",
        "accountRole",
        "subscriptionTier",
        "certCredits",
        "isDevMode",
        "xp",
        "gems",
        "certificates",
        "certifiedCourses",
        "achievement",
        "careerStage",
        "id",
      ];
      for (const key of forbiddenKeys) {
        if (profileData && profileData[key] !== undefined) {
          throw new Error("Aksi ditolak: Anda tidak diizinkan memodifikasi parameter sistem.");
        }
      }

      const updates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };

      if (profileData.name && typeof profileData.name === "string") {
        updates.name = profileData.name.trim();
      }
      if (profileData.email && typeof profileData.email === "string") {
        updates.email = profileData.email.trim();
      }

      await UserRepository.updateUserRow(userRow.id, updates);
    }

    return UserRepository.getFullProfile(userId);
  }
}
