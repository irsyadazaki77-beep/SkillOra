import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "subtle" | "warning" | "info" | "accent";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs border border-emerald-600/30",
  secondary:
    "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700/60",
  outline:
    "bg-transparent hover:bg-slate-100/80 active:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800/60",
  ghost:
    "bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/60 border border-transparent",
  danger:
    "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs border border-rose-600/30",
  subtle:
    "bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40",
  warning:
    "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-xs border border-amber-500/30",
  accent:
    "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-xs border border-amber-500/30",
  info:
    "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs border border-blue-600/30",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-xs font-semibold h-8 px-3 rounded-lg gap-1.5",
  md: "text-xs sm:text-sm font-semibold h-10 px-4 rounded-xl gap-2",
  lg: "text-sm sm:text-base font-bold h-11 sm:h-12 px-5 sm:px-6 rounded-xl gap-2.5",
  icon: "h-9 w-9 sm:h-10 sm:w-10 p-0 rounded-xl flex items-center justify-center shrink-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    isLoading = false,
    loadingText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = "",
    disabled,
    type = "button",
    ...props
  },
  ref
) {
  const isButtonDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isButtonDisabled}
      className={`inline-flex items-center justify-center font-sans tracking-tight transition-all duration-150 select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:scale-100 ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          {loadingText ? <span>{loadingText}</span> : children ? <span>{children}</span> : null}
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = "Button";
