import { Type } from "@google/genai";
import { db } from "../../db/index.js";
import { cvDocuments } from "../../db/schema.js";
import { UserRepository } from "../repositories/UserRepository.js";
import { CareerRepository } from "../repositories/CareerRepository.js";
import { getGeminiClient } from "./aiService.js";
import { eq, and, desc } from "drizzle-orm";

export interface CvPayload {
  id?: number;
  title: string;
  targetRole: string;
  summary: string;
  experiences: Array<{ role: string; company: string; period: string; bullets: string[] }>;
  education: Array<{ school: string; degree: string; year: string; gpa?: string }>;
  projects: Array<{ name: string; link?: string; impact: string }>;
  skills: string[];
}

export class CvService {
  static async listCvs(userId: string) {
    const profile = await UserRepository.getFullProfile(userId);
    const docs = await db
      .select()
      .from(cvDocuments)
      .where(eq(cvDocuments.userId, profile.id))
      .orderBy(desc(cvDocuments.updatedAt));

    return docs.map((d) => ({
      id: d.id,
      title: d.title,
      targetRole: d.targetRole,
      summary: d.summary,
      experiences: Array.isArray(d.experiences) ? d.experiences : [],
      education: Array.isArray(d.education) ? d.education : [],
      projects: Array.isArray(d.projects) ? d.projects : [],
      skills: Array.isArray(d.skills) ? d.skills : [],
      atsScore: d.atsScore,
      atsFeedback: d.atsFeedback,
      updatedAt: d.updatedAt ? d.updatedAt.toISOString() : new Date().toISOString(),
    }));
  }

  static async saveCv(userId: string, data: CvPayload) {
    if (!data.targetRole?.trim() || !data.summary?.trim()) {
      throw new Error("Target peran dan ringkasan profesional wajib diisi.");
    }
    const profile = await UserRepository.getFullProfile(userId);

    if (data.id) {
      const existing = await db.query.cvDocuments.findFirst({
        where: and(eq(cvDocuments.id, Number(data.id)), eq(cvDocuments.userId, profile.id)),
      });
      if (existing) {
        const [updated] = await db
          .update(cvDocuments)
          .set({
            title: data.title?.trim() || existing.title,
            targetRole: data.targetRole.trim(),
            summary: data.summary.trim(),
            experiences: data.experiences || [],
            education: data.education || [],
            projects: data.projects || [],
            skills: data.skills || [],
            updatedAt: new Date(),
          })
          .where(eq(cvDocuments.id, existing.id))
          .returning();
        return updated;
      }
    }

    const [created] = await db
      .insert(cvDocuments)
      .values({
        userId: profile.id,
        title: data.title?.trim() || `CV ATS — ${data.targetRole.trim()}`,
        targetRole: data.targetRole.trim(),
        summary: data.summary.trim(),
        experiences: data.experiences || [],
        education: data.education || [],
        projects: data.projects || [],
        skills: data.skills || [],
        atsScore: 0,
      })
      .returning();

    return created;
  }

  static async analyzeCvWithAts(
    userId: string,
    payload: { cvId?: number; targetJobId?: string; cvDraft: CvPayload }
  ) {
    const profile = await UserRepository.getFullProfile(userId);
    const targetJob = payload.targetJobId ? await CareerRepository.getJobByJobId(payload.targetJobId) : null;

    const ai = getGeminiClient();
    const jobContext = targetJob
      ? `Lowongan Target: ${targetJob.title} di ${targetJob.companyName}. Skill Wajib: ${(
          (targetJob.requiredSkills as string[]) || []
        ).join(", ")}. Deskripsi: ${targetJob.description}`
      : `Target Role Umum: ${payload.cvDraft.targetRole}`;

    const prompt = `Analisis CV ATS kandidat dalam Bahasa Indonesia dan berikan optimasi konkret berbasis dampak (action verb + metrik).
${jobContext}

Data CV:
- Target Role: ${payload.cvDraft.targetRole}
- Summary: ${payload.cvDraft.summary}
- Skills: ${(payload.cvDraft.skills || []).join(", ")}
- Experiences: ${JSON.stringify(payload.cvDraft.experiences || [])}
- Projects: ${JSON.stringify(payload.cvDraft.projects || [])}
- Education: ${JSON.stringify(payload.cvDraft.education || [])}
- Sertifikat Skillora Terverifikasi: ${(profile.certificates || []).map((c: any) => c.courseTitle).join(", ") || "Belum ada"}

Berikan skor ATS realistis (0-100), kata kunci yang cocok & yang kurang, revisi ringkasan profesional siap pakai, dan perbaikan bullet point pengalaman.`;

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atsScore: { type: Type.INTEGER },
            keywordMatches: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvedSummary: { type: Type.STRING },
            bulletImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
            formattingTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            "atsScore",
            "keywordMatches",
            "missingKeywords",
            "improvedSummary",
            "bulletImprovements",
            "formattingTips",
          ],
        },
      },
    });

    const feedback = JSON.parse(response.text || "{}");
    const atsScore = Math.max(0, Math.min(100, Number(feedback.atsScore) || 72));
    feedback.atsScore = atsScore;

    if (payload.cvId) {
      await db
        .update(cvDocuments)
        .set({ atsScore, atsFeedback: feedback, updatedAt: new Date() })
        .where(and(eq(cvDocuments.id, Number(payload.cvId)), eq(cvDocuments.userId, profile.id)));
    }

    return feedback;
  }
}
