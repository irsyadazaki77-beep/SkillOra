import React from "react";

export type ProgressBarColor = "emerald" | "blue" | "amber" | "rose" | "purple" | "primary" | "success" | "info" | "warning" | "error";
export type ProgressBarSize = "xs" | "sm" | "md" | "lg";

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValueLabel?: boolean;
  valueSuffix?: string;
  color?: ProgressBarColor;
  variant?: ProgressBarColor;
  size?: ProgressBarSize;
  className?: string;
}

const colorStyles: Record<string, string> = {
  emerald: "bg-emerald-600 dark:bg-emerald-500",
  primary: "bg-emerald-600 dark:bg-emerald-500",
  success: "bg-emerald-600 dark:bg-emerald-500",
  blue: "bg-blue-600 dark:bg-blue-500",
  info: "bg-blue-600 dark:bg-blue-500",
  amber: "bg-amber-500 dark:bg-amber-400",
  warning: "bg-amber-500 dark:bg-amber-400",
  rose: "bg-rose-500 dark:bg-rose-400",
  error: "bg-rose-500 dark:bg-rose-400",
  purple: "bg-purple-600 dark:bg-purple-500",
};

const sizeStyles: Record<ProgressBarSize, string> = {
  xs: "h-1",
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValueLabel = false,
  valueSuffix = "%",
  color,
  variant,
  size = "sm",
  className = "",
}: ProgressBarProps) {
  const activeColor = variant || color || "emerald";
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={`w-full flex flex-col space-y-1.5 ${className}`}>
      {(label || showValueLabel) && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label && <span className="truncate">{label}</span>}
          {showValueLabel && (
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 shrink-0">
              {value}
              {valueSuffix}
            </span>
          )}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={`w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden ${sizeStyles[size]}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${colorStyles[activeColor] || colorStyles.emerald}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
