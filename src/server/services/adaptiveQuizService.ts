import { Type } from "@google/genai";
import * as crypto from "crypto";
import { db } from "../../db/index.js";
import { adaptiveAssessments, questionsBank, users, walletLedger, notifications } from "../../db/schema.js";
import { ensureSeeded } from "../db/seedData.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { getGeminiClient } from "./aiService.js";
import { eq, and, desc } from "drizzle-orm";

interface AdaptiveQuestionPayload {
  id: string;
  difficulty: number;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  competencyTag: string;
}

export class AdaptiveQuizService {
  private static async pickQuestion(
    category: string,
    difficulty: number,
    usedIds: Set<string>
  ): Promise<AdaptiveQuestionPayload> {
    await ensureSeeded();
    const bankRows = await db.select().from(questionsBank).where(eq(questionsBank.category, category));

    const exactPool = bankRows.filter((q) => q.difficulty === difficulty && !usedIds.has(`qb_${q.id}`));
    const nearPool = bankRows.filter((q) => Math.abs(q.difficulty - difficulty) <= 1 && !usedIds.has(`qb_${q.id}`));
    const chosen = exactPool[0] || nearPool[0];

    if (chosen) {
      return {
        id: `qb_${chosen.id}`,
        difficulty: chosen.difficulty,
        prompt: chosen.prompt,
        options: Array.isArray(chosen.options) ? (chosen.options as string[]) : [],
        answerIndex: chosen.answerIndex,
        explanation: chosen.explanation,
        competencyTag: chosen.competencyTag,
      };
    }

    // Generate adaptive question using Gemini 4 Hydrogen and persist to bank
    const ai = getGeminiClient();
    const promptText = `Buat 1 soal pilihan ganda asesmen kompetensi adaptif berbahasa Indonesia.
Kategori: "${category}"
Tingkat Kesulitan: Level ${difficulty} dari 5 (1 = sangat dasar, 5 = studi kasus kompleks / analitik senior).
Pastikan ada tepat 4 opsi jawaban yang masuk akal, 1 answerIndex (0-3), pembahasan jelas, dan competencyTag singkat.`;

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prompt: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            answerIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            competencyTag: { type: Type.STRING },
          },
          required: ["prompt", "options", "answerIndex", "explanation", "competencyTag"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    const cleanOptions = Array.isArray(data.options) && data.options.length >= 2 ? data.options.slice(0, 4) : ["Opsi A", "Opsi B", "Opsi C", "Opsi D"];
    const safeAnswerIdx = Math.max(0, Math.min(cleanOptions.length - 1, Number(data.answerIndex) || 0));

    const [saved] = await db
      .insert(questionsBank)
      .values({
        category,
        difficulty,
        prompt: data.prompt || `Soal ${category} Level ${difficulty}`,
        options: cleanOptions,
        answerIndex: safeAnswerIdx,
        explanation: data.explanation || "Pembahasan kompetensi adaptif.",
        competencyTag: data.competencyTag || category,
      })
      .returning();

    return {
      id: `qb_${saved.id}`,
      difficulty: saved.difficulty,
      prompt: saved.prompt,
      options: cleanOptions,
      answerIndex: safeAnswerIdx,
      explanation: saved.explanation,
      competencyTag: saved.competencyTag,
    };
  }

  private static sanitizeQuestion(q: AdaptiveQuestionPayload) {
    return {
      id: q.id,
      difficulty: q.difficulty,
      prompt: q.prompt,
      options: q.options,
      competencyTag: q.competencyTag,
    };
  }

  static async startAssessment(userId: string, category = "TKD BUMN", maxQuestions = 6) {
    const profile = await UserRepository.getFullProfile(userId);
    const boundedMax = Math.max(4, Math.min(10, Number(maxQuestions) || 6));
    const firstQ = await this.pickQuestion(category, 2, new Set());
    const assessmentId = `cat_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    await db.insert(adaptiveAssessments).values({
      assessmentId,
      userId: profile.id,
      category,
      status: "in_progress",
      currentDifficulty: 2,
      abilityScore: 50,
      questionCount: 0,
      maxQuestions: boundedMax,
      currentQuestion: firstQ,
      history: [],
      weakTopics: [],
    });

    return {
      assessmentId,
      category,
      status: "in_progress",
      currentDifficulty: 2,
      abilityScore: 50,
      questionNumber: 1,
      maxQuestions: boundedMax,
      question: this.sanitizeQuestion(firstQ),
    };
  }

  static async answerQuestion(userId: string, assessmentId: string, selectedOption: number) {
    const profile = await UserRepository.getFullProfile(userId);
    const assessment = await db.query.adaptiveAssessments.findFirst({
      where: and(eq(adaptiveAssessments.assessmentId, assessmentId), eq(adaptiveAssessments.userId, profile.id)),
    });

    if (!assessment) throw new Error("Sesi asesmen adaptif tidak ditemukan.");
    if (assessment.status === "completed") {
      return {
        assessmentId: assessment.assessmentId,
        status: "completed",
        abilityScore: assessment.abilityScore,
        currentDifficulty: assessment.currentDifficulty,
        questionNumber: assessment.questionCount,
        maxQuestions: assessment.maxQuestions,
        history: assessment.history,
        weakTopics: assessment.weakTopics,
        aiSummary: assessment.aiSummary,
        earnedXp: assessment.earnedXp,
        earnedGems: assessment.earnedGems,
      };
    }

    const currentQ = assessment.currentQuestion as AdaptiveQuestionPayload;
    if (!currentQ) throw new Error("Pertanyaan aktif tidak valid.");

    const isCorrect = Number(selectedOption) === currentQ.answerIndex;
    const historyArr = Array.isArray(assessment.history) ? [...(assessment.history as any[])] : [];

    historyArr.push({
      questionId: currentQ.id,
      difficulty: currentQ.difficulty,
      prompt: currentQ.prompt,
      options: currentQ.options,
      selectedOption: Number(selectedOption),
      correctOption: currentQ.answerIndex,
      isCorrect,
      explanation: currentQ.explanation,
      competencyTag: currentQ.competencyTag,
    });

    const nextCount = historyArr.length;
    const abilityDelta = isCorrect ? currentQ.difficulty * 4 : -Math.max(4, (6 - currentQ.difficulty) * 2);
    const nextAbility = Math.max(10, Math.min(100, assessment.abilityScore + abilityDelta));
    const nextDifficulty = isCorrect
      ? Math.min(5, assessment.currentDifficulty + 1)
      : Math.max(1, assessment.currentDifficulty - 1);

    const feedbackItem = {
      isCorrect,
      correctOption: currentQ.answerIndex,
      explanation: currentQ.explanation,
      competencyTag: currentQ.competencyTag,
      previousDifficulty: currentQ.difficulty,
    };

    if (nextCount >= assessment.maxQuestions) {
      const wrongTags = Array.from(
        new Set(historyArr.filter((h) => !h.isCorrect).map((h) => h.competencyTag).filter(Boolean))
      );

      let aiSummary = `Skor Kemampuan Adaptif Anda: ${nextAbility}/100 untuk kategori ${assessment.category}.`;
      try {
        const ai = getGeminiClient();
        const diagPrompt = `Buat ringkasan diagnostik asesmen adaptif CAT (maksimal 3 kalimat tajam berbahasa Indonesia).
Kategori: ${assessment.category}
Ability Score Akhir: ${nextAbility}/100
Benar: ${historyArr.filter((h) => h.isCorrect).length}/${historyArr.length}
Topik Lemah: ${wrongTags.join(", ") || "Tidak ada, penguasaan merata"}
Level kesulitan puncak: ${Math.max(...historyArr.map((h) => h.difficulty))}/5.`;
        const diagRes = await ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: diagPrompt,
          config: { maxOutputTokens: 250 },
        });
        if (diagRes.text) aiSummary = diagRes.text.trim();
      } catch (e) {
        console.warn("Diagnostic summary fallback skipped:", e);
      }

      const earnedXp = 60 + historyArr.filter((h) => h.isCorrect).length * 20;
      const earnedGems = nextAbility >= 75 ? 25 : 10;

      const updatedProfile = await db.transaction(async (tx) => {
        const [u] = await tx.select().from(users).where(eq(users.id, profile.id)).for("update");
        const newXp = (u?.xp || 0) + earnedXp;
        const newGems = (u?.gems || 0) + earnedGems;

        await tx
          .update(users)
          .set({
            xp: newXp,
            gems: newGems,
            weeklyXp: (u?.weeklyXp || 0) + earnedXp,
            level: Math.floor(newXp / 500) + 1,
            updatedAt: new Date(),
          })
          .where(eq(users.id, profile.id));

        await tx.insert(walletLedger).values({
          userId: profile.id,
          currency: "gems",
          delta: earnedGems,
          balanceAfter: newGems,
          reason: `Asesmen AI Adaptif: ${assessment.category}`,
          referenceId: assessment.assessmentId,
        });

        await tx.insert(notifications).values({
          userId: profile.id,
          text: `🧠 Asesmen Adaptif '${assessment.category}' selesai! Skor Kemampuan: ${nextAbility}/100 (+${earnedXp} XP, +${earnedGems} Gems).`,
          type: "quiz",
          read: false,
        });

        await tx
          .update(adaptiveAssessments)
          .set({
            status: "completed",
            currentDifficulty: nextDifficulty,
            abilityScore: nextAbility,
            questionCount: nextCount,
            currentQuestion: null,
            history: historyArr,
            weakTopics: wrongTags,
            aiSummary,
            earnedXp,
            earnedGems,
            completedAt: new Date(),
          })
          .where(eq(adaptiveAssessments.id, assessment.id));

        return UserRepository.getFullProfile(userId);
      });

      return {
        assessmentId: assessment.assessmentId,
        status: "completed",
        feedback: feedbackItem,
        abilityScore: nextAbility,
        currentDifficulty: nextDifficulty,
        questionNumber: nextCount,
        maxQuestions: assessment.maxQuestions,
        history: historyArr,
        weakTopics: wrongTags,
        aiSummary,
        earnedXp,
        earnedGems,
        profile: updatedProfile,
      };
    }

    const usedIds = new Set<string>(historyArr.map((h) => h.questionId));
    const nextQ = await this.pickQuestion(assessment.category, nextDifficulty, usedIds);

    await db
      .update(adaptiveAssessments)
      .set({
        currentDifficulty: nextDifficulty,
        abilityScore: nextAbility,
        questionCount: nextCount,
        currentQuestion: nextQ,
        history: historyArr,
      })
      .where(eq(adaptiveAssessments.id, assessment.id));

    return {
      assessmentId: assessment.assessmentId,
      status: "in_progress",
      feedback: feedbackItem,
      abilityScore: nextAbility,
      currentDifficulty: nextDifficulty,
      questionNumber: nextCount + 1,
      maxQuestions: assessment.maxQuestions,
      question: this.sanitizeQuestion(nextQ),
      history: historyArr,
    };
  }

  static async getHistory(userId: string) {
    const profile = await UserRepository.getFullProfile(userId);
    const list = await db
      .select()
      .from(adaptiveAssessments)
      .where(and(eq(adaptiveAssessments.userId, profile.id), eq(adaptiveAssessments.status, "completed")))
      .orderBy(desc(adaptiveAssessments.completedAt))
      .limit(15);

    return list.map((a) => ({
      assessmentId: a.assessmentId,
      category: a.category,
      abilityScore: a.abilityScore,
      questionCount: a.questionCount,
      weakTopics: a.weakTopics,
      aiSummary: a.aiSummary,
      earnedXp: a.earnedXp,
      completedAt: a.completedAt ? a.completedAt.toISOString() : a.startedAt.toISOString(),
    }));
  }
}
