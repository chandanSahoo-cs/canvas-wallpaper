import React, { useEffect, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  Copy,
  Download,
  Image as ImageIcon,
  Check,
  Tag,
  Palette,
} from "lucide-react";
import { useLightboxStore } from "../../lib/lightbox/store";
import { useAppStore } from "../../store/useAppStore";
import { useSceneStore } from "../../store/useSceneStore";
import { formatBytes, cn } from "../../lib/utils";

export const LightboxModal: React.FC = () => {
  const isOpen = useLightboxStore((s) => s.isOpen);
  const items = useLightboxStore((s) => s.items);
  const currentIndex = useLightboxStore((s) => s.currentIndex);
  const assetDetails = useLightboxStore((s) => s.assetDetails);
  const imageUrl = useLightboxStore((s) => s.imageUrl);
  const isLoading = useLightboxStore((s) => s.isLoading);
  const zoom = useLightboxStore((s) => s.zoom);
  const pan = useLightboxStore((s) => s.pan);
  const toastMessage = useLightboxStore((s) => s.toastMessage);

  const close = useLightboxStore((s) => s.close);
  const next = useLightboxStore((s) => s.next);
  const prev = useLightboxStore((s) => s.prev);
  const setZoom = useLightboxStore((s) => s.setZoom);
  const setPan = useLightboxStore((s) => s.setPan);
  const resetTransform = useLightboxStore((s) => s.resetTransform);
  const showToast = useLightboxStore((s) => s.showToast);

  const [wallpaperFit, setWallpaperFit] = useState<"cover" | "contain">("cover");
  const [showWallpaperFitMenu, setShowWallpaperFitMenu] = useState(false);

  // Drag pan refs
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  const currentItem = items[currentIndex];

  // Keyboard navigation & Esc listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "0" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        resetTransform();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close, next, prev, resetTransform]);

  if (!isOpen || !currentItem) return null;

  // Actions
  const handleSetWallpaper = (fit: "cover" | "contain") => {
    const aid = currentItem.assetId;
    if (!aid) return;

    useAppStore.getState().setBackground({
      type: "image",
      imageAssetId: aid,
      fit,
      color: useAppStore.getState().background.color,
    });
    useAppStore.getState().saveToStorage();

    const activeId = useSceneStore.getState().activeSceneId;
    const scenes = useSceneStore.getState().scenes;
    useSceneStore.setState({
      scenes: scenes.map((s) =>
        s.id === activeId
          ? {
              ...s,
              background: {
                type: "image",
                imageAssetId: aid,
                fit,
                color: s.background?.color || "#f6faf8",
              },
            }
          : s,
      ),
    });
    useSceneStore.getState().saveScenesToStorage();

    setShowWallpaperFitMenu(false);
    showToast(`Set as wallpaper (${fit})`);
  };

  const handleCopyImage = async () => {
    if (!assetDetails?.blob) {
      showToast("Loading image bytes...");
      return;
    }

    try {
      let blobToCopy = assetDetails.blob;
      if (blobToCopy.type !== "image/png") {
        // Convert to PNG for reliable cross-platform clipboard support
        const bitmap = await createImageBitmap(blobToCopy);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(bitmap, 0, 0);
        blobToCopy = await canvas.convertToBlob({ type: "image/png" });
      }

      await navigator.clipboard.write([
        new ClipboardItem({ [blobToCopy.type]: blobToCopy }),
      ]);
      showToast("Copied image to clipboard!");
    } catch (err) {
      console.warn("Failed to copy image:", err);
      showToast("Could not copy image to clipboard");
    }
  };

  const handleDownload = () => {
    if (!assetDetails?.blob) return;

    const ext = assetDetails.mime.split("/")[1] || "png";
    const title = (
      currentItem.caption ||
      assetDetails.note ||
      "image"
    ).replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${title}-${assetDetails.hash.slice(0, 8)}.${ext}`;

    const url = URL.createObjectURL(assetDetails.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast("Downloading original image...");
  };

  const handleOpenSource = () => {
    const url = currentItem.sourceUrl || assetDetails?.source?.url;
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom(zoom * factor);
  };

  // Pointer drag pan handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const sourceUrl = currentItem.sourceUrl || assetDetails?.source?.url;
  const sourceTitle =
    currentItem.sourceTitle ||
    assetDetails?.source?.title ||
    (sourceUrl
      ? new URL(sourceUrl, "https://example.com").hostname.replace(/^www\./, "")
      : undefined);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image Lightbox"
      data-tour="lightbox-modal"
      className="fixed inset-0 z-50 bg-[#0E1A1F]/90 backdrop-blur-md flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-150"
    >
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-sk bg-surface border-2 border-line text-ink font-hand font-bold text-xs shadow-hard animate-in fade-in duration-150">
          {toastMessage}
        </div>
      )}

      {/* Top Header Bar */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4 bg-surface/95 border-b-2 border-line text-ink">
        <div className="flex items-center gap-3">
          <div className="font-hand font-bold text-base text-ink">
            {currentItem.caption || "Image Inspection"}
          </div>
          {items.length > 1 && (
            <span className="text-xs font-mono px-2 py-0.5 rounded-sk-sm bg-paper border border-line/30 text-ink/70">
              {currentIndex + 1} / {items.length}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-paper border-2 border-line rounded-sk p-0.5 mr-2">
            <button
              onClick={() => setZoom(zoom * 1.25)}
              title="Zoom in (+)"
              className="p-1 hover:bg-surface rounded-sk-sm text-ink/80 hover:text-ink cursor-pointer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono px-1.5 text-ink/80 min-w-[42px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(zoom * 0.8)}
              title="Zoom out (-)"
              className="p-1 hover:bg-surface rounded-sk-sm text-ink/80 hover:text-ink cursor-pointer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetTransform}
              title="Reset view (Ctrl+0)"
              className="p-1 hover:bg-surface rounded-sk-sm text-ink/80 hover:text-ink cursor-pointer ml-0.5 border-l border-line/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Set as Wallpaper with Fit popover */}
          <div className="relative">
            <button
              onClick={() => setShowWallpaperFitMenu(!showWallpaperFitMenu)}
              className="px-3 py-1.5 rounded-sk bg-paper hover:bg-surface text-ink border-2 border-line font-hand font-bold text-xs flex items-center gap-1.5 shadow-hard-sm cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
            >
              <ImageIcon className="w-3.5 h-3.5 text-brand-blue" />
              <span>Set as Wallpaper</span>
            </button>

            {showWallpaperFitMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-surface border-2 border-line rounded-sk shadow-hard p-1 z-30 flex flex-col gap-0.5">
                <button
                  onClick={() => handleSetWallpaper("cover")}
                  className="w-full px-2.5 py-1.5 text-left rounded-sk-sm hover:bg-paper font-hand font-bold text-xs text-ink flex items-center justify-between cursor-pointer"
                >
                  <span>Cover Screen</span>
                  {wallpaperFit === "cover" && <Check className="w-3.5 h-3.5 text-brand-blue" />}
                </button>
                <button
                  onClick={() => handleSetWallpaper("contain")}
                  className="w-full px-2.5 py-1.5 text-left rounded-sk-sm hover:bg-paper font-hand font-bold text-xs text-ink flex items-center justify-between cursor-pointer"
                >
                  <span>Contain (Fit Entire)</span>
                  {wallpaperFit === "contain" && <Check className="w-3.5 h-3.5 text-brand-blue" />}
                </button>
              </div>
            )}
          </div>

          {/* Copy Image */}
          <button
            onClick={handleCopyImage}
            title="Copy image to clipboard"
            className="p-2 rounded-sk bg-paper hover:bg-surface text-ink border-2 border-line shadow-hard-sm cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
          >
            <Copy className="w-4 h-4" />
          </button>

          {/* Download Original */}
          <button
            onClick={handleDownload}
            title="Download original file"
            className="p-2 rounded-sk bg-paper hover:bg-surface text-ink border-2 border-line shadow-hard-sm cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Open Source */}
          {sourceUrl && (
            <button
              onClick={handleOpenSource}
              title={`Open source: ${sourceUrl}`}
              className="p-2 rounded-sk bg-paper hover:bg-surface text-ink border-2 border-line shadow-hard-sm cursor-pointer active:translate-x-[1px] active:translate-y-[1px]"
            >
              <ExternalLink className="w-4 h-4 text-brand-blue" />
            </button>
          )}

          {/* Divider */}
          <div className="w-px h-6 bg-line/20 mx-1" />

          {/* Close */}
          <button
            onClick={close}
            aria-label="Close lightbox (Esc)"
            className="p-2 rounded-sk bg-paper hover:bg-danger/10 hover:border-danger text-ink/75 hover:text-danger border-2 border-line shadow-hard-sm transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Viewport with Wheel Zoom & Drag Pan */}
      <div
        className="relative flex-1 w-full h-full overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={resetTransform}
      >
        {/* Previous Button */}
        {items.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            title="Previous image (Left Arrow)"
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-sk-lg bg-surface/90 hover:bg-surface text-ink border-2 border-line shadow-hard hover:scale-105 active:translate-x-[-2px] transition-all cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Full-Resolution Image Canvas Container */}
        {isLoading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-line border-t-brand-blue animate-spin" />
            <span className="font-hand font-bold text-xs text-white">Loading full-resolution asset...</span>
          </div>
        ) : imageUrl ? (
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isDraggingRef.current ? "none" : "transform 0.05s ease-out",
            }}
            className="max-w-[85vw] max-h-[75vh] flex items-center justify-center pointer-events-none select-none"
          >
            <img
              src={imageUrl}
              alt={currentItem.caption || "Full resolution lightbox view"}
              className="max-w-full max-h-[75vh] object-contain rounded-sk border-2 border-line shadow-hard bg-paper pointer-events-none"
              draggable={false}
            />
          </div>
        ) : (
          <div className="text-white font-hand font-bold text-sm">Failed to load asset image</div>
        )}

        {/* Next Button */}
        {items.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            title="Next image (Right Arrow)"
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-sk-lg bg-surface/90 hover:bg-surface text-ink border-2 border-line shadow-hard hover:scale-105 active:translate-x-[2px] transition-all cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Information Drawer (Sketchbook Tokens) */}
      <div className="relative z-20 px-6 py-3 bg-surface/95 border-t-2 border-line text-ink flex items-center justify-between flex-wrap gap-4">
        {/* Caption and Source */}
        <div className="flex items-center gap-4 flex-wrap max-w-xl">
          {currentItem.caption && (
            <div className="font-hand font-bold text-sm text-ink truncate max-w-sm">
              "{currentItem.caption}"
            </div>
          )}

          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-brand-blue hover:underline truncate max-w-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{sourceTitle || sourceUrl}</span>
            </a>
          )}

          {/* Tags */}
          {assetDetails?.tags && assetDetails.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag className="w-3.5 h-3.5 text-muted" />
              {assetDetails.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-sk-sm bg-paper border border-line/30 text-[11px] font-hand font-bold text-ink"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Palette Swatches & Technical Details */}
        <div className="flex items-center gap-4">
          {/* Palette Swatches */}
          {assetDetails?.palette && assetDetails.palette.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-muted" />
              <div className="flex items-center gap-1">
                {assetDetails.palette.map((swatch, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(swatch.hex);
                      showToast(`Copied ${swatch.hex}`);
                    }}
                    title={`${swatch.hex} (${Math.round(swatch.weight * 100)}%) - click to copy`}
                    style={{ backgroundColor: swatch.hex }}
                    className="w-5 h-5 rounded-sk-sm border border-line shadow-xs cursor-pointer hover:scale-110 transition-transform"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Asset Dimensions & Size */}
          {assetDetails && (
            <div className="text-[11px] font-mono text-muted flex items-center gap-2 border-l border-line/20 pl-3">
              <span>{assetDetails.width}×{assetDetails.height}</span>
              <span>•</span>
              <span>{formatBytes(assetDetails.bytes)}</span>
              <span>•</span>
              <span className="uppercase">{assetDetails.mime.split("/")[1]}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
