import { db } from "../../db/index.js";
import { arenaMatches, questionsBank, tryoutAttempts, users, walletLedger } from "../../db/schema.js";
import { desc, eq } from "drizzle-orm";
import { UserRepository } from "../repositories/UserRepository.js";
import { NotificationRepository } from "../repositories/NotificationRepository.js";
import { ensureSeeded } from "../db/seedData.js";

const LEAGUE_TIERS = [
  { id: "bronze", label: "Bronze", minXp: 0 },
  { id: "silver", label: "Silver", minXp: 250 },
  { id: "gold", label: "Gold", minXp: 600 },
  { id: "platinum", label: "Platinum", minXp: 1100 },
  { id: "grandmaster", label: "Grandmaster", minXp: 1800 },
];

export function resolveTierFromXp(weeklyXp: number): string {
  if (weeklyXp >= 1800) return "grandmaster";
  if (weeklyXp >= 1100) return "platinum";
  if (weeklyXp >= 600) return "gold";
  if (weeklyXp >= 250) return "silver";
  return "bronze";
}

const TRYOUT_CATALOG = [
  {
    id: "to-tkd-bumn",
    title: "Tryout Akbar TKD & AKHLAK BUMN",
    category: "TKD BUMN",
    durationMinutes: 15,
    description: "Simulasi standar Rekrutmen Bersama BUMN meliputi Penalaran Verbal, Deret Numerik, Silogisme, dan Core Values AKHLAK.",
    xpReward: 220,
  },
  {
    id: "to-tech-fullstack",
    title: "Tryout Kesiapan Frontend & Backend Engineering",
    category: "React & Frontend",
    durationMinutes: 15,
    description: "Uji ketepatan arsitektur React, manajemen state, optimasi PostgreSQL, dan etika rekayasa perangkat lunak.",
    xpReward: 240,
  },
  {
    id: "to-mixed-readiness",
    title: "Tryout Nasional Kesiapan Kerja Fresh Graduate",
    category: "Semua",
    durationMinutes: 20,
    description: "Paket komprehensif gabungan logika TKD, Situational Judgment, Frontend, dan Backend SQL.",
    xpReward: 280,
  },
];

export class ArenaService {
  static async getLeagueOverview(uid: string, filterTier?: string) {
    await ensureSeeded();
    const userRow = await UserRepository.getOrCreateUser(uid);
    const allUsers = await db.select().from(users);

    const myTier = resolveTierFromXp(userRow.weeklyXp || 0);
    const activeTier = filterTier && LEAGUE_TIERS.some((t) => t.id === filterTier) ? filterTier : myTier;

    const sortedAll = [...allUsers].sort((a, b) => (b.weeklyXp || 0) - (a.weeklyXp || 0) || b.xp - a.xp);
    const tierUsers = sortedAll.filter((u) => resolveTierFromXp(u.weeklyXp || 0) === activeTier);
    const displayList = tierUsers.length >= 3 ? tierUsers : sortedAll;

    const totalCount = displayList.length;
    const promoteCutoff = Math.max(1, Math.ceil(totalCount * 0.3));
    const relegateCutoff = totalCount >= 5 ? Math.floor(totalCount * 0.8) : totalCount + 1;

    const standings = displayList.slice(0, 25).map((u, idx) => {
      const rank = idx + 1;
      const zone: "promote" | "safe" | "relegate" =
        rank <= promoteCutoff ? "promote" : rank > relegateCutoff ? "relegate" : "safe";
      return {
        rank,
        name: u.name,
        avatar: u.avatar || "🦁",
        level: u.level,
        weeklyXp: u.weeklyXp || 0,
        totalXp: u.xp,
        campusName: u.campusName || null,
        leagueTier: resolveTierFromXp(u.weeklyXp || 0),
        zone,
        isCurrentUser: u.id === userRow.id,
      };
    });

    const myRankIdx = sortedAll.findIndex((u) => u.id === userRow.id);
    const tierIdx = LEAGUE_TIERS.findIndex((t) => t.id === myTier);
    const nextTier = tierIdx >= 0 && tierIdx < LEAGUE_TIERS.length - 1 ? LEAGUE_TIERS[tierIdx + 1].label : null;

    // Days until next Monday reset
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun..6=Sat
    const daysRemaining = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

    return {
      currentTier: myTier,
      activeTier,
      nextTier,
      myRank: myRankIdx >= 0 ? myRankIdx + 1 : 1,
      myWeeklyXp: userRow.weeklyXp || 0,
      daysRemaining,
      tiers: LEAGUE_TIERS,
      standings,
    };
  }

  static async listTryouts(uid: string) {
    await ensureSeeded();
    const userRow = await UserRepository.getOrCreateUser(uid);
    const allQuestions = await db.select().from(questionsBank);
    const attempts = await db
      .select()
      .from(tryoutAttempts)
      .where(eq(tryoutAttempts.userId, userRow.id))
      .orderBy(desc(tryoutAttempts.createdAt));

    return TRYOUT_CATALOG.map((pkg) => {
      const matching =
        pkg.category === "Semua"
          ? allQuestions
          : pkg.category === "React & Frontend"
          ? allQuestions.filter((q) => q.category === "React & Frontend" || q.category === "Backend & SQL")
          : allQuestions.filter((q) => q.category === pkg.category || q.category === "Situational Judgment");

      const selected = matching.slice(0, 10);
      const last = attempts.find((a) => a.tryoutId === pkg.id);

      return {
        ...pkg,
        questionCount: selected.length,
        questions: selected.map((q) => ({
          id: String(q.id),
          prompt: q.prompt,
          options: Array.isArray(q.options) ? (q.options as string[]) : [],
          competencyTag: q.competencyTag,
        })),
        lastAttempt: last
          ? {
              id: last.id,
              tryoutId: last.tryoutId,
              title: last.title,
              category: last.category,
              score: last.score,
              maxScore: last.maxScore,
              correctCount: last.correctCount,
              totalQuestions: last.totalQuestions,
              subtestScores: Array.isArray(last.subtestScores) ? last.subtestScores : [],
              durationSeconds: last.durationSeconds,
              percentile: last.percentile,
              createdAt: last.createdAt ? last.createdAt.toISOString() : new Date().toISOString(),
            }
          : null,
      };
    });
  }

  static async submitTryout(
    uid: string,
    payload: {
      tryoutId: string;
      answers: Record<string, number>;
      durationSeconds: number;
    }
  ) {
    await ensureSeeded();
    const userRow = await UserRepository.getOrCreateUser(uid);
    const pkg = TRYOUT_CATALOG.find((p) => p.id === payload.tryoutId);
    if (!pkg) {
      throw new Error("Paket Tryout tidak ditemukan.");
    }

    const allQuestions = await db.select().from(questionsBank);
    const matching =
      pkg.category === "Semua"
        ? allQuestions
        : pkg.category === "React & Frontend"
        ? allQuestions.filter((q) => q.category === "React & Frontend" || q.category === "Backend & SQL")
        : allQuestions.filter((q) => q.category === pkg.category || q.category === "Situational Judgment");

    const selected = matching.slice(0, 10);
    const answers = payload.answers || {};

    let correctCount = 0;
    const topicMap = new Map<string, { correct: number; total: number }>();
    const reviewItems: Array<{
      id: string;
      prompt: string;
      selectedOption: number;
      correctOption: number;
      isCorrect: boolean;
      explanation: string;
      competencyTag: string;
    }> = [];

    for (const q of selected) {
      const qId = String(q.id);
      const selectedIdx = typeof answers[qId] === "number" ? answers[qId] : -1;
      const isCorrect = selectedIdx === q.answerIndex;
      if (isCorrect) correctCount += 1;

      const bucket = topicMap.get(q.competencyTag) || { correct: 0, total: 0 };
      bucket.total += 1;
      if (isCorrect) bucket.correct += 1;
      topicMap.set(q.competencyTag, bucket);

      reviewItems.push({
        id: qId,
        prompt: q.prompt,
        selectedOption: selectedIdx,
        correctOption: q.answerIndex,
        isCorrect,
        explanation: q.explanation,
        competencyTag: q.competencyTag,
      });
    }

    const totalQuestions = selected.length || 1;
    const score = Math.round((correctCount / totalQuestions) * 100);
    const subtestScores = Array.from(topicMap.entries()).map(([topic, stat]) => ({
      topic,
      correct: stat.correct,
      total: stat.total,
      accuracy: Math.round((stat.correct / stat.total) * 100),
    }));

    // Compute real percentile against all stored attempts for this tryout
    const prevAttempts = await db
      .select({ score: tryoutAttempts.score })
      .from(tryoutAttempts)
      .where(eq(tryoutAttempts.tryoutId, pkg.id));

    let percentile = 50;
    if (prevAttempts.length === 0) {
      percentile = Math.min(99, Math.max(15, score));
    } else {
      const lowerOrEq = prevAttempts.filter((a) => a.score <= score).length;
      percentile = Math.min(99, Math.max(5, Math.round((lowerOrEq / prevAttempts.length) * 100)));
    }

    const [inserted] = await db
      .insert(tryoutAttempts)
      .values({
        userId: userRow.id,
        tryoutId: pkg.id,
        title: pkg.title,
        category: pkg.category,
        score,
        maxScore: 100,
        correctCount,
        totalQuestions,
        subtestScores,
        durationSeconds: Math.max(1, Math.round(payload.durationSeconds || 60)),
        percentile,
      })
      .returning();

    const earnedXp = Math.max(40, Math.round((score / 100) * pkg.xpReward));
    const earnedGems = score >= 70 ? 20 : 5;
    const newXp = userRow.xp + earnedXp;
    const newWeeklyXp = (userRow.weeklyXp || 0) + earnedXp;
    const newGems = userRow.gems + earnedGems;
    const newLevel = Math.max(userRow.level, Math.floor(newXp / 500) + 1);

    await db
      .update(users)
      .set({
        xp: newXp,
        weeklyXp: newWeeklyXp,
        gems: newGems,
        level: newLevel,
        leagueTier: resolveTierFromXp(newWeeklyXp),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userRow.id));

    await db.insert(walletLedger).values({
      userId: userRow.id,
      currency: "gems",
      delta: earnedGems,
      balanceAfter: newGems,
      reason: `Selesai ${pkg.title} (Skor ${score})`,
      referenceId: `tryout_${inserted.id}`,
    });

    await NotificationRepository.addNotification(
      userRow.id,
      `Tryout "${pkg.title}" selesai dengan skor ${score}/100 (Persentil ${percentile}%). +${earnedXp} XP!`,
      "reward"
    );

    const profile = await UserRepository.getFullProfile(uid);

    return {
      attempt: {
        id: inserted.id,
        tryoutId: inserted.tryoutId,
        title: inserted.title,
        category: inserted.category,
        score: inserted.score,
        maxScore: inserted.maxScore,
        correctCount: inserted.correctCount,
        totalQuestions: inserted.totalQuestions,
        subtestScores,
        durationSeconds: inserted.durationSeconds,
        percentile: inserted.percentile,
        createdAt: inserted.createdAt ? inserted.createdAt.toISOString() : new Date().toISOString(),
      },
      reviewItems,
      earnedXp,
      earnedGems,
      profile,
    };
  }

  static async getRecentMatches() {
    const rows = await db
      .select()
      .from(arenaMatches)
      .orderBy(desc(arenaMatches.finishedAt))
      .limit(10);

    return rows.map((r) => ({
      id: r.id,
      roomCode: r.roomCode,
      topic: r.topic,
      mode: r.mode,
      participants: Array.isArray(r.participants) ? r.participants : [],
      winnerName: r.winnerName,
      questionCount: r.questionCount,
      finishedAt: r.finishedAt ? r.finishedAt.toISOString() : new Date().toISOString(),
    }));
  }
}
