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
  {
    label,
    helperText,
    error,
    options,
    children,
    className = "",
    disabled,
    id,
    ...props
  },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full flex flex-col space-y-1.5 text-left">
      {label && (
        <label
          htmlFor={selectId}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`w-full h-10 appearance-none rounded-xl bg-white dark:bg-slate-900 border text-xs sm:text-sm text-slate-900 dark:text-slate-100 pl-3.5 pr-9 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed cursor-pointer ${
            error
              ? "border-rose-400 dark:border-rose-600 focus-visible:ring-rose-500"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
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

        <div className="absolute right-3 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 leading-tight">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-xs font-normal text-slate-500 dark:text-slate-400 leading-tight">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

Select.displayName = "Select";
