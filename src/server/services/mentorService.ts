import * as crypto from "crypto";
import { db } from "../../db/index.js";
import {
  projectSubmissions,
  users,
  courses,
  certificates,
  mentoringSlots,
  mentoringBookings,
  walletLedger,
  notifications,
} from "../../db/schema.js";
import { ensureSeeded } from "../db/seedData.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { NotificationRepository } from "../repositories/NotificationRepository.js";
import { eq, and, desc } from "drizzle-orm";
import { safeParse } from "../../utils/safeJson.js";

export class MentorService {
  static async getSubmissionsQueue() {
    await ensureSeeded();
    const subs = await db.select().from(projectSubmissions).orderBy(desc(projectSubmissions.submittedAt));
    const allUsers = await db.select().from(users);
    const allCourses = await db.select().from(courses);

    const userMap = new Map(allUsers.map((u) => [u.id, u]));
    const courseMap = new Map(allCourses.map((c) => [c.courseId, c]));

    return subs.map((s) => {
      const student = userMap.get(s.userId);
      const course = courseMap.get(s.courseId);
      return {
        id: s.id,
        courseId: s.courseId,
        courseTitle: course?.title || s.courseId,
        projectTitle: course?.projectTitle || "Proyek Portofolio",
        projectUrl: s.projectUrl,
        studentCodeNotes: s.studentCodeNotes || "",
        status: s.status,
        score: s.score,
        strengths: safeParse<string[]>(s.strengths, []),
        weaknesses: safeParse<string[]>(s.weaknesses, []),
        feedback: s.feedback || "",
        earnedCertificateId: s.earnedCertificateId || null,
        submittedAt: s.submittedAt ? s.submittedAt.toISOString() : new Date().toISOString(),
        reviewedAt: s.reviewedAt ? s.reviewedAt.toISOString() : null,
        student: student
          ? {
              id: student.id,
              name: student.name,
              email: student.email,
              avatar: student.avatar || "🦁",
              level: student.level,
            }
          : null,
      };
    });
  }

  static async reviewSubmission(
    mentorUid: string,
    submissionId: number,
    data: { score: number; status: "PASS" | "RETRY"; feedback: string; strengths?: string[]; weaknesses?: string[] }
  ) {
    const mentorRow = await UserRepository.getOrCreateUser(mentorUid, "mentor@skillora.app", "Mentor");
    const numericScore = Math.max(0, Math.min(100, Number(data.score) || 0));
    const finalStatus = data.status === "PASS" || numericScore >= 75 ? "PASS" : "RETRY";

    return await db.transaction(async (tx) => {
      const [sub] = await tx
        .select()
        .from(projectSubmissions)
        .where(eq(projectSubmissions.id, submissionId))
        .for("update");
      if (!sub) throw new Error("Submission proyek tidak ditemukan.");

      const [student] = await tx.select().from(users).where(eq(users.id, sub.userId)).for("update");
      if (!student) throw new Error("Mahasiswa pemilik submission tidak ditemukan.");

      const course = await tx.query.courses.findFirst({ where: eq(courses.courseId, sub.courseId) });

      let certId = sub.earnedCertificateId;
      let verificationCode: string | null = null;

      if (finalStatus === "PASS" && !certId) {
        certId = crypto.randomBytes(16).toString("hex");
        verificationCode = `SKILLORA-MENTOR-2026-${sub.courseId.toUpperCase().slice(0, 4)}-${crypto
          .randomBytes(3)
          .toString("hex")
          .toUpperCase()}`;

        await tx.insert(certificates).values({
          certificateId: certId,
          userId: student.id,
          courseId: sub.courseId,
          recipientName: student.name || "Lulusan Skillora",
          score: numericScore,
          verificationCode,
          projectSubmissionId: sub.id,
        });

        const certifiedCourses = safeParse<string[]>(student.certifiedCourses, []);
        if (!certifiedCourses.includes(sub.courseId)) {
          certifiedCourses.push(sub.courseId);
        }

        const bonusXp = course?.xpReward || 300;
        const bonusGems = 100;
        const newXp = student.xp + bonusXp;
        const newGems = student.gems + bonusGems;

        await tx
          .update(users)
          .set({
            certifiedCourses,
            xp: newXp,
            gems: newGems,
            level: Math.floor(newXp / 500) + 1,
            careerStage: "certified",
            updatedAt: new Date(),
          })
          .where(eq(users.id, student.id));

        await tx.insert(walletLedger).values({
          userId: student.id,
          currency: "gems",
          delta: bonusGems,
          balanceAfter: newGems,
          reason: `Kelulusan Proyek Mentor: ${course?.title || sub.courseId}`,
          referenceId: certId,
        });
      }

      const [updated] = await tx
        .update(projectSubmissions)
        .set({
          status: finalStatus,
          score: numericScore,
          feedback: data.feedback?.trim() || `Dinilai oleh ${mentorRow.name}`,
          strengths: Array.isArray(data.strengths) ? data.strengths : safeParse<string[]>(sub.strengths, []),
          weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : safeParse<string[]>(sub.weaknesses, []),
          mentorReviewerId: mentorRow.id,
          earnedCertificateId: certId || null,
          reviewedAt: new Date(),
        })
        .where(eq(projectSubmissions.id, sub.id))
        .returning();

      await tx.insert(notifications).values({
        userId: student.id,
        text:
          finalStatus === "PASS"
            ? `🎓 Mentor ${mentorRow.name} meluluskan proyek '${course?.title || sub.courseId}' (Skor ${numericScore}/100)! Sertifikat resmi diterbitkan.`
            : `📝 Mentor ${mentorRow.name} memberi catatan revisi pada proyek '${course?.title || sub.courseId}' (Skor ${numericScore}/100).`,
        type: "certification",
        read: false,
      });

      return updated;
    });
  }

  static async getMentoringSlots(userId?: string) {
    await ensureSeeded();
    const slots = await db.select().from(mentoringSlots).orderBy(desc(mentoringSlots.id));

    let bookedSlotIds = new Set<number>();
    if (userId) {
      const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Pengguna");
      const myBookings = await db
        .select()
        .from(mentoringBookings)
        .where(eq(mentoringBookings.studentUserId, userRow.id));
      bookedSlotIds = new Set(myBookings.map((b) => b.slotId));
    }

    return slots.map((s) => ({
      id: s.slotId,
      dbId: s.id,
      mentorUserId: s.mentorUserId,
      mentorName: s.mentorName,
      mentorRole: s.mentorRole,
      mentorCompany: s.mentorCompany,
      mentorAvatar: s.mentorAvatar,
      topic: s.topic,
      scheduleLabel: s.scheduleLabel,
      durationMinutes: s.durationMinutes,
      priceGems: s.priceGems,
      maxQuota: s.maxQuota,
      bookedCount: s.bookedCount,
      status: s.bookedCount >= s.maxQuota ? "full" : s.status,
      isBookedByMe: bookedSlotIds.has(s.id),
    }));
  }

  static async createMentoringSlot(
    mentorUid: string,
    data: {
      topic: string;
      scheduleLabel: string;
      durationMinutes?: number;
      priceGems?: number;
      maxQuota?: number;
      mentorCompany?: string;
    }
  ) {
    if (!data.topic?.trim() || !data.scheduleLabel?.trim()) {
      throw new Error("Topik dan jadwal sesi mentoring wajib diisi.");
    }
    const mentorRow = await UserRepository.getOrCreateUser(mentorUid, "mentor@skillora.app", "Mentor Skillora");

    const [created] = await db
      .insert(mentoringSlots)
      .values({
        slotId: `ms_${Date.now()}`,
        mentorUserId: mentorRow.id,
        mentorName: mentorRow.name,
        mentorRole: mentorRow.mentorHeadline || mentorRow.role || "Mentor Industri",
        mentorCompany: data.mentorCompany?.trim() || "Skillora Mentor Network",
        mentorAvatar: mentorRow.avatar || "👨‍🏫",
        topic: data.topic.trim(),
        scheduleLabel: data.scheduleLabel.trim(),
        durationMinutes: Number(data.durationMinutes) || 45,
        priceGems: Math.max(0, Number(data.priceGems) || 0),
        maxQuota: Math.max(1, Number(data.maxQuota) || 5),
        bookedCount: 0,
        status: "open",
      })
      .returning();

    return created;
  }

  static async bookMentoringSlot(studentUid: string, slotIdStr: string, notes?: string) {
    return await db.transaction(async (tx) => {
      const [student] = await tx.select().from(users).where(eq(users.uid, studentUid)).for("update");
      if (!student) throw new Error("Pengguna tidak ditemukan.");

      const [slot] = await tx.select().from(mentoringSlots).where(eq(mentoringSlots.slotId, slotIdStr)).for("update");
      if (!slot) throw new Error("Jadwal mentoring tidak ditemukan.");

      if (slot.bookedCount >= slot.maxQuota || slot.status !== "open") {
        throw new Error("Kuota sesi mentoring ini sudah penuh.");
      }

      const existing = await tx
        .select()
        .from(mentoringBookings)
        .where(and(eq(mentoringBookings.slotId, slot.id), eq(mentoringBookings.studentUserId, student.id)))
        .limit(1);
      if (existing.length > 0) {
        throw new Error("Anda sudah memesan sesi mentoring ini.");
      }

      if (slot.priceGems > 0) {
        if (student.gems < slot.priceGems) {
          throw new Error(`Gems tidak cukup! Membutuhkan ${slot.priceGems} Gems untuk sesi ini.`);
        }
        const newGems = student.gems - slot.priceGems;
        await tx.update(users).set({ gems: newGems, updatedAt: new Date() }).where(eq(users.id, student.id));
        await tx.insert(walletLedger).values({
          userId: student.id,
          currency: "gems",
          delta: -slot.priceGems,
          balanceAfter: newGems,
          reason: `Booking Mentoring: ${slot.topic}`,
          referenceId: slot.slotId,
        });
      }

      const nextCount = slot.bookedCount + 1;
      await tx
        .update(mentoringSlots)
        .set({
          bookedCount: nextCount,
          status: nextCount >= slot.maxQuota ? "full" : "open",
        })
        .where(eq(mentoringSlots.id, slot.id));

      const [booking] = await tx
        .insert(mentoringBookings)
        .values({
          slotId: slot.id,
          studentUserId: student.id,
          notes: notes?.trim() || "Ingin berkonsultasi mengenai kesiapan karir & portofolio.",
          meetingLink: `https://meet.skillora.id/${slot.slotId}-${student.id}`,
          status: "confirmed",
        })
        .returning();

      await tx.insert(notifications).values({
        userId: student.id,
        text: `📅 Booking mentoring bersama ${slot.mentorName} (${slot.scheduleLabel}) berhasil dikonfirmasi!`,
        type: "system",
        read: false,
      });

      return booking;
    }).then(async (booking) => ({
      booking,
      profile: await UserRepository.getFullProfile(studentUid),
    }));
  }

  static async getMyBookings(userId: string) {
    await ensureSeeded();
    const userRow = await UserRepository.getOrCreateUser(userId, "user@skillora.app", "Pengguna");
    const allBookings = await db.select().from(mentoringBookings).orderBy(desc(mentoringBookings.createdAt));
    const allSlots = await db.select().from(mentoringSlots);
    const allUsers = await db.select().from(users);

    const slotMap = new Map(allSlots.map((s) => [s.id, s]));
    const userMap = new Map(allUsers.map((u) => [u.id, u]));

    const relevant = allBookings.filter((b) => {
      const slot = slotMap.get(b.slotId);
      if (userRow.accountRole === "mentor") {
        return slot?.mentorUserId === userRow.id || !slot?.mentorUserId;
      }
      if (userRow.accountRole === "admin") return true;
      return b.studentUserId === userRow.id;
    });

    return relevant.map((b) => {
      const slot = slotMap.get(b.slotId);
      const student = userMap.get(b.studentUserId);
      return {
        id: b.id,
        slotId: slot?.slotId || "",
        topic: slot?.topic || "",
        scheduleLabel: slot?.scheduleLabel || "",
        mentorName: slot?.mentorName || "",
        mentorCompany: slot?.mentorCompany || "",
        studentName: student?.name || "Mahasiswa",
        studentEmail: student?.email || "",
        notes: b.notes || "",
        mentorNotes: b.mentorNotes || "",
        meetingLink: b.meetingLink || "",
        status: b.status,
        createdAt: b.createdAt ? b.createdAt.toISOString() : new Date().toISOString(),
      };
    });
  }

  static async updateBooking(
    mentorUid: string,
    bookingId: number,
    data: { status?: string; mentorNotes?: string; meetingLink?: string }
  ) {
    const [existing] = await db.select().from(mentoringBookings).where(eq(mentoringBookings.id, bookingId));
    if (!existing) throw new Error("Data booking tidak ditemukan.");

    const mentorRow = await UserRepository.getOrCreateUser(mentorUid, "mentor@skillora.app", "Mentor");
    const isAdmin = mentorRow.accountRole === "admin" || ["Admin", "Developer"].includes(mentorRow.role);
    const [slot] = await db.select().from(mentoringSlots).where(eq(mentoringSlots.id, existing.slotId));

    if (!isAdmin && slot?.mentorUserId && slot.mentorUserId !== mentorRow.id) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin untuk mengubah booking mentor lain.");
    }

    const [updated] = await db
      .update(mentoringBookings)
      .set({
        status: data.status || existing.status,
        mentorNotes: data.mentorNotes !== undefined ? data.mentorNotes : existing.mentorNotes,
        meetingLink: data.meetingLink !== undefined ? data.meetingLink : existing.meetingLink,
      })
      .where(eq(mentoringBookings.id, bookingId))
      .returning();

    await NotificationRepository.addNotification(
      updated.studentUserId,
      `📌 Sesi mentoring Anda diperbarui (${updated.status}). Cek tautan & catatan mentor di menu Mentoring.`
    );
    return updated;
  }
}
