import { useState } from "react";
import { Award, RotateCcw, ArrowRight, CheckCircle2, XCircle, BookOpen, Sparkles, Compass } from "lucide-react";
import { Course } from "../../types";

interface QuizResultViewProps {
  score: number;
  xpEarned: number;
  totalQuestions: number;
  answersHistory: {
    questionIndex: number;
    questionText: string;
    selectedOption: number;
    correctOption: number;
    isCorrect: boolean;
    explanation: string;
    options: string[];
    competencyTag?: string;
  }[];
  course?: Course;
  onRestart: () => void;
  onNextLesson?: () => void;
  onClose: () => void;
}

export function QuizResultView({
  score,
  xpEarned,
  totalQuestions,
  answersHistory,
  course,
  onRestart,
  onNextLesson,
  onClose
}: QuizResultViewProps) {
  const isPassed = score >= 60;
  const [filterTab, setFilterTab] = useState<"all" | "wrong" | "correct">("all");

  const wrongAnswers = answersHistory.filter(h => !h.isCorrect);

  const filteredHistory = answersHistory.filter(h => {
    if (filterTab === "wrong") return !h.isCorrect;
    if (filterTab === "correct") return h.isCorrect;
    return true;
  });

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6 text-center overflow-y-auto max-h-[85vh]">
      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-lg transition-transform hover:scale-105 ${
        isPassed ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400" : "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400"
      }`}>
        <Award className="w-10 h-10" />
      </div>

      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          {isPassed ? "Kuis Berhasil Diselesaikan! 🏆" : "Belum Berhasil, Coba Lagi! 💡"}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isPassed ? "Pemahaman kamu sangat luar biasa! Lanjutkan konsistensi ini." : "Tinjau kembali penjelasan soal dan rekomendasi materi untuk memperbaiki pemahaman."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
        <div>
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Skor Akhir</span>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{score}%</div>
        </div>
        <div>
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Reward Perolehan</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">+{xpEarned} XP</div>
        </div>
      </div>

      {/* Answer Review Section */}
      {answersHistory.length > 0 && (
        <div className="text-left space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">Review Jawaban Soal:</h4>
            
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFilterTab("all")}
                className={`px-2.5 py-1 rounded-lg transition-all ${filterTab === "all" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-500"}`}
              >
                Semua ({answersHistory.length})
              </button>
              <button
                onClick={() => setFilterTab("wrong")}
                className={`px-2.5 py-1 rounded-lg transition-all ${filterTab === "wrong" ? "bg-red-500 text-white shadow-sm" : "text-slate-500"}`}
              >
                Salah ({wrongAnswers.length})
              </button>
              <button
                onClick={() => setFilterTab("correct")}
                className={`px-2.5 py-1 rounded-lg transition-all ${filterTab === "correct" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500"}`}
              >
                Benar ({answersHistory.length - wrongAnswers.length})
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {filteredHistory.map((item, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-2xl border text-xs space-y-1.5 transition-all ${
                  item.isCorrect
                    ? "bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50"
                    : "bg-red-50/50 dark:bg-red-950/30 border-red-200 dark:border-red-800/50"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>Soal {item.questionIndex + 1}: {item.questionText}</span>
                  </div>
                  {item.competencyTag && (
                    <span className="text-xs text-slate-400 font-semibold px-2 py-0.5 rounded bg-white/60 dark:bg-black/30 border border-slate-200 dark:border-slate-800">
                      #{item.competencyTag}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 pl-6">
                  Jawaban Kamu: <strong>{item.options[item.selectedOption] || "Tidak Dijawab"}</strong>
                </p>

                {!item.isCorrect && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 pl-6 font-bold">
                    🔑 Kunci Jawaban: {item.options[item.correctOption]}
                  </p>
                )}

                {item.explanation && (
                  <div className="text-xs text-slate-600 dark:text-slate-300 pl-6 pt-1 leading-relaxed bg-white/60 dark:bg-black/30 p-2.5 rounded-xl border border-current/10 space-y-1">
                    {String(item.explanation)
                      .split(" | ")
                      .map((part, pIdx) => (
                        <p key={pIdx}>
                          {pIdx === 0 ? (
                            <>
                              <strong>Pembahasan:</strong> {part}
                            </>
                          ) : (
                            part
                          )}
                        </p>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Material Recommendation based on Wrong Answers */}
      {wrongAnswers.length > 0 && (
        <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 text-left space-y-3">
          <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-200">
            <Compass className="w-4 h-4 text-amber-600" />
            <span>💡 Rekomendasi Pelajari Ulang Dari Jawaban Salah ({wrongAnswers.length} Soal):</span>
          </div>

          <div className="space-y-2">
            {wrongAnswers.slice(0, 3).map((wa, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between text-xs">
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">{wa.competencyTag || course?.title || "Konsep Dasar"}</h5>
                  <p className="text-xs text-slate-500 line-clamp-1">{wa.questionText}</p>
                </div>
                <button
                  onClick={onRestart}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>Review</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={onRestart}
          className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Ulangi Kuis</span>
        </button>

        {onNextLesson && isPassed && (
          <button
            onClick={onNextLesson}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
          >
            <span>Materi Selanjutnya</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onClose}
          className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer transition-all active:scale-95"
        >
          Selesai
        </button>
      </div>
    </div>
  );
}
