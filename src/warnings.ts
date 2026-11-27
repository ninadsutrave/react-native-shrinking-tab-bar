import { processColor, type ColorValue } from 'react-native';

const shown = new Set<string>();

/** Warns once per key, in development only. */
export function warnOnce(key: string, message: string) {
  if (!__DEV__ || shown.has(key)) return;
  shown.add(key);
  console.warn(`[react-native-shrinking-tab-bar] ${message}`);
}

/** For tests: forget which warnings were shown. */
export function resetWarnings() {
  shown.clear();
}

export function isOpaque(color: ColorValue | undefined): boolean {
  if (color === undefined) return false;
  const c = processColor(color);
  return typeof c === 'number' && ((c >>> 24) & 255) === 255;
}

interface CheckInput {
  tabCount: number;
  routesWithoutIcon: string[];
  hasCustomTabs: boolean;
  hasCustomBackground: boolean;
  background: ColorValue;
  actionButtonLabel: string | undefined | null;
  hasActionButton: boolean;
  barsOnStore: number;
}

export function checkSetup(input: CheckInput) {
  if (!__DEV__) return;
  if (input.tabCount > 5) {
    warnOnce(
      'many-tabs',
      `${input.tabCount} tabs is a lot for a floating bar; labels get cramped and tap targets shrink. ` +
        'Consider 5 or fewer, or the `compact` preset.'
    );
  }
  if (!input.hasCustomTabs && input.routesWithoutIcon.length > 0) {
    warnOnce(
      'missing-icon',
      `No tabBarIcon for: ${input.routesWithoutIcon.join(', ')}. ` +
        'When the bar collapses to icons, these tabs will be empty.'
    );
  }
  if (input.hasCustomBackground && isOpaque(input.background)) {
    warnOnce(
      'opaque-background',
      'renderBackground (or glass) is covered by an opaque colors.background. ' +
        "Set colors.background to 'transparent', or merge your colors with combine(glass(), { colors })."
    );
  }
  if (input.hasActionButton && !input.actionButtonLabel) {
    warnOnce(
      'action-button-label',
      'actionButton needs an accessibilityLabel; screen readers have nothing else to announce.'
    );
  }
  if (input.barsOnStore > 1) {
    warnOnce(
      'shared-store',
      'Two ShrinkingTabBars are sharing collapse state. ' +
        'Wrap each tab navigator in its own <ShrinkingTabBarProvider>.'
    );
  }
}
