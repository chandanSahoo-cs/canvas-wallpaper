import { create } from "zustand";
import { TourStepConfig, ChapterInfo } from "../lib/tour/types";
import { TOUR_STEPS, CHAPTERS } from "../lib/tour/chapters";
import { useAppStore } from "./useAppStore";
import { useLibraryStore } from "../lib/library/store";
import { useInboxStore } from "../lib/inbox/store";
import { useLightboxStore } from "../lib/lightbox/store";

export const TOUR_VERSION = 2;
export const TOUR_VERSION_KEY = "papertab_tour_version";
export const TOUR_STORAGE_KEY = `papertab_tour_v${TOUR_VERSION}_completed`;
export const TOUR_CHAPTERS_KEY = `papertab_tour_v${TOUR_VERSION}_chapters`;
export const TOUR_HINTS_KEY = `papertab_tour_v${TOUR_VERSION}_hint_dismissed`;

export { TOUR_STEPS, CHAPTERS };
export type { TourStepConfig, ChapterInfo };

interface OnboardingState {
  hasCompletedTour: boolean;
  completedChapters: string[];
  isWelcomeOpen: boolean;
  isTourActive: boolean;
  activeChapterId: string;
  currentStepIndex: number;
  initialMode: "wallpaper" | "drawing";
  announcement: string;

  checkInitialStatus: () => void;
  openWelcomeModal: () => void;
  closeWelcomeModal: (markCompleted?: boolean) => void;
  startTour: (chapterId?: string) => void;
  startChapter: (chapterId: string) => void;
  nextStep: () => Promise<void>;
  prevStep: () => Promise<void>;
  goToStep: (index: number) => Promise<void>;
  completeTour: () => Promise<void>;
  skipTour: () => Promise<void>;
  resetTour: () => void;
  isChapterCompleted: (chapterId: string) => boolean;
  markChapterCompleted: (chapterId: string) => void;
  getActiveSteps: () => TourStepConfig[];
  getCurrentStep: () => TourStepConfig | null;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  hasCompletedTour: true, // Default true until checked to prevent initial flash
  completedChapters: [],
  isWelcomeOpen: false,
  isTourActive: false,
  activeChapterId: "core",
  currentStepIndex: 0,
  initialMode: "wallpaper",
  announcement: "",

  getActiveSteps: () => {
    const { activeChapterId } = get();
    return TOUR_STEPS.filter((s) => s.chapterId === activeChapterId);
  },

  getCurrentStep: () => {
    const steps = get().getActiveSteps();
    const { currentStepIndex } = get();
    return steps[currentStepIndex] || null;
  },

  isChapterCompleted: (chapterId: string) => {
    return get().completedChapters.includes(chapterId);
  },

  markChapterCompleted: (chapterId: string) => {
    const { completedChapters } = get();
    if (!completedChapters.includes(chapterId)) {
      const updated = [...completedChapters, chapterId];
      set({ completedChapters: updated });

      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(TOUR_CHAPTERS_KEY, JSON.stringify(updated));
        }
      } catch (e) {}

      try {
        if (typeof chrome !== "undefined" && chrome.storage?.local) {
          chrome.storage.local.set({ [TOUR_CHAPTERS_KEY]: updated });
        }
      } catch (e) {}
    }
  },

  checkInitialStatus: () => {
    let completed = false;
    let chapters: string[] = [];
    let isVersionMatch = false;

    try {
      if (typeof localStorage !== "undefined") {
        const storedVersion = localStorage.getItem(TOUR_VERSION_KEY);
        isVersionMatch = storedVersion === String(TOUR_VERSION);
        completed = localStorage.getItem(TOUR_STORAGE_KEY) === "true";
        const storedChapters = localStorage.getItem(TOUR_CHAPTERS_KEY);
        if (storedChapters) {
          chapters = JSON.parse(storedChapters);
        }
      }
    } catch (e) {}

    // Check chrome.storage.local if not already found in localStorage
    if (!isVersionMatch) {
      try {
        if (typeof chrome !== "undefined" && chrome.storage?.local) {
          chrome.storage.local.get(
            [TOUR_VERSION_KEY, TOUR_STORAGE_KEY, TOUR_CHAPTERS_KEY],
            (res) => {
              const chromeVersion = res[TOUR_VERSION_KEY];
              const chromeCompleted = res[TOUR_STORAGE_KEY] === true;
              const chromeChapters = Array.isArray(res[TOUR_CHAPTERS_KEY])
                ? res[TOUR_CHAPTERS_KEY]
                : [];

              if (chromeVersion === TOUR_VERSION && chromeCompleted) {
                set({
                  hasCompletedTour: true,
                  completedChapters: chromeChapters,
                  isWelcomeOpen: false,
                });
                try {
                  localStorage.setItem(TOUR_VERSION_KEY, String(TOUR_VERSION));
                  localStorage.setItem(TOUR_STORAGE_KEY, "true");
                  localStorage.setItem(TOUR_CHAPTERS_KEY, JSON.stringify(chromeChapters));
                } catch (e) {}
              } else {
                set({
                  hasCompletedTour: false,
                  completedChapters: chromeChapters,
                  isWelcomeOpen: true,
                });
              }
            },
          );
          return;
        }
      } catch (e) {}

      // First run or upgraded version: show welcome modal
      set({
        hasCompletedTour: false,
        completedChapters: chapters,
        isWelcomeOpen: true,
      });
      return;
    }

    set({
      hasCompletedTour: completed,
      completedChapters: chapters,
      isWelcomeOpen: !completed,
    });
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

  startTour: (chapterId = "core") => {
    const currentMode = useAppStore.getState().mode;
    set({
      isWelcomeOpen: false,
      isTourActive: true,
      activeChapterId: chapterId,
      currentStepIndex: 0,
      initialMode: currentMode,
      announcement: `Started ${chapterId} tour. Step 1.`,
    });

    const steps = TOUR_STEPS.filter((s) => s.chapterId === chapterId);
    if (steps[0]?.onEnter) {
      steps[0].onEnter();
    }
  },

  startChapter: (chapterId: string) => {
    get().startTour(chapterId);
  },

  nextStep: async () => {
    const { currentStepIndex, activeChapterId } = get();
    const steps = get().getActiveSteps();
    const currentStep = steps[currentStepIndex];

    if (currentStep?.onExit) {
      await currentStep.onExit();
    }

    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextStepObj = steps[nextIndex];
      set({
        currentStepIndex: nextIndex,
        announcement: `Step ${nextIndex + 1} of ${steps.length}: ${nextStepObj.title}`,
      });
      if (nextStepObj?.onEnter) {
        await nextStepObj.onEnter();
      }
    } else {
      get().markChapterCompleted(activeChapterId);
      await get().completeTour();
    }
  },

  prevStep: async () => {
    const { currentStepIndex } = get();
    const steps = get().getActiveSteps();
    const currentStep = steps[currentStepIndex];

    if (currentStep?.onExit) {
      await currentStep.onExit();
    }

    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      const prevStepObj = steps[prevIndex];
      set({
        currentStepIndex: prevIndex,
        announcement: `Step ${prevIndex + 1} of ${steps.length}: ${prevStepObj.title}`,
      });
      if (prevStepObj?.onEnter) {
        await prevStepObj.onEnter();
      }
    }
  },

  goToStep: async (index: number) => {
    const steps = get().getActiveSteps();
    const { currentStepIndex } = get();
    if (index >= 0 && index < steps.length) {
      const currentStep = steps[currentStepIndex];
      if (currentStep?.onExit) {
        await currentStep.onExit();
      }
      set({ currentStepIndex: index });
      const nextStepObj = steps[index];
      if (nextStepObj?.onEnter) {
        await nextStepObj.onEnter();
      }
    }
  },

  completeTour: async () => {
    const { activeChapterId, initialMode } = get();
    const currentStep = get().getCurrentStep();
    if (currentStep?.onExit) {
      try {
        await currentStep.onExit();
      } catch (e) {}
    }

    get().markChapterCompleted(activeChapterId);

    // Teardown: close any modals that the tour opened
    useAppStore.getState().setIsSettingsOpen(false);
    useAppStore.getState().setIsShortcutsOpen(false);
    useAppStore.getState().setIsBackupOpen(false);
    useAppStore.getState().setIsPresetsOpen(false);
    useLibraryStore.getState().setIsOpen(false);
    useInboxStore.getState().setIsOpen(false);
    useLightboxStore.getState().close();

    // Restore user initial mode
    if (useAppStore.getState().mode !== initialMode) {
      useAppStore.getState().setMode(initialMode);
    }

    set({
      isTourActive: false,
      isWelcomeOpen: false,
      hasCompletedTour: true,
      announcement: "Tour completed.",
    });

    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(TOUR_VERSION_KEY, String(TOUR_VERSION));
        localStorage.setItem(TOUR_STORAGE_KEY, "true");
      }
    } catch (e) {}

    try {
      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.set({
          [TOUR_VERSION_KEY]: TOUR_VERSION,
          [TOUR_STORAGE_KEY]: true,
        });
      }
    } catch (e) {}
  },

  skipTour: async () => {
    await get().completeTour();
  },

  resetTour: () => {
    get().startTour("core");
  },
}));
