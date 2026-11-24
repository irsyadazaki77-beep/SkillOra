import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  Star, 
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
  Sparkles, 
  ShieldCheck,
  Bookmark,
  BookmarkCheck,
  StickyNote,
  X,
  Save,
  Trash2,
  HelpCircle,
  Share2
} from "lucide-react";
import { Course, Profile, Lesson } from "../types";
import { apiClient } from "../api/apiClient";
import { getCourseProgress, getStructuredModules } from "../utils/courseUtils";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { ProgressBar } from "./ui/ProgressBar";

interface DetailKursusViewProps {
  courses: Course[];
  startQuiz: (course: Course, lesson: any) => void;
  profile: Profile;
  onBookmarkToggle: (courseId: string) => void;
  onProfileUpdate?: (profile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

const MOCK_REVIEWS = [
  { user: "Andi S. (Fresh Graduate IT)", rating: 5, date: "2 hari lalu", comment: "Materi sangat praktis untuk persiapan wawancara teknis dan tes tertulis rekrutmen." },
  { user: "Budi P. (Mahasiswa Akhir)", rating: 5, date: "1 minggu lalu", comment: "Soal-soal psikotes & TKD BUMN yang relevan sekali dengan standar tes rekrutmen terkini." },
  { user: "Citra L. (Pelamar BUMN)", rating: 5, date: "2 minggu lalu", comment: "Penjelasan pembahasan soal sangat detail dan membantu memahami pola-pola tes seleksi." }
];

export function DetailKursusView({ 
  courses, 
  startQuiz, 
  profile, 
  onBookmarkToggle,
  onProfileUpdate,
  showToast 
}: DetailKursusViewProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const course = courses.find((c) => c.id === id);

  // Lesson note modal state
  const [activeNoteLesson, setActiveNoteLesson] = useState<Lesson | null>(null);
  const [noteContent, setNoteContent] = useState<string>("");
  const [bookmarkedLessons, setBookmarkedLessons] = useState<string[]>(() => profile?.bookmarkedLessons || []);

  useEffect(() => {
    if (profile?.bookmarkedLessons) {
      setBookmarkedLessons(profile.bookmarkedLessons);
    }
  }, [profile]);

  // Derived progress info
  const progressInfo = useMemo(() => {
    return course ? getCourseProgress(course) : null;
  }, [course]);

  // Structured Modules
  const modules = useMemo(() => {
    return course ? getStructuredModules(course) : [];
  }, [course]);

  if (!course || !progressInfo) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="text-4xl">😞</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kursus Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Modul yang Anda cari mungkin telah dipindahkan atau dalam pembaruan berkala.
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

  const { percentage, completedCount, totalCount, nextLesson, nextLessonIndex, isCompleted } = progressInfo;
  const bookmarkedCourses = profile?.bookmarkedCourses || [];
  const isCourseBookmarked = bookmarkedCourses.includes(course.id);

  // Bookmark lesson toggle
  const handleToggleBookmarkLesson = async (lessonId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSaved = bookmarkedLessons.includes(lessonId);
    const updated = isSaved 
      ? bookmarkedLessons.filter((id) => id !== lessonId)
      : [...bookmarkedLessons, lessonId];
    
    setBookmarkedLessons(updated);
    if (onProfileUpdate) {
      onProfileUpdate({ ...profile, bookmarkedLessons: updated });
    }

    try {
      await apiClient.post("/user/bookmark-lesson", { courseId: course.id, lessonId });
      if (showToast) {
        showToast(isSaved ? "Materi dihapus dari bookmark" : "Materi disimpan ke bookmark 🔖", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Note Handlers
  const handleOpenNoteModal = (lesson: Lesson, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveNoteLesson(lesson);
    const savedNote = localStorage.getItem(`skillora_note_${course.id}_${lesson.id}`) || lesson.notes || "";
    setNoteContent(savedNote);
  };

  const handleSaveNote = () => {
    if (!activeNoteLesson) return;
    localStorage.setItem(`skillora_note_${course.id}_${activeNoteLesson.id}`, noteContent);
    if (showToast) {
      showToast("Catatan materi berhasil disimpan! 📝", "success");
    }
    setActiveNoteLesson(null);
  };

  const handleDeleteNote = () => {
    if (!activeNoteLesson) return;
    localStorage.removeItem(`skillora_note_${course.id}_${activeNoteLesson.id}`);
    setNoteContent("");
    if (showToast) {
      showToast("Catatan materi dihapus", "info");
    }
    setActiveNoteLesson(null);
  };

  const courseDesc = course.description || 
    `Modul pembelajaran interaktif dan bank soal terverifikasi '${course.title}' disusun untuk membantu Anda menguasai kompetensi industri, tes seleksi, dan kesiapan karier praktis.`;

  // Learning Outcomes derived from lessons or skills
  const learningOutcomes = useMemo(() => {
    const list: string[] = [];
    course.lessons?.forEach((l) => {
      if (l.learningObjectives) {
        l.learningObjectives.forEach((obj) => {
          if (!list.includes(obj) && list.length < 5) list.push(obj);
        });
      }
    });
    if (list.length === 0 && course.skills) {
      course.skills.forEach((s) => {
        list.push(`Menguasai prinsip dan aplikasi praktis terkait ${s}`);
      });
    }
    return list.slice(0, 4);
  }, [course]);

  return (
    <div className="animate-in fade-in duration-200 max-w-[1240px] mx-auto w-full pb-16 lg:pb-8 relative z-10 px-3 sm:px-5 pt-2 sm:pt-4 space-y-6">
      
      {/* BREADCRUMB */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-nowrap">
        <Link to="/belajar" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Belajar</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <Link to="/belajar/katalog" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Katalog Kursus</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-xs">{course.title}</span>
      </nav>

      {/* HERO SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
          
          <div className="flex-1 space-y-3.5">
            {/* Badges & Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-2xs shrink-0">
                {course.logo}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="primary" size="sm">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    {course.partner}
                  </Badge>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {course.category}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {course.title}
                </h1>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed max-w-3xl">
              {courseDesc}
            </p>

            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 pt-1">
              <span className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
                <BarChart className="w-3.5 h-3.5 text-slate-400" /> {course.difficulty}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {course.duration}
              </span>
              <span className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-lg font-semibold">
                <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> +{course.xpReward} XP
              </span>
              <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 px-2.5 py-1 rounded-lg font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {totalCount} Sesi Interaktif
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (nextLesson) {
                    navigate(`/belajar/kursus/${course.id}/materi/${nextLesson.id}`);
                  } else if (course.lessons && course.lessons[0]) {
                    navigate(`/belajar/kursus/${course.id}/materi/${course.lessons[0].id}`);
                  }
                }}
                leftIcon={<PlayCircle className="w-4 h-4" />}
              >
                {percentage === 0
                  ? `Mulai Belajar (Sesi 1: ${course.lessons[0]?.title.slice(0, 24)}...)`
                  : percentage === 100
                  ? "Buka Kembali Silabus Materi"
                  : `Lanjutkan Belajar: Sesi ${nextLessonIndex + 1}`}
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  const targetL = nextLesson || course.lessons[0];
                  if (targetL) {
                    navigate(`/belajar/kursus/${course.id}/latihan/${targetL.id}`);
                  }
                }}
                leftIcon={<Target className="w-4 h-4 text-amber-500" />}
              >
                Latihan Soal Kuis
              </Button>

              <button
                type="button"
                onClick={() => onBookmarkToggle(course.id)}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  isCourseBookmarked
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 shadow-2xs"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
                aria-label={isCourseBookmarked ? "Hapus simpanan kursus" : "Simpan kursus"}
              >
                <Heart className={`w-4 h-4 ${isCourseBookmarked ? "fill-rose-500 text-rose-500" : ""}`} />
                <span>{isCourseBookmarked ? "Tersimpan" : "Simpan"}</span>
              </button>
            </div>
          </div>

          {/* PROGRESS & COMPLETION SUMMARY BOX */}
          <div className="w-full lg:w-72 shrink-0 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-4 rounded-2xl space-y-3.5">
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">Progres Belajar</span>
                <span className={percentage === 100 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-blue-600 dark:text-blue-400 font-bold"}>
                  {percentage}% Selesai
                </span>
              </div>
              <ProgressBar
                value={percentage}
                variant={percentage === 100 ? "success" : "primary"}
                size="sm"
              />
            </div>

            <div className="space-y-2 text-xs border-t border-slate-200/60 dark:border-slate-700/60 pt-3">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Materi Selesai</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {completedCount} dari {totalCount} Sesi
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Total Durasi</span>
                <span className="font-bold text-slate-900 dark:text-white">{course.duration}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>Perolehan XP</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {Math.round((percentage / 100) * (course.xpReward || 500))} / {course.xpReward} XP
                </span>
              </div>
            </div>

            {percentage === 100 && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1">
                  <Award className="w-4 h-4" /> Kursus Selesai
                </span>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                  Sertifikat kelulusan telah terbuka di profil Anda.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LEARNING OUTCOMES CARD */}
      {learningOutcomes.length > 0 && (
        <Card variant="default" padding="md" className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Hasil Pembelajaran & Keterampilan yang Dikuasai
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {learningOutcomes.map((outcome, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{outcome}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* CURRICULUM MODULES & SIDEBAR GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* CURRICULUM BREAKDOWN (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Silabus Kurikulum & Modul ({totalCount} Sesi)
              </h2>
            </div>
            <Badge variant="primary" size="sm">
              {completedCount}/{totalCount} Selesai ({percentage}%)
            </Badge>
          </div>

          {/* Structured Module Blocks */}
          <div className="space-y-4">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs"
              >
                {/* Module Header */}
                <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                      Modul {mod.moduleNumber}
                    </span>
                    <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white">
                      {mod.title.replace(/^Modul \d+:\s*/, "")}
                    </h3>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {mod.completedLessonsCount}/{mod.totalLessonsCount} Sesi
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 block">
                      ~{mod.totalMinutes} Menit
                    </span>
                  </div>
                </div>

                {/* Lessons List inside Module */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {mod.lessons.map(({ lesson, indexInCourse, isCompleted: isLesCompleted, isCurrent, isLocked }) => {
                    const qCount = lesson.questions?.length || 0;
                    const isQuiz = qCount > 0;
                    const isLessonSaved = bookmarkedLessons.includes(lesson.id);
                    const hasSavedNote = !!localStorage.getItem(`skillora_note_${course.id}_${lesson.id}`);

                    return (
                      <div
                        key={lesson.id}
                        className={`p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                          isCurrent
                            ? "bg-blue-50/20 dark:bg-blue-950/20"
                            : isLesCompleted
                            ? "bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                            : "bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {/* Step Number or Checkmark */}
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                              isLesCompleted
                                ? "bg-emerald-500 text-white"
                                : isCurrent
                                ? "bg-blue-600 text-white shadow-2xs animate-pulse"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {isLesCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : indexInCourse + 1}
                          </div>

                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              {isLesCompleted ? (
                                <Badge variant="success" size="sm">Selesai</Badge>
                              ) : isCurrent ? (
                                <Badge variant="primary" size="sm">Sedang Berjalan</Badge>
                              ) : isLocked ? (
                                <Badge variant="neutral" size="sm">Terkunci</Badge>
                              ) : (
                                <Badge variant="neutral" size="sm">Belum Mulai</Badge>
                              )}

                              <span className="text-slate-400">&bull;</span>
                              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {lesson.estimatedMinutes || 15} mnt
                              </span>

                              {lesson.xp && (
                                <>
                                  <span className="text-slate-400">&bull;</span>
                                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                    +{lesson.xp} XP
                                  </span>
                                </>
                              )}
                            </div>

                            <h4
                              onClick={() => {
                                if (!isLocked) {
                                  navigate(`/belajar/kursus/${course.id}/materi/${lesson.id}`);
                                }
                              }}
                              className={`font-semibold text-xs sm:text-sm transition-colors truncate ${
                                isLocked
                                  ? "text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                  : "text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                              }`}
                            >
                              Sesi {indexInCourse + 1}: {lesson.title}
                            </h4>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {/* Note button */}
                          <button
                            type="button"
                            onClick={(e) => handleOpenNoteModal(lesson, e)}
                            title="Tulis catatan materi"
                            className={`p-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                              hasSavedNote
                                ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            }`}
                            aria-label="Catatan materi"
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                          </button>

                          {/* Bookmark button */}
                          <button
                            type="button"
                            onClick={(e) => handleToggleBookmarkLesson(lesson.id, e)}
                            title={isLessonSaved ? "Hapus bookmark" : "Simpan materi"}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              isLessonSaved
                                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            }`}
                            aria-label={isLessonSaved ? "Hapus bookmark" : "Simpan materi"}
                          >
                            {isLessonSaved ? (
                              <BookmarkCheck className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            ) : (
                              <Bookmark className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Open Material vs Quiz Buttons */}
                          {!isLocked ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => navigate(`/belajar/kursus/${course.id}/materi/${lesson.id}`)}
                              >
                                Buka Materi
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => navigate(`/belajar/kursus/${course.id}/latihan/${lesson.id}`)}
                              >
                                Kuis
                              </Button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                              <Lock className="w-3 h-3" /> Terkunci
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SIDEBAR (1 Col) */}
        <div className="space-y-4">
          
          {/* USER SAVED NOTES CARD */}
          <Card variant="default" padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                <StickyNote className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Catatan Materi Saya
              </h3>
            </div>
            
            <div className="space-y-2">
              {course.lessons.filter((l) => localStorage.getItem(`skillora_note_${course.id}_${l.id}`)).length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-center">
                  Belum ada catatan. Klik ikon <strong className="text-slate-700 dark:text-slate-200">Catatan</strong> pada sesi materi untuk mencatat rangkuman.
                </p>
              ) : (
                course.lessons.map((lesson) => {
                  const saved = localStorage.getItem(`skillora_note_${course.id}_${lesson.id}`);
                  if (!saved) return null;
                  return (
                    <div key={lesson.id} className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span className="truncate max-w-[160px]">{lesson.title}</span>
                        <button 
                          type="button"
                          onClick={(e) => handleOpenNoteModal(lesson, e)} 
                          className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-xs line-clamp-2 leading-relaxed">{saved}</p>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* SKILLS ACQUIRED */}
          {course.skills && course.skills.length > 0 && (
            <Card variant="default" padding="md" className="space-y-2.5">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                Kompetensi Terkait
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {course.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* RATINGS & REVIEWS */}
          <Card variant="default" padding="md" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                Ulasan Pelajar
              </h3>
              <div className="flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-lg font-bold border border-amber-200/60 dark:border-amber-800">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>4.9</span>
              </div>
            </div>
            <div className="space-y-3">
              {MOCK_REVIEWS.map((r, i) => (
                <div key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0 pb-2.5 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{r.user}</span>
                    <span className="text-xs text-slate-400">{r.date}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mb-1">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug">{r.comment}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* NOTE EDIT MODAL */}
      {activeNoteLesson && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                  <StickyNote className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Catatan Personal</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{activeNoteLesson.title}</h3>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setActiveNoteLesson(null)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Tutup modal catatan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Poin Penting & Ringkasan Materi:
              </label>
              <textarea aria-label="Input field"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Tuliskan rumus, konsep penting, atau catatan ujian..."
                rows={5}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-medium"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleDeleteNote}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Hapus
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveNoteLesson(null)}
                >
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveNote}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Simpan Catatan
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
