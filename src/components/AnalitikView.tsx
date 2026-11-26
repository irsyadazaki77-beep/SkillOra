import { useState, useEffect, useMemo } from "react";
import { apiClient } from "../api/apiClient";
import { Course, Profile, LeaderboardUser } from "../types";
import {
  Target,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Zap,
  Trophy,
  Crown,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  Gift,
} from "lucide-react";
import { motion } from "motion/react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { playSound } from "../utils/sound";

interface AnalitikViewProps {
  profile: Profile;
  courses?: Course[];
  setProfile?: (p: Profile) => void;
  showToast?: (msg: string, type?: "success" | "error" | "info") => void;
}

const CHART_COLORS = ["#10b981", "#059669", "#0ea5e9", "#f59e0b", "#8b5cf6", "#ec4899"];

export function AnalitikView({ profile, courses = [], setProfile, showToast }: AnalitikViewProps) {
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
    } catch {
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
        if (showToast) showToast("Klaim prestasi berhasil! Hadiah XP & Gems telah ditambahkan.", "success");
      } else {
        if (showToast) showToast("Gagal mengklaim prestasi", "error");
      }
    } catch (err: any) {
      if (showToast) showToast(err.message, "error");
    } finally {
      setClaimingAchId(null);
    }
  };

  // Real weekly XP breakdown derived from quizAttempts + weeklyXp
  const weeklyXpData = useMemo(() => {
    const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    const weekdayMap: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

    const attempts = Array.isArray(profile.quizAttempts) ? profile.quizAttempts : [];
    for (const att of attempts) {
      const parsedDate = att.completedAt ? new Date(att.completedAt) : null;
      if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
        const w = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", weekday: "short" }).format(parsedDate);
        const idx = weekdayMap[w] ?? 0;
        buckets[idx] += att.xpEarned || 50;
      }
    }

    // Include remaining weeklyXp on today's Jakarta bar so user's current week XP is always visible
    const todayW = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", weekday: "short" }).format(new Date());
    const todayIdx = weekdayMap[todayW] ?? 0;
    const sumFromAttempts = buckets.reduce((a, b) => a + b, 0);
    const totalWeekly = Math.max(0, profile.weeklyXp || 0);
    if (totalWeekly > sumFromAttempts) {
      buckets[todayIdx] += totalWeekly - sumFromAttempts;
    }

    return days.map((day, idx) => ({ day, xp: buckets[idx] }));
  }, [profile.quizAttempts, profile.weeklyXp]);

  // Real competency category distribution from user's completed lessons / enrolled courses
  const categoryData = useMemo(() => {
    const catTotals: Record<string, number> = {};
    for (const course of courses) {
      const cat = course.category || "Umum";
      const completed = course.lessons?.filter((l) => l.completed).length || 0;
      if (completed > 0) {
        catTotals[cat] = (catTotals[cat] || 0) + completed;
      }
    }

    let entries = Object.entries(catTotals);
    if (entries.length === 0) {
      // Fallback to active/enrolled courses or student's skills before first completion
      const enrolledTotals: Record<string, number> = {};
      for (const course of courses) {
        if (course.isEnrolled) {
          const cat = course.category || "Umum";
          enrolledTotals[cat] = (enrolledTotals[cat] || 0) + 1;
        }
      }
      entries = Object.entries(enrolledTotals);
    }

    const grandTotal = entries.reduce((sum, [, v]) => sum + v, 0);
    if (grandTotal === 0) return [];

    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], idx) => ({
        name,
        value: Math.round((count / grandTotal) * 100),
        color: CHART_COLORS[idx % CHART_COLORS.length],
      }));
  }, [courses]);

  return (
    <div className="w-full py-2 font-sans space-y-6 relative z-10 animate-in fade-in duration-300">
      <header className="space-y-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <p className="text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
          Statistik Real-Time · Progres &amp; Liga
        </p>
        <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-zinc-950 dark:text-white">
          Pencapaian, Leaderboard &amp; Analisis Belajar
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm max-w-3xl leading-relaxed">
          Pantau grafik progres mingguan, peringkat liga developer, lencana prestasi berbasis aktivitas nyata, dan riwayat evaluasi Anda.
        </p>
      </header>

      {/* Key Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total XP", value: profile.xp, icon: Zap, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/50" },
          { label: "Gems", value: profile.gems, icon: Sparkles, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50" },
          { label: "Konsistensi", value: `${profile.streak} Hari`, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/50" },
          { label: "Level Belajar", value: `Lv. ${profile.level}`, icon: Crown, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center text-center group"
            >
              <div className={`w-11 h-11 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-2.5`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="font-display font-black text-2xl text-zinc-950 dark:text-white tabular-nums">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Leaderboard Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-display font-bold text-lg sm:text-xl text-zinc-950 dark:text-white">Liga &amp; Leaderboard Developer</h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {leaderboardTab === "weekly"
                ? "Peringkat reset setiap hari Minggu berdasarkan perolehan Weekly XP."
                : "Klasemen permanen sepanjang masa pengguna SkillOra."}
            </p>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setLeaderboardTab("weekly")}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                leaderboardTab === "weekly"
                  ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Peringkat Mingguan
            </button>
            <button
              type="button"
              onClick={() => setLeaderboardTab("permanent")}
              className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer ${
                leaderboardTab === "permanent"
                  ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Klasemen Permanen
            </button>
          </div>
        </div>

        {loadingLeaderboard ? (
          <div className="py-8 text-center text-zinc-400 text-xs">Memuat peringkat leaderboard...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(Array.isArray(leaderboard) ? leaderboard : []).map((user) => {
              const isCurrentUser = user.isCurrentUser;

              let rankBadge = <span className="font-bold text-zinc-400 text-xs">#{user.rank}</span>;
              if (user.rank === 1) rankBadge = <span className="text-lg">🥇</span>;
              if (user.rank === 2) rankBadge = <span className="text-lg">🥈</span>;
              if (user.rank === 3) rankBadge = <span className="text-lg">🥉</span>;

              return (
                <div
                  key={user.userId}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isCurrentUser
                      ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-500/30"
                      : "bg-zinc-50/70 dark:bg-zinc-950/40 border-zinc-200/80 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 text-center shrink-0">{rankBadge}</div>
                    <span className="text-xl shrink-0">{user.avatar}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-xs text-zinc-950 dark:text-white truncate">{user.name}</h4>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold uppercase bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                            Anda
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                        {user.levelTitle} (Lv. {user.level})
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold font-mono text-xs text-emerald-600 dark:text-emerald-400 block tabular-nums">
                      +{user.xp} XP
                    </span>
                    <span className="text-xs font-semibold text-amber-500 flex items-center gap-0.5 justify-end tabular-nums">
                      🔥 {user.streak}h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Charts Section (Real Aggregated User Metrics) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-display font-bold text-lg text-zinc-950 dark:text-white">
                Perolehan XP Mingguan
              </h3>
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full tabular-nums">
              {profile.weeklyXp || 0} XP Minggu Ini
            </span>
          </div>

          <div className="h-64 w-full pt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyXpData}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderRadius: "10px",
                    border: "1px solid #27272a",
                    color: "#fafafa",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "rgba(16, 185, 129, 0.08)" }}
                />
                <Bar dataKey="xp" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Category Distribution Pie Chart */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-display font-bold text-lg text-zinc-950 dark:text-white">Fokus Kompetensi</h3>
          </div>

          {categoryData.length > 0 ? (
            <>
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
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        borderRadius: "8px",
                        border: "1px solid #27272a",
                        color: "#fafafa",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2">
                {categoryData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-zinc-700 dark:text-zinc-300 truncate">{item.name}</span>
                    </div>
                    <span className="font-bold font-mono text-zinc-950 dark:text-white tabular-nums">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-56 flex flex-col items-center justify-center text-center px-4 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <PieIcon className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Belum Ada Progres Kategori</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Daftar dan selesaikan modul kursus pertamamu untuk melihat distribusi kompetensi di sini.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Achievements and Quests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-bold text-lg text-zinc-950 dark:text-white">Lencana &amp; Prestasi Terbuka</h3>
          </div>
          <div className="space-y-3">
            {profile.achievements && profile.achievements.map((ach) => {
              const isClaimable = ach.unlocked && !ach.claimed;
              const isClaimed = ach.unlocked && ach.claimed;
              const progressPct = Math.min(100, Math.round((ach.current / (ach.target || 1)) * 100));

              return (
                <div
                  key={ach.id}
                  className={`flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                    isClaimable
                      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 ring-1 ring-amber-400/20"
                      : isClaimed
                      ? "bg-zinc-50/80 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800"
                      : "bg-zinc-50/40 dark:bg-zinc-950/20 border-zinc-200/60 dark:border-zinc-800/70 opacity-75"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center text-xl border border-zinc-200 dark:border-zinc-700 shrink-0">
                      {ach.icon}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs text-zinc-950 dark:text-white truncate">{ach.title}</h4>
                        {isClaimed && (
                          <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                            Terklaim
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-snug">{ach.description}</p>

                      {!isClaimed && (
                        <div className="flex items-center gap-2 pt-1">
                          <div className="w-28 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progressPct}%` }} />
                          </div>
                          <span className="text-xs font-mono font-bold text-zinc-400 tabular-nums">
                            {ach.current}/{ach.target}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-end">
                    {isClaimable ? (
                      <button
                        type="button"
                        onClick={() => handleClaimAchievement(ach.id)}
                        disabled={claimingAchId === ach.id}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>{claimingAchId === ach.id ? "Klaim..." : "Klaim Hadiah"}</span>
                      </button>
                    ) : isClaimed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : (
                      <span className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
                        +{ach.rewardXp || 100} XP
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-display font-bold text-lg text-zinc-950 dark:text-white">Misi Harian Aktif</h3>
          </div>
          <div className="space-y-3">
            {profile.dailyQuests && profile.dailyQuests.map((quest) => {
              const progress = Math.min((quest.current / Math.max(1, quest.target)) * 100, 100);
              return (
                <div
                  key={quest.id}
                  className="p-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-zinc-950 dark:text-white">{quest.title}</h4>
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md shrink-0">
                      +{quest.xpReward} XP
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 tabular-nums">
                      {quest.current}/{quest.target}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Riwayat Kuis Lengkap */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Riwayat &amp; Evaluasi Soal
            </span>
            <h3 className="font-display font-bold text-lg sm:text-xl text-zinc-950 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              <span>Riwayat Kuis &amp; Evaluasi Jawaban</span>
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-zinc-500 dark:text-zinc-400 tabular-nums">
            {Array.isArray(profile.quizAttempts) ? profile.quizAttempts.length : 0} Kuis Selesai
          </span>
        </div>

        {Array.isArray(profile.quizAttempts) && profile.quizAttempts.length > 0 ? (
          <div className="space-y-3">
            {profile.quizAttempts.map((attempt) => (
              <div
                key={attempt.id}
                className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        attempt.percentage >= 80
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                      }`}
                    >
                      Nilai: {attempt.percentage}%
                    </span>
                    <span className="text-xs font-bold text-zinc-950 dark:text-white">{attempt.courseTitle || "Kuis Umum"}</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    {attempt.lessonTitle} · Selesai: {attempt.completedAt}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right text-xs">
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                      +{attempt.xpEarned || 50} XP
                    </span>
                    <span className="text-xs text-zinc-400">{attempt.wrongAnswersCount} Kesalahan</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-zinc-50 dark:bg-zinc-950/30 border border-dashed border-zinc-300 dark:border-zinc-700 text-center space-y-2">
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Belum Ada Riwayat Kuis</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Kerjakan kuis dari modul belajar atau simulasi soal untuk melihat analisis evaluasimu di sini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
