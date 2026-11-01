import React from "react";
import { cn } from "../../lib/utils";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "paper";
  hasShadow?: boolean;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  (
    { className, variant = "surface", hasShadow = true, children, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "border-2 border-line rounded-sk-lg select-none",
          variant === "surface" ? "bg-surface text-ink" : "bg-paper text-ink",
          hasShadow && "shadow-hard",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Panel.displayName = "Panel";
