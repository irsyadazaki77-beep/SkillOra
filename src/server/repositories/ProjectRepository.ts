import { db } from "../../db/index.ts";
import { projectSubmissions } from "../../db/schema.ts";
import { eq, and } from "drizzle-orm";

export class ProjectRepository {
  static async getAllSubmissions(dbUserId: number) {
    return db.select()
      .from(projectSubmissions)
      .where(eq(projectSubmissions.userId, dbUserId));
  }

  static async getSubmission(dbUserId: number, courseId: string) {
    const rows = await db.select()
      .from(projectSubmissions)
      .where(
        and(
          eq(projectSubmissions.userId, dbUserId),
          eq(projectSubmissions.courseId, courseId)
        )
      )
      .limit(1);
    return rows[0] || null;
  }

  static async submitProject(
    dbUserId: number,
    courseId: string,
    projectUrl: string,
    studentCodeNotes: string,
    status: string,
    score: number,
    strengths: string[],
    weaknesses: string[],
    feedback?: string,
    earnedCertificateId?: string
  ) {
    // Delete any existing submission for clean override
    await db.delete(projectSubmissions).where(
      and(
        eq(projectSubmissions.userId, dbUserId),
        eq(projectSubmissions.courseId, courseId)
      )
    );

    const [inserted] = await db.insert(projectSubmissions).values({
       userId: dbUserId,
       courseId,
       projectUrl,
       studentCodeNotes,
       status,
       score,
       strengths: strengths,
       weaknesses: weaknesses,
       feedback,
       earnedCertificateId,
     }).returning();

    return inserted;
  }
}