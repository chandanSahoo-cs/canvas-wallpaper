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
} from "lucide-react";
import {
  useOnboardingStore,
  TOUR_STEPS,
} from "../store/useOnboardingStore";
import { useAppStore } from "../store/useAppStore";
import { cn } from "../lib/utils";

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const OnboardingTour: React.FC = () => {
  const isWelcomeOpen = useOnboardingStore((s) => s.isWelcomeOpen);
  const isTourActive = useOnboardingStore((s) => s.isTourActive);
  const currentStepIndex = useOnboardingStore((s) => s.currentStepIndex);
  const checkInitialStatus = useOnboardingStore((s) => s.checkInitialStatus);
  const closeWelcomeModal = useOnboardingStore((s) => s.closeWelcomeModal);
  const startTour = useOnboardingStore((s) => s.startTour);
  const nextStep = useOnboardingStore((s) => s.nextStep);
  const prevStep = useOnboardingStore((s) => s.prevStep);
  const completeTour = useOnboardingStore((s) => s.completeTour);

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Check initial onboarding status on mount with a brief delay for UI hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      checkInitialStatus();
    }, 350);
    return () => clearTimeout(timer);
  }, [checkInitialStatus]);

  const step = TOUR_STEPS[currentStepIndex];

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

  // Update target rect with retry for smooth transitions
  const updateTargetRect = useCallback(() => {
    if (!isTourActive || !step || !step.targetSelector) {
      setTargetRect(null);
      return;
    }

    const findAndSet = () => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        });
        return true;
      }
      return false;
    };

    if (!findAndSet()) {
      const timer = setTimeout(findAndSet, 60);
      return () => clearTimeout(timer);
    }
  }, [isTourActive, step]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [updateTargetRect, currentStepIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourActive && !isWelcomeOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (isWelcomeOpen) {
          closeWelcomeModal(true);
        } else {
          completeTour();
        }
      } else if (isTourActive) {
        if (e.key === "ArrowRight" || e.key === "Enter") {
          e.preventDefault();
          nextStep();
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          prevStep();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTourActive, isWelcomeOpen, nextStep, prevStep, completeTour, closeWelcomeModal]);

  // Compute popover coordinates based on placement
  const getPopoverStyle = (): React.CSSProperties => {
    const PADDING = 16;
    const POPOVER_WIDTH = 340;
    const POPOVER_HEIGHT = 200;

    if (!targetRect || step.placement === "center") {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        position: "fixed",
      };
    }

    let top = 0;
    let left = 0;

    if (step.placement === "top") {
      top = targetRect.top - POPOVER_HEIGHT - 16;
      left = targetRect.left + targetRect.width / 2 - POPOVER_WIDTH / 2;
    } else if (step.placement === "bottom") {
      top = targetRect.top + targetRect.height + 16;
      left = targetRect.left + targetRect.width / 2 - POPOVER_WIDTH / 2;
    } else if (step.placement === "right") {
      left = targetRect.left + targetRect.width + 16;
      top = targetRect.top + targetRect.height / 2 - POPOVER_HEIGHT / 2;
    } else if (step.placement === "left") {
      left = targetRect.left - POPOVER_WIDTH - 16;
      top = targetRect.top + targetRect.height / 2 - POPOVER_HEIGHT / 2;
    }

    const maxLeft = window.innerWidth - POPOVER_WIDTH - PADDING;
    const maxTop = window.innerHeight - POPOVER_HEIGHT - PADDING;

    left = Math.max(PADDING, Math.min(left, maxLeft));
    top = Math.max(PADDING, Math.min(top, maxTop));

    return {
      top: `${top}px`,
      left: `${left}px`,
      position: "fixed",
    };
  };

  /* ---------------- WELCOME MODAL ---------------- */
  if (isWelcomeOpen) {
    return (
      <div className="fixed inset-0 z-[70] bg-ink/60 flex items-center justify-center p-4 select-none animate-in fade-in duration-150">
        <div
          role="dialog"
          aria-modal="true"
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
              <h2 className="font-hand text-xl font-bold text-ink leading-tight">
                PaperTab
              </h2>
            </div>
          </div>

          <p className="text-xs font-sans text-muted leading-relaxed mb-4">
            Transform your new tab into an interactive sketchbook canvas with live widgets, drawing tools, and multi-scene boards.
          </p>

          {/* 3 Quick Highlight Cards */}
          <div className="flex flex-col gap-2.5 mb-5">
            <div className="flex items-center gap-3 p-2.5 rounded-sk bg-paper border-2 border-line">
              <div className="w-7 h-7 rounded-sk-sm bg-brand-blue text-on-accent border border-line flex items-center justify-center shrink-0">
                <Pencil className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-hand font-bold text-ink">
                  Infinite Canvas:
                </span>{" "}
                <span className="font-sans text-muted">
                  Doodle, take notes, or create diagrams with ink & shapes.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-sk bg-paper border-2 border-line">
              <div className="w-7 h-7 rounded-sk-sm bg-brand-green text-on-accent border border-line flex items-center justify-center shrink-0">
                <LayoutGrid className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-hand font-bold text-ink">
                  Live Widgets:
                </span>{" "}
                <span className="font-sans text-muted">
                  Clock, search bar, and shortcuts you can drag anywhere.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-sk bg-paper border-2 border-line">
              <div className="w-7 h-7 rounded-sk-sm bg-surface text-ink border border-line flex items-center justify-center shrink-0">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-hand font-bold text-ink">
                  Multiple Boards:
                </span>{" "}
                <span className="font-sans text-muted">
                  Switch between separate canvases for work, study, or ideas.
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-2">
            <button
              onClick={startTour}
              className="w-full py-2.5 px-4 rounded-sk bg-brand-green text-on-accent border-2 border-line shadow-hard font-hand font-bold text-xs flex items-center justify-center gap-2 hover:brightness-105 active:translate-x-[2px] active:translate-y-[2px] active:shadow-hard-pressed transition-all cursor-pointer"
            >
              <span>Take a 30-Second Tour</span>
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

  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60] select-none pointer-events-auto">
      {/* 1. Backdrop / Spotlight Cutout */}
      {targetRect ? (
        <div
          className="fixed rounded-sk pointer-events-none transition-all duration-300 ease-out z-[60]"
          style={{
            top: Math.max(0, targetRect.top - 8),
            left: Math.max(0, targetRect.left - 8),
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            boxShadow: "0 0 0 9999px rgba(14, 26, 31, 0.70)",
            border: "2px solid var(--blue)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-ink/70 z-[60] transition-opacity duration-300 pointer-events-none" />
      )}

      {/* Transparent Click Shield */}
      <div
        className="fixed inset-0 z-[61]"
        onClick={(e) => e.stopPropagation()}
      />

      {/* 2. Floating Popover Card */}
      <div
        ref={popoverRef}
        style={getPopoverStyle()}
        className={cn(
          "z-[62] bg-surface text-ink border-2 border-line rounded-sk-lg p-5 shadow-hard w-[340px] animate-in fade-in duration-200 flex flex-col gap-3",
          step.placement === "center" && "max-w-md w-full sm:p-6",
        )}
      >
        {/* Header row: Badge, Step counter, Close button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-sk-sm bg-brand-blue text-on-accent font-hand font-bold text-[10px] uppercase tracking-wider border border-line">
              {step.badge}
            </span>
            <span className="text-[11px] font-mono text-muted">
              {currentStepIndex + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            onClick={completeTour}
            title="Skip Tour (Esc)"
            className="p-1 rounded-sk-sm text-ink/70 hover:text-ink hover:bg-paper border border-transparent hover:border-line/30 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Title and Description */}
        <div>
          <h3 className="font-hand text-base font-bold text-ink leading-tight">
            {step.title}
          </h3>
          <p className="text-xs font-sans text-muted leading-relaxed mt-1.5 whitespace-pre-line">
            {step.description}
          </p>
        </div>

        {/* Footer: Progress Dots + Buttons */}
        <div className="flex items-center justify-between pt-2.5 border-t border-line/20 mt-1">
          {/* Dots */}
          <div className="flex items-center gap-1">
            {TOUR_STEPS.map((_, idx) => (
              <span
                key={idx}
                className={cn(
                  "h-1.5 rounded-sk-sm transition-all duration-200 border border-line/40",
                  idx === currentStepIndex
                    ? "w-4 bg-brand-blue border-line"
                    : idx < currentStepIndex
                      ? "w-1.5 bg-ink"
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
                  <span>Start Creating</span>
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
