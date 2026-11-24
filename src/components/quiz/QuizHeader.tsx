import { Heart, Clock, Volume2, VolumeX, X, Menu } from "lucide-react";

interface QuizHeaderProps {
  lessonTitle: string;
  courseTitle: string;
  hearts: number;
  timeLeft: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onToggleSidebar: () => void;
  onClose: () => void;
}

export function QuizHeader({
  lessonTitle,
  courseTitle,
  hearts,
  timeLeft,
  soundEnabled,
  onToggleSound,
  onToggleSidebar,
  onClose
}: QuizHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <button aria-label="Aksi Menu"
          onClick={onToggleSidebar}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">{courseTitle}</span>
          <h2 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{lessonTitle}</h2>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Hearts */}
        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-950/50 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800">
          {[...Array(3)].map((_, i) => (
            <Heart
              key={i}
              className={`w-3.5 h-3.5 ${i < hearts ? "text-red-500 fill-red-500" : "text-slate-300 dark:text-slate-700"}`}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800 text-xs font-bold">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeLeft}s</span>
        </div>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Close modal */}
        <button aria-label="Aksi X"
          onClick={onClose}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
