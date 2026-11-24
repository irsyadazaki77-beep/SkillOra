import React from "react";
import { RotateCcw, AlertCircle, CheckCircle2, ChevronRight, BookOpen } from "lucide-react";
import { Question } from "../../../types";
import { ModeLatihan } from "../types";
import { RenderFormattedQuestion } from "../utils/formatQuestion";

interface MistakesTabProps {
  allWrongQuestions: { question: Question; courseTitle: string; lessonTitle: string }[];
  startQuizSession: (
    title: string,
    subtitle: string,
    mode: ModeLatihan,
    courseId?: string,
    lessonId?: string
  ) => void;
}

export function MistakesTab({
  allWrongQuestions,
  startQuizSession
}: MistakesTabProps) {
  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
            <RotateCcw className="w-4 h-4" />
            <span>Bank Jawaban Salah & Evaluasi Konsep</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
            Semua soal yang pernah dijawab salah pada sesi latihan sebelumnya dicatat secara otomatis agar Anda dapat melakukan pengulangan (spaced repetition) hingga tuntas.
          </p>
        </div>

        {allWrongQuestions.length > 0 && (
          <button
            onClick={() => {
              startQuizSession(
                "Remedial Total Bank Salah 🔄",
                `Latih Ulang ${allWrongQuestions.length} Soal Evaluasi`,
                "wrong"
              );
            }}
            className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Latih Ulang Semua ({allWrongQuestions.length} Soal)</span>
          </button>
        )}
      </div>

      {/* List of Wrong Questions */}
      {allWrongQuestions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 p-6">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Bank Evaluasi Bersih! 🎉
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hebat! Tidak ada catatan soal yang salah saat ini. Terus pertahankan akurasi belajar Anda di mode latihan lainnya.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allWrongQuestions.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  Soal #{idx + 1} • {item.courseTitle}
                </span>
                <button
                  onClick={() => {
                    startQuizSession("Latih Ulang Soal Spesifik 🎯", item.lessonTitle, "wrong");
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1 cursor-pointer"
                >
                  <span>Latih Soal Ini</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                <RenderFormattedQuestion text={item.question.text} />
              </div>

              {item.question.explanation && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Penjelasan Kunci Jawaban:</span>
                    <span>{item.question.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
