import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  MessageSquare,
  Send,
  Video,
  UserPlus,
  ThumbsUp,
  StickyNote,
  Save,
  Lightbulb,
  HelpCircle,
  XCircle,
  Pin,
} from "lucide-react";
import { Course, Lesson, Profile } from "../types";
import { courseApi, forumApi, studyApi } from "../api/apiClient";
import { getCourseProgress } from "../utils/courseUtils";
import { resolveCourseImage } from "../utils/resolveAsset";
import { CopilotContextInfo } from "./MentorChatSidebar";
import { MarkdownRenderer } from "./ui/MarkdownRenderer";
import { LessonVideoPlayer } from "./ui/LessonVideoPlayer";

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
  const [searchParams] = useSearchParams();
  const requestedCourseId = searchParams.get("courseId") || "";
  const requestedLessonId = searchParams.get("lessonId") || "";

  const isGuestUser =
    profile?.role === "Guest" ||
    profile?.email === "guest@skillora.app" ||
    localStorage.getItem("skillora_guest_mode") === "true";

  const defaultCourse = useMemo(() => {
    if (requestedCourseId) {
      const fromParam = courses.find((c) => c.id === requestedCourseId);
      if (fromParam) return fromParam;
    }
    const active = courses.find((c) => {
      const { percentage } = getCourseProgress(c);
      return percentage > 0 && percentage < 100;
    });
    return active || courses[0] || null;
  }, [courses, requestedCourseId]);

  const [selectedCourseId, setSelectedCourseId] = useState<string>(defaultCourse?.id || "");
  useEffect(() => {
    if (requestedCourseId && courses.some((c) => c.id === requestedCourseId)) {
      setSelectedCourseId(requestedCourseId);
    }
  }, [requestedCourseId, courses]);

  const activeCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || defaultCourse,
    [courses, selectedCourseId, defaultCourse]
  );

  const lessons = activeCourse?.lessons || [];
  const defaultLesson = useMemo(
    () =>
      (requestedLessonId && lessons.find((l) => l.id === requestedLessonId)) ||
      lessons.find((l) => !l.completed) ||
      lessons[0] ||
      null,
    [lessons, requestedLessonId]
  );

  const [selectedLessonId, setSelectedLessonId] = useState<string>(defaultLesson?.id || "");
  useEffect(() => {
    if (requestedLessonId && lessons.some((l) => l.id === requestedLessonId)) {
      setSelectedLessonId(requestedLessonId);
    }
  }, [requestedLessonId, lessons]);

  const activeLesson: Lesson | null = useMemo(
    () => lessons.find((l) => l.id === selectedLessonId) || defaultLesson,
    [lessons, selectedLessonId, defaultLesson]
  );

  const [completing, setCompleting] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState<"materi" | "diskusi" | "catatan">("materi");
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<"course" | "lesson">("course");
  const [questionTitle, setQuestionTitle] = useState("");
  const [questionBody, setQuestionBody] = useState("");
  const [postingQuestion, setPostingQuestion] = useState(false);
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Cloud Notes & Inline Checks inside LMS
  const [noteContent, setNoteContent] = useState("");
  const [notePinned, setNotePinned] = useState(false);
  const [loadingNote, setLoadingNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [inlineAnswers, setInlineAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    setInlineAnswers({});
  }, [activeLesson?.id]);

  useEffect(() => {
    if (activeTab !== "diskusi") return;
    let active = true;
    setLoadingPosts(true);
    forumApi
      .getPosts()
      .then((posts) => {
        if (active && Array.isArray(posts)) setForumPosts(posts);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingPosts(false);
      });
    return () => {
      active = false;
    };
  }, [activeTab]);

  useEffect(() => {
    if (!activeCourse || !activeLesson) return;
    let active = true;
    setLoadingNote(true);
    studyApi
      .getNote(activeCourse.id, activeLesson.id)
      .then((cloudNote) => {
        if (!active) return;
        if (cloudNote) {
          setNoteContent(cloudNote.content);
          setNotePinned(cloudNote.isPinned);
        } else {
          setNoteContent("");
          setNotePinned(false);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingNote(false);
      });
    return () => {
      active = false;
    };
  }, [activeCourse?.id, activeLesson?.id]);

  const courseTag = activeCourse ? `course:${activeCourse.id}` : "";
  const lessonTag = activeLesson ? `lesson:${activeLesson.id}` : "";
  const scopedQuestions = useMemo(() => {
    if (!activeCourse) return [];
    const titleLower = activeCourse.title.toLowerCase();
    return forumPosts.filter((post) => {
      const tags: string[] = Array.isArray(post?.tags) ? post.tags : [];
      if (scopeFilter === "lesson" && lessonTag) {
        return tags.includes(lessonTag);
      }
      return (
        tags.includes(courseTag) ||
        (lessonTag ? tags.includes(lessonTag) : false) ||
        tags.includes(activeCourse.category || "") ||
        String(post?.title || "").toLowerCase().includes(titleLower)
      );
    });
  }, [forumPosts, scopeFilter, courseTag, lessonTag, activeCourse]);

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

  const handleEnrollCourse = async () => {
    setEnrolling(true);
    try {
      const res = await courseApi.enrollCourse(activeCourse.id);
      const updated = courses.map((c) =>
        c.id === activeCourse.id
          ? { ...c, isEnrolled: true, enrolledCount: res.enrolledCount }
          : c
      );
      onCoursesUpdated(updated);
      showToast?.(
        res.alreadyEnrolled
          ? `Anda sudah terdaftar di "${activeCourse.title}".`
          : `Berhasil mendaftar gratis di "${activeCourse.title}"!`,
        "success"
      );
    } catch (err: any) {
      showToast?.(err?.message || "Gagal mendaftar kursus.", "error");
    } finally {
      setEnrolling(false);
    }
  };

  const handlePostQuestion = async () => {
    if (!questionTitle.trim() || !questionBody.trim()) return;
    setPostingQuestion(true);
    try {
      const updatedPosts = await forumApi.createPost(questionTitle.trim(), questionBody.trim(), [
        courseTag,
        activeLesson ? `lesson:${activeLesson.id}` : "lms",
        activeCourse.category || "Belajar",
      ]);
      if (Array.isArray(updatedPosts)) {
        setForumPosts(updatedPosts);
      }
      setQuestionTitle("");
      setQuestionBody("");
      showToast?.("Pertanyaan Anda diposting ke Diskusi Kursus!", "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal mengirim pertanyaan.", "error");
    } finally {
      setPostingQuestion(false);
    }
  };

  const handleUpvoteQuestion = async (postId: string) => {
    try {
      const updatedPosts = await forumApi.upvotePost(postId);
      if (Array.isArray(updatedPosts)) setForumPosts(updatedPosts);
    } catch (err: any) {
      showToast?.(err?.message || "Gagal menyukai diskusi.", "error");
    }
  };

  const handleReplyQuestion = async (postId: string) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      const updatedPosts = await forumApi.replyPost(postId, replyText.trim());
      if (Array.isArray(updatedPosts)) setForumPosts(updatedPosts);
      setReplyText("");
      setReplyOpenId(null);
      showToast?.("Balasan berhasil dikirim!", "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal mengirim balasan.", "error");
    } finally {
      setSendingReply(false);
    }
  };

  const handleSaveCloudNote = async () => {
    if (!activeLesson) return;
    setSavingNote(true);
    try {
      await studyApi.saveNote(activeCourse.id, activeLesson.id, noteContent, notePinned);
      showToast?.("Catatan modul tersimpan ke cloud PostgreSQL!", "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal menyimpan catatan.", "error");
    } finally {
      setSavingNote(false);
    }
  };

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
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <span className="inline-flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Ruang LMS Terfokus</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-[10px]">
                100% Gratis · Akses Terbuka
              </span>
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
            disabled={enrolling || activeCourse.isEnrolled}
            onClick={handleEnrollCourse}
            className={`px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeCourse.isEnrolled
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-default"
                : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
          >
            {activeCourse.isEnrolled ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Terdaftar
                  {typeof activeCourse.enrolledCount === "number" && activeCourse.enrolledCount > 0
                    ? ` (${activeCourse.enrolledCount})`
                    : ""}
                </span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>{enrolling ? "Mendaftar..." : "Daftar Gratis"}</span>
              </>
            )}
          </button>

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
                      {les.videoUrl && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <Video className="w-3 h-3" /> Video
                          </span>
                        </>
                      )}
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

              {/* Workspace Sub-tabs: Materi, Diskusi Modul, Catatan Cloud */}
              <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("materi")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeTab === "materi"
                      ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Materi &amp; Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("diskusi")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeTab === "diskusi"
                      ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Diskusi Modul (Q&amp;A)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("catatan")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeTab === "catatan"
                      ? "bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  <StickyNote className="w-3.5 h-3.5" />
                  <span>Catatan Cloud</span>
                </button>
              </div>

              {activeTab === "materi" ? (
                <>
                  {activeLesson.learningObjectives && activeLesson.learningObjectives.length > 0 && (
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-2">
                      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Target Pembelajaran Modul</span>
                      </h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
                        {activeLesson.learningObjectives.map((obj, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {activeLesson.videoUrl && (
                    <LessonVideoPlayer videoUrl={activeLesson.videoUrl} title={activeLesson.title} />
                  )}

                  {/* Rich Markdown & Syntax Code Lesson Reader */}
                  <div className="max-w-none">
                    <MarkdownRenderer content={lessonMarkdown} />
                  </div>

                  {/* Inline Knowledge Checks */}
                  {activeLesson.inlineChecks && activeLesson.inlineChecks.length > 0 && (
                    <div className="space-y-3 pt-2">
                      {activeLesson.inlineChecks.map((chk, cIdx) => {
                        const picked = inlineAnswers[chk.id];
                        const answered = picked !== undefined;
                        const isRight = answered && picked === chk.answerIndex;
                        return (
                          <div
                            key={chk.id}
                            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 space-y-2.5"
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                                <HelpCircle className="w-3.5 h-3.5" /> Cek Paham {cIdx + 1}
                              </span>
                              {answered && (
                                <span
                                  className={`inline-flex items-center gap-1 font-semibold ${
                                    isRight ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                  }`}
                                >
                                  {isRight ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                  <span>{isRight ? "Tepat" : "Tinjau Lagi"}</span>
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm font-semibold text-zinc-950 dark:text-white">{chk.question}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {chk.options.map((opt, oIdx) => {
                                const isThisPicked = picked === oIdx;
                                const isCorrectOpt = oIdx === chk.answerIndex;
                                let cls = "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200";
                                if (answered) {
                                  if (isCorrectOpt) {
                                    cls = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold";
                                  } else if (isThisPicked) {
                                    cls = "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300";
                                  }
                                }
                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => setInlineAnswers((prev) => ({ ...prev, [chk.id]: oIdx }))}
                                    className={`text-left px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${cls}`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                            {answered && chk.explanation && (
                              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 pt-1">{chk.explanation}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : activeTab === "diskusi" ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-display font-bold text-sm text-zinc-950 dark:text-white flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <span>Tanya Komunitas &amp; Mentor tentang Modul Ini</span>
                      </h3>
                      <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 bg-white dark:bg-zinc-900 text-[11px] font-semibold">
                        <button
                          type="button"
                          onClick={() => setScopeFilter("course")}
                          className={`px-2.5 py-1 rounded-md cursor-pointer ${
                            scopeFilter === "course" ? "bg-emerald-600 text-white" : "text-zinc-500"
                          }`}
                        >
                          Semua Kursus
                        </button>
                        <button
                          type="button"
                          onClick={() => setScopeFilter("lesson")}
                          className={`px-2.5 py-1 rounded-md cursor-pointer ${
                            scopeFilter === "lesson" ? "bg-emerald-600 text-white" : "text-zinc-500"
                          }`}
                        >
                          Modul Ini
                        </button>
                      </div>
                    </div>

                    {isGuestUser ? (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Anda sedang dalam mode tamu (read-only). Masuk dengan akun Google untuk bertanya, membalas, atau berdiskusi gratis dengan mentor &amp; peserta lain.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        <input
                          type="text"
                          value={questionTitle}
                          onChange={(e) => setQuestionTitle(e.target.value)}
                          placeholder={`Judul pertanyaan seputar "${activeLesson.title}"...`}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white"
                        />
                        <textarea
                          rows={3}
                          value={questionBody}
                          onChange={(e) => setQuestionBody(e.target.value)}
                          placeholder="Jelaskan kendala konsep, error kode, atau studi kasus yang ingin didiskusikan..."
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white resize-none"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={postingQuestion || !questionTitle.trim() || !questionBody.trim()}
                            onClick={handlePostQuestion}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>{postingQuestion ? "Mengirim..." : "Kirim Pertanyaan"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {loadingPosts ? (
                      <p className="text-xs text-zinc-500">Memuat diskusi kursus...</p>
                    ) : scopedQuestions.length === 0 ? (
                      <div className="p-6 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                        Belum ada diskusi khusus pada cakupan ini. Jadilah yang pertama bertanya!
                      </div>
                    ) : (
                      scopedQuestions.map((post) => {
                        const postIdStr = String(post.id);
                        const replies = Array.isArray(post.replies) ? post.replies : [];
                        const isReplyOpen = replyOpenId === postIdStr;
                        return (
                          <div
                            key={post.id}
                            className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                {post.authorName || "Pembelajar SkillOra"}
                              </span>
                              <span>{replies.length} balasan</span>
                            </div>
                            <h4 className="font-semibold text-sm text-zinc-950 dark:text-white">{post.title}</h4>
                            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{post.content}</p>

                            <div className="flex items-center gap-3 pt-1">
                              <button
                                type="button"
                                disabled={isGuestUser}
                                onClick={() => handleUpvoteQuestion(postIdStr)}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-emerald-600 disabled:opacity-50 cursor-pointer"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                <span>{post.upvotes || 0}</span>
                              </button>
                              {!isGuestUser && (
                                <button
                                  type="button"
                                  onClick={() => setReplyOpenId(isReplyOpen ? null : postIdStr)}
                                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                                >
                                  {isReplyOpen ? "Tutup Balasan" : "Balas"}
                                </button>
                              )}
                            </div>

                            {replies.length > 0 && (
                              <div className="mt-2 pl-3 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-2">
                                {replies.slice(-3).map((rep: any, rIdx: number) => (
                                  <div key={rep.id || rIdx} className="text-xs space-y-0.5">
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                      {rep.authorName || "Mentor / Pembelajar"}:{" "}
                                    </span>
                                    <span className="text-zinc-600 dark:text-zinc-300">{rep.content}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {isReplyOpen && !isGuestUser && (
                              <div className="flex gap-2 pt-2">
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Tulis jawaban atau solusi..."
                                  className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white"
                                />
                                <button
                                  type="button"
                                  disabled={sendingReply || !replyText.trim()}
                                  onClick={() => handleReplyQuestion(postIdStr)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
                                >
                                  {sendingReply ? "..." : "Kirim"}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <h3 className="font-display font-bold text-sm text-zinc-950 dark:text-white flex items-center gap-1.5">
                        <StickyNote className="w-4 h-4 text-emerald-600" />
                        <span>Catatan Belajar Pribadi (Cloud PostgreSQL)</span>
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Tersinkron otomatis untuk modul &ldquo;{activeLesson.title}&rdquo;.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotePinned(!notePinned)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer ${
                        notePinned
                          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-500"
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                      <span>{notePinned ? "Disematkan" : "Sematkan"}</span>
                    </button>
                  </div>

                  {isGuestUser ? (
                    <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200">
                      Masuk dengan akun Google untuk menyimpan catatan belajar cloud lintas perangkat secara gratis.
                    </div>
                  ) : (
                    <>
                      <textarea
                        rows={8}
                        disabled={loadingNote}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder={
                          loadingNote
                            ? "Memuat catatan dari cloud..."
                            : "Catat ringkasan penting, rumus, perintah CLI, atau poin revisi Anda di sini..."
                        }
                        className="w-full p-3.5 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:border-emerald-500 text-zinc-900 dark:text-white resize-y"
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          disabled={savingNote || loadingNote}
                          onClick={handleSaveCloudNote}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{savingNote ? "Menyimpan..." : "Simpan Catatan Cloud"}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

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
