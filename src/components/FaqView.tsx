import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, HelpCircle, Mail, MessageCircle, Search, X } from "lucide-react";

const FAQ_DATA = [
  {
    question: "Bagaimana cara mendapatkan sertifikat?",
    answer: "Sertifikat akan diberikan secara otomatis setelah Anda menyelesaikan semua materi, lulus kuis, dan menyelesaikan proyek akhir dalam kursus."
  },
  {
    question: "Apakah progres belajar saya tersimpan otomatis?",
    answer: "Ya, setiap materi yang selesai (ditandai dengan centang) dan kuis yang Anda kerjakan akan otomatis tersimpan dalam progres akun Anda."
  },
  {
    question: "Bagaimana cara menggunakan fitur AI Mentor Owl?",
    answer: "Klik tombol 'Tanya Mentor AI' di bagian samping atau pojok atas saat Anda kesulitan. Anda dapat menanyakan materi spesifik, kode, atau konsep yang belum dipahami."
  },
  {
    question: "Apakah saya bisa mengikuti beberapa kursus sekaligus?",
    answer: "Tentu! Anda dapat mengikuti banyak kursus sekaligus, dan dapat melihat daftar kursus yang sedang berjalan di tab 'Belajar'."
  },
  {
    question: "Apa fungsi Gems dan XP?",
    answer: "XP (Experience Points) digunakan untuk menaikkan level profil Anda. Gems digunakan sebagai mata uang untuk membeli item di Toko, seperti Streak Freeze atau Avatar baru."
  },
  {
    question: "Bagaimana cara mengikuti Simulasi Wawancara HRD BUMN?",
    answer: "Buka menu 'Simulasi Tes & Wawancara' di bagian Karier. Anda dapat memilih tes Kraepelin, wawancara metode STAR, atau latihan TKD."
  }
];

export function FaqView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = FAQ_DATA.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[800px] mx-auto py-10 px-4 font-sans animate-in fade-in duration-300">
      <div className="text-center mb-8 space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Pusat Bantuan & FAQ</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto leading-relaxed text-sm">
          Temukan jawaban untuk pertanyaan umum atau hubungi tim dukungan kami jika Anda membutuhkan bantuan lebih lanjut.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-6 max-w-md mx-auto">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input aria-label="Input field"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari pertanyaan atau kata kunci..."
          className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-2 shadow-xs mb-8">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
            Tidak ada pertanyaan yang sesuai dengan "{searchQuery}".
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="border-b border-slate-100 dark:border-slate-800/80 last:border-0">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer"
                >
                  <span className="font-bold text-slate-800 dark:text-slate-200 pr-4 text-sm">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0 text-slate-600 dark:text-slate-300 leading-relaxed text-xs font-medium">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl flex items-start gap-4 shadow-2xs">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-sm">Chat AI Mentor</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Tanyakan materi pembelajaran atau masalah koding 24/7.</p>
            <a href="/belajar" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Buka AI Mentor &rarr;</a>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl flex items-start gap-4 shadow-2xs">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-sm">Dukungan Email</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Tim Skillora siap menjawab kendala teknis Anda.</p>
            <a href="mailto:support@skillora.id" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">Kirim Email &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  );
}
