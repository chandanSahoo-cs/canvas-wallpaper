import React from "react";
import { EyeOff } from "lucide-react";

interface PreviewPillProps {
  onExitPreview: () => void;
}

export const PreviewPill: React.FC<PreviewPillProps> = ({ onExitPreview }) => {
  return (
    <button
      onClick={onExitPreview}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-30 bg-surface text-ink border-2 border-line shadow-hard px-4 py-1.5 sketch-border text-xs font-hand font-bold flex items-center gap-2 hover:bg-paper active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer select-none"
    >
      <EyeOff className="w-3.5 h-3.5" />
      <span>Exit Preview (H)</span>
    </button>
  );
};
