import React from "react";
import { GraduationCap, FileText, Calculator } from "lucide-react";
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
  setShowCalculator,
}: BelajarHeaderProps) {
  const firstName = profile.name ? profile.name.split(" ")[0] : "Siswa";

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 sm:pb-5 border-b border-zinc-200/80 dark:border-zinc-800/80">
      <div className="space-y-1.5 min-w-0 max-w-2xl">
        <div className="inline-flex items-center">
          <Badge variant="primary" size="sm" icon={<GraduationCap className="w-3.5 h-3.5" />}>
            Pusat Belajar &amp; Karier
          </Badge>
        </div>

        <h1 className="font-display font-bold text-xl sm:text-2xl lg:text-3xl tracking-tight text-zinc-950 dark:text-white leading-tight">
          Selamat datang kembali, {firstName}
        </h1>

        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
          {activeCourseTitle ? (
            <span>
              Lanjutkan progres belajarmu di{" "}
              <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">{activeCourseTitle}</strong>.
            </span>
          ) : (
            <span>Pilih modul pembelajaran untuk mulai membangun portofolio keahlianmu.</span>
          )}
        </p>
      </div>

      {/* Right Utility Actions */}
      <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1 md:pt-0">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAutoCvModal(true)}
          leftIcon={<FileText className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />}
        >
          Auto-CV ATS
        </Button>

        <Button
          variant={showCalculator ? "subtle" : "ghost"}
          size="sm"
          onClick={() => setShowCalculator((prev) => !prev)}
          leftIcon={<Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
        >
          {showCalculator ? "Tutup Kalkulator" : "Kalkulator Gaji"}
        </Button>
      </div>
    </header>
  );
}
