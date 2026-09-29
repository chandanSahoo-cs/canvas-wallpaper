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
          "w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95 cursor-pointer",
          isOpen
            ? "bg-indigo-50 text-indigo-600"
            : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
        )}
      >
        <Download className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute top-11 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-neutral-200/90 p-1.5 flex flex-col gap-0.5 w-52 text-xs select-none z-50 animate-in fade-in zoom-in-95 duration-100">
          <button
            onClick={() => {
              exportWallpaperAsPng();
              setIsOpen(false);
            }}
            className="w-full px-2.5 py-2 rounded-xl hover:bg-neutral-100 text-left flex items-center gap-2.5 text-neutral-700 hover:text-neutral-900 font-medium transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Save as PNG Image</span>
          </button>
          <button
            onClick={() => {
              exportWallpaperAsSvg();
              setIsOpen(false);
            }}
            className="w-full px-2.5 py-2 rounded-xl hover:bg-neutral-100 text-left flex items-center gap-2.5 text-neutral-700 hover:text-neutral-900 font-medium transition-colors cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Export as SVG Vector</span>
          </button>
          <div className="w-full h-px bg-neutral-100 my-0.5" />
          <button
            onClick={handleExportJson}
            className="w-full px-2.5 py-2 rounded-xl hover:bg-neutral-100 text-left flex items-center gap-2.5 text-neutral-700 hover:text-neutral-900 font-medium transition-colors cursor-pointer"
          >
            <FileJson className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Export Wallpaper File</span>
          </button>
          <button
            onClick={() => {
              fileInputRef.current?.click();
              setIsOpen(false);
            }}
            className="w-full px-2.5 py-2 rounded-xl hover:bg-neutral-100 text-left flex items-center gap-2.5 text-neutral-700 hover:text-neutral-900 font-medium transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-emerald-600 shrink-0" />
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
