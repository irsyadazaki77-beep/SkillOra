import { useState, useRef, useEffect } from "react";
import { X, Trash2, Bot, BookOpen, Send, Terminal, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation } from "react-router-dom";
import { studyApi } from "../api/apiClient";

interface CopilotMessage {
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface CopilotContextInfo {
  courseTitle?: string;
  lessonTitle?: string;
  labTitle?: string;
  codeSnippet?: string;
}

interface MentorChatSidebarProps {
  open: boolean;
  onClose: () => void;
  currentCourseTitle?: string;
  currentLessonTitle?: string;
  copilotContext?: CopilotContextInfo;
}

const MAX_INPUT_LENGTH = 500;

export function MentorChatSidebar({
  open,
  onClose,
  currentCourseTitle,
  currentLessonTitle,
  copilotContext,
}: MentorChatSidebarProps) {
  const location = useLocation();
  const activeCourse = copilotContext?.courseTitle || currentCourseTitle;
  const activeLesson = copilotContext?.lessonTitle || currentLessonTitle;
  const activeLab = copilotContext?.labTitle;

  const [messages, setMessages] = useState<CopilotMessage[]>(() => {
    try {
      const saved = localStorage.getItem("skillora_copilot_history_v1");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage error
    }
    return [
      {
        sender: "assistant",
        text: "Halo. Saya Skillora Study Copilot. Tanyakan konsep materi, minta bantuan debugging kode di Lab Interaktif, atau susun strategi karier Anda.",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem("skillora_copilot_history_v1", JSON.stringify(messages.slice(-30)));
    } catch {
      // ignore quota error
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [messages, open, onClose]);

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    const fresh: CopilotMessage[] = [
      {
        sender: "assistant",
        text: "Riwayat percakapan telah dibersihkan. Apa yang ingin Anda pelajari atau diskusikan sekarang?",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      },
    ];
    setMessages(fresh);
    setConfirmClear(false);
    localStorage.removeItem("skillora_copilot_history_v1");
  };

  const handleSend = async (customText?: string) => {
    const raw = (customText ?? input).trim();
    if (!raw || loading) return;

    const clean = raw.slice(0, MAX_INPUT_LENGTH);
    const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [...prev, { sender: "user", text: clean, timestamp: now }]);
    if (!customText) setInput("");
    setConfirmClear(false);
    setLoading(true);

    try {
      const data = await studyApi.copilotChat(clean, {
        pagePath: location.pathname,
        courseTitle: activeCourse,
        lessonTitle: activeLesson,
        labTitle: activeLab,
        codeSnippet: copilotContext?.codeSnippet,
      });
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: data.response,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "assistant",
          text: err?.message || "Koneksi ke Study Copilot sedang sibuk. Silakan coba kirim ulang.",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = activeLab
    ? [
        `Beri hint pendekatan untuk lab "${activeLab}" tanpa memberi jawaban langsung`,
        "Apa edge case penting yang sering terlewat pada tantangan ini?",
        "Tinjau kompleksitas waktu dan kebersihan solusi saya",
      ]
    : activeCourse
    ? [
        `Ringkas konsep inti ${activeLesson || activeCourse} dalam 3 poin`,
        `Beri contoh penerapan nyata ${activeLesson || activeCourse} di industri`,
        "Uji pemahaman saya dengan 1 pertanyaan kasus singkat",
      ]
    : [
        "Bantu susun prioritas skill minggu ini agar siap magang/kerja",
        "Jelaskan cara menonjolkan proyek dan skor lab di CV ATS",
        "Beri 1 latihan kasus interview teknis untuk posisi target saya",
      ];

  const renderMarkdownLite = (text: string) => {
    return text.split("\n").map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*|`[^`]+`)/g).map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-zinc-950 dark:text-white">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={pIdx}
              className="font-mono text-[11px] px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      if (line.trim().startsWith("- ") || line.trim().startsWith("* ") || line.trim().startsWith("•")) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">·</span>
            <div className="flex-1">{parts}</div>
          </div>
        );
      }

      if (!line.trim()) return <div key={idx} className="h-2" />;
      return (
        <p key={idx} className="my-1">
          {parts}
        </p>
      );
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-60"
          />

          <motion.aside
            aria-label="Skillora Study Copilot"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-70 flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-950 dark:text-white truncate">
                    Study Copilot
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    Kontekstual · Materi, Lab & Karier
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                    confirmClear
                      ? "bg-rose-600 text-white"
                      : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                  title="Hapus riwayat percakapan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {confirmClear && <span>Yakin hapus?</span>}
                </button>
                <button
                  onClick={onClose}
                  aria-label="Tutup Study Copilot"
                  className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Active Workspace Context Strip */}
            {(activeLab || activeCourse) && (
              <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                {activeLab ? (
                  <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <span className="truncate">
                  Konteks aktif:{" "}
                  <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {activeLab || activeCourse}
                  </strong>
                  {activeLesson ? ` · ${activeLesson}` : ""}
                </span>
              </div>
            )}

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Contextual Prompt Suggestions */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50/70 dark:bg-zinc-900/40 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Saran Pertanyaan Kontekstual
                </p>
                <div className="space-y-1.5">
                  {quickPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      disabled={loading}
                      onClick={() => handleSend(prompt)}
                      className="w-full text-left text-xs text-zinc-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 px-3 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message List */}
              {messages.map((msg, idx) => {
                const isUser = msg.sender === "user";
                return (
                  <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        isUser
                          ? "bg-zinc-900 dark:bg-emerald-600 text-white"
                          : "bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-70 font-mono">
                        <span>{isUser ? "Anda" : "Copilot"}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      {isUser ? <p className="whitespace-pre-wrap">{msg.text}</p> : renderMarkdownLite(msg.text)}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Menyusun penjelasan...
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Composer */}
            <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono tabular-nums">
                <span>Tekan Enter untuk kirim</span>
                <span>
                  {input.length}/{MAX_INPUT_LENGTH}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={MAX_INPUT_LENGTH}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={loading}
                  placeholder="Tanyakan konsep, kode, atau strategi karier..."
                  aria-label="Tulis pesan ke Study Copilot"
                  className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={loading || !input.trim()}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Kirim
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
