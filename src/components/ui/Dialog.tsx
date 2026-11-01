import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  ariaLabelledBy?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  maxWidth = "md",
  className,
  ariaLabelledBy = "dialog-title",
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        className={cn(
          "bg-surface text-ink border-2 border-line rounded-sk-lg shadow-hard p-6 w-full relative select-none",
          maxWidthStyles,
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b-2 border-line">
            <div className="flex items-center gap-2.5">
              {icon}
              <h2 id={ariaLabelledBy} className="font-hand text-lg font-bold text-ink tracking-wide">
                {title}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1 rounded-sk-sm text-ink/60 hover:text-ink hover:bg-paper border border-transparent hover:border-line/30 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};
