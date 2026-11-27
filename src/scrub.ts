/**
 * Continuous tab position under a finger, in physical slots from the left
 * (0 = leftmost tab), clamped to the tabs. Fractions sit between tabs.
 *
 * @param x            finger position in window coordinates
 * @param barCenterX   centre of the bar's layout box in window coordinates
 * @param barShift     the bar's current horizontal offset (placement anchoring)
 * @param itemW        current width of one tab (shrinks when collapsed)
 * @param n            number of visible tabs
 */
export function slotAtX(
  x: number,
  barCenterX: number,
  barShift: number,
  itemW: number,
  n: number
): number {
  if (n <= 1 || itemW <= 0) return 0;
  const slot = (x - barCenterX - barShift) / itemW + n / 2 - 0.5;
  return Math.min(Math.max(slot, 0), n - 1);
}

/** A drag takes over from tab taps once it is clearly horizontal. */
export function isScrubGesture(dx: number, dy: number, threshold = 8): boolean {
  return Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5;
}
