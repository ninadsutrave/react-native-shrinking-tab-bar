import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import {
  Platform,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import {
  useAnimatedScrollHandler,
  useSharedValue,
  type ReanimatedEvent,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { stepScroll, type ScrollBehavior, type ScrollTracker } from './scroll';
import { useTabBarStore } from './store';

export interface ScrollHookOptions {
  /** Set to false to stop this list from collapsing the bar. Default true. */
  enabled?: boolean;
  /** Per-screen override of the bar's `behavior` prop. */
  behavior?: Partial<ScrollBehavior>;
  /** For inverted lists (chat), where scrolling "down" means older content. */
  inverted?: boolean;
}

function useBehaviorOverride(b?: Partial<ScrollBehavior>) {
  const { collapseAfter, expandAfter, expandNearTop, expandAtEnd } = b ?? {};
  return useMemo(() => {
    const o: Partial<ScrollBehavior> = {};
    if (collapseAfter !== undefined) o.collapseAfter = collapseAfter;
    if (expandAfter !== undefined) o.expandAfter = expandAfter;
    if (expandNearTop !== undefined) o.expandNearTop = expandNearTop;
    if (expandAtEnd !== undefined) o.expandAtEnd = expandAtEnd;
    return o;
  }, [collapseAfter, expandAfter, expandNearTop, expandAtEnd]);
}

/**
 * Scroll handler for Reanimated lists (`Animated.ScrollView`,
 * `Animated.FlatList`, or any `Animated.createAnimatedComponent` list).
 * Runs entirely on the UI thread, so it never waits on the JS thread.
 *
 * ```tsx
 * const onScroll = useShrinkingTabBarScrollHandler();
 * <Animated.FlatList onScroll={onScroll} ... />
 * ```
 *
 * To combine with your own handler, use Reanimated's
 * `useComposedEventHandler([onScroll, yours])`.
 */
export function useShrinkingTabBarScrollHandler(
  options: ScrollHookOptions = {}
) {
  const { enabled = true, inverted = false } = options;
  const store = useTabBarStore();
  const override = useBehaviorOverride(options.behavior);
  const tracker = useSharedValue<ScrollTracker>({ lastY: 0, travel: 0 });
  // On the web, React Native Web's scroll events don't reach Reanimated's
  // scroll handler, and worklets run on the JS thread there anyway, so the
  // plain listener (same state machine) is used instead.
  const webListener = useShrinkingTabBarScrollListener(options);
  const hasOverride = Object.keys(override).length > 0;
  // Worklets copy what they capture to the UI thread, so capture only the
  // shared values, never the whole store (it holds JS functions).
  const { collapsed, keepExpanded, behavior: behaviorSV } = store;

  const handler = useAnimatedScrollHandler(
    {
      onScroll: (e: ReanimatedEvent<NativeScrollEvent>) => {
        if (!enabled) return;
        const maxY = e.contentSize.height - e.layoutMeasurement.height;
        const y = inverted ? maxY - e.contentOffset.y : e.contentOffset.y;
        // No per-event allocation unless this screen overrides the behaviour.
        const behavior = hasOverride
          ? { ...behaviorSV.value, ...override }
          : behaviorSV.value;
        const next = stepScroll(
          tracker.value,
          collapsed.value,
          y,
          maxY,
          behavior
        );
        tracker.value = { lastY: next.lastY, travel: next.travel };
        if (next.collapsed && keepExpanded.value) return;
        if (next.collapsed !== collapsed.value) {
          collapsed.value = next.collapsed;
        }
      },
    },
    [
      enabled,
      inverted,
      override,
      hasOverride,
      collapsed,
      keepExpanded,
      behaviorSV,
    ]
  );
  return Platform.OS === 'web'
    ? (webListener as unknown as typeof handler)
    : handler;
}

/**
 * Plain `onScroll` callback for lists that are not Reanimated components,
 * such as FlashList, SectionList or a third-party list. Pair it with
 * `scrollEventThrottle={16}`.
 */
export function useShrinkingTabBarScrollListener(
  options: ScrollHookOptions = {}
) {
  const { enabled = true, inverted = false } = options;
  const store = useTabBarStore();
  const override = useBehaviorOverride(options.behavior);
  const tracker = useRef<ScrollTracker>({ lastY: 0, travel: 0 });

  return useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!enabled) return;
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const maxY = contentSize.height - layoutMeasurement.height;
      const y = inverted ? maxY - contentOffset.y : contentOffset.y;
      const behavior = { ...store.behavior.value, ...override };
      const next = stepScroll(
        tracker.current,
        store.collapsed.value,
        y,
        maxY,
        behavior
      );
      tracker.current = { lastY: next.lastY, travel: next.travel };
      if (next.collapsed && store.keepExpanded.value) return;
      if (next.collapsed !== store.collapsed.value) {
        store.collapsed.value = next.collapsed;
      }
    },
    [enabled, inverted, override, store]
  );
}

export interface ShrinkingTabBarControls {
  /** Animated 0 (expanded) to 1 (collapsed), for driving your own views. */
  progress: SharedValue<number>;
  /** Animated 0 (visible) to 1 (hidden by the keyboard or a screen option). */
  hidden: SharedValue<number>;
  /** Target state. Read it in worklets; set it with the methods below. */
  collapsed: SharedValue<boolean>;
  expand: () => void;
  collapse: () => void;
  toggle: () => void;
}

/** Read the bar's animated state or collapse and expand it from code. */
export function useShrinkingTabBar(): ShrinkingTabBarControls {
  const store = useTabBarStore();
  return useMemo(
    () => ({
      progress: store.progress,
      hidden: store.hidden,
      collapsed: store.collapsed,
      expand: () => {
        store.collapsed.value = false;
      },
      collapse: () => {
        store.collapsed.value = true;
      },
      toggle: () => {
        store.collapsed.value = !store.collapsed.value;
      },
    }),
    [store]
  );
}

/**
 * Bottom padding that keeps the last item of a list clear of the expanded
 * bar, including the bottom safe area. Use it as `paddingBottom` on
 * `contentContainerStyle`.
 */
export function useShrinkingTabBarInset(): number {
  const store = useTabBarStore();
  const insets = useSafeAreaInsets();
  const height = useSyncExternalStore(
    store.occupiedHeight.subscribe,
    store.occupiedHeight.get,
    store.occupiedHeight.get
  );
  return height + insets.bottom;
}
