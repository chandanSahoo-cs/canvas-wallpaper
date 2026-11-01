import { useState, useEffect } from "react";
import { ALLOWED_IMAGE_MIME_TYPES, ingestImage } from "../lib/assets";
import { ImageElement } from "../elements/types";
import { useAppStore } from "../store/useAppStore";
import { placeInboxItemOnBoard } from "../lib/inbox/placement";

interface UseCanvasDropOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function useCanvasDrop({ canvasRef }: UseCanvasDropOptions) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "copy";
      }
      setIsDraggingOver(true);
    };

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      // If leaving the canvas or window, reset drop state
      if (!e.relatedTarget || (e.clientX <= 0 && e.clientY <= 0)) {
        setIsDraggingOver(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);

      const dt = e.dataTransfer;
      if (!dt) return;

      const rect = canvas.getBoundingClientRect();
      const { zoom, scrollOffset } = useAppStore.getState();
      const dropX = (e.clientX - rect.left) / zoom + scrollOffset.x;
      const dropY = (e.clientY - rect.top) / zoom + scrollOffset.y;

      // Path 0: Dropped from PaperTab Inbox Tray
      const inboxData = dt.getData("application/papertab-inbox-item");
      if (inboxData) {
        try {
          const item = JSON.parse(inboxData);
          await placeInboxItemOnBoard(item, { x: dropX, y: dropY });
          return;
        } catch (err) {
          console.warn("Failed to drop inbox item:", err);
        }
      }

      const rawFiles = Array.from(dt.files || []);
      const imageFiles = rawFiles.filter((f) =>
        ALLOWED_IMAGE_MIME_TYPES.has(f.type),
      );

      // Path A: Multiple or single dropped file(s)
      if (imageFiles.length > 0) {
        const newElements: ImageElement[] = [];
        const cols = Math.ceil(Math.sqrt(imageFiles.length));
        const gap = 24;

        // Default display size
        const defaultW = 320;
        const defaultH = 240;

        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          try {
            const asset = await ingestImage(file, { title: file.name });
            let displayW = defaultW;
            let displayH = defaultH;

            if (asset.width > 0 && asset.height > 0) {
              const aspect = asset.width / asset.height;
              if (aspect >= 1) {
                displayW = Math.min(asset.width, 360);
                displayH = Math.round(displayW / aspect);
              } else {
                displayH = Math.min(asset.height, 360);
                displayW = Math.round(displayH * aspect);
              }
            }

            let posX: number;
            let posY: number;

            if (imageFiles.length === 1) {
              posX = Math.round(dropX - displayW / 2);
              posY = Math.round(dropY - displayH / 2);
            } else {
              const col = i % cols;
              const row = Math.floor(i / cols);
              posX = Math.round(dropX + col * (defaultW + gap));
              posY = Math.round(dropY + row * (defaultH + gap));
            }

            const element: ImageElement = {
              id: `img-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
              type: "image",
              assetId: asset.id,
              x: posX,
              y: posY,
              width: displayW,
              height: displayH,
              caption: file.name,
              showCaption: false,
              strokeColor: "#0E1A1F",
              fillColor: "transparent",
              strokeWidth: 2,
              strokeStyle: "solid",
              roughness: 0,
              opacity: 100,
              locked: false,
              seed: Math.floor(Math.random() * 2 ** 31),
            };
            newElements.push(element);
          } catch (err) {
            console.error(`Failed to ingest dropped file ${file.name}:`, err);
          }
        }

        if (newElements.length > 0) {
          const state = useAppStore.getState();
          state.pushHistory();
          state.setElements([...state.elements, ...newElements]);
          state.setSelectedIds(new Set(newElements.map((el) => el.id)));
          state.setTool("selection");
          if (state.mode === "wallpaper") {
            state.setMode("drawing");
          }
        }
        return;
      }

      // Path B: External dragged image from another tab (URL / HTML)
      let externalUrl = dt.getData("text/uri-list")?.trim();
      if (!externalUrl) {
        const html = dt.getData("text/html");
        if (html) {
          const match = html.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
          if (match && match[1]) {
            externalUrl = match[1];
          }
        }
      }

      if (
        externalUrl &&
        (externalUrl.startsWith("http://") || externalUrl.startsWith("https://"))
      ) {
        try {
          const res = await fetch(externalUrl);
          if (!res.ok) {
            throw new Error(`Failed to fetch image: ${res.statusText}`);
          }
          const blob = await res.blob();
          if (!ALLOWED_IMAGE_MIME_TYPES.has(blob.type)) {
            throw new Error(`Unsupported image type: ${blob.type}`);
          }

          const filename = externalUrl.split("/").pop()?.split("?")[0] || "Web Image";
          const asset = await ingestImage(blob, {
            url: externalUrl,
            title: filename,
          });

          let displayW = 320;
          let displayH = 240;
          if (asset.width > 0 && asset.height > 0) {
            const aspect = asset.width / asset.height;
            if (aspect >= 1) {
              displayW = Math.min(asset.width, 360);
              displayH = Math.round(displayW / aspect);
            } else {
              displayH = Math.min(asset.height, 360);
              displayW = Math.round(displayH * aspect);
            }
          }

          const element: ImageElement = {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            type: "image",
            assetId: asset.id,
            x: Math.round(dropX - displayW / 2),
            y: Math.round(dropY - displayH / 2),
            width: displayW,
            height: displayH,
            caption: filename,
            showCaption: false,
            sourceUrl: externalUrl,
            strokeColor: "#0E1A1F",
            fillColor: "transparent",
            strokeWidth: 2,
            strokeStyle: "solid",
            roughness: 0,
            opacity: 100,
            locked: false,
            seed: Math.floor(Math.random() * 2 ** 31),
          };

          const state = useAppStore.getState();
          state.pushHistory();
          state.setElements([...state.elements, element]);
          state.setSelectedIds(new Set([element.id]));
          state.setTool("selection");
          if (state.mode === "wallpaper") {
            state.setMode("drawing");
          }
        } catch (err) {
          console.warn("Could not import external image:", err);
          alert(
            "Could not load image directly from external website (CORS / origin restriction). Please save the image file and drop it instead.",
          );
        }
      }
    };

    canvas.addEventListener("dragover", handleDragOver);
    canvas.addEventListener("dragenter", handleDragEnter);
    canvas.addEventListener("dragleave", handleDragLeave);
    canvas.addEventListener("drop", handleDrop);

    return () => {
      canvas.removeEventListener("dragover", handleDragOver);
      canvas.removeEventListener("dragenter", handleDragEnter);
      canvas.removeEventListener("dragleave", handleDragLeave);
      canvas.removeEventListener("drop", handleDrop);
    };
  }, [canvasRef]);

  return { isDraggingOver };
}
