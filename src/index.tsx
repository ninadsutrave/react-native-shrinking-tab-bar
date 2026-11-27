export { ShrinkingTabBar, type ShrinkingTabBarProps } from './ShrinkingTabBar';
export { ShrinkingTabBarProvider } from './store';
export {
  useShrinkingTabBar,
  useShrinkingTabBarInset,
  useShrinkingTabBarScrollHandler,
  useShrinkingTabBarScrollListener,
  type ScrollHookOptions,
  type ShrinkingTabBarControls,
} from './hooks';
export {
  stepScroll,
  DEFAULT_SCROLL_BEHAVIOR,
  type ScrollBehavior,
} from './scroll';
export { DARK_COLORS, LIGHT_COLORS, DEFAULT_SIZES } from './theme';
export type {
  ActionButtonOptions,
  IndicatorRenderProps,
  IndicatorTransition,
  BackgroundRenderProps,
  CollapseMode,
  PressFeedback,
  ShrinkingTabBarAnimation,
  ShrinkingTabBarColors,
  ShrinkingTabBarOptions,
  ShrinkingTabBarSizes,
  ShrinkingTabBarSizeState,
  TabRenderProps,
} from './types';
