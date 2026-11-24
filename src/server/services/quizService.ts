import { db } from "../../db/index.js";
import { quizSessions, users, userAchievements, notifications } from "../../db/schema.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { CourseRepository } from "../repositories/CourseRepository.js";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { safeParse } from "../../utils/safeJson.js";
import { fisherYatesShuffle } from "../utils/shuffle.js";

export interface SanitizedQuestion {
  id: string;
  text: string;
  options: string[];
  competencyTag?: string;
  hint?: string;
}

export interface StoredQuestion extends SanitizedQuestion {
  answerIndex: number;
  explanation: string;
}

export class QuizService {
  private static async getAllCourseQuestions(dbUserId: number) {
    const allCourses = await CourseRepository.getCourses(dbUserId, true);
    const list: {
      question: StoredQuestion;
      courseId: string;
      courseTitle: string;
      lessonId: string;
      lessonTitle: string;
      difficulty: string;
    }[] = [];

    for (const c of allCourses) {
      for (const l of c.lessons || []) {
        if (l.questions && Array.isArray(l.questions)) {
          for (const q of l.questions) {
            list.push({
              question: q as StoredQuestion,
              courseId: c.id,
              courseTitle: c.title,
              lessonId: l.id,
              lessonTitle: l.title,
              difficulty: c.difficulty || "Menengah",
            });
          }
        }
      }
    }
    return { allCourses, list };
  }

  static async startSession(
    userId: string,
    params: {
      mode: "lesson" | "quick" | "simulation" | "wrong" | "topic";
      courseId?: string;
      lessonId?: string;
      difficulty?: "Pemula" | "Menengah" | "Sulit";
      questionCount?: number;
      shuffle?: boolean;
    }
  ) {
    const profile = await UserRepository.getFullProfile(userId);
    const { mode, courseId, lessonId, difficulty, questionCount, shuffle } = params;

    let title = "Sesi Latihan Skillora";
    let subtitle = "Uji pemahaman dan asah kompetensi";
    let selectedQuestions: StoredQuestion[] = [];
    let durationSeconds = 300;

    const { allCourses, list: allPool } = await this.getAllCourseQuestions(profile.id);

    if (mode === "lesson" && courseId && lessonId) {
      const course = allCourses.find((c) => c.id === courseId);
      const lesson = course?.lessons?.find((l) => l.id === lessonId);
      if (!course || !lesson) {
        throw new Error("Modul atau materi kuis tidak ditemukan");
      }
      title = `Kuis Modul: ${lesson.title}`;
      subtitle = `${course.title} • ${course.difficulty}`;
      selectedQuestions = (lesson.questions || []) as StoredQuestion[];
      durationSeconds = Math.max(300, selectedQuestions.length * 90);
    } else if (mode === "quick") {
      title = "Latihan Cepat Kilat ⚡";
      subtitle = "5 Soal Campuran Pilihan Ganda";
      let pool = allPool;
      if (difficulty) {
        pool = pool.filter((p) => p.difficulty === difficulty);
        if (pool.length < 5) pool = allPool;
      }
      const shuffled = fisherYatesShuffle(pool);
      selectedQuestions = shuffled.slice(0, questionCount || 5).map((p) => p.question);
      durationSeconds = 180;
    } else if (mode === "simulation") {
      title = "Simulasi Ujian Seleksi Kerja 🎯";
      subtitle = "10 Soal Berbatas Waktu Ketat";
      const shuffled = fisherYatesShuffle(allPool);
      selectedQuestions = shuffled.slice(0, questionCount || 10).map((p) => p.question);
      durationSeconds = 600;
    } else if (mode === "wrong") {
      title = "Bank Evaluasi Jawaban Salah 🔄";
      subtitle = "Latih ulang pemahaman konsep yang keliru";
      const shuffled = fisherYatesShuffle(allPool);
      selectedQuestions = shuffled.slice(0, questionCount || 8).map((p) => p.question);
      durationSeconds = 480;
    } else if (mode === "topic") {
      if (courseId && lessonId) {
        const course = allCourses.find((c) => c.id === courseId);
        const lesson = course?.lessons?.find((l) => l.id === lessonId);
        if (course && lesson && lesson.questions) {
          title = `Latihan Topik: ${lesson.title}`;
          subtitle = `${course.title} • ${course.category}`;
          selectedQuestions = lesson.questions as StoredQuestion[];
        }
      }
      if (selectedQuestions.length === 0) {
        const shuffled = fisherYatesShuffle(allPool);
        selectedQuestions = shuffled.slice(0, questionCount || 5).map((p) => p.question);
      }
      durationSeconds = Math.max(300, selectedQuestions.length * 90);
    }

    if (selectedQuestions.length === 0) {
      selectedQuestions = allPool.slice(0, 5).map((p) => p.question);
    }

    if (shuffle) {
      selectedQuestions = fisherYatesShuffle(selectedQuestions);
    }

    const sessionId = `att_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationSeconds * 1000);

    await db.insert(quizSessions).values({
      sessionId,
      userId: profile.id,
      quizType: mode,
      courseId: courseId || null,
      lessonId: lessonId || null,
      title,
      subtitle,
      difficulty: difficulty || "Menengah",
      questionsData: selectedQuestions,
      answers: {},
      flaggedQuestions: [],
      status: "in_progress",
      durationSeconds,
      startedAt,
      expiresAt,
    });

    const sanitizedQuestions: SanitizedQuestion[] = selectedQuestions.map((q, idx) => ({
      id: q.id || `q_${idx}`,
      text: q.text,
      options: q.options,
      competencyTag: q.competencyTag,
      hint: q.hint,
    }));

    return {
      attemptId: sessionId,
      title,
      subtitle,
      mode,
      difficulty: difficulty || "Menengah",
      courseId,
      lessonId,
      totalQuestions: sanitizedQuestions.length,
      durationSeconds,
      startedAt: startedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      questions: sanitizedQuestions,
      savedAnswers: {},
      flaggedQuestions: [],
    };
  }

  static async getSession(userId: string, attemptId: string) {
    const profile = await UserRepository.getFullProfile(userId);
    const session = await db.query.quizSessions.findFirst({
      where: and(eq(quizSessions.sessionId, attemptId), eq(quizSessions.userId, profile.id)),
    });

    if (!session) {
      throw new Error("Sesi kuis tidak ditemukan atau telah kedaluwarsa.");
    }

    const questions: StoredQuestion[] = safeParse<StoredQuestion[]>(session.questionsData, []);
    const sanitizedQuestions: SanitizedQuestion[] = questions.map((q, idx) => ({
      id: q.id || `q_${idx}`,
      text: q.text,
      options: q.options,
      competencyTag: q.competencyTag,
      hint: q.hint,
    }));

    const savedAnswers = safeParse<any>(session.answers, {});
    const flaggedQuestions = safeParse<number[]>(session.flaggedQuestions, []);

    const now = Date.now();
    const expiresAtMs = session.expiresAt ? new Date(session.expiresAt).getTime() : now + session.durationSeconds * 1000;
    const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));

    return {
      attemptId: session.sessionId,
      title: session.title,
      subtitle: session.subtitle,
      mode: session.quizType,
      difficulty: session.difficulty,
      courseId: session.courseId,
      lessonId: session.lessonId,
      status: session.status,
      totalQuestions: sanitizedQuestions.length,
      durationSeconds: session.durationSeconds,
      remainingSeconds,
      startedAt: session.startedAt.toISOString(),
      expiresAt: session.expiresAt ? session.expiresAt.toISOString() : null,
      questions: sanitizedQuestions,
      savedAnswers,
      flaggedQuestions,
      isExpired: remainingSeconds === 0 && session.status === "in_progress",
    };
  }

  static async saveDraft(
    userId: string,
    attemptId: string,
    answers: Record<string | number, number>,
    flaggedQuestions?: number[]
  ) {
    const profile = await UserRepository.getFullProfile(userId);
    const session = await db.query.quizSessions.findFirst({
      where: and(eq(quizSessions.sessionId, attemptId), eq(quizSessions.userId, profile.id)),
    });

    if (!session) {
      throw new Error("Sesi tidak ditemukan");
    }

    if (session.status !== "in_progress") {
      return { success: true, status: session.status };
    }

    await db
      .update(quizSessions)
      .set({
        answers: answers || {},
        flaggedQuestions: flaggedQuestions || [],
      })
      .where(eq(quizSessions.id, session.id));

    return { success: true, savedAt: new Date().toISOString() };
  }

  static async submitSession(
    userId: string,
    attemptId: string,
    submittedAnswers: Record<string | number, number>,
    timeSpentSeconds?: number
  ) {
    return await db.transaction(async (tx) => {
      const profile = await UserRepository.getFullProfile(userId);
      const [session] = await tx
        .select()
        .from(quizSessions)
        .where(and(eq(quizSessions.sessionId, attemptId), eq(quizSessions.userId, profile.id)))
        .for("update");

      if (!session) {
        throw new Error("Sesi kuis tidak ditemukan.");
      }

      const storedQuestions: StoredQuestion[] = safeParse<StoredQuestion[]>(session.questionsData, []);

      if (session.status === "submitted") {
        const answersMap: Record<string | number, number> = safeParse<Record<string | number, number>>(session.answers, {});
        const answersHistory = storedQuestions.map((q, idx) => {
          const userChoice = answersMap[idx] !== undefined ? answersMap[idx] : -1;
          const isCorrect = userChoice === q.answerIndex;
          return {
            questionIndex: idx,
            questionId: q.id || `q_${idx}`,
            questionText: q.text,
            selectedOption: userChoice,
            correctOption: q.answerIndex,
            isCorrect,
            explanation: q.explanation || "Pembahasan standar untuk materi kompetensi ini.",
            options: q.options,
            competencyTag: q.competencyTag,
          };
        });

        return {
          success: true,
          attemptId: session.sessionId,
          score: session.score || 0,
          passed: !!session.passed,
          correctCount: session.correctCount || 0,
          wrongCount: session.wrongCount || 0,
          unansweredCount: storedQuestions.length - ((session.correctCount || 0) + (session.wrongCount || 0)),
          totalQuestions: storedQuestions.length,
          earnedXp: session.earnedXp || 0,
          earnedGems: session.earnedGems || 0,
          durationSeconds: session.durationSeconds,
          timeSpentSeconds: timeSpentSeconds || session.durationSeconds,
          leveledUp: false,
          profile,
          answersHistory,
        };
      }

      const [userRow] = await tx.select().from(users).where(eq(users.id, profile.id)).for("update");
      if (!userRow) {
        throw new Error("Pengguna tidak ditemukan.");
      }

      const answersMap = submittedAnswers || safeParse<Record<string | number, number>>(session.answers, {});
      let correctCount = 0;
      let wrongCount = 0;
      let unansweredCount = 0;

      const answersHistory = storedQuestions.map((q, idx) => {
        const userChoice = answersMap[idx] !== undefined ? Number(answersMap[idx]) : -1;
        if (userChoice === -1) {
          unansweredCount++;
          wrongCount++;
        } else if (userChoice === q.answerIndex) {
          correctCount++;
        } else {
          wrongCount++;
        }

        const isCorrect = userChoice === q.answerIndex;
        return {
          questionIndex: idx,
          questionId: q.id || `q_${idx}`,
          questionText: q.text,
          selectedOption: userChoice,
          correctOption: q.answerIndex,
          isCorrect,
          explanation: q.explanation || "Pembahasan standar untuk materi kompetensi ini.",
          options: q.options,
          competencyTag: q.competencyTag,
        };
      });

      const totalQuestions = storedQuestions.length || 1;
      const score = Math.round((correctCount / totalQuestions) * 100);
      const passed = score >= 70;

      let isFirstTime = false;
      if (session.courseId && session.lessonId) {
        try {
          const res = await CourseRepository.completeLesson(userRow.id, session.courseId, session.lessonId);
          isFirstTime = res.isFirstTime;
        } catch {
          // continue
        }
      }

      const todayStr = new Date().toISOString().split("T")[0];
      let lastQuizXpDate = userRow.lastQuizXpDate;
      let dailyQuizXpCount = userRow.dailyQuizXpCount || 0;

      if (lastQuizXpDate !== todayStr) {
        lastQuizXpDate = todayStr;
        dailyQuizXpCount = 0;
      }

      let baseReward = Math.round(score * 1.5);
      if (session.quizType === "quick") baseReward = 50 + correctCount * 10;
      if (session.quizType === "simulation") baseReward = 100 + correctCount * 15;
      if (session.quizType === "lesson") baseReward = 80 + correctCount * 12;

      if (dailyQuizXpCount >= 500) {
        baseReward = Math.min(baseReward, 15);
      } else if (!isFirstTime && session.quizType === "lesson") {
        baseReward = Math.min(baseReward, 30);
      }

      const isBoosterActive = !!userRow.activeBoosterUntil && userRow.activeBoosterUntil > new Date();
      const finalXp = isBoosterActive ? baseReward * 2 : baseReward;
      const addedGems = passed ? (isFirstTime ? 20 : 8) : 2;

      const newXp = userRow.xp + finalXp;
      const newGems = userRow.gems + addedGems;
      const weeklyXp = (userRow.weeklyXp || 0) + finalXp;
      const newStreak = userRow.streak;

      const newLevel = Math.floor(newXp / 500) + 1;
      const leveledUp = newLevel > userRow.level;

      const dailyQuests = Array.isArray(userRow.dailyQuests) ? [...userRow.dailyQuests] : [];
      const dq1 = dailyQuests.find((q: any) => q.id === "dq_1");
      if (dq1 && !dq1.completed) {
        dq1.current = 1;
        dq1.completed = true;
      }

      await tx
        .update(users)
        .set({
          xp: newXp,
          gems: newGems,
          streak: newStreak,
          weeklyXp,
          dailyQuizXpCount: dailyQuizXpCount + finalXp,
          lastQuizXpDate,
          level: newLevel,
          lastActive: new Date().toISOString(),
          dailyQuests: dailyQuests,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userRow.id));

      const completedAt = new Date();
      await tx
        .update(quizSessions)
        .set({
          answers: answersMap,
          status: "submitted",
          score,
          passed,
          correctCount,
          wrongCount,
          earnedXp: finalXp,
          earnedGems: addedGems,
          completedAt,
        })
        .where(eq(quizSessions.id, session.id));

      if (session.courseId && session.lessonId) {
        await CourseRepository.saveQuizAttempt(userRow.id, session.courseId, session.lessonId, score, passed);
      }

      const achievementsList = await tx.select().from(userAchievements).where(eq(userAchievements.userId, userRow.id));

      const ach1 = achievementsList.find((a: any) => a.achievementId === "ach_1");
      if (ach1 && passed && !ach1.unlocked) {
        const newCurrent = Math.min(ach1.target, ach1.current + 1);
        const unlocked = newCurrent >= ach1.target;
        await tx
          .update(userAchievements)
          .set({
            current: newCurrent,
            unlocked,
            unlockedAt: unlocked ? todayStr : null,
          })
          .where(and(eq(userAchievements.userId, userRow.id), eq(userAchievements.achievementId, "ach_1")));
      }

      const ach2 = achievementsList.find((a: any) => a.achievementId === "ach_2");
      if (ach2 && score === 100 && !ach2.unlocked) {
        const newCurrent = Math.min(ach2.target, ach2.current + 1);
        const unlocked = newCurrent >= ach2.target;
        await tx
          .update(userAchievements)
          .set({
            current: newCurrent,
            unlocked,
            unlockedAt: unlocked ? todayStr : null,
          })
          .where(and(eq(userAchievements.userId, userRow.id), eq(userAchievements.achievementId, "ach_2")));
      }

      const notifText = `${passed ? "🏆" : "💡"} Sesi '${session.title}' selesai (Skor: ${score}%). +${finalXp} XP & +${addedGems} Gems!`;
      await tx.insert(notifications).values({
        userId: userRow.id,
        text: notifText,
        type: "quiz",
        read: false,
      });

      const updatedProfile = await UserRepository.getFullProfile(userId);

      return {
        success: true,
        attemptId: session.sessionId,
        score,
        passed,
        correctCount,
        wrongCount,
        unansweredCount,
        totalQuestions,
        earnedXp: finalXp,
        earnedGems: addedGems,
        durationSeconds: session.durationSeconds,
        timeSpentSeconds: timeSpentSeconds || session.durationSeconds,
        leveledUp,
        profile: updatedProfile,
        answersHistory,
      };
    });
  }

  static async getAttemptHistory(userId: string) {
    const profile = await UserRepository.getFullProfile(userId);
    const sessions = await db.query.quizSessions.findMany({
      where: and(eq(quizSessions.userId, profile.id), eq(quizSessions.status, "submitted")),
      orderBy: (quizSessions, { desc }) => [desc(quizSessions.completedAt)],
      limit: 20,
    });

    return sessions.map((s) => ({
      sessionId: s.sessionId,
      title: s.title,
      subtitle: s.subtitle,
      quizType: s.quizType,
      difficulty: s.difficulty,
      score: s.score,
      passed: s.passed,
      earnedXp: s.earnedXp,
      earnedGems: s.earnedGems,
      completedAt: s.completedAt?.toISOString(),
    }));
  }
}
