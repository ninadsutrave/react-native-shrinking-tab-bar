import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { useEffect, useRef, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type DerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import type { CapsuleFrame } from './Capsule';
import type {
  PressFeedback,
  ShrinkingTabBarColors,
  ShrinkingTabBarSizes,
  TabRenderProps,
} from './types';

export interface TabItemDescriptor {
  key: string;
  name: string;
  title: string;
  focused: boolean;
  color: string;
  options: BottomTabNavigationOptions;
  onPress: () => void;
  onLongPress: () => void;
}

/** Sizes in both states, shared by every tab. */
export interface TabGeometry {
  n: number;
  /** Item width expanded / collapsed. */
  eW: number;
  cW: number;
  /** Item height (bar height minus padding and border) expanded / collapsed. */
  innerE: number;
  innerC: number;
  eH: number;
  cH: number;
  /** How far the icon moves down to the centre once the label is gone. */
  labelShift: number;
  hideLabels: boolean;
}

interface Props {
  item: TabItemDescriptor;
  /** Position in the route list (what renderTab sees). */
  index: number;
  /** Physical position from the left, which differs from index in RTL. */
  slot: number;
  rtl: boolean;
  geometry: TabGeometry;
  progress: SharedValue<number>;
  sizes: ShrinkingTabBarSizes;
  colors: ShrinkingTabBarColors;
  pressFeedback: PressFeedback;
  itemStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  badgeStyle?: StyleProp<ViewStyle>;
  badgeTextStyle?: StyleProp<TextStyle>;
  renderTab?: (props: TabRenderProps) => ReactNode;
  /** The bar's current frame; its tx moves every tab with the bar. */
  barFrame: DerivedValue<CapsuleFrame>;
  focusAnimation: 'none' | 'pop';
}

export function TabItem({
  item,
  index,
  slot: visualSlot,
  rtl,
  geometry: g,
  progress,
  sizes,
  colors,
  pressFeedback,
  itemStyle,
  labelStyle,
  badgeStyle,
  badgeTextStyle,
  renderTab,
  barFrame,
  focusAnimation,
}: Props) {
  const { options, focused, color, title } = item;
  const pressed = useSharedValue(0);
  const pop = useSharedValue(0);
  const wasFocused = useRef(focused);
  useEffect(() => {
    if (focused && !wasFocused.current && focusAnimation === 'pop') {
      pop.value = withSequence(
        withTiming(1, { duration: 110 }),
        withSpring(0, { damping: 9, stiffness: 260 })
      );
    }
    wasFocused.current = focused;
  }, [focused, focusAnimation, pop]);
  const feedback =
    pressFeedback === 'ripple' && Platform.OS !== 'android'
      ? 'opacity'
      : pressFeedback;

  // The hit box moves and scales with the bar, so taps land on the tab
  // you see. The content inside is scaled back so icons stay crisp.
  const slot = visualSlot + 0.5 - g.n / 2;
  const boxStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const itemW = g.eW + (g.cW - g.eW) * p;
    const inner = g.innerE + (g.innerC - g.innerE) * p;
    const h = g.eH + (g.cH - g.eH) * p;
    return {
      transform: [
        { translateX: slot * (itemW - g.eW) + barFrame.value.tx },
        { translateY: (g.eH - h) / 2 },
        { scaleX: itemW / g.eW },
        { scaleY: inner / g.innerE },
      ],
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const sx = (g.eW + (g.cW - g.eW) * p) / g.eW;
    const sy = (g.innerE + (g.innerC - g.innerE) * p) / g.innerE;
    const press =
      (feedback === 'scale' ? 1 - pressed.value * 0.08 : 1) *
      (1 + pop.value * 0.14);
    return {
      opacity: feedback === 'opacity' ? 1 - pressed.value * 0.45 : 1,
      transform: [
        { translateY: (g.labelShift * p) / sy },
        { scaleX: press / sx },
        { scaleY: press / sy },
      ],
    };
  });

  const labelAnimatedStyle = useAnimatedStyle(() => {
    // Always return every property: Reanimated keeps the last value of a
    // property a style stops returning, so `{}` would leave labels hidden.
    if (!g.hideLabels) return { opacity: 1, transform: [{ scale: 1 }] };
    const p = progress.value;
    return {
      opacity: interpolate(p, [0, 0.4], [1, 0], 'clamp'),
      transform: [{ scale: interpolate(p, [0, 1], [1, 0.82]) }],
    };
  });

  const showLabel = options.tabBarShowLabel !== false;
  // React Navigation's tabBarBadgeStyle is a text style; text properties go
  // to the number and the rest (background, size, position) to the badge.
  const {
    color: badgeColor,
    fontSize: badgeFontSize,
    fontWeight: badgeFontWeight,
    fontFamily: badgeFontFamily,
    ...badgeBoxStyle
  } = StyleSheet.flatten(options.tabBarBadgeStyle) ?? {};
  const badge = options.tabBarBadge;

  let content: ReactNode;
  if (renderTab) {
    content = renderTab({
      routeKey: item.key,
      routeName: item.name,
      label: title,
      index,
      focused,
      color,
      progress,
      onPress: item.onPress,
      onLongPress: item.onLongPress,
    });
  } else {
    const icon = options.tabBarIcon?.({
      focused,
      color,
      size: sizes.iconSize,
    });
    const label =
      typeof options.tabBarLabel === 'function' ? (
        options.tabBarLabel({
          focused,
          color,
          position: 'below-icon',
          children: title,
        })
      ) : (
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
          style={[
            styles.label,
            {
              color,
              fontSize: sizes.labelFontSize,
              lineHeight: sizes.labelLineHeight,
            },
            focused ? styles.labelFocused : null,
            labelStyle,
            options.tabBarLabelStyle,
          ]}
        >
          {title}
        </Text>
      );

    content = (
      <>
        <View
          style={[
            styles.icon,
            { height: sizes.iconSize, minWidth: sizes.iconSize },
            options.tabBarIconStyle,
          ]}
        >
          {icon}
          {badge !== undefined ? (
            <View
              style={[
                badge === '' ? styles.dot : styles.badge,
                rtl ? (badge === '' ? styles.dotRtl : styles.badgeRtl) : null,
                { backgroundColor: colors.badge },
                badgeStyle,
                badgeBoxStyle,
              ]}
            >
              {badge !== '' ? (
                <Text
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.2}
                  style={[
                    styles.badgeText,
                    { color: colors.badgeText },
                    badgeTextStyle,
                    {
                      color: badgeColor,
                      fontSize: badgeFontSize,
                      fontWeight: badgeFontWeight,
                      fontFamily: badgeFontFamily,
                    },
                  ]}
                >
                  {badge}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>
        {showLabel ? (
          <Animated.View
            style={[
              styles.labelBox,
              { marginTop: sizes.labelGap, height: sizes.labelLineHeight },
              labelAnimatedStyle,
            ]}
          >
            {label}
          </Animated.View>
        ) : null}
      </>
    );
  }

  const a11yLabel =
    options.tabBarAccessibilityLabel ??
    (badge !== undefined && badge !== '' ? `${title}, ${badge} new` : title);

  return (
    <Animated.View style={[{ width: g.eW, height: g.innerE }, boxStyle]}>
      <Pressable
        accessibilityRole={Platform.OS === 'web' ? 'link' : 'tab'}
        accessibilityState={{ selected: focused }}
        accessibilityLabel={a11yLabel}
        testID={options.tabBarButtonTestID}
        onPress={item.onPress}
        onLongPress={item.onLongPress}
        onPressIn={() => {
          pressed.value = withTiming(1, { duration: 90 });
        }}
        onPressOut={() => {
          pressed.value = withTiming(0, { duration: 160 });
        }}
        android_ripple={
          feedback === 'ripple'
            ? { color: colors.indicator, borderless: true }
            : undefined
        }
        style={[styles.pressable, itemStyle, options.tabBarItemStyle]}
      >
        <Animated.View style={[styles.content, contentStyle]}>
          {content}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelBox: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  label: {
    textAlign: 'center',
    includeFontPadding: false,
    fontWeight: '500',
  },
  labelFocused: {
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeRtl: {
    right: undefined,
    left: -10,
  },
  dotRtl: {
    right: undefined,
    left: -3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    includeFontPadding: false,
  },
});
