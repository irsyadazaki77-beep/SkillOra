import React from "react";

export interface SectionHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  action,
  badge,
  className = "",
}: SectionHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5 sm:mb-4 ${className}`}
    >
      <div className="space-y-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h2>
          {badge}
        </div>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate sm:whitespace-normal">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0 flex items-center">{action}</div>}
    </div>
  );
}
