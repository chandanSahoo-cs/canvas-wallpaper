import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Pencil,
  LayoutGrid,
  Layers,
  ArrowRight,
  CheckCircle2,
  FolderOpen,
  Sparkles,
  Inbox,
  HardDrive,
  Compass,
} from "lucide-react";
import {
  useOnboardingStore,
  CHAPTERS,
} from "../store/useOnboardingStore";
import { useAppStore } from "../store/useAppStore";
import { calculatePopoverPosition, Rect } from "../lib/tour/positioning";
import "../lib/tour/audit";
import { cn } from "../lib/utils";


function renderFormattedDescription(text: string) {
  const parts = text.split(/(Ctrl \+ [0-9A-Za-z]+|Ctrl \+ Scroll|Space|Esc|\b[EMIBH]\b|\?)/g);
  return parts.map((part, i) => {
    if (
      /^(Ctrl \+ [0-9A-Za-z]+|Ctrl \+ Scroll|Space|Esc|[EMIBH]|\?)$/.test(part)
    ) {
      return (
        <kbd
          key={i}
          className="px-1.5 py-0.5 mx-0.5 rounded-sk-sm bg-brand-blue/15 text-brand-blue border border-brand-blue/30 font-mono text-[11px] font-bold shadow-hard-sm inline-block"
        >
          {part}
        </kbd>
      );
    }
    return part;
  });
}

export const OnboardingTour: React.FC = () => {
  const isWelcomeOpen = useOnboardingStore((s) => s.isWelcomeOpen);
  const isTourActive = useOnboardingStore((s) => s.isTourActive);
  const currentStepIndex = useOnboardingStore((s) => s.currentStepIndex);
  const activeChapterId = useOnboardingStore((s) => s.activeChapterId);
  const announcement = useOnboardingStore((s) => s.announcement);
  const checkInitialStatus = useOnboardingStore((s) => s.checkInitialStatus);
  const closeWelcomeModal = useOnboardingStore((s) => s.closeWelcomeModal);
  const startTour = useOnboardingStore((s) => s.startTour);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const completeTour = useOnboardingStore((s) => s.completeTour);
  const skipTour = useOnboardingStore((s) => s.skipTour);
  const getActiveSteps = useOnboardingStore((s) => s.getActiveSteps);

  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [popoverSize, setPopoverSize] = useState({ width: 360, height: 220 });
  const popoverRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Check initial onboarding status on mount with a brief delay for UI hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      checkInitialStatus();
    }, 350);
    return () => clearTimeout(timer);
  }, [checkInitialStatus]);

  const steps = getActiveSteps();
  const step = steps[currentStepIndex];
  const activeChapter = CHAPTERS.find((c) => c.id === activeChapterId) || CHAPTERS[0];

  // Remember previous focus when tour becomes active and restore on exit
  useEffect(() => {
    if (isTourActive) {
      previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    } else if (previousActiveElementRef.current) {
      previousActiveElementRef.current.focus?.();
      previousActiveElementRef.current = null;
    }
  }, [isTourActive]);

  // Sync mode with current tour step
  useEffect(() => {
    if (!isTourActive || !step) return;
    if (step.targetMode) {
      const currentMode = useAppStore.getState().mode;
      if (currentMode !== step.targetMode) {
        useAppStore.getState().setMode(step.targetMode);
      }
    }
  }, [isTourActive, step]);

  // Measure popover dimensions with ResizeObserver
  useEffect(() => {
    if (!popoverRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setPopoverSize({ width: Math.round(width), height: Math.round(height) });
        }
      }
    });
    observer.observe(popoverRef.current);
    return () => observer.disconnect();
  }, [isTourActive, currentStepIndex]);

  // Polling with ~1.5s timeout for target element
  const updateTargetRect = useCallback(() => {
    if (!isTourActive || !step || !step.targetSelector) {
      setTargetRect(null);
      return;
    }

    let isCancelled = false;
    const startTime = Date.now();
    const TIMEOUT_MS = 1500;

    const poll = () => {
      if (isCancelled) return;
      const el = document.querySelector(step.targetSelector);
      if (el) {
        try {
          el.scrollIntoView({ block: "nearest", inline: "nearest" });
        } catch (e) {}

        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
        return;
      }

      if (Date.now() - startTime < TIMEOUT_MS) {
        setTimeout(poll, 60);
      } else {
        if (step.optional) {
          if (Boolean((import.meta as any).env?.DEV)) {
            console.warn(
              `[Tour] Optional step "${step.id}" target "${step.targetSelector}" not found. Skipping gracefully.`,
            );
          }
          nextStep();
        } else {
          if (Boolean((import.meta as any).env?.DEV)) {
            console.warn(
              `[Tour] Step "${step.id}" target "${step.targetSelector}" not found after ${TIMEOUT_MS}ms. Centering popover.`,
            );
          }
          setTargetRect(null);
        }
      }
    };

    poll();

    return () => {
      isCancelled = true;
    };
  }, [isTourActive, step, nextStep]);

  useEffect(() => {
    const cleanup = updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);
    return () => {
      cleanup?.();
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [updateTargetRect, currentStepIndex, activeChapterId]);

  // Focus trap inside active tour popover
  useEffect(() => {
    if (!isTourActive || !popoverRef.current) return;

    const focusable = popoverRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !popoverRef.current) return;
      const elements = Array.from(
        popoverRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (elements.length === 0) return;

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleTabKey);
    return () => window.removeEventListener("keydown", handleTabKey);
  }, [isTourActive, currentStepIndex]);

  // Keyboard navigation for tour: Esc to exit, Arrows / Enter to move
  useEffect(() => {
    if (!isTourActive && !isWelcomeOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (isWelcomeOpen) {
          closeWelcomeModal(true);
        } else {
          skipTour();
        }
      } else if (isTourActive) {
        if (e.key === "ArrowRight" || e.key === "Enter") {
          e.preventDefault();
          e.stopImmediatePropagation();
          nextStep();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          e.stopImmediatePropagation();
          prevStep();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isTourActive, isWelcomeOpen, nextStep, prevStep, skipTour, closeWelcomeModal]);

  // Compute popover placement via dynamic math
  const getPopoverStyle = (): React.CSSProperties => {
    const viewport = {
      width: typeof window !== "undefined" ? window.innerWidth : 1280,
      height: typeof window !== "undefined" ? window.innerHeight : 800,
    };

    if (!step) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        position: "fixed",
      };
    }

    const pos = calculatePopoverPosition(
      targetRect,
      popoverSize,
      step.placement,
      viewport,
      16,
      12,
    );

    return {
      top: `${pos.top}px`,
      left: `${pos.left}px`,
      position: "fixed",
    };
  };

  /* ---------------- WELCOME MODAL (FIRST RUN / REPLAY) ---------------- */
  if (isWelcomeOpen) {
    return (
      <div className="fixed inset-0 z-[90] bg-[#0E1A1F]/70 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-modal-title"
          aria-describedby="welcome-modal-desc"
          className="bg-surface text-ink border-2 border-line rounded-sk-lg p-6 sm:p-7 max-w-md w-full shadow-hard relative overflow-hidden"
        >
          {/* Close X */}
          <button
            onClick={() => closeWelcomeModal(true)}
            aria-label="Skip onboarding"
            className="absolute top-4 right-4 p-1.5 rounded-sk-sm text-ink/70 hover:text-ink hover:bg-paper border border-transparent hover:border-line/30 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Icon & Title */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-sk bg-paper border-2 border-line flex items-center justify-center p-1.5 shadow-hard-sm">
              <img
                src="/icon/48.png"
                alt="PaperTab"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase font-hand font-bold tracking-wider text-muted">
                Welcome to
              </div>
              <h2
                id="welcome-modal-title"
                className="font-hand text-xl font-bold text-ink leading-tight"
              >
                PaperTab
              </h2>
            </div>
          </div>

          <p
            id="welcome-modal-desc"
            className="text-xs font-sans text-muted leading-relaxed mb-4"
          >
            Your aesthetic new-tab wallpaper, sketching canvas, and scalable idea-dumping ground. Local-first and private.
          </p>

          {/* 3 Quick Highlight Cards */}
          <div className="flex flex-col gap-2.5 mb-5">
            <div className="flex items-center gap-3 p-2.5 rounded-sk bg-paper border-2 border-line">
              <div className="w-7 h-7 rounded-sk-sm bg-brand-blue text-on-accent border border-line flex items-center justify-center shrink-0">
                <Pencil className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-hand font-bold text-ink">
                  Infinite Sketchbook:
                </span>{" "}
                <span className="font-sans text-muted">
                  Doodle, take notes, or paste images across up to 100 separate boards.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-sk bg-paper border-2 border-line">
              <div className="w-7 h-7 rounded-sk-sm bg-brand-green text-on-accent border border-line flex items-center justify-center shrink-0">
                <FolderOpen className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-hand font-bold text-ink">
                  Library & Search:
                </span>{" "}
                <span className="font-sans text-muted">
                  Find anything instantly by text, tags, perceptual colors, and duplicates.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-sk bg-paper border-2 border-line">
              <div className="w-7 h-7 rounded-sk-sm bg-surface text-ink border border-line flex items-center justify-center shrink-0">
                <LayoutGrid className="w-3.5 h-3.5 text-brand-blue" />
              </div>
              <div className="text-xs">
                <span className="font-hand font-bold text-ink">
                  Wallpaper & Widgets:
                </span>{" "}
                <span className="font-sans text-muted">
                  Clock, search bar, quick links, and new-tab image resurfacing.
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => startTour("core")}
              className="w-full py-2.5 px-4 rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard font-hand font-bold text-xs flex items-center justify-center gap-2 hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed transition-all cursor-pointer"
            >
              <span>Take a 60-Second Tour</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => closeWelcomeModal(true)}
              className="w-full py-2 text-xs font-hand font-bold text-muted hover:text-ink transition-colors cursor-pointer text-center"
            >
              Skip & Start Creating
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------- SPOTLIGHT GUIDED TOUR ---------------- */
  if (!isTourActive || !step) return null;

  const isLastStep = currentStepIndex === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[80] select-none pointer-events-auto">
      {/* Screen Reader Polite Live Region */}
      <div className="sr-only" role="status" aria-live="polite">
        {announcement || `Step ${currentStepIndex + 1} of ${steps.length}: ${step.title}`}
      </div>

      {/* 1. Backdrop / Spotlight Cutout */}
      {targetRect ? (
        <div
          className="fixed rounded-sk pointer-events-none transition-all duration-300 ease-out z-[80]"
          style={{
            top: Math.max(0, targetRect.top - 8),
            left: Math.max(0, targetRect.left - 8),
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: "0 0 0 9999px rgba(14, 26, 31, 0.72)",
            border: "2px solid #46BAEB",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-[#0E1A1F]/72 z-[80] transition-opacity duration-300 pointer-events-none" />
      )}

      {/* Transparent Click Shield */}
      <div
        className="fixed inset-0 z-[81]"
        onClick={(e) => e.stopPropagation()}
      />

      {/* 2. Floating Popover Card */}
      <div
        ref={popoverRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
        aria-describedby="tour-step-description"
        style={getPopoverStyle()}
        className={cn(
          "z-[82] bg-surface text-ink border-2 border-line rounded-sk-lg p-5 shadow-hard w-[360px] max-w-[90vw] animate-in fade-in duration-200 flex flex-col gap-3",
          step.placement === "center" && "max-w-md w-full sm:p-6",
        )}
      >
        {/* Header row: Badge, Chapter name, Step counter, Close button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-0.5 rounded-sk-sm font-hand font-bold text-[10px] uppercase tracking-wider border border-line shadow-hard-sm",
              useOnboardingStore.getState().isChapterCompleted(step.chapterId)
                ? "bg-brand-green text-on-accent"
                : "bg-brand-blue text-on-accent",
            )}>
              {step.badge}
            </span>
            <span className="text-[11px] font-mono text-muted">
              {currentStepIndex + 1} of {steps.length}
            </span>
          </div>

          <button
            onClick={skipTour}
            title="Skip Tour (Esc)"
            aria-label="Close tour"
            className="p-1 rounded-sk-sm text-ink/70 hover:text-ink hover:bg-paper border border-transparent hover:border-line/30 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title and Description */}
        <div>
          <h3
            id="tour-step-title"
            className="font-hand text-base font-bold text-ink leading-tight"
          >
            {step.title}
          </h3>
          <p
            id="tour-step-description"
            className="text-xs font-sans text-muted leading-relaxed mt-1.5 whitespace-pre-line"
          >
            {renderFormattedDescription(step.description)}
          </p>
        </div>

        {/* Footer: Progress Dots + Navigation Buttons */}
        <div className="flex items-center justify-between pt-2.5 border-t border-line/20 mt-1">
          {/* Dots */}
          <div className="flex items-center gap-1">
            {steps.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "h-1.5 rounded-sk-sm transition-all duration-200 border border-line/40",
                  idx === currentStepIndex
                    ? "w-4 bg-brand-blue border-line"
                    : idx < currentStepIndex
                      ? "w-1.5 bg-brand-green border-line/60"
                      : "w-1.5 bg-paper",
                )}
              />
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={prevStep}
                className="px-2.5 py-1.5 rounded-sk bg-paper text-ink border-2 border-line/30 hover:border-line font-hand font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={isLastStep ? completeTour : nextStep}
              className="px-3.5 py-1.5 rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard-sm font-hand font-bold text-xs hover:brightness-105 active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center gap-1"
            >
              {isLastStep ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
