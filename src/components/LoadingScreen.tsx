import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Brain, Award, BookOpen, Briefcase, Cpu, Lightbulb } from "lucide-react";

interface LoadingScreenProps {
  statusText?: string;
}

const TIPS_LIST = [
  {
    icon: <Brain className="w-4 h-4 text-cyan-400" />,
    category: "AI MENTOR",
    text: "Ada kesulitan atau bug di kodemu? Hubungi AI Mentor Owl di sidebar kanan untuk panduan langkah demi langkah secara instan."
  },
  {
    icon: <Sparkles className="w-4 h-4 text-amber-400" />,
    category: "TANTANGAN HARIAN",
    text: "Selesaikan tantangan cepat 'Flash Challenge' setiap hari untuk memenangkan tumpukan Gems dan XP ekstra!"
  },
  {
    icon: <Award className="w-4 h-4 text-emerald-400" />,
    category: "SERTIFIKASI",
    text: "Kirim link hasil proyek akhirmu untuk dinilai langsung oleh AI Mentor dan dapatkan Sertifikat Kompetensi resmi industri."
  },
  {
    icon: <Lightbulb className="w-4 h-4 text-purple-400" />,
    category: "STREAK SAFETY",
    text: "Jadwal sedang sibuk? Aktifkan 'Streak Freeze' dari Toko Rewards menggunakan Gems Anda untuk mengamankan rentetan belajarmu."
  },
  {
    icon: <Briefcase className="w-4 h-4 text-blue-400" />,
    category: "SIMULASI WAWANCARA",
    text: "Gunakan fitur Simulasi Wawancara Kerja AI untuk melatih jawaban interview teknis dan HR secara interaktif."
  },
  {
    icon: <BookOpen className="w-4 h-4 text-rose-400" />,
    category: "KATALOG KURSUS",
    text: "Eksplorasi Katalog Kursus untuk mempelajari Tech Stack terpopuler mulai dari Frontend, Backend, hingga Database Administratif."
  }
];

const STAGES = [
  { percent: 20, message: "Menginisialisasi modul koding..." },
  { percent: 45, message: "Menghubungkan ke jaringan AI Mentor..." },
  { percent: 70, message: "Menyelaraskan materi dan tantangan harian..." },
  { percent: 90, message: "Menyiapkan bursa kerja dan analisis karir..." },
  { percent: 100, message: "Membuka gerbang ekosistem Skillora..." }
];

export function LoadingScreen({ statusText }: LoadingScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(10);
  const [currentStage, setCurrentStage] = useState(STAGES[0].message);

  // Rotate tips
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS_LIST.length);
    }, 4500);
    return () => clearInterval(tipInterval);
  }, []);

  // Smooth progress animation simulation
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) {
          clearInterval(progressInterval);
          return 98;
        }
        // Random incremental steps to make it look realistic and organic
        const step = Math.floor(Math.random() * 8) + 3;
        const next = Math.min(prev + step, 98);

        // Update stages based on progress
        const matchedStage = STAGES.find(s => next <= s.percent);
        if (matchedStage) {
          setCurrentStage(matchedStage.message);
        }

        return next;
      });
    }, 180);

    return () => clearInterval(progressInterval);
  }, []);

  const activeTip = TIPS_LIST[tipIndex];

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#070B14] font-sans relative overflow-hidden" 
      aria-busy="true" 
      aria-live="polite"
    >
      {/* High-End Ambient Glowing Orbs */}
      <motion.div 
        animate={{ 
          x: [0, 40, -20, 0], 
          y: [0, -30, 40, 0],
          scale: [1, 1.15, 0.9, 1] 
        }} 
        transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-emerald-600/10 via-teal-600/5 to-transparent rounded-full blur-[130px] pointer-events-none"
      />
      <motion.div 
        animate={{ 
          x: [0, -30, 30, 0], 
          y: [0, 50, -30, 0],
          scale: [1, 0.9, 1.1, 1] 
        }} 
        transition={{ repeat: Infinity, duration: 18, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tr from-green-600/10 via-emerald-600/5 to-transparent rounded-full blur-[150px] pointer-events-none"
      />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none animate-pulse" />

      {/* Decorative Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
          backgroundSize: "24px 24px"
        }}
      />

      <div className="relative flex flex-col items-center justify-center z-10 p-6 max-w-md w-full text-center">
        {/* Futuristic Glowing Loader Logo */}
        <div className="relative flex items-center justify-center mb-10">
          {/* External Spinning Tech Ring */}
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="w-28 h-28 border-2 border-dashed border-slate-700/60 rounded-full"
          />
          
          {/* Inner Glowing Gradient Ring */}
          <motion.div 
            animate={{ rotate: -360 }} 
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            className="absolute w-24 h-24 border-2 border-t-emerald-500 border-r-teal-400 border-b-green-500 border-l-transparent rounded-full shadow-[0_0_25px_rgba(16,185,129,0.25)]"
          />

          {/* Central Pulsating Solid Badge */}
          <motion.div 
            animate={{ scale: [1, 1.04, 1] }} 
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),0_10px_25px_rgba(16,185,129,0.4)]"
          >
            {/* Elegant Custom Graduation Cap Logo icon */}
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.2)]">
              <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
              <path d="M6 12.5v5a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-5" />
            </svg>
          </motion.div>

          {/* Sparkly Floating Particles */}
          <motion.div
            animate={{ y: [-4, 4, -4], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="absolute -top-1 -right-1 text-emerald-400 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]"
          >
            <Sparkles className="w-5 h-5 fill-emerald-400" />
          </motion.div>
        </div>

        {/* Brand & Loading Info */}
        <div className="space-y-1 mb-8">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-xs font-bold tracking-[0.25em] text-emerald-400 uppercase">Premium LMS</span>
          </div>
          <h2 className="font-display font-black text-3xl text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Skillora
          </h2>
          <div className="pt-2 h-5 flex items-center justify-center">
            <p className="text-xs font-semibold text-slate-400 animate-pulse">
              {statusText || currentStage}
            </p>
          </div>
        </div>

        {/* Techy Segmented Progress Bar */}
        <div className="w-64 mb-10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 font-bold px-0.5">
            <span>SINKRONISASI</span>
            <span className="text-emerald-400">{progress}%</span>
          </div>
          
          {/* Main Track */}
          <div className="h-[6px] bg-slate-900/80 rounded-full p-[1px] border border-slate-800/60 overflow-hidden relative">
            <motion.div 
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-teal-400 via-emerald-500 to-green-600 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.6)]"
              transition={{ ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Carousel of Loading Tips / Quotes */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={tipIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className="bg-slate-900/30 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-4.5 text-left shadow-[0_15px_35px_rgba(0,0,0,0.2)] hover:border-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2.5">
                <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800">
                  {activeTip.icon}
                </div>
                <span className="text-xs font-black tracking-widest text-slate-400 uppercase">
                  {activeTip.category}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/60 ml-auto animate-ping" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                "{activeTip.text}"
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
