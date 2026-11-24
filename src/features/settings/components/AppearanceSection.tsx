import React from "react";
import { Sliders, Check } from "lucide-react";

interface AppearanceSectionProps {
  dashboardTheme: string;
  handleApplyTheme: (theme: string) => void;
}

export function AppearanceSection({
  dashboardTheme,
  handleApplyTheme
}: AppearanceSectionProps) {
  const themes = [
    {
      id: "default",
      name: "Indigo Modern (Standar)",
      color: "bg-indigo-600",
      desc: "Palet standar Skillora dengan aksen indigo dan kontras optimal."
    },
    {
      id: "emerald",
      name: "Emerald Forest (Fokus)",
      color: "bg-emerald-600",
      desc: "Nuansa hijau sejuk yang menenangkan mata saat sesi belajar panjang."
    },
    {
      id: "amber",
      name: "Amber Warm (Kreatif)",
      color: "bg-amber-500",
      desc: "Aksen hangat yang meningkatkan energi dan semangat kompetisi."
    },
    {
      id: "rose",
      name: "Rose Quartz (Elegan)",
      color: "bg-rose-500",
      desc: "Tampilan berani dengan kontras dinamis untuk pengalaman belajar premium."
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <span>Tampilan & Tema Visual</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Sesuaikan aksen visual dan gaya tampilan dashboard agar sesuai dengan kenyamanan belajar Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {themes.map((t) => {
          const isSelected = dashboardTheme === t.id;
          return (
            <div
              key={t.id}
              onClick={() => handleApplyTheme(t.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative ${
                isSelected
                  ? "bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
                  : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 hover:border-indigo-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-4 h-4 rounded-full ${t.color}`} />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{t.name}</h4>
                </div>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
