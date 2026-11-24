import { useState, useEffect } from "react";
import { apiClient } from "../api/apiClient";
import { Profile, LeaderboardUser } from "../types";
import { Award, Target, TrendingUp, Sparkles, CheckCircle2, Zap, Trophy, Crown, BarChart3, PieChart as PieIcon, Activity, Gift, Medal } from "lucide-react";
import { motion } from "motion/react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { playSound } from "../utils/sound";

interface AnalitikViewProps {
  profile: Profile;
  setProfile?: (p: Profile) => void;
  showToast?: (msg: string, type?: "success" | "error" | "info") => void;
}

export function AnalitikView({ profile, setProfile, showToast }: AnalitikViewProps) {
  const [leaderboardTab, setLeaderboardTab] = useState<"weekly" | "permanent">("weekly");
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState<boolean>(false);
  const [claimingAchId, setClaimingAchId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardTab]);

  const fetchLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      const data = await apiClient.get(`/user/leaderboard?type=${leaderboardTab}`);
      if (data) {
        if (Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard);
        } else if (Array.isArray(data)) {
          setLeaderboard(data);
        } else {
          setLeaderboard([]);
        }
      } else {
        setLeaderboard([]);
      }
    } catch (err) {
      console.error(err);
      setLeaderboard([]);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleClaimAchievement = async (achievementId: string) => {
    try {
      setClaimingAchId(achievementId);
      const data = await apiClient.post("/user/profile/claim-achievement", { achievementId });
      if (data && data.profile) {
        playSound("levelUp");
        if (setProfile) setProfile(data.profile);
        if (showToast) showToast("🏆 Klaim Prestasi Berhasil! Hadiah XP & Gems telah ditambahkan ke akun Anda.", "success");
      } else {
        if (showToast) showToast("Gagal mengklaim prestasi", "error");
      }
    } catch (err: any) {
      if (showToast) showToast(err.message, "error");
    } finally {
      setClaimingAchId(null);
    }
  };

  // Weekly XP mock data
  const weeklyXpData = [
    { day: "Sen", xp: 120 },
    { day: "Sel", xp: 240 },
    { day: "Rab", xp: 180 },
    { day: "Kam", xp: 310 },
    { day: "Jum", xp: 220 },
    { day: "Sab", xp: 400 },
    { day: "Min", xp: Math.min(profile.xp % 500, 450) },
  ];

  const categoryData = [
    { name: "Frontend React", value: 40, color: "#3b82f6" },
    { name: "Backend Node.js", value: 25, color: "#10b981" },
    { name: "UI/UX Design", value: 20, color: "#8b5cf6" },
    { name: "Soft Skills & AI", value: 15, color: "#f59e0b" },
  ];

  return (
    <div className="w-full py-2 font-sans space-y-6 relative z-10 animate-in fade-in duration-300">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-white">Pencapaian, Leaderboard & Analisis Belajar</h1>
        <p className="text-slate-500 font-medium text-sm max-w-3xl leading-relaxed">
          Pantau grafik progres mingguan, peringkat liga developer mingguan, lencana prestasi berbasis aktivitas nyata, dan kesiapan karier industri Anda.
        </p>
      </header>

      {/* Key Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total XP", value: profile.xp, icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Gems", value: profile.gems, icon: Sparkles, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Konsistensi", value: `${profile.streak} Hari`, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Level Belajar", value: `Lv. ${profile.level}`, icon: Crown, color: "text-purple-500", bg: "bg-purple-50" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center group"
            >
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="font-display font-black text-2xl text-slate-900 dark:text-white">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Leaderboard Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-display font-black text-xl text-slate-900 dark:text-white">Liga & Leaderboard Developer</h3>
            </div>
            <p className="text-xs text-slate-500">
              {leaderboardTab === "weekly" ? "Peringkat reset setiap hari Minggu. Bersaing dikumpulkan berdasarkan Weekly XP!" : "Klasemen permanen sepanjang masa pengguna platform."}
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold shrink-0">
            <button
              onClick={() => setLeaderboardTab("weekly")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                leaderboardTab === "weekly"
                  ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              🏆 Peringkat Mingguan
            </button>
            <button
              onClick={() => setLeaderboardTab("permanent")}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
                leaderboardTab === "permanent"
                  ? "bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm font-black"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              ⭐ Klasemen Permanen
            </button>
          </div>
        </div>

        {loadingLeaderboard ? (
          <div className="py-8 text-center text-slate-400 text-xs">Memuat peringkat leaderboard...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Array.isArray(leaderboard) ? leaderboard : []).map((user) => {
              const isCurrentUser = user.isCurrentUser;

              let rankBadge = <span className="font-bold text-slate-400 text-xs">#{user.rank}</span>;
              if (user.rank === 1) rankBadge = <span className="text-lg">🥇</span>;
              if (user.rank === 2) rankBadge = <span className="text-lg">🥈</span>;
              if (user.rank === 3) rankBadge = <span className="text-lg">🥉</span>;

              return (
                <div
                  key={user.userId}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                    isCurrentUser
                      ? "bg-blue-50/80 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20"
                      : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 text-center shrink-0">{rankBadge}</div>
                    <span className="text-xl shrink-0">{user.avatar}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{user.name}</h4>
                        {isCurrentUser && (
                          <span className="text-xs font-black uppercase bg-blue-600 text-white px-1.5 py-0.5 rounded">Anda</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.levelTitle} (Lv. {user.level})</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-xs text-blue-600 dark:text-blue-400 block">
                      +{user.xp} XP
                    </span>
                    <span className="text-xs font-bold text-orange-500 flex items-center gap-0.5 justify-end">
                      🔥 {user.streak}d
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h3 className="font-display font-bold text-lg text-slate-900">Aktivitas Perolehan XP Mingguan</h3>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">7 Hari Terakhir</span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyXpData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }}
                />
                <Bar dataKey="xp" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Category Distribution Pie Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="font-display font-bold text-lg text-slate-900">Fokus Kompetensi</h3>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2">
            {categoryData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-slate-700">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements and Quests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-bold text-lg text-slate-900">Lencana & Prestasi Terbuka</h3>
          </div>
          <div className="space-y-3">
            {profile.achievements && profile.achievements.map(ach => {
              const isClaimable = ach.unlocked && !ach.claimed;
              const isClaimed = ach.unlocked && ach.claimed;
              const progressPct = Math.min(100, Math.round((ach.current / (ach.target || 1)) * 100));

              return (
                <div
                  key={ach.id}
                  className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all ${
                    isClaimable
                      ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-sm ring-2 ring-amber-400/20"
                      : isClaimed
                      ? "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800"
                      : "bg-slate-50/40 dark:bg-slate-800/20 border-slate-200/60 dark:border-slate-800 opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-2xl border border-slate-200 dark:border-slate-700 shrink-0">
                      {ach.icon}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{ach.title}</h4>
                        {isClaimed && (
                          <span className="text-xs font-black uppercase text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                            Terklaim
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{ach.description}</p>
                      
                      {!isClaimed && (
                        <div className="flex items-center gap-2 pt-1">
                          <div className="w-28 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progressPct}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-400">{ach.current}/{ach.target}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-end">
                    {isClaimable ? (
                      <button
                        onClick={() => handleClaimAchievement(ach.id)}
                        disabled={claimingAchId === ach.id}
                        className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>{claimingAchId === ach.id ? "Klaim..." : "Klaim Hadiah!"}</span>
                      </button>
                    ) : isClaimed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                        +{ach.rewardXp || 100} XP
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-500" />
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Misi Harian Aktif</h3>
          </div>
          <div className="space-y-3">
            {profile.dailyQuests && profile.dailyQuests.map(quest => {
              const progress = Math.min((quest.current / quest.target) * 100, 100);
              return (
                <div key={quest.id} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">{quest.title}</h4>
                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-md">+{quest.xpReward} XP</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-500">{quest.current}/{quest.target}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* FEATURE 5: RIWAYAT KUIS LENGKAP */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Fitur #5 &bull; Riwayat & Evaluasi Soal</span>
            <h3 className="font-display font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              <span>Riwayat Kuis & Evalusi Jawaban</span>
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {Array.isArray(profile.quizAttempts) ? profile.quizAttempts.length : 0} Kuis Selesai
          </span>
        </div>

        {Array.isArray(profile.quizAttempts) && profile.quizAttempts.length > 0 ? (
          <div className="space-y-3">
            {profile.quizAttempts.map((attempt) => (
              <div key={attempt.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      attempt.percentage >= 80 
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" 
                        : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                    }`}>
                      Nilai: {attempt.percentage}%
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{attempt.courseTitle || "Kuis General"}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{attempt.lessonTitle} &bull; Selesai: {attempt.completedAt}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-xs">
                    <span className="font-bold text-blue-600 dark:text-blue-400 block">+{attempt.xpEarned || 50} XP</span>
                    <span className="text-xs text-slate-400">{attempt.wrongAnswersCount} Kesalahan</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Belum Ada Riwayat Kuis</p>
            <p className="text-xs text-slate-500">Kerjakan kuis dari modul belajar atau simulasi soal untuk melihat analisis evaluasimu di sini.</p>
          </div>
        )}
      </div>
    </div>
  );
}

