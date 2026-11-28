import React, { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, helperText, error, options, children, className = "", disabled, id, ...props },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full flex flex-col space-y-1.5 text-left">
      {label && (
        <label htmlFor={selectId} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`w-full h-9 appearance-none rounded-lg bg-white dark:bg-[#111114] border text-[13px] text-zinc-950 dark:text-zinc-100 pl-3 pr-8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-600 dark:focus-visible:border-emerald-500 disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50 disabled:cursor-not-allowed cursor-pointer ${
            error
              ? "border-rose-400 dark:border-rose-600 focus-visible:ring-rose-500/30"
              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
          } ${className}`}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

        <div className="absolute right-2.5 text-zinc-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 leading-tight">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = "Select";
