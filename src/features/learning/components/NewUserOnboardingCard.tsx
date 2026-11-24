import React from "react";
import { Compass, Sparkles, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { Course } from "../../../types";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import defaultCourseImg from "../../../assets/images/course_tech_engineering_1794974031663.jpg";

interface NewUserOnboardingCardProps {
  userName: string;
  courses: Course[];
  onSelectCourse: (courseId: string) => void;
  onNavigateToKatalog: () => void;
}

export function NewUserOnboardingCard({
  userName,
  courses,
  onSelectCourse,
  onNavigateToKatalog
}: NewUserOnboardingCardProps) {
  // Select top 3 popular introductory courses
  const starterCourses = courses.slice(0, 3);

  return (
    <Card 
      variant="default" 
      padding="md" 
      className="border-emerald-200/80 dark:border-emerald-800/50 bg-gradient-to-b from-emerald-50/30 via-white to-white dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 space-y-5"
    >
      <div className="space-y-2">
        <div className="inline-flex items-center">
          <Badge variant="primary" size="sm" icon={<Sparkles className="w-3.5 h-3.5" />}>
            Mulai Perjalanan Belajarmu
          </Badge>
        </div>

        <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
          Selamat datang di Skillora, {userName || "Siswa"}! 👋
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
          Platform pembelajaran terarah untuk membangun keahlian industri, mengasah portofolio nyata, dan mempersiapkan karir profesional impianmu.
        </p>
      </div>

      <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Pilih Kursus Pertama untuk Memulai</span>
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToKatalog}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            Lihat Semua di Katalog
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {starterCourses.map(course => (
            <div
              key={course.id}
              onClick={() => onSelectCourse(course.id)}
              className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="h-24 rounded-lg overflow-hidden relative bg-slate-200 dark:bg-slate-800">
                  <img
                    src={course.image || defaultCourseImg}
                    alt={course.title}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = defaultCourseImg;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-xs font-bold">
                    {course.category}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {course.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {course.lessons?.length || 0} Materi &bull; {course.difficulty || "Pemula"}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 mt-2 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Mulai Belajar <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
