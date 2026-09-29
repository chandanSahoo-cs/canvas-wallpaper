import { useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { ImageElement, TextElement } from "../elements/types";
import { newId, randomSeed } from "../lib/utils";
import { optimizeImageDataUrl } from "../lib/imageInsert";
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

      // 1. Check if clipboard text contains canvas elements
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

      // 2. Check for images in clipboard items
      const items = e.clipboardData?.items;
      let hasImage = false;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            hasImage = true;
            const blob = items[i].getAsFile();
            if (!blob) continue;
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              const img = new Image();
              img.onload = () => {
                const maxW = 400;
                const maxH = 300;
                const scale = Math.min(maxW / img.width, maxH / img.height, 1);
                const w = img.width * scale;
                const h = img.height * scale;

                const store = useAppStore.getState();
                const screenCenterX = window.innerWidth / 2;
                const screenCenterY = window.innerHeight / 2;
                const cx = Math.round(
                  screenCenterX / store.zoom + store.scrollOffset.x - w / 2,
                );
                const cy = Math.round(
                  screenCenterY / store.zoom + store.scrollOffset.y - h / 2,
                );

                const imageEl: ImageElement = {
                  id: newId(),
                  type: "image",
                  angle: 0,
                  locked: false,
                  groupIds: [],
                  x: cx,
                  y: cy,
                  width: w,
                  height: h,
                  dataUrl: optimizeImageDataUrl(img),
                  strokeColor: store.currentStrokeColor || "#1e1e1e",
                  fillColor: "transparent",
                  strokeWidth: 1.5,
                  opacity: 100,
                  seed: randomSeed(),
                };

                pushHistory();
                setElements([...useAppStore.getState().elements, imageEl]);
                setSelectedIds([imageEl.id]);
                setTool("selection");
                saveToStorage();
              };
              img.src = dataUrl;
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
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
        setSelectedIds([textEl.id]);
        setTool("selection");
        saveToStorage();
        return;
      }

      // 4. Fallback: if internal store has copied elements, paste them
      if (!hasImage) {
        const state = useAppStore.getState();
        if (state.clipboard && state.clipboard.length > 0) {
          e.preventDefault();
          pasteClipboard();
        }
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
