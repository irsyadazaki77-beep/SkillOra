import React from "react";
import { GraduationCap, FileText, Calculator, Flame, Zap } from "lucide-react";
import { Profile } from "../../../types";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";

interface BelajarHeaderProps {
  profile: Profile;
  activeCourseTitle?: string;
  setShowAutoCvModal: (val: boolean) => void;
  showCalculator: boolean;
  setShowCalculator: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export function BelajarHeader({
  profile,
  activeCourseTitle,
  setShowAutoCvModal,
  showCalculator,
  setShowCalculator
}: BelajarHeaderProps) {
  const firstName = profile.name ? profile.name.split(" ")[0] : "Siswa";

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="space-y-1.5 min-w-0 max-w-2xl">
        <div className="inline-flex items-center">
          <Badge variant="primary" size="sm" icon={<GraduationCap className="w-3.5 h-3.5" />}>
            Pusat Belajar & Karir
          </Badge>
        </div>

        <h1 className="font-display font-bold text-xl sm:text-2xl lg:text-3xl tracking-tight text-slate-900 dark:text-white leading-tight">
          Selamat datang kembali, {firstName} 👋
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          {activeCourseTitle ? (
            <span>
              Lanjutkan progress belajarmu di <strong className="text-slate-700 dark:text-slate-200 font-semibold">{activeCourseTitle}</strong>.
            </span>
          ) : (
            <span>Pilih modul pembelajaran untuk mulai membangun portofolio keahlianmu.</span>
          )}
        </p>
      </div>

      {/* Right Utility Actions & Context Badges */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-1 md:pt-0">
        {/* Streak & XP Status Pills */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 text-xs font-semibold">
          <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
            <Flame className="w-3.5 h-3.5 fill-amber-500" />
            <span>{profile.streak || 0} Hari</span>
          </span>
          <span className="w-px h-3.5 bg-slate-200 dark:bg-slate-700" />
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
            <Zap className="w-3.5 h-3.5 fill-emerald-500" />
            <span>{profile.xp || 0} XP</span>
          </span>
        </div>

        {/* Action Buttons */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAutoCvModal(true)}
          leftIcon={<FileText className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />}
        >
          Auto-CV ATS
        </Button>

        <Button
          variant={showCalculator ? "subtle" : "ghost"}
          size="sm"
          onClick={() => setShowCalculator(prev => !prev)}
          leftIcon={<Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
        >
          {showCalculator ? "Tutup Kalkulator" : "Kalkulator Gaji"}
        </Button>
      </div>
    </header>
  );
}
