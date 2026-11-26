import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  FileText,
  StickyNote,
  Lightbulb,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Save,
  Check,
  Copy,
  Menu,
  X,
  Bot,
  Pin,
  Cloud,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Course, InlineKnowledgeCheck, Profile } from "../types";
import { apiClient, studyApi } from "../api/apiClient";
import { playSound } from "../utils/sound";
import { getCourseProgress, getStructuredModules, saveResumePosition } from "../utils/courseUtils";
import { Button } from "./ui/Button";
import { ProgressBar } from "./ui/ProgressBar";
import { CopilotContextInfo } from "./MentorChatSidebar";
import { FlashcardDeckPanel } from "./training/FlashcardDeckPanel";
import { MarkdownRenderer } from "./ui/MarkdownRenderer";
import { LessonVideoPlayer } from "./ui/LessonVideoPlayer";

interface MateriViewProps {
  courses: Course[];
  profile: Profile;
  onProfileUpdate: (profile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
  onOpenCopilot?: (ctx: CopilotContextInfo) => void;
}

function InlineKnowledgeCheckCard({
  check,
  index,
  selectedOption,
  onSelect,
}: {
  check: InlineKnowledgeCheck;
  index: number;
  selectedOption: number | undefined;
  onSelect: (optionIdx: number) => void;
}) {
  const answered = selectedOption !== undefined;
  const isCorrect = answered && selectedOption === check.answerIndex;

  return (
    <div className="my-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/70 p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          Cek Paham {index + 1}
        </span>
        {answered && (
          <span
            className={`text-xs font-semibold flex items-center gap-1 ${
              isCorrect
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Tepat
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" /> Perlu Ditinjau
              </>
            )}
          </span>
        )}
      </div>

      <p className="text-sm font-semibold text-zinc-950 dark:text-white leading-snug">
        {check.question}
      </p>

      <div className="space-y-2">
        {check.options.map((opt, optIdx) => {
          const isPicked = selectedOption === optIdx;
          const isRightOption = optIdx === check.answerIndex;

          let optionStyle =
            "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-emerald-500/60";
          if (answered) {
            if (isRightOption) {
              optionStyle =
                "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium";
            } else if (isPicked) {
              optionStyle =
                "border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200";
            } else {
              optionStyle =
                "border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/50 text-zinc-500 dark:text-zinc-500";
            }
          }

          return (
            <button
              key={optIdx}
              type="button"
              onClick={() => onSelect(optIdx)}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs sm:text-sm transition-colors flex items-start gap-2.5 cursor-pointer ${optionStyle}`}
            >
              <span className="font-mono text-xs font-bold shrink-0 mt-0.5">
                {String.fromCharCode(65 + optIdx)}.
              </span>
              <span className="flex-1 leading-snug">{opt}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="pt-2.5 border-t border-zinc-200 dark:border-zinc-800 space-y-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
          {(() => {
            const parts = String(check.explanation || "")
              .split(" | ")
              .map((s) => s.trim())
              .filter(Boolean);
            const mainExp = parts[0] || check.explanation;
            const correctReason = parts.find((p) => p.startsWith("Mengapa Opsi"));
            const distractorReason = parts.find((p) => p.startsWith("Bedah Opsi Pengecoh:"));
            const correctLetter = String.fromCharCode(65 + check.answerIndex);

            return (
              <>
                <div>
                  <span className="font-semibold text-zinc-950 dark:text-white">Inti Pembahasan: </span>
                  {mainExp}
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200">
                  <span className="font-semibold">Mengapa Opsi {correctLetter} Tepat: </span>
                  {correctReason
                    ? correctReason.replace(/^Mengapa Opsi [^:]+:\s*/, "")
                    : `Pilihan ${correctLetter} ("${check.options[check.answerIndex]}") paling memenuhi kaidah ${check.competencyTag || "kompetensi materi ini"}.`}
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60 text-amber-950 dark:text-amber-200">
                  <span className="font-semibold">Bedah Opsi Pengecoh: </span>
                  {distractorReason
                    ? distractorReason.replace(/^Bedah Opsi Pengecoh:\s*/, "")
                    : check.options
                        .map((opt, idx) =>
                          idx !== check.answerIndex
                            ? `Opsi ${String.fromCharCode(65 + idx)} ("${opt}") kurang tepat karena tidak menyelesaikan inti permasalahan pada soal.`
                            : null
                        )
                        .filter(Boolean)
                        .slice(0, 2)
                        .join(" ")}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400">
        <span className="font-mono uppercase font-semibold">{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          aria-label="Salin kode"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Tersalin</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Salin</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderFormattedInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\$[^\$]+\$)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-semibold text-zinc-950 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-300 rounded font-mono text-xs border border-zinc-200 dark:border-zinc-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("$") && part.endsWith("$")) {
      return (
        <span
          key={idx}
          className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs rounded"
        >
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

function FormattedTextBlock({ content }: { content: string }) {
  const paragraphs = content.split("\n\n");

  return (
    <div className="space-y-4">
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();

        if (trimmed.startsWith("### ")) {
          return (
            <h3
              key={pIdx}
              className="pt-4 pb-1 border-b border-zinc-200 dark:border-zinc-800 text-base sm:text-lg font-bold font-display text-zinc-950 dark:text-white"
            >
              {trimmed.replace(/^###\s+/, "")}
            </h3>
          );
        }

        if (trimmed.startsWith("## ")) {
          return (
            <h2
              key={pIdx}
              className="pt-5 pb-1 text-lg sm:text-xl font-bold font-display text-zinc-950 dark:text-white tracking-tight"
            >
              {trimmed.replace(/^##\s+/, "")}
            </h2>
          );
        }

        if (trimmed.startsWith("> ")) {
          const calloutText = trimmed.replace(/^>\s*/, "").trim();
          return (
            <div
              key={pIdx}
              className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 my-3.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line"
            >
              {renderFormattedInline(calloutText)}
            </div>
          );
        }

        if (
          trimmed
            .split("\n")
            .some((line) => line.trim().startsWith("- ") || line.trim().startsWith("* ") || /^\d+\.\s/.test(line.trim()))
        ) {
          const lines = trimmed.split("\n");
          return (
            <ul key={pIdx} className="space-y-2 my-2.5 pl-1">
              {lines.map((line, lIdx) => {
                const lineTrim = line.trim();
                const isList = /^\d+\.\s/.test(lineTrim) || lineTrim.startsWith("- ") || lineTrim.startsWith("* ");
                if (!isList) {
                  return (
                    <p key={lIdx} className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
                      {renderFormattedInline(line)}
                    </p>
                  );
                }
                const cleanText = lineTrim.replace(/^(-\s*|\*\s*|\d+\.\s*)/, "");
                return (
                  <li key={lIdx} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0 mt-2" />
                    <div>{renderFormattedInline(cleanText)}</div>
                  </li>
                );
              })}
            </ul>
          );
        }

        return (
          <p key={pIdx} className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed">
            {renderFormattedInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export function MateriView({
  courses,
  profile,
  onProfileUpdate,
  showToast,
  onOpenCopilot,
}: MateriViewProps) {
  const { id: routeCourseId, lessonId: routeLessonId } = useParams();
  const navigate = useNavigate();

  const course = courses.find((c) => c.id === routeCourseId) || courses[0];
  const lesson = course?.lessons.find((l) => l.id === routeLessonId) || course?.lessons[0];

  const lessonIndex = course?.lessons.findIndex((l) => l.id === lesson?.id) ?? 0;
  const isFirstLesson = lessonIndex === 0;
  const prevLesson = lessonIndex > 0 ? course?.lessons[lessonIndex - 1] : null;

  // PostgreSQL Cloud Notes state
  const [noteContent, setNoteContent] = useState<string>("");
  const [notePinned, setNotePinned] = useState<boolean>(false);
  const [noteUpdatedAt, setNoteUpdatedAt] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState<boolean>(false);
  const [loadingNote, setLoadingNote] = useState<boolean>(false);

  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState<boolean>(false);
  const [showFlashcardDrawer, setShowFlashcardDrawer] = useState<boolean>(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState<boolean>(false);

  // Inline Knowledge Checks state per lesson
  const [inlineAnswers, setInlineAnswers] = useState<Record<string, number>>({});
  const [activeSectionFilter, setActiveSectionFilter] = useState<
    "all" | "case2026" | "cheatsheet" | "template" | "checks"
  >("all");
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const modules = useMemo(() => (course ? getStructuredModules(course) : []), [course]);
  const progressInfo = useMemo(() => (course ? getCourseProgress(course) : null), [course]);

  // Reset inline check answers & load Cloud Notes on lesson change
  useEffect(() => {
    if (!course || !lesson) return;
    setInlineAnswers({});
    setActiveSectionFilter("all");
    setCopiedTemplate(false);

    if (profile?.bookmarkedLessons) {
      setIsBookmarked(profile.bookmarkedLessons.includes(lesson.id));
    }
    saveResumePosition(course.id, lesson.id, course.title, lesson.title);

    let active = true;
    setLoadingNote(true);
    studyApi
      .getNote(course.id, lesson.id)
      .then((cloudNote) => {
        if (!active) return;
        if (cloudNote) {
          setNoteContent(cloudNote.content);
          setNotePinned(cloudNote.isPinned);
          setNoteUpdatedAt(cloudNote.updatedAt);
        } else {
          setNoteContent(lesson.notes || "");
          setNotePinned(false);
          setNoteUpdatedAt(null);
        }
      })
      .catch(() => {
        if (active) setNoteContent(lesson.notes || "");
      })
      .finally(() => {
        if (active) setLoadingNote(false);
      });

    return () => {
      active = false;
    };
  }, [course?.id, lesson?.id, profile?.bookmarkedLessons]);

  if (!course || !lesson) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="font-display text-xl font-bold text-zinc-950 dark:text-white">Materi Tidak Ditemukan</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Materi pelajaran yang Anda cari tidak tersedia atau sedang diperbarui.
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate("/belajar/katalog")}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Kembali ke Katalog Kursus
        </Button>
      </div>
    );
  }

  const inlineChecks = lesson.inlineChecks || [];
  const answeredChecksCount = inlineChecks.filter((c) => inlineAnswers[c.id] !== undefined).length;
  const correctChecksCount = inlineChecks.filter(
    (c) => inlineAnswers[c.id] === c.answerIndex
  ).length;

  const handleSelectInlineCheck = (check: InlineKnowledgeCheck, optionIdx: number) => {
    setInlineAnswers((prev) => ({ ...prev, [check.id]: optionIdx }));
    playSound(optionIdx === check.answerIndex ? "correct" : "wrong");
  };

  const handleSaveCloudNote = async () => {
    setSavingNote(true);
    try {
      const saved = await studyApi.saveNote(course.id, lesson.id, noteContent, notePinned);
      setNoteUpdatedAt(saved.updatedAt);
      showToast?.("Catatan tersinkron ke Cloud PostgreSQL.", "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal menyimpan catatan ke cloud.", "error");
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteCloudNote = async () => {
    setSavingNote(true);
    try {
      await studyApi.deleteNote(course.id, lesson.id);
      setNoteContent("");
      setNotePinned(false);
      setNoteUpdatedAt(null);
      showToast?.("Catatan cloud dihapus.", "info");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal menghapus catatan.", "error");
    } finally {
      setSavingNote(false);
    }
  };

  const handleToggleBookmark = async () => {
    const currentBookmarks = profile?.bookmarkedLessons || [];
    const updated = isBookmarked
      ? currentBookmarks.filter((id) => id !== lesson.id)
      : [...currentBookmarks, lesson.id];

    setIsBookmarked(!isBookmarked);
    onProfileUpdate({ ...profile, bookmarkedLessons: updated });

    try {
      await apiClient.post("/user/bookmark-lesson", { courseId: course.id, lessonId: lesson.id });
      showToast?.(!isBookmarked ? "Materi disimpan ke Bookmark." : "Materi dihapus dari Bookmark.", "success");
    } catch {
      // ignore
    }
  };

  const handleCompleteAndGoToQuiz = async () => {
    playSound("correct");
    setIsCompleting(true);
    try {
      const data = await apiClient.post("/courses/complete-lesson", {
        courseId: course.id,
        lessonId: lesson.id,
        completed: true,
      });
      if (data.profile) onProfileUpdate(data.profile);
    } catch {
      // ignore
    } finally {
      setIsCompleting(false);
    }
    showToast?.("Materi selesai! Membuka latihan pemahaman...", "success");
    navigate(`/belajar/kursus/${course.id}/latihan/${lesson.id}`);
  };

  const handlePrevLesson = () => {
    if (prevLesson) {
      navigate(`/belajar/kursus/${course.id}/materi/${prevLesson.id}`);
    }
  };

  // Compute where to interleave inline checks cleanly among content blocks
  const contentBlocks = lesson.contentBlocks || [];
  const firstCheckAfterBlock = contentBlocks.length > 1 ? Math.floor(contentBlocks.length / 2) - 1 : 0;

  return (
    <div className="w-full pb-20 lg:pb-12 space-y-5">
      {/* Top Course Player Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-zinc-900 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 overflow-x-auto whitespace-nowrap min-w-0">
          <Link to="/belajar/katalog" className="hover:text-emerald-600 dark:hover:text-emerald-400">
            Katalog
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <Link
            to={`/belajar/kursus/${course.id}`}
            className="hover:text-emerald-600 dark:hover:text-emerald-400 truncate max-w-[160px] sm:max-w-xs"
          >
            {course.title}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span className="text-zinc-950 dark:text-white font-semibold font-mono tabular-nums">
            Sesi {lessonIndex + 1}/{course.lessons.length}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowMobileSidebar(true)}
            className="lg:hidden px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Menu className="w-3.5 h-3.5" />
            Silabus
          </button>

          <button
            type="button"
            onClick={() => setShowFlashcardDrawer(true)}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500/60 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Flashcard</span>
          </button>

          {onOpenCopilot && (
            <button
              type="button"
              onClick={() =>
                onOpenCopilot({
                  courseTitle: course.title,
                  lessonTitle: lesson.title,
                })
              }
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500/60 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Tanya Copilot</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowNotesDrawer(true)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              noteContent.trim()
                ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Catatan</span>
          </button>

          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
              isBookmarked
                ? "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`}
            aria-label={isBookmarked ? "Hapus dari bookmark" : "Simpan materi"}
          >
            {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isBookmarked ? "Tersimpan" : "Simpan"}</span>
          </button>
        </div>
      </div>

      {/* 2-Zone Course Player Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT SYLLABUS SIDEBAR */}
        <aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">Silabus Kursus</span>
                <span className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {progressInfo?.percentage || 0}%
                </span>
              </div>
              <ProgressBar
                value={progressInfo?.percentage || 0}
                variant={progressInfo?.isCompleted ? "success" : "primary"}
                size="sm"
              />
            </div>

            <div className="space-y-3 max-h-[calc(100dvh-11rem)] overflow-y-auto pr-1">
              {modules.map((mod) => (
                <div key={mod.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <span>Modul {mod.moduleNumber}</span>
                    <span className="font-mono tabular-nums text-zinc-400">
                      {mod.completedLessonsCount}/{mod.totalLessonsCount}
                    </span>
                  </div>

                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {mod.lessons.map(({ lesson: les, indexInCourse, isCompleted: lesCompleted, isLocked: lesLocked }) => {
                      const isActive = les.id === lesson.id;
                      return (
                        <button
                          key={les.id}
                          type="button"
                          disabled={lesLocked}
                          onClick={() => navigate(`/belajar/kursus/${course.id}/materi/${les.id}`)}
                          className={`w-full text-left px-3 py-2.5 text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                            isActive
                              ? "bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold"
                              : lesLocked
                              ? "text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-60"
                              : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 font-mono text-[11px] font-semibold ${
                              lesCompleted
                                ? "bg-emerald-600 text-white"
                                : isActive
                                ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
                            }`}
                          >
                            {lesCompleted ? <Check className="w-3 h-3" /> : indexInCourse + 1}
                          </div>
                          <span className="truncate flex-1">{les.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => navigate(`/belajar/kursus/${course.id}`)}
                className="w-full py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Kembali ke Hub 4 Tahap
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT EDITORIAL READING CANVAS */}
        <article className="lg:col-span-8 space-y-5">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-800 space-y-6">
            {/* Clean Unboxed Metadata Header */}
            <header className="space-y-2 pb-5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                <span>Sesi {lessonIndex + 1} dari {course.lessons.length}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {lesson.estimatedMinutes || 15} menit baca
                </span>
                {inlineChecks.length > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      Cek Paham {answeredChecksCount}/{inlineChecks.length}
                      {answeredChecksCount > 0 ? ` (${correctChecksCount} benar)` : ""}
                    </span>
                  </>
                )}
                {lesson.xp && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{lesson.xp} XP</span>
                  </>
                )}
                {lesson.completed && (
                  <>
                    <span>·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Selesai</span>
                  </>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold font-display text-zinc-950 dark:text-white tracking-tight leading-snug">
                {lesson.title}
              </h1>
            </header>

            {/* Learning Objectives */}
            {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Target Pembelajaran Sesi Ini
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                  {lesson.learningObjectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 2026 Practical Quick Section Filter & 1-Click Template Copy Bar */}
            {(() => {
              const allText = contentBlocks.map((b) => b.content).join("\n\n");
              const codeFenceMatch = allText.match(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/);
              const extractedTemplate = codeFenceMatch ? codeFenceMatch[1].trim() : "";

              return (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-1">
                    {(
                      [
                        { id: "all", label: "Semua Bagian" },
                        { id: "case2026", label: "Studi Kasus 2026" },
                        { id: "cheatsheet", label: "Cheat Sheet & Jebakan" },
                        { id: "template", label: "Template Kerja" },
                        { id: "checks", label: `Cek Paham (${inlineChecks.length})` },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveSectionFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          activeSectionFilter === tab.id
                            ? "bg-white dark:bg-zinc-900 text-emerald-700 dark:text-emerald-400 shadow-xs border border-zinc-200/80 dark:border-zinc-800"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {extractedTemplate && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(extractedTemplate);
                        setCopiedTemplate(true);
                        showToast?.("Template kerja 2026 disalin ke clipboard.", "success");
                        setTimeout(() => setCopiedTemplate(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-emerald-500/60 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {copiedTemplate ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-700 dark:text-emerald-400">Template Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Salin Template Kerja</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })()}

            {/* Reading Body with Interleaved Inline Knowledge Checks */}
            <div className="max-w-[72ch] space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Panduan terstruktur dan studi kasus praktis mengenai{" "}
                <strong className="font-semibold text-zinc-950 dark:text-white">{lesson.title}</strong> dalam standar kurikulum {course.partner} · Edisi Industri & Seleksi 2026.
              </p>

              {lesson.videoUrl && activeSectionFilter === "all" && (
                <LessonVideoPlayer videoUrl={lesson.videoUrl} title={lesson.title} />
              )}

              {activeSectionFilter === "checks" ? (
                <div className="space-y-4">
                  {inlineChecks.length === 0 ? (
                    <p className="text-xs text-zinc-500">Belum ada kartu cek paham pada sesi ini.</p>
                  ) : (
                    inlineChecks.map((chk, idx) => (
                      <InlineKnowledgeCheckCard
                        key={chk.id}
                        check={chk}
                        index={idx}
                        selectedOption={inlineAnswers[chk.id]}
                        onSelect={(optIdx) => handleSelectInlineCheck(chk, optIdx)}
                      />
                    ))
                  )}
                </div>
              ) : contentBlocks.length > 0 ? (
                (() => {
                  const visibleBlocks = contentBlocks.filter((block) => {
                    if (activeSectionFilter === "all") return true;
                    const text = block.content || "";
                    if (activeSectionFilter === "case2026") {
                      return /Studi Kasus|2026|Konteks/i.test(text);
                    }
                    if (activeSectionFilter === "cheatsheet") {
                      return /Cheat Sheet|Rumus Cepat|Jebakan/i.test(text);
                    }
                    if (activeSectionFilter === "template") {
                      return /Template Kerja|Panduan Praktik|```/i.test(text);
                    }
                    return true;
                  });
                  const blocksToRender = visibleBlocks.length > 0 ? visibleBlocks : contentBlocks;

                  return (
                    <>
                      {blocksToRender.map((block, bIdx) => (
                        <React.Fragment key={block.id}>
                          <div>
                            {block.type === "text" && <MarkdownRenderer content={block.content} />}
                            {block.type === "code" && (
                              <CodeBlock code={block.content} language={block.language || "code"} />
                            )}
                          </div>

                          {/* Interleave first inline knowledge check mid-article when viewing all */}
                          {activeSectionFilter === "all" && bIdx === firstCheckAfterBlock && inlineChecks[0] && (
                            <InlineKnowledgeCheckCard
                              check={inlineChecks[0]}
                              index={0}
                              selectedOption={inlineAnswers[inlineChecks[0].id]}
                              onSelect={(optIdx) => handleSelectInlineCheck(inlineChecks[0], optIdx)}
                            />
                          )}
                        </React.Fragment>
                      ))}

                      {/* Remaining inline knowledge checks at end of reading */}
                      {activeSectionFilter === "all" &&
                        inlineChecks.slice(1).map((chk, idx) => (
                          <InlineKnowledgeCheckCard
                            key={chk.id}
                            check={chk}
                            index={idx + 1}
                            selectedOption={inlineAnswers[chk.id]}
                            onSelect={(optIdx) => handleSelectInlineCheck(chk, optIdx)}
                          />
                        ))}
                    </>
                  );
                })()
              ) : (
                <>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Dalam sesi ini Anda mempelajari fondasi arsitektur, pola implementasi terbaik, serta analisis kasus yang diujikan pada seleksi industri.
                  </p>
                  {inlineChecks[0] && (
                    <InlineKnowledgeCheckCard
                      check={inlineChecks[0]}
                      index={0}
                      selectedOption={inlineAnswers[inlineChecks[0].id]}
                      onSelect={(optIdx) => handleSelectInlineCheck(inlineChecks[0], optIdx)}
                    />
                  )}
                </>
              )}

              {lesson.transcript && (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5 mt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Catatan Instruktur
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{lesson.transcript}</p>
                </div>
              )}
            </div>

            {/* Quick Flashcard Reminder Strip */}
            {lesson.flashcards && lesson.flashcards.length > 0 && (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-zinc-950 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {lesson.flashcards.length} Flashcard Konsep Kunci Tersedia
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Uji daya ingat aktif sesi ini dengan spaced repetition SM-2 sebelum lanjut ke kuis.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowFlashcardDrawer(true)}
                  leftIcon={<Layers className="w-3.5 h-3.5" />}
                >
                  Latih Flashcard
                </Button>
              </div>
            )}

            {/* References */}
            {lesson.sources && lesson.sources.length > 0 && (
              <div className="pt-5 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Referensi & Dokumentasi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {lesson.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 transition-colors text-xs"
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{source.title}</span>
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation Bar */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              variant="secondary"
              size="md"
              disabled={isFirstLesson}
              onClick={handlePrevLesson}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              {prevLesson ? "Sebelumnya" : "Sesi Pertama"}
            </Button>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => navigate(`/belajar/kursus/${course.id}`)}
                className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer whitespace-nowrap"
              >
                Hub 4 Tahap
              </button>
              <Button
                variant="primary"
                size="md"
                onClick={handleCompleteAndGoToQuiz}
                disabled={isCompleting}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isCompleting ? "Menyimpan..." : "Lanjut ke Latihan Soal"}
              </Button>
            </div>
          </div>
        </article>
      </div>

      {/* FLASHCARD SM-2 SLIDE-OVER DRAWER */}
      {showFlashcardDrawer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-zinc-950/50 backdrop-blur-xs flex items-center justify-center sm:justify-end p-3 sm:p-4"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-lg w-full max-h-[88vh] p-5 shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="min-w-0">
                <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <Layers className="w-3.5 h-3.5" />
                  Flashcard Spaced Repetition
                </p>
                <h3 className="text-xs font-semibold text-zinc-950 dark:text-white truncate mt-0.5">
                  {course.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFlashcardDrawer(false)}
                aria-label="Tutup flashcard"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <FlashcardDeckPanel
                courseId={course.id}
                onProfileUpdate={onProfileUpdate}
                showToast={showToast}
                compact
              />
            </div>
          </div>
        </div>
      )}

      {/* CLOUD NOTES DRAWER (PostgreSQL Synced) */}
      {showNotesDrawer && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-zinc-950/50 backdrop-blur-xs flex items-center justify-center sm:justify-end p-3 sm:p-4"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-md w-full h-[540px] p-5 shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="min-w-0">
                <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <Cloud className="w-3.5 h-3.5" />
                  Catatan Cloud Tersinkron
                </p>
                <h3 className="text-xs font-semibold text-zinc-950 dark:text-white truncate mt-0.5">
                  {lesson.title}
                </h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setNotePinned((p) => !p)}
                  title={notePinned ? "Lepas pin catatan" : "Sematkan catatan"}
                  className={`p-1.5 rounded-lg cursor-pointer ${
                    notePinned
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600"
                      : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  <Pin className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotesDrawer(false)}
                  aria-label="Tutup catatan"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <textarea
              aria-label="Isi catatan materi"
              value={noteContent}
              disabled={loadingNote}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder={loadingNote ? "Memuat catatan cloud..." : "Tulis poin penting, rumus, atau potongan kode sesi ini..."}
              className="flex-1 w-full p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={savingNote || !noteContent.trim()}
                  onClick={handleDeleteCloudNote}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium disabled:opacity-40 cursor-pointer"
                >
                  Hapus
                </button>
                {noteUpdatedAt && (
                  <span className="text-[11px] font-mono text-zinc-400">
                    Tersimpan {new Date(noteUpdatedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setShowNotesDrawer(false)}>
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={savingNote}
                  onClick={handleSaveCloudNote}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  {savingNote ? "Menyimpan..." : "Simpan Cloud"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE SYLLABUS DRAWER */}
      {showMobileSidebar && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 bg-zinc-950/50 backdrop-blur-xs flex items-center justify-start p-3 lg:hidden"
        >
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-sm w-full h-[85vh] p-4 shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-display font-bold text-sm text-zinc-950 dark:text-white">Silabus Kursus</h3>
              <button
                type="button"
                onClick={() => setShowMobileSidebar(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                aria-label="Tutup silabus"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {modules.map((mod) => (
                <div key={mod.id} className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Modul {mod.moduleNumber}
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {mod.lessons.map(({ lesson: les, indexInCourse, isCompleted: lesCompleted, isLocked: lesLocked }) => {
                      const isActive = les.id === lesson.id;
                      return (
                        <button
                          key={les.id}
                          type="button"
                          disabled={lesLocked}
                          onClick={() => {
                            setShowMobileSidebar(false);
                            navigate(`/belajar/kursus/${course.id}/materi/${les.id}`);
                          }}
                          className={`w-full text-left px-3 py-2.5 text-xs flex items-center gap-2.5 ${
                            isActive
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold"
                              : lesLocked
                              ? "text-zinc-400 opacity-60 cursor-not-allowed"
                              : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          <span className="font-mono text-[11px]">{lesCompleted ? "✓" : indexInCourse + 1}</span>
                          <span className="truncate flex-1">{les.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <Button variant="secondary" size="sm" fullWidth onClick={() => setShowMobileSidebar(false)}>
              Tutup Silabus
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MateriView;
