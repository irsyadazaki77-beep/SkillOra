import React from "react";

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: {
    text: string;
    variant?: "primary" | "neutral" | "success" | "warning" | "error" | "info";
    icon?: React.ReactNode;
  };
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  breadcrumbs,
  className = "",
}: PageHeaderProps) {
  return (
    <header
      className={`flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-zinc-200/80 dark:border-zinc-800/80 mb-6 ${className}`}
    >
      <div className="space-y-1.5 min-w-0 max-w-2xl">
        {breadcrumbs && <div className="text-xs text-zinc-500 dark:text-zinc-400">{breadcrumbs}</div>}

        {badge && (
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 tracking-tight">
            {badge.text}
          </p>
        )}

        <h1 className="font-display font-bold text-2xl sm:text-[28px] tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight text-balance">
          {title}
        </h1>

        {subtitle && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </header>
  );
}
