/**
 * When the bar collapses and expands. All distances are in points (dp).
 */
export interface ScrollBehavior {
  /** Continuous downward scroll needed before the bar collapses. */
  collapseAfter: number;
  /** Continuous upward scroll needed before the bar expands again. */
  expandAfter: number;
  /** The bar is always expanded while the list is within this distance of the top. */
  expandNearTop: number;
  /** Expand when the list reaches its end, so the last items are not hidden. */
  expandAtEnd: boolean;
}

export const DEFAULT_SCROLL_BEHAVIOR: ScrollBehavior = {
  collapseAfter: 48,
  expandAfter: 24,
  expandNearTop: 16,
  expandAtEnd: false,
};

export interface ScrollTracker {
  lastY: number;
  /** Signed distance travelled in the current direction since the last flip. */
  travel: number;
}

export interface ScrollStep extends ScrollTracker {
  collapsed: boolean;
}

/**
 * Pure step function for the collapse state. Runs as a worklet on the UI
 * thread, and in plain JS for the non-Reanimated listener and tests.
 *
 * `maxY` is contentHeight - viewportHeight. Offsets are clamped to
 * [0, maxY] so iOS bounce and Android overscroll never flip the state.
 */
export function stepScroll(
  prev: ScrollTracker,
  collapsed: boolean,
  y: number,
  maxY: number,
  behavior: ScrollBehavior
): ScrollStep {
  'worklet';
  const max = maxY > 0 ? maxY : 0;
  const clamped = y < 0 ? 0 : y > max ? max : y;

  if (clamped <= behavior.expandNearTop) {
    return { lastY: clamped, travel: 0, collapsed: false };
  }
  if (behavior.expandAtEnd && clamped >= max - 1) {
    return { lastY: clamped, travel: 0, collapsed: false };
  }

  const dy = clamped - prev.lastY;
  if (dy === 0) {
    return { lastY: clamped, travel: prev.travel, collapsed };
  }

  let travel: number;
  if (dy > 0) {
    travel = prev.travel > 0 ? prev.travel + dy : dy;
  } else {
    travel = prev.travel < 0 ? prev.travel + dy : dy;
  }

  if (!collapsed && travel >= behavior.collapseAfter) {
    return { lastY: clamped, travel: 0, collapsed: true };
  }
  if (collapsed && -travel >= behavior.expandAfter) {
    return { lastY: clamped, travel: 0, collapsed: false };
  }
  return { lastY: clamped, travel, collapsed };
}
