import { useState } from "react";
import { Sparkles, Send, Bot, ShieldCheck, CheckCircle2, AlertTriangle } from "lucide-react";
import { playSound } from "../../utils/sound";
import { aiApi, trainingApi } from "../../api/apiClient";
import { Profile, StarEvaluationResult } from "../../types";

interface SimulasiSTARTabProps {
  onProfileUpdate?: (profile: Profile) => void;
  onSimulationRecorded?: () => void;
  showToast?: (message: string, type?: "success" | "error" | "info") => void;
}

const STAR_PROMPTS = [
  "Ceritakan pengalaman Anda saat terjadi perbedaan pendapat tajam dalam tim proyek. Bagaimana Anda menyelesaikannya?",
  "Ceritakan situasi ketika tenggat waktu proyek dimajukan mendadak sementara sumber daya terbatas. Apa langkah konkret Anda?",
  "Pernahkah Anda menemukan kesalahan data atau prosedur yang berisiko merugikan organisasi? Bagaimana Anda menanganinya?",
  "Ceritakan proyek paling menantang di mana Anda memimpin inisiatif lintas divisi hingga menghasilkan dampak terukur.",
];

export function SimulasiSTARTab({
  onProfileUpdate,
  onSimulationRecorded,
  showToast,
}: SimulasiSTARTabProps) {
  const [interviewMode, setInterviewMode] = useState<"star_form" | "hr_chat">("star_form");
  const [targetRole, setTargetRole] = useState("Management Trainee / Software Engineer BUMN");
  const [question, setQuestion] = useState(STAR_PROMPTS[0]);
  const [situation, setSituation] = useState("");
  const [taskText, setTaskText] = useState("");
  const [action, setAction] = useState("");
  const [resultText, setResultText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [evaluation, setEvaluation] = useState<StarEvaluationResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // HR Chat State
  const [chatMessages, setChatMessages] = useState<{ sender: "hr" | "user"; text: string }[]>([
    {
      sender: "hr",
      text: "Halo! Saya Ibu Riska, Talent Acquisition Manager BUMN. Selamat datang di sesi wawancara interaktif. Bisakah Anda memperkenalkan diri secara ringkas dan menjelaskan kontribusi terbesar Anda sejauh ini?",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleEvaluateStar = async () => {
    if (!situation.trim() || !action.trim() || !resultText.trim()) {
      setFormError("Harap lengkapi minimal poin Situation, Action, dan Result sebelum evaluasi AI.");
      return;
    }
    setFormError(null);
    setIsAnalyzing(true);
    playSound("click");

    const composedAnswer = [
      `Situation: ${situation.trim()}`,
      taskText.trim() ? `Task: ${taskText.trim()}` : "",
      `Action: ${action.trim()}`,
      `Result: ${resultText.trim()}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      const data = await trainingApi.evaluateStar({
        question,
        answer: composedAnswer,
        role: targetRole,
      });
      if (data.evaluation) {
        setEvaluation(data.evaluation);
        if (data.profile) onProfileUpdate?.(data.profile);
        onSimulationRecorded?.();
        playSound("levelUp");
        showToast?.(
          `Evaluasi STAR AI selesai! Skor ${data.evaluation.overallScore}/100 tersimpan.`,
          "success"
        );
      }
    } catch (err: any) {
      setFormError(err?.message || "Gagal mengevaluasi jawaban STAR melalui AI. Silakan coba lagi.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const data = await aiApi.hrInterview("job-1", userMsg);
      if (data.response) {
        setChatMessages((prev) => [...prev, { sender: "hr", text: data.response }]);
        playSound("correct");
      }
    } catch (err: any) {
      showToast?.(err?.message || "Gagal mengirim pesan ke pewawancara AI.", "error");
    } finally {
      setIsChatLoading(false);
    }
  };

  const starDimensions = evaluation
    ? [
        { label: "Situation", score: evaluation.situationScore },
        { label: "Task", score: evaluation.taskScore },
        { label: "Action", score: evaluation.actionScore },
        { label: "Result", score: evaluation.resultScore },
        { label: "Quantification", score: evaluation.quantificationScore },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-fit border border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setInterviewMode("star_form")}
          className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            interviewMode === "star_form"
              ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
          }`}
        >
          Rubrik STAR & Assessor AI
        </button>
        <button
          type="button"
          onClick={() => setInterviewMode("hr_chat")}
          className={`px-3.5 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            interviewMode === "hr_chat"
              ? "bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
          }`}
        >
          Simulasi Chat HRD BUMN
        </button>
      </div>

      {interviewMode === "star_form" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left 6 Cols: STAR Input Form */}
          <div className="lg:col-span-6 p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Asesmen Wawancara Perilaku (STAR)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Posisi Target
              </label>
              <input
                aria-label="Posisi target wawancara"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Pertanyaan Wawancara
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (STAR_PROMPTS.indexOf(question) + 1) % STAR_PROMPTS.length;
                    setQuestion(STAR_PROMPTS[nextIdx]);
                  }}
                  className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Ganti Pertanyaan
                </button>
              </div>
              <textarea
                aria-label="Pertanyaan wawancara STAR"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  1. Situation (Konteks & Tantangan)
                </label>
                <textarea
                  aria-label="Situation"
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  placeholder="Jelaskan konteks proyek, skala tim, dan masalah utama yang muncul..."
                  rows={2}
                  className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white mt-1 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  2. Task (Tanggung Jawab & Target Anda)
                </label>
                <textarea
                  aria-label="Task"
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  placeholder="Apa peran spesifik dan target KPI yang harus Anda capai?"
                  rows={2}
                  className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white mt-1 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  3. Action (Keputusan & Langkah Konkret Pribadi)
                </label>
                <textarea
                  aria-label="Action"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="Fokus pada tindakan spesifik yang Anda ambil (gunakan sudut pandang 'Saya')..."
                  rows={3}
                  className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white mt-1 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  4. Result (Dampak Terukur & Pembelajaran)
                </label>
                <textarea
                  aria-label="Result"
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  placeholder="Sertakan angka dampak (efisiensi %, waktu, biaya, atau kepuasan stakeholder)..."
                  rows={2}
                  className="w-full p-3 text-xs bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white mt-1 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium"
              >
                {formError}
              </div>
            )}

            <button
              type="button"
              onClick={handleEvaluateStar}
              disabled={isAnalyzing}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAnalyzing ? "Mengevaluasi dengan AI Assessor..." : "Evaluasi Jawaban STAR dengan AI"}</span>
            </button>
          </div>

          {/* Right 6 Cols: 5-Dimension AI Scorecard */}
          <div className="lg:col-span-6 p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-display font-bold text-sm text-zinc-950 dark:text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Laporan Rubrik Assessor AI (5 Dimensi)</span>
              </h3>
              {evaluation && (
                <span className="font-mono font-bold text-lg tabular-nums text-emerald-700 dark:text-emerald-400">
                  {evaluation.overallScore}/100
                </span>
              )}
            </div>

            {evaluation ? (
              <div className="space-y-4 text-xs">
                {/* 5-Dimension Progress Bars */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {starDimensions.map((dim) => (
                    <div
                      key={dim.label}
                      className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {dim.label}
                        </span>
                        <span className="font-mono font-bold tabular-nums text-zinc-900 dark:text-white">
                          {dim.score}/100
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            dim.score >= 75 ? "bg-emerald-600" : "bg-amber-500"
                          }`}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Kekuatan Utama
                    </span>
                    <ul className="space-y-1 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {(evaluation.strengths || []).map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                    <span className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Area Perbaikan
                    </span>
                    <ul className="space-y-1 text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {(evaluation.improvements || []).map((item, idx) => (
                        <li key={idx}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Revised Answer Example */}
                {evaluation.revisedExample && (
                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                    <span className="font-semibold text-zinc-950 dark:text-white block">
                      Contoh Revisi Jawaban Level Senior:
                    </span>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                      {evaluation.revisedExample}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-14 text-center text-zinc-400 space-y-2">
                <Sparkles className="w-7 h-7 mx-auto opacity-50" />
                <p className="text-xs max-w-xs mx-auto leading-relaxed">
                  Lengkapi struktur STAR di sebelah kiri dan klik Evaluasi AI untuk menerima penilaian 5 dimensi dan contoh jawaban level senior.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4 max-w-3xl mx-auto">
          <div className="h-80 overflow-y-auto space-y-3 p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-md p-3 rounded-xl text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950"
                      : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="text-xs text-zinc-500 italic">Ibu Riska sedang mengetik balasan...</div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              aria-label="Balasan wawancara HRD"
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
              placeholder="Tulis respon Anda untuk HRD..."
              className="flex-1 px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              aria-label="Kirim pesan"
              onClick={handleSendChatMessage}
              disabled={isChatLoading}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
