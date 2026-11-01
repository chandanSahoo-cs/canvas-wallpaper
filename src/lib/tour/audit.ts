import { TOUR_STEPS, CHAPTERS } from "./chapters";
import { calculatePopoverPosition } from "./positioning";

export interface TourAuditReport {
  timestamp: string;
  totalChapters: number;
  totalSteps: number;
  anchorsChecked: number;
  missingDomAnchors: string[];
  clippedOrOverflowingPopovers: string[];
  passed: boolean;
}

export function auditTour(): TourAuditReport {
  const missingDomAnchors: string[] = [];
  const clippedOrOverflowingPopovers: string[] = [];
  const viewport = {
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  };

  const defaultPopoverSize = { width: 360, height: 220 };

  for (const step of TOUR_STEPS) {
    if (!step.targetSelector) continue;

    if (typeof document !== "undefined") {
      const el = document.querySelector(step.targetSelector);
      if (!el) {
        missingDomAnchors.push(`${step.id} (${step.targetSelector})`);
      } else {
        const rect = el.getBoundingClientRect();
        const pos = calculatePopoverPosition(
          {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
          defaultPopoverSize,
          step.placement,
          viewport,
        );

        if (
          pos.top < 0 ||
          pos.left < 0 ||
          pos.top + defaultPopoverSize.height > viewport.height ||
          pos.left + defaultPopoverSize.width > viewport.width
        ) {
          clippedOrOverflowingPopovers.push(
            `${step.id}: placement ${pos.actualPlacement} at (${pos.left}, ${pos.top}) clipped in ${viewport.width}x${viewport.height}`,
          );
        }
      }
    }
  }

  const passed = missingDomAnchors.length === 0 && clippedOrOverflowingPopovers.length === 0;

  const report: TourAuditReport = {
    timestamp: new Date().toISOString(),
    totalChapters: CHAPTERS.length,
    totalSteps: TOUR_STEPS.length,
    anchorsChecked: TOUR_STEPS.filter((s) => Boolean(s.targetSelector)).length,
    missingDomAnchors,
    clippedOrOverflowingPopovers,
    passed,
  };

  if (typeof console !== "undefined" && console.group) {
    console.group("🧭 [PaperTab Tour V2 Audit]");
    console.log(`Status: ${passed ? "✅ ALL PASSING" : "⚠️ ISSUES FOUND"}`);
    console.log(`Chapters: ${CHAPTERS.length}, Steps: ${TOUR_STEPS.length}`);
    if (missingDomAnchors.length > 0) {
      console.warn("Missing DOM Anchors:", missingDomAnchors);
    }
    if (clippedOrOverflowingPopovers.length > 0) {
      console.warn("Clipped / Overflowing Popovers:", clippedOrOverflowingPopovers);
    }
    console.groupEnd();
  }

  return report;
}

// Attach to window in DEV mode
if (typeof window !== "undefined" && Boolean((import.meta as any).env?.DEV)) {
  (window as any).auditTour = auditTour;
}
