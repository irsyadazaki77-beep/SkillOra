import crypto from "crypto";
import { db } from "../../db/index.js";
import {
  courses,
  lessons,
  userProgress,
  bookmarks,
  quizAttempts,
  courseEnrollments,
  learningPaths,
  learningPathCourses,
  certificates,
} from "../../db/schema.js";
import { ensureSeeded } from "../db/seedData.js";
import { eq, and, asc, desc, sql } from "drizzle-orm";

function mapDbCourseToFrontend(
  dbCourse: any,
  completedLessonIds: Set<number>,
  enrolledCourseIds: Set<number> = new Set(),
  enrollmentCounts: Map<number, number> = new Map()
) {
  const sortedLessons = [...(dbCourse.lessons || [])].sort((a, b) => a.orderIndex - b.orderIndex);

  return {
    id: dbCourse.courseId,
    dbId: dbCourse.id,
    title: dbCourse.title,
    description: dbCourse.description,
    category: dbCourse.category || "Teknologi & Data",
    difficulty: (dbCourse.difficulty as "Pemula" | "Menengah" | "Lanjutan") || "Pemula",
    duration: dbCourse.duration || "4 Minggu",
    xpReward: dbCourse.xpReward || 500,
    partner: dbCourse.partner || "Skillora Academy",
    logo: dbCourse.logo || "🎓",
    image: dbCourse.image || "/src/assets/images/course_tech_engineering_1794974031663.jpg",
    enrolledCount: enrollmentCounts.get(dbCourse.id) || 0,
    isEnrolled: enrolledCourseIds.has(dbCourse.id),
    skills: Array.isArray(dbCourse.skills) ? dbCourse.skills : [],
    linkedLabIds: Array.isArray(dbCourse.linkedLabIds) ? dbCourse.linkedLabIds : [],
    casePrompt: dbCourse.casePrompt || null,
    status: dbCourse.status || "published",
    isProOnly: Boolean(dbCourse.isProOnly),
    authorUserId: dbCourse.authorUserId || null,
    project: {
      title: dbCourse.projectTitle || "Proyek Portofolio Akhir",
      description: dbCourse.projectDescription || "Selesaikan proyek akhir untuk sertifikasi.",
      rubric: dbCourse.projectRubric || "Kesesuaian arsitektur, kualitas kode, dan kelengkapan fitur.",
    },
    lessons: sortedLessons.map((les) => ({
      id: les.lessonId,
      dbId: les.id,
      title: les.title,
      xp: les.xpReward || 100,
      completed: completedLessonIds.has(les.id),
      estimatedMinutes: les.estimatedMinutes || 15,
      videoUrl: les.videoUrl || undefined,
      notes: les.contentMarkdown || undefined,
      contentBlocks: les.contentMarkdown
        ? [{ id: `cb_${les.lessonId}`, type: "text" as const, content: les.contentMarkdown }]
        : [],
      questions: Array.isArray(les.questionsData) ? les.questionsData : [],
      inlineChecks: Array.isArray(les.inlineChecks) ? les.inlineChecks : [],
      flashcards: Array.isArray(les.flashcards) ? les.flashcards : [],
    })),
  };
}

export class CourseRepository {
  static async getCourses(dbUserId: number, includeDrafts = false) {
    await ensureSeeded();

    const progressList = dbUserId > 0
      ? await db
          .select()
          .from(userProgress)
          .where(eq(userProgress.userId, dbUserId))
      : [];
    const completedLessonIds = new Set(progressList.map((p) => p.lessonId));

    const userEnrollments = dbUserId > 0
      ? await db
          .select({ courseId: courseEnrollments.courseId })
          .from(courseEnrollments)
          .where(eq(courseEnrollments.userId, dbUserId))
      : [];
    const enrolledCourseIds = new Set(userEnrollments.map((e) => e.courseId));

    const countRows = await db
      .select({
        courseId: courseEnrollments.courseId,
        total: sql<number>`count(*)::int`,
      })
      .from(courseEnrollments)
      .groupBy(courseEnrollments.courseId);
    const enrollmentCounts = new Map<number, number>(
      countRows.map((row) => [row.courseId, Number(row.total) || 0])
    );

    const dbCourses = await db.query.courses.findMany({
      with: { lessons: true },
      orderBy: [desc(courses.id)],
    });

    const filtered = includeDrafts ? dbCourses : dbCourses.filter((c) => c.status !== "draft");
    return filtered.map((c) =>
      mapDbCourseToFrontend(c, completedLessonIds, enrolledCourseIds, enrollmentCounts)
    );
  }

  static async enrollCourse(dbUserId: number, courseIdStr: string) {
    const course = await db.query.courses.findFirst({
      where: eq(courses.courseId, courseIdStr),
    });
    if (!course) throw new Error("Kursus tidak ditemukan.");

    const existing = await db.query.courseEnrollments.findFirst({
      where: and(
        eq(courseEnrollments.userId, dbUserId),
        eq(courseEnrollments.courseId, course.id)
      ),
    });

    let alreadyEnrolled = Boolean(existing);
    if (!existing) {
      await db
        .insert(courseEnrollments)
        .values({ userId: dbUserId, courseId: course.id })
        .onConflictDoNothing();
    }

    const [countRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(courseEnrollments)
      .where(eq(courseEnrollments.courseId, course.id));

    return {
      enrolled: true,
      alreadyEnrolled,
      enrolledCount: Number(countRow?.total) || 1,
      courseTitle: course.title,
    };
  }

  static async getCourseByCourseId(courseIdStr: string) {
    await ensureSeeded();
    return db.query.courses.findFirst({
      where: eq(courses.courseId, courseIdStr),
      with: { lessons: true },
    });
  }

  static async createCourse(
    authorUserId: number,
    data: {
      title: string;
      description?: string;
      category?: string;
      difficulty?: string;
      duration?: string;
      xpReward?: number;
      partner?: string;
      logo?: string;
      skills?: string[];
      projectTitle?: string;
      projectDescription?: string;
      projectRubric?: string;
      status?: string;
      isProOnly?: boolean;
      lessons?: Array<{ title: string; xp?: number; contentMarkdown?: string; estimatedMinutes?: number; questions?: any[] }>;
    }
  ) {
    const courseIdStr = `course_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const image =
      data.category && (data.category.includes("BUMN") || data.category.includes("Bisnis"))
        ? "/src/assets/images/course_bumn_prep_1794974023438.jpg"
        : "/src/assets/images/course_tech_engineering_1794974031663.jpg";

    const [created] = await db
      .insert(courses)
      .values({
        courseId: courseIdStr,
        title: data.title.trim(),
        description: data.description?.trim() || data.title.trim(),
        category: data.category || "Teknologi & Data",
        difficulty: data.difficulty || "Menengah",
        duration: data.duration || "4 Minggu",
        xpReward: Number(data.xpReward) || 500,
        partner: data.partner || "Skillora Mentor Academy",
        logo: data.logo || "🎓",
        image,
        skills: Array.isArray(data.skills) && data.skills.length > 0 ? data.skills : [data.category || "Kompetensi Industri"],
        projectTitle: data.projectTitle || "Proyek Sertifikasi Modul",
        projectDescription: data.projectDescription || "Implementasikan studi kasus nyata sesuai rubrik.",
        projectRubric: data.projectRubric || "Kualitas solusi, kebersihan implementasi, dan dokumentasi.",
        status: data.status === "draft" ? "draft" : "published",
        isProOnly: Boolean(data.isProOnly),
        authorUserId,
      })
      .returning();

    const initialLessons =
      Array.isArray(data.lessons) && data.lessons.length > 0
        ? data.lessons
        : [
            {
              title: "Pengenalan & Konsep Inti",
              xp: 100,
              contentMarkdown: `### Pengenalan ${created.title}\n\nPelajari landasan utama, studi kasus industri, dan praktik terbaik pada modul ini.`,
              estimatedMinutes: 20,
              questions: [
                {
                  id: `q_${Date.now()}_1`,
                  text: `Apa fokus utama yang dipelajari dalam modul ${created.title}?`,
                  options: [
                    "Penguasaan konsep fundamental dan implementasi praktik terbaik",
                    "Hanya membaca definisi tanpa praktik",
                    "Menghindari pengujian hasil kerja",
                    "Menunda dokumentasi proyek",
                  ],
                  answerIndex: 0,
                  explanation: "Setiap modul Skillora dirancang untuk menggabungkan konsep fundamental dan praktik terbaik siap kerja.",
                  competencyTag: "Fundamental",
                },
              ],
            },
          ];

    let idx = 0;
    for (const les of initialLessons) {
      await db.insert(lessons).values({
        lessonId: `les_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`,
        courseId: created.id,
        title: les.title,
        type: "quiz",
        orderIndex: idx++,
        xpReward: Number(les.xp) || 100,
        contentMarkdown: les.contentMarkdown || "",
        estimatedMinutes: Number(les.estimatedMinutes) || 15,
        questionsData: Array.isArray(les.questions) ? les.questions : [],
      });
    }

    const full = await db.query.courses.findFirst({
      where: eq(courses.id, created.id),
      with: { lessons: true },
    });
    return mapDbCourseToFrontend(full, new Set());
  }

  static async updateCourse(courseIdStr: string, updates: Partial<typeof courses.$inferInsert>) {
    const existing = await db.query.courses.findFirst({ where: eq(courses.courseId, courseIdStr) });
    if (!existing) throw new Error("Kursus tidak ditemukan.");

    await db.update(courses).set(updates).where(eq(courses.id, existing.id));
    const full = await db.query.courses.findFirst({
      where: eq(courses.id, existing.id),
      with: { lessons: true },
    });
    return mapDbCourseToFrontend(full, new Set());
  }

  static async deleteCourse(courseIdStr: string) {
    const existing = await db.query.courses.findFirst({ where: eq(courses.courseId, courseIdStr) });
    if (!existing) throw new Error("Kursus tidak ditemukan.");
    await db.delete(courses).where(eq(courses.id, existing.id));
    return { deleted: true, courseId: courseIdStr };
  }

  static async addLesson(
    courseIdStr: string,
    data: {
      title: string;
      xp?: number;
      contentMarkdown?: string;
      estimatedMinutes?: number;
      questions?: any[];
      inlineChecks?: any[];
      flashcards?: any[];
      videoUrl?: string;
    }
  ) {
    const existing = await db.query.courses.findFirst({
      where: eq(courses.courseId, courseIdStr),
      with: { lessons: true },
    });
    if (!existing) throw new Error("Kursus tidak ditemukan.");

    const rawVideo = typeof data.videoUrl === "string" ? data.videoUrl.trim() : "";
    let safeVideoUrl: string | null = null;
    if (rawVideo) {
      try {
        const parsed = new URL(rawVideo);
        if (parsed.protocol === "https:" || parsed.protocol === "http:") {
          safeVideoUrl = rawVideo;
        }
      } catch {
        throw new Error("URL video tidak valid. Gunakan tautan http:// atau https://.");
      }
    }

    const nextIdx = existing.lessons.length;
    await db.insert(lessons).values({
      lessonId: `les_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      courseId: existing.id,
      title: data.title.trim(),
      type: safeVideoUrl ? "video" : "quiz",
      orderIndex: nextIdx,
      xpReward: Number(data.xp) || 100,
      contentMarkdown: data.contentMarkdown || `### ${data.title}\n\nMateri pembelajaran interaktif.`,
      estimatedMinutes: Number(data.estimatedMinutes) || 15,
      videoUrl: safeVideoUrl,
      questionsData: Array.isArray(data.questions) ? data.questions : [],
      inlineChecks: Array.isArray(data.inlineChecks) ? data.inlineChecks : [],
      flashcards: Array.isArray(data.flashcards) ? data.flashcards : [],
    });

    const full = await db.query.courses.findFirst({
      where: eq(courses.id, existing.id),
      with: { lessons: true },
    });
    return mapDbCourseToFrontend(full, new Set());
  }

  static async getLearningPaths(dbUserId: number) {
    await ensureSeeded();

    const pathRows = await db.select().from(learningPaths).orderBy(asc(learningPaths.id));
    const linkRows = await db.select().from(learningPathCourses).orderBy(asc(learningPathCourses.stepOrder));
    const allCourses = await CourseRepository.getCourses(dbUserId, false);
    const byDbId = new Map<number, any>(allCourses.map((c: any) => [c.dbId, c]));

    const userSpecCerts =
      dbUserId > 0
        ? await db
            .select()
            .from(certificates)
            .where(and(eq(certificates.userId, dbUserId), eq(certificates.certificateType, "specialization")))
        : [];
    const specCertBySlug = new Map(userSpecCerts.map((c) => [c.pathSlug, c.certificateId]));

    return pathRows
      .map((path) => {
        const links = linkRows.filter((l) => l.pathId === path.id);
        const mappedCourses = links
          .map((l) => {
            const c = byDbId.get(l.courseId);
            if (!c) return null;
            const completedLessonsCount = c.lessons.filter((les: any) => les.completed).length;
            return {
              id: c.id,
              title: c.title,
              difficulty: c.difficulty,
              duration: c.duration,
              lessonsCount: c.lessons.length,
              completedLessonsCount,
              isEnrolled: Boolean(c.isEnrolled),
              stepOrder: l.stepOrder,
            };
          })
          .filter(Boolean) as any[];

        const totalModules = mappedCourses.reduce((sum, c) => sum + c.lessonsCount, 0);
        const completedModules = mappedCourses.reduce((sum, c) => sum + c.completedLessonsCount, 0);
        const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

        return {
          slug: path.slug,
          title: path.title,
          description: path.description,
          targetRole: path.targetRole,
          level: path.level,
          courses: mappedCourses,
          totalModules,
          progressPercent,
          firstCourseId: mappedCourses[0]?.id || "",
          allEnrolled: mappedCourses.length > 0 && mappedCourses.every((c) => c.isEnrolled),
          specializationCertId: specCertBySlug.get(path.slug) || null,
        };
      })
      .filter((p) => p.courses.length > 0);
  }

  static async claimLearningPathCertificate(
    dbUserId: number,
    recipientName: string,
    pathSlug: string
  ) {
    const paths = await CourseRepository.getLearningPaths(dbUserId);
    const targetPath = paths.find((p) => p.slug === pathSlug);
    if (!targetPath) throw new Error("Jalur karier tidak ditemukan.");

    if (targetPath.progressPercent < 100) {
      throw new Error(
        `Selesaikan seluruh modul pada jalur '${targetPath.title}' terlebih dahulu (${targetPath.progressPercent}%/100%).`
      );
    }

    const existing = await db
      .select()
      .from(certificates)
      .where(
        and(
          eq(certificates.userId, dbUserId),
          eq(certificates.pathSlug, pathSlug),
          eq(certificates.certificateType, "specialization")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return {
        alreadyIssued: true,
        certificateId: existing[0].certificateId,
        title: targetPath.title,
      };
    }

    const certId = crypto.randomBytes(12).toString("hex");
    const verificationCode = `SKILLORA-SPEC-${pathSlug.slice(0, 6).toUpperCase()}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    await db.insert(certificates).values({
      certificateId: certId,
      userId: dbUserId,
      courseId: targetPath.title,
      certificateType: "specialization",
      pathSlug,
      recipientName,
      score: 96,
      status: "valid",
      verificationCode,
      metadata: {
        type: "specialization",
        coursesCount: targetPath.courses.length,
        totalModules: targetPath.totalModules,
      },
    });

    return {
      alreadyIssued: false,
      certificateId: certId,
      verificationCode,
      title: targetPath.title,
    };
  }

  static async updateLesson(
    courseIdStr: string,
    lessonIdStr: string,
    data: { title?: string; xp?: number; contentMarkdown?: string; estimatedMinutes?: number; videoUrl?: string }
  ) {
    const existingCourse = await db.query.courses.findFirst({
      where: eq(courses.courseId, courseIdStr),
    });
    if (!existingCourse) throw new Error("Kursus tidak ditemukan.");

    const existingLesson = await db.query.lessons.findFirst({
      where: and(eq(lessons.lessonId, lessonIdStr), eq(lessons.courseId, existingCourse.id)),
    });
    if (!existingLesson) throw new Error("Modul tidak ditemukan di kursus ini.");

    const updates: Partial<typeof lessons.$inferInsert> = {};
    if (typeof data.title === "string" && data.title.trim()) updates.title = data.title.trim();
    if (data.xp !== undefined) updates.xpReward = Math.max(10, Number(data.xp) || 50);
    if (data.estimatedMinutes !== undefined) updates.estimatedMinutes = Math.max(5, Number(data.estimatedMinutes) || 15);
    if (typeof data.contentMarkdown === "string") updates.contentMarkdown = data.contentMarkdown;
    if (data.videoUrl !== undefined) {
      const trimmedUrl = String(data.videoUrl || "").trim();
      if (!trimmedUrl) {
        updates.videoUrl = null;
      } else {
        const parsed = new URL(trimmedUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          throw new Error("URL video tidak valid.");
        }
        updates.videoUrl = trimmedUrl;
      }
    }

    await db.update(lessons).set(updates).where(eq(lessons.id, existingLesson.id));

    const full = await db.query.courses.findFirst({
      where: eq(courses.id, existingCourse.id),
      with: { lessons: true },
    });
    return mapDbCourseToFrontend(full, new Set());
  }

  static async deleteLesson(courseIdStr: string, lessonIdStr: string) {
    const existingCourse = await db.query.courses.findFirst({
      where: eq(courses.courseId, courseIdStr),
    });
    if (!existingCourse) throw new Error("Kursus tidak ditemukan.");

    const existingLesson = await db.query.lessons.findFirst({
      where: and(eq(lessons.lessonId, lessonIdStr), eq(lessons.courseId, existingCourse.id)),
    });
    if (!existingLesson) throw new Error("Modul tidak ditemukan.");

    await db.delete(lessons).where(eq(lessons.id, existingLesson.id));

    const remaining = await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, existingCourse.id))
      .orderBy(asc(lessons.orderIndex));

    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].orderIndex !== i) {
        await db.update(lessons).set({ orderIndex: i }).where(eq(lessons.id, remaining[i].id));
      }
    }

    const full = await db.query.courses.findFirst({
      where: eq(courses.id, existingCourse.id),
      with: { lessons: true },
    });
    return mapDbCourseToFrontend(full, new Set());
  }

  static async getLmsAnalytics() {
    const [allCourses, enrollRows, progressRows, quizRows] = await Promise.all([
      db.query.courses.findMany({ with: { lessons: true }, orderBy: [desc(courses.id)] }),
      db
        .select({
          courseId: courseEnrollments.courseId,
          total: sql<number>`count(*)::int`,
        })
        .from(courseEnrollments)
        .groupBy(courseEnrollments.courseId),
      db
        .select({
          courseId: userProgress.courseId,
          total: sql<number>`count(*)::int`,
        })
        .from(userProgress)
        .groupBy(userProgress.courseId),
      db
        .select({
          courseId: quizAttempts.courseId,
          attempts: sql<number>`count(*)::int`,
          avgScore: sql<number>`coalesce(round(avg(${quizAttempts.score})), 0)::int`,
        })
        .from(quizAttempts)
        .groupBy(quizAttempts.courseId),
    ]);

    const enrollMap = new Map(enrollRows.map((r) => [r.courseId, Number(r.total) || 0]));
    const progMap = new Map(progressRows.map((r) => [r.courseId, Number(r.total) || 0]));
    const quizMap = new Map(
      quizRows.map((r) => [r.courseId, { attempts: Number(r.attempts) || 0, avgScore: Number(r.avgScore) || 0 }])
    );

    return allCourses.map((c) => {
      const q = quizMap.get(c.id) || { attempts: 0, avgScore: 0 };
      return {
        courseId: c.courseId,
        title: c.title,
        lessonsCount: c.lessons?.length || 0,
        enrollmentsCount: enrollMap.get(c.id) || 0,
        completionsCount: progMap.get(c.id) || 0,
        quizAttemptsCount: q.attempts,
        avgQuizScore: q.avgScore,
      };
    });
  }

  static async enrollLearningPath(dbUserId: number, pathSlug: string) {
    await ensureSeeded();
    const [path] = await db.select().from(learningPaths).where(eq(learningPaths.slug, pathSlug));
    if (!path) throw new Error("Jalur karier tidak ditemukan.");

    const links = await db
      .select()
      .from(learningPathCourses)
      .where(eq(learningPathCourses.pathId, path.id));

    for (const link of links) {
      await db
        .insert(courseEnrollments)
        .values({ userId: dbUserId, courseId: link.courseId })
        .onConflictDoNothing();
    }

    return {
      slug: path.slug,
      title: path.title,
      enrolledCourses: links.length,
    };
  }

  static async completeLesson(dbUserId: number, courseIdStr: string, lessonIdStr: string) {
    const dbCourse = await db.query.courses.findFirst({
      where: eq(courses.courseId, courseIdStr),
    });
    if (!dbCourse) throw new Error("Kursus tidak ditemukan di database.");

    const dbLesson = await db.query.lessons.findFirst({
      where: eq(lessons.lessonId, lessonIdStr),
    });
    if (!dbLesson) throw new Error("Pelajaran tidak ditemukan di database.");

    const existing = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, dbUserId),
          eq(userProgress.courseId, dbCourse.id),
          eq(userProgress.lessonId, dbLesson.id)
        )
      )
      .limit(1);

    const isFirstTime = existing.length === 0;

    if (isFirstTime) {
      await db.insert(userProgress).values({
        userId: dbUserId,
        courseId: dbCourse.id,
        lessonId: dbLesson.id,
        completed: true,
      });
    }

    return { isFirstTime, dbCourseId: dbCourse.id, dbLessonId: dbLesson.id };
  }

  static async toggleBookmarkCourse(dbUserId: number, courseIdStr: string) {
    const dbCourse = await db.query.courses.findFirst({
      where: eq(courses.courseId, courseIdStr),
    });
    if (!dbCourse) throw new Error("Kursus tidak ditemukan.");

    const existing = await db
      .select()
      .from(bookmarks)
      .where(and(eq(bookmarks.userId, dbUserId), eq(bookmarks.courseId, dbCourse.id)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(bookmarks).where(and(eq(bookmarks.userId, dbUserId), eq(bookmarks.courseId, dbCourse.id)));
    } else {
      await db.insert(bookmarks).values({
        userId: dbUserId,
        courseId: dbCourse.id,
      });
    }
  }

  static async saveQuizAttempt(dbUserId: number, courseIdStr: string, lessonIdStr: string, score: number, passed: boolean) {
    const dbCourse = await db.query.courses.findFirst({
      where: eq(courses.courseId, courseIdStr),
    });
    if (!dbCourse) return;

    const dbLesson = await db.query.lessons.findFirst({
      where: eq(lessons.lessonId, lessonIdStr),
    });
    if (!dbLesson) return;

    await db.insert(quizAttempts).values({
      userId: dbUserId,
      courseId: dbCourse.id,
      lessonId: dbLesson.id,
      score,
      passed,
    });
  }
}