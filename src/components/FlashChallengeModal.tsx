import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface FlashChallengeModalProps {
  activeFlashChallenge: any;
  setActiveFlashChallenge: (challenge: any) => void;
  selectedFlashOption: number | null;
  flashResult: string | null;
  handleAnswerFlashChallenge: (idx: number) => void;
}

export function FlashChallengeModal({
  activeFlashChallenge,
  setActiveFlashChallenge,
  selectedFlashOption,
  flashResult,
  handleAnswerFlashChallenge
}: FlashChallengeModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeFlashChallenge) {
        setActiveFlashChallenge(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFlashChallenge, setActiveFlashChallenge]);

  return (
    <AnimatePresence>
      {activeFlashChallenge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="flash-challenge-title"
          className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white dark:bg-slate-900 border-4 border-amber-400 dark:border-amber-500 max-w-xl w-full p-4 text-center rounded-2xl shadow-xl flex flex-col justify-between space-y-4"
          >
            <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <span className="text-base">⚡</span>
                <span id="flash-challenge-title" className="font-display font-bold text-base uppercase tracking-wide">Tantangan Kilat Karir Harian!</span>
              </div>
              <button
                onClick={() => setActiveFlashChallenge(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-base cursor-pointer p-1"
                aria-label="Tutup dialog tantangan"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 text-left">
              <div className="bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-200 dark:border-amber-800/60 text-[#7E4E00] dark:text-amber-200 p-3 rounded-xl text-base font-bold">
                 Selesaikan kuis harian ini untuk menguji pemahaman konsep industri terapan Anda dan klaim bonus <span className="font-bold">100 XP & 20 Gems</span>!
              </div>
              <h4 className="font-display font-bold text-base text-slate-800 dark:text-slate-100 leading-snug">
                {activeFlashChallenge.question}
              </h4>
              <div className="space-y-2">
                {activeFlashChallenge.options.map((opt: string, idx: number) => {
                  const isSelected = selectedFlashOption === idx;
                  const isCorrect = idx === activeFlashChallenge.correctIdx;
                  let btnStyle = "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/20";
                  if (flashResult) {
                    if (isCorrect) {
                      btnStyle = "bg-emerald-100 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200";
                    } else if (isSelected) {
                      btnStyle = "bg-rose-100 dark:bg-rose-950/60 border-rose-400 dark:border-rose-600 text-rose-800 dark:text-rose-200";
                    }
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerFlashChallenge(idx)}
                      disabled={!!flashResult}
                      className={`w-full text-left p-3.5 rounded-xl border-2 transition-all text-base font-bold flex justify-between items-center ${btnStyle} disabled:cursor-not-allowed cursor-pointer`}
                    >
                      <span>{opt}</span>
                      {flashResult && isCorrect && <span className="text-emerald-600 dark:text-emerald-400">✓ Benar</span>}
                    </button>
                  );
                })}
              </div>
              {flashResult && (
                <div className={`p-3 rounded-xl border text-base font-bold ${
                  flashResult === "LULUS" ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800" : "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800"
                }`}>
                  {flashResult === "LULUS" ? "🎉 Hebat! Kamu lolos tantangan kilat hari ini. Bonus XP & Gems ditambahkan!" : "😢 Maaf, pilihan itu kurang tepat. Coba lagi lain kali!"}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

