import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type {
  SharedValue,
  WithSpringConfig,
  WithTimingConfig,
} from 'react-native-reanimated';
import type { ScrollBehavior } from './scroll';

export interface ShrinkingTabBarColors {
  /** Bar fill. Ignored visually if `renderBackground` paints over it. */
  background: string;
  border: string;
  /** Icon and label colour of the focused tab. */
  activeTint: string;
  inactiveTint: string;
  /** Fill of the sliding indicator behind the focused tab. */
  indicator: string;
  shadow: string;
  badge: string;
  badgeText: string;
  /** Action button fill. Defaults to `background`. */
  actionBackground: string;
  /** Action button icon colour. Defaults to `activeTint`. */
  actionTint: string;
}

export interface ShrinkingTabBarSizeState {
  /** Width of each tab. Ignored when `align="stretch"`. */
  itemWidth: number;
  /** Outer height of the bar. */
  height: number;
}

export interface ShrinkingTabBarSizes {
  expanded: ShrinkingTabBarSizeState;
  collapsed: ShrinkingTabBarSizeState;
  iconSize: number;
  labelFontSize: number;
  labelLineHeight: number;
  /** Space between icon and label when expanded. */
  labelGap: number;
  /** Inner padding between the bar edge and the tabs. */
  padding: number;
  borderWidth: number;
  /** Corner radius of the bar. Default is fully rounded. */
  borderRadius: number;
  /** Corner radius of the indicator. Default is fully rounded. */
  indicatorRadius: number;
  /** Inset of the indicator from the tab edges. */
  indicatorInset: number;
}

export type ShrinkingTabBarAnimation =
  | ({ type: 'timing' } & WithTimingConfig)
  | ({ type: 'spring' } & WithSpringConfig);

/**
 * - `icons`: labels fade out and the bar narrows to icons (default).
 * - `hide`: the whole bar slides off screen.
 * - `none`: the bar never changes on scroll.
 */
export type CollapseMode = 'icons' | 'hide' | 'none';

export type PressFeedback = 'scale' | 'opacity' | 'ripple' | 'none';

export interface TabRenderProps {
  routeKey: string;
  routeName: string;
  label: string;
  index: number;
  focused: boolean;
  color: string;
  /** Animated 0 (expanded) to 1 (collapsed). */
  progress: SharedValue<number>;
  onPress: () => void;
  onLongPress: () => void;
}

export interface BackgroundRenderProps {
  progress: SharedValue<number>;
  borderRadius: number;
}

export interface ActionButtonOptions {
  /** Icon node, or a function that receives the tint colour and icon size. */
  icon: ReactNode | ((props: { color: string; size: number }) => ReactNode);
  onPress: () => void;
  onLongPress?: () => void;
  /** Required: the button has no visible text. */
  accessibilityLabel: string;
  /** Which side of the bar it sits on. `end` is the right in LTR. Default `end`. */
  side?: 'start' | 'end';
  /** Space between the bar and the button. Default 10. */
  gap?: number;
  /** Icon colour. Defaults to the bar's active tint. */
  color?: string;
  /** Defaults to the bar's background colour. */
  backgroundColor?: string;
  borderColor?: string;
  /** Set to false to hide it (for example on some screens). Default true. */
  visible?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export interface IndicatorRenderProps {
  /** Animated 0 (expanded) to 1 (collapsed). */
  progress: SharedValue<number>;
  /** Corner radius at the current size. */
  borderRadius: number;
  /** Name of the focused route, to vary the look per tab. */
  routeName: string;
}

/**
 * How the selected-tab indicator moves to a new tab:
 * - `slide`: glides across (default).
 * - `stretch`: the leading edge runs ahead and the trailing edge catches up.
 * - `fade`: fades out, then in on the new tab.
 * - `none`: jumps instantly.
 */
export type IndicatorTransition = 'slide' | 'stretch' | 'fade' | 'none';

export interface ShrinkingTabBarOptions {
  /** What happens on scroll down. Default `icons`. */
  collapseMode?: CollapseMode;
  /** When scrolling collapses and expands the bar. */
  behavior?: Partial<ScrollBehavior>;
  /** Animation for collapse, expand and the indicator. Default: 220 ms timing. */
  animation?: ShrinkingTabBarAnimation;
  /** Separate animation for the sliding indicator. Defaults to `animation`. */
  indicatorAnimation?: ShrinkingTabBarAnimation;
  /** Expand the bar when the user switches tabs. Default true. */
  expandOnTabChange?: boolean;
  /** Tapping the focused tab while collapsed expands the bar. Default true. */
  expandOnFocusedTabPress?: boolean;
  /** Slide the bar away while the keyboard is open. Default true on Android. */
  hideOnKeyboard?: boolean;
  /**
   * Where the bar sits: `center`, or anchored to the `start` / `end` edge
   * (left / right in LTR, mirrored in RTL). The bar shrinks towards that edge.
   * Default `center`.
   */
  placement?: 'center' | 'start' | 'end';
  /** A round button beside the bar, like iOS's search button. It shrinks with the bar. */
  actionButton?: ActionButtonOptions;
  /** `center` floats a pill; `stretch` spans the screen minus `horizontalInset`. */
  align?: 'center' | 'stretch';
  /** Gap between the bar and the bottom safe area. Default 12. */
  bottomOffset?: number;
  /** Side margin for `align="stretch"`, and the minimum margin for `center`. Default 16. */
  horizontalInset?: number;
  /**
   * Layout direction. `auto` follows `I18nManager.isRTL`; in RTL the first
   * tab sits on the right and badges move to the icon's top-left.
   */
  direction?: 'auto' | 'ltr' | 'rtl';
  /** Colour preset. Default follows the system colour scheme. */
  theme?: 'light' | 'dark' | 'auto';
  colors?: Partial<ShrinkingTabBarColors>;
  sizes?: Partial<
    Omit<ShrinkingTabBarSizes, 'expanded' | 'collapsed'> & {
      expanded: Partial<ShrinkingTabBarSizeState>;
      collapsed: Partial<ShrinkingTabBarSizeState>;
    }
  >;
  /** How the indicator moves between tabs. Default `slide`. */
  indicatorTransition?: IndicatorTransition;
  /**
   * Drag along the bar to switch tabs: the indicator follows the finger, the
   * tab under it lights up, and releasing switches to it. Taps work as before.
   * Default true.
   */
  scrubbing?: boolean;
  /** Called each time a scrub crosses into another tab. A good place for a haptic tick. */
  onScrubChange?: (routeName: string) => void;
  /** A small bounce on the icon of the newly selected tab. Default `none`. */
  tabFocusAnimation?: 'none' | 'pop';
  /**
   * Draw the indicator yourself, for example an expo-linear-gradient filling
   * the box. Its clip box animates size, like a custom bar background.
   */
  renderIndicator?: (props: IndicatorRenderProps) => ReactNode;
  /** Show the sliding indicator behind the focused tab. Default true. */
  showIndicator?: boolean;
  /** Shadow under the bar: false to turn it off, or an object to tune it. Default on. */
  shadow?:
    | boolean
    | Partial<{
        color: string;
        opacity: number;
        radius: number;
        offsetY: number;
        /** Android elevation. */
        elevation: number;
      }>;
  /** Press feedback. Default `scale`. `ripple` is Android only and falls back to `opacity` on iOS. */
  pressFeedback?: PressFeedback;
  /** Keep labels visible even when collapsed ("icons" mode only shrinks height). */
  keepLabelsWhenCollapsed?: boolean;

  /** Outer wrapper, for positioning (e.g. extra margin). The bar itself is styled with `colors` and `sizes`. */
  style?: StyleProp<ViewStyle>;
  itemStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  badgeStyle?: StyleProp<ViewStyle>;
  badgeTextStyle?: StyleProp<TextStyle>;

  /**
   * Paint the bar background yourself, for example an expo-blur `BlurView`.
   * The default background animates with transforms only; a custom one is
   * clipped by a box whose size animates, which costs a layout pass per frame.
   */
  renderBackground?: (props: BackgroundRenderProps) => ReactNode;
  /** Replace the content of a tab. The bar still handles size, press and accessibility. */
  renderTab?: (props: TabRenderProps) => ReactNode;

  /** Called on every tab press, before navigation. Good for haptics. */
  onTabPress?: (routeName: string, focused: boolean) => void;
  onTabLongPress?: (routeName: string, focused: boolean) => void;
  /** Called on the JS thread when the bar collapses or expands. */
  onCollapseChange?: (collapsed: boolean) => void;
  testID?: string;
}

export type { ScrollBehavior };
