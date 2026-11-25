"use client";

import * as React from "react";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--primary)] text-[var(--primary-foreground)] border border-[var(--primary)] hover:opacity-90 font-semibold",
  secondary:
    "bg-[var(--secondary)] text-[var(--secondary-foreground)] border border-[var(--border)] hover:border-[var(--primary)]",
  outline:
    "bg-transparent text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)]",
  danger:
    "bg-red-600/15 text-red-500 dark:text-red-400 border border-red-500/40 hover:bg-red-600/25",
  ghost:
    "bg-transparent text-[var(--muted-foreground)] border border-transparent hover:text-[var(--foreground)] hover:bg-[var(--secondary)]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-xs",
  lg: "h-11 px-5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 uppercase tracking-wider transition-all disabled:opacity-45 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
