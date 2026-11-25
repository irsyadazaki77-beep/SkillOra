import React, { useEffect, useState, useMemo } from "react";
import {
  RotateCcw,
  Eye,
  Lightbulb,
  CheckCircle2,
  Layers,
  Clock,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { FlashcardQueueItem, Profile } from "../../types";
import { trainingApi } from "../../api/apiClient";

interface FlashcardDeckPanelProps {
  courseId?: string;
  onProfileUpdate?: (profile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
  compact?: boolean;
}

export function FlashcardDeckPanel({
  courseId,
  onProfileUpdate,
  showToast,
  compact = false,
}: FlashcardDeckPanelProps) {
  const [cards, setCards] = useState<FlashcardQueueItem[]>([]);
  const [stats, setStats] = useState({ totalCount: 0, dueCount: 0, masteredCount: 0 });
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"due" | "all">("due");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewedTodayCount, setReviewedTodayCount] = useState(0);

  const loadDeck = async () => {
    try {
      setLoading(true);
      const res = await trainingApi.getFlashcardQueue(courseId);
      setCards(res.cards || []);
      setStats({
        totalCount: res.totalCount || 0,
        dueCount: res.dueCount || 0,
        masteredCount: res.masteredCount || 0,
      });
      setCurrentIndex(0);
      setFlipped(false);
      setShowHint(false);
    } catch (err: any) {
      showToast?.(err?.message || "Gagal memuat dek flashcard.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeck();
  }, [courseId]);

  const activeDeck = useMemo(() => {
    const due = cards.filter((c) => c.isDue);
    if (filterMode === "due" && due.length > 0) return due;
    return cards;
  }, [cards, filterMode]);

  const currentCard = activeDeck[currentIndex] || null;

  const handleRate = async (quality: "again" | "hard" | "good" | "easy") => {
    if (!currentCard || submitting) return;
    setSubmitting(true);
    try {
      const res = await trainingApi.reviewFlashcard({
        courseId: currentCard.courseId,
        lessonId: currentCard.lessonId,
        cardId: currentCard.cardId,
        quality,
      });

      if (res.profile && onProfileUpdate) {
        onProfileUpdate(res.profile);
      }

      setReviewedTodayCount((n) => n + 1);
      setCards((prev) =>
        prev.map((item) =>
          item.cardId === currentCard.cardId && item.courseId === currentCard.courseId
            ? {
                ...item,
                easeFactor: res.easeFactor,
                intervalDays: res.intervalDays,
                repetitions: res.repetitions,
                lastQuality: res.lastQuality,
                nextReviewAt: res.nextReviewAt,
                isDue: quality === "again",
              }
            : item
        )
      );

      setStats((s) => ({
        ...s,
        dueCount: quality === "again" ? s.dueCount : Math.max(0, s.dueCount - 1),
        masteredCount:
          res.repetitions >= 2 && res.intervalDays >= 3
            ? Math.min(s.totalCount, s.masteredCount + 1)
            : s.masteredCount,
      }));

      setFlipped(false);
      setShowHint(false);
      setCurrentIndex((idx) => (idx + 1 < activeDeck.length ? idx + 1 : 0));

      const nextLabel =
        quality === "again"
          ? "Diulang 10 menit lagi"
          : `Dijadwalkan ${res.intervalDays} hari lagi (+${res.earnedXp} XP)`;
      showToast?.(nextLabel, "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal menyimpan progres flashcard.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-4">
        <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
        <div className="h-44 w-full bg-zinc-100 dark:bg-zinc-800/70 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-center space-y-2">
        <Layers className="w-7 h-7 mx-auto text-zinc-400" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
          Belum Ada Kartu Flashcard Tersedia
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          Pelajari modul kursus terlebih dahulu untuk membuka dek flashcard konsep inti.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-mono tabular-nums">
            <span>Spaced Repetition SM-2</span>
            <span aria-hidden="true">·</span>
            <span>{stats.dueCount} jatuh tempo</span>
            <span aria-hidden="true">·</span>
            <span>
              {stats.masteredCount}/{stats.totalCount} dikuasai
            </span>
          </div>
          <h3 className="text-base font-bold font-display text-zinc-950 dark:text-white mt-0.5">
            {courseId ? "Flashcard Konsep Kunci Pelatihan" : "Antrean Flashcard Harian Lintas Pelatihan"}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => {
                setFilterMode("due");
                setCurrentIndex(0);
                setFlipped(false);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filterMode === "due"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Jatuh Tempo ({stats.dueCount})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterMode("all");
                setCurrentIndex(0);
                setFlipped(false);
              }}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filterMode === "all"
                  ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Semua ({cards.length})
            </button>
          </div>
          <button
            type="button"
            onClick={loadDeck}
            className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Muat ulang dek"
            aria-label="Muat ulang dek flashcard"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Card Stage */}
      {currentCard && (
        <div className={compact ? "p-4 space-y-4" : "p-6 space-y-5"}>
          {/* Metadata row (Zero-Pill discipline) */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[260px]">
                {currentCard.courseTitle}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate max-w-[200px]">
                {currentCard.competencyTag || currentCard.lessonTitle}
              </span>
            </div>
            <div className="font-mono tabular-nums shrink-0">
              Kartu {currentIndex + 1} / {activeDeck.length}
              {reviewedTodayCount > 0 ? ` · ${reviewedTodayCount} ditinjau sesi ini` : ""}
            </div>
          </div>

          {/* Interactive Flashcard Surface */}
          <div
            onClick={() => setFlipped((f) => !f)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                setFlipped((f) => !f);
              }
            }}
            className={`w-full text-left rounded-xl border transition-all duration-150 cursor-pointer select-none ${
              flipped
                ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/60 hover:border-zinc-300 dark:hover:border-zinc-700"
            } ${compact ? "p-5 min-h-[180px]" : "p-7 min-h-[220px]"} flex flex-col justify-between gap-4`}
          >
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                {flipped ? "Jawaban & Penjelasan Inti" : "Pertanyaan / Konsep Kunci"}
              </span>
              <span className="inline-flex items-center gap-1 text-zinc-400">
                <Eye className="w-3.5 h-3.5" />
                {flipped ? "Klik untuk kembali ke pertanyaan" : "Klik atau tekan Spasi untuk balik"}
              </span>
            </div>

            <div className="my-auto py-2">
              {!flipped ? (
                <p className="text-base sm:text-lg font-semibold text-zinc-950 dark:text-white leading-relaxed">
                  {currentCard.front}
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-100 leading-relaxed whitespace-pre-line">
                    {currentCard.back}
                  </p>
                </div>
              )}
            </div>

            {!flipped && currentCard.hint && (
              <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between gap-2">
                {showHint ? (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Petunjuk: {currentCard.hint}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowHint(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    Tampilkan petunjuk
                  </button>
                )}
                {currentCard.intervalDays > 0 && (
                  <span className="text-[11px] font-mono tabular-nums text-zinc-400 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Interval: {currentCard.intervalDays}h
                  </span>
                )}
              </div>
            )}
          </div>

          {/* SM-2 Rating Controls */}
          {flipped ? (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                Seberapa lancar Anda mengingat konsep ini? Pilih untuk menjadwalkan pengulangan berikutnya:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleRate("again")}
                  className="px-3 py-2.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer flex flex-col items-center gap-0.5"
                >
                  <span>Ulangi</span>
                  <span className="text-[11px] font-mono opacity-80">10 menit</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleRate("hard")}
                  className="px-3 py-2.5 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-colors cursor-pointer flex flex-col items-center gap-0.5"
                >
                  <span>Sulit</span>
                  <span className="text-[11px] font-mono opacity-80">1 hari</span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleRate("good")}
                  className="px-3 py-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold transition-colors cursor-pointer flex flex-col items-center gap-0.5"
                >
                  <span>Paham</span>
                  <span className="text-[11px] font-mono opacity-80">
                    {currentCard.repetitions === 0 ? "1 hari" : currentCard.repetitions === 1 ? "3 hari" : `${Math.max(4, Math.round(currentCard.intervalDays * 2.5))} hari`}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleRate("easy")}
                  className="px-3 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-semibold transition-colors cursor-pointer flex flex-col items-center gap-0.5"
                >
                  <span>Mudah</span>
                  <span className="text-[11px] font-mono opacity-80">4+ hari</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setFlipped(false);
                  setShowHint(false);
                  setCurrentIndex((i) => (i + 1 < activeDeck.length ? i + 1 : 0));
                }}
                className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer"
              >
                Lewati kartu <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setFlipped(true)}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              >
                Lihat Jawaban
              </button>
            </div>
          )}

          {stats.dueCount === 0 && (
            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Semua kartu jatuh tempo hari ini sudah selesai ditinjau. Anda tetap bisa melatih ulang semua kartu.
              </span>
              <button
                type="button"
                onClick={() => {
                  setFilterMode("all");
                  setCurrentIndex(0);
                }}
                className="inline-flex items-center gap-1 font-semibold underline cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Ulas Semua
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
