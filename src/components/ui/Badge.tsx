import React from "react";

export type BadgeVariant = "primary" | "neutral" | "success" | "warning" | "error" | "info";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
}

/**
 * Editorial restrained status/label primitive — clean typographic tone
 * with subtle hairline tint rather than loud rounded candy capsules.
 */
const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  primary: {
    container:
      "bg-emerald-50/70 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
    dot: "bg-emerald-600 dark:bg-emerald-400",
  },
  neutral: {
    container:
      "bg-zinc-100/80 text-zinc-700 border-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800",
    dot: "bg-zinc-400",
  },
  success: {
    container:
      "bg-emerald-50/70 text-emerald-700 border-emerald-200/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60",
    dot: "bg-emerald-600 dark:bg-emerald-400",
  },
  warning: {
    container:
      "bg-amber-50/70 text-amber-800 border-amber-200/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
    dot: "bg-amber-500",
  },
  error: {
    container:
      "bg-rose-50/70 text-rose-700 border-rose-200/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60",
    dot: "bg-rose-500",
  },
  info: {
    container:
      "bg-zinc-100/80 text-zinc-700 border-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800",
    dot: "bg-zinc-500",
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "text-[11px] px-2 py-0.5 font-medium gap-1 rounded-md",
  md: "text-xs px-2.5 py-0.5 font-medium gap-1.5 rounded-md",
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
      className={`inline-flex items-center justify-center border font-sans select-none whitespace-nowrap shrink-0 ${
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
