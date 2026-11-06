import React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";
import { useSceneStore } from "../../store/useSceneStore";

export const StorageErrorBanner: React.FC = () => {
  const loadStatus = useSceneStore((s) => s.loadStatus);

  if (loadStatus !== "error") return null;

  return (
    <div
      role="alert"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[90vw] p-2.5 rounded-sk-lg bg-surface/95 text-ink border-2 border-line shadow-hard backdrop-blur-md flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 select-none pointer-events-auto"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span className="font-hand font-bold text-xs text-ink">
          Couldn't read your saved boards. Saving is paused to protect your data. Reload this tab to try again.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }}
          className="px-2.5 py-1 rounded-sk bg-brand-green text-on-accent border border-line font-hand font-bold text-xs hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer shadow-hard-sm flex items-center gap-1.5"
        >
          <RotateCw className="w-3 h-3" />
          Reload
        </button>
      </div>
    </div>
  );
};
