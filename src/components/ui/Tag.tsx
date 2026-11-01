import React from "react";
import { cn } from "../../lib/utils";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "success" | "warning";
}

export const Tag: React.FC<TagProps> = ({
  className,
  variant = "default",
  children,
  ...props
}) => {
  const variantStyles = {
    default: "bg-paper text-ink border-line",
    accent: "bg-brand-blue text-on-accent border-line",
    success: "bg-brand-green text-on-accent border-line",
    warning: "bg-warning text-white border-line",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-hand font-bold uppercase tracking-wider border-2 sketch-border select-none",
        variantStyles,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
};
