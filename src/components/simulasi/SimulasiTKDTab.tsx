import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, Flag, RotateCcw, Award } from "lucide-react";
import { TKD_QUESTIONS } from "./simulasiData";
import { playSound } from "../../utils/sound";

interface SimulasiTKDTabProps {
  onAddXp?: (xp: number) => void;
}

export function SimulasiTKDTab({ onAddXp }: SimulasiTKDTabProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let timer: any;
    if (timerActive && timeLeft > 0 && !quizFinished) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 10 && prev > 1) {
            playSound("laser");
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      handleFinish();
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft, quizFinished]);

  const currentQ = TKD_QUESTIONS[currentIdx];

  const handleSelect = (idx: number) => {
    if (quizFinished) return;
    const isCorrect = currentQ.correctIndex === idx;
    if (isCorrect) playSound("correct");
    else playSound("wrong");
    setSelectedAnswers(prev => ({ ...prev, [currentQ.id]: idx }));
  };

  const calculateScore = () => {
    let correct = 0;
    TKD_QUESTIONS.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) correct++;
    });
    return Math.round((correct / TKD_QUESTIONS.length) * 100);
  };

  const handleFinish = () => {
    setQuizFinished(true);
    setTimerActive(false);
    const score = calculateScore();
    if (score >= 70) {
      playSound("levelUp");
      if (onAddXp) onAddXp(250);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setFlagged({});
    setQuizFinished(false);
    setTimeLeft(900);
    setTimerActive(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
            CBT
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Simulasi Tes Kompetensi Dasar (TKD) BUMN</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total {TKD_QUESTIONS.length} Pertanyaan Standard FHCI BUMN</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            timeLeft <= 60 && timerActive
              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 animate-pulse border border-rose-300"
              : "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
          }`}>
            <Clock className={`w-4 h-4 ${timeLeft <= 60 ? "text-rose-600" : "text-amber-500"}`} />
            <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</span>
          </div>

          {!timerActive && !quizFinished && (
            <button
              onClick={() => setTimerActive(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-2xs"
            >
              Mulai Ujian
            </button>
          )}

          {timerActive && !quizFinished && (
            <button
              onClick={handleFinish}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-2xs"
            >
              Selesaikan
            </button>
          )}
        </div>
      </div>

      {!quizFinished ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-6 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg">
                {currentQ.category}
              </span>
              <span>Soal {currentIdx + 1} dari {TKD_QUESTIONS.length}</span>
            </div>

            <div className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
              {currentQ.question}
            </div>

            <div className="space-y-3">
              {currentQ.options.map((opt, i) => {
                const isSelected = selectedAnswers[currentQ.id] === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    className={`w-full text-left p-4 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/60">
              <button
                disabled={currentIdx === 0}
                onClick={() => setCurrentIdx(prev => prev - 1)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 disabled:opacity-40 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Sebaliknya
              </button>

              <button
                onClick={() => setFlagged(prev => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  flagged[currentQ.id] ? "bg-amber-50 text-amber-700 border-amber-300" : "border-slate-200 text-slate-500"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Ragu-ragu</span>
              </button>

              <button
                disabled={currentIdx === TKD_QUESTIONS.length - 1}
                onClick={() => setCurrentIdx(prev => prev + 1)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Selanjutnya
              </button>
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm h-fit">
            <h4 className="font-bold text-xs text-slate-900 dark:text-white">Navigasi Soal</h4>
            <div className="grid grid-cols-5 gap-2">
              {TKD_QUESTIONS.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isCurrent = idx === currentIdx;
                const isFlagged = flagged[q.id];

                let bg = "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400";
                if (isCurrent) bg = "ring-2 ring-blue-600 bg-blue-600 text-white font-black";
                else if (isAnswered) bg = "bg-emerald-500 text-white font-bold";
                else if (isFlagged) bg = "bg-amber-500 text-white font-bold";

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${bg}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-6 max-w-xl mx-auto shadow-md">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/60 rounded-2xl flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-white">Hasil Simulasi CAT BUMN</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Evaluasi resmi berdasarkan jawaban yang diisi.</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-around">
            <div>
              <span className="text-xs text-slate-400 font-medium">Skor Akhir</span>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-400">{calculateScore()}</div>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium">Status</span>
              <div className={`text-base font-black mt-1 ${calculateScore() >= 70 ? "text-emerald-600" : "text-amber-600"}`}>
                {calculateScore() >= 70 ? "Lolos Ambang Batas" : "Perlu Belajar Lagi"}
              </div>
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ulangi Simulasi Kuis</span>
          </button>
        </div>
      )}
    </div>
  );
}
