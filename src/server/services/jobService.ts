import { UserRepository } from "../repositories/UserRepository.js";
import { CareerRepository } from "../repositories/CareerRepository.js";
import { NotificationRepository } from "../repositories/NotificationRepository.js";
import { db } from "../../db/index.js";
import { jobApplications, jobs } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export class JobService {
  static async getJobs(userId: string) {
    const profile = await UserRepository.getFullProfile(userId);
    const userSkills = (profile.skills || []).map((s: any) => (typeof s === "string" ? s : s.name).toLowerCase());

    const activeJobs = await CareerRepository.listActiveJobs();
    const apps = await CareerRepository.getApplications(profile.id);
    const appMap = new Map(apps.map((a) => [a.jobId, a]));

    return activeJobs.map((job) => {
      const reqSkills: string[] = Array.isArray(job.requiredSkills) ? (job.requiredSkills as string[]) : [];
      const matchCount = reqSkills.filter((skill) => userSkills.includes(skill.toLowerCase())).length;
      const matchPercentage =
        reqSkills.length > 0 ? Math.min(100, Math.round((matchCount / reqSkills.length) * 100)) : 70;
      const app = appMap.get(job.jobId);

      return {
        id: job.jobId,
        dbId: job.id,
        companyId: job.companyId,
        title: job.title,
        company: job.companyName,
        logo: job.companyLogo || "🏢",
        salary: job.salary,
        location: job.location,
        jobType: job.jobType || "Full-time",
        requiredSkills: reqSkills,
        description: job.description,
        matchPercentage,
        status: app ? app.status : "Tersedia",
        hrNotes: app?.hrNotes || null,
        interviewAt: app?.interviewAt ? app.interviewAt.toISOString() : null,
      };
    });
  }

  static async applyJob(userId: string, jobId: string, cvDocumentId?: number | null, coverNote?: string) {
    const profile = await UserRepository.getFullProfile(userId);
    const allJobs = await JobService.getJobs(userId);
    const job = allJobs.find((j) => j.id === jobId);
    if (!job) throw new Error("Lowongan tidak ditemukan");

    const existingApps = await CareerRepository.getApplications(profile.id);
    if (existingApps.some((app) => app.jobId === jobId)) {
      throw new Error("Anda sudah melamar pekerjaan ini.");
    }

    await CareerRepository.applyJob(profile.id, jobId, "Terkirim", cvDocumentId, coverNote);

    await UserRepository.updateUserRow(profile.id, {
      careerStage: "applied",
      updatedAt: new Date(),
    });

    const notifText = `💼 Lamaran dikirim otomatis ke HRD ${job.company} untuk posisi '${job.title}'!`;
    await NotificationRepository.addNotification(profile.id, notifText, "job");

    const updatedProfile = await UserRepository.getFullProfile(userId);
    return {
      job: { ...job, status: "Terkirim" },
      profile: updatedProfile,
    };
  }

  // Recruiter / HRD Portal Services
  static async getRecruiterOverview(userId: string) {
    const userRow = await UserRepository.getOrCreateUser(userId, "recruiter@skillora.app", "Recruiter HRD");
    const company = await CareerRepository.getOrCreateRecruiterCompany(userRow);
    const allJobs = await CareerRepository.listAllJobs();
    const companyJobs =
      userRow.accountRole === "admin" || !company
        ? allJobs
        : allJobs.filter((j) => j.companyId === company.id || j.postedByUserId === userRow.id);

    const applicants = await CareerRepository.getRecruiterApplicants(userRow);
    const allApps = await db.select().from(jobApplications);

    const countByJob = new Map<string, number>();
    for (const a of allApps) {
      countByJob.set(a.jobId, (countByJob.get(a.jobId) || 0) + 1);
    }

    return {
      company,
      jobs: companyJobs.map((j) => ({
        id: j.jobId,
        dbId: j.id,
        title: j.title,
        company: j.companyName,
        logo: j.companyLogo,
        salary: j.salary,
        location: j.location,
        jobType: j.jobType,
        requiredSkills: Array.isArray(j.requiredSkills) ? j.requiredSkills : [],
        description: j.description,
        status: j.status,
        applicantCount: countByJob.get(j.jobId) || 0,
        createdAt: j.createdAt ? j.createdAt.toISOString() : new Date().toISOString(),
      })),
      applicants,
      metrics: {
        activeJobs: companyJobs.filter((j) => j.status === "active").length,
        totalApplicants: applicants.length,
        interviewStage: applicants.filter((a) => a.status === "Interview").length,
        offeredStage: applicants.filter((a) => a.status === "Ditawarkan").length,
      },
    };
  }

  static async upsertCompany(
    userId: string,
    data: { name: string; industry?: string; logo?: string; location?: string; website?: string; description?: string }
  ) {
    if (!data?.name?.trim()) throw new Error("Nama perusahaan wajib diisi.");
    const userRow = await UserRepository.getOrCreateUser(userId, "recruiter@skillora.app", "Recruiter HRD");
    return CareerRepository.upsertCompany(userRow, data);
  }

  static async createRecruiterJob(
    userId: string,
    data: {
      title: string;
      salary: string;
      location: string;
      jobType?: string;
      requiredSkills: string[];
      description: string;
    }
  ) {
    if (!data?.title?.trim() || !data?.salary?.trim() || !data?.location?.trim()) {
      throw new Error("Judul posisi, rentang gaji, dan lokasi wajib diisi.");
    }
    const userRow = await UserRepository.getOrCreateUser(userId, "recruiter@skillora.app", "Recruiter HRD");
    const created = await CareerRepository.createJob(userRow, data);
    await NotificationRepository.addNotification(
      userRow.id,
      `📢 Lowongan '${created.title}' berhasil dipublikasikan ke Bursa Kerja Skillora.`
    );
    return created;
  }

  static async updateRecruiterJob(
    userId: string,
    jobId: string,
    data: { status?: "active" | "closed"; title?: string; salary?: string; location?: string; description?: string }
  ) {
    const existing = await CareerRepository.getJobByJobId(jobId);
    if (!existing) throw new Error("Lowongan tidak ditemukan.");

    const userRow = await UserRepository.getOrCreateUser(userId, "recruiter@skillora.app", "Recruiter HRD");
    const isAdmin = userRow.accountRole === "admin" || ["Admin", "Developer"].includes(userRow.role);
    const ownsJob =
      existing.postedByUserId === userRow.id ||
      (userRow.companyId !== null && existing.companyId === userRow.companyId);

    if (!isAdmin && !ownsJob) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin untuk mengubah lowongan ini.");
    }

    const updates: Partial<typeof jobs.$inferInsert> = {};
    if (data.status === "active" || data.status === "closed") updates.status = data.status;
    if (data.title?.trim()) updates.title = data.title.trim();
    if (data.salary?.trim()) updates.salary = data.salary.trim();
    if (data.location?.trim()) updates.location = data.location.trim();
    if (data.description?.trim()) updates.description = data.description.trim();

    const [updated] = await db.update(jobs).set(updates).where(eq(jobs.jobId, jobId)).returning();
    return updated;
  }

  static async updateApplicationStatus(
    userId: string,
    applicationId: number,
    data: { status: string; hrNotes?: string; interviewAt?: string | null }
  ) {
    const allowed = ["Terkirim", "Screening", "Interview", "Ditawarkan", "Ditolak"];
    if (!allowed.includes(data.status)) {
      throw new Error("Status pipeline tidak valid.");
    }

    const [existingApp] = await db.select().from(jobApplications).where(eq(jobApplications.id, applicationId));
    if (!existingApp) throw new Error("Data lamaran tidak ditemukan.");

    const job = await CareerRepository.getJobByJobId(existingApp.jobId);
    const userRow = await UserRepository.getOrCreateUser(userId, "recruiter@skillora.app", "Recruiter HRD");
    const isAdmin = userRow.accountRole === "admin" || ["Admin", "Developer"].includes(userRow.role);
    const ownsJob =
      job &&
      (job.postedByUserId === userRow.id ||
        (userRow.companyId !== null && job.companyId === userRow.companyId));

    if (!isAdmin && !ownsJob) {
      throw new Error("Akses ditolak: Anda tidak memiliki izin untuk mengubah status lamaran ini.");
    }

    const updated = await CareerRepository.updateApplicationPipeline(applicationId, data);

    if (data.status === "Ditawarkan") {
      await UserRepository.updateUserRow(updated.userId, { careerStage: "hired", updatedAt: new Date() });
    }
    await NotificationRepository.addNotification(
      updated.userId,
      `📩 Status lamaran Anda untuk '${job?.title || updated.jobId}' diperbarui menjadi: ${data.status}.`,
      "job"
    );

    return updated;
  }

  static async searchTalent(skillFilter?: string) {
    return CareerRepository.searchVerifiedTalents(skillFilter);
  }

  static async inviteTalent(
    userId: string,
    body: { candidateId: number; jobTitle: string; message: string; companyName?: string }
  ) {
    const recruiter = await UserRepository.getFullProfile(userId);
    const candidateId = Number(body?.candidateId);
    if (!Number.isInteger(candidateId) || candidateId <= 0) {
      throw new Error("candidateId wajib valid.");
    }
    if (!body?.jobTitle?.trim() || !body?.message?.trim()) {
      throw new Error("Judul posisi dan pesan undangan wajib diisi.");
    }
    return CareerRepository.inviteTalent(
      { id: recruiter.id, name: recruiter.name },
      candidateId,
      {
        jobTitle: body.jobTitle,
        message: body.message,
        companyName: body.companyName || recruiter.company?.name,
      }
    );
  }
}
