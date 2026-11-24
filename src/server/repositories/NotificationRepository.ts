import { db } from "../../db/index.js";
import { notifications } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";

export class NotificationRepository {
  static async getNotifications(dbUserId: number) {
    const rows = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, dbUserId))
      .orderBy(desc(notifications.id));

    return rows.map(r => ({
      id: `n_${r.id}`,
      text: r.text,
      time: r.createdAt ? NotificationRepository.formatTime(r.createdAt) : "Baru saja",
      type: r.type,
      read: r.read
    }));
  }

  static async addNotification(dbUserId: number, text: string, type = "system") {
    const [inserted] = await db.insert(notifications).values({
      userId: dbUserId,
      text,
      type
    }).returning();
    return inserted;
  }

  static async clearNotifications(dbUserId: number) {
    await db.delete(notifications).where(eq(notifications.userId, dbUserId));
  }

  private static formatTime(date: Date): string {
    const diff = Date.now() - date.getTime();
    if (diff < 60 * 1000) return "Baru saja";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} menit yang lalu`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} jam yang lalu`;
    return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  }
}