import { db } from "../../db/index.js";
import { lessonNotes, studyRoadmaps } from "../../db/schema.js";
import { and, desc, eq } from "drizzle-orm";
import { Type } from "@google/genai";
import { getGeminiClient } from "./aiService.js";
import { UserRepository } from "../repositories/UserRepository.js";

export class StudyWorkspaceService {
  // --- Cloud Lesson Notes ---
  static async getNotes(uid: string, courseId?: string, lessonId?: string) {
    const userRow = await UserRepository.getOrCreateUser(uid);
    if (courseId && lessonId) {
      const row = await db.query.lessonNotes.findFirst({
        where: and(
          eq(lessonNotes.userId, userRow.id),
          eq(lessonNotes.courseId, courseId),
          eq(lessonNotes.lessonId, lessonId)
        ),
      });
      return row
        ? {
            courseId: row.courseId,
            lessonId: row.lessonId,
            content: row.content,
            isPinned: row.isPinned,
            updatedAt: row.updatedAt.toISOString(),
          }
        : null;
    }

    const rows = await db
      .select()
      .from(lessonNotes)
      .where(eq(lessonNotes.userId, userRow.id))
      .orderBy(desc(lessonNotes.updatedAt));

    return rows.map((r) => ({
      courseId: r.courseId,
      lessonId: r.lessonId,
      content: r.content,
      isPinned: r.isPinned,
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  static async upsertNote(
    uid: string,
    courseId: string,
    lessonId: string,
    content: string,
    isPinned: boolean = false
  ) {
    const userRow = await UserRepository.getOrCreateUser(uid);
    const now = new Date();
    const [row] = await db
      .insert(lessonNotes)
      .values({
        userId: userRow.id,
        courseId,
        lessonId,
        content: content.slice(0, 15000),
        isPinned,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [lessonNotes.userId, lessonNotes.courseId, lessonNotes.lessonId],
        set: {
          content: content.slice(0, 15000),
          isPinned,
          updatedAt: now,
        },
      })
      .returning();

    return {
      courseId: row.courseId,
      lessonId: row.lessonId,
      content: row.content,
      isPinned: row.isPinned,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  static async deleteNote(uid: string, courseId: string, lessonId: string) {
    const userRow = await UserRepository.getOrCreateUser(uid);
    await db
      .delete(lessonNotes)
      .where(
        and(
          eq(lessonNotes.userId, userRow.id),
          eq(lessonNotes.courseId, courseId),
          eq(lessonNotes.lessonId, lessonId)
        )
      );
    return { deleted: true };
  }

  // --- AI Smart Weekly Study Roadmap ---
  static async getActiveRoadmap(uid: string) {
    const userRow = await UserRepository.getOrCreateUser(uid);
    const row = await db.query.studyRoadmaps.findFirst({
      where: eq(studyRoadmaps.userId, userRow.id),
      orderBy: desc(studyRoadmaps.updatedAt),
    });

    if (!row) return null;
    return {
      id: row.id,
      targetRole: row.targetRole,
      hoursPerWeek: row.hoursPerWeek,
      summary: row.summary,
      weeks: Array.isArray(row.weeks) ? row.weeks : [],
      progressPercent: row.progressPercent,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  static async generateRoadmap(
    uid: string,
    targetRole: string = "Frontend Engineer",
    hoursPerWeek: number = 8
  ) {
    const userRow = await UserRepository.getOrCreateUser(uid);
    const skills = Array.isArray(userRow.skills) ? userRow.skills.join(", ") : "Dasar Web";
    const safeHours = Math.max(3, Math.min(30, Math.round(hoursPerWeek || 8)));

    const ai = getGeminiClient();
    const prompt = `Buat rencana belajar karier terstruktur 4 minggu (Smart Weekly Study Roadmap) dalam Bahasa Indonesia untuk mahasiswa/fresh graduate di platform Skillora.
Target Karier: ${targetRole}
Waktu Belajar: ${safeHours} jam/minggu
Skill Saat Ini: ${skills}
Level Pengguna: ${userRow.level}

ATURAN:
- Buat tepat 4 minggu (weekNumber 1..4).
- Tiap minggu punya 3 tugas praktis (tasks) yang konkret dan bisa dicentang.
- Untuk setiap task, tentukan type dari salah satu: "course", "lab", "arena", atau "career".
- Untuk targetPath, gunakan HANYA rute valid aplikasi:
  - "/belajar/katalog" (untuk course)
  - "/lab" (untuk lab)
  - "/arena" (untuk arena / tryout / battle)
  - "/karier/cv-ats" atau "/karier/mock-interview" atau "/karier" atau "/belajar/proyek" (untuk career)
- Buat ringkasan (summary) 1-2 kalimat lugas tanpa basa-basi.`;

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            weeks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  weekNumber: { type: Type.INTEGER },
                  theme: { type: Type.STRING },
                  objective: { type: Type.STRING },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        type: { type: Type.STRING },
                        targetPath: { type: Type.STRING },
                        estimatedMinutes: { type: Type.INTEGER },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const allowedPaths = new Set([
      "/belajar/katalog",
      "/lab",
      "/arena",
      "/karier/cv-ats",
      "/karier/mock-interview",
      "/karier",
      "/belajar/proyek",
    ]);

    const normalizedWeeks = (Array.isArray(parsed.weeks) ? parsed.weeks : []).slice(0, 4).map((w: any, wIdx: number) => ({
      weekNumber: Number(w.weekNumber) || wIdx + 1,
      theme: String(w.theme || `Minggu ${wIdx + 1}`),
      objective: String(w.objective || "Penguatan kompetensi inti"),
      tasks: (Array.isArray(w.tasks) ? w.tasks : []).slice(0, 4).map((t: any, tIdx: number) => {
        const rawPath = String(t.targetPath || "/belajar/katalog");
        return {
          id: String(t.id || `w${wIdx + 1}_t${tIdx + 1}`),
          title: String(t.title || "Selesaikan latihan terarah"),
          type: ["course", "lab", "arena", "career"].includes(t.type) ? t.type : "course",
          targetPath: allowedPaths.has(rawPath) ? rawPath : "/lab",
          estimatedMinutes: Math.max(10, Math.min(180, Number(t.estimatedMinutes) || 30)),
          completed: false,
        };
      }),
    }));

    const [inserted] = await db
      .insert(studyRoadmaps)
      .values({
        userId: userRow.id,
        targetRole,
        hoursPerWeek: safeHours,
        summary: String(parsed.summary || `Roadmap 4 minggu terarah menuju kesiapan ${targetRole}.`),
        weeks: normalizedWeeks,
        progressPercent: 0,
        updatedAt: new Date(),
      })
      .returning();

    return {
      id: inserted.id,
      targetRole: inserted.targetRole,
      hoursPerWeek: inserted.hoursPerWeek,
      summary: inserted.summary,
      weeks: normalizedWeeks,
      progressPercent: inserted.progressPercent,
      updatedAt: inserted.updatedAt.toISOString(),
    };
  }

  static async toggleRoadmapTask(uid: string, roadmapId: number, taskId: string) {
    const userRow = await UserRepository.getOrCreateUser(uid);
    const roadmap = await db.query.studyRoadmaps.findFirst({
      where: and(eq(studyRoadmaps.id, roadmapId), eq(studyRoadmaps.userId, userRow.id)),
    });
    if (!roadmap) {
      throw new Error("Roadmap tidak ditemukan.");
    }

    const weeks = Array.isArray(roadmap.weeks) ? (roadmap.weeks as any[]) : [];
    let totalTasks = 0;
    let doneTasks = 0;

    const updatedWeeks = weeks.map((w) => ({
      ...w,
      tasks: (Array.isArray(w.tasks) ? w.tasks : []).map((t: any) => {
        const nextCompleted = t.id === taskId ? !t.completed : Boolean(t.completed);
        totalTasks += 1;
        if (nextCompleted) doneTasks += 1;
        return { ...t, completed: nextCompleted };
      }),
    }));

    const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const [updated] = await db
      .update(studyRoadmaps)
      .set({
        weeks: updatedWeeks,
        progressPercent,
        updatedAt: new Date(),
      })
      .where(eq(studyRoadmaps.id, roadmap.id))
      .returning();

    return {
      id: updated.id,
      targetRole: updated.targetRole,
      hoursPerWeek: updated.hoursPerWeek,
      summary: updated.summary,
      weeks: updatedWeeks,
      progressPercent: updated.progressPercent,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  // --- Contextual Study Copilot ---
  static async copilotChat(
    uid: string,
    message: string,
    context?: {
      pagePath?: string;
      courseTitle?: string;
      lessonTitle?: string;
      labTitle?: string;
      codeSnippet?: string;
    }
  ) {
    const userRow = await UserRepository.getOrCreateUser(uid);
    const ai = getGeminiClient();

    const ctxParts: string[] = [];
    if (context?.courseTitle) ctxParts.push(`Kursus: ${context.courseTitle}`);
    if (context?.lessonTitle) ctxParts.push(`Modul: ${context.lessonTitle}`);
    if (context?.labTitle) ctxParts.push(`Lab Aktif: ${context.labTitle}`);
    if (context?.pagePath) ctxParts.push(`Halaman: ${context.pagePath}`);
    if (context?.codeSnippet) {
      ctxParts.push(`Potongan Solusi Saat Ini:\n\`\`\`\n${context.codeSnippet.slice(0, 2000)}\n\`\`\``);
    }

    const systemInstruction = `Anda adalah Skillora Study Copilot, asisten belajar teknis dan karier yang tenang, tajam, dan profesional.
Profil singkat pengguna: Level ${userRow.level}, target peran "${userRow.role}".
ATURAN:
1. Jawab ringkas, terstruktur (maksimal 3-5 poin atau 1 blok kode singkat) dalam Bahasa Indonesia.
2. Jika pengguna berada di Interactive Coding/Case Lab dan meminta bantuan, berikan panduan konsep/hint bertahap dan arahkan pemikiran, jangan sekadar memberi jawaban mentah kecuali diminta menjelaskan konsep.
3. Jangan pernah meminta data pribadi sensitif (NIK, sandi, nomor rekening).`;

    const fullPrompt = `${ctxParts.length > 0 ? `[KONTEKS RUANG KERJA]\n${ctxParts.join("\n")}\n\n` : ""}Pertanyaan Pengguna:\n${message.slice(0, 1200)}`;

    const response = await ai.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: fullPrompt,
      config: { systemInstruction },
    });

    return {
      response: response.text || "Saya siap membantu menjelaskan konsep atau meninjau pendekatan Anda.",
    };
  }
}
