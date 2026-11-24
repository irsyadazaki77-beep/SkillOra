import { Course, Lesson } from "../types";

export interface CourseProgressInfo {
  percentage: number;
  completedCount: number;
  totalCount: number;
  status: "Belum Dimulai" | "Sedang Dipelajari" | "Selesai";
  nextLessonIndex: number;
  nextLesson: Lesson | null;
  isCompleted: boolean;
}

export interface StructuredModule {
  id: string;
  moduleNumber: number;
  title: string;
  description?: string;
  lessons: {
    lesson: Lesson;
    indexInCourse: number;
    indexInModule: number;
    isCompleted: boolean;
    isCurrent: boolean;
    isLocked: boolean;
  }[];
  completedLessonsCount: number;
  totalLessonsCount: number;
  totalMinutes: number;
}

/**
 * Standardized single source of truth for course progress calculation across Skillora
 */
export function getCourseProgress(course: Course): CourseProgressInfo {
  const safeLessons = Array.isArray(course?.lessons) ? course.lessons : [];
  const totalCount = safeLessons.length;
  
  if (totalCount === 0) {
    return {
      percentage: 0,
      completedCount: 0,
      totalCount: 0,
      status: "Belum Dimulai",
      nextLessonIndex: 0,
      nextLesson: null,
      isCompleted: false,
    };
  }

  const completedCount = safeLessons.filter((l) => l.completed).length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const isCompleted = completedCount === totalCount && totalCount > 0;

  // Find next uncompleted lesson, or default to first lesson
  const nextLessonIndex = safeLessons.findIndex((l) => !l.completed);
  const nextLesson = nextLessonIndex >= 0 ? safeLessons[nextLessonIndex] : safeLessons[0];

  let status: "Belum Dimulai" | "Sedang Dipelajari" | "Selesai" = "Belum Dimulai";
  if (isCompleted) {
    status = "Selesai";
  } else if (completedCount > 0) {
    status = "Sedang Dipelajari";
  }

  return {
    percentage,
    completedCount,
    totalCount,
    status,
    nextLessonIndex: nextLessonIndex >= 0 ? nextLessonIndex : 0,
    nextLesson,
    isCompleted,
  };
}

/**
 * Groups flat course lessons into logical structured modules
 */
export function getStructuredModules(course: Course): StructuredModule[] {
  const safeLessons = Array.isArray(course?.lessons) ? course.lessons : [];
  if (safeLessons.length === 0) return [];

  // Group into modules of 2-3 lessons each for clean scanning
  const lessonsPerModule = safeLessons.length > 5 ? 3 : 2;
  const modules: StructuredModule[] = [];

  // Calculate uncompleted cursor for locked/current status
  let foundCurrent = false;

  for (let i = 0; i < safeLessons.length; i += lessonsPerModule) {
    const moduleNumber = Math.floor(i / lessonsPerModule) + 1;
    const chunk = safeLessons.slice(i, i + lessonsPerModule);
    
    let totalMinutes = 0;
    const moduleLessons = chunk.map((lesson, idxInChunk) => {
      const overallIdx = i + idxInChunk;
      const isCompleted = !!lesson.completed;
      
      let isCurrent = false;
      let isLocked = false;

      if (!isCompleted && !foundCurrent) {
        isCurrent = true;
        foundCurrent = true;
        isLocked = false;
      } else if (!isCompleted && foundCurrent) {
        isLocked = overallIdx > 0 && !safeLessons[overallIdx - 1]?.completed;
      }

      const est = lesson.estimatedMinutes || (10 + (overallIdx * 5) % 15);
      totalMinutes += est;

      return {
        lesson,
        indexInCourse: overallIdx,
        indexInModule: idxInChunk,
        isCompleted,
        isCurrent,
        isLocked,
      };
    });

    const completedInModule = moduleLessons.filter((m) => m.isCompleted).length;

    // Standard module naming based on course domain
    let moduleTitle = `Modul ${moduleNumber}: `;
    if (moduleNumber === 1) {
      moduleTitle += "Pondasi & Pemahaman Konsep Inti";
    } else if (moduleNumber === 2) {
      moduleTitle += "Penerapan Praktik & Strategi Teknis";
    } else if (moduleNumber === 3) {
      moduleTitle += "Studi Kasus & Analisis Lanjutan";
    } else {
      moduleTitle += "Evaluasi Komprehensif & Simulasi Industri";
    }

    modules.push({
      id: `mod_${course.id}_${moduleNumber}`,
      moduleNumber,
      title: moduleTitle,
      lessons: moduleLessons,
      completedLessonsCount: completedInModule,
      totalLessonsCount: moduleLessons.length,
      totalMinutes,
    });
  }

  return modules;
}

/**
 * Persistent Resume Position Management
 */
const RESUME_STORAGE_KEY = "skillora_last_resume_position";

export interface ResumePosition {
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  courseTitle: string;
  updatedAt: string;
}

export function saveResumePosition(
  courseId: string,
  lessonId: string,
  courseTitle?: string,
  lessonTitle?: string
): void {
  try {
    const data: ResumePosition = {
      courseId,
      lessonId,
      courseTitle: courseTitle || "",
      lessonTitle: lessonTitle || "",
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${RESUME_STORAGE_KEY}_${courseId}`, JSON.stringify(data));
    localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // Ignore storage quota errors
  }
}

export function getResumePosition(courseId?: string): ResumePosition | null {
  try {
    const key = courseId ? `${RESUME_STORAGE_KEY}_${courseId}` : RESUME_STORAGE_KEY;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
}
