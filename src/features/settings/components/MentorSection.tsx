import React from "react";
import { Sparkles, MessageSquare, Bot, Check } from "lucide-react";

interface MentorSectionProps {
  mentorTone: string;
  setMentorTone: (tone: string) => void;
}

export function MentorSection({
  mentorTone,
  setMentorTone
}: MentorSectionProps) {
  const tones = [
    {
      id: "friendly",
      title: "Ramah & Mendukung (Default)",
      desc: "Menjelaskan konsep seperti teman belajar yang sabar, memberi motivasi, dan memandu langkah demi langkah.",
      icon: "😊"
    },
    {
      id: "formal",
      title: "Profesional & Terstruktur",
      desc: "Bahasa baku standar industri, penjelasan teknis mendalam dengan analogi formal dan fokus ke best practices.",
      icon: "💼"
    },
    {
      id: "concise",
      title: "Ringkas & Langsung Solutif (TL;DR)",
      desc: "Menyediakan cuplikan kode dan solusi langsung tanpa penjelasan panjang untuk developer yang terburu-buru.",
      icon: "⚡"
    },
    {
      id: "socratic",
      title: "Metode Sokrates (Menuntun Penalaran)",
      desc: "Memberikan pertanyaan pemantik agar Anda menemukan jawabannya sendiri daripada langsung memberikan solusi.",
      icon: "🧠"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span>Gaya Komunikasi AI Mentor</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Sesuaikan persona dan pendekatan mengajar AI Mentor saat berdiskusi tentang materi kursus, review tugas, dan latihan soal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {tones.map((tone) => {
          const isSelected = mentorTone === tone.id;
          return (
            <div
              key={tone.id}
              onClick={() => setMentorTone(tone.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative ${
                isSelected
                  ? "bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
                  : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{tone.icon}</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {tone.title}
                  </h4>
                </div>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {tone.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
