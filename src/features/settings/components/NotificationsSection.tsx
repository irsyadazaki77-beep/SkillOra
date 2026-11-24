import React from "react";
import { Bell, Mail, Flame, Volume2 } from "lucide-react";

interface NotificationsSectionProps {
  notifyEmail: boolean;
  setNotifyEmail: (v: boolean) => void;
  notifyDaily: boolean;
  setNotifyDaily: (v: boolean) => void;
  notifySound: boolean;
  setNotifySound: (v: boolean) => void;
}

export function NotificationsSection({
  notifyEmail,
  setNotifyEmail,
  notifyDaily,
  setNotifyDaily,
  notifySound,
  setNotifySound
}: NotificationsSectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-600" />
          <span>Preferensi Notifikasi & Audio</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Atur bagaimana Skillora mengingatkan jadwal belajar, update lowongan kerja, dan efek suara interaktif.
        </p>
      </div>

      <div className="space-y-3">
        {/* Toggle 1: Email Notifications */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Notifikasi Email Berkala</h4>
              <p className="text-xs text-slate-500">Kirim ringkasan sertifikat, rekomendasi lowongan baru, dan rekap belajar mingguan.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input aria-label="Input field"
              type="checkbox"
              checked={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Toggle 2: Daily Reminders */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Pengingat Streak Harian</h4>
              <p className="text-xs text-slate-500">Ingatkan sebelum pukul 20.00 WIB jika Anda belum menyelesaikan target belajar hari ini.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input aria-label="Input field"
              type="checkbox"
              checked={notifyDaily}
              onChange={(e) => setNotifyDaily(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* Toggle 3: Sound Effects */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Efek Suara Gamifikasi</h4>
              <p className="text-xs text-slate-500">Mainkan efek suara saat naik level, menyelesaikan kuis, atau klaim misi harian.</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input aria-label="Input field"
              type="checkbox"
              checked={notifySound}
              onChange={(e) => setNotifySound(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
}
