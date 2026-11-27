import type {
  BottomTabBarProps,
  BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import {
  I18nManager,
  Keyboard,
  PanResponder,
  Platform,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionButton, type ActionButtonFrame } from './ActionButton';
import { Capsule, type CapsuleFrame, type CapsuleShadow } from './Capsule';
import { DEFAULT_SCROLL_BEHAVIOR } from './scroll';
import { isScrubGesture, slotAtX } from './scrub';
import { checkSetup } from './warnings';
import { useTabBarStore } from './store';
import { TabItem, type TabGeometry, type TabItemDescriptor } from './TabItem';
import { DARK_COLORS, LIGHT_COLORS, resolveSizes } from './theme';
import type { ShrinkingTabBarAnimation, ShrinkingTabBarOptions } from './types';

export type ShrinkingTabBarProps = BottomTabBarProps & ShrinkingTabBarOptions;

export const DEFAULT_ANIMATION: ShrinkingTabBarAnimation = {
  type: 'timing',
  duration: 220,
  easing: Easing.bezier(0.4, 0, 0.2, 1),
};

export function animateTo(to: number, animation: ShrinkingTabBarAnimation) {
  'worklet';
  const { type, ...config } = animation;
  return type === 'spring'
    ? withSpring(to, config as WithSpringConfig)
    : withTiming(to, config as WithTimingConfig);
}

/** Expo Router adds `href` to the tab options; `null` hides the route. */
type TabOptions = BottomTabNavigationOptions & { href?: string | null };

function isDisplayNone(style: TabOptions['tabBarStyle']): boolean {
  return StyleSheet.flatten(style)?.display === 'none';
}

function isHiddenRoute(options: TabOptions | undefined): boolean {
  if (!options) return false;
  return options.href === null || isDisplayNone(options.tabBarItemStyle);
}

/**
 * Floating tab bar that shrinks to icons on scroll. Pass it as the
 * `tabBar` of a React Navigation bottom tab navigator or Expo Router `<Tabs>`:
 *
 * ```tsx
 * <Tabs tabBar={(props) => <ShrinkingTabBar {...props} />} />
 * ```
 *
 * Every frame of the collapse is driven by transforms and opacity on the UI
 * thread, so it never re-runs layout and never waits on the JS thread.
 */
export function ShrinkingTabBar(props: ShrinkingTabBarProps) {
  const {
    state,
    descriptors,
    navigation,
    collapseMode = 'icons',
    behavior,
    animation = DEFAULT_ANIMATION,
    indicatorAnimation,
    expandOnTabChange = true,
    expandOnFocusedTabPress = true,
    hideOnKeyboard = Platform.OS === 'android',
    align = 'center',
    placement = 'center',
    actionButton,
    bottomOffset = 12,
    horizontalInset = 16,
    theme = 'auto',
    direction = 'auto',
    showIndicator = true,
    indicatorTransition = 'slide',
    scrubbing = true,
    onScrubChange,
    tabFocusAnimation = 'none',
    renderIndicator,
    shadow = true,
    pressFeedback = 'scale',
    keepLabelsWhenCollapsed = false,
    style,
    itemStyle,
    labelStyle,
    badgeStyle,
    badgeTextStyle,
    renderBackground,
    renderTab,
    onTabPress,
    onTabLongPress,
    onCollapseChange,
    testID,
  } = props;

  const store = useTabBarStore();
  const safeInsets = useSafeAreaInsets();
  const insets = props.insets ?? safeInsets;
  const scheme = useColorScheme();
  const { width: windowWidth } = useWindowDimensions();

  const isDark = theme === 'dark' || (theme === 'auto' && scheme === 'dark');
  const colors = { ...(isDark ? DARK_COLORS : LIGHT_COLORS), ...props.colors };
  const sizes = resolveSizes(props.sizes);
  const indicatorAnim = indicatorAnimation ?? animation;

  const shadowConfig: CapsuleShadow | undefined =
    shadow === false
      ? undefined
      : {
          color: colors.shadow,
          opacity: isDark ? 0.5 : 0.16,
          radius: 16,
          offsetY: 6,
          elevation: 10,
          ...(typeof shadow === 'object' ? shadow : null),
        };

  // Behaviour lives in the store so scroll hooks on every screen can read it.
  const { collapseAfter, expandAfter, expandNearTop, expandAtEnd } =
    behavior ?? {};
  useEffect(() => {
    store.behavior.value = {
      collapseAfter: collapseAfter ?? DEFAULT_SCROLL_BEHAVIOR.collapseAfter,
      expandAfter: expandAfter ?? DEFAULT_SCROLL_BEHAVIOR.expandAfter,
      expandNearTop: expandNearTop ?? DEFAULT_SCROLL_BEHAVIOR.expandNearTop,
      expandAtEnd: expandAtEnd ?? DEFAULT_SCROLL_BEHAVIOR.expandAtEnd,
    };
  }, [store, collapseAfter, expandAfter, expandNearTop, expandAtEnd]);

  // Routes shown as tabs (Expo Router `href: null` and display:none are skipped).
  const routes = state.routes.filter(
    (r) => descriptors[r.key] && !isHiddenRoute(descriptors[r.key]?.options)
  );
  const activeRoute = state.routes[state.index];
  const activeIndex = routes.findIndex((r) => r.key === activeRoute?.key);
  // The bar is laid out left to right internally so all the geometry is
  // physical. In RTL the tabs are shown right to left (row-reverse) while
  // render order stays first to last, so screen readers keep the right order.
  const rtl =
    direction === 'rtl' || (direction === 'auto' && I18nManager.isRTL);
  const visual = (i: number) => (rtl ? routes.length - 1 - i : i);
  const n = Math.max(routes.length, 1);
  const focusedOptions = activeRoute
    ? descriptors[activeRoute.key]?.options
    : undefined;
  const hiddenByScreen = isDisplayNone(focusedOptions?.tabBarStyle);

  // ---- geometry: plain numbers, so worklets interpolate without measuring
  const icons = collapseMode === 'icons';
  const hideLabels = icons && !keepLabelsWhenCollapsed;
  const shrinkWidth = icons && align === 'center' && !keepLabelsWhenCollapsed;
  const chrome = 2 * (sizes.padding + sizes.borderWidth);
  const eH = sizes.expanded.height;
  const hasButton = !!actionButton && actionButton.visible !== false;
  const gap = actionButton?.gap ?? 10;
  const available =
    windowWidth -
    2 * horizontalInset -
    insets.left -
    insets.right -
    (hasButton ? eH + gap : 0);
  const maxItem = (available - chrome) / n;
  const eW =
    align === 'stretch' ? maxItem : Math.min(sizes.expanded.itemWidth, maxItem);
  const cW = shrinkWidth ? Math.min(sizes.collapsed.itemWidth, eW) : eW;
  // With labels kept, the collapsed bar must still fit icon + label.
  const minWithLabels =
    sizes.iconSize + sizes.labelGap + sizes.labelLineHeight + chrome + 4;
  const cH = icons
    ? Math.min(
        keepLabelsWhenCollapsed
          ? Math.max(sizes.collapsed.height, minWithLabels)
          : sizes.collapsed.height,
        eH
      )
    : eH;
  const barW = n * eW + chrome;
  const barCW = n * cW + chrome;
  const radius = Math.min(sizes.borderRadius, eH / 2);
  // Placement as a physical anchor: 0 = left edge fixed, 1 = right edge
  // fixed, 0.5 = centre fixed. The group (bar + button) shrinks towards it.
  const startIsLeft = !rtl;
  const anchor =
    placement === 'center' || align === 'stretch'
      ? 0.5
      : (placement === 'start') === startIsLeft
        ? 0
        : 1;
  const buttonLeft =
    hasButton && ((actionButton?.side ?? 'end') === 'start') === startIsLeft;
  const barC0 = buttonLeft ? eH + gap + barW / 2 : barW / 2;
  const btnC0 = buttonLeft ? eH / 2 : barW + gap + eH / 2;
  const hideDistance = eH + bottomOffset + insets.bottom + 24;
  const geometry: TabGeometry = {
    n,
    eW,
    cW,
    innerE: eH - chrome,
    innerC: cH - chrome,
    eH,
    cH,
    labelShift: hideLabels ? (sizes.labelGap + sizes.labelLineHeight) / 2 : 0,
    hideLabels,
  };

  useEffect(() => {
    store.occupiedHeight.set(eH + bottomOffset);
  }, [store, eH, bottomOffset]);

  // ---- development checks
  useEffect(() => {
    store.bars.count += 1;
    return () => {
      store.bars.count -= 1;
    };
  }, [store]);
  const routesWithoutIcon = routes
    .filter((r) => !descriptors[r.key]?.options.tabBarIcon)
    .map((r) => r.name);
  useEffect(() => {
    checkSetup({
      tabCount: routes.length,
      routesWithoutIcon,
      hasCustomTabs: !!renderTab,
      hasCustomBackground: !!renderBackground,
      background: colors.background,
      hasActionButton: !!actionButton,
      actionButtonLabel: actionButton?.accessibilityLabel,
      barsOnStore: store.bars.count,
    });
  });

  // ---- collapse progress
  const callbackRef = useRef(onCollapseChange);
  callbackRef.current = onCollapseChange;
  const notify = useCallback((c: boolean) => callbackRef.current?.(c), []);
  const hasCallback = !!onCollapseChange;

  // Worklets copy what they capture to the UI thread, so they only ever see
  // these shared values, never the whole store.
  const { collapsed: collapsedSV, progress, hidden } = store;

  useAnimatedReaction(
    () => collapsedSV.value,
    (collapsed, previous) => {
      if (collapsed === previous) return;
      const target = collapseMode === 'none' ? 0 : collapsed ? 1 : 0;
      progress.value = animateTo(target, animation);
      if (hasCallback && previous !== null) runOnJS(notify)(collapsed);
    },
    [collapseMode, animation, hasCallback]
  );

  // ---- expand on tab change
  const firstIndex = useRef(true);
  useEffect(() => {
    if (firstIndex.current) {
      firstIndex.current = false;
      return;
    }
    if (expandOnTabChange) store.collapsed.value = false;
  }, [state.index, expandOnTabChange, store]);

  // ---- keyboard and screen-level hiding
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    if (!hideOnKeyboard) return;
    const show = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hide = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const a = Keyboard.addListener(show, () => setKeyboardOpen(true));
    const b = Keyboard.addListener(hide, () => setKeyboardOpen(false));
    return () => {
      a.remove();
      b.remove();
      setKeyboardOpen(false);
    };
  }, [hideOnKeyboard]);

  const shouldHide = hiddenByScreen || (hideOnKeyboard && keyboardOpen);
  useEffect(() => {
    hidden.value = animateTo(shouldHide ? 1 : 0, animation);
  }, [shouldHide, hidden, animation]);

  // ---- indicator: two edges (in tab slots) so it can stretch between tabs
  const activeSlot = activeIndex >= 0 ? visual(activeIndex) : -1;
  const [scrubSlot, setScrubSlot] = useState<number | null>(null);
  const indicatorLead = useSharedValue(Math.max(activeSlot, 0));
  const indicatorTrail = useSharedValue(Math.max(activeSlot, 0));
  const indicatorOpacity = useSharedValue(1);
  const placedOnce = useRef(false);
  useEffect(() => {
    if (activeSlot < 0) return;
    if (!placedOnce.current || indicatorTransition === 'none') {
      placedOnce.current = true;
      indicatorLead.value = activeSlot;
      indicatorTrail.value = activeSlot;
      return;
    }
    const duration =
      indicatorAnim.type === 'timing' ? (indicatorAnim.duration ?? 220) : 260;
    const easing =
      indicatorAnim.type === 'timing' ? indicatorAnim.easing : undefined;
    if (indicatorTransition === 'fade') {
      const half = duration / 2;
      indicatorOpacity.value = withSequence(
        withTiming(0, { duration: half }),
        withTiming(1, { duration: half })
      );
      indicatorLead.value = withDelay(
        half,
        withTiming(activeSlot, { duration: 0 })
      );
      indicatorTrail.value = withDelay(
        half,
        withTiming(activeSlot, { duration: 0 })
      );
    } else if (indicatorTransition === 'stretch') {
      indicatorLead.value = withTiming(activeSlot, {
        duration: duration * 0.6,
        easing,
      });
      indicatorTrail.value = withTiming(activeSlot, {
        duration: duration * 1.25,
        easing,
      });
    } else {
      indicatorLead.value = animateTo(activeSlot, indicatorAnim);
      indicatorTrail.value = animateTo(activeSlot, indicatorAnim);
    }
  }, [
    activeSlot,
    indicatorAnim,
    indicatorTransition,
    indicatorLead,
    indicatorTrail,
    indicatorOpacity,
  ]);

  // The bar shrinks towards its bottom edge, so it stays put above the
  // home indicator while the top comes down.
  // Lay the group out for the current progress: it shrinks by delta, the
  // anchor point stays put, and bar and button keep a constant gap.
  const groupLayout = useDerivedValue(() => {
    const p = progress.value;
    const h = eH + (cH - eH) * p;
    const w = barW + (barCW - barW) * p;
    const delta = barW - w + (hasButton ? eH - h : 0);
    const left = anchor * delta;
    const barC = buttonLeft ? left + h + gap + w / 2 : left + w / 2;
    const btnC = buttonLeft ? left + h / 2 : left + w + gap + h / 2;
    return { w, h, barShift: barC - barC0, btnShift: btnC - btnC0 };
  });

  const barFrame = useDerivedValue<CapsuleFrame>(() => {
    const g = groupLayout.value;
    return { w: g.w, h: g.h, tx: g.barShift, ty: (eH - g.h) / 2 };
  });

  const buttonFrame = useDerivedValue<ActionButtonFrame>(() => {
    const g = groupLayout.value;
    return { s: g.h / eH, tx: g.btnShift, ty: (eH - g.h) / 2 };
  });

  const inset = sizes.indicatorInset;
  const indicatorFrame = useDerivedValue<CapsuleFrame>(() => {
    const p = progress.value;
    const itemW = eW + (cW - eW) * p;
    const h = eH + (cH - eH) * p;
    const inner = h - chrome;
    const a = indicatorLead.value;
    const b = indicatorTrail.value;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    // The layout box spans the whole row (centred on the bar), so a
    // stretched indicator never leaves it (Android clips faded groups).
    return {
      w: (hi - lo + 1) * itemW - 2 * inset,
      h: inner - 2 * inset,
      tx: ((lo + hi) / 2 + 0.5 - n / 2) * itemW + barFrame.value.tx,
      ty: (eH - h) / 2,
    };
  });

  const indicatorBoxW = n * eW - 2 * inset;
  const indicatorBoxH = eH - chrome - 2 * inset;
  const indicatorLeft = sizes.padding + sizes.borderWidth + inset;
  const indicatorRadius = Math.min(sizes.indicatorRadius, (eH - chrome) / 2);
  const indicatorOpacityStyle = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
  }));
  // Custom indicators (gradients) are clipped by a box that animates size.
  const customIndicatorStyle = useAnimatedStyle(() => {
    const f = indicatorFrame.value;
    return {
      left: indicatorLeft + (indicatorBoxW - f.w) / 2,
      top: indicatorLeft + (indicatorBoxH - f.h) / 2,
      width: f.w,
      height: f.h,
      borderRadius: Math.min(indicatorRadius, f.h / 2),
      transform: [{ translateX: f.tx }, { translateY: f.ty }],
    };
  });

  const wrapperStyle = useAnimatedStyle(() => {
    const hideP = collapseMode === 'hide' ? progress.value : 0;
    const h = Math.max(hideP, hidden.value);
    return {
      opacity: interpolate(h, [0, 0.8, 1], [1, 1, 0]),
      transform: [{ translateY: h * hideDistance }],
    };
  });

  // Custom backgrounds (blur, gradients) cannot be split into pieces, so
  // their clip box animates size. This is the only layout animation, and
  // only when renderBackground is used.
  const customBackgroundStyle = useAnimatedStyle(() => {
    const f = barFrame.value;
    return {
      left: (barW - f.w) / 2 + f.tx,
      top: eH - f.h,
      width: f.w,
      height: f.h,
      borderRadius: radius * (f.h / eH),
    };
  });

  // ---- press handling (mirrors React Navigation's default tab bar)
  const items: TabItemDescriptor[] = routes.map((route, index) => {
    // routes only contains keys that have a descriptor (filtered above)
    const options = descriptors[route.key]?.options ?? {};
    const focused = route.key === activeRoute?.key;
    // While scrubbing, the tab under the finger lights up instead.
    const lit = scrubSlot !== null ? visual(index) === scrubSlot : focused;
    const title =
      typeof options.tabBarLabel === 'string'
        ? options.tabBarLabel
        : (options.title ?? route.name);
    const color = lit
      ? (options.tabBarActiveTintColor ?? colors.activeTint)
      : (options.tabBarInactiveTintColor ?? colors.inactiveTint);
    return {
      key: route.key,
      name: route.name,
      title,
      focused,
      color,
      options,
      onPress: () => {
        onTabPress?.(route.name, focused);
        // Same event and data as React Navigation's own tab bar, so
        // useScrollToTop and tabBarRepeatedPressBehavior keep working.
        const repeat = options.tabBarRepeatedPressBehavior;
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
          data: {
            behavior: {
              scrollToTop: focused && repeat?.scrollToTop !== false,
              popToTop: focused && repeat?.popToTop !== false,
            },
          },
        });
        if (focused && expandOnFocusedTabPress) store.collapsed.value = false;
        if (!focused && !event.defaultPrevented) {
          navigation.navigate(route.name, route.params);
        }
      },
      onLongPress: () => {
        onTabLongPress?.(route.name, focused);
        navigation.emit({ type: 'tabLongPress', target: route.key });
      },
    };
  });

  // ---- finger scrubbing
  // The responder reads the latest render through this ref, so the
  // PanResponder itself is created once.
  const latest = useRef({ items, n, activeSlot, scrubbing, onScrubChange });
  latest.current = { items, n, activeSlot, scrubbing, onScrubChange };
  const barRef = useRef<ComponentRef<typeof View>>(null);
  const barCenterX = useRef(0);
  const lastScrubSlot = useRef<number | null>(null);

  const scrubResponder = useMemo(() => {
    const logical = (slot: number) =>
      rtl ? latest.current.n - 1 - slot : slot;
    const update = (x: number) => {
      const g = groupLayout.value;
      const itemW = eW + (cW - eW) * progress.value;
      const s = slotAtX(
        x,
        barCenterX.current,
        g.barShift,
        itemW,
        latest.current.n
      );
      indicatorLead.value = s;
      indicatorTrail.value = s;
      indicatorOpacity.value = 1;
      const r = Math.round(s);
      if (r !== lastScrubSlot.current) {
        lastScrubSlot.current = r;
        setScrubSlot(r);
        const item = latest.current.items[logical(r)];
        if (item) latest.current.onScrubChange?.(item.name);
      }
    };
    const settle = (commit: boolean) => {
      const r = lastScrubSlot.current;
      lastScrubSlot.current = null;
      setScrubSlot(null);
      const { items: current, activeSlot: active } = latest.current;
      const target = r === null ? undefined : current[logical(r)];
      if (commit && target && r !== active) {
        target.onPress();
      } else if (active >= 0) {
        indicatorLead.value = animateTo(active, indicatorAnim);
        indicatorTrail.value = animateTo(active, indicatorAnim);
      }
    };
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) =>
        latest.current.scrubbing && isScrubGesture(g.dx, g.dy),
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.pageX;
        barRef.current?.measureInWindow((left, _top, width) => {
          barCenterX.current = left + width / 2;
          update(x);
        });
      },
      onPanResponderMove: (e) => update(e.nativeEvent.pageX),
      onPanResponderRelease: () => settle(true),
      onPanResponderTerminate: () => settle(false),
      onPanResponderTerminationRequest: () => false,
    });
    // Geometry and shared values are stable for a given layout.
  }, [
    rtl,
    eW,
    cW,
    groupLayout,
    progress,
    indicatorLead,
    indicatorTrail,
    indicatorOpacity,
    indicatorAnim,
  ]);

  const actionButtonElement =
    hasButton && actionButton ? (
      <View style={buttonLeft ? { marginRight: gap } : { marginLeft: gap }}>
        <ActionButton
          options={actionButton}
          size={eH}
          iconSize={sizes.iconSize}
          frame={buttonFrame}
          progress={progress}
          colors={colors}
          borderWidth={sizes.borderWidth}
          shadow={shadowConfig}
          pressFeedback={pressFeedback}
          renderBackground={renderBackground}
        />
      </View>
    ) : null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          bottom: insets.bottom + bottomOffset,
          paddingLeft: insets.left + horizontalInset,
          paddingRight: insets.right + horizontalInset,
          alignItems:
            anchor === 0 ? 'flex-start' : anchor === 1 ? 'flex-end' : 'center',
        },
        style,
        wrapperStyle,
      ]}
    >
      <View pointerEvents="box-none" style={styles.group}>
        {hasButton && buttonLeft ? actionButtonElement : null}
        <View
          ref={barRef}
          accessibilityRole="tablist"
          testID={testID}
          pointerEvents="box-none"
          {...(scrubbing ? scrubResponder.panHandlers : null)}
          style={[
            styles.bar,
            {
              flexDirection: rtl ? 'row-reverse' : 'row',
              width: barW,
              height: eH,
              padding: sizes.padding + sizes.borderWidth,
            },
          ]}
        >
          {renderBackground ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.customBackground,
                {
                  borderWidth: sizes.borderWidth,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
                customBackgroundStyle,
              ]}
            >
              {renderBackground({ progress, borderRadius: radius })}
            </Animated.View>
          ) : (
            <Capsule
              width={barW}
              height={eH}
              radius={radius}
              color={colors.background}
              borderColor={colors.border}
              borderWidth={sizes.borderWidth}
              frame={barFrame}
              shadow={shadowConfig}
              style={styles.origin}
            />
          )}

          {showIndicator && activeIndex >= 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, indicatorOpacityStyle]}
            >
              {renderIndicator ? (
                <Animated.View
                  style={[styles.customBackground, customIndicatorStyle]}
                >
                  {renderIndicator({
                    progress,
                    borderRadius: indicatorRadius,
                    routeName: activeRoute?.name ?? '',
                  })}
                </Animated.View>
              ) : (
                <Capsule
                  width={indicatorBoxW}
                  height={indicatorBoxH}
                  radius={indicatorRadius}
                  color={
                    focusedOptions?.tabBarActiveBackgroundColor ??
                    colors.indicator
                  }
                  borderColor="transparent"
                  borderWidth={0}
                  frame={indicatorFrame}
                  backdrop={renderBackground ? undefined : colors.background}
                  style={{ left: indicatorLeft, top: indicatorLeft }}
                />
              )}
            </Animated.View>
          ) : null}

          {items.map((item, index) => (
            <TabItem
              key={item.key}
              item={item}
              index={index}
              slot={visual(index)}
              rtl={rtl}
              geometry={geometry}
              progress={progress}
              sizes={sizes}
              colors={colors}
              pressFeedback={pressFeedback}
              itemStyle={itemStyle}
              labelStyle={labelStyle}
              badgeStyle={badgeStyle}
              badgeTextStyle={badgeTextStyle}
              renderTab={renderTab}
              barFrame={barFrame}
              focusAnimation={tabFocusAnimation}
            />
          ))}
        </View>
        {hasButton && !buttonLeft ? actionButtonElement : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    direction: 'ltr',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  origin: {
    left: 0,
    top: 0,
  },
  customBackground: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
