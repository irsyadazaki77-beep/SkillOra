import { db } from "../../db/index.js";
import {
  adaptiveAssessments,
  campusCohorts,
  certificates,
  courses,
  jobApplications,
  jobs,
  labChallenges,
  labSubmissions,
  projectSubmissions,
  users,
} from "../../db/schema.js";
import { and, desc, eq, ne } from "drizzle-orm";
import { UserRepository } from "../repositories/UserRepository.js";
import { ensureSeeded } from "../db/seedData.js";
import { safeParse } from "../../utils/safeJson.js";
import { resolveTierFromXp } from "./arenaService.js";

function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export class CareerExpansionService {
  // --- Smart Talent Matching ---
  static async getTalentMatch(uid: string) {
    await ensureSeeded();
    const userRow = await UserRepository.getOrCreateUser(uid);
    const activeJobs = await db.select().from(jobs).where(eq(jobs.status, "active"));
    const userApps = await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.userId, userRow.id));
    const passedLabs = await db
      .select()
      .from(labSubmissions)
      .where(and(eq(labSubmissions.userId, userRow.id), eq(labSubmissions.passed, true)));
    const userCerts = await db
      .select()
      .from(certificates)
      .where(eq(certificates.userId, userRow.id));

    const userSkillsRaw = safeParse<string[]>(userRow.skills, []);
    const userSkillsLower = userSkillsRaw.map((s) => String(s).toLowerCase());
    const appStatusMap = new Map(userApps.map((a) => [a.jobId, a.status]));

    const labBonus = Math.min(15, passedLabs.length * 5);
    const certBonus = Math.min(15, userCerts.length * 5);

    const matchedList = activeJobs.map((job) => {
      const reqSkills = Array.isArray(job.requiredSkills) ? (job.requiredSkills as string[]) : [];
      const matchedSkills: string[] = [];
      const missingSkills: string[] = [];

      for (const req of reqSkills) {
        const reqLower = req.toLowerCase();
        const hasSkill = userSkillsLower.some((u) => u.includes(reqLower) || reqLower.includes(u));
        if (hasSkill) matchedSkills.push(req);
        else missingSkills.push(req);
      }

      const skillRatio = reqSkills.length > 0 ? matchedSkills.length / reqSkills.length : 0.5;
      const skillMatchScore = Math.round(skillRatio * 70);
      const matchScore = Math.min(99, Math.max(25, skillMatchScore + labBonus + certBonus));

      let recommendedAction = "Siap melamar dengan CV ATS & Portofolio Publik";
      let recommendedPath = "/karier/cv-ats";
      if (missingSkills.length > 0) {
        const primaryMissing = missingSkills[0];
        if (primaryMissing.toLowerCase().includes("sql") || primaryMissing.toLowerCase().includes("react") || primaryMissing.toLowerCase().includes("node") || primaryMissing.toLowerCase().includes("akhlak")) {
          recommendedAction = `Tutup gap "${primaryMissing}" lewat Interactive Lab`;
          recommendedPath = "/lab";
        } else {
          recommendedAction = `Pelajari "${primaryMissing}" di Katalog Kursus`;
          recommendedPath = "/belajar/katalog";
        }
      } else if (passedLabs.length === 0) {
        recommendedAction = "Lulus 1 Interactive Lab untuk +5% skor verifikasi HRD";
        recommendedPath = "/lab";
      }

      return {
        jobId: job.jobId,
        title: job.title,
        company: job.companyName,
        logo: job.companyLogo,
        location: job.location,
        salary: job.salary,
        jobType: job.jobType,
        matchScore,
        skillMatchScore,
        labBonus,
        certBonus,
        matchedSkills,
        missingSkills,
        recommendedAction,
        recommendedPath,
        status: appStatusMap.get(job.jobId) || "Tersedia",
      };
    });

    return matchedList.sort((a, b) => b.matchScore - a.matchScore);
  }

  // --- Public Verified Portfolio Settings ---
  static async updatePortfolioSettings(
    uid: string,
    payload: {
      portfolioSlug?: string;
      portfolioPublic?: boolean;
      portfolioHeadline?: string;
      campusName?: string;
      majorName?: string;
      bio?: string;
    }
  ) {
    const userRow = await UserRepository.getOrCreateUser(uid);
    let nextSlug = userRow.portfolioSlug;

    if (typeof payload.portfolioSlug === "string" && payload.portfolioSlug.trim()) {
      const cleaned = sanitizeSlug(payload.portfolioSlug);
      if (cleaned.length < 3) {
        throw new Error("Slug portofolio minimal 3 karakter (huruf, angka, atau tanda hubung).");
      }
      const conflict = await db.query.users.findFirst({
        where: and(eq(users.portfolioSlug, cleaned), ne(users.id, userRow.id)),
      });
      if (conflict) {
        throw new Error(`Slug "${cleaned}" sudah digunakan pengguna lain.`);
      }
      nextSlug = cleaned;
    } else if (!nextSlug) {
      nextSlug = sanitizeSlug(`${userRow.username || userRow.name || "pelajar"}-${userRow.id}`);
    }

    await db
      .update(users)
      .set({
        portfolioSlug: nextSlug,
        portfolioPublic: typeof payload.portfolioPublic === "boolean" ? payload.portfolioPublic : userRow.portfolioPublic,
        portfolioHeadline:
          typeof payload.portfolioHeadline === "string"
            ? payload.portfolioHeadline.trim().slice(0, 140)
            : userRow.portfolioHeadline,
        campusName:
          typeof payload.campusName === "string" ? payload.campusName.trim().slice(0, 120) : userRow.campusName,
        majorName:
          typeof payload.majorName === "string" ? payload.majorName.trim().slice(0, 120) : userRow.majorName,
        bio: typeof payload.bio === "string" ? payload.bio.trim().slice(0, 500) : userRow.bio,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userRow.id));

    return UserRepository.getFullProfile(uid);
  }

  // --- Public Unauthenticated Portfolio Fetch ---
  static async getPublicPortfolio(slug: string) {
    await ensureSeeded();
    const cleaned = sanitizeSlug(slug);
    if (!cleaned) return null;

    let userRow = await db.query.users.findFirst({
      where: eq(users.portfolioSlug, cleaned),
    });

    // Fallback: match default generated slug pattern `<username>-<id>`
    if (!userRow) {
      const allUsers = await db.select().from(users);
      userRow = allUsers.find((u) => {
        const computed = sanitizeSlug(`${u.username || u.name || "pelajar"}-${u.id}`);
        return computed === cleaned;
      });
    }

    if (!userRow || !userRow.portfolioPublic) {
      return null;
    }

    const [certs, subs, projects, assessments, allCourses, allLabs] = await Promise.all([
      db.select().from(certificates).where(eq(certificates.userId, userRow.id)).orderBy(desc(certificates.issuedAt)),
      db
        .select()
        .from(labSubmissions)
        .where(and(eq(labSubmissions.userId, userRow.id), eq(labSubmissions.passed, true)))
        .orderBy(desc(labSubmissions.score)),
      db
        .select()
        .from(projectSubmissions)
        .where(and(eq(projectSubmissions.userId, userRow.id), eq(projectSubmissions.status, "PASS")))
        .orderBy(desc(projectSubmissions.reviewedAt)),
      db
        .select()
        .from(adaptiveAssessments)
        .where(and(eq(adaptiveAssessments.userId, userRow.id), eq(adaptiveAssessments.status, "completed"))),
      db.select().from(courses),
      db.select().from(labChallenges),
    ]);

    const courseMap = new Map(allCourses.map((c) => [c.courseId, c]));
    const labMap = new Map(allLabs.map((l) => [l.challengeId, l]));

    // Deduplicate best score per lab
    const bestLabByChallenge = new Map<string, typeof subs[number]>();
    for (const s of subs) {
      const existing = bestLabByChallenge.get(s.challengeId);
      if (!existing || s.score > existing.score) {
        bestLabByChallenge.set(s.challengeId, s);
      }
    }
    const labHighlights = Array.from(bestLabByChallenge.values()).map((s) => {
      const lab = labMap.get(s.challengeId);
      return {
        challengeId: s.challengeId,
        title: lab?.title || s.challengeId,
        track: lab?.track || "engineering",
        score: s.score,
        passedAt: s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
      };
    });

    const avgLabScore =
      labHighlights.length > 0
        ? Math.round(labHighlights.reduce((acc, item) => acc + item.score, 0) / labHighlights.length)
        : 0;

    const avgAssessmentScore =
      assessments.length > 0
        ? Math.round(assessments.reduce((acc, a) => acc + (a.abilityScore || 0), 0) / assessments.length)
        : 0;

    return {
      slug: userRow.portfolioSlug || cleaned,
      name: userRow.name,
      avatar: userRow.avatar || "🦁",
      role: userRow.role,
      headline: userRow.portfolioHeadline || userRow.role || "Pelajar Siap Kerja",
      bio: userRow.bio || "Kandidat terverifikasi dengan rekam jejak proyek, lab interaktif, dan asesmen kompetensi di Skillora.",
      campusName: userRow.campusName || null,
      majorName: userRow.majorName || null,
      level: userRow.level,
      xp: userRow.xp,
      streak: userRow.streak,
      leagueTier: resolveTierFromXp(userRow.weeklyXp || 0),
      skills: safeParse<string[]>(userRow.skills, []),
      stats: {
        verifiedCertificates: certs.length,
        passedLabs: labHighlights.length,
        avgLabScore,
        avgAssessmentScore,
      },
      certificates: certs.map((c) => {
        const meta = courseMap.get(c.courseId);
        return {
          id: c.certificateId,
          courseTitle: meta?.title || c.courseId,
          partner: meta?.partner || "Skillora Academy",
          issueDate: c.issuedAt.toISOString().split("T")[0],
          score: c.score || 85,
        };
      }),
      labHighlights,
      projects: projects.map((p) => {
        const meta = courseMap.get(p.courseId);
        return {
          id: `proj_${p.id}`,
          title: meta?.projectTitle || meta?.title || p.courseId,
          url: p.projectUrl,
          score: p.score || 88,
          notes: p.studentCodeNotes || "Proyek industri terverifikasi.",
          reviewedAt: (p.reviewedAt || p.submittedAt || new Date()).toISOString(),
        };
      }),
    };
  }

  // --- Campus & Cohort Hub ---
  static async listCampusCohorts(uid: string) {
    await ensureSeeded();
    const userRow = await UserRepository.getOrCreateUser(uid);
    const rows = await db.select().from(campusCohorts).orderBy(desc(campusCohorts.avgReadiness));

    return rows.map((c) => ({
      id: c.cohortId,
      campusName: c.campusName,
      city: c.city,
      programTitle: c.programTitle,
      targetRole: c.targetRole,
      activeStudents: c.activeStudents,
      avgReadiness: c.avgReadiness,
      certifiedCount: c.certifiedCount,
      featuredLabs: Array.isArray(c.featuredLabs) ? (c.featuredLabs as string[]) : [],
      isJoined: Boolean(userRow.campusName && userRow.campusName.toLowerCase() === c.campusName.toLowerCase()),
    }));
  }

  static async joinCampusCohort(uid: string, cohortId: string, majorName?: string) {
    await ensureSeeded();
    const userRow = await UserRepository.getOrCreateUser(uid);
    const cohort = await db.query.campusCohorts.findFirst({
      where: eq(campusCohorts.cohortId, cohortId),
    });
    if (!cohort) {
      throw new Error("Program kampus tidak ditemukan.");
    }

    const alreadyInThisCampus =
      userRow.campusName && userRow.campusName.toLowerCase() === cohort.campusName.toLowerCase();

    await db
      .update(users)
      .set({
        campusName: cohort.campusName,
        majorName: majorName?.trim() || userRow.majorName || "Teknik Informatika / Manajemen",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userRow.id));

    if (!alreadyInThisCampus) {
      await db
        .update(campusCohorts)
        .set({ activeStudents: cohort.activeStudents + 1 })
        .where(eq(campusCohorts.id, cohort.id));
    }

    const [profile, cohorts] = await Promise.all([
      UserRepository.getFullProfile(uid),
      CareerExpansionService.listCampusCohorts(uid),
    ]);

    return { profile, cohorts };
  }
}
