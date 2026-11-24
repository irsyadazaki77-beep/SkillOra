import { useRef, useEffect } from "react";
import { JobVacancy, Profile } from "../types";
import { playSound } from "../utils/sound";

interface InterviewChatScreenProps {
  activeInterviewJob: JobVacancy;
  setActiveInterviewJob: (job: JobVacancy | null) => void;
  profile: Profile;
  interviewChat: { sender: "user" | "hr"; text: string }[];
  interviewInput: string;
  setInterviewInput: (input: string) => void;
  handleSendInterviewMessage: () => void;
  loadingInterview: boolean;
}

export function InterviewChatScreen({
  activeInterviewJob,
  setActiveInterviewJob,
  profile,
  interviewChat,
  interviewInput,
  setInterviewInput,
  handleSendInterviewMessage,
  loadingInterview
}: InterviewChatScreenProps) {
  const interviewEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (interviewEndRef.current) {
      interviewEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    // Play a chime when HR message is received
    if (interviewChat.length > 0) {
      const lastMsg = interviewChat[interviewChat.length - 1];
      if (lastMsg.sender === "hr") {
        playSound("click");
      }
    }
  }, [interviewChat, loadingInterview]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
      {/* Left panel: Company & Rubrics with Mock Video container */}
      <div className="space-y-5 lg:border-r lg:border-slate-100 lg:pr-5">
        <div className="space-y-2.5">
          <button
            onClick={() => setActiveInterviewJob(null)}
            className="text-base text-slate-400 hover:text-slate-650 font-semibold flex items-center gap-1"
          >
            ← Kembali ke Bursa Kerja
          </button>
          <div className="flex items-center gap-2">
            <span className="text-base bg-slate-50 p-2 rounded-xl border border-slate-200">
              {activeInterviewJob.logo}
            </span>
            <div>
              <span className="text-base bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-2 py-0.5 rounded-md">
                INTERVIEW AKTIF
              </span>
              <h3 className="font-sans font-semibold text-slate-900 text-base leading-tight mt-1">
                {activeInterviewJob.company}
              </h3>
              <p className="text-base text-slate-500 font-medium">{activeInterviewJob.title}</p>
            </div>
          </div>
        </div>
        {/* Mock Video Stream container */}
        <div className="bg-slate-900 rounded-lg h-36 overflow-hidden relative border border-slate-950 flex flex-col justify-between p-3 text-white">
          <div className="flex justify-between text-base font-bold">
            <span className="bg-red-500 px-2 py-0.5 rounded-full flex items-center gap-1">● REC</span>
            <span className="bg-black/40 px-2 py-0.5 rounded-md">Ibu Riska (HRD)</span>
          </div>
          <div className="text-center text-base select-none">👩‍💼</div>
          <div className="text-base text-slate-400 text-center font-medium">Camera Streaming Connected • 1080p</div>
        </div>
        <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3.5 text-base text-emerald-950 space-y-2 font-medium leading-relaxed">
          <p className="font-bold flex items-center gap-1 text-emerald-900">👩‍💼 Pesan Penting HRD:</p>
          <p className="font-medium text-base text-emerald-800 leading-normal">
            Halo {profile.name}, selamat datang di tahap wawancara simulasi! Jawablah pertanyaan kami seputar pengalaman, rekayasa kode, dan motivasi kerja Anda dengan detail. 
          </p>
          <div className="bg-white/80 border border-emerald-150 rounded-lg p-2.5 text-base space-y-1 text-slate-700 leading-normal">
            <p className="font-bold text-emerald-800"> Instruksi Khusus:</p>
            <p>• Ketik jawaban Anda dengan sopan dan terperinci.</p>
            <p>• Setelah siap mengakhiri wawancara dan meminta skor evaluasi kelulusan dari AI, ketik <span className="font-mono font-bold text-emerald-600 underline">/finish</span> dalam obrolan.</p>
          </div>
        </div>
      </div>
      {/* Right panel: Chat dialogue with HRD (Span 2) */}
      <div className="lg:col-span-2 flex flex-col h-[460px] justify-between">
        <div className="bg-emerald-600 text-white rounded-lg p-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">👩‍💼</span>
            <div>
              <h4 className="font-sans text-base font-semibold">Ibu Riska (AI HR Manager)</h4>
              <p className="text-base text-emerald-100 opacity-90">Wawancara interaktif bursa kerja terintegrasi</p>
            </div>
          </div>
          <span className="text-base bg-emerald-700 border border-emerald-500 px-2 py-0.5 rounded font-mono font-bold uppercase ">Live</span>
        </div>
        {/* Chat list */}
        <div className="grow overflow-y-auto py-3 space-y-3.5 pr-1 text-base">
          {interviewChat.map((msg, idx) => {
            const isUser = msg.sender === "user";
            return (
              <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg p-3 text-base leading-relaxed border ${
                  isUser
                    ? "bg-emerald-50/50 text-emerald-950 border-emerald-100"
                    : "bg-white text-slate-700 border-slate-200"
                }`}>
                  <p className="font-bold mb-1 text-base uppercase tracking-wider text-slate-400">
                    {isUser ? "Saya" : `👩‍💼 Ibu Riska (HR)`}
                  </p>
                  <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                </div>
              </div>
            );
          })}
          {loadingInterview && (
            <div className="flex justify-start">
              <div className="bg-white rounded-lg p-3 text-base text-slate-400 border border-slate-200 flex items-center gap-2 font-medium">
                <span className=" text-base">👩‍💼</span> Ibu Riska sedang mengoreksi jawaban Anda...
              </div>
            </div>
          )}
          <div ref={interviewEndRef} />
        </div>
        {/* Input form */}
        <div className="border-t border-slate-100 pt-3 flex gap-2">
          <input aria-label="Ketik jawaban profesional Anda... (ketik /finish untuk melihat nilai)"
            type="text"
            placeholder="Ketik jawaban profesional Anda... (ketik /finish untuk melihat nilai)"
            value={interviewInput}
            onChange={(e) => {
              setInterviewInput(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                playSound("click");
                handleSendInterviewMessage();
              }
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-base focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium text-slate-800"
          />
          <button
            onClick={() => {
              playSound("click");
              handleSendInterviewMessage();
            }}
            disabled={loadingInterview || !interviewInput.trim()}
            className="bg-emerald-600 hover:bg-emerald-555 text-white font-sans text-base font-semibold px-3 py-2 rounded-lg shadow-xs transition-all shrink-0 cursor-pointer"
          >
            Kirim
          </button>
        </div>
      </div>
    </div>
  );
}
