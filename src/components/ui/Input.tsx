import React, { forwardRef } from "react";
import { X, Search } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onClear?: () => void;
  isSearch?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    helperText,
    error,
    leftIcon,
    rightIcon,
    onClear,
    isSearch = false,
    className = "",
    disabled,
    id,
    value,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
  const showClear = Boolean(onClear && value && String(value).length > 0 && !disabled);

  return (
    <div className="w-full flex flex-col space-y-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {isSearch && !leftIcon ? (
          <div className="absolute left-3 text-zinc-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
        ) : leftIcon ? (
          <div className="absolute left-3 text-zinc-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          value={value}
          className={`w-full h-9 rounded-lg bg-white dark:bg-[#111114] border text-[13px] text-zinc-950 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-600 dark:focus-visible:border-emerald-500 disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50 disabled:cursor-not-allowed ${
            isSearch || leftIcon ? "pl-9" : "pl-3"
          } ${showClear || rightIcon ? "pr-9" : "pr-3"} ${
            error
              ? "border-rose-400 dark:border-rose-600 focus-visible:ring-rose-500/30"
              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
          } ${className}`}
          {...props}
        />

        {showClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2.5 p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Bersihkan pencarian"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {rightIcon && !showClear && (
          <div className="absolute right-3 text-zinc-400 dark:text-zinc-500 pointer-events-none flex items-center justify-center">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs font-medium text-rose-600 dark:text-rose-400 leading-tight">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = "Input";
