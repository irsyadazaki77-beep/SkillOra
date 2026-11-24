import { motion } from "motion/react";
import { FolderOpen, AlertTriangle, RefreshCw, Loader2, SearchX } from "lucide-react";
import React from "react";
import { Button } from "./ui/Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  variant?: "default" | "search" | "error";
  onRetry?: () => void;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  variant = "default",
  onRetry 
}: EmptyStateProps) {
  const defaultIcon = variant === "search" ? (
    <SearchX className="w-7 h-7 text-slate-400 dark:text-slate-500" />
  ) : variant === "error" ? (
    <AlertTriangle className="w-7 h-7 text-amber-500" />
  ) : (
    <FolderOpen className="w-7 h-7 text-slate-400 dark:text-slate-500" />
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center p-6 sm:p-10 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-subtle max-w-md mx-auto w-full my-6"
    >
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3.5 border ${
        variant === "error" 
          ? "bg-amber-50 border-amber-200/60 text-amber-600 dark:bg-amber-950/40 dark:border-amber-800/50" 
          : "bg-slate-50 border-slate-200/80 text-slate-400 dark:bg-slate-800 dark:border-slate-700/60"
      }`}>
        {icon || defaultIcon}
      </div>

      <h3 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-1">
        {title}
      </h3>

      <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm leading-relaxed max-w-sm mb-5">
        {description}
      </p>

      {action ? (
        <div>{action}</div>
      ) : onRetry ? (
        <Button
          variant="primary"
          size="md"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Coba Lagi
        </Button>
      ) : null}
    </motion.div>
  );
}

export function ErrorState({
  title = "Terjadi Kesalahan",
  description = "Gagal memuat data. Periksa koneksi Anda dan coba beberapa saat lagi.",
  onRetry
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      variant="error"
      title={title}
      description={description}
      onRetry={onRetry}
    />
  );
}

export function InlineLoadingState({ message = "Memuat data..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-2.5">
      <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
      <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
