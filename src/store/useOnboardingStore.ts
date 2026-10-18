import { create } from "zustand";

export const TOUR_STORAGE_KEY = "papertab_tour_completed";

export interface TourStepConfig {
  id: string;
  targetSelector: string;
  badge: string;
  title: string;
  description: string;
  placement: "top" | "bottom" | "left" | "right" | "center";
  targetMode?: "wallpaper" | "drawing";
}

export const TOUR_STEPS: TourStepConfig[] = [
  {
    id: "dock",
    targetSelector: "#tour-wallpaper-dock",
    badge: "Control Dock",
    title: "Your Wallpaper & Action Dock",
    description:
      "PaperTab is both your clean new-tab wallpaper and a full creative whiteboard. Use this dock to adjust settings, customize widget layouts, or jump straight into Draw mode.",
    placement: "top",
    targetMode: "wallpaper",
  },
  {
    id: "toolbar",
    targetSelector: "#tour-toolbar",
    badge: "Creative Suite",
    title: "Drawing Tools & Infinite Canvas",
    description:
      "Draw with the pencil, create shapes, add text, or paste images. Hold Space and drag anywhere to pan across the infinite canvas, and use Ctrl + Scroll to zoom.",
    placement: "bottom",
    targetMode: "drawing",
  },
  {
    id: "style-panel",
    targetSelector: "#tour-style-panel",
    badge: "Styling & Theme",
    title: "Styles & Wallpaper Customizer",
    description:
      "Fine-tune stroke colors, fills, opacity, line roughness, and fonts. Switch to the Wallpaper tab anytime to set solid colors, gradients, custom background images, or grid patterns.",
    placement: "right",
    targetMode: "drawing",
  },
  {
    id: "scene-switcher",
    targetSelector: "#tour-scene-switcher",
    badge: "Workspaces",
    title: "Multi-Scene Boards",
    description:
      "Keep multiple canvases for different purposes—like a daily planner, study whiteboard, or aesthetic drawings. Switch or add new scenes with a single click.",
    placement: "bottom",
    targetMode: "drawing",
  },
  {
    id: "shortcuts-complete",
    targetSelector: "",
    badge: "Quick Tips",
    title: "You're All Set!",
    description:
      "A few quick shortcuts to get the most out of PaperTab:\n• Press E to quickly toggle between Wallpaper and Drawing mode.\n• Press ? anytime to open the full shortcuts cheat sheet.\n• Press B to preview the visible screen boundary.",
    placement: "center",
    targetMode: "wallpaper",
  },
];

interface OnboardingState {
  hasCompletedTour: boolean;
  isWelcomeOpen: boolean;
  isTourActive: boolean;
  currentStepIndex: number;

  checkInitialStatus: () => void;
  openWelcomeModal: () => void;
  closeWelcomeModal: (markCompleted?: boolean) => void;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  completeTour: () => void;
  resetTour: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  hasCompletedTour: true, // Default to true until checked, avoiding flicker
  isWelcomeOpen: false,
  isTourActive: false,
  currentStepIndex: 0,

  checkInitialStatus: () => {
    let completed = false;
    try {
      if (typeof localStorage !== "undefined") {
        completed = localStorage.getItem(TOUR_STORAGE_KEY) === "true";
      }
    } catch (e) {}

    if (completed) {
      set({ hasCompletedTour: true, isWelcomeOpen: false });
      return;
    }

    // Check chrome.storage.local
    try {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.local
      ) {
        chrome.storage.local.get(
          [TOUR_STORAGE_KEY],
          (res: Record<string, any>) => {
            if (res[TOUR_STORAGE_KEY] === true) {
              set({ hasCompletedTour: true, isWelcomeOpen: false });
              try {
                localStorage.setItem(TOUR_STORAGE_KEY, "true");
              } catch (e) {}
            } else {
              set({ hasCompletedTour: false, isWelcomeOpen: true });
            }
          },
        );
      } else {
        set({ hasCompletedTour: false, isWelcomeOpen: true });
      }
    } catch (e) {
      set({ hasCompletedTour: false, isWelcomeOpen: true });
    }
  },

  openWelcomeModal: () => {
    set({ isWelcomeOpen: true, isTourActive: false });
  },

  closeWelcomeModal: (markCompleted = true) => {
    set({ isWelcomeOpen: false });
    if (markCompleted) {
      get().completeTour();
    }
  },

  startTour: () => {
    set({
      isWelcomeOpen: false,
      isTourActive: true,
      currentStepIndex: 0,
    });
  },

  nextStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else {
      get().completeTour();
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  goToStep: (index: number) => {
    if (index >= 0 && index < TOUR_STEPS.length) {
      set({ currentStepIndex: index });
    }
  },

  completeTour: () => {
    set({
      isTourActive: false,
      isWelcomeOpen: false,
      hasCompletedTour: true,
    });

    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(TOUR_STORAGE_KEY, "true");
      }
    } catch (e) {}

    try {
      if (
        typeof chrome !== "undefined" &&
        chrome.storage &&
        chrome.storage.local
      ) {
        chrome.storage.local.set({ [TOUR_STORAGE_KEY]: true });
      }
    } catch (e) {}
  },

  resetTour: () => {
    set({
      isTourActive: true,
      isWelcomeOpen: false,
      currentStepIndex: 0,
    });
  },
}));
