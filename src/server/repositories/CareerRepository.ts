import { db } from "../../db/index.js";
import {
  jobs,
  companies,
  jobApplications,
  jobBookmarks,
  users,
  cvDocuments,
  certificates,
  talentInvitations,
  notifications,
} from "../../db/schema.js";
import { ensureSeeded } from "../db/seedData.js";
import { eq, and, desc, inArray } from "drizzle-orm";
import { safeParse } from "../../utils/safeJson.js";

export class CareerRepository {
  static async listActiveJobs() {
    await ensureSeeded();
    return db.select().from(jobs).where(eq(jobs.status, "active")).orderBy(desc(jobs.id));
  }

  static async listAllJobs() {
    await ensureSeeded();
    return db.select().from(jobs).orderBy(desc(jobs.id));
  }

  static async getJobByJobId(jobId: string) {
    await ensureSeeded();
    return db.query.jobs.findFirst({ where: eq(jobs.jobId, jobId) });
  }

  static async getApplications(dbUserId: number) {
    return db.select().from(jobApplications).where(eq(jobApplications.userId, dbUserId));
  }

  static async applyJob(
    dbUserId: number,
    jobId: string,
    status: string,
    cvDocumentId?: number | null,
    coverNote?: string
  ) {
    const [inserted] = await db
      .insert(jobApplications)
      .values({
        userId: dbUserId,
        jobId,
        status,
        cvDocumentId: cvDocumentId || null,
        coverNote: coverNote || null,
      })
      .returning();
    return inserted;
  }

  static async toggleBookmark(dbUserId: number, jobId: string) {
    const existing = await db
      .select()
      .from(jobBookmarks)
      .where(and(eq(jobBookmarks.userId, dbUserId), eq(jobBookmarks.jobId, jobId)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .delete(jobBookmarks)
        .where(and(eq(jobBookmarks.userId, dbUserId), eq(jobBookmarks.jobId, jobId)));
      return false;
    } else {
      await db.insert(jobBookmarks).values({ userId: dbUserId, jobId });
      return true;
    }
  }

  // Recruiter / HRD Portal Queries
  static async getOrCreateRecruiterCompany(userRow: typeof users.$inferSelect) {
    if (userRow.companyId) {
      const comp = await db.query.companies.findFirst({ where: eq(companies.id, userRow.companyId) });
      if (comp) return comp;
    }

    const existingByOwner = await db.query.companies.findFirst({ where: eq(companies.ownerUid, userRow.uid) });
    if (existingByOwner) {
      await db.update(users).set({ companyId: existingByOwner.id }).where(eq(users.id, userRow.id));
      return existingByOwner;
    }

    return null;
  }

  static async upsertCompany(
    userRow: typeof users.$inferSelect,
    data: { name: string; industry?: string; logo?: string; location?: string; website?: string; description?: string }
  ) {
    const existing = await CareerRepository.getOrCreateRecruiterCompany(userRow);
    if (existing) {
      const [updated] = await db
        .update(companies)
        .set({
          name: data.name.trim(),
          industry: data.industry?.trim() || existing.industry,
          logo: data.logo || existing.logo,
          location: data.location?.trim() || existing.location,
          website: data.website?.trim() || existing.website,
          description: data.description?.trim() || existing.description,
        })
        .where(eq(companies.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(companies)
      .values({
        name: data.name.trim(),
        industry: data.industry?.trim() || "Teknologi & Digital",
        logo: data.logo || "🏢",
        location: data.location?.trim() || "Jakarta, Indonesia",
        website: data.website?.trim() || null,
        description: data.description?.trim() || "Perusahaan mitra resmi Skillora.",
        verified: true,
        ownerUid: userRow.uid,
      })
      .returning();

    await db.update(users).set({ companyId: created.id }).where(eq(users.id, userRow.id));
    return created;
  }

  static async createJob(
    recruiterUser: typeof users.$inferSelect,
    data: {
      title: string;
      salary: string;
      location: string;
      jobType?: string;
      requiredSkills: string[];
      description: string;
      companyName?: string;
      companyLogo?: string;
    }
  ) {
    const comp = await CareerRepository.getOrCreateRecruiterCompany(recruiterUser);
    const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;

    const [created] = await db
      .insert(jobs)
      .values({
        jobId,
        companyId: comp?.id || null,
        companyName: data.companyName?.trim() || comp?.name || "Mitra Perusahaan Skillora",
        companyLogo: data.companyLogo || comp?.logo || "🏢",
        title: data.title.trim(),
        salary: data.salary.trim(),
        location: data.location.trim(),
        jobType: data.jobType || "Full-time",
        requiredSkills: Array.isArray(data.requiredSkills) ? data.requiredSkills : [],
        description: data.description.trim(),
        status: "active",
        postedByUserId: recruiterUser.id,
      })
      .returning();

    return created;
  }

  static async updateJobStatus(jobId: string, status: "active" | "closed") {
    const [updated] = await db.update(jobs).set({ status }).where(eq(jobs.jobId, jobId)).returning();
    if (!updated) throw new Error("Lowongan tidak ditemukan.");
    return updated;
  }

  static async getRecruiterApplicants(recruiterUser: typeof users.$inferSelect) {
    await ensureSeeded();
    const allJobs = await db.select().from(jobs).orderBy(desc(jobs.id));
    const recruiterJobs =
      recruiterUser.accountRole === "admin" || !recruiterUser.companyId
        ? allJobs
        : allJobs.filter((j) => j.companyId === recruiterUser.companyId || j.postedByUserId === recruiterUser.id);

    const jobMap = new Map(allJobs.map((j) => [j.jobId, j]));
    const recruiterJobIds = new Set(recruiterJobs.map((j) => j.jobId));

    const allApps = await db.select().from(jobApplications).orderBy(desc(jobApplications.appliedAt));
    const relevantApps = allApps.filter((a) => recruiterJobIds.has(a.jobId));
    if (relevantApps.length === 0) return [];

    const candidateIds = Array.from(new Set(relevantApps.map((a) => a.userId)));

    const [scopedUsers, scopedCvs, scopedCerts] = await Promise.all([
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatar: users.avatar,
          level: users.level,
          xp: users.xp,
          skills: users.skills,
        })
        .from(users)
        .where(inArray(users.id, candidateIds)),
      db.select().from(cvDocuments).where(inArray(cvDocuments.userId, candidateIds)),
      db
        .select()
        .from(certificates)
        .where(and(inArray(certificates.userId, candidateIds), eq(certificates.status, "valid"))),
    ]);

    const userMap = new Map(scopedUsers.map((u) => [u.id, u]));
    const cvMap = new Map(scopedCvs.map((cv) => [cv.id, cv]));

    return relevantApps.map((app) => {
      const candidate = userMap.get(app.userId);
      const job = jobMap.get(app.jobId);
      const cv = app.cvDocumentId ? cvMap.get(app.cvDocumentId) : scopedCvs.find((c) => c.userId === app.userId);
      const candidateCerts = scopedCerts.filter((c) => c.userId === app.userId);

      return {
        applicationId: app.id,
        jobId: app.jobId,
        jobTitle: job?.title || app.jobId,
        companyName: job?.companyName || "Mitra Skillora",
        status: app.status,
        hrNotes: app.hrNotes || "",
        interviewAt: app.interviewAt ? app.interviewAt.toISOString() : null,
        coverNote: app.coverNote || "",
        appliedAt: app.appliedAt ? app.appliedAt.toISOString() : new Date().toISOString(),
        candidate: candidate
          ? {
              id: candidate.id,
              name: candidate.name,
              email: candidate.email,
              avatar: candidate.avatar || "🦁",
              level: candidate.level,
              xp: candidate.xp,
              skills: safeParse<any[]>(candidate.skills, []),
              certifiedCount: candidateCerts.length,
              atsScore: cv?.atsScore || null,
              cvSummary: cv?.summary || null,
            }
          : null,
      };
    });
  }

  static async updateApplicationPipeline(
    applicationId: number,
    updates: { status: string; hrNotes?: string; interviewAt?: string | null }
  ) {
    const [existing] = await db.select().from(jobApplications).where(eq(jobApplications.id, applicationId));
    if (!existing) throw new Error("Data lamaran tidak ditemukan.");

    const [updated] = await db
      .update(jobApplications)
      .set({
        status: updates.status,
        hrNotes: updates.hrNotes !== undefined ? updates.hrNotes : existing.hrNotes,
        interviewAt: updates.interviewAt ? new Date(updates.interviewAt) : existing.interviewAt,
        updatedAt: new Date(),
      })
      .where(eq(jobApplications.id, applicationId))
      .returning();

    return updated;
  }

  static async searchVerifiedTalents(skillFilter?: string) {
    const candidateRows = await db
      .select()
      .from(users)
      .where(eq(users.accountRole, "student"))
      .orderBy(desc(users.xp))
      .limit(80);

    const candidateIds = candidateRows.map((u) => u.id);
    const [certRows, cvRows] =
      candidateIds.length > 0
        ? await Promise.all([
            db
              .select()
              .from(certificates)
              .where(and(eq(certificates.status, "valid"), inArray(certificates.userId, candidateIds))),
            db.select().from(cvDocuments).where(inArray(cvDocuments.userId, candidateIds)),
          ])
        : [[], []];

    const certsByUser = new Map<number, typeof certRows>();
    for (const c of certRows) {
      const arr = certsByUser.get(c.userId) || [];
      arr.push(c);
      certsByUser.set(c.userId, arr);
    }

    const cvByUser = new Map<number, (typeof cvRows)[number]>();
    for (const cv of cvRows) {
      if (!cvByUser.has(cv.userId)) cvByUser.set(cv.userId, cv);
    }

    return candidateRows
      .map((u) => {
        const skills = safeParse<any[]>(u.skills, []).map((s: any) => (typeof s === "string" ? s : s.name));
        const certs = certsByUser.get(u.id) || [];
        const cv = cvByUser.get(u.id);
        const fallbackSlug =
          u.portfolioSlug ||
          `${(u.name || "talenta")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")}-${u.id}`;

        return {
          id: u.id,
          name: u.name,
          avatar: u.avatar || "🦁",
          role: u.role,
          level: u.level,
          xp: u.xp,
          skills,
          portfolioSlug: fallbackSlug,
          certificateCount: certs.length,
          certificatesCount: certs.length,
          certificates: certs.slice(0, 3).map((c) => ({
            id: c.certificateId,
            courseId: c.courseId,
            verificationCode: c.verificationCode || c.certificateId.slice(0, 10).toUpperCase(),
          })),
          atsScore: cv?.atsScore || 0,
          jobReadyVerified: certs.length >= 1 && (u.level || 1) >= 2,
          bio: u.bio || "Kandidat terverifikasi Skillora.",
        };
      })
      .filter((t) => {
        if (!skillFilter || !skillFilter.trim()) return true;
        const q = skillFilter.toLowerCase().trim();
        return (
          t.name.toLowerCase().includes(q) ||
          t.role.toLowerCase().includes(q) ||
          t.skills.some((s: string) => s.toLowerCase().includes(q))
        );
      })
      .slice(0, 30);
  }

  static async inviteTalent(
    recruiterRow: { id: number; name: string },
    candidateId: number,
    data: { jobTitle: string; message: string; companyName?: string }
  ) {
    const [candidate] = await db
      .select()
      .from(users)
      .where(eq(users.id, candidateId))
      .limit(1);
    if (!candidate) throw new Error("Kandidat tidak ditemukan.");

    const company = await db.query.companies.findFirst({
      where: eq(companies.ownerUid, String(recruiterRow.id)),
    });
    const resolvedCompany = data.companyName?.trim() || company?.name || "Perusahaan Mitra SkillOra";

    const [created] = await db
      .insert(talentInvitations)
      .values({
        recruiterUserId: recruiterRow.id,
        candidateUserId: candidate.id,
        companyName: resolvedCompany,
        jobTitle: data.jobTitle.trim(),
        message: data.message.trim(),
        status: "sent",
      })
      .returning();

    await db.insert(notifications).values({
      userId: candidate.id,
      text: `💼 Undangan Wawancara dari ${resolvedCompany} untuk posisi '${data.jobTitle.trim()}'!`,
      type: "system",
      read: false,
    });

    return {
      invitationId: created.id,
      candidateName: candidate.name,
      companyName: resolvedCompany,
      jobTitle: created.jobTitle,
      status: created.status,
    };
  }
}