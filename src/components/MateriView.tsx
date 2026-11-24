import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Award, 
  ChevronRight, 
  ChevronLeft,
  PlayCircle, 
  HelpCircle, 
  FileText, 
  StickyNote, 
  Lightbulb, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Bookmark, 
  BookmarkCheck, 
  Save, 
  Check,
  Copy,
  Layers,
  Menu,
  X,
  Target,
  Share2
} from "lucide-react";
import { Course, Lesson, Profile } from "../types";
import { apiClient } from "../api/apiClient";
import { playSound } from "../utils/sound";
import { getCourseProgress, getStructuredModules, saveResumePosition } from "../utils/courseUtils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { ProgressBar } from "./ui/ProgressBar";

interface MateriViewProps {
  courses: Course[];
  profile: Profile;
  onProfileUpdate: (profile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

// Code Block with Copy feature
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
        <span className="font-mono uppercase font-bold">{language || "Code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          aria-label="Salin kode"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Salin</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Helper component to render rich formatted text content with callouts, headers, bold text & lists
function FormattedTextBlock({ content }: { content: string }) {
  const paragraphs = content.split("\n\n");

  return (
    <div className="space-y-4">
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();

        // Check Heading 3 (###)
        if (trimmed.startsWith("### ")) {
          const titleText = trimmed.replace(/^###\s+/, "");
          return (
            <div key={pIdx} className="pt-4 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-4.5 bg-blue-600 dark:bg-blue-400 rounded-full shrink-0" />
                <span>{titleText}</span>
              </h3>
            </div>
          );
        }

        // Check Heading 2 (##)
        if (trimmed.startsWith("## ")) {
          const titleText = trimmed.replace(/^##\s+/, "");
          return (
            <div key={pIdx} className="pt-5 pb-1">
              <h2 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
                {titleText}
              </h2>
            </div>
          );
        }

        // Check Callouts (> 💡, > ⚠️, > 📌, > 🎯, > )
        if (trimmed.startsWith("> ")) {
          const calloutText = trimmed.replace(/^>\s*/, "").trim();
          let boxStyle = "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-950 dark:text-blue-200";
          let icon = "📌";

          if (calloutText.includes("💡") || calloutText.toLowerCase().includes("tip") || calloutText.toLowerCase().includes("trik")) {
            boxStyle = "bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200";
            icon = "💡";
          } else if (calloutText.includes("⚠️") || calloutText.toLowerCase().includes("jebakan") || calloutText.toLowerCase().includes("peringatan")) {
            boxStyle = "bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200";
            icon = "⚠️";
          } else if (calloutText.includes("🎯") || calloutText.toLowerCase().includes("formula") || calloutText.toLowerCase().includes("rumus")) {
            boxStyle = "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200";
            icon = "🎯";
          }

          return (
            <div key={pIdx} className={`p-4 rounded-2xl border ${boxStyle} shadow-2xs space-y-1 my-3.5`}>
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0 mt-0.5">{icon}</span>
                <div className="text-xs sm:text-sm font-medium leading-relaxed whitespace-pre-line">
                  {renderFormattedInline(calloutText.replace(/^[💡⚠️📌🎯]\s*/, ""))}
                </div>
              </div>
            </div>
          );
        }

        // Check bullet lists
        if (trimmed.split("\n").some(line => line.trim().startsWith("- ") || line.trim().startsWith("* ") || /^\d+\.\s/.test(line.trim()))) {
          const lines = trimmed.split("\n");
          return (
            <ul key={pIdx} className="space-y-2 my-2.5 pl-1">
              {lines.map((line, lIdx) => {
                const lineTrim = line.trim();
                const isOrdered = /^\d+\.\s/.test(lineTrim);
                const isUnordered = lineTrim.startsWith("- ") || lineTrim.startsWith("* ");
                if (!isOrdered && !isUnordered) {
                  return (
                    <p key={lIdx} className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                      {renderFormattedInline(line)}
                    </p>
                  );
                }

                const cleanText = lineTrim.replace(/^(-\s*|\*\s*|\d+\.\s*)/, "");
                return (
                  <li key={lIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-2" />
                    <div>{renderFormattedInline(cleanText)}</div>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Default Paragraph
        return (
          <p key={pIdx} className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
            {renderFormattedInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

// Helper for inline bold (**text**), code (`code`), and highlight ($text$)
function renderFormattedInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\$[^\$]+\$)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={idx} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-md font-mono text-xs border border-slate-200 dark:border-slate-700">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("$") && part.endsWith("$")) {
      return (
        <span key={idx} className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-xs rounded-md border border-blue-200 dark:border-blue-800">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

export function MateriView({
  courses,
  profile,
  onProfileUpdate,
  showToast,
}: MateriViewProps) {
  const { id: routeCourseId, lessonId: routeLessonId } = useParams();
  const navigate = useNavigate();

  const course = courses.find((c) => c.id === routeCourseId) || courses[0];
  const lesson = course?.lessons.find((l) => l.id === routeLessonId) || course?.lessons[0];

  const lessonIndex = course?.lessons.findIndex((l) => l.id === lesson?.id) ?? 0;
  const isFirstLesson = lessonIndex === 0;
  const isLastLesson = lessonIndex === (course?.lessons.length ?? 1) - 1;
  const prevLesson = lessonIndex > 0 ? course?.lessons[lessonIndex - 1] : null;
  const nextLesson = course?.lessons[lessonIndex + 1];

  // Notes & UI State
  const [noteContent, setNoteContent] = useState<string>("");
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isCompleting, setIsCompleting] = useState<boolean>(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState<boolean>(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState<boolean>(false);

  // Structured Modules for Sidebar
  const modules = useMemo(() => {
    return course ? getStructuredModules(course) : [];
  }, [course]);

  const progressInfo = useMemo(() => {
    return course ? getCourseProgress(course) : null;
  }, [course]);

  // Sync state on change
  useEffect(() => {
    if (course && lesson) {
      const savedNote = localStorage.getItem(`skillora_note_${course.id}_${lesson.id}`) || lesson.notes || "";
      setNoteContent(savedNote);

      if (profile?.bookmarkedLessons) {
        setIsBookmarked(profile.bookmarkedLessons.includes(lesson.id));
      }

      // Auto save resume position
      saveResumePosition(course.id, lesson.id, course.title, lesson.title);
    }
  }, [course, lesson, profile]);

  if (!course || !lesson) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="text-4xl">📚</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Materi Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
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

  // Save Note
  const handleSaveNote = () => {
    localStorage.setItem(`skillora_note_${course.id}_${lesson.id}`, noteContent);
    if (showToast) {
      showToast("Catatan materi berhasil disimpan! 📝", "success");
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = async () => {
    const currentBookmarks = profile?.bookmarkedLessons || [];
    const updated = isBookmarked
      ? currentBookmarks.filter((id) => id !== lesson.id)
      : [...currentBookmarks, lesson.id];

    setIsBookmarked(!isBookmarked);
    onProfileUpdate({ ...profile, bookmarkedLessons: updated });

    try {
      await apiClient.post("/user/bookmark-lesson", { courseId: course.id, lessonId: lesson.id });
      if (showToast) {
        showToast(!isBookmarked ? "Materi disimpan ke Bookmark 🔖" : "Materi dihapus dari Bookmark", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Complete and continue
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
    } catch (e) {
      console.error(e);
    } finally {
      setIsCompleting(false);
    }

    if (showToast) {
      showToast(`Materi selesai! Membuka kuis latihan... 🚀`, "success");
    }

    navigate(`/belajar/kursus/${course.id}/latihan/${lesson.id}`);
  };

  // Navigate to previous lesson
  const handlePrevLesson = () => {
    if (prevLesson) {
      navigate(`/belajar/kursus/${course.id}/materi/${prevLesson.id}`);
    }
  };

  // Navigate to next lesson
  const handleNextLessonDirectly = () => {
    if (nextLesson) {
      navigate(`/belajar/kursus/${course.id}/materi/${nextLesson.id}`);
    } else {
      navigate(`/belajar/kursus/${course.id}`);
    }
  };

  return (
    <div className="animate-in fade-in duration-200 max-w-[1360px] mx-auto w-full pb-20 lg:pb-12 px-3 sm:px-5 pt-2 sm:pt-4 space-y-4">
      
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-nowrap min-w-0">
          <Link to="/belajar" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Belajar</Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <Link to={`/belajar/kursus/${course.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-[160px] sm:max-w-xs">
            {course.title}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-slate-800 dark:text-slate-200 font-bold truncate">
            Sesi {lessonIndex + 1} dari {course.lessons?.length}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Sidebar Toggle */}
          <button
            type="button"
            onClick={() => setShowMobileSidebar(true)}
            className="lg:hidden px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Menu className="w-3.5 h-3.5" />
            <span>Silabus</span>
          </button>

          {/* Note Toggle Button */}
          <button
            type="button"
            onClick={() => setShowNotesDrawer(!showNotesDrawer)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showNotesDrawer
                ? "bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
          >
            <StickyNote className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Catatan</span>
          </button>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isBookmarked
                ? "bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            }`}
            aria-label={isBookmarked ? "Hapus dari bookmark" : "Simpan materi"}
          >
            {isBookmarked ? <BookmarkCheck className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isBookmarked ? "Tersimpan" : "Simpan"}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Learning Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT SYLLABUS SIDEBAR (Desktop - 4 Cols) */}
        <div className="hidden lg:block lg:col-span-4 space-y-4 sticky top-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3.5 shadow-2xs">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>Silabus Kursus</span>
                <span className="text-blue-600 dark:text-blue-400">{progressInfo?.percentage}% Selesai</span>
              </div>
              <ProgressBar
                value={progressInfo?.percentage || 0}
                variant={progressInfo?.isCompleted ? "success" : "primary"}
                size="sm"
              />
            </div>

            {/* Modules Accordion / List */}
            <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {modules.map((mod) => (
                <div key={mod.id} className="rounded-xl border border-slate-100 dark:border-slate-800/80 overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Modul {mod.moduleNumber}</span>
                    <span className="text-slate-400">{mod.completedLessonsCount}/{mod.totalLessonsCount}</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {mod.lessons.map(({ lesson: les, indexInCourse, isCompleted: lesCompleted, isLocked: lesLocked }) => {
                      const isActive = les.id === lesson.id;
                      return (
                        <button
                          key={les.id}
                          type="button"
                          disabled={lesLocked}
                          onClick={() => navigate(`/belajar/kursus/${course.id}/materi/${les.id}`)}
                          className={`w-full text-left p-2.5 text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                            isActive
                              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border-l-3 border-blue-600"
                              : lesCompleted
                              ? "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 font-medium"
                              : lesLocked
                              ? "text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60"
                              : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 font-medium"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${
                            lesCompleted
                              ? "bg-emerald-500 text-white"
                              : isActive
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}>
                            {lesCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : indexInCourse + 1}
                          </div>
                          <span className="truncate flex-1">{les.title}</span>
                          {les.questions && les.questions.length > 0 && (
                            <span className="text-xs px-1 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/50">
                              Kuis
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT READING CANVAS (8 Cols on Desktop / 12 Cols on Mobile) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Lesson Header Canvas */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="primary" size="sm">
                  Sesi {lessonIndex + 1} dari {course.lessons.length}
                </Badge>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {lesson.estimatedMinutes || 15} Menit Baca
                </span>
                {lesson.xp && (
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800/60">
                    +{lesson.xp} XP
                  </span>
                )}
                {lesson.completed && (
                  <Badge variant="success" size="sm">
                    <Check className="w-3 h-3 mr-1" /> Selesai
                  </Badge>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-900 dark:text-white tracking-tight leading-snug">
                {lesson.title}
              </h1>
            </div>

            {/* Target Pembelajaran / Objectives */}
            {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-2">
                <h3 className="text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5 uppercase tracking-wide">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> Target Pembelajaran Sesi Ini
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-blue-900 dark:text-blue-300">
                  {lesson.learningObjectives.map((obj, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Structured Content Area */}
            <div className="prose dark:prose-invert max-w-none space-y-4 text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed pt-2">
              <p className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 leading-relaxed border-l-3 border-blue-600 pl-3.5 py-1 bg-blue-50/30 dark:bg-blue-950/20 rounded-r-lg">
                Modul ini menyajikan panduan mendalam dan studi kasus teknis mengenai <b>{lesson.title}</b> dalam standar kurikulum {course.partner}.
              </p>

              {lesson.contentBlocks && lesson.contentBlocks.length > 0 ? (
                lesson.contentBlocks.map((block) => (
                  <div key={block.id} className="space-y-2">
                    {block.type === "text" && (
                      <FormattedTextBlock content={block.content} />
                    )}
                    {block.type === "code" && (
                      <CodeBlock code={block.content} language={block.language || "code"} />
                    )}
                  </div>
                ))
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700 space-y-3">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      Ringkasan Materi & Panduan Pembelajaran
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      Dalam sesi ini, Anda mempelajari arsitektur dasar, standar best-practice, serta analisis studi kasus yang sering diujikan pada tes seleksi kerja dan implementasi industri.
                    </p>
                  </div>
                </div>
              )}

              {/* Transcript if available */}
              {lesson.transcript && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 mt-4">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Transkrip & Catatan Instruktur
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic leading-relaxed">
                    {lesson.transcript}
                  </p>
                </div>
              )}
            </div>

            {/* References / Sources */}
            {lesson.sources && lesson.sources.length > 0 && (
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white">
                    Referensi & Sumber Acuan
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {lesson.sources.map((source, idx) => (
                    <a
                      key={idx}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-2.5 p-2.5 bg-slate-50 hover:bg-blue-50/40 dark:bg-slate-800/40 dark:hover:bg-blue-950/20 border border-slate-200/60 hover:border-blue-200 dark:border-slate-700 dark:hover:border-blue-800 rounded-xl transition-all group"
                    >
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg shrink-0 group-hover:scale-105 transition-transform">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {source.title}
                        </h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <span>Buka referensi</span>
                          <ChevronRight className="w-2.5 h-2.5" />
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Lesson Navigation Bottom Action Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3.5">
            {/* Prev Lesson Button */}
            <Button
              variant="secondary"
              size="md"
              disabled={isFirstLesson}
              onClick={handlePrevLesson}
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              {prevLesson ? `Sebelumnya: ${prevLesson.title.slice(0, 16)}...` : "Sesi Pertama"}
            </Button>

            {/* Next / Complete Action */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
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
        </div>
      </div>

      {/* SLIDE-OUT / COLLAPSIBLE NOTES DRAWER */}
      {showNotesDrawer && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center sm:justify-end p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full h-[520px] p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                  <StickyNote className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Catatan Personal</span>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[220px]">
                    {lesson.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNotesDrawer(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Tutup catatan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea aria-label="Input field"
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Tulis ringkasan rumus atau catatan penting sesi ini..."
              className="flex-1 w-full p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium leading-relaxed"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(`skillora_note_${course.id}_${lesson.id}`);
                  setNoteContent("");
                  if (showToast) showToast("Catatan dihapus", "info");
                }}
                className="text-xs text-rose-500 hover:underline font-bold cursor-pointer"
              >
                Hapus
              </button>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowNotesDrawer(false)}
                >
                  Tutup
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleSaveNote();
                    setShowNotesDrawer(false);
                  }}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  Simpan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE SYLLABUS DRAWER */}
      {showMobileSidebar && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-start p-3 animate-in fade-in duration-200 lg:hidden">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full h-[85vh] p-4 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">Silabus Kursus</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileSidebar(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Tutup silabus"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modules List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {modules.map((mod) => (
                <div key={mod.id} className="rounded-xl border border-slate-100 dark:border-slate-800/80 overflow-hidden">
                  <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300">
                    Modul {mod.moduleNumber}: {mod.title.replace(/^Modul \d+:\s*/, "")}
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
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
                          className={`w-full text-left p-2.5 text-xs flex items-center gap-2.5 transition-all ${
                            isActive
                              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border-l-3 border-blue-600"
                              : lesCompleted
                              ? "text-slate-600 dark:text-slate-300 font-medium"
                              : lesLocked
                              ? "text-slate-400 opacity-60 cursor-not-allowed"
                              : "text-slate-700 dark:text-slate-300 font-medium"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs font-bold ${
                            lesCompleted
                              ? "bg-emerald-500 text-white"
                              : isActive
                              ? "bg-blue-600 text-white shadow-2xs"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          }`}>
                            {lesCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : indexInCourse + 1}
                          </div>
                          <span className="truncate flex-1">{les.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              fullWidth
              onClick={() => setShowMobileSidebar(false)}
            >
              Tutup Silabus
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}

export default MateriView;
