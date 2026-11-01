import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "secondary",
      size = "md",
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-hand select-none transition-transform duration-150 cursor-pointer disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed";

    const sizeStyles = {
      sm: "h-7 px-2.5 text-xs rounded-sk",
      md: "h-8 px-3.5 text-xs rounded-sk",
      lg: "h-9 px-4 text-sm rounded-sk-lg",
    }[size];

    const variantStyles = {
      primary:
        "bg-brand-green text-on-accent font-bold border-2 border-line shadow-hard hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed",
      secondary:
        "bg-surface text-ink border-2 border-line shadow-hard hover:bg-paper active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed",
      accent:
        "bg-brand-blue text-on-accent font-bold border-2 border-line shadow-hard hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed",
      ghost:
        "bg-transparent text-ink hover:bg-paper border border-transparent hover:border-line/20 active:translate-x-[1px] active:translate-y-[1px]",
      danger:
        "bg-danger text-white font-bold border-2 border-line shadow-hard hover:brightness-110 active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed",
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(baseStyles, sizeStyles, variantStyles, className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
