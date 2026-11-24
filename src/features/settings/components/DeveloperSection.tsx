import React from "react";
import { Terminal, Award, Trash2, RefreshCw } from "lucide-react";

interface DeveloperSectionProps {
  isDevMode: boolean;
  handleToggleDevMode: (checked: boolean) => void;
  handleInstantUnlock: () => void;
  handleResetDevData: () => void;
  saving: boolean;
}

export function DeveloperSection({
  isDevMode,
  handleToggleDevMode,
  handleInstantUnlock,
  handleResetDevData,
  saving
}: DeveloperSectionProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-slate-700 dark:text-slate-300" /> Mode Developer (Sistem Administrasi)
        </h3>
        <p className="text-base text-slate-500 dark:text-slate-400 font-medium mt-0.5">
          Akses pintasan sistem untuk membuka semua kuis, materi belajar, dan sertifikat kelulusan.
        </p>
      </div>

      <div className="space-y-4">
        {/* Developer Mode Toggle Switch */}
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/50 dark:border-slate-700 shadow-sm">
          <div className="flex gap-2">
            <div className="p-2 bg-slate-200/50 dark:bg-slate-700 rounded-xl flex items-center justify-center h-10 w-10 shrink-0">
              <Terminal className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-800 dark:text-white">Aktifkan Mode Developer</h4>
              <p className="text-base text-slate-500 dark:text-slate-400 font-semibold leading-normal mt-0.5">
                Mengabaikan semua validasi progres kuis, membuka sandbox pengerjaan projek seketika, dan membuka tab "Kelola LMS" di navigasi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggleDevMode(!isDevMode)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
              isDevMode ? "bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]" : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                isDevMode ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Instant Claim All Certificates & Quizzes */}
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-sm transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <Award className="w-4 h-4" />
                <h4 className="text-base font-black uppercase tracking-wider">Klaim Instan Semua Sertifikat</h4>
              </div>
              <p className="text-base text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Menyelesaikan seluruh materi, menandai semua kuis 100% lulus, dan menghasilkan 4 sertifikat kelulusan emas beserta ulasan resmi dari mentor industri secara instan.
              </p>
            </div>
            <button
              type="button"
              onClick={handleInstantUnlock}
              disabled={saving}
              className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white font-sans text-base font-black py-2.5 rounded-xl border border-slate-800 dark:border-amber-600 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Award className="w-3.5 h-3.5 text-amber-400 dark:text-white" /> Buka & Klaim Semua Sertifikat 🏅
            </button>
          </div>

          {/* Reset Data to Default */}
          <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-sm transition-all flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-4 h-4" />
                <h4 className="text-base font-black uppercase tracking-wider">Reset Semua Data Belajar</h4>
              </div>
              <p className="text-base text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Mengembalikan seluruh progres kuis, level, XP, Gems, dan sertifikat yang diraih ke keadaan semula untuk memfasilitasi pengujian ulang alur belajar.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetDevData}
              disabled={saving}
              className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 font-sans text-base font-black py-2.5 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5 text-rose-500" /> Reset Ulang Data Belajar 🔄
            </button>
          </div>
        </div>

        {/* System Status Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 p-4 rounded-lg flex gap-2 items-start">
          <Terminal className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-base font-extrabold text-amber-800 dark:text-amber-200">Tips Pengujian untuk Penilai & Developer</h4>
            <p className="text-base text-amber-700 dark:text-amber-300 font-semibold leading-relaxed">
              Anda dapat beralih antara Mode Developer untuk menguji Sandbox proyek akhir di tab "Sertifikasi", memeriksa lowongan di tab "Bursa Kerja", atau mengelola materi di tab "Kelola LMS". Jika Anda ingin menguji sistem kuis dari awal, gunakan tombol Reset di atas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
