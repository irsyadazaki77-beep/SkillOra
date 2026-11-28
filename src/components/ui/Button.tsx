import React, { forwardRef } from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "subtle"
  | "warning"
  | "info"
  | "accent";
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
    "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-emerald-700/20 shadow-[0_1px_2px_rgba(5,150,105,0.2)]",
  secondary:
    "bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 border border-transparent",
  outline:
    "bg-white dark:bg-[#111114] hover:bg-zinc-50 active:bg-zinc-100 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900",
  ghost:
    "bg-transparent hover:bg-zinc-100 active:bg-zinc-200/70 text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800/70 border border-transparent",
  danger:
    "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-rose-700/20",
  subtle:
    "bg-emerald-50 hover:bg-emerald-100/80 active:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:hover:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50",
  warning:
    "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white border border-amber-700/20",
  accent:
    "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 border border-transparent",
  info:
    "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 border border-transparent",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-xs font-medium h-8 px-3 rounded-lg gap-1.5",
  md: "text-[13px] font-medium h-9 px-4 rounded-lg gap-2",
  lg: "text-sm font-semibold h-11 px-5 rounded-lg gap-2",
  icon: "h-9 w-9 p-0 rounded-lg flex items-center justify-center shrink-0",
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
      className={`inline-flex items-center justify-center font-sans tracking-tight whitespace-nowrap shrink-0 transition-colors duration-150 select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${
        variantStyles[variant]
      } ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
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
