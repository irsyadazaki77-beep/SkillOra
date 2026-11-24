import React from "react";

export type BadgeVariant = "primary" | "neutral" | "success" | "warning" | "error" | "info";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  primary: {
    container:
      "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40",
    dot: "bg-emerald-500",
  },
  neutral: {
    container:
      "bg-slate-100 text-slate-700 border-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  success: {
    container:
      "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/40",
    dot: "bg-emerald-500",
  },
  warning: {
    container:
      "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/40",
    dot: "bg-amber-500",
  },
  error: {
    container:
      "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/40",
    dot: "bg-rose-500",
  },
  info: {
    container:
      "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/40",
    dot: "bg-blue-500",
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-xs px-2 py-0.5 font-semibold gap-1 rounded-md",
  md: "text-xs px-2.5 py-1 font-semibold gap-1.5 rounded-lg",
};

export function Badge({
  children,
  variant = "neutral",
  size = "sm",
  dot = false,
  icon,
  className = "",
  ...props
}: BadgeProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center justify-center border font-sans select-none whitespace-nowrap ${
        styles.container
      } ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
}
