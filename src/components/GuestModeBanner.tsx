import { Eye, LogIn } from "lucide-react";
import { Profile } from "../types";

interface GuestModeBannerProps {
  profile: Profile;
  onSignInClick: () => void;
}

export function GuestModeBanner({ profile, onSignInClick }: GuestModeBannerProps) {
  const isGuest =
    profile.role === "Guest" ||
    profile.email === "guest@skillora.app" ||
    localStorage.getItem("skillora_guest_mode") === "true";

  if (!isGuest) return null;

  return (
    <div
      role="status"
      className="bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800/60 px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs z-30"
    >
      <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-medium">
        <Eye className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          <strong>Mode Tamu (Lihat Saja):</strong> Jelajahi seluruh materi &amp; fitur. Masuk dengan akun terdaftar untuk menyimpan progres &amp; memakai AI.
        </span>
      </div>
      <button
        type="button"
        onClick={onSignInClick}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Masuk / Daftar</span>
      </button>
    </div>
  );
}
