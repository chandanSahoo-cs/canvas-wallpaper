import React from "react";
import { cn } from "../../lib/utils";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  variant?: "toolbar" | "surface" | "ghost" | "dock";
  size?: "sm" | "md" | "lg";
  tiltOnActive?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      active = false,
      variant = "toolbar",
      size = "md",
      tiltOnActive = true,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center shrink-0 select-none transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:pointer-events-none disabled:cursor-not-allowed";

    const sizeStyles = {
      sm: "w-7 h-7 text-xs rounded-sk-sm",
      md: "w-8 h-8 text-xs rounded-sk",
      lg: "w-9 h-9 text-sm rounded-sk-lg",
    }[size];

    const activeStyles = active
      ? cn(
          "bg-brand-blue text-on-accent border-2 border-line shadow-hard-sm z-10",
          tiltOnActive && "active-tilt",
        )
      : variant === "toolbar"
        ? "text-ink hover:bg-paper hover:border-line/40 border-2 border-transparent active:translate-x-[1px] active:translate-y-[1px]"
        : variant === "surface"
          ? "bg-surface text-ink border-2 border-line shadow-hard-sm hover:bg-paper active:translate-x-[1px] active:translate-y-[1px]"
          : variant === "dock"
            ? "text-ink/80 hover:text-ink hover:bg-paper/40 border border-transparent active:scale-95"
            : "text-ink hover:bg-paper border border-transparent active:scale-95";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(baseStyles, sizeStyles, activeStyles, className)}
        {...props}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
