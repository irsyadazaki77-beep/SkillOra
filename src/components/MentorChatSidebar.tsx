import { useState, useRef, useEffect } from "react";
import { X, Trash2, Sparkles, BookOpen, Send, AlertCircle, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { aiApi } from "../api/apiClient";

interface MentorMessage {
  sender: "user" | "owl";
  text: string;
  isMock?: boolean;
  timestamp?: string;
}

interface MentorChatSidebarProps {
  open: boolean;
  onClose: () => void;
  currentCourseTitle?: string;
  currentLessonTitle?: string;
}

const MAX_INPUT_LENGTH = 300;
const MAX_REQUESTS_PER_SESSION = 15;

export function MentorChatSidebar({
  open,
  onClose,
  currentCourseTitle,
  currentLessonTitle
}: MentorChatSidebarProps) {
  const [mentorMessages, setMentorMessages] = useState<MentorMessage[]>(() => {
    try {
      const saved = localStorage.getItem("skillora_mentor_messages_v2");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        sender: "owl",
        text: "Hoot! Saya Duo Owl AI Mentor. Siap mendampingi Anda belajar koding dan mempersiapkan karir industri! 🦉",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      },
    ];
  });

  const [mentorInput, setMentorInput] = useState("");
  const [loadingMentor, setLoadingMentor] = useState(false);
  const [requestCount, setRequestCount] = useState<number>(() => {
    return Number(localStorage.getItem("skillora_mentor_req_count")) || 0;
  });

  const mentorEndRef = useRef<HTMLDivElement>(null);

  // Save history on changes
  useEffect(() => {
    localStorage.setItem("skillora_mentor_messages_v2", JSON.stringify(mentorMessages));
  }, [mentorMessages]);

  useEffect(() => {
    localStorage.setItem("skillora_mentor_req_count", requestCount.toString());
  }, [requestCount]);

  // Auto scroll & Escape key listener
  useEffect(() => {
    if (open) {
      mentorEndRef.current?.scrollIntoView({ behavior: "smooth" });

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [mentorMessages, open, onClose]);

  const handleClearHistory = () => {
    if (confirm("Hapus semua riwayat percakapan dengan AI Mentor?")) {
      const resetMsg: MentorMessage[] = [
        {
          sender: "owl",
          text: "Riwayat telah dibersihkan! Silakan ajukan pertanyaan baru seputar koding atau karir. 🦉",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        }
      ];
      setMentorMessages(resetMsg);
      localStorage.removeItem("skillora_mentor_messages_v2");
    }
  };

  const handleSendMentorMessage = async (customText?: string) => {
    const textToSend = customText || mentorInput;
    if (!textToSend.trim() || loadingMentor) return;

    if (requestCount >= MAX_REQUESTS_PER_SESSION) {
      const timeNow = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      setMentorMessages((prev) => [
        ...prev,
        {
          sender: "owl",
          text: `⚠️ Anda telah mencapai batas kuota ${MAX_REQUESTS_PER_SESSION} pertanyaan per sesi. Muat ulang halaman atau coba lagi nanti ya! 🦉`,
          timestamp: timeNow,
        },
      ]);
      return;
    }

    const trimmedText = textToSend.trim().slice(0, MAX_INPUT_LENGTH);
    const timeNow = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    setMentorMessages((prev) => [...prev, { sender: "user", text: trimmedText, timestamp: timeNow }]);
    setMentorInput("");
    setLoadingMentor(true);
    setRequestCount((prev) => prev + 1);

    try {
      const data = await aiApi.mentorChat(trimmedText, {
        courseTitle: currentCourseTitle,
        lessonTitle: currentLessonTitle
      });

      setMentorMessages((prev) => [
        ...prev,
        {
          sender: "owl",
          text: data.response,
          isMock: data.isMock,
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (e) {
      console.error(e);
      setMentorMessages((prev) => [
        ...prev,
        {
          sender: "owl",
          text: "Maaf, koneksi AI sedang sibuk hoot! Silakan coba kirim ulang pertanyaanmu.",
          timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
        },
      ]);
    } finally {
      setLoadingMentor(false);
    }
  };

  // Contextual recommended questions
  const recommendations = currentCourseTitle
    ? [
        `Jelaskan konsep utama di ${currentCourseTitle}`,
        `Berikan contoh kode terbaik untuk ${currentLessonTitle || 'materi ini'}`,
        `Bagaimana cara debug error paling umum di topik ini?`
      ]
    : [
        "Bagaimana cara membuat CV developer lolos ATS?",
        "Saran membuat portofolio koding bernilai tinggi",
        "Tips menjawab pertanyaan interview teknis sulit"
      ];

  // Helper to format structured text output (supporting bold and bullet points)
  const renderStructuredText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      let content = line;
      
      // Parse bold **word**
      const parts = content.split(/(\*\*.*?\*\*)/g).map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={pIdx} className="font-extrabold text-slate-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.trim().startsWith("•") || line.trim().startsWith("-") || line.trim().startsWith("*")) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-1">
            <span className="text-amber-500 font-bold shrink-0">•</span>
            <div className="flex-1">{parts}</div>
          </div>
        );
      }

      if (line.trim().startsWith("###") || line.trim().startsWith("##")) {
        return (
          <h4 key={idx} className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider mt-2 mb-1 border-b border-slate-100 pb-1">
            {line.replace(/^#+\s*/, "")}
          </h4>
        );
      }

      if (!line.trim()) return <div key={idx} className="h-2" />;

      return <p key={idx} className="my-1">{parts}</p>;
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 z-50 backdrop-blur-xs"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col justify-between font-sans"
          >
            {/* Header */}
            <div className="bg-slate-900 p-4 flex items-center justify-between text-white shadow-md shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                  🦉
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
                    Duo Owl AI Mentor
                    <span className="bg-amber-400 text-slate-950 text-xs font-black px-1.5 py-0.5 rounded uppercase">
                      ONLINE
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {currentCourseTitle ? `Konstruksi Context: ${currentCourseTitle}` : "Mentor Karir & Koding Real-time"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button aria-label="Aksi Trash2"
                  onClick={handleClearHistory}
                  className="p-2 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
                  title="Hapus Riwayat Chat"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button aria-label="Aksi X"
                  onClick={onClose}
                  className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
                  title="Tutup Panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Context Badge Banner */}
            {currentCourseTitle && (
              <div className="bg-blue-50 dark:bg-blue-950/60 border-b border-blue-200 dark:border-blue-800 p-2.5 px-4 flex items-center gap-2 text-xs text-blue-800 dark:text-blue-300">
                <BookOpen className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                <span className="truncate font-semibold">
                  Materi Aktif: <strong>{currentCourseTitle}</strong> {currentLessonTitle ? `(${currentLessonTitle})` : ""}
                </span>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
              {/* Quick Recommendations */}
              <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Rekomendasi Pertanyaan:
                  </span>
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                    Sisa Kuota: {Math.max(0, MAX_REQUESTS_PER_SESSION - requestCount)}/{MAX_REQUESTS_PER_SESSION}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 pt-0.5">
                  {recommendations.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMentorMessage(q)}
                      disabled={loadingMentor || requestCount >= MAX_REQUESTS_PER_SESSION}
                      className="text-left text-xs text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2 rounded-xl transition-all hover:border-blue-300 shadow-2xs cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat bubbles */}
              {mentorMessages.map((msg, idx) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={idx}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed border shadow-xs ${
                        isUser
                          ? "bg-blue-600 text-white border-blue-600 rounded-tr-none font-medium"
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 rounded-tl-none"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span
                          className={`font-black text-xs uppercase tracking-wider ${
                            isUser ? "text-blue-200" : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {isUser ? "Anda" : "🦉 Duo Owl AI Mentor"}
                        </span>
                        {msg.timestamp && (
                          <span className={`text-xs ${isUser ? "text-blue-200" : "text-slate-400"}`}>
                            {msg.timestamp}
                          </span>
                        )}
                      </div>

                      <div className="text-xs">
                        {isUser ? <p className="whitespace-pre-wrap">{msg.text}</p> : renderStructuredText(msg.text)}
                      </div>
                    </div>
                  </div>
                );
              })}

              {loadingMentor && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 px-4 text-xs text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center gap-2 rounded-tl-none font-bold">
                    <span>🦉 Owl sedang menyusun jawaban terstruktur...</span>
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                  </div>
                </div>
              )}
              <div ref={mentorEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shrink-0">
              <div className="flex justify-between items-center text-xs text-slate-400 font-bold px-1">
                <span>Maksimal {MAX_INPUT_LENGTH} karakter</span>
                <span className={mentorInput.length >= MAX_INPUT_LENGTH ? "text-red-500 font-black" : ""}>
                  {mentorInput.length}/{MAX_INPUT_LENGTH}
                </span>
              </div>

              
            <div className="flex gap-2 pb-2 overflow-x-auto px-1 no-scrollbar">
               <button onClick={() => handleSendMentorMessage("Explain: Tolong jelaskan materi ini dengan bahasa yang sangat sederhana layaknya menjelaskan ke pemula.")} className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold text-xs rounded-full whitespace-nowrap hover:bg-amber-200">✨ Explain</button>
               <button onClick={() => handleSendMentorMessage("Hint: Berikan petunjuk atau hint untuk materi ini tanpa memberikan jawaban langsung.")} className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold text-xs rounded-full whitespace-nowrap hover:bg-emerald-200">💡 Hint</button>
               <button onClick={() => handleSendMentorMessage("Quiz Me: Uji pemahaman saya tentang materi ini dengan 1 pertanyaan pilihan ganda yang menantang.")} className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-bold text-xs rounded-full whitespace-nowrap hover:bg-blue-200">🎯 Quiz Me</button>
            </div>
            <div className="flex gap-2">
              <input aria-label="Tanyakan hal seputar materi atau karir..."
                  type="text"
                  maxLength={MAX_INPUT_LENGTH}
                  placeholder="Tanyakan hal seputar materi atau karir..."
                  value={mentorInput}
                  onChange={(e) => setMentorInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMentorMessage()}
                  disabled={loadingMentor || requestCount >= MAX_REQUESTS_PER_SESSION}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium text-slate-900 dark:text-white disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendMentorMessage()}
                  disabled={loadingMentor || !mentorInput.trim() || requestCount >= MAX_REQUESTS_PER_SESSION}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm shrink-0 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

