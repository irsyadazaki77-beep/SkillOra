import React from "react";
import { motion } from "motion/react";
import {
  Compass,
  ArrowRight,
  Sparkles,
  Zap,
  Flame,
  Gem,
  ArrowUpRight,
} from "lucide-react";
import { features } from "../data/jelajahiMenu";
import { Profile } from "../types";

interface JelajahiViewProps {
  profile: Profile;
  onNavigate: (tab: any) => void;
  onOpenFlashChallenge: () => void;
  onOpenMentorChat: () => void;
}

export function JelajahiView({
  profile,
  onNavigate,
  onOpenFlashChallenge,
  onOpenMentorChat,
}: JelajahiViewProps) {
  return (
    <div className="w-full space-y-6 py-2">
      {/* Clean Adaptive Header (Light & Dark Mode) */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div className="space-y-1.5 max-w-2xl">
          <p className="text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            Jelajahi Semua Fitur · 100% Gratis
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-zinc-950 dark:text-white tracking-tight">
            Semua Alat Belajar &amp; Karier di Satu Tempat
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Pilih fitur yang paling kamu butuhkan hari ini — mulai dari latihan soal, pembuatan CV, simulasi wawancara, sampai info lowongan dan beasiswa.
          </p>
        </div>

        {/* Compact Status Summary */}
        <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">Belajar Beruntun</span>
              <span className="text-sm font-bold font-mono text-zinc-950 dark:text-white tabular-nums">
                {profile.streak || 0} Hari
              </span>
            </div>
          </div>

          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-800" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Gem className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-[11px] text-zinc-500 dark:text-zinc-400">Koin Belajar</span>
              <span className="text-sm font-bold font-mono text-zinc-950 dark:text-white tabular-nums">
                {profile.gems || 0} Gems
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={onOpenFlashChallenge}
          className="group text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/70 p-5 sm:p-6 rounded-2xl transition-colors cursor-pointer flex flex-col justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/70 dark:border-amber-800/50">
              <Zap className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-display font-bold text-zinc-950 dark:text-white">
                Tantangan Kuis Kilat (1 Menit)
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Jawab pertanyaan cepat untuk pemanasan otak sekaligus mengumpulkan tambahan koin belajar.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:gap-2.5 transition-all">
            Mulai Kuis Kilat <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>

        <button
          type="button"
          onClick={onOpenMentorChat}
          className="group text-left bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/70 p-5 sm:p-6 rounded-2xl transition-colors cursor-pointer flex flex-col justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/70 dark:border-emerald-800/50">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-display font-bold text-zinc-950 dark:text-white">
                Tanya Asisten Belajar AI
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Bingung dengan materi, error kode, atau langkah melamar kerja? Tanyakan kapan saja dengan bahasa sehari-hari.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:gap-2.5 transition-all">
            Buka Asisten AI <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>

      {/* Feature Directory Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg sm:text-xl font-display font-bold text-zinc-950 dark:text-white">
            Daftar Fitur Utama
          </h2>
          <span className="text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            {features.length} Menu Tersedia
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.button
                type="button"
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.25) }}
                onClick={() => onNavigate(item.id)}
                className="group text-left flex flex-col justify-between p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/60 transition-colors cursor-pointer h-full"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-display font-bold text-zinc-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  <span>{item.actionLabel}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
