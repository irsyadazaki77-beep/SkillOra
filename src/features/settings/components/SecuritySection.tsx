import React, { FormEvent } from "react";
import { Shield, Lock, Smartphone, Key, CheckCircle2 } from "lucide-react";

interface SecuritySectionProps {
  oldPassword: string;
  setOldPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  handleSaveSecurity: (e: FormEvent) => void;
  saving: boolean;
}

export function SecuritySection({
  oldPassword,
  setOldPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  handleSaveSecurity,
  saving
}: SecuritySectionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          <span>Keamanan Akun & Kredensial</span>
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Kelola kata sandi akun, autentikasi dua faktor, dan riwayat sesi aktif Anda.
        </p>
      </div>

      <form onSubmit={handleSaveSecurity} className="space-y-4 max-w-lg">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kata Sandi Saat Ini</label>
          <input aria-label="Input field"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kata Sandi Baru</label>
          <input aria-label="Input field"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            placeholder="Minimal 6 karakter"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Konfirmasi Kata Sandi Baru</label>
          <input aria-label="Input field"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            placeholder="Ulangi kata sandi baru"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
        >
          <Key className="w-3.5 h-3.5" />
          <span>{saving ? "Menyimpan..." : "Perbarui Kata Sandi"}</span>
        </button>
      </form>

      {/* 2FA & Session Status */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-emerald-600" />
          <span>Status Autentikasi Tambahan</span>
        </h4>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block">Sesi Terenkripsi Aman</span>
            <p className="text-xs text-slate-500">Koneksi SSL / JWT token Anda aktif dan terverifikasi.</p>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Aktif
          </span>
        </div>
      </div>
    </div>
  );
}
