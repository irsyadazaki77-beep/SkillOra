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
    "bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90",
  interactive:
    "bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/40 dark:hover:bg-zinc-900/70 transition-colors duration-150 cursor-pointer",
  elevated:
    "bg-white dark:bg-[#111114] border border-zinc-200/90 dark:border-zinc-800 shadow-[0_6px_20px_-4px_rgba(9,9,11,0.06)] dark:shadow-none",
  flat:
    "bg-zinc-50/80 dark:bg-zinc-900/50 border border-zinc-200/70 dark:border-zinc-800/80",
  subtle:
    "bg-white/70 dark:bg-[#111114]/70 border border-zinc-200/70 dark:border-zinc-800/70",
};

const paddingStyles: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-5 sm:p-6",
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
      className={`rounded-xl overflow-hidden transition-colors ${
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
    <div
      className={`flex flex-col space-y-1 pb-3.5 border-b border-zinc-200/70 dark:border-zinc-800/80 ${className}`}
      {...props}
    >
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
      className={`font-display text-base font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight leading-snug ${className}`}
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
      className={`text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 leading-relaxed ${className}`}
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
    <div className={`pt-4 ${className}`} {...props}>
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
      className={`flex items-center justify-between pt-3.5 mt-auto border-t border-zinc-200/70 dark:border-zinc-800/80 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
