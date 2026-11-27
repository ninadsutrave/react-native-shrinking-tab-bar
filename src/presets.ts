import type { ShrinkingTabBarOptions } from './types';

/** Any subset of the bar's options: a preset, `glass()`, or your overrides. */
export type ShrinkingTabBarPreset = Partial<ShrinkingTabBarOptions>;

type Part = ShrinkingTabBarPreset | null | undefined | false;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

// Replaced whole, never merged: mixing a timing and a spring config, or two
// action buttons, would produce something nobody asked for.
const REPLACE = new Set(['animation', 'indicatorAnimation', 'actionButton']);

function mergeDeep(
  base: Record<string, unknown>,
  next: Record<string, unknown>,
  depth = 0
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(next)) {
    if (value === undefined) continue;
    const prev = out[key];
    const replace = depth === 0 && REPLACE.has(key);
    out[key] =
      !replace && isPlainObject(prev) && isPlainObject(value)
        ? mergeDeep(prev, value, depth + 1)
        : value;
  }
  return out;
}

/**
 * Merges presets, `glass()` and your own options, later ones winning.
 * Nested options (`colors`, `sizes`, `behavior`, `shadow`) are merged key by
 * key, so you can change one colour without losing the rest. Falsy entries
 * are skipped, which makes conditional parts easy:
 *
 * ```tsx
 * <ShrinkingTabBar
 *   {...props}
 *   {...combine(presets.compact, isGlass && glass(), { colors: { badge: '#E11D48' } })}
 * />
 * ```
 */
export function combine(...parts: Part[]): ShrinkingTabBarPreset {
  let out: Record<string, unknown> = {};
  for (const part of parts) {
    if (part) out = mergeDeep(out, part as Record<string, unknown>);
  }
  return out as ShrinkingTabBarPreset;
}

const minimal: ShrinkingTabBarPreset = {
  showIndicator: false,
  shadow: false,
  tabFocusAnimation: 'pop',
  colors: { border: 'transparent' },
  sizes: { borderWidth: 0 },
};

const compact: ShrinkingTabBarPreset = {
  bottomOffset: 8,
  sizes: {
    expanded: { itemWidth: 68, height: 56 },
    collapsed: { itemWidth: 50, height: 44 },
    iconSize: 22,
    labelFontSize: 11,
    labelLineHeight: 13,
    labelGap: 2,
    padding: 3,
  },
};

const vibrant: ShrinkingTabBarPreset = {
  indicatorTransition: 'stretch',
  tabFocusAnimation: 'pop',
  // White on #7C3AED is 5.7:1, above WCAG AA for text.
  colors: { indicator: '#7C3AED', activeTint: '#FFFFFF' },
};

const fullWidth: ShrinkingTabBarPreset = {
  align: 'stretch',
  horizontalInset: 12,
  sizes: { borderRadius: 24, indicatorRadius: 18 },
};

const hideOnScroll: ShrinkingTabBarPreset = {
  collapseMode: 'hide',
};

/**
 * Ready-made looks. Spread one in, or mix several with `combine()`:
 *
 * - `minimal`: no indicator, border or shadow; the active tab is shown by
 *   colour, with a small pop on select.
 * - `compact`: smaller tabs and a lower bar, for apps with 5 tabs or small
 *   screens.
 * - `vibrant`: a solid violet indicator with white icons, a stretchy
 *   switch and a pop.
 * - `fullWidth`: spans the screen with softer corners.
 * - `hideOnScroll`: slides away entirely on scroll down.
 */
export const presets = {
  minimal,
  compact,
  vibrant,
  fullWidth,
  hideOnScroll,
} as const;
