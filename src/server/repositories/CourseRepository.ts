import { db } from "../../db/index.ts";
import { courses, lessons, userProgress, bookmarks, quizAttempts } from "../../db/schema.ts";
import { ensureSeeded } from "../db/seedData.ts";
import { eq, and, asc, desc } from "drizzle-orm";

function mapDbCourseToFrontend(dbCourse: any, completedLessonIds: Set<number>) {
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
    skills: Array.isArray(dbCourse.skills) ? dbCourse.skills : [],
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
    })),
  };
}

export class CourseRepository {
  static async getCourses(dbUserId: number, includeDrafts = false) {
    await ensureSeeded();

    const progressList = await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, dbUserId));
    const completedLessonIds = new Set(progressList.map((p) => p.lessonId));

    const dbCourses = await db.query.courses.findMany({
      with: { lessons: true },
      orderBy: [desc(courses.id)],
    });

    const filtered = includeDrafts ? dbCourses : dbCourses.filter((c) => c.status !== "draft");
    return filtered.map((c) => mapDbCourseToFrontend(c, completedLessonIds));
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
    data: { title: string; xp?: number; contentMarkdown?: string; estimatedMinutes?: number; questions?: any[] }
  ) {
    const existing = await db.query.courses.findFirst({
      where: eq(courses.courseId, courseIdStr),
      with: { lessons: true },
    });
    if (!existing) throw new Error("Kursus tidak ditemukan.");

    const nextIdx = existing.lessons.length;
    await db.insert(lessons).values({
      lessonId: `les_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      courseId: existing.id,
      title: data.title.trim(),
      type: "quiz",
      orderIndex: nextIdx,
      xpReward: Number(data.xp) || 100,
      contentMarkdown: data.contentMarkdown || `### ${data.title}\n\nMateri pembelajaran interaktif.`,
      estimatedMinutes: Number(data.estimatedMinutes) || 15,
      questionsData: Array.isArray(data.questions) ? data.questions : [],
    });

    const full = await db.query.courses.findFirst({
      where: eq(courses.id, existing.id),
      with: { lessons: true },
    });
    return mapDbCourseToFrontend(full, new Set());
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