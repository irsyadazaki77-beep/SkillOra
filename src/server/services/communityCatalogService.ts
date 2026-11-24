import { db } from "../../db/index.js";
import { scholarships, events, eventRegistrations, users, notifications } from "../../db/schema.js";
import { ensureSeeded } from "../db/seedData.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { eq, and, desc } from "drizzle-orm";

export class CommunityCatalogService {
  static async getScholarships() {
    await ensureSeeded();
    const list = await db.select().from(scholarships).orderBy(desc(scholarships.id));
    return list.map((s) => ({
      id: s.scholarshipId,
      title: s.title,
      provider: s.provider,
      degree: s.degree,
      coverage: s.coverage,
      deadline: s.deadline,
      location: s.location,
      description: s.description,
      requirements: Array.isArray(s.requirements) ? s.requirements : [],
      applyUrl: s.applyUrl || "#",
    }));
  }

  static async getEvents(userId?: string) {
    await ensureSeeded();
    const list = await db.select().from(events).orderBy(desc(events.id));

    let registeredSet = new Set<number>();
    if (userId) {
      const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Siswa");
      const regs = await db
        .select()
        .from(eventRegistrations)
        .where(eq(eventRegistrations.userId, userRow.id));
      registeredSet = new Set(regs.map((r) => r.eventId));
    }

    return list.map((e) => ({
      id: e.eventId,
      title: e.title,
      speaker: e.speaker,
      speakerRole: e.speakerRole,
      category: e.category,
      dateLabel: e.dateLabel,
      timeLabel: e.timeLabel,
      quota: e.quota,
      registeredCount: e.registeredCount,
      xpReward: e.xpReward,
      description: e.description,
      isRegistered: registeredSet.has(e.id),
    }));
  }

  static async registerEvent(userId: string, eventIdStr: string) {
    await ensureSeeded();
    return await db.transaction(async (tx) => {
      const [userRow] = await tx.select().from(users).where(eq(users.uid, userId)).for("update");
      if (!userRow) throw new Error("Pengguna tidak ditemukan.");

      const [evt] = await tx.select().from(events).where(eq(events.eventId, eventIdStr)).for("update");
      if (!evt) throw new Error("Event webinar tidak ditemukan.");

      const existing = await tx
        .select()
        .from(eventRegistrations)
        .where(and(eq(eventRegistrations.eventId, evt.id), eq(eventRegistrations.userId, userRow.id)))
        .limit(1);

      if (existing.length > 0) {
        throw new Error("Anda sudah terdaftar pada webinar ini.");
      }

      if (evt.registeredCount >= evt.quota) {
        throw new Error("Kuota peserta webinar sudah penuh.");
      }

      await tx.insert(eventRegistrations).values({
        eventId: evt.id,
        userId: userRow.id,
      });

      await tx
        .update(events)
        .set({ registeredCount: evt.registeredCount + 1 })
        .where(eq(events.id, evt.id));

      const bonusXp = 25;
      const newXp = userRow.xp + bonusXp;
      await tx
        .update(users)
        .set({
          xp: newXp,
          level: Math.floor(newXp / 500) + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userRow.id));

      await tx.insert(notifications).values({
        userId: userRow.id,
        text: `🎟️ Tiket terkonfirmasi untuk '${evt.title}' (${evt.dateLabel}). +${bonusXp} XP ditambahkan!`,
        type: "system",
        read: false,
      });

      return {
        events: await CommunityCatalogService.getEvents(userId),
        profile: await UserRepository.getFullProfile(userId),
      };
    });
  }
}
