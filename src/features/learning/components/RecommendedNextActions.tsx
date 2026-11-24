import React from "react";
import { 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Zap, 
  FileCheck, 
  Target,
  BrainCircuit
} from "lucide-react";
import { Course, Lesson, Profile } from "../../../types";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";

interface RecommendedNextActionsProps {
  primaryActiveCourse?: Course;
  activeLesson?: Lesson;
  profile: Profile;
  targetRole: string;
  skillGapPercentage: number;
  onNavigateToLesson: (courseId: string, lessonId: string) => void;
  onNavigateToCourse: (courseId: string) => void;
  onOpenSkillGapModal?: () => void;
  onGetFlashChallenge?: () => void;
  onNavigateToSertifikasi: () => void;
  onNavigateToSimulasi?: () => void;
}

export function RecommendedNextActions({
  primaryActiveCourse,
  activeLesson,
  profile,
  targetRole,
  skillGapPercentage,
  onNavigateToLesson,
  onNavigateToCourse,
  onOpenSkillGapModal,
  onGetFlashChallenge,
  onNavigateToSertifikasi,
  onNavigateToSimulasi,
}: RecommendedNextActionsProps) {
  // Generate contextual actions based on user learning status
  const actions = [];

  // Action 1: Continue next specific lesson or quiz
  if (primaryActiveCourse && activeLesson) {
    const isQuiz = (activeLesson.questions && activeLesson.questions.length > 0) || activeLesson.type === "interactive";
    actions.push({
      id: "continue-lesson",
      icon: isQuiz ? BrainCircuit : Zap,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
      badge: { label: "Prioritas Belajar", variant: "primary" as const },
      title: isQuiz ? `Selesaikan Kuis: ${activeLesson.title}` : `Pelajari Materi: ${activeLesson.title}`,
      description: `Langkah berikutnya di kursus "${primaryActiveCourse.title}" untuk menambah +${activeLesson.xp || 20} XP.`,
      ctaText: isQuiz ? "Mulai Kuis" : "Buka Materi",
      ctaVariant: "primary" as const,
      onClick: () => onNavigateToLesson(primaryActiveCourse.id, activeLesson.id)
    });
  }

  // Action 2: Daily Flash Challenge or Daily Quest if available
  if (onGetFlashChallenge) {
    actions.push({
      id: "flash-challenge",
      icon: Sparkles,
      iconBg: "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400",
      badge: { label: "Tantangan Harian", variant: "warning" as const },
      title: "Asah Pemahaman Kilat Hari Ini",
      description: "Jawab 1 soal acak untuk menjaga konsistensi streak dan klaim bonus +50 XP harian.",
      ctaText: "Mulai Tantangan",
      ctaVariant: "accent" as const,
      onClick: onGetFlashChallenge
    });
  }

  // Action 3: Target Role Readiness or Certification
  if (skillGapPercentage < 100) {
    actions.push({
      id: "career-readiness",
      icon: Target,
      iconBg: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",
      badge: { label: "Kesiapan Karir", variant: "info" as const },
      title: `Optimalkan Skill untuk ${targetRole}`,
      description: `Kesiapan industri kamu saat ini ${skillGapPercentage}%. Cek materi yang perlu dipelajari untuk menutup gap.`,
      ctaText: "Evaluasi Skill",
      ctaVariant: "secondary" as const,
      onClick: onOpenSkillGapModal || (() => onNavigateToCourse(primaryActiveCourse?.id || "1"))
    });
  } else {
    actions.push({
      id: "certification",
      icon: FileCheck,
      iconBg: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400",
      badge: { label: "Sertifikasi", variant: "success" as const },
      title: "Klaim Sertifikat Kompetensi Industri",
      description: "Kamu telah menyelesaikan materi esensial! Ikuti ujian akhir untuk menerbitkan sertifikat terverifikasi.",
      ctaText: "Uji Kompetensi",
      ctaVariant: "secondary" as const,
      onClick: onNavigateToSertifikasi
    });
  }

  // Limit to top 2-3 most relevant actions
  const displayActions = actions.slice(0, 2);

  return (
    <section className="space-y-3" aria-labelledby="next-actions-heading">
      <div className="flex items-center justify-between">
        <div>
          <h2 
            id="next-actions-heading"
            className="font-display font-bold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight"
          >
            Rekomendasi Langkah Berikutnya
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Langkah terarah untuk mempercepat pencapaian target belajarmu hari ini.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {displayActions.map(action => {
          const IconComponent = action.icon;
          return (
            <Card
              key={action.id}
              variant="default"
              padding="sm"
              className="flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${action.iconBg}`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <Badge variant={action.badge.variant} size="sm">
                      {action.badge.label}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-1">
                    {action.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                    {action.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-3">
                <Button
                  variant={action.ctaVariant}
                  size="sm"
                  onClick={action.onClick}
                  className="w-full justify-between"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  {action.ctaText}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
