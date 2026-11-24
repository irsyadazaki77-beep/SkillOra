import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Send,
  History,
  Award,
  CheckCircle2,
  Volume2,
  Radio,
  Briefcase,
  MessageSquare,
  Clock,
  Sparkles,
} from "lucide-react";
import { aiApi, getAuthTokenForWs, interviewApi, jobApi } from "../api/apiClient";
import { InterviewSessionRecord, InterviewTranscriptTurn, JobVacancy, Profile } from "../types";
import { playSound } from "../utils/sound";

interface VoiceInterviewViewProps {
  profile: Profile;
  jobs?: JobVacancy[];
  onProfileUpdate?: (profile: Profile) => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

function floatTo16BitBase64(float32: Float32Array): string {
  const int16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 0x8000;
  }
  return float32;
}

export function VoiceInterviewView({
  profile,
  jobs: propJobs,
  onProfileUpdate,
  showToast,
}: VoiceInterviewViewProps) {
  const [activeTab, setActiveTab] = useState<"studio" | "history">("studio");
  const [jobsList, setJobsList] = useState<JobVacancy[]>(propJobs || []);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [customJobTitle, setCustomJobTitle] = useState("Junior Frontend Engineer");
  const [customCompany, setCustomCompany] = useState("Perusahaan Mitra Skillora");
  const [mode, setMode] = useState<"voice" | "text">("voice");

  // Active Session States
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeJobTitle, setActiveJobTitle] = useState("");
  const [activeCompany, setActiveCompany] = useState("");
  const [wsStatus, setWsStatus] = useState<"idle" | "connecting" | "ready" | "closed">("idle");
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<InterviewTranscriptTurn[]>([]);
  const [textInput, setTextInput] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [sendingText, setSendingText] = useState(false);
  const [completedResult, setCompletedResult] = useState<InterviewSessionRecord | null>(null);
  const [history, setHistory] = useState<InterviewSessionRecord[]>([]);

  // Audio & WS Refs (avoid stale closures in onaudioprocess)
  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const isMicActiveRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const loadHistoryAndJobs = async () => {
    try {
      const h = await interviewApi.getHistory();
      setHistory(Array.isArray(h) ? h : []);
    } catch {
      // ignore
    }
    if (!propJobs || propJobs.length === 0) {
      try {
        const j = await jobApi.getJobs();
        setJobsList(Array.isArray(j) ? j : []);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    loadHistoryAndJobs();
    return () => {
      cleanupAudioAndWs();
    };
  }, []);

  useEffect(() => {
    if (!sessionId || completedResult) return;
    const timer = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [sessionId, completedResult]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const clearPlaybackQueue = () => {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // ignore
      }
    }
    activeSourcesRef.current = [];
    if (outputCtxRef.current) {
      nextPlayTimeRef.current = outputCtxRef.current.currentTime;
    }
    setIsAiSpeaking(false);
  };

  const playPcm24Chunk = (base64: string) => {
    const ctx = outputCtxRef.current;
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    const samples = base64Pcm16ToFloat32(base64);
    const buffer = ctx.createBuffer(1, samples.length, 24000);
    buffer.getChannelData(0).set(samples);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const startTime = Math.max(ctx.currentTime, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;
    setIsAiSpeaking(true);

    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      if (activeSourcesRef.current.length === 0) {
        setIsAiSpeaking(false);
      }
    };
  };

  const cleanupAudioAndWs = () => {
    isMicActiveRef.current = false;
    try {
      processorRef.current?.disconnect();
    } catch {
      // ignore
    }
    processorRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (inputCtxRef.current) {
      inputCtxRef.current.close().catch(() => {});
      inputCtxRef.current = null;
    }
    clearPlaybackQueue();
    if (outputCtxRef.current) {
      outputCtxRef.current.close().catch(() => {});
      outputCtxRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }
    setWsStatus("closed");
  };

  const appendTranscript = (speaker: "candidate" | "interviewer", text: string) => {
    if (!text.trim()) return;
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.speaker === speaker && Date.now() - new Date(last.timestamp).getTime() < 4000) {
        return [...prev.slice(0, -1), { ...last, text: `${last.text} ${text.trim()}`.trim() }];
      }
      return [...prev, { speaker, text: text.trim(), timestamp: new Date().toISOString() }];
    });
  };

  const handleStartSession = async () => {
    setStarting(true);
    setCompletedResult(null);
    setTranscript([]);
    setElapsedSeconds(0);

    const chosenJob = jobsList.find((j) => j.id === selectedJobId);
    const jobTitle = chosenJob?.title || customJobTitle;
    const companyName = chosenJob?.company || customCompany;

    try {
      const started = await interviewApi.start({
        jobId: chosenJob?.id,
        jobTitle,
        companyName,
        mode,
      });

      setSessionId(started.sessionId);
      setActiveJobTitle(started.jobTitle);
      setActiveCompany(started.companyName);

      if (mode === "voice") {
        setWsStatus("connecting");
        const token = await getAuthTokenForWs();
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/interview?sessionId=${encodeURIComponent(
          started.sessionId
        )}&token=${encodeURIComponent(token)}`;

        const outputCtx = new AudioContext({ sampleRate: 24000 });
        outputCtxRef.current = outputCtx;
        nextPlayTimeRef.current = outputCtx.currentTime;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "live:ready") {
              setWsStatus("ready");
            } else if (msg.type === "audio" && msg.data) {
              playPcm24Chunk(msg.data);
            } else if (msg.type === "transcript:candidate" && msg.text) {
              appendTranscript("candidate", msg.text);
            } else if (msg.type === "transcript:interviewer" && msg.text) {
              appendTranscript("interviewer", msg.text);
            } else if (msg.type === "interrupted") {
              clearPlaybackQueue();
            } else if (msg.type === "turnComplete") {
              setIsAiSpeaking(false);
            } else if (msg.type === "live:closed") {
              setWsStatus("closed");
            } else if (msg.type === "error") {
              showToast?.(msg.message || "Gangguan koneksi suara.", "error");
            }
          } catch {
            // ignore parse error
          }
        };

        ws.onerror = () => {
          showToast?.("WebSocket suara gagal terhubung. Anda tetap bisa memakai kolom teks.", "info");
        };

        // Start 16kHz Microphone Capture
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          const inputCtx = new AudioContext({ sampleRate: 16000 });
          inputCtxRef.current = inputCtx;
          const source = inputCtx.createMediaStreamSource(stream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;
          isMicActiveRef.current = true;
          setIsMicMuted(false);

          source.connect(processor);
          processor.connect(inputCtx.destination);

          processor.onaudioprocess = (e) => {
            if (!isMicActiveRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
              return;
            }
            const base64 = floatTo16BitBase64(e.inputBuffer.getChannelData(0));
            wsRef.current.send(JSON.stringify({ type: "audio", data: base64 }));
          };
        } catch {
          isMicActiveRef.current = false;
          setIsMicMuted(true);
          showToast?.("Izin mikrofon tidak tersedia. Gunakan input teks di bawah untuk menjawab.", "info");
        }
      } else {
        setWsStatus("ready");
        appendTranscript(
          "interviewer",
          `Halo ${profile.name}, saya Ibu Riska dari ${started.companyName}. Terima kasih sudah hadir dalam sesi wawancara untuk posisi ${started.jobTitle}. Bisa ceritakan pengalaman proyek terpenting yang pernah Anda tangani?`
        );
      }
      playSound("click");
    } catch (err: any) {
      showToast?.(err?.message || "Gagal memulai sesi wawancara.", "error");
    } finally {
      setStarting(false);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMicMuted;
    setIsMicMuted(nextMuted);
    isMicActiveRef.current = !nextMuted;
  };

  const handleSendText = async () => {
    const clean = textInput.trim();
    if (!clean || !sessionId || sendingText) return;
    setTextInput("");

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "text", text: clean }));
      return;
    }

    appendTranscript("candidate", clean);
    setSendingText(true);
    try {
      const targetJob = selectedJobId || "job-1";
      const res = await aiApi.hrInterview(targetJob, clean);
      appendTranscript("interviewer", res.response || "Terima kasih atas jawabannya.");
    } catch {
      showToast?.("Gagal mendapatkan tanggapan HRD.", "error");
    } finally {
      setSendingText(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!sessionId || completing) return;
    setCompleting(true);
    cleanupAudioAndWs();
    try {
      const res = await interviewApi.complete(sessionId, {
        transcript,
        durationSeconds: elapsedSeconds,
      });
      setCompletedResult(res.session);
      if (res.profile && onProfileUpdate) {
        onProfileUpdate(res.profile);
      }
      playSound("levelUp");
      showToast?.("Evaluasi rubrik wawancara selesai! +75 XP ditambahkan.", "success");
      loadHistoryAndJobs();
    } catch (err: any) {
      showToast?.(err?.message || "Gagal menyelesaikan evaluasi wawancara.", "error");
    } finally {
      setCompleting(false);
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Radio className="w-4 h-4" />
            <span>Mock Interview Suara Real-Time · Gemini Live 3.8</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Studio Simulasi Wawancara HRD & Teknis
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Berlatih tanya jawab langsung via mikrofon atau teks bersama pewawancara AI Ibu Riska, lengkap dengan transkrip otomatis dan penilaian rubrik komunikasi, STAR, serta teknis.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("studio")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "studio"
                ? "bg-amber-500 text-slate-950"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> Studio Wawancara
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("history");
              loadHistoryAndJobs();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "history"
                ? "bg-amber-500 text-slate-950"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5" /> Riwayat ({history.length})
          </button>
        </div>
      </div>

      {activeTab === "history" ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Riwayat & Rapor Mock Interview
          </h2>
          {history.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              Belum ada sesi mock interview yang diselesaikan.
            </p>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.sessionId}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {item.jobTitle} — {item.companyName}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Mode: {item.mode === "voice" ? "Suara Live" : "Teks"} ·{" "}
                        {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {item.overallScore !== null && item.overallScore !== undefined && (
                      <div className="flex items-center gap-3 text-xs font-bold tabular-nums">
                        <span className="px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Overall: {item.overallScore}/100
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">
                          STAR: {item.starScore} · Teknis: {item.technicalScore}
                        </span>
                      </div>
                    )}
                  </div>
                  {item.summaryFeedback && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.summaryFeedback}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : completedResult ? (
        /* Rubric Result View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <Award className="w-4 h-4" /> Hasil Penilaian Direktur Rekrutmen AI
              </span>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {completedResult.jobTitle} · {completedResult.companyName}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                setSessionId(null);
                setCompletedResult(null);
              }}
              className="px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold cursor-pointer self-start"
            >
              Latihan Sesi Baru
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Skor Keseluruhan", val: completedResult.overallScore || 0 },
              { label: "Komunikasi", val: completedResult.communicationScore || 0 },
              { label: "Metode STAR", val: completedResult.starScore || 0 },
              { label: "Kedalaman Teknis", val: completedResult.technicalScore || 0 },
            ].map((card) => (
              <div
                key={card.label}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800"
              >
                <span className="text-xs text-slate-500 block">{card.label}</span>
                <span className="font-display text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {card.val}/100
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Ringkasan Evaluasi</h3>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {completedResult.summaryFeedback}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <h3 className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Kekuatan Kandidat
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                {(completedResult.strengths || []).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-2">
              <h3 className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Area Peningkatan
              </h3>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                {(completedResult.improvements || []).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : !sessionId ? (
        /* Setup Screen */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-amber-500" />
              <span>Target Lowongan & Posisi Wawancara</span>
            </h2>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Pilih dari Lowongan Bursa Kerja (Opsional)
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedJobId(id);
                  const found = jobsList.find((j) => j.id === id);
                  if (found) {
                    setCustomJobTitle(found.title);
                    setCustomCompany(found.company);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
              >
                <option value="">Kustom — Tentukan Posisi & Perusahaan Sendiri</option>
                {jobsList.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} · {j.company}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Nama Posisi
                </label>
                <input
                  type="text"
                  value={customJobTitle}
                  onChange={(e) => setCustomJobTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Perusahaan Target
                </label>
                <input
                  type="text"
                  value={customCompany}
                  onChange={(e) => setCustomCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                Mode Interaksi Wawancara
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMode("voice")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                    mode === "voice"
                      ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-2 ring-amber-500/20"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <Mic className="w-4 h-4 text-amber-600" />
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Suara Real-Time</p>
                  <p className="text-xs text-slate-500">Streaming audio 2 arah via WebSocket</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode("text")}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                    mode === "text"
                      ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-2 ring-amber-500/20"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <p className="font-bold text-xs text-slate-900 dark:text-white">Teks Interaktif</p>
                  <p className="text-xs text-slate-500">Simulasi chat HRD tanpa mikrofon</p>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartSession}
              disabled={starting}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4" />
              <span>{starting ? "Menghubungkan Studio..." : "Mulai Sesi Wawancara"}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Active Interview Studio */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  {wsStatus === "connecting"
                    ? "Menghubungkan Gemini Live..."
                    : wsStatus === "ready"
                    ? "Sesi Aktif"
                    : "Sesi Tertutup"}
                </span>
                <h2 className="font-display text-lg font-bold mt-0.5">{activeJobTitle}</h2>
                <p className="text-xs text-slate-400">{activeCompany} · Ibu Riska (HRD Lead)</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold tabular-nums">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{formatDuration(elapsedSeconds)}</span>
              </div>
            </div>

            {/* Speaking Visualizer */}
            <div className="py-8 flex flex-col items-center justify-center space-y-4 bg-slate-950/50 rounded-2xl border border-slate-800">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all border-2 ${
                  isAiSpeaking
                    ? "bg-amber-500/20 border-amber-400 scale-105"
                    : !isMicMuted && mode === "voice"
                    ? "bg-emerald-500/20 border-emerald-400"
                    : "bg-slate-800 border-slate-700"
                }`}
              >
                {isAiSpeaking ? (
                  <Volume2 className="w-8 h-8 text-amber-400" />
                ) : (
                  <Mic className={`w-8 h-8 ${isMicMuted ? "text-slate-500" : "text-emerald-400"}`} />
                )}
              </div>
              <p className="text-xs font-semibold text-slate-300 text-center px-4">
                {isAiSpeaking
                  ? "Ibu Riska sedang berbicara..."
                  : mode === "voice"
                  ? isMicMuted
                    ? "Mikrofon dinonaktifkan (gunakan tombol Mic atau kirim teks)"
                    : "Mikrofon aktif — silakan jawab pertanyaan dengan jelas"
                  : "Mode Teks Aktif — kirim jawaban Anda di panel sebelah"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {mode === "voice" && (
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border cursor-pointer ${
                    isMicMuted
                      ? "bg-slate-800 text-slate-300 border-slate-700"
                      : "bg-emerald-600 text-white border-emerald-500"
                  }`}
                >
                  {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  <span>{isMicMuted ? "Aktifkan Mic" : "Matikan Mic"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCompleteSession}
                disabled={completing}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <PhoneOff className="w-4 h-4" />
                <span>{completing ? "Menilai..." : "Akhiri & Nilai"}</span>
              </button>
            </div>
          </div>

          {/* Transcript & Text Fallback */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col h-[520px] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Transkrip Wawancara Langsung
              </span>
              <span className="text-xs text-slate-400 tabular-nums">{transcript.length} Giliran</span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {transcript.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-12">
                  Menunggu sapaan pembuka dari pewawancara...
                </p>
              ) : (
                transcript.map((turn, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      turn.speaker === "candidate" ? "items-end" : "items-start"
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-400 mb-1">
                      {turn.speaker === "candidate" ? profile.name : "Ibu Riska (HRD)"}
                    </span>
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        turn.speaker === "candidate"
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none"
                      }`}
                    >
                      {turn.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={transcriptEndRef} />
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Ketik jawaban wawancara Anda (atau gunakan suara)..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSendText}
                disabled={!textInput.trim() || sendingText}
                className="px-4 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingText ? "..." : "Kirim"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoiceInterviewView;
