import React, { forwardRef } from "react";

export type CardVariant = "default" | "interactive" | "elevated" | "flat" | "subtle";
export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  fullHeight?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)]",
  interactive:
    "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.99]",
  elevated:
    "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-md",
  flat:
    "bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 shadow-none",
  subtle:
    "bg-white dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 shadow-none",
};

const paddingStyles: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-5 lg:p-6",
  lg: "p-6 sm:p-8",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  {
    children,
    variant = "default",
    padding = "md",
    fullHeight = false,
    className = "",
    ...props
  },
  ref
) {
  return (
    <div
      ref={ref}
      className={`rounded-2xl overflow-hidden transition-colors ${
        variantStyles[variant]
      } ${paddingStyles[padding]} ${fullHeight ? "h-full flex flex-col" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";

export function CardHeader({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex flex-col space-y-1.5 pb-3 border-b border-slate-100 dark:border-slate-800 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`pt-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-between pt-3 mt-auto border-t border-slate-100 dark:border-slate-800 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
