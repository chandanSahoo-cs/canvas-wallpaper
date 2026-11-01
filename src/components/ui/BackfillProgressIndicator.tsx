import React from "react";
import { Loader2, Pause, Play, X } from "lucide-react";
import { useAssetBackfill } from "../../hooks/useAssetBackfill";

export const BackfillProgressIndicator: React.FC = () => {
  const { isBackfilling, isPaused, total, processed, pause, resume, cancel } =
    useAssetBackfill();

  if (total === 0 || (!isBackfilling && !isPaused)) {
    return null;
  }

  const percent = Math.min(100, Math.round((processed / total) * 100));

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-3 py-2 bg-surface text-ink border-2 border-line rounded-sk shadow-hard select-none text-xs animate-in fade-in duration-150">
      <div className="flex items-center gap-1.5 font-hand font-bold text-ink">
        {isBackfilling ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-blue" />
        ) : (
          <Pause className="w-3.5 h-3.5 text-warning" />
        )}
        <span>Indexing metadata:</span>
        <span className="font-mono text-[11px] text-muted">
          {processed}/{total} ({percent}%)
        </span>
      </div>

      <div className="w-16 h-1.5 bg-paper rounded-sk border border-line/30 overflow-hidden">
        <div
          className="h-full bg-brand-blue transition-all duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center gap-1 ml-1 border-l border-line/20 pl-1.5">
        {isPaused ? (
          <button
            onClick={resume}
            title="Resume indexing"
            className="p-1 hover:bg-paper rounded-sk text-ink/70 hover:text-ink cursor-pointer"
          >
            <Play className="w-3 h-3" />
          </button>
        ) : (
          <button
            onClick={pause}
            title="Pause indexing"
            className="p-1 hover:bg-paper rounded-sk text-ink/70 hover:text-ink cursor-pointer"
          >
            <Pause className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={cancel}
          title="Cancel indexing"
          className="p-1 hover:bg-paper rounded-sk text-ink/70 hover:text-danger cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
