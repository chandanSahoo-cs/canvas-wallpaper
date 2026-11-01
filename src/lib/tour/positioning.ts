export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export type TourPlacement = "top" | "bottom" | "left" | "right" | "center";

export interface PopoverPositionResult {
  top: number;
  left: number;
  actualPlacement: TourPlacement;
}

/**
 * Calculates optimal popover placement with boundary flipping and screen margin clamping.
 * Deterministic and free of DOM dependencies for robust unit testing.
 */
export function calculatePopoverPosition(
  targetRect: Rect | null,
  popover: Dimensions,
  requestedPlacement: TourPlacement,
  viewport: Dimensions,
  padding = 16,
  gap = 12,
): PopoverPositionResult {
  // If center placement requested or no target provided, center in viewport
  if (!targetRect || requestedPlacement === "center") {
    const centeredTop = Math.max(padding, (viewport.height - popover.height) / 2);
    const centeredLeft = Math.max(padding, (viewport.width - popover.width) / 2);
    return {
      top: Math.round(centeredTop),
      left: Math.round(centeredLeft),
      actualPlacement: "center",
    };
  }

  let actualPlacement = requestedPlacement;
  let top = 0;
  let left = 0;

  if (requestedPlacement === "bottom") {
    top = targetRect.top + targetRect.height + gap;
    left = targetRect.left + (targetRect.width - popover.width) / 2;

    // Flip to top if overflowing bottom and fits above
    if (
      top + popover.height > viewport.height - padding &&
      targetRect.top - popover.height - gap >= padding
    ) {
      top = targetRect.top - popover.height - gap;
      actualPlacement = "top";
    }
  } else if (requestedPlacement === "top") {
    top = targetRect.top - popover.height - gap;
    left = targetRect.left + (targetRect.width - popover.width) / 2;

    // Flip to bottom if overflowing top and fits below
    if (
      top < padding &&
      targetRect.top + targetRect.height + gap + popover.height <= viewport.height - padding
    ) {
      top = targetRect.top + targetRect.height + gap;
      actualPlacement = "bottom";
    }
  } else if (requestedPlacement === "right") {
    left = targetRect.left + targetRect.width + gap;
    top = targetRect.top + (targetRect.height - popover.height) / 2;

    // Flip to left if overflowing right and fits to left
    if (
      left + popover.width > viewport.width - padding &&
      targetRect.left - popover.width - gap >= padding
    ) {
      left = targetRect.left - popover.width - gap;
      actualPlacement = "left";
    }
  } else if (requestedPlacement === "left") {
    left = targetRect.left - popover.width - gap;
    top = targetRect.top + (targetRect.height - popover.height) / 2;

    // Flip to right if overflowing left and fits to right
    if (
      left < padding &&
      targetRect.left + targetRect.width + gap + popover.width <= viewport.width - padding
    ) {
      left = targetRect.left + targetRect.width + gap;
      actualPlacement = "right";
    }
  }

  // Strict clamping within screen viewport bounds
  const minLeft = padding;
  const maxLeft = Math.max(padding, viewport.width - popover.width - padding);
  const minTop = padding;
  const maxTop = Math.max(padding, viewport.height - popover.height - padding);

  const clampedLeft = Math.max(minLeft, Math.min(left, maxLeft));
  const clampedTop = Math.max(minTop, Math.min(top, maxTop));

  return {
    top: Math.round(clampedTop),
    left: Math.round(clampedLeft),
    actualPlacement,
  };
}
