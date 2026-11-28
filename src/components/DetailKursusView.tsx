import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  BarChart,
  CheckCircle2,
  PlayCircle,
  BookOpen,
  Target,
  Heart,
  Award,
  Check,
  ChevronRight,
  Lock,
  Bookmark,
  BookmarkCheck,
  StickyNote,
  X,
  Save,
  Trash2,
  Layers,
  Terminal,
  ClipboardCheck,
  GraduationCap,
  TrendingUp,
  Sparkles,
  FileCheck2,
  RotateCcw,
  UserPlus,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Course, CourseTrainingOverview, Lesson, Profile } from "../types";
import { apiClient, courseApi, studyApi, trainingApi } from "../api/apiClient";
import { queryKeys } from "../lib/queryKeys";
import { getCourseProgress, getStructuredModules } from "../utils/courseUtils";
import { resolveCourseImage } from "../utils/resolveAsset";
import defaultCourseImg from "../assets/images/course_tech_engineering_1794974031663.jpg";
import { Button } from "./ui/Button";
import { ProgressBar } from "./ui/ProgressBar";
import { CourseExamRunner } from "./training/CourseExamRunner";
import { FlashcardDeckPanel } from "./training/FlashcardDeckPanel";
import { CourseAssignmentPanel } from "./training/CourseAssignmentPanel";

interface DetailKursusViewProps {
  courses: Course[];
  startQuiz: (course: Course, lesson: any) => void;
  profile: Profile;
  onBookmarkToggle: (courseId: string) => void;
  onProfileUpdate?: (profile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

type TrainingStage = "pretest" | "modules" | "practice" | "exam";

export function DetailKursusView({
  courses,
  profile,
  onBookmarkToggle,
  onProfileUpdate,
  showToast,
}: DetailKursusViewProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const course = courses.find((c) => c.id === id);

  const [activeStage, setActiveStage] = useState<TrainingStage>("modules");
  const [moduleSubTab, setModuleSubTab] = useState<"syllabus" | "flashcards">("syllabus");
  const [runningExam, setRunningExam] = useState<"pretest" | "final" | null>(null);

  const [overview, setOverview] = useState<CourseTrainingOverview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [localEnrolled, setLocalEnrolled] = useState<boolean>(Boolean(course?.isEnrolled));
  const [localEnrolledCount, setLocalEnrolledCount] = useState<number>(course?.enrolledCount || 0);
  const [enrollingCourse, setEnrollingCourse] = useState(false);

  useEffect(() => {
    setLocalEnrolled(Boolean(course?.isEnrolled));
    setLocalEnrolledCount(course?.enrolledCount || 0);
  }, [course?.id, course?.isEnrolled, course?.enrolledCount]);

  // Lesson note modal state backed by PostgreSQL Cloud Notes
  const [activeNoteLesson, setActiveNoteLesson] = useState<Lesson | null>(null);
  const [noteContent, setNoteContent] = useState<string>("");
  const [cloudNotesMap, setCloudNotesMap] = useState<Record<string, string>>({});
  const [savingNote, setSavingNote] = useState(false);
  const [bookmarkedLessons, setBookmarkedLessons] = useState<string[]>(
    () => profile?.bookmarkedLessons || []
  );

  useEffect(() => {
    if (!course?.id) return;
    let active = true;
    studyApi
      .listNotes()
      .then((notesList) => {
        if (!active || !Array.isArray(notesList)) return;
        const nextMap: Record<string, string> = {};
        for (const n of notesList) {
          if (n.courseId === course.id && n.content) {
            nextMap[n.lessonId] = n.content;
          }
        }
        setCloudNotesMap(nextMap);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [course?.id]);

  useEffect(() => {
    if (profile?.bookmarkedLessons) {
      setBookmarkedLessons(profile.bookmarkedLessons);
    }
  }, [profile]);

  const loadOverview = useCallback(async () => {
    if (!course?.id) return;
    try {
      setLoadingOverview(true);
      const data = await trainingApi.getCourseOverview(course.id);
      setOverview(data);
    } catch {
      // keep silent fallback when offline/unauthenticated
    } finally {
      setLoadingOverview(false);
    }
  }, [course?.id]);

  useEffect(() => {
    setRunningExam(null);
    loadOverview();
  }, [loadOverview]);

  const progressInfo = useMemo(() => {
    return course ? getCourseProgress(course) : null;
  }, [course]);

  const modules = useMemo(() => {
    return course ? getStructuredModules(course) : [];
  }, [course]);

  const learningOutcomes = useMemo(() => {
    if (!course) return [];
    const list: string[] = [];
    course.lessons?.forEach((l) => {
      if (l.learningObjectives) {
        l.learningObjectives.forEach((obj) => {
          if (!list.includes(obj) && list.length < 4) list.push(obj);
        });
      }
    });
    if (list.length === 0 && course.skills) {
      course.skills.slice(0, 4).forEach((s) => {
        list.push(`Menguasai konsep inti dan penerapan praktis ${s}`);
      });
    }
    return list;
  }, [course]);

  if (!course || !progressInfo) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold font-display text-zinc-950 dark:text-white">
          Pelatihan Tidak Ditemukan
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Pelatihan yang Anda cari mungkin telah dipindahkan atau sedang diperbarui.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate("/belajar/katalog")}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Kembali ke Katalog Pelatihan
        </Button>
      </div>
    );
  }

  const { percentage, completedCount, totalCount, nextLesson, nextLessonIndex } = progressInfo;
  const bookmarkedCourses = profile?.bookmarkedCourses || [];
  const isCourseBookmarked = bookmarkedCourses.includes(course.id);

  const pretestDone = Boolean(overview?.pretest);
  const modulesDone = percentage >= 100;
  const practiceDone = Boolean(overview?.latestAssignment);
  const finalPassed = Boolean(overview?.finalExam?.passed);

  const completedStagesCount = [pretestDone, modulesDone, practiceDone, finalPassed].filter(Boolean).length;

  const learningGain =
    overview?.learningGain !== undefined && overview?.learningGain !== null
      ? overview.learningGain
      : overview?.pretest && overview?.finalExam
      ? overview.finalExam.score - overview.pretest.score
      : null;

  const totalFlashcardsInCourse =
    overview?.totalFlashcards ||
    course.lessons.reduce((sum, l) => sum + (l.flashcards?.length || 0), 0);

  const totalInlineChecks = course.lessons.reduce(
    (sum, l) => sum + (l.inlineChecks?.length || 0),
    0
  );

  const handleToggleBookmarkLesson = async (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSaved = bookmarkedLessons.includes(lessonId);
    const updated = isSaved
      ? bookmarkedLessons.filter((item) => item !== lessonId)
      : [...bookmarkedLessons, lessonId];

    setBookmarkedLessons(updated);
    onProfileUpdate?.({ ...profile, bookmarkedLessons: updated });

    try {
      await apiClient.post("/user/bookmark-lesson", { courseId: course.id, lessonId });
      showToast?.(
        isSaved ? "Materi dihapus dari bookmark." : "Materi disimpan ke bookmark.",
        "success"
      );
    } catch {
      // ignore
    }
  };

  const handleOpenNoteModal = (lesson: Lesson, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveNoteLesson(lesson);
    const savedNote = cloudNotesMap[lesson.id] || lesson.notes || "";
    setNoteContent(savedNote);
  };

  const handleSaveNote = async () => {
    if (!activeNoteLesson) return;
    setSavingNote(true);
    try {
      await studyApi.saveNote(course.id, activeNoteLesson.id, noteContent, false);
      setCloudNotesMap((prev) => ({ ...prev, [activeNoteLesson.id]: noteContent }));
      showToast?.("Catatan materi tersimpan ke Cloud PostgreSQL.", "success");
      setActiveNoteLesson(null);
    } catch (err: any) {
      showToast?.(err?.message || "Gagal menyimpan catatan cloud.", "error");
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!activeNoteLesson) return;
    setSavingNote(true);
    try {
      await studyApi.deleteNote(course.id, activeNoteLesson.id);
      setCloudNotesMap((prev) => {
        const next = { ...prev };
        delete next[activeNoteLesson.id];
        return next;
      });
      setNoteContent("");
      showToast?.("Catatan materi dihapus dari cloud.", "info");
      setActiveNoteLesson(null);
    } catch (err: any) {
      showToast?.(err?.message || "Gagal menghapus catatan.", "error");
    } finally {
      setSavingNote(false);
    }
  };

  const courseDesc =
    course.description ||
    `Pelatihan terstruktur '${course.title}' dengan alur 4 tahap: Pra-Tes Diagnostik, Modul & Flashcard SM-2, Praktik Studi Kasus AI, dan Ujian Sertifikasi Akhir.`;

  const stageItems: {
    id: TrainingStage;
    step: string;
    label: string;
    shortStatus: string;
    done: boolean;
    icon: React.ReactNode;
  }[] = [
    {
      id: "pretest",
      step: "01",
      label: "Pra-Tes Diagnostik",
      shortStatus: overview?.pretest ? `Skor ${overview.pretest.score}%` : "Ukur Baseline",
      done: pretestDone,
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
      id: "modules",
      step: "02",
      label: "Modul & Flashcard",
      shortStatus: `${completedCount}/${totalCount} Sesi`,
      done: modulesDone,
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: "practice",
      step: "03",
      label: "Praktik & Lab AI",
      shortStatus: overview?.latestAssignment
        ? `Nilai ${overview.latestAssignment.score}/100`
        : `${course.linkedLabIds?.length || 1} Lab & Kasus`,
      done: practiceDone,
      icon: <Terminal className="w-4 h-4" />,
    },
    {
      id: "exam",
      step: "04",
      label: "Ujian Sertifikasi",
      shortStatus: overview?.finalExam
        ? overview.finalExam.passed
          ? `Lulus ${overview.finalExam.score}%`
          : `Skor ${overview.finalExam.score}%`
        : "Minimal 75%",
      done: finalPassed,
      icon: <GraduationCap className="w-4 h-4" />,
    },
  ];

  // If user launched Pre-Test or Final Exam runner, display focused Exam workspace
  if (runningExam) {
    return (
      <div className="max-w-4xl mx-auto w-full pb-16 pt-2 space-y-5">
        <CourseExamRunner
          courseId={course.id}
          courseTitle={course.title}
          examType={runningExam}
          pretestBaselineScore={overview?.pretest?.score ?? null}
          onProfileUpdate={onProfileUpdate}
          onCompleted={() => {
            loadOverview();
          }}
          onOpenLesson={(lessonId) => {
            setRunningExam(null);
            navigate(`/belajar/kursus/${course.id}/materi/${lessonId}`);
          }}
          onOpenCertificates={() => {
            setRunningExam(null);
            navigate("/belajar/proyek");
          }}
          onClose={() => setRunningExam(null)}
          showToast={showToast}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto w-full pb-16 lg:pb-10 space-y-6">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 overflow-x-auto whitespace-nowrap"
      >
        <Link to="/belajar" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
          Belajar
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <Link to="/belajar/katalog" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
          Katalog Pelatihan
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        <span className="text-zinc-900 dark:text-zinc-100 font-semibold truncate max-w-xs">
          {course.title}
        </span>
      </nav>

      {/* Editorial Hero Header */}
      <section className="bg-white dark:bg-[#111114] rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Copy & Actions */}
          <div className="lg:col-span-8 p-6 sm:p-7 flex flex-col justify-between gap-6">
            <div className="space-y-3">
              {/* Unboxed Metadata Line (Zero-Pill) */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  {course.partner}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span>{course.category}</span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span>{course.difficulty}</span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span className="font-mono tabular-nums">{course.duration}</span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span className="font-mono tabular-nums text-zinc-700 dark:text-zinc-300 font-medium">
                  +{course.xpReward} XP
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">·</span>
                <span className="font-medium text-emerald-700 dark:text-emerald-400">
                  Akses terbuka
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-display font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight leading-snug">
                {course.title}
              </h1>

              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
                {courseDesc}
              </p>

              {/* Compact Training Spec Strip */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs text-zinc-600 dark:text-zinc-400 tabular-nums">
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                  {totalCount} Sesi Modul
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  {totalFlashcardsInCourse} Flashcard SM-2
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                  {totalInlineChecks} Cek Paham
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                  {course.linkedLabIds?.length || 1} Lab & Studi Kasus AI
                </span>
              </div>
            </div>

            {/* Primary Action Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {!pretestDone ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setRunningExam("pretest")}
                  leftIcon={<ClipboardCheck className="w-4 h-4" />}
                >
                  Mulai Tahap 01: Pra-Tes Diagnostik
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    const target = nextLesson || course.lessons[0];
                    if (target) navigate(`/belajar/kursus/${course.id}/materi/${target.id}`);
                  }}
                  leftIcon={<PlayCircle className="w-4 h-4" />}
                >
                  {percentage === 100
                    ? "Buka Ulang Modul Materi"
                    : `Lanjutkan Sesi ${nextLessonIndex + 1}`}
                </Button>
              )}

              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate("/belajar/lms")}
                leftIcon={<BookOpen className="w-4 h-4" />}
              >
                Ruang LMS Terfokus
              </Button>

              <button
                type="button"
                disabled={enrollingCourse || localEnrolled}
                onClick={async () => {
                  setEnrollingCourse(true);
                  try {
                    const res = await courseApi.enrollCourse(course.id);
                    setLocalEnrolled(true);
                    setLocalEnrolledCount(res.enrolledCount);
                    queryClient.invalidateQueries({ queryKey: queryKeys.courses.list() });
                    showToast?.(
                      res.alreadyEnrolled
                        ? `Anda sudah terdaftar pada "${course.title}".`
                        : `Berhasil mendaftar gratis di "${course.title}"!`,
                      "success"
                    );
                  } catch (err: any) {
                    showToast?.(err?.message || "Gagal mendaftar kursus.", "error");
                  } finally {
                    setEnrollingCourse(false);
                  }
                }}
                className={`h-9 px-3.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  localEnrolled
                    ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 cursor-default"
                    : "bg-white dark:bg-[#111114] border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                {localEnrolled ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="tabular-nums">Terdaftar{localEnrolledCount > 0 ? ` (${localEnrolledCount})` : ""}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{enrollingCourse ? "Mendaftar..." : "Daftar Kursus"}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => onBookmarkToggle(course.id)}
                className={`h-9 px-3.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isCourseBookmarked
                    ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300"
                    : "bg-white dark:bg-[#111114] border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isCourseBookmarked ? "fill-rose-500 text-rose-500" : ""}`} />
                <span>{isCourseBookmarked ? "Tersimpan" : "Simpan"}</span>
              </button>
            </div>
          </div>

          {/* Right Editorial Thumbnail + Readiness Progress */}
          <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-zinc-200/90 dark:border-zinc-800/90 bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-col">
            <div className="relative aspect-16/9 w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
              <img
                src={resolveCourseImage(course.image)}
                alt={course.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = defaultCourseImg;
                }}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-600 dark:text-zinc-400">
                    Progres Kurikulum · <span className="font-mono tabular-nums">{completedStagesCount}/4 tahap</span>
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {percentage}%
                  </span>
                </div>
                <ProgressBar
                  value={percentage}
                  variant={percentage === 100 ? "success" : "primary"}
                  size="sm"
                />
                {finalPassed && (
                  <p className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 pt-0.5">
                    <Award className="w-3.5 h-3.5" /> Tersertifikasi
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 text-xs">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 block">Pra-Tes</span>
                  <span className="font-mono font-semibold tabular-nums text-zinc-950 dark:text-zinc-100 mt-0.5 block">
                    {overview?.pretest ? `${overview.pretest.score}%` : "Belum"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 block">Ujian Akhir</span>
                  <span className="font-mono font-semibold tabular-nums text-zinc-950 dark:text-zinc-100 mt-0.5 block">
                    {overview?.finalExam ? `${overview.finalExam.score}%` : "Belum"}
                    {learningGain !== null && (
                      <span
                        className={`ml-1.5 text-[11px] ${
                          learningGain >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        ({learningGain >= 0 ? `+${learningGain}` : learningGain}%)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Stage Learning Flow Stepper (Unified Hairline Strip) */}
      <nav
        aria-label="Tahapan Pelatihan"
        className="grid grid-cols-2 lg:grid-cols-4 bg-white dark:bg-[#111114] rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/80 dark:divide-zinc-800/80"
      >
        {stageItems.map((stage) => {
          const isActive = activeStage === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStage(stage.id)}
              className={`relative text-left p-4 transition-colors cursor-pointer flex items-start gap-3 ${
                isActive
                  ? "bg-zinc-50/90 dark:bg-zinc-900/80 text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40"
              }`}
            >
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-600 dark:bg-emerald-500" />
              )}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-semibold tabular-nums ${
                  stage.done
                    ? "bg-emerald-600 text-white"
                    : isActive
                    ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950"
                    : "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {stage.done ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : stage.step}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-950 dark:text-zinc-100 truncate">
                  {stage.label}
                </p>
                <p
                  className={`text-xs font-mono tabular-nums mt-0.5 truncate ${
                    stage.done || isActive
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {stage.shortStatus}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* STAGE 01: PRA-TES DIAGNOSTIK */}
      {activeStage === "pretest" && (
        <section className="bg-white dark:bg-[#111114] rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-5">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Tahap 01 · Diagnostik awal
              </p>
              <h2 className="text-xl font-display font-semibold text-zinc-950 dark:text-zinc-50">
                Pra-Tes Pemetaan Kompetensi Awal
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
                Ukur pemahaman dasar Anda sebelum mempelajari modul. Hasil Pra-Tes menjadi baseline resmi untuk menghitung Learning Gain saat Ujian Akhir dan memprioritaskan topik yang perlu diperkuat.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => setRunningExam("pretest")}
              leftIcon={overview?.pretest ? <RotateCcw className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
            >
              {overview?.pretest ? "Ulangi Pra-Tes" : "Mulai Pra-Tes"}
            </Button>
          </div>

          {loadingOverview ? (
            <p className="text-xs font-mono text-zinc-500">Memuat data diagnostik...</p>
          ) : overview?.pretest ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/80 dark:divide-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40">
                <div className="p-4">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Skor Baseline</span>
                  <span className="text-2xl font-display font-semibold font-mono tabular-nums text-zinc-950 dark:text-zinc-50">
                    {overview.pretest.score}%
                  </span>
                </div>
                <div className="p-4">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Jawaban Benar</span>
                  <span className="text-2xl font-display font-semibold font-mono tabular-nums text-zinc-950 dark:text-zinc-50">
                    {overview.pretest.correctCount}/{overview.pretest.totalQuestions}
                  </span>
                </div>
                <div className="p-4">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Langkah Berikutnya</span>
                  <button
                    type="button"
                    onClick={() => setActiveStage("modules")}
                    className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Lanjut ke Modul <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {overview.pretest.competencyBreakdown?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Peta kompetensi awal
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {overview.pretest.competencyBreakdown.map((item) => (
                      <div
                        key={item.topic}
                        className="p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate pr-2">
                            {item.topic}
                          </span>
                          <span className="font-mono font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                            {item.accuracy}% ({item.correct}/{item.total})
                          </span>
                        </div>
                        <ProgressBar
                          value={item.accuracy}
                          variant={item.accuracy >= 75 ? "success" : "primary"}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {overview.pretest.aiDiagnostic && (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Rekomendasi Fokus Belajar
                  </p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {overview.pretest.aiDiagnostic}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                <p className="text-xs font-mono text-zinc-500">Durasi Singkat</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">5–8 Menit Terukur</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Mencakup sampel soal representatif dari seluruh modul inti kursus.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                <p className="text-xs font-mono text-zinc-500">Peta Kelemahan</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Analitik per Kompetensi</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Langsung mengetahui topik mana yang sudah kuat dan mana yang wajib difokuskan.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                <p className="text-xs font-mono text-zinc-500">Learning Gain</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Bandingkan dengan Ujian Akhir</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Skor Pra-Tes dibandingkan langsung dengan skor Ujian Sertifikasi Akhir Anda.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* STAGE 02: MODUL & FLASHCARD */}
      {activeStage === "modules" && (
        <div className="space-y-5">
          {/* Sub-tab switcher: Silabus vs Flashcard */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModuleSubTab("syllabus")}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  moduleSubTab === "syllabus"
                    ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Silabus Modul ({totalCount} Sesi)
              </button>
              <button
                type="button"
                onClick={() => setModuleSubTab("flashcards")}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  moduleSubTab === "flashcards"
                    ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Dek Flashcard SM-2 ({overview?.dueFlashcards ?? totalFlashcardsInCourse} Siap)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveStage("practice")}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            >
              Lanjut ke Tahap 03: Praktik & Lab AI <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {moduleSubTab === "flashcards" ? (
            <FlashcardDeckPanel
              courseId={course.id}
              onProfileUpdate={onProfileUpdate}
              showToast={showToast}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 8 Cols: Curriculum Modules */}
              <div className="lg:col-span-8 space-y-4">
                {modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="bg-white dark:bg-[#111114] rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 overflow-hidden"
                  >
                    <div className="px-4 py-3.5 bg-zinc-50/70 dark:bg-zinc-950/40 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-medium block">
                          Modul {String(mod.moduleNumber).padStart(2, "0")}
                        </span>
                        <h3 className="font-display font-semibold text-sm text-zinc-950 dark:text-zinc-50 truncate">
                          {mod.title.replace(/^Modul \d+:\s*/, "")}
                        </h3>
                      </div>
                      <div className="text-right shrink-0 font-mono text-xs tabular-nums">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {mod.completedLessonsCount}/{mod.totalLessonsCount} sesi
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400 block text-[11px]">
                          ~{mod.totalMinutes} mnt
                        </span>
                      </div>
                    </div>

                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {mod.lessons.map(
                        ({ lesson, indexInCourse, isCompleted: isLesCompleted, isCurrent, isLocked }) => {
                          const isLessonSaved = bookmarkedLessons.includes(lesson.id);
                          const hasSavedNote = Boolean(cloudNotesMap[lesson.id]);
                          const checkCount = lesson.inlineChecks?.length || 0;
                          const cardCount = lesson.flashcards?.length || 0;

                          return (
                            <div
                              key={lesson.id}
                              className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                                isCurrent
                                  ? "bg-emerald-50/40 dark:bg-emerald-950/15"
                                  : "hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30"
                              }`}
                            >
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 ${
                                    isLesCompleted
                                      ? "bg-emerald-600 text-white"
                                      : isCurrent
                                      ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950"
                                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                                  }`}
                                >
                                  {isLesCompleted ? (
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  ) : (
                                    indexInCourse + 1
                                  )}
                                </div>

                                <div className="space-y-1 min-w-0 flex-1">
                                  <h4
                                    onClick={() => {
                                      if (!isLocked) {
                                        navigate(`/belajar/kursus/${course.id}/materi/${lesson.id}`);
                                      }
                                    }}
                                    className={`font-semibold text-sm transition-colors truncate ${
                                      isLocked
                                        ? "text-zinc-400 dark:text-zinc-600 cursor-not-allowed"
                                        : "text-zinc-950 dark:text-white hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                                    }`}
                                  >
                                    {lesson.title}
                                  </h4>

                                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
                                    <span
                                      className={
                                        isLesCompleted
                                          ? "text-emerald-700 dark:text-emerald-400 font-semibold"
                                          : isCurrent
                                          ? "text-zinc-900 dark:text-zinc-200 font-semibold"
                                          : ""
                                      }
                                    >
                                      {isLesCompleted
                                        ? "Selesai"
                                        : isCurrent
                                        ? "Berikutnya"
                                        : isLocked
                                        ? "Terkunci"
                                        : "Tersedia"}
                                    </span>
                                    <span>·</span>
                                    <span>{lesson.estimatedMinutes || 15} mnt</span>
                                    {checkCount > 0 && (
                                      <>
                                        <span>·</span>
                                        <span>{checkCount} cek paham</span>
                                      </>
                                    )}
                                    {cardCount > 0 && (
                                      <>
                                        <span>·</span>
                                        <span>{cardCount} kartu</span>
                                      </>
                                    )}
                                    {lesson.xp && (
                                      <>
                                        <span>·</span>
                                        <span className="text-emerald-700 dark:text-emerald-400">
                                          +{lesson.xp} XP
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenNoteModal(lesson, e)}
                                  title="Catatan sesi"
                                  aria-label="Catatan sesi"
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    hasSavedNote
                                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                                      : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                                  }`}
                                >
                                  <StickyNote className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleToggleBookmarkLesson(lesson.id, e)}
                                  title={isLessonSaved ? "Hapus bookmark" : "Simpan sesi"}
                                  aria-label={isLessonSaved ? "Hapus bookmark" : "Simpan sesi"}
                                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                    isLessonSaved
                                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                                      : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                                  }`}
                                >
                                  {isLessonSaved ? (
                                    <BookmarkCheck className="w-3.5 h-3.5" />
                                  ) : (
                                    <Bookmark className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {!isLocked ? (
                                  <div className="flex items-center gap-1.5">
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() =>
                                        navigate(`/belajar/kursus/${course.id}/materi/${lesson.id}`)
                                      }
                                    >
                                      Materi
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() =>
                                        navigate(`/belajar/kursus/${course.id}/latihan/${lesson.id}`)
                                      }
                                    >
                                      Kuis
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400 px-2 py-1">
                                    <Lock className="w-3.5 h-3.5" /> Terkunci
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Right 4 Cols: Unified Course Reference Panel */}
              <aside className="lg:col-span-4">
                <div className="bg-white dark:bg-[#111114] rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                  {/* Flashcard Quick Launch */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Retensi Spaced Repetition
                      </h3>
                      <span className="text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {overview?.masteredFlashcards || 0}/{totalFlashcardsInCourse}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      Latih konsep kunci kursus ini dengan algoritma SM-2 agar materi melekat hingga ujian sertifikasi.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={() => setModuleSubTab("flashcards")}
                      leftIcon={<Layers className="w-3.5 h-3.5" />}
                    >
                      Buka Dek Flashcard
                    </Button>
                  </div>

                  {/* Learning Outcomes */}
                  {learningOutcomes.length > 0 && (
                    <div className="p-4 sm:p-5 space-y-3">
                      <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Capaian Kompetensi
                      </h3>
                      <ul className="space-y-2">
                        {learningOutcomes.map((outcome, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills List (Unboxed clean text) */}
                  {course.skills && course.skills.length > 0 && (
                    <div className="p-4 sm:p-5 space-y-2">
                      <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        Keterampilan yang Diuji
                      </h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {course.skills.join(" · ")}
                      </p>
                    </div>
                  )}

                  {/* Saved Notes Summary */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <StickyNote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Catatan Materi Saya
                    </h3>
                    {course.lessons.filter((l) => Boolean(cloudNotesMap[l.id])).length === 0 ? (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Belum ada catatan tersimpan. Gunakan ikon catatan di daftar sesi saat membaca materi.
                      </p>
                    ) : (
                      <div className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
                        {course.lessons.map((lesson) => {
                          const saved = cloudNotesMap[lesson.id];
                          if (!saved) return null;
                          return (
                            <div
                              key={lesson.id}
                              className="py-2.5 first:pt-0 last:pb-0 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                  {lesson.title}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenNoteModal(lesson, e)}
                                  className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline shrink-0 cursor-pointer"
                                >
                                  Edit
                                </button>
                              </div>
                              <p className="text-zinc-500 dark:text-zinc-400 line-clamp-2">{saved}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      )}

      {/* STAGE 03: PRAKTIK & LAB AI */}
      {activeStage === "practice" && (
        <CourseAssignmentPanel
          course={course}
          overview={overview}
          onProfileUpdate={onProfileUpdate}
          onOverviewRefresh={loadOverview}
          showToast={showToast}
        />
      )}

      {/* STAGE 04: UJIAN SERTIFIKASI AKHIR */}
      {activeStage === "exam" && (
        <section className="bg-white dark:bg-[#111114] rounded-xl border border-zinc-200/90 dark:border-zinc-800/90 p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-5">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Tahap 04 · Evaluasi & Sertifikasi
              </p>
              <h2 className="text-xl font-display font-semibold text-zinc-950 dark:text-zinc-50">
                Ujian Sertifikasi Akhir & Analitik Kompetensi
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl">
                Selesaikan ujian komprehensif berbatas waktu dengan standar kelulusan minimal 75% untuk mendapatkan sertifikat terverifikasi dan laporan Learning Gain dibanding Pra-Tes Anda.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {finalPassed && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => navigate("/belajar/proyek")}
                  leftIcon={<Award className="w-4 h-4 text-emerald-600" />}
                >
                  Lihat Sertifikat
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                onClick={() => setRunningExam("final")}
                leftIcon={
                  overview?.finalExam ? (
                    <RotateCcw className="w-4 h-4" />
                  ) : (
                    <FileCheck2 className="w-4 h-4" />
                  )
                }
              >
                {overview?.finalExam ? "Ulangi Ujian Akhir" : "Mulai Ujian Sertifikasi"}
              </Button>
            </div>
          </div>

          {overview?.finalExam ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/80 dark:divide-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950/40">
                <div className="p-4">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Skor Ujian Akhir</span>
                  <span className="text-2xl font-display font-semibold font-mono tabular-nums text-zinc-950 dark:text-zinc-50">
                    {overview.finalExam.score}%
                  </span>
                </div>
                <div className="p-4">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Status Kelulusan</span>
                  <span
                    className={`text-sm font-semibold mt-1 inline-flex items-center gap-1 ${
                      overview.finalExam.passed
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {overview.finalExam.passed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Lulus
                      </>
                    ) : (
                      "Belum Lulus (Min. 75%)"
                    )}
                  </span>
                </div>
                <div className="p-4">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Learning Gain</span>
                  <span className="text-2xl font-display font-semibold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {learningGain !== null
                      ? `${learningGain >= 0 ? `+${learningGain}` : learningGain}%`
                      : "—"}
                  </span>
                </div>
                <div className="p-4">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block">Jawaban Benar</span>
                  <span className="text-2xl font-display font-semibold font-mono tabular-nums text-zinc-950 dark:text-zinc-50">
                    {overview.finalExam.correctCount}/{overview.finalExam.totalQuestions}
                  </span>
                </div>
              </div>

              {overview.finalExam.competencyBreakdown?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    Rincian penguasaan per kompetensi
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {overview.finalExam.competencyBreakdown.map((item) => (
                      <div
                        key={item.topic}
                        className="p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate pr-2">
                            {item.topic}
                          </span>
                          <span className="font-mono font-bold tabular-nums text-zinc-700 dark:text-zinc-300">
                            {item.accuracy}% ({item.correct}/{item.total})
                          </span>
                        </div>
                        <ProgressBar
                          value={item.accuracy}
                          variant={item.accuracy >= 75 ? "success" : "primary"}
                          size="sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {overview.finalExam.aiDiagnostic && (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Analitik Diagnostik AI
                  </p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {overview.finalExam.aiDiagnostic}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                <p className="text-xs font-mono text-zinc-500">Standar Kelulusan</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Skor Minimal 75%</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Lulus otomatis menerbitkan sertifikat resmi ke halaman Sertifikat & Portofolio Anda.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                <p className="text-xs font-mono text-zinc-500">Kesiapan Saat Ini</p>
                <p className="text-sm font-bold font-mono tabular-nums text-zinc-900 dark:text-white">
                  {completedCount}/{totalCount} Modul Selesai
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Disarankan menuntaskan modul dan studi kasus AI sebelum mengambil ujian sertifikasi.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                <p className="text-xs font-mono text-zinc-500">Bonus Penyelesaian</p>
                <p className="text-sm font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  +{Math.round((course.xpReward || 500) * 0.4)} XP & Sertifikat
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Lengkap dengan rincian skor per kompetensi dan analisis topik lemah.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* NOTE EDIT MODAL */}
      {activeNoteLesson && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-[#111114] rounded-xl max-w-lg w-full p-6 shadow-xl border border-zinc-200/90 dark:border-zinc-800/90 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
              <div className="min-w-0">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Catatan personal
                </span>
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 truncate">
                  {activeNoteLesson.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveNoteLesson(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                aria-label="Tutup modal catatan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              aria-label="Catatan materi"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Tuliskan poin penting, rumus, atau catatan persiapan ujian..."
              rows={5}
              className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                disabled={savingNote}
                onClick={handleDeleteNote}
                className="px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:underline text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setActiveNoteLesson(null)}>
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={savingNote}
                  onClick={handleSaveNote}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  {savingNote ? "Menyimpan..." : "Simpan ke Cloud"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetailKursusView;
