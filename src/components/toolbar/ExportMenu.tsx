import React, { useState, useRef, useEffect } from "react";
import { Download, FileCode, FileJson, Upload } from "lucide-react";
import { exportWallpaperAsPng } from "../../hooks/useExport";
import { exportWallpaperAsSvg } from "../../hooks/useSvgExport";
import {
  exportWallpaperFile,
  importWallpaperFile,
} from "../../hooks/useWallpaperFile";
import { useSceneStore } from "../../store/useSceneStore";
import { cn } from "../../lib/utils";

export const ExportMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExportJson = () => {
    const currentScene = useSceneStore
      .getState()
      .scenes.find((s) => s.id === useSceneStore.getState().activeSceneId);
    exportWallpaperFile(currentScene?.name);
    setIsOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importWallpaperFile(file);
      e.target.value = "";
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        title="Export / Share Wallpaper"
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "w-8 h-8 rounded-sk flex items-center justify-center transition-all duration-150 cursor-pointer border-2",
          isOpen
            ? "bg-brand-blue text-on-accent border-line shadow-hard-sm"
            : "text-ink hover:bg-paper hover:border-line/40 border-transparent active:translate-x-[1px] active:translate-y-[1px]",
        )}
      >
        <Download className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-surface text-ink border-2 border-line rounded-sk-lg shadow-hard p-1.5 flex flex-col gap-1 w-56 text-xs select-none z-50 animate-in fade-in duration-100">
          <button
            onClick={() => {
              exportWallpaperAsPng().catch((err) => console.error("Export error:", err));
              setIsOpen(false);
            }}
            className="w-full px-2.5 py-2 rounded-sk hover:bg-paper text-left flex items-center gap-2.5 text-ink font-hand font-medium transition-colors cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
          >
            <Download className="w-4 h-4 text-ink/80 shrink-0" />
            <span>Save as PNG Image</span>
          </button>
          <button
            onClick={() => {
              exportWallpaperAsSvg();
              setIsOpen(false);
            }}
            className="w-full px-2.5 py-2 rounded-sk hover:bg-paper text-left flex items-center gap-2.5 text-ink font-hand font-medium transition-colors cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
          >
            <FileCode className="w-4 h-4 text-ink/80 shrink-0" />
            <span>Export as SVG Vector</span>
          </button>
          <div className="w-full h-px bg-line/20 my-0.5" />
          <button
            onClick={handleExportJson}
            className="w-full px-2.5 py-2 rounded-sk hover:bg-paper text-left flex items-center gap-2.5 text-ink font-hand font-medium transition-colors cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
          >
            <FileJson className="w-4 h-4 text-ink/80 shrink-0" />
            <span>Export Wallpaper File</span>
          </button>
          <button
            onClick={() => {
              fileInputRef.current?.click();
              setIsOpen(false);
            }}
            className="w-full px-2.5 py-2 rounded-sk hover:bg-paper text-left flex items-center gap-2.5 text-ink font-hand font-medium transition-colors cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
          >
            <Upload className="w-4 h-4 text-ink/80 shrink-0" />
            <span>Import Wallpaper File...</span>
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".canvaswallpaper,.json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
