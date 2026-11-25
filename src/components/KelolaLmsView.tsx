import { useState } from "react";
import { Course } from "../types";
import { CourseListAdmin } from "./lms/CourseListAdmin";
import { ArrowLeft, Plus, Pencil, Save, X, BookOpen, Award, TrendingUp, Sparkles, Layers } from "lucide-react";
import { motion } from "motion/react";
import { courseApi } from "../api/apiClient";
import techCourseImg from "../assets/images/course_tech_engineering_1794974031663.jpg";

interface KelolaLmsViewProps {
  courses: Course[];
  onCoursesUpdated: (updatedCourses: Course[]) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

export function KelolaLmsView({ courses, onCoursesUpdated, showToast }: KelolaLmsViewProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  // Course Form States
  const [courseTitle, setCourseTitle] = useState("");
  const [partner, setPartner] = useState("");
  const [category, setCategory] = useState("Teknologi & Data");
  const [difficulty, setDifficulty] = useState<"Pemula" | "Menengah" | "Lanjutan">("Pemula");
  const [duration, setDuration] = useState("4 Minggu");
  const [xpReward, setXpReward] = useState("500");
  const [description, setDescription] = useState("");
  const [courseStatus, setCourseStatus] = useState<"published" | "draft">("published");

  // Lesson Module Form Inside Course Editor
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonXp, setNewLessonXp] = useState("50");
  const [newLessonVideoUrl, setNewLessonVideoUrl] = useState("");
  const [newLessonContent, setNewLessonContent] = useState("");

  const refreshFromDb = async () => {
    try {
      const fresh = await courseApi.getLmsCourses();
      onCoursesUpdated(fresh);
      if (selectedCourse) {
        const match = fresh.find((c) => c.id === selectedCourse.id);
        if (match) setSelectedCourse(match);
      }
    } catch {
      const freshPublic = await courseApi.getCourses();
      onCoursesUpdated(freshPublic);
    }
  };

  const handleOpenCourseForm = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseTitle(course.title);
      setPartner(course.partner);
      setCategory(course.category || "Teknologi & Data");
      setDifficulty(course.difficulty || "Pemula");
      setDuration(course.duration || "4 Minggu");
      setXpReward(String(course.xpReward || 500));
      setDescription(course.description || "");
      setCourseStatus(course.status === "draft" ? "draft" : "published");
    } else {
      setEditingCourse(null);
      setCourseTitle("");
      setPartner("Skillora Academy");
      setCategory("Teknologi & Data");
      setDifficulty("Pemula");
      setDuration("4 Minggu");
      setXpReward("500");
      setDescription("");
      setCourseStatus("published");
    }
    setShowCourseForm(true);
  };

  const handleSaveCourse = async () => {
    if (!courseTitle.trim()) {
      showToast("Judul kursus wajib diisi", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingCourse) {
        await courseApi.updateCourse(editingCourse.id, {
          title: courseTitle.trim(),
          partner: partner.trim() || "Skillora Academy",
          category,
          difficulty,
          duration: duration.trim() || "4 Minggu",
          xpReward: Number(xpReward) || 500,
          description: description.trim() || editingCourse.description,
          status: courseStatus,
        });
        showToast("Kursus berhasil diperbarui di database PostgreSQL.", "success");
      } else {
        await courseApi.createCourse({
          title: courseTitle.trim(),
          category,
          difficulty,
          logo: "🎓",
          image: techCourseImg,
          duration: duration.trim() || "4 Minggu",
          partner: partner.trim() || "Skillora Academy",
          xpReward: Number(xpReward) || 500,
          description:
            description.trim() ||
            `Kurikulum terstruktur ${courseTitle.trim()} lengkap dengan studi kasus industri dan sertifikat proyek.`,
          skills: [category, "Problem Solving"],
          status: courseStatus,
        });
        showToast("Kursus baru berhasil disimpan ke PostgreSQL!", "success");
      }
      await refreshFromDb();
      setShowCourseForm(false);
    } catch (err: any) {
      showToast(err?.message || "Gagal menyimpan kursus. Pastikan akun Anda berstatus Mentor/Admin.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLesson = async () => {
    if (!selectedCourse || !newLessonTitle.trim()) return;
    setSaving(true);
    try {
      await courseApi.addLesson(selectedCourse.id, {
        title: newLessonTitle.trim(),
        xp: Number(newLessonXp) || 50,
        estimatedMinutes: 20,
        videoUrl: newLessonVideoUrl.trim() || undefined,
        contentMarkdown:
          newLessonContent.trim() ||
          `### ${newLessonTitle.trim()}\n\nPelajari konsep inti serta implementasi praktis pada modul ${newLessonTitle.trim()}.`,
      });
      setNewLessonTitle("");
      setNewLessonVideoUrl("");
      setNewLessonContent("");
      await refreshFromDb();
      showToast(`Modul "${newLessonTitle}" berhasil ditambahkan ke PostgreSQL!`, "success");
    } catch (err: any) {
      showToast(err?.message || "Gagal menambahkan modul.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await courseApi.deleteCourse(courseId);
      await refreshFromDb();
      showToast("Kursus berhasil dihapus dari katalog.", "info");
    } catch (err: any) {
      showToast(err?.message || "Gagal menghapus kursus.", "error");
    }
  };

  const totalLessons = courses.reduce((sum, c) => sum + (c.lessons?.length || 0), 0);
  const totalXpPool = courses.reduce((sum, c) => sum + (c.xpReward || 0), 0);
  const partnerCount = new Set(courses.map((c) => c.partner)).size;

  return (
    <div className="max-w-7xl mx-auto space-y-6 py-2 font-sans">
      {/* Overview Analytics Cards (Derived from live PostgreSQL courses) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Kursus</p>
            <p className="text-2xl font-display font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{courses.length}</p>
          </div>
          <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Modul</p>
            <p className="text-2xl font-display font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{totalLessons}</p>
          </div>
          <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mitra Penerbit</p>
            <p className="text-2xl font-display font-bold text-slate-900 dark:text-white mt-1 tabular-nums">{partnerCount}</p>
          </div>
          <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total XP Kurikulum</p>
            <p className="text-2xl font-display font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {totalXpPool.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="w-11 h-11 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {!selectedCourse ? (
        <>
          <CourseListAdmin
            courses={courses}
            onSelectCourse={setSelectedCourse}
            onNewCourse={() => handleOpenCourseForm()}
            onEditCourse={handleOpenCourseForm}
            onDeleteCourse={handleDeleteCourse}
          />

          {showCourseForm && (
            <div role="dialog" aria-modal="true" className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{editingCourse ? "Edit Detail Kursus" : "Terbitkan Kursus Baru"}</span>
                  </h3>
                  <button onClick={() => setShowCourseForm(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Judul Kursus *</label>
                    <input
                      type="text"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="Contoh: Arsitektur Microservices dengan Node.js & PostgreSQL"
                      className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Deskripsi Kurikulum</label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ringkasan capaian kompetensi kursus..."
                      className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300">Mitra Industri</label>
                      <input
                        type="text"
                        value={partner}
                        onChange={(e) => setPartner(e.target.value)}
                        placeholder="Skillora Academy"
                        className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300">Kategori</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="Teknologi & Data">Teknologi & Data</option>
                        <option value="Pengembangan Karir">Pengembangan Karir</option>
                        <option value="AI & Machine Learning">AI & Machine Learning</option>
                        <option value="Persiapan BUMN & CPNS">Persiapan BUMN & CPNS</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300">Tingkat</label>
                      <select
                        value={difficulty}
                        onChange={(e: any) => setDifficulty(e.target.value)}
                        className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="Pemula">Pemula</option>
                        <option value="Menengah">Menengah</option>
                        <option value="Lanjutan">Lanjutan</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300">Durasi</label>
                      <input
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300">Reward XP</label>
                      <input
                        type="number"
                        value={xpReward}
                        onChange={(e) => setXpReward(e.target.value)}
                        className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300">Status Publikasi</label>
                    <select
                      value={courseStatus}
                      onChange={(e: any) => setCourseStatus(e.target.value)}
                      className="w-full mt-1 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option value="published">Published (Tampil di Katalog)</option>
                      <option value="draft">Draft (Internal Mentor)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowCourseForm(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    disabled={saving}
                    onClick={handleSaveCourse}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{saving ? "Menyimpan..." : "Simpan ke PostgreSQL"}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedCourse(null)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Kursus</span>
          </button>

          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg">
                  {selectedCourse.partner}
                </span>
                <h2 className="font-display font-bold text-xl text-slate-900 dark:text-white mt-2">{selectedCourse.title}</h2>
                <p className="text-xs text-slate-500 mt-1 tabular-nums">
                  {selectedCourse.lessons.length} Modul Pembelajaran Terdaftar
                </p>
              </div>

              <button
                onClick={() => handleOpenCourseForm(selectedCourse)}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Detail
              </button>
            </div>

            {/* Lesson Module Builder */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" /> Tambah Modul Pelajaran Baru
              </h3>

              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    placeholder="Judul modul baru (misal: Optimasi Query PostgreSQL & Indexing)..."
                    className="flex-1 p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                  />
                  <input
                    type="number"
                    value={newLessonXp}
                    onChange={(e) => setNewLessonXp(e.target.value)}
                    placeholder="XP"
                    className="w-24 p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-900 dark:text-white"
                  />
                  <button
                    disabled={saving || !newLessonTitle.trim()}
                    onClick={handleAddLesson}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{saving ? "Menambah..." : "Tambah Modul"}</span>
                  </button>
                </div>

                <input
                  type="url"
                  value={newLessonVideoUrl}
                  onChange={(e) => setNewLessonVideoUrl(e.target.value)}
                  placeholder="URL Video YouTube / Vimeo / .mp4 opsional (misal: https://youtu.be/...)"
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white"
                />

                <textarea
                  rows={2}
                  value={newLessonContent}
                  onChange={(e) => setNewLessonContent(e.target.value)}
                  placeholder="Ringkasan materi Markdown opsional (mendukung # Heading, ```kode```, tabel, daftar)..."
                  className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="space-y-2 pt-2">
                {selectedCourse.lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs font-semibold"
                  >
                    <span className="text-slate-800 dark:text-slate-200">
                      Modul {idx + 1}: {lesson.title}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">+{lesson.xp} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KelolaLmsView;
