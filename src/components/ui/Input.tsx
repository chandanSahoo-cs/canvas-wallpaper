import React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full bg-paper text-ink font-sans text-xs px-3 py-2 border-2 rounded-sk transition-colors outline-none",
          error
            ? "border-danger focus-visible:outline-danger"
            : "border-line focus-visible:outline-brand-blue",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
