import React from "react";
import { cn } from "../../lib/utils";

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 bg-paper border-2 border-line rounded-sk select-none",
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 font-hand font-bold transition-all cursor-pointer rounded-sk-sm",
              size === "sm" ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
              isSelected
                ? "bg-brand-blue text-on-accent border-2 border-line shadow-hard-sm"
                : "text-ink/70 hover:text-ink hover:bg-surface/50 border-2 border-transparent",
            )}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
