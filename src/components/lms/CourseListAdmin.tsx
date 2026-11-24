import { Plus, Pencil, Trash2, ChevronRight, BookOpen, Layers } from "lucide-react";
import { Course } from "../../types";

interface CourseListAdminProps {
  courses: Course[];
  onSelectCourse: (course: Course) => void;
  onNewCourse: () => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
}

export function CourseListAdmin({
  courses,
  onSelectCourse,
  onNewCourse,
  onEditCourse,
  onDeleteCourse
}: CourseListAdminProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-3xl shadow-xl">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold">
            <Layers className="w-3.5 h-3.5" />
            Manajemen Kurikulum & Modul LMS
          </span>
          <h2 className="text-2xl font-black mt-2">Kelola Katalog Kursus</h2>
          <p className="text-xs text-slate-300 mt-1">
            Tambah, sunting, atau atur materi pelajaran dan kuis untuk seluruh kelas di Skillora.
          </p>
        </div>

        <button
          onClick={onNewCourse}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Kursus Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 hover:border-blue-500 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{course.logo}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditCourse(course)}
                    className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteCourse(course.id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{course.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mitra: {course.partner}</p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span>{course.lessons.length} Modul Pelajaran</span>
              </div>
            </div>

            <button
              onClick={() => onSelectCourse(course)}
              className="w-full py-2.5 bg-slate-100 dark:bg-slate-700/60 hover:bg-blue-600 hover:text-white text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>Kelola Modul Pelajaran</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
