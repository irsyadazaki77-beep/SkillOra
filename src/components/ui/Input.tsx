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
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {isSearch && !leftIcon ? (
          <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
        ) : leftIcon ? (
          <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          value={value}
          className={`w-full h-10 rounded-xl bg-white dark:bg-slate-900 border text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed ${
            isSearch || leftIcon ? "pl-10" : "pl-3.5"
          } ${showClear || rightIcon ? "pr-10" : "pr-3.5"} ${
            error
              ? "border-rose-400 dark:border-rose-600 focus-visible:ring-rose-500"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          } ${className}`}
          {...props}
        />

        {showClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Bersihkan pencarian"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {rightIcon && !showClear && (
          <div className="absolute right-3.5 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center justify-center">
            {rightIcon}
          </div>
        )}
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

Input.displayName = "Input";
