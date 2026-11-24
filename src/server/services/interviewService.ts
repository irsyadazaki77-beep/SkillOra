import { Type } from "@google/genai";
import * as crypto from "crypto";
import { db } from "../../db/index.js";
import { interviewSessions, users, userAchievements, notifications } from "../../db/schema.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { CareerRepository } from "../repositories/CareerRepository.js";
import { getGeminiClient } from "./aiService.js";
import { eq, and, desc } from "drizzle-orm";

export interface TranscriptTurn {
  speaker: "candidate" | "interviewer";
  text: string;
  timestamp: string;
}

export class InterviewService {
  static async getHistory(userId: string) {
    const profile = await UserRepository.getFullProfile(userId);
    const sessions = await db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, profile.id))
      .orderBy(desc(interviewSessions.createdAt))
      .limit(20);

    return sessions.map((s) => ({
      sessionId: s.sessionId,
      jobId: s.jobId,
      jobTitle: s.jobTitle,
      companyName: s.companyName,
      mode: s.mode,
      transcript: Array.isArray(s.transcript) ? s.transcript : [],
      overallScore: s.overallScore,
      communicationScore: s.communicationScore,
      starScore: s.starScore,
      technicalScore: s.technicalScore,
      strengths: Array.isArray(s.strengths) ? s.strengths : [],
      improvements: Array.isArray(s.improvements) ? s.improvements : [],
      summaryFeedback: s.summaryFeedback,
      durationSeconds: s.durationSeconds,
      status: s.status,
      createdAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
      completedAt: s.completedAt ? s.completedAt.toISOString() : null,
    }));
  }

  static async startSession(
    userId: string,
    params: { jobId?: string; jobTitle?: string; companyName?: string; mode?: "voice" | "text" }
  ) {
    const profile = await UserRepository.getFullProfile(userId);
    const job = params.jobId ? await CareerRepository.getJobByJobId(params.jobId) : null;

    const jobTitle = params.jobTitle?.trim() || job?.title || "Frontend & Fullstack Developer";
    const companyName = params.companyName?.trim() || job?.companyName || "Mitra Perusahaan Skillora";
    const sessionId = `iv_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    const [created] = await db
      .insert(interviewSessions)
      .values({
        sessionId,
        userId: profile.id,
        jobId: params.jobId || job?.jobId || null,
        jobTitle,
        companyName,
        mode: params.mode === "text" ? "text" : "voice",
        transcript: [],
        status: "active",
      })
      .returning();

    return {
      sessionId: created.sessionId,
      jobTitle: created.jobTitle,
      companyName: created.companyName,
      mode: created.mode,
      status: created.status,
    };
  }

  static async appendTurn(sessionId: string, speaker: "candidate" | "interviewer", text: string) {
    if (!text?.trim()) return;
    const session = await db.query.interviewSessions.findFirst({
      where: eq(interviewSessions.sessionId, sessionId),
    });
    if (!session) return;

    const transcript = Array.isArray(session.transcript) ? [...(session.transcript as TranscriptTurn[])] : [];
    const last = transcript[transcript.length - 1];
    if (last && last.speaker === speaker && Date.now() - new Date(last.timestamp).getTime() < 4000) {
      last.text = `${last.text} ${text.trim()}`.trim();
    } else {
      transcript.push({
        speaker,
        text: text.trim(),
        timestamp: new Date().toISOString(),
      });
    }

    await db
      .update(interviewSessions)
      .set({ transcript })
      .where(eq(interviewSessions.id, session.id));
  }

  static async completeSession(
    userId: string,
    sessionId: string,
    body?: { transcript?: TranscriptTurn[]; durationSeconds?: number }
  ) {
    const profile = await UserRepository.getFullProfile(userId);
    const session = await db.query.interviewSessions.findFirst({
      where: and(eq(interviewSessions.sessionId, sessionId), eq(interviewSessions.userId, profile.id)),
    });
    if (!session) throw new Error("Sesi wawancara tidak ditemukan.");

    const finalTranscript =
      Array.isArray(body?.transcript) && body.transcript.length > 0
        ? body.transcript
        : Array.isArray(session.transcript)
        ? (session.transcript as TranscriptTurn[])
        : [];

    const ai = getGeminiClient();
    const transcriptText =
      finalTranscript.length > 0
        ? finalTranscript.map((t) => `${t.speaker === "interviewer" ? "HRD" : "Kandidat"}: ${t.text}`).join("\n")
        : "Kandidat mengikuti sesi pengenalan awal wawancara.";

    const prompt = `Anda adalah Direktur Rekrutmen. Evaluasi transkrip simulasi wawancara kerja untuk posisi "${session.jobTitle}" di "${session.companyName}".
Transkrip Percakapan:
${transcriptText}

Berikan penilaian objektif dalam Bahasa Indonesia dengan 4 skor (0-100): overallScore, communicationScore, starScore, technicalScore, daftar kekuatan (strengths), area perbaikan (improvements), dan summaryFeedback komprehensif.`;

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.INTEGER },
            communicationScore: { type: Type.INTEGER },
            starScore: { type: Type.INTEGER },
            technicalScore: { type: Type.INTEGER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            summaryFeedback: { type: Type.STRING },
          },
          required: [
            "overallScore",
            "communicationScore",
            "starScore",
            "technicalScore",
            "strengths",
            "improvements",
            "summaryFeedback",
          ],
        },
      },
    });

    const evalData = JSON.parse(response.text || "{}");
    const overallScore = Math.max(0, Math.min(100, Number(evalData.overallScore) || 78));

    const updatedProfile = await db.transaction(async (tx) => {
      await tx
        .update(interviewSessions)
        .set({
          transcript: finalTranscript,
          durationSeconds: Number(body?.durationSeconds) || session.durationSeconds || 120,
          overallScore,
          communicationScore: Math.max(0, Math.min(100, Number(evalData.communicationScore) || overallScore)),
          starScore: Math.max(0, Math.min(100, Number(evalData.starScore) || overallScore)),
          technicalScore: Math.max(0, Math.min(100, Number(evalData.technicalScore) || overallScore)),
          strengths: Array.isArray(evalData.strengths) ? evalData.strengths : [],
          improvements: Array.isArray(evalData.improvements) ? evalData.improvements : [],
          summaryFeedback: evalData.summaryFeedback || "Evaluasi simulasi wawancara selesai.",
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(interviewSessions.id, session.id));

      const [u] = await tx.select().from(users).where(eq(users.id, profile.id)).for("update");
      const bonusXp = 75;
      const newXp = (u?.xp || 0) + bonusXp;
      await tx
        .update(users)
        .set({
          xp: newXp,
          weeklyXp: (u?.weeklyXp || 0) + bonusXp,
          level: Math.floor(newXp / 500) + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, profile.id));

      const ach6 = await tx.query.userAchievements.findFirst({
        where: and(eq(userAchievements.userId, profile.id), eq(userAchievements.achievementId, "ach_6")),
      });
      if (ach6 && !ach6.unlocked) {
        await tx
          .update(userAchievements)
          .set({ current: 1, unlocked: true, unlockedAt: new Date().toISOString().split("T")[0] })
          .where(eq(userAchievements.id, ach6.id));
      }

      await tx.insert(notifications).values({
        userId: profile.id,
        text: `🎙️ Mock Interview '${session.jobTitle}' selesai! Skor Keseluruhan: ${overallScore}/100 (+${bonusXp} XP).`,
        type: "job",
        read: false,
      });

      return UserRepository.getFullProfile(userId);
    });

    const latest = await db.query.interviewSessions.findFirst({
      where: eq(interviewSessions.id, session.id),
    });

    return {
      session: latest,
      profile: updatedProfile,
    };
  }
}
