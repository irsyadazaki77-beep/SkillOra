import React from "react";
import { Badge } from "./Badge";

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
      className={`flex flex-col md:flex-row md:items-center justify-between gap-3.5 pb-4 sm:pb-5 border-b border-slate-200/70 dark:border-slate-800/80 mb-5 sm:mb-6 ${className}`}
    >
      <div className="space-y-1.5 min-w-0 max-w-3xl">
        {breadcrumbs && <div className="mb-1 text-xs">{breadcrumbs}</div>}

        {badge && (
          <div className="inline-flex items-center">
            <Badge variant={badge.variant || "primary"} size="sm" icon={badge.icon}>
              {badge.text}
            </Badge>
          </div>
        )}

        <h1 className="font-display font-bold text-xl sm:text-2xl lg:text-3xl tracking-tight text-slate-900 dark:text-white leading-tight">
          {title}
        </h1>

        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-1 md:pt-0">
          {actions}
        </div>
      )}
    </header>
  );
}
