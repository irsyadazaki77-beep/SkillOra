import React from "react";
import { 
  BarChart2, 
  TrendingUp, 
  Award, 
  CheckCircle2, 
  Target, 
  BrainCircuit, 
  Zap, 
  ShieldCheck 
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  BarChart, 
  Bar 
} from "recharts";
import { Profile } from "../../../types";

interface AnalyticsTabProps {
  profile: Profile;
  overallAccuracy: number;
  perfectAttemptsCount: number;
  totalXpEarned: number;
  chartProgressData: { name: string; Skor: number; XP: number; Topic: string }[];
  categoryProficiencyData: { category: string; Akurasi: number; Selesai: number }[];
}

export function AnalyticsTab({
  profile,
  overallAccuracy,
  perfectAttemptsCount,
  totalXpEarned,
  chartProgressData,
  categoryProficiencyData
}: AnalyticsTabProps) {
  const attemptsCount = profile.quizAttempts ? profile.quizAttempts.length : 0;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Sesi Selesai</span>
            <h4 className="text-xl font-bold text-slate-900 dark:text-white">{attemptsCount} Sesi</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Rata-rata Akurasi</span>
            <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{overallAccuracy}%</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Skor Sempurna (100%)</span>
            <h4 className="text-xl font-bold text-amber-500">{perfectAttemptsCount} Kali</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">XP dari Latihan</span>
            <h4 className="text-xl font-bold text-purple-600 dark:text-purple-400">+{totalXpEarned} XP</h4>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progression Trend Area Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Tren Skor & Peningkatan Akurasi</span>
              </h3>
              <p className="text-xs text-slate-500">Riwayat performa 8 sesi latihan terakhir</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800 space-y-1">
                          <p className="font-bold text-indigo-300">{label} • {payload[0].payload.Topic}</p>
                          <p className="text-emerald-400 font-semibold">Skor: {payload[0].value}%</p>
                          <p className="text-amber-300">XP Diperoleh: +{payload[0].payload.XP} XP</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="Skor" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Proficiency Radar / Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BrainCircuit className="w-4 h-4 text-purple-600" />
                <span>Profisiensi Berdasarkan Bidang</span>
              </h3>
              <p className="text-xs text-slate-500">Persentase penguasaan kompetensi</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryProficiencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-800 space-y-1">
                          <p className="font-bold text-purple-300">{payload[0].payload.category}</p>
                          <p className="text-emerald-400 font-semibold">Akurasi: {payload[0].value}%</p>
                          <p className="text-slate-300">Total Sesi: {payload[0].payload.Selesai}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="Akurasi" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
