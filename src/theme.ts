import type {
  ShrinkingTabBarColors,
  ShrinkingTabBarOptions,
  ShrinkingTabBarSizes,
} from './types';

export const DARK_COLORS: ShrinkingTabBarColors = {
  background: '#1E1E22',
  actionBackground: '#1E1E22',
  actionTint: '#FFFFFF',
  border: 'rgba(255, 255, 255, 0.10)',
  activeTint: '#FFFFFF',
  inactiveTint: 'rgba(235, 235, 245, 0.62)',
  indicator: 'rgba(255, 255, 255, 0.14)',
  shadow: '#000000',
  badge: '#FF453A',
  badgeText: '#FFFFFF',
};

export const LIGHT_COLORS: ShrinkingTabBarColors = {
  background: '#FFFFFF',
  actionBackground: '#FFFFFF',
  actionTint: '#111114',
  border: 'rgba(0, 0, 0, 0.08)',
  activeTint: '#111114',
  inactiveTint: 'rgba(60, 60, 67, 0.64)',
  indicator: 'rgba(0, 0, 0, 0.07)',
  shadow: '#000000',
  badge: '#FF3B30',
  badgeText: '#FFFFFF',
};

export const DEFAULT_SIZES: ShrinkingTabBarSizes = {
  expanded: { itemWidth: 84, height: 66 },
  collapsed: { itemWidth: 60, height: 50 },
  iconSize: 24,
  labelFontSize: 12,
  labelLineHeight: 15,
  labelGap: 4,
  padding: 4,
  borderWidth: 1,
  borderRadius: 999,
  indicatorRadius: 999,
  indicatorInset: 0,
};

export function resolveSizes(
  sizes: ShrinkingTabBarOptions['sizes']
): ShrinkingTabBarSizes {
  return {
    ...DEFAULT_SIZES,
    ...sizes,
    expanded: { ...DEFAULT_SIZES.expanded, ...sizes?.expanded },
    collapsed: { ...DEFAULT_SIZES.collapsed, ...sizes?.collapsed },
  };
}
