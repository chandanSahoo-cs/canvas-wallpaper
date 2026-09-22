import { X } from "lucide-react";
import React from "react";
import { BackgroundConfig, CanvasElement } from "../elements/types";
import { newId, randomSeed } from "../lib/utils";
import { useAppStore } from "../store/useAppStore";

export interface WallpaperTemplate {
  id: string;
  title: string;
  category: "minimal" | "aesthetic" | "productivity" | "creative";
  description: string;
  background: BackgroundConfig;
  elements: () => CanvasElement[];
}

export const TEMPLATES: WallpaperTemplate[] = [
  {
    id: "minimal-focus",
    title: "Minimal Focus",
    category: "productivity",
    description:
      "Clean dark slate with subtle dots, a sticky note, and daily goals box",
    background: {
      type: "color",
      color: "#14141a",
      pattern: "dots",
    },
    elements: () => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      return [
        {
          id: newId(),
          type: "rectangle",
          x: cx - 220,
          y: cy + 60,
          width: 200,
          height: 180,
          strokeColor: "#f08c00",
          fillColor: "#ffec99",
          fillStyle: "solid",
          strokeWidth: 1.5,
          strokeStyle: "solid",
          roughness: 1.4,
          opacity: 90,
          locked: false,
          seed: randomSeed(),
        },
        {
          id: newId(),
          type: "text",
          x: cx - 200,
          y: cy + 80,
          text: "📌 Focus for Today\n- Code with clarity\n- Take breaks\n- Ship features",
          strokeColor: "#1e1e1e",
          fillColor: "transparent",
          strokeWidth: 1.5,
          opacity: 100,
          locked: false,
          seed: randomSeed(),
        },
        {
          id: newId(),
          type: "rectangle",
          x: cx + 20,
          y: cy + 60,
          width: 200,
          height: 180,
          strokeColor: "#6965db",
          fillColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 1.5,
          strokeStyle: "dashed",
          roughness: 1.2,
          opacity: 80,
          locked: false,
          seed: randomSeed(),
        },
        {
          id: newId(),
          type: "text",
          x: cx + 40,
          y: cy + 80,
          text: "💡 Quick Ideas\n\nDraft notes here...",
          strokeColor: "#e0dfff",
          fillColor: "transparent",
          strokeWidth: 1.5,
          opacity: 90,
          locked: false,
          seed: randomSeed(),
        },
      ];
    },
  },
  {
    id: "blueprint-grid",
    title: "Technical Blueprint",
    category: "minimal",
    description:
      "Deep navy background with blueprint grid and flowchart blocks",
    background: {
      type: "color",
      color: "#0b3d91",
      pattern: "grid",
    },
    elements: () => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      return [
        {
          id: newId(),
          type: "diamond",
          x: cx - 60,
          y: cy + 80,
          width: 120,
          height: 80,
          strokeColor: "#a5d8ff",
          fillColor: "transparent",
          fillStyle: "solid",
          strokeWidth: 1.5,
          strokeStyle: "solid",
          roughness: 1.2,
          opacity: 90,
          locked: false,
          seed: randomSeed(),
        },
        {
          id: newId(),
          type: "text",
          x: cx - 35,
          y: cy + 110,
          text: "Decision?",
          strokeColor: "#ffffff",
          fillColor: "transparent",
          strokeWidth: 1.5,
          opacity: 100,
          locked: false,
          seed: randomSeed(),
        },
      ];
    },
  },
  {
    id: "sunset-vibes",
    title: "Sunset Vibes",
    category: "aesthetic",
    description:
      "Smooth twilight gradient with minimalist sketched geometric accents",
    background: {
      type: "gradient",
      color: "#0f0c29",
      gradient: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      pattern: "dots",
    },
    elements: () => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      return [
        {
          id: newId(),
          type: "ellipse",
          x: cx - 80,
          y: cy + 70,
          width: 160,
          height: 160,
          strokeColor: "#feb47b",
          fillColor: "#ff7e5f",
          fillStyle: "hachure",
          strokeWidth: 1.5,
          strokeStyle: "solid",
          roughness: 1.6,
          opacity: 60,
          locked: false,
          seed: randomSeed(),
        },
      ];
    },
  },
  {
    id: "creative-sketch",
    title: "Creative Sketchbook",
    category: "creative",
    description:
      "Clean off-white look with playful hand-drawn doodles and arrows",
    background: {
      type: "color",
      color: "#f5f5f7",
      pattern: "lines",
    },
    elements: () => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      return [
        {
          id: newId(),
          type: "rectangle",
          x: cx - 180,
          y: cy + 70,
          width: 360,
          height: 140,
          strokeColor: "#1e1e1e",
          fillColor: "#b2f2bb",
          fillStyle: "hachure",
          strokeWidth: 1.5,
          strokeStyle: "solid",
          roughness: 1.8,
          opacity: 70,
          locked: false,
          seed: randomSeed(),
        },
        {
          id: newId(),
          type: "text",
          x: cx - 150,
          y: cy + 110,
          text: "✨ Make something wonderful today!",
          strokeColor: "#1e1e1e",
          fillColor: "transparent",
          strokeWidth: 3,
          opacity: 100,
          locked: false,
          seed: randomSeed(),
        },
      ];
    },
  },
];

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  isOpen,
  onClose,
}) => {
  const setElements = useAppStore((s) => s.setElements);
  const setBackground = useAppStore((s) => s.setBackground);
  const pushHistory = useAppStore((s) => s.pushHistory);
  const saveToStorage = useAppStore((s) => s.saveToStorage);

  if (!isOpen) return null;

  const handleApply = (template: WallpaperTemplate) => {
    pushHistory();
    setBackground(template.background);
    const newEls = template.elements();
    setElements(newEls);
    saveToStorage();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-neutral-200 text-neutral-800 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-base font-semibold">Wallpaper Templates</h2>
              <p className="text-xs text-neutral-500">
                Choose a pre-designed template to inspire your wallpaper
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 overflow-y-auto">
          {TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => handleApply(tmpl)}
              className="border border-neutral-200 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all duration-150 group active:scale-[0.98] bg-neutral-50/50">
              <div>
                <div
                  className="w-full h-24 rounded-xl mb-3 border border-neutral-200 flex items-center justify-center text-xs font-semibold text-white/90 shadow-inner"
                  style={{
                    backgroundColor: tmpl.background.color,
                    backgroundImage: tmpl.background.gradient,
                  }}>
                  <span className="bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px]">
                    {tmpl.title}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-neutral-800 group-hover:text-indigo-600 transition-colors">
                  {tmpl.title}
                </h4>
                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-neutral-100 text-xs">
                <span className="capitalize px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[10px] font-medium">
                  {tmpl.category}
                </span>
                <span className="text-indigo-600 font-medium text-xs group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Use Template →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
