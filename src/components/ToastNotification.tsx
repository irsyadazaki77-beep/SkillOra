import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { playSound } from "../utils/sound";

interface ToastNotificationProps {
  toast: { message: string; type: "success" | "error" | "info" } | null;
  setToast: (t: { message: string; type: "success" | "error" | "info" } | null) => void;
}

export function ToastNotification({ toast, setToast }: ToastNotificationProps) {
  useEffect(() => {
    if (toast) {
      if (toast.type === "success") playSound("correct");
      else if (toast.type === "error") playSound("wrong");
      else playSound("click");
    }
  }, [toast]);
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          role="alert"
          aria-live="assertive"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-xl max-w-md w-[calc(100%-2rem)] text-sm overflow-hidden backdrop-blur-xl ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-800/80 text-emerald-100 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-100"
              : toast.type === "error"
              ? "bg-rose-950/90 border-rose-800/80 text-rose-100 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-100"
              : "bg-slate-900/90 border-slate-700/80 text-slate-100 dark:bg-slate-900/90 dark:border-slate-700 dark:text-slate-100"
          }`}
        >
          <div className="flex items-center gap-3 w-full z-10 relative">
            <span className="text-lg shrink-0">
              {toast.type === "success" ? "🎉" : toast.type === "error" ? "⚠️" : "ℹ️"}
            </span>
            <div className="flex-1 font-semibold leading-relaxed text-xs sm:text-sm">{toast.message}</div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white font-bold text-sm ml-2 p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 4, ease: "linear" }}
            className={`absolute bottom-0 left-0 h-1 ${
              toast.type === "success" ? "bg-emerald-500" : toast.type === "error" ? "bg-rose-500" : "bg-blue-500"
            }`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

