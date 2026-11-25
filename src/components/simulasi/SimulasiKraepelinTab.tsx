import { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Flame, Trophy, Activity } from "lucide-react";
import { playSound } from "../../utils/sound";
import { Profile } from "../../types";
import { trainingApi } from "../../api/apiClient";

interface SimulasiKraepelinTabProps {
  onAddXp?: (xp: number) => void;
  onProfileUpdate?: (profile: Profile) => void;
  onSimulationRecorded?: () => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

interface IntervalBucket {
  label: string;
  correct: number;
  attempts: number;
}

export function SimulasiKraepelinTab({
  onAddXp,
  onProfileUpdate,
  onSimulationRecorded,
  showToast,
}: SimulasiKraepelinTabProps) {
  const [kraepelinActive, setKraepelinActive] = useState(false);
  const [kraepelinDuration, setKraepelinDuration] = useState<number>(60);
  const [kraepelinTimeLeft, setKraepelinTimeLeft] = useState(60);
  const [kraepelinScore, setKraepelinScore] = useState(0);
  const [kraepelinTotal, setKraepelinTotal] = useState(0);
  const [numA, setNumA] = useState(7);
  const [numB, setNumB] = useState(5);
  const [userInputMath, setUserInputMath] = useState("");
  const [kraepelinFinished, setKraepelinFinished] = useState(false);
  const [buckets, setBuckets] = useState<IntervalBucket[]>([]);
  const [kraepelinPeakSpeed, setKraepelinPeakSpeed] = useState<number>(() => {
    return Number(localStorage.getItem("skillora_kraepelin_peak")) || 0;
  });

  const recordedRef = useRef(false);
  const bucketCount = kraepelinDuration === 30 ? 3 : kraepelinDuration === 60 ? 6 : 8;
  const bucketLengthSec = kraepelinDuration / bucketCount;

  useEffect(() => {
    let kTimer: ReturnType<typeof setInterval> | undefined;
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

      if (!recordedRef.current) {
        recordedRef.current = true;
        const accuracy = kraepelinTotal > 0 ? Math.round((kraepelinScore / kraepelinTotal) * 100) : 0;
        const counts = buckets.map((b) => b.correct);
        const mean = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
        const variance = counts.length
          ? counts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / counts.length
          : 0;
        const stdDev = Math.sqrt(variance);
        const stabilityScore = Math.max(0, Math.min(100, Math.round(100 - stdDev * 14)));
        const compositeScore = Math.min(100, Math.round(accuracy * 0.5 + stabilityScore * 0.3 + Math.min(100, speedDigitsPerMin) * 0.2));
        const earnedXp = kraepelinScore >= 10 ? 150 : 40;

        trainingApi
          .recordSimulation({
            simType: "kraepelin",
            title: `Kraepelin ${kraepelinDuration}s (${speedDigitsPerMin} dpm)`,
            score: compositeScore,
            metrics: {
              durationSeconds: kraepelinDuration,
              correct: kraepelinScore,
              total: kraepelinTotal,
              accuracy,
              speedDigitsPerMin,
              stabilityScore,
              intervals: buckets,
            },
            earnedXp,
          })
          .then((res) => {
            if (res?.profile) onProfileUpdate?.(res.profile);
            else if (onAddXp && kraepelinScore >= 10) onAddXp(earnedXp);
            onSimulationRecorded?.();
            showToast?.(`Sesi Kraepelin tersimpan (${speedDigitsPerMin} digit/mnt · +${earnedXp} XP).`, "success");
          })
          .catch(() => {
            if (onAddXp && kraepelinScore >= 10) onAddXp(earnedXp);
          });
      }
    }
    return () => {
      if (kTimer) clearInterval(kTimer);
    };
  }, [
    kraepelinActive,
    kraepelinTimeLeft,
    kraepelinScore,
    kraepelinTotal,
    kraepelinDuration,
    kraepelinPeakSpeed,
    buckets,
    onAddXp,
    onProfileUpdate,
    onSimulationRecorded,
    showToast,
  ]);

  const generateNewMathPair = () => {
    setNumA(Math.floor(Math.random() * 9) + 1);
    setNumB(Math.floor(Math.random() * 9) + 1);
  };

  const handleStartKraepelin = () => {
    const initBuckets: IntervalBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
      label: `T${i + 1}`,
      correct: 0,
      attempts: 0,
    }));
    recordedRef.current = false;
    setBuckets(initBuckets);
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
      if (Number.isNaN(enteredNum)) {
        setUserInputMath("");
        return;
      }

      const elapsed = kraepelinDuration - kraepelinTimeLeft;
      const bIdx = Math.min(bucketCount - 1, Math.floor(elapsed / bucketLengthSec));
      const isCorrect = enteredNum === targetDigit;

      setKraepelinTotal((prev) => prev + 1);
      if (isCorrect) {
        setKraepelinScore((prev) => prev + 1);
        playSound("correct");
      } else {
        playSound("wrong");
      }

      setBuckets((prev) =>
        prev.map((b, idx) =>
          idx === bIdx
            ? { ...b, attempts: b.attempts + 1, correct: b.correct + (isCorrect ? 1 : 0) }
            : b
        )
      );

      setUserInputMath("");
      generateNewMathPair();
    }
  };

  const accuracyPct = kraepelinTotal > 0 ? Math.round((kraepelinScore / kraepelinTotal) * 100) : 0;
  const speedDpm = Math.round((kraepelinScore / kraepelinDuration) * 60);
  const maxBucketCorrect = Math.max(1, ...buckets.map((b) => b.correct));
  const counts = buckets.map((b) => b.correct);
  const mean = counts.length ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
  const variance = counts.length
    ? counts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / counts.length
    : 0;
  const stabilityScore = Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(variance) * 14)));

  return (
    <div className="space-y-5">
      <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1.5">
        <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />
          Psikotes Ketahanan, Tempo & Stabilitas
        </p>
        <h2 className="text-xl font-display font-bold text-zinc-950 dark:text-white">
          Simulasi Kraepelin & Kurva Stabilitas Kecepatan
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
          Jumlahkan dua angka secepat dan sekonsisten mungkin. Ketik hanya digit satuan terakhir (contoh: 7 + 8 = 15, ketik <strong className="font-mono text-zinc-950 dark:text-white">5</strong>). Sistem merekam kurva stabilitas tempo tiap interval.
        </p>
      </div>

      {!kraepelinActive && !kraepelinFinished ? (
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center space-y-6 max-w-xl mx-auto">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center justify-center mx-auto text-emerald-700 dark:text-emerald-400">
            <Flame className="w-6 h-6" />
          </div>

          <div>
            <h3 className="font-display font-bold text-lg text-zinc-950 dark:text-white">
              Pilih Durasi Uji Ketahanan
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Durasi lebih panjang memberi kurva stabilitas fokus yang lebih akurat.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[30, 60, 120].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setKraepelinDuration(sec)}
                className={`py-3 px-2 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                  kraepelinDuration === sec
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300"
                    : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                {sec} Detik
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleStartKraepelin}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Mulai Simulasi Kraepelin</span>
          </button>

          {kraepelinPeakSpeed > 0 && (
            <div className="pt-2 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1.5 font-mono">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>Rekor Terbaik: {kraepelinPeakSpeed} digit/menit</span>
            </div>
          )}
        </div>
      ) : kraepelinActive ? (
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center space-y-6 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
            <span>
              Waktu:{" "}
              <strong className="text-emerald-700 dark:text-emerald-400 text-base">
                {kraepelinTimeLeft}s
              </strong>
            </span>
            <span>
              Benar:{" "}
              <strong className="text-zinc-950 dark:text-white text-base">
                {kraepelinScore}/{kraepelinTotal}
              </strong>
            </span>
          </div>

          <div className="py-7 px-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="text-5xl font-mono font-black tracking-widest tabular-nums text-zinc-950 dark:text-white">
              {numA} + {numB}
            </div>
            <p className="text-xs text-zinc-500">Ketik digit satuan terakhir (0–9)</p>
          </div>

          <input
            aria-label="Digit satuan hasil penjumlahan"
            type="tel"
            inputMode="numeric"
            autoFocus
            value={userInputMath}
            onChange={(e) => handleMathInputChange(e.target.value)}
            placeholder="0-9"
            className="w-32 h-16 text-center text-3xl font-mono font-bold rounded-xl border-2 border-emerald-600 focus:outline-none mx-auto bg-white dark:bg-zinc-950 text-zinc-950 dark:text-white"
          />
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-6 max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-semibold">
                Laporan Psikotes Kraepelin
              </p>
              <h3 className="font-display font-bold text-xl text-zinc-950 dark:text-white">
                Analisis Kecepatan & Kurva Stabilitas
              </h3>
            </div>
            <button
              type="button"
              onClick={handleStartKraepelin}
              className="px-4 py-2 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 rounded-lg font-semibold text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Ulangi Sesi
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-500 block">Kecepatan</span>
              <span className="text-xl font-mono font-bold tabular-nums text-zinc-950 dark:text-white">
                {speedDpm} dpm
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-500 block">Akurasi</span>
              <span className="text-xl font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {accuracyPct}%
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-500 block">Stabilitas</span>
              <span className="text-xl font-mono font-bold tabular-nums text-zinc-950 dark:text-white">
                {stabilityScore}/100
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
              <span className="text-[11px] text-zinc-500 block">Benar/Total</span>
              <span className="text-xl font-mono font-bold tabular-nums text-zinc-950 dark:text-white">
                {kraepelinScore}/{kraepelinTotal}
              </span>
            </div>
          </div>

          {/* Kraepelin Stability Curve Bar Visualization */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                Kurva Tempo per Interval ({Math.round(bucketLengthSec)} detik/kolom)
              </span>
              <span className="font-mono text-zinc-500">
                {stabilityScore >= 75 ? "Tempo Sangat Stabil" : stabilityScore >= 50 ? "Tempo Cukup Stabil" : "Fluktuasi Tinggi"}
              </span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 items-end h-36 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
              {buckets.map((b) => {
                const heightPct = Math.max(10, Math.round((b.correct / maxBucketCorrect) * 100));
                return (
                  <div key={b.label} className="flex flex-col items-center justify-end h-full gap-1.5">
                    <span className="text-[11px] font-mono tabular-nums font-semibold text-zinc-700 dark:text-zinc-300">
                      {b.correct}
                    </span>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full rounded-t-md bg-emerald-600/85 dark:bg-emerald-500/85 transition-all"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">{b.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
