import { useState, useEffect } from "react";
import { Play, RotateCcw, Flame, Trophy, Activity, Zap } from "lucide-react";
import { playSound } from "../../utils/sound";

interface SimulasiKraepelinTabProps {
  onAddXp?: (xp: number) => void;
}

export function SimulasiKraepelinTab({ onAddXp }: SimulasiKraepelinTabProps) {
  const [kraepelinActive, setKraepelinActive] = useState(false);
  const [kraepelinDuration, setKraepelinDuration] = useState<number>(60);
  const [kraepelinTimeLeft, setKraepelinTimeLeft] = useState(60);
  const [kraepelinScore, setKraepelinScore] = useState(0);
  const [kraepelinTotal, setKraepelinTotal] = useState(0);
  const [numA, setNumA] = useState(7);
  const [numB, setNumB] = useState(5);
  const [userInputMath, setUserInputMath] = useState("");
  const [kraepelinFinished, setKraepelinFinished] = useState(false);
  const [kraepelinPeakSpeed, setKraepelinPeakSpeed] = useState<number>(() => {
    return Number(localStorage.getItem("skillora_kraepelin_peak")) || 0;
  });

  useEffect(() => {
    let kTimer: any;
    if (kraepelinActive && kraepelinTimeLeft > 0) {
      kTimer = setInterval(() => setKraepelinTimeLeft((prev) => prev - 1), 1000);
    } else if (kraepelinTimeLeft === 0 && kraepelinActive) {
      setKraepelinActive(false);
      setKraepelinFinished(true);
      playSound("levelUp");

      const speedDigitsPerMin = Math.round((kraepelinScore / kraepelinDuration) * 60);
      if (speedDigitsPerMin > kraepelinPeakSpeed) {
        setKraepelinPeakSpeed(speedDigitsPerMin);
        localStorage.setItem("skillora_kraepelin_peak", speedDigitsPerMin.toString());
      }

      if (onAddXp && kraepelinScore >= 10) {
        onAddXp(150);
      }
    }
    return () => clearInterval(kTimer);
  }, [kraepelinActive, kraepelinTimeLeft, kraepelinScore, kraepelinDuration, kraepelinPeakSpeed, onAddXp]);

  const generateNewMathPair = () => {
    setNumA(Math.floor(Math.random() * 9) + 1);
    setNumB(Math.floor(Math.random() * 9) + 1);
  };

  const handleStartKraepelin = () => {
    setKraepelinActive(true);
    setKraepelinFinished(false);
    setKraepelinScore(0);
    setKraepelinTotal(0);
    setKraepelinTimeLeft(kraepelinDuration);
    setUserInputMath("");
    generateNewMathPair();
    playSound("click");
  };

  const handleMathInputChange = (val: string) => {
    if (!kraepelinActive) return;
    setUserInputMath(val);

    const targetDigit = (numA + numB) % 10;
    if (val.length >= 1) {
      const enteredNum = parseInt(val.slice(-1), 10);
      setKraepelinTotal((prev) => prev + 1);

      if (enteredNum === targetDigit) {
        setKraepelinScore((prev) => prev + 1);
        playSound("correct");
      } else {
        playSound("wrong");
      }

      setUserInputMath("");
      generateNewMathPair();
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900 text-white rounded-2xl relative overflow-hidden shadow-xl">
        <div className="max-w-2xl relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            <Activity className="w-3.5 h-3.5" />
            Tes Ketahanan Mental & Kecepatan Berpikir
          </span>
          <h2 className="text-2xl font-black">Simulasi Kraepelin & Speed Math BUMN</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Selesaikan penjumlahan dua angka acak secepat mungkin dalam waktu terukur. Ambil hanya satuan angka terakhir dari penjumlahan (Contoh: 7 + 8 = 15, ketik angka <strong className="text-emerald-400">5</strong>).
          </p>
        </div>
      </div>

      {!kraepelinActive && !kraepelinFinished ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-6 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <Flame className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Pilih Durasi Latihan</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Uji konsentrasi dan stabilitas tempo kecepatan berhitung Anda.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[30, 60, 120].map((sec) => (
              <button
                key={sec}
                onClick={() => setKraepelinDuration(sec)}
                className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  kraepelinDuration === sec
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {sec} Detik
              </button>
            ))}
          </div>

          <button
            onClick={handleStartKraepelin}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Mulai Simulasi Kraepelin</span>
          </button>

          {kraepelinPeakSpeed > 0 && (
            <div className="pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Rekor Terbaik Anda: <strong>{kraepelinPeakSpeed} digit/menit</strong></span>
            </div>
          )}
        </div>
      ) : kraepelinActive ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-6 max-w-md mx-auto shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Sisa Waktu: <strong className="text-emerald-600 dark:text-emerald-400 text-base">{kraepelinTimeLeft}s</strong></span>
            <span>Skor: <strong className="text-blue-600 dark:text-blue-400 text-base">{kraepelinScore}</strong></span>
          </div>

          <div className="py-6 px-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="text-5xl font-black tracking-widest text-slate-900 dark:text-white">
              {numA} + {numB} = ?
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Ketik digit satuan terakhir saja!
            </p>
          </div>

          <input aria-label="Input field"
            type="number"
            autoFocus
            value={userInputMath}
            onChange={(e) => handleMathInputChange(e.target.value)}
            placeholder="0-9"
            className="w-32 h-16 text-center text-3xl font-black rounded-xl border-2 border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 mx-auto dark:bg-slate-900 dark:text-white"
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-6 max-w-xl mx-auto shadow-md">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <Trophy className="w-8 h-8" />
          </div>

          <div>
            <h3 className="font-bold text-xl text-slate-900 dark:text-white">Simulasi Kraepelin Selesai!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Hasil performa ketahanan fokus & kecepatan berhitung Anda.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Jawaban Benar</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{kraepelinScore} / {kraepelinTotal}</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Kecepatan (Digit/Menit)</span>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                {Math.round((kraepelinScore / kraepelinDuration) * 60)} bpm
              </div>
            </div>
          </div>

          <button
            onClick={handleStartKraepelin}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Coba Lagi Sesi Kraepelin</span>
          </button>
        </div>
      )}
    </div>
  );
}
