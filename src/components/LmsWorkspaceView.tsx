import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Award,
  Zap,
  Bot,
  FileText,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Course, Lesson, Profile } from "../types";
import { courseApi } from "../api/apiClient";
import { getCourseProgress } from "../utils/courseUtils";
import { resolveCourseImage } from "../utils/resolveAsset";
import { CopilotContextInfo } from "./MentorChatSidebar";

interface LmsWorkspaceViewProps {
  courses: Course[];
  profile: Profile;
  onCoursesUpdated: (courses: Course[]) => void;
  onProfileUpdate: (profile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
  onOpenCopilot?: (ctx: CopilotContextInfo) => void;
}

export function LmsWorkspaceView({
  courses,
  profile,
  onCoursesUpdated,
  onProfileUpdate,
  showToast,
  onOpenCopilot,
}: LmsWorkspaceViewProps) {
  const navigate = useNavigate();

  const defaultCourse = useMemo(() => {
    const active = courses.find((c) => {
      const { percentage } = getCourseProgress(c);
      return percentage > 0 && percentage < 100;
    });
    return active || courses[0] || null;
  }, [courses]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(defaultCourse?.id || "");
  const activeCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || defaultCourse,
    [courses, selectedCourseId, defaultCourse]
  );

  const lessons = activeCourse?.lessons || [];
  const defaultLesson = useMemo(
    () => lessons.find((l) => !l.completed) || lessons[0] || null,
    [lessons]
  );

  const [selectedLessonId, setSelectedLessonId] = useState<string>(defaultLesson?.id || "");
  const activeLesson: Lesson | null = useMemo(
    () => lessons.find((l) => l.id === selectedLessonId) || defaultLesson,
    [lessons, selectedLessonId, defaultLesson]
  );

  const [completing, setCompleting] = useState(false);

  if (!activeCourse) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-3">
        <BookOpen className="w-8 h-8 text-emerald-600 mx-auto" />
        <h2 className="font-display font-bold text-lg text-zinc-950 dark:text-white">
          Belum Ada Kursus di Ruang LMS
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Jelajahi katalog kursus untuk mulai belajar secara terstruktur.
        </p>
        <button
          type="button"
          onClick={() => navigate("/belajar/katalog")}
          className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
        >
          Buka Katalog Kursus
        </button>
      </div>
    );
  }

  const { percentage, completedCount, totalCount } = getCourseProgress(activeCourse);
  const currentLessonIdx = lessons.findIndex((l) => l.id === activeLesson?.id);
  const prevLesson = currentLessonIdx > 0 ? lessons[currentLessonIdx - 1] : null;
  const nextLesson = currentLessonIdx >= 0 && currentLessonIdx < lessons.length - 1 ? lessons[currentLessonIdx + 1] : null;

  const lessonMarkdown =
    activeLesson?.notes ||
    activeLesson?.contentBlocks?.map((b) => b.content).join("\n\n") ||
    `### ${activeLesson?.title || "Materi Pembelajaran"}\n\nPelajari konsep inti pada modul ini dan lanjutkan ke latihan kuis untuk menguji pemahaman Anda.`;

  const handleMarkCompleteAndNext = async () => {
    if (!activeLesson) return;
    setCompleting(true);
    try {
      const res = await courseApi.completeLesson(
        activeCourse.id,
        activeLesson.id,
        activeLesson.xp || 50
      );
      if (res?.courses) onCoursesUpdated(res.courses);
      if (res?.profile) onProfileUpdate(res.profile);
      showToast?.(`Modul "${activeLesson.title}" ditandai selesai!`, "success");
      if (nextLesson) {
        setSelectedLessonId(nextLesson.id);
      }
    } catch (err: any) {
      showToast?.(err?.message || "Gagal menyimpan progres modul.", "error");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Focused LMS Top Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <img
            src={resolveCourseImage(activeCourse.image)}
            alt={activeCourse.title}
            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Ruang LMS Terfokus</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <select
                aria-label="Pilih kursus LMS"
                value={activeCourse.id}
                onChange={(e) => {
                  const nextCourse = courses.find((c) => c.id === e.target.value);
                  setSelectedCourseId(e.target.value);
                  setSelectedLessonId(nextCourse?.lessons?.[0]?.id || "");
                }}
                className="font-display font-bold text-sm sm:text-base text-zinc-950 dark:text-white bg-transparent border-b border-dashed border-zinc-300 dark:border-zinc-700 focus:outline-none cursor-pointer max-w-full truncate pr-2"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white">
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="min-w-[160px]">
            <div className="flex justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
              <span>Progres Kelas</span>
              <span className="font-mono text-zinc-900 dark:text-white">
                {completedCount}/{totalCount} ({percentage}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/belajar/kursus/${activeCourse.id}`)}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Silabus &amp; Ujian</span>
          </button>
        </div>
      </div>

      {/* 2-Column Distraction-Free Course Player */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Curriculum Sidebar */}
        <aside className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2.5">
            <h2 className="font-display font-bold text-sm text-zinc-950 dark:text-white">
              Daftar Modul ({lessons.length})
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">{activeCourse.difficulty}</span>
          </div>

          <div className="space-y-1.5 max-h-[540px] overflow-y-auto pr-1">
            {lessons.map((les, idx) => {
              const isCurrent = les.id === activeLesson?.id;
              return (
                <button
                  key={les.id}
                  type="button"
                  onClick={() => setSelectedLessonId(les.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                    isCurrent
                      ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800"
                      : "bg-zinc-50/60 dark:bg-zinc-950/40 border-zinc-200/70 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                      les.completed
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                          ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    {les.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-white line-clamp-2 leading-snug">
                      {les.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {les.estimatedMinutes || 15}m
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                        <Zap className="w-3 h-3" /> +{les.xp || 50} XP
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => navigate("/belajar/proyek")}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Kumpulkan Proyek &amp; Klaim Sertifikat</span>
            </button>
          </div>
        </aside>

        {/* Right Main Reader & Action Bar */}
        <section className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-7 space-y-6">
          {activeLesson ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                    Modul {currentLessonIdx + 1} dari {lessons.length} · {activeCourse.partner}
                  </span>
                  <h1 className="font-display font-bold text-xl sm:text-2xl text-zinc-950 dark:text-white mt-1">
                    {activeLesson.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenCopilot && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenCopilot({
                          courseTitle: activeCourse.title,
                          lessonTitle: activeLesson.title,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Tanya Copilot</span>
                    </button>
                  )}

                  {activeLesson.questions && activeLesson.questions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => navigate(`/belajar/kursus/${activeCourse.id}/latihan/${activeLesson.id}`)}
                      className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Kuis Modul ({activeLesson.questions.length})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Clean Lesson Content */}
              <div className="prose prose-sm dark:prose-invert max-w-none space-y-3 text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm">
                {lessonMarkdown}
              </div>

              {/* Bottom Navigation & Completion */}
              <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!prevLesson}
                    onClick={() => prevLesson && setSelectedLessonId(prevLesson.id)}
                    className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 disabled:opacity-40 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Sebelumnya</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/belajar/kursus/${activeCourse.id}/materi/${activeLesson.id}`)}
                    className="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Mode Catatan &amp; Flashcard</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={completing}
                    onClick={handleMarkCompleteAndNext}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {completing
                        ? "Menyimpan..."
                        : nextLesson
                          ? "Tandai Selesai & Lanjut"
                          : "Tandai Modul Selesai"}
                    </span>
                    {nextLesson && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-zinc-500">Pilih modul di sebelah kiri untuk mulai belajar.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default LmsWorkspaceView;
