import React, { useState, useEffect } from "react";
import { Compass, X } from "lucide-react";
import { useOnboardingStore, CHAPTERS, TOUR_HINTS_KEY } from "../store/useOnboardingStore";
import { useInboxStore } from "../lib/inbox/store";
import { useLibraryStore } from "../lib/library/store";
import { useAppStore } from "../store/useAppStore";

export const TourHintPill: React.FC = () => {
  const isTourActive = useOnboardingStore((s) => s.isTourActive);
  const isWelcomeOpen = useOnboardingStore((s) => s.isWelcomeOpen);
  const completedChapters = useOnboardingStore((s) => s.completedChapters);
  const startChapter = useOnboardingStore((s) => s.startChapter);

  const isInboxOpen = useInboxStore((s) => s.isOpen);
  const isLibraryOpen = useLibraryStore((s) => s.isOpen);
  const selectedCount = useAppStore((s) => s.selectedIds.size);

  const [dismissedHints, setDismissedHints] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(TOUR_HINTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeHintChapterId, setActiveHintChapterId] = useState<string | null>(null);

  useEffect(() => {
    if (isTourActive || isWelcomeOpen) {
      setActiveHintChapterId(null);
      return;
    }

    if (isInboxOpen && !completedChapters.includes("collect") && !dismissedHints.includes("collect")) {
      setActiveHintChapterId("collect");
      return;
    }

    if (isLibraryOpen && !completedChapters.includes("find") && !dismissedHints.includes("find")) {
      setActiveHintChapterId("find");
      return;
    }

    if (selectedCount >= 2 && !completedChapters.includes("organize") && !dismissedHints.includes("organize")) {
      setActiveHintChapterId("organize");
      return;
    }

    setActiveHintChapterId(null);
  }, [
    isTourActive,
    isWelcomeOpen,
    isInboxOpen,
    isLibraryOpen,
    selectedCount,
    completedChapters,
    dismissedHints,
  ]);

  if (!activeHintChapterId) return null;

  const chapter = CHAPTERS.find((c) => c.id === activeHintChapterId);
  if (!chapter) return null;

  const handleDismiss = () => {
    const updated = [...dismissedHints, activeHintChapterId];
    setDismissedHints(updated);
    try {
      localStorage.setItem(TOUR_HINTS_KEY, JSON.stringify(updated));
    } catch (e) {}
    setActiveHintChapterId(null);
  };

  const handleStart = () => {
    handleDismiss();
    startChapter(activeHintChapterId);
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 rounded-sk bg-surface border-2 border-line shadow-hard text-ink text-xs font-sans animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
      <Compass className="w-4 h-4 text-brand-blue shrink-0 animate-pulse" />
      <span className="font-hand font-bold text-ink">
        Take a 45s walkthrough of {chapter.title}?
      </span>
      <div className="flex items-center gap-1.5 ml-1">
        <button
          onClick={handleStart}
          className="px-2 py-0.5 rounded-sk-sm bg-brand-blue text-on-accent border border-line font-hand font-bold text-[11px] hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] cursor-pointer"
        >
          Tour
        </button>
        <button
          onClick={handleDismiss}
          title="Dismiss hint"
          aria-label="Dismiss hint"
          className="p-1 rounded-sk-sm text-muted hover:text-ink hover:bg-paper cursor-pointer transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
