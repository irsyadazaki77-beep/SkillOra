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
  variant = "underline",
  size = "md",
  className = "",
}: TabsProps) {
  if (variant === "underline") {
    return (
      <div className={`border-b border-zinc-200/90 dark:border-zinc-800/90 ${className}`}>
        <nav className="flex items-center gap-6 overflow-x-auto hide-scrollbar" aria-label="Tabs" role="tablist">
          {items.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange(tab.id)}
                aria-selected={isActive}
                role="tab"
                className={`relative py-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  isActive
                    ? "text-zinc-950 dark:text-white font-semibold"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {tab.icon && <span className="shrink-0 opacity-80">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="text-[11px] font-mono tabular-nums text-zinc-400 dark:text-zinc-500">
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="underline-tab-active"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-600 dark:bg-emerald-400"
                    transition={{ duration: 0.16 }}
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
      className={`inline-flex items-center p-1 bg-zinc-100/90 dark:bg-zinc-900 rounded-lg border border-zinc-200/80 dark:border-zinc-800 overflow-x-auto max-w-full hide-scrollbar ${className}`}
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
            className={`relative flex items-center justify-center gap-1.5 ${
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-[13px]"
            } rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 select-none ${
              isActive
                ? "text-zinc-950 dark:text-white font-semibold"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="pill-tab-active"
                className="absolute inset-0 bg-white dark:bg-zinc-800 rounded-md shadow-[0_1px_2px_rgba(9,9,11,0.06)] border border-zinc-200/70 dark:border-zinc-700/70"
                transition={{ duration: 0.15 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="text-[11px] font-mono tabular-nums text-zinc-400 dark:text-zinc-500">
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
