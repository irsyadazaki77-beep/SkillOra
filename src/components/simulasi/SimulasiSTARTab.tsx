import { useState } from "react";
import { Sparkles, MessageSquare, Mic, Send, Bot, ShieldCheck, CheckCircle2 } from "lucide-react";
import { playSound } from "../../utils/sound";
import { aiApi } from "../../api/apiClient";

export function SimulasiSTARTab() {
  const [interviewMode, setInterviewMode] = useState<"star_form" | "hr_chat">("star_form");
  const [question, setQuestion] = useState("Ceritakan pengalaman Anda saat terjadi perbedaan pendapat tajam dalam tim proyek. Bagaimana Anda menyelesaikannya?");
  const [situation, setSituation] = useState("");
  const [action, setAction] = useState("");
  const [resultText, setResultText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<any | null>(null);

  // HR Chat State
  const [chatMessages, setChatMessages] = useState<{ sender: "hr" | "user"; text: string }[]>([
    {
      sender: "hr",
      text: "Halo! Saya Ibu Riska, Talent Acquisition Manager BUMN. Selamat datang di sesi wawancara interaktif. Bisakah Anda memperkenalkan diri secara ringkas?"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleEvaluateStar = async () => {
    if (!situation || !action || !resultText) {
      alert("Harap lengkapi poin Situation, Action, dan Result!");
      return;
    }
    setIsAnalyzing(true);
    playSound("click");

    try {
      const data = await aiApi.evaluateStar(question, situation, action, resultText);
      if (data.evaluation) {
        setAiFeedback(data.evaluation);
        playSound("levelUp");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const data = await aiApi.hrInterview("job-1", userMsg);
      if (data.response) {
        setChatMessages(prev => [...prev, { sender: "hr", text: data.response }]);
        playSound("correct");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit border border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setInterviewMode("star_form")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            interviewMode === "star_form"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Metode STAR & Feedback AI
        </button>
        <button
          onClick={() => setInterviewMode("hr_chat")}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            interviewMode === "hr_chat"
              ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs"
              : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          Chat Simulation HRD BUMN
        </button>
      </div>

      {interviewMode === "star_form" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Simulasi Wawancara Perilaku BUMN</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pertanyaan Wawancara</label>
              <textarea aria-label="Input field"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={2}
                className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">1. Situation & Task (Situasi & Tugas)</label>
                <textarea aria-label="Input field"
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  placeholder="Gambarkan latar belakang situasi dan tugas tanggung jawab Anda..."
                  rows={3}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white mt-1 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">2. Action (Tindakan Taktis Pribadi)</label>
                <textarea aria-label="Input field"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="Jelaskan langkah-langkah konkret dan keputusan yang Anda ambil..."
                  rows={3}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white mt-1 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">3. Result (Hasil Akhir Terukur)</label>
                <textarea aria-label="Input field"
                  value={resultText}
                  onChange={(e) => setResultText(e.target.value)}
                  placeholder="Sampaikan persentase efisiensi atau dampak positif dari tindakan Anda..."
                  rows={2}
                  className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white mt-1 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleEvaluateStar}
              disabled={isAnalyzing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAnalyzing ? "Menganalisis Jawaban..." : "Evaluasi Jawaban dengan AI Assessor"}</span>
            </button>
          </div>

          <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-500" />
              <span>Hasil Analisis Assessor HRD</span>
            </h3>

            {aiFeedback ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Komunikasi & Relevansi</span>
                    <div className="font-black text-xs sm:text-sm text-blue-900 dark:text-blue-200">
                      {aiFeedback.communication || aiFeedback.status} | {aiFeedback.relevance || ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-bold">Skor STAR</span>
                    <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{aiFeedback.score}/100</div>
                  </div>
                </div>
                
                {aiFeedback.starStructure && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 font-bold uppercase">Struktur Jawaban (STAR)</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">{aiFeedback.starStructure}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {aiFeedback.strengths && (
                    <div className="space-y-1.5 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">Kekuatan Jawaban:</span>
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-300">
                        {aiFeedback.strengths.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {(aiFeedback.weaknesses || aiFeedback.improvements) && (
                    <div className="space-y-1.5 p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/50">
                      <span className="font-bold text-amber-600 dark:text-amber-400 text-xs">Kelemahan / Perlu Diperbaiki:</span>
                      <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-300">
                        {(aiFeedback.weaknesses || aiFeedback.improvements || []).map((imp: string, i: number) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {aiFeedback.improvement && (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-1">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300 text-xs">Saran AI Mentor:</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 italic">{aiFeedback.improvement}</p>
                  </div>
                )}
                
                {aiFeedback.polishedScript && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Naskah Rekomendasi:</span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">{aiFeedback.polishedScript}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Sparkles className="w-8 h-8 mx-auto opacity-50" />
                <p>Isi poin STAR dan klik 'Evaluasi Jawaban' untuk melihat masukan AI Assessor.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4 shadow-sm max-w-3xl mx-auto">
          <div className="h-80 overflow-y-auto space-y-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-md p-3 rounded-2xl text-xs ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-bl-none shadow-2xs"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="text-xs text-slate-400 italic">Ibu Riska sedang mengetik balasan...</div>
            )}
          </div>

          <div className="flex gap-2">
            <input aria-label="Input field"
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
              placeholder="Tulis respon Anda untuk HRD..."
              className="flex-1 p-3 text-xs bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
            />
            <button aria-label="Aksi Send"
              onClick={handleSendChatMessage}
              disabled={isChatLoading}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
