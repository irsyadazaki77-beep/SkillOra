import { db } from "../../db/index.js";
import { peerReviews, projectSubmissions, users, notifications } from "../../db/schema.js";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { UserRepository } from "../repositories/UserRepository.js";

const DAILY_PEER_REVIEW_XP_CAP = 225; // max 3 rewarded reviews/day * 75 XP

function computeLeagueTier(weeklyXp: number): string {
  if (weeklyXp >= 1800) return "grandmaster";
  if (weeklyXp >= 1100) return "platinum";
  if (weeklyXp >= 600) return "gold";
  if (weeklyXp >= 250) return "silver";
  return "bronze";
}

export class PeerReviewService {
  static async getQueue(uid: string) {
    const me = await UserRepository.getOrCreateUser(uid);

    const candidateSubs = await db
      .select({
        id: projectSubmissions.id,
        userId: projectSubmissions.userId,
        courseId: projectSubmissions.courseId,
        projectUrl: projectSubmissions.projectUrl,
        studentNotes: projectSubmissions.studentCodeNotes,
        status: projectSubmissions.status,
        score: projectSubmissions.score,
        submittedAt: projectSubmissions.submittedAt,
        authorName: users.name,
      })
      .from(projectSubmissions)
      .innerJoin(users, eq(projectSubmissions.userId, users.id))
      .where(ne(projectSubmissions.userId, me.id))
      .orderBy(desc(projectSubmissions.submittedAt))
      .limit(20);

    const myGiven = await db
      .select({ submissionId: peerReviews.submissionId })
      .from(peerReviews)
      .where(eq(peerReviews.reviewerUserId, me.id));
    const reviewedIds = new Set(myGiven.map((r) => r.submissionId));

    const queue = candidateSubs
      .filter((s) => !reviewedIds.has(s.id))
      .slice(0, 8)
      .map((s) => ({
        submissionId: s.id,
        courseId: s.courseId,
        projectUrl: s.projectUrl,
        studentNotes: s.studentNotes,
        aiStatus: s.status,
        authorName: s.authorName || "Pembelajar SkillOra",
        submittedAt: s.submittedAt ? s.submittedAt.toISOString() : new Date().toISOString(),
      }));

    const received = await db
      .select({
        id: peerReviews.id,
        score: peerReviews.score,
        feedback: peerReviews.feedback,
        rubricBreakdown: peerReviews.rubricBreakdown,
        createdAt: peerReviews.createdAt,
        courseId: projectSubmissions.courseId,
        reviewerName: users.name,
      })
      .from(peerReviews)
      .innerJoin(projectSubmissions, eq(peerReviews.submissionId, projectSubmissions.id))
      .innerJoin(users, eq(peerReviews.reviewerUserId, users.id))
      .where(eq(projectSubmissions.userId, me.id))
      .orderBy(desc(peerReviews.createdAt))
      .limit(10);

    return {
      queue,
      givenCount: reviewedIds.size,
      received: received.map((r) => ({
        id: r.id,
        courseId: r.courseId,
        score: r.score,
        feedback: r.feedback,
        rubricBreakdown: Array.isArray(r.rubricBreakdown) ? r.rubricBreakdown : [],
        reviewerName: r.reviewerName || "Rekan Komunitas",
        createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      })),
    };
  }

  static async submitReview(
    uid: string,
    body: {
      submissionId: number;
      score: number;
      rubricBreakdown?: Array<{ criterion: string; score: number }>;
      feedback: string;
    }
  ) {
    const me = await UserRepository.getOrCreateUser(uid);
    const submissionId = Number(body.submissionId);
    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      throw new Error("ID submission proyek tidak valid.");
    }

    const cleanFeedback = typeof body.feedback === "string" ? body.feedback.trim() : "";
    if (cleanFeedback.length < 25) {
      throw new Error("Berikan ulasan konstruktif minimal 25 karakter agar bermanfaat bagi rekan Anda.");
    }

    const boundedScore = Math.max(0, Math.min(100, Math.round(Number(body.score) || 80)));

    const [targetSub] = await db
      .select()
      .from(projectSubmissions)
      .where(eq(projectSubmissions.id, submissionId));

    if (!targetSub) {
      throw new Error("Submission proyek tidak ditemukan.");
    }

    if (targetSub.userId === me.id) {
      throw new Error("Anda tidak dapat mereview proyek milik Anda sendiri.");
    }

    const [existingReview] = await db
      .select()
      .from(peerReviews)
      .where(and(eq(peerReviews.submissionId, submissionId), eq(peerReviews.reviewerUserId, me.id)));

    if (existingReview) {
      throw new Error("Anda sudah pernah memberikan peer review pada proyek ini.");
    }

    await db.insert(peerReviews).values({
      submissionId,
      reviewerUserId: me.id,
      score: boundedScore,
      rubricBreakdown: Array.isArray(body.rubricBreakdown) ? body.rubricBreakdown : [],
      feedback: cleanFeedback,
    });

    // Calculate daily earned peer-review XP
    const [todayRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(peerReviews)
      .where(
        and(
          eq(peerReviews.reviewerUserId, me.id),
          sql`${peerReviews.createdAt} >= date_trunc('day', now())`
        )
      );

    const todayCount = Number(todayRow?.total) || 1;
    const earnedXp = todayCount * 75 <= DAILY_PEER_REVIEW_XP_CAP ? 75 : 0;

    if (earnedXp > 0) {
      const nextXp = (me.xp || 0) + earnedXp;
      const nextWeekly = (me.weeklyXp || 0) + earnedXp;
      await db
        .update(users)
        .set({
          xp: nextXp,
          weeklyXp: nextWeekly,
          leagueTier: computeLeagueTier(nextWeekly),
          updatedAt: new Date(),
        })
        .where(eq(users.id, me.id));
    }

    await db.insert(notifications).values({
      userId: targetSub.userId,
      text: `🔍 Proyek '${targetSub.courseId}' Anda mendapat Peer Review baru dengan skor ${boundedScore}/100.`,
      type: "system",
      read: false,
    });

    const profile = await UserRepository.getFullProfile(uid);
    return {
      earnedXp,
      submissionId,
      score: boundedScore,
      profile,
    };
  }
}
