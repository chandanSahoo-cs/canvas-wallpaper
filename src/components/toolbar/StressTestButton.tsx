import React, { useState, useRef, useEffect } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import { runStressTest } from "../../lib/assets/stressTest";
import { assetLoader } from "../../lib/assets/loader";

export const StressTestButton: React.FC = () => {
  // Only rendered in development mode
  const isDev = Boolean((import.meta as any).env?.DEV);
  if (!isDev) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleRun = async (count: number, include12MP: boolean) => {
    setIsRunning(true);
    setStatusMsg(`Generating ${count} images...`);
    try {
      const stats = await runStressTest({ count, include12MP });
      setStatusMsg(`Added ${stats.count} images (${(stats.totalBytes / (1024 * 1024)).toFixed(1)} MB)`);
      setTimeout(() => {
        setStatusMsg(null);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error("Stress test failed:", err);
      setStatusMsg("Failed to run stress test");
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearCache = () => {
    assetLoader.clear();
    setStatusMsg("Bitmap cache cleared");
    setTimeout(() => setStatusMsg(null), 1500);
  };

  const cacheStats = assetLoader.getCacheStats();

  return (
    <div ref={menuRef} className="relative">
      <button
        title="Dev Asset Stress Test"
        onClick={() => setIsOpen((v) => !v)}
        className="w-8 h-8 rounded-sk flex items-center justify-center text-amber-600 hover:text-amber-700 hover:bg-paper border-2 border-dashed border-amber-500/50 transition-all duration-150 cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
      >
        <FlaskConical className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div className="absolute top-11 right-0 bg-surface text-ink border-2 border-line rounded-sk-lg shadow-hard p-2 flex flex-col gap-1.5 w-64 text-xs select-none z-50 animate-in fade-in duration-100">
          <div className="flex items-center justify-between pb-1 border-b border-line/20">
            <span className="font-hand font-bold text-amber-600">Dev Stress Test</span>
            <span className="text-[10px] text-muted font-mono">
              {(cacheStats.totalBytes / (1024 * 1024)).toFixed(1)} / 256 MB
            </span>
          </div>

          {statusMsg && (
            <div className="p-1.5 bg-brand-blue/10 border border-brand-blue rounded-sk text-[11px] font-sans text-center text-blue-text">
              {statusMsg}
            </div>
          )}

          <button
            disabled={isRunning}
            onClick={() => handleRun(20, true)}
            className="w-full px-2.5 py-1.5 rounded-sk hover:bg-paper text-left flex items-center justify-between font-hand font-medium transition-colors cursor-pointer border border-transparent hover:border-line/20"
          >
            <span>Add 20 Images (incl. 12MP)</span>
            {isRunning && <Loader2 className="w-3 h-3 animate-spin text-muted" />}
          </button>

          <button
            disabled={isRunning}
            onClick={() => handleRun(50, false)}
            className="w-full px-2.5 py-1.5 rounded-sk hover:bg-paper text-left flex items-center justify-between font-hand font-medium transition-colors cursor-pointer border border-transparent hover:border-line/20"
          >
            <span>Add 50 Standard Images</span>
          </button>

          <button
            disabled={isRunning}
            onClick={() => handleRun(100, false)}
            className="w-full px-2.5 py-1.5 rounded-sk hover:bg-paper text-left flex items-center justify-between font-hand font-medium transition-colors cursor-pointer border border-transparent hover:border-line/20"
          >
            <span>Add 100 Images (Heavy)</span>
          </button>

          <div className="w-full h-px bg-line/20 my-0.5" />

          <button
            disabled={isRunning}
            onClick={handleClearCache}
            className="w-full px-2.5 py-1.5 rounded-sk hover:bg-paper text-left flex items-center justify-between font-hand font-medium text-muted transition-colors cursor-pointer"
          >
            <span>Clear Decoded Bitmaps</span>
            <span className="text-[10px] font-mono">{cacheStats.entries} cached</span>
          </button>
        </div>
      )}
    </div>
  );
};
