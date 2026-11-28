import React, { useEffect, useRef, useState } from "react";
import {
  Swords,
  Trophy,
  Timer,
  Users,
  Flag,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Play,
  LogOut,
  Copy,
  Check,
  Radio,
} from "lucide-react";
import { LeagueOverview, Profile, TryoutAttemptRecord, TryoutPackage } from "../types";
import { arenaApi, getAuthTokenForWs } from "../api/apiClient";
import { resolveCourseImage } from "../utils/resolveAsset";
import { ArenaLeagueTab } from "../features/arena/components/ArenaLeagueTab";

interface ArenaViewProps {
  profile: Profile;
  onProfileUpdate: (profile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

interface BattleRoomState {
  roomCode: string;
  topic: string;
  hostUid: string;
  status: "lobby" | "active" | "finished";
  currentIdx: number;
  totalQuestions: number;
  roundEndsAt: number;
  players: Array<{
    uid: string;
    name: string;
    avatar: string;
    score: number;
    correctCount: number;
    isHost: boolean;
    answered: boolean;
  }>;
}

interface PublicLobbySummary {
  roomCode: string;
  topic: string;
  hostName: string;
  playerCount: number;
  status: string;
}

const BATTLE_TOPICS = ["Semua", "TKD BUMN", "React & Frontend", "Backend & SQL", "Situational Judgment"];

export function ArenaView({ profile, onProfileUpdate, showToast }: ArenaViewProps) {
  const [activeTab, setActiveTab] = useState<"battle" | "tryout" | "league">("battle");

  // --- Battle Quiz WebSocket State ---
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [myWsUid, setMyWsUid] = useState<string>("");
  const [publicLobbies, setPublicLobbies] = useState<PublicLobbySummary[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("Semua");
  const [joinCode, setJoinCode] = useState("");
  const [roomState, setRoomState] = useState<BattleRoomState | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<{
    id: number;
    prompt: string;
    options: string[];
    competencyTag: string;
  } | null>(null);
  const [selectedBattleOption, setSelectedBattleOption] = useState<number | null>(null);
  const [roundResult, setRoundResult] = useState<{ correctOption: number; explanation: string } | null>(null);
  const [finalRankings, setFinalRankings] = useState<
    Array<{ rank: number; uid: string; name: string; avatar: string; score: number; correctCount: number; xpAwarded: number }>
  >([]);
  const [roundSecondsLeft, setRoundSecondsLeft] = useState(0);
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);
  const [recentMatches, setRecentMatches] = useState<any[]>([]);

  // --- Tryout Akbar State ---
  const [tryouts, setTryouts] = useState<TryoutPackage[]>([]);
  const [loadingTryouts, setLoadingTryouts] = useState(false);
  const [activeTryout, setActiveTryout] = useState<TryoutPackage | null>(null);
  const [tryoutIdx, setTryoutIdx] = useState(0);
  const [tryoutAnswers, setTryoutAnswers] = useState<Record<string, number>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [tryoutSecondsLeft, setTryoutSecondsLeft] = useState(0);
  const [tryoutStartedAt, setTryoutStartedAt] = useState(0);
  const [submittingTryout, setSubmittingTryout] = useState(false);
  const [tryoutReport, setTryoutReport] = useState<{
    attempt: TryoutAttemptRecord;
    reviewItems: Array<{
      id: string;
      prompt: string;
      selectedOption: number;
      correctOption: number;
      isCorrect: boolean;
      explanation: string;
      competencyTag: string;
    }>;
    earnedXp: number;
    earnedGems: number;
  } | null>(null);

  // --- Weekly League State ---
  const [league, setLeague] = useState<LeagueOverview | null>(null);
  const [leagueTierFilter, setLeagueTierFilter] = useState<string | undefined>(undefined);
  const [loadingLeague, setLoadingLeague] = useState(false);

  // Connect WebSocket when Battle tab is active
  useEffect(() => {
    if (activeTab !== "battle") return;
    let closed = false;

    const connect = async () => {
      const token = await getAuthTokenForWs();
      if (!token || closed) return;
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/arena?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!closed) setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "arena:connected") {
            setMyWsUid(msg.uid || "");
            setPublicLobbies(Array.isArray(msg.rooms) ? msg.rooms : []);
          } else if (msg.type === "room:list") {
            setPublicLobbies(Array.isArray(msg.rooms) ? msg.rooms : []);
          } else if (msg.type === "room:state") {
            setRoomState(msg.room);
          } else if (msg.type === "room:left") {
            setRoomState(null);
            setActiveQuestion(null);
            setRoundResult(null);
            setFinalRankings([]);
          } else if (msg.type === "round:question") {
            setRoomState(msg.room);
            setActiveQuestion(msg.question);
            setSelectedBattleOption(null);
            setRoundResult(null);
            setFinalRankings([]);
          } else if (msg.type === "round:result") {
            setRoomState(msg.room);
            setRoundResult({
              correctOption: msg.correctOption,
              explanation: msg.explanation,
            });
          } else if (msg.type === "match:finished") {
            setRoomState(msg.room);
            setFinalRankings(Array.isArray(msg.rankings) ? msg.rankings : []);
            arenaApi.getRecentMatches().then(setRecentMatches).catch(() => {});
          } else if (msg.type === "error") {
            showToast?.(msg.message || "Terjadi kesalahan pada ruang duel.", "error");
          }
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        if (!closed) setWsConnected(false);
      };
    };

    connect();
    arenaApi.getRecentMatches().then(setRecentMatches).catch(() => {});

    return () => {
      closed = true;
      try {
        wsRef.current?.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
      setWsConnected(false);
    };
  }, [activeTab]);

  // Live countdown for active Battle round
  useEffect(() => {
    if (!roomState || roomState.status !== "active" || !roomState.roundEndsAt) {
      setRoundSecondsLeft(0);
      return;
    }
    const tick = () => {
      const rem = Math.max(0, Math.ceil((roomState.roundEndsAt - Date.now()) / 1000));
      setRoundSecondsLeft(rem);
    };
    tick();
    const timer = setInterval(tick, 250);
    return () => clearInterval(timer);
  }, [roomState?.roundEndsAt, roomState?.status]);

  // Fetch Tryouts when Tryout tab active
  useEffect(() => {
    if (activeTab !== "tryout") return;
    setLoadingTryouts(true);
    arenaApi
      .listTryouts()
      .then((list) => setTryouts(Array.isArray(list) ? list : []))
      .catch(() => {})
      .finally(() => setLoadingTryouts(false));
  }, [activeTab]);

  // Countdown for active Tryout
  useEffect(() => {
    if (!activeTryout || tryoutReport) return;
    if (tryoutSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setTryoutSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          handleSubmitTryout();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTryout, tryoutReport, tryoutSecondsLeft > 0]);

  // Fetch League when League tab active
  useEffect(() => {
    if (activeTab !== "league") return;
    setLoadingLeague(true);
    arenaApi
      .getLeague(leagueTierFilter)
      .then((data) => setLeague(data))
      .catch(() => {})
      .finally(() => setLoadingLeague(false));
  }, [activeTab, leagueTierFilter]);

  const sendWs = (payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      showToast?.("Koneksi WebSocket Arena belum terhubung.", "error");
    }
  };

  const handleStartTryout = (pkg: TryoutPackage) => {
    setActiveTryout(pkg);
    setTryoutIdx(0);
    setTryoutAnswers({});
    setFlaggedIds([]);
    setTryoutReport(null);
    setTryoutSecondsLeft(pkg.durationMinutes * 60);
    setTryoutStartedAt(Date.now());
  };

  const handleSubmitTryout = async () => {
    if (!activeTryout || submittingTryout) return;
    setSubmittingTryout(true);
    const elapsed = Math.max(5, Math.round((Date.now() - tryoutStartedAt) / 1000));
    try {
      const res = await arenaApi.submitTryout(activeTryout.id, tryoutAnswers, elapsed);
      setTryoutReport({
        attempt: res.attempt,
        reviewItems: res.reviewItems,
        earnedXp: res.earnedXp,
        earnedGems: res.earnedGems,
      });
      if (res.profile) onProfileUpdate(res.profile);
      showToast?.(`Tryout selesai! Skor ${res.attempt.score}/100 (+${res.earnedXp} XP)`, "success");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal mengirim jawaban tryout.", "error");
    } finally {
      setSubmittingTryout(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 pb-16 lg:pb-8">
      {/* Editorial Header */}
      <div className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Arena Kompetitif &amp; Tryout Nasional
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Battle Quiz Real-Time, Tryout Akbar &amp; Liga Mingguan
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
              Uji kecepatan berpikir dalam duel WebSocket, kerjakan simulasi Tryout berbatas waktu dengan persentil nasional, dan naikkan divisi Liga Mingguan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-zinc-500 dark:text-zinc-400">
            <div>
              <span className="font-mono text-base font-semibold capitalize text-zinc-950 dark:text-zinc-50 block">
                {profile.leagueTier || "Bronze"}
              </span>
              <span>Divisi liga Anda</span>
            </div>
            <div className="h-7 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div>
              <span className="font-mono text-base font-semibold tabular-nums text-emerald-700 dark:text-emerald-400 block">
                {(profile.weeklyXp || 0).toLocaleString("id-ID")} XP
              </span>
              <span>Perolehan pekan ini</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[180px] bg-zinc-950 border-t lg:border-t-0 lg:border-l border-zinc-200/80 dark:border-zinc-800/80">
          <img
            src={resolveCourseImage("editorial_career_arena_1795521082924.jpg")}
            alt="Arena Kompetitif Skillora"
            className="w-full h-full object-cover opacity-90"
          />
        </div>
      </div>

      {/* Linear Underline Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200/90 dark:border-zinc-800/90 overflow-x-auto hide-scrollbar">
        {[
          { id: "battle", label: "Battle Quiz Real-Time", icon: Swords },
          { id: "tryout", label: "Tryout Akbar", icon: Timer },
          { id: "league", label: "Liga Mingguan", icon: Trophy },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`relative px-3.5 py-2.5 text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? "text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-600 dark:text-emerald-400" : ""}`} />
              {t.label}
              {isActive && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-emerald-600 dark:bg-emerald-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: BATTLE QUIZ REAL-TIME */}
      {activeTab === "battle" && (
        <div className="space-y-5">
          {/* Live WebSocket Status Line */}
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-2 font-mono">
              <Radio className={`w-3.5 h-3.5 ${wsConnected ? "text-emerald-500" : "text-zinc-400"}`} />
              {wsConnected ? "WebSocket Arena Terhubung (Server-Authoritative)" : "Menghubungkan ke Server Arena..."}
            </span>
            {roomState && (
              <button
                onClick={() => sendWs({ type: "room:leave" })}
                className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold hover:underline cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Keluar Ruang
              </button>
            )}
          </div>

          {!roomState ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Create or Join Room */}
              <div className="lg:col-span-7 bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-6 space-y-6">
                <div className="space-y-3">
                  <h2 className="font-display text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    Buat Ruang Duel Baru
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Undang teman dengan kode 6 karakter atau langsung mulai Sprint Solo berbatas waktu 15 detik/soal.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {BATTLE_TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setSelectedTopic(topic)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          selectedTopic === topic
                            ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                            : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        }`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={!wsConnected}
                    onClick={() => sendWs({ type: "room:create", topic: selectedTopic })}
                    className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium inline-flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    Buat Ruang &amp; Dapatkan Kode
                  </button>
                </div>

                <div className="pt-5 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Gabung dengan Kode Ruang
                  </h3>
                  <div className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      maxLength={6}
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: K7P9QA"
                      className="flex-1 h-9 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-sm uppercase tracking-widest text-zinc-950 dark:text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      disabled={!wsConnected || joinCode.trim().length < 4}
                      onClick={() => sendWs({ type: "room:join", roomCode: joinCode.trim() })}
                      className="h-9 px-4 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-medium disabled:opacity-50 cursor-pointer"
                    >
                      Gabung
                    </button>
                  </div>
                </div>
              </div>

              {/* Public Lobbies & Recent Matches */}
              <div className="lg:col-span-5 bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                <div className="p-5 space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">
                    Lobi terbuka saat ini ({publicLobbies.length})
                  </h3>
                  {publicLobbies.length === 0 ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 py-2">
                      Belum ada lobi terbuka. Buat ruang baru di samping untuk memulai.
                    </p>
                  ) : (
                    <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {publicLobbies.map((r) => (
                        <div key={r.roomCode} className="py-2.5 flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                              {r.topic} · <span className="font-mono">{r.roomCode}</span>
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              Host: {r.hostName} · {r.playerCount} peserta
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => sendWs({ type: "room:join", roomCode: r.roomCode })}
                            className="px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium hover:border-emerald-500 cursor-pointer transition-colors"
                          >
                            Masuk
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {recentMatches.length > 0 && (
                  <div className="p-5 space-y-3">
                    <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Riwayat pertandingan terakhir
                    </h3>
                    <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                      {recentMatches.slice(0, 5).map((m) => (
                        <div key={m.id} className="py-2 flex items-center justify-between text-xs">
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                              {m.winnerName || "Peserta"} · {m.topic}
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                              Ruang {m.roomCode} · {m.participants?.length || 1} pemain
                            </p>
                          </div>
                          <span className="font-mono text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                            {m.participants?.[0]?.score || 0} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : roomState.status === "lobby" ? (
            /* LOBBY SCREEN */
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    Lobi Battle Quiz · Topik {roomState.topic}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="font-mono text-3xl font-bold tracking-widest text-zinc-950 dark:text-white">
                      {roomState.roomCode}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(roomState.roomCode);
                        setCopiedRoomCode(true);
                        setTimeout(() => setCopiedRoomCode(false), 1800);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-medium flex items-center gap-1 cursor-pointer"
                    >
                      {copiedRoomCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedRoomCode ? "Disalin" : "Salin Kode"}
                    </button>
                  </div>
                </div>

                {roomState.hostUid === myWsUid ? (
                  <button
                    onClick={() => sendWs({ type: "room:start" })}
                    className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    Mulai Duel ({roomState.players.length} Peserta)
                  </button>
                ) : (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Menunggu Host memulai duel...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {roomState.players.map((p) => (
                  <div
                    key={p.uid}
                    className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center gap-3"
                  >
                    <span className="text-xl">{p.avatar}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">{p.name}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {p.isHost ? "Host Ruang" : "Siap Bertanding"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : roomState.status === "active" && activeQuestion ? (
            /* ACTIVE DUEL ROUND */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-500 dark:text-zinc-400">
                    Soal {roomState.currentIdx + 1}/{roomState.totalQuestions} · {activeQuestion.competencyTag}
                  </span>
                  <span
                    className={`font-mono text-base font-bold tabular-nums ${
                      roundSecondsLeft <= 5 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {roundSecondsLeft} dtk
                  </span>
                </div>

                <h2 className="font-display text-lg font-bold text-zinc-950 dark:text-white leading-snug">
                  {activeQuestion.prompt}
                </h2>

                <div className="space-y-2.5">
                  {activeQuestion.options.map((opt, idx) => {
                    const isPicked = selectedBattleOption === idx;
                    const isCorrectOpt = roundResult && roundResult.correctOption === idx;
                    const isWrongPicked = roundResult && isPicked && roundResult.correctOption !== idx;

                    return (
                      <button
                        key={idx}
                        disabled={selectedBattleOption !== null || roundResult !== null}
                        onClick={() => {
                          setSelectedBattleOption(idx);
                          sendWs({ type: "round:answer", optionIndex: idx });
                        }}
                        className={`w-full text-left p-3.5 rounded-lg border text-sm transition-colors flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${
                          isCorrectOpt
                            ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold"
                            : isWrongPicked
                            ? "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200"
                            : isPicked
                            ? "border-zinc-950 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800 font-semibold"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 text-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        <span>
                          <span className="font-mono text-xs text-zinc-400 mr-2.5">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          {opt}
                        </span>
                        {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                        {isWrongPicked && <XCircle className="w-4 h-4 text-rose-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {roundResult && (
                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    <strong className="font-semibold text-zinc-950 dark:text-white">Pembahasan: </strong>
                    {roundResult.explanation}
                  </div>
                )}
              </div>

              {/* Live Scoreboard */}
              <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Klasemen Langsung
                </h3>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {roomState.players.map((p, idx) => (
                    <div key={p.uid} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-zinc-400 w-4">{idx + 1}</span>
                        <span>{p.avatar}</span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{p.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.answered && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                        <span className="font-mono font-bold tabular-nums text-zinc-950 dark:text-white">
                          {p.score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* MATCH FINISHED PODIUM */
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                    Pertandingan Selesai · Ruang {roomState.roomCode}
                  </p>
                  <h2 className="font-display text-2xl font-bold text-zinc-950 dark:text-white mt-1">
                    Podium Akhir Battle Quiz
                  </h2>
                </div>
                <button
                  onClick={() => sendWs({ type: "room:leave" })}
                  className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold cursor-pointer"
                >
                  Kembali ke Lobi Arena
                </button>
              </div>

              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                {finalRankings.map((r) => (
                  <div key={r.uid} className="p-4 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-zinc-500 w-6">#{r.rank}</span>
                      <span className="text-xl">{r.avatar}</span>
                      <div>
                        <p className="font-semibold text-zinc-950 dark:text-white">{r.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                          {r.correctCount} benar · +{r.xpAwarded} XP
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      {r.score} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TRYOUT AKBAR */}
      {activeTab === "tryout" && (
        <div className="space-y-5">
          {!activeTryout ? (
            loadingTryouts ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tryouts.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 rounded-xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {pkg.category} · {pkg.questionCount} soal · {pkg.durationMinutes} mnt
                      </p>
                      <h3 className="font-display text-base font-semibold text-zinc-950 dark:text-zinc-50 leading-snug">
                        {pkg.title}
                      </h3>
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80">
                      {pkg.lastAttempt && (
                        <div className="flex items-center justify-between text-xs font-mono tabular-nums text-zinc-600 dark:text-zinc-300">
                          <span>Terakhir: {pkg.lastAttempt.score}/100</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                            Persentil {pkg.lastAttempt.percentile}%
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleStartTryout(pkg)}
                        className="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer transition-colors"
                      >
                        {pkg.lastAttempt ? "Ulangi Tryout Akbar" : "Mulai Tryout Akbar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : tryoutReport ? (
            /* TRYOUT RESULT & REVIEW */
            <div className="space-y-5">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                  <div>
                    <p className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                      Laporan Hasil Tryout Akbar
                    </p>
                    <h2 className="font-display text-xl font-bold text-zinc-950 dark:text-white mt-1">
                      {activeTryout.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTryout(null);
                      setTryoutReport(null);
                    }}
                    className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold cursor-pointer"
                  >
                    Kembali ke Daftar Tryout
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 block">Skor Akhir</span>
                    <span className="font-mono text-2xl font-bold tabular-nums text-zinc-950 dark:text-white">
                      {tryoutReport.attempt.score}/100
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 block">Persentil Nasional</span>
                    <span className="font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                      Top {Math.max(1, 100 - tryoutReport.attempt.percentile)}%
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 block">Jawaban Benar</span>
                    <span className="font-mono text-2xl font-bold tabular-nums text-zinc-950 dark:text-white">
                      {tryoutReport.attempt.correctCount}/{tryoutReport.attempt.totalQuestions}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-500 block">Reward</span>
                    <span className="font-mono text-2xl font-bold tabular-nums text-zinc-950 dark:text-white">
                      +{tryoutReport.earnedXp} XP
                    </span>
                  </div>
                </div>

                {/* Subtest Breakdown */}
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Akurasi per Subtes Kompetensi
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {tryoutReport.attempt.subtestScores.map((st, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-zinc-800 dark:text-zinc-200">{st.topic}</span>
                          <span className="font-mono tabular-nums text-zinc-500">
                            {st.correct}/{st.total} ({st.accuracy}%)
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${st.accuracy}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Question Review */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  Pembahasan Lengkap Soal
                </h3>
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {tryoutReport.reviewItems.map((item, idx) => (
                    <div key={item.id} className="py-4 space-y-1.5 text-xs">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {idx + 1}. {item.prompt}
                        </p>
                        <span
                          className={`font-semibold shrink-0 ${
                            item.isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {item.isCorrect ? "Benar" : "Salah"}
                        </span>
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ACTIVE TRYOUT RUNNER */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-5">
                {(() => {
                  const q = activeTryout.questions[tryoutIdx];
                  if (!q) return null;
                  const isFlagged = flaggedIds.includes(q.id);
                  return (
                    <>
                      <div className="flex items-center justify-between text-xs pb-3 border-b border-zinc-200 dark:border-zinc-800">
                        <span className="font-mono text-zinc-500">
                          Soal {tryoutIdx + 1}/{activeTryout.questions.length} · {q.competencyTag}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              setFlaggedIds((prev) =>
                                prev.includes(q.id) ? prev.filter((id) => id !== q.id) : [...prev, q.id]
                              )
                            }
                            className={`inline-flex items-center gap-1 text-xs font-medium cursor-pointer ${
                              isFlagged ? "text-amber-600 dark:text-amber-400" : "text-zinc-500"
                            }`}
                          >
                            <Flag className="w-3.5 h-3.5" />
                            {isFlagged ? "Ditandai" : "Tandai Ragu"}
                          </button>
                          <span className="font-mono font-bold tabular-nums text-zinc-950 dark:text-white">
                            {formatTimer(tryoutSecondsLeft)}
                          </span>
                        </div>
                      </div>

                      <h2 className="font-display text-lg font-bold text-zinc-950 dark:text-white leading-snug">
                        {q.prompt}
                      </h2>

                      <div className="space-y-2.5">
                        {q.options.map((opt, idx) => {
                          const selected = tryoutAnswers[q.id] === idx;
                          return (
                            <button
                              key={idx}
                              onClick={() => setTryoutAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                              className={`w-full text-left p-3.5 rounded-lg border text-sm transition-colors cursor-pointer ${
                                selected
                                  ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-zinc-950 dark:text-white font-semibold"
                                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 text-zinc-800 dark:text-zinc-200"
                              }`}
                            >
                              <span className="font-mono text-xs text-zinc-400 mr-2.5">
                                {String.fromCharCode(65 + idx)}.
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                          disabled={tryoutIdx === 0}
                          onClick={() => setTryoutIdx((i) => Math.max(0, i - 1))}
                          className="px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold disabled:opacity-40 cursor-pointer"
                        >
                          Sebelumnya
                        </button>
                        {tryoutIdx < activeTryout.questions.length - 1 ? (
                          <button
                            onClick={() => setTryoutIdx((i) => Math.min(activeTryout.questions.length - 1, i + 1))}
                            className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold cursor-pointer"
                          >
                            Soal Berikutnya
                          </button>
                        ) : (
                          <button
                            disabled={submittingTryout}
                            onClick={handleSubmitTryout}
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                          >
                            {submittingTryout ? "Mengumpulkan..." : "Selesai & Nilai Tryout"}
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Navigator Grid */}
              <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">Navigasi Nomor</span>
                  <span className="font-mono text-zinc-500">
                    {Object.keys(tryoutAnswers).length}/{activeTryout.questions.length} terjawab
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {activeTryout.questions.map((q, idx) => {
                    const answered = tryoutAnswers[q.id] !== undefined;
                    const flagged = flaggedIds.includes(q.id);
                    const current = idx === tryoutIdx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setTryoutIdx(idx)}
                        className={`h-9 rounded-lg font-mono text-xs font-semibold border transition-colors cursor-pointer ${
                          current
                            ? "border-zinc-950 dark:border-white bg-zinc-950 dark:bg-white text-white dark:text-zinc-950"
                            : flagged
                            ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                            : answered
                            ? "border-emerald-600/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
                            : "border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                <button
                  disabled={submittingTryout}
                  onClick={handleSubmitTryout}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                >
                  {submittingTryout ? "Memproses..." : "Kumpulkan Jawaban Sekarang"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LIGA MINGGUAN */}
      {activeTab === "league" && (
        <ArenaLeagueTab
          league={league}
          loading={loadingLeague}
          onSelectTier={(tierId) => setLeagueTierFilter(tierId)}
        />
      )}
    </div>
  );
}

export default ArenaView;
