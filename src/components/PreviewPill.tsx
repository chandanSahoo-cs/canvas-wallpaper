import React from 'react';
import { EyeOff } from 'lucide-react';

interface PreviewPillProps {
  onExitPreview: () => void;
}

export const PreviewPill: React.FC<PreviewPillProps> = ({ onExitPreview }) => {
  return (
    <button
      onClick={onExitPreview}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-30 bg-neutral-900/85 hover:bg-neutral-900 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-xl active:scale-95 transition-all border border-white/10 cursor-pointer"
    >
      <EyeOff className="w-3.5 h-3.5" /> Exit Preview (H)
    </button>
  );
};
