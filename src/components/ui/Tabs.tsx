import React from "react";
import { motion } from "motion/react";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "pill" | "underline" | "cards";
  size?: "sm" | "md";
  className?: string;
}

export function Tabs({
  items,
  activeTab,
  onChange,
  variant = "pill",
  size = "md",
  className = "",
}: TabsProps) {
  if (variant === "underline") {
    return (
      <div className={`border-b border-slate-200 dark:border-slate-800 ${className}`}>
        <nav className="flex space-x-6 overflow-x-auto hide-scrollbar" aria-label="Tabs">
          {items.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                aria-selected={isActive}
                role="tab"
                className={`relative py-3 px-1 inline-flex items-center gap-2 text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  isActive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      isActive
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="underline-tab-active"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 dark:bg-emerald-400 rounded-full"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto max-w-full hide-scrollbar ${className}`}
      role="tablist"
    >
      {items.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            aria-selected={isActive}
            role="tab"
            className={`relative flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 select-none ${
              isActive
                ? "text-slate-900 dark:text-white"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="pill-tab-active"
                className="absolute inset-0 bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-slate-200/50 dark:border-slate-700/50"
                transition={{ duration: 0.18 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-md text-xs font-bold ${
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
