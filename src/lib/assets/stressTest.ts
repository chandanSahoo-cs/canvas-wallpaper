import { ImageElement } from "../../elements/types";
import { useAppStore } from "../../store/useAppStore";
import { ingestImage } from "./ingest";

export interface StressTestOptions {
  count?: number;
  include12MP?: boolean;
}

export async function runStressTest(options: StressTestOptions = {}): Promise<{
  count: number;
  totalBytes: number;
}> {
  const count = options.count ?? 20;
  const include12MP = options.include12MP ?? true;

  const currentElements = useAppStore.getState().elements;
  const newElements: ImageElement[] = [];
  let totalBytes = 0;

  // Layout parameters
  const cols = Math.ceil(Math.sqrt(count));
  const cardW = 280;
  const cardH = 210;
  const gap = 30;
  const startX = 100;
  const startY = 100;

  for (let i = 0; i < count; i++) {
    // Make 1 or 2 images 12MP (4000x3000), others standard (800x600)
    const is12MP = include12MP && (i === 0 || i === Math.floor(count / 2));
    const width = is12MP ? 4000 : 800;
    const height = is12MP ? 3000 : 600;

    const offscreen = new OffscreenCanvas(width, height);
    const ctx = offscreen.getContext("2d");
    if (!ctx) continue;

    // Background fill
    const hue = (i * 37) % 360;
    ctx.fillStyle = `hsl(${hue}, 40%, 92%)`;
    ctx.fillRect(0, 0, width, height);

    // Decorative ink borders and shapes
    ctx.strokeStyle = "#0E1A1F";
    ctx.lineWidth = is12MP ? 24 : 6;
    ctx.strokeRect(
      is12MP ? 40 : 10,
      is12MP ? 40 : 10,
      width - (is12MP ? 80 : 20),
      height - (is12MP ? 80 : 20),
    );

    // Geometric doodles
    for (let j = 0; j < 8; j++) {
      ctx.fillStyle = `hsla(${(hue + j * 45) % 360}, 70%, 50%, 0.6)`;
      ctx.beginPath();
      const cx = (width * (j + 1)) / 10;
      const cy = height / 2 + Math.sin(j) * (height / 4);
      const r = is12MP ? 180 : 45;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = "#0E1A1F";
    const fontSize = is12MP ? 120 : 30;
    ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `Stress Test #${i + 1} (${is12MP ? "12 Megapixels" : `${width}x${height}`})`,
      width / 2,
      height / 2,
    );

    const blob = await offscreen.convertToBlob({
      type: "image/webp",
      quality: 0.85,
    });
    totalBytes += blob.size;

    const asset = await ingestImage(blob, {
      title: `Stress Image ${i + 1}`,
    });

    const col = i % cols;
    const row = Math.floor(i / cols);

    const el: ImageElement = {
      id: `stress-${Date.now()}-${i}`,
      type: "image",
      assetId: asset.id,
      x: startX + col * (cardW + gap),
      y: startY + row * (cardH + gap),
      width: cardW,
      height: cardH,
      caption: `Stress #${i + 1} (${is12MP ? "12MP" : "800x600"})`,
      showCaption: true,
      strokeColor: "#0E1A1F",
      fillColor: "transparent",
      strokeWidth: 2,
      strokeStyle: "solid",
      roughness: 0,
      opacity: 100,
      locked: false,
      seed: Math.floor(Math.random() * 2 ** 31),
    };
    newElements.push(el);
  }

  useAppStore.getState().pushHistory();
  useAppStore.getState().setElements([...currentElements, ...newElements]);

  return { count: newElements.length, totalBytes };
}
