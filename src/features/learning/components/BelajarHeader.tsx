import React from "react";
import { FileText, Calculator } from "lucide-react";
import { Profile } from "../../../types";
import { Button } from "../../../components/ui/Button";

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
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-zinc-200/80 dark:border-zinc-800/80">
      <div className="space-y-1 min-w-0 max-w-2xl">
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          Beranda belajar
        </p>
        <h1 className="font-display font-bold text-2xl sm:text-[28px] tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight text-balance">
          Selamat datang kembali, {firstName}
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
          {activeCourseTitle ? (
            <>
              Fokus hari ini:{" "}
              <span className="text-zinc-900 dark:text-zinc-200 font-medium">
                {activeCourseTitle}
              </span>
            </>
          ) : (
            "Pilih jalur pelatihan untuk mulai membangun portofolio keahlian Anda."
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAutoCvModal(true)}
          leftIcon={<FileText className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />}
        >
          Auto-CV ATS
        </Button>

        <Button
          variant={showCalculator ? "subtle" : "ghost"}
          size="sm"
          onClick={() => setShowCalculator((prev) => !prev)}
          leftIcon={<Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
        >
          {showCalculator ? "Tutup Kalkulator" : "Kalkulator Karier"}
        </Button>
      </div>
    </header>
  );
}
