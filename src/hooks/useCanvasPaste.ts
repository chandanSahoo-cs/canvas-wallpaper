import { useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { ImageElement, TextElement } from "../elements/types";
import { newId, randomSeed } from "../lib/utils";
import { ingestImage } from "../lib/assets";
import { FONT_SIZE_MAP } from "../canvas/geometry";

function isInputElement(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  const activeEl = document.activeElement as HTMLElement | null;
  return (
    el?.tagName === "TEXTAREA" ||
    el?.tagName === "INPUT" ||
    el?.isContentEditable === true ||
    activeEl?.tagName === "TEXTAREA" ||
    activeEl?.tagName === "INPUT" ||
    activeEl?.isContentEditable === true
  );
}

export function useCanvasPaste() {
  const mode = useAppStore((s) => s.mode);
  const pasteClipboard = useAppStore((s) => s.pasteClipboard);
  const pushHistory = useAppStore((s) => s.pushHistory);
  const setElements = useAppStore((s) => s.setElements);
  const setSelectedIds = useAppStore((s) => s.setSelectedIds);
  const setTool = useAppStore((s) => s.setTool);
  const saveToStorage = useAppStore((s) => s.saveToStorage);
  const lastPasteHandledRef = useRef(0);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (mode !== "drawing") return;
      if (isInputElement(e.target)) return;

      lastPasteHandledRef.current = Date.now();

      // 1. Check if clipboard text contains canvas elements JSON
      const text = e.clipboardData?.getData("text/plain");
      if (text) {
        try {
          const parsed = JSON.parse(text);
          if (
            parsed &&
            parsed.type === "canvas-elements" &&
            Array.isArray(parsed.elements) &&
            parsed.elements.length > 0
          ) {
            e.preventDefault();
            pasteClipboard(parsed.elements);
            return;
          }
        } catch {
          // not canvas-elements JSON
        }
      }

      // 2. Check for image files in clipboard
      const items = e.clipboardData?.items;
      const imageFiles: File[] = [];
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith("image/")) {
            const file = items[i].getAsFile();
            if (file) imageFiles.push(file);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        (async () => {
          const store = useAppStore.getState();
          const screenCenterX = window.innerWidth / 2;
          const screenCenterY = window.innerHeight / 2;
          const newElements: ImageElement[] = [];

          for (let idx = 0; idx < imageFiles.length; idx++) {
            const file = imageFiles[idx];
            try {
              const asset = await ingestImage(file, {
                title: file.name || "Pasted Image",
                savedAt: Date.now(),
              });

              const maxW = 400;
              const maxH = 300;
              const scale = Math.min(maxW / asset.width, maxH / asset.height, 1);
              const w = Math.max(20, Math.round(asset.width * scale));
              const h = Math.max(20, Math.round(asset.height * scale));

              const offsetX = (idx % 5) * 24;
              const offsetY = Math.floor(idx / 5) * 24;

              const cx = Math.round(
                screenCenterX / store.zoom + store.scrollOffset.x - w / 2 + offsetX,
              );
              const cy = Math.round(
                screenCenterY / store.zoom + store.scrollOffset.y - h / 2 + offsetY,
              );

              newElements.push({
                id: newId(),
                type: "image",
                angle: 0,
                locked: false,
                groupIds: [],
                x: cx,
                y: cy,
                width: w,
                height: h,
                assetId: asset.id,
                caption: file.name ? file.name.replace(/\.[^/.]+$/, "") : "Pasted Image",
                strokeColor: store.currentStrokeColor || "#1e1e1e",
                fillColor: "transparent",
                strokeWidth: 1.5,
                opacity: 100,
                seed: randomSeed(),
              });
            } catch (err: any) {
              console.warn("Clipboard image ingest failed:", err);
            }
          }

          if (newElements.length > 0) {
            pushHistory();
            setElements([...useAppStore.getState().elements, ...newElements]);
            setSelectedIds(new Set(newElements.map((el) => el.id)));
            setTool("selection");
            saveToStorage();
          }
        })();
        return;
      }

      // 3. Check for plain text to paste as a new TextElement
      if (text && text.trim()) {
        e.preventDefault();
        const store = useAppStore.getState();
        const screenCenterX = window.innerWidth / 2;
        const screenCenterY = window.innerHeight / 2;
        const cx = Math.round(
          screenCenterX / store.zoom + store.scrollOffset.x - 50,
        );
        const cy = Math.round(
          screenCenterY / store.zoom + store.scrollOffset.y - 15,
        );

        const textEl: TextElement = {
          id: newId(),
          type: "text",
          angle: 0,
          locked: false,
          groupIds: [],
          x: cx,
          y: cy,
          text: text.slice(0, 10000),
          fontSize: FONT_SIZE_MAP[store.currentStrokeWidth] || 20,
          fontFamily: store.currentFontFamily || "handwritten",
          strokeColor: store.currentStrokeColor,
          fillColor: "transparent",
          strokeWidth: store.currentStrokeWidth,
          opacity: store.currentOpacity,
          seed: randomSeed(),
        };

        pushHistory();
        setElements([...useAppStore.getState().elements, textEl]);
        setSelectedIds(new Set([textEl.id]));
        setTool("selection");
        saveToStorage();
        return;
      }

      // 4. Fallback: internal clipboard
      const state = useAppStore.getState();
      if (state.clipboard && state.clipboard.length > 0) {
        e.preventDefault();
        pasteClipboard();
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [
    mode,
    pasteClipboard,
    pushHistory,
    setElements,
    setSelectedIds,
    setTool,
    saveToStorage,
  ]);
}
