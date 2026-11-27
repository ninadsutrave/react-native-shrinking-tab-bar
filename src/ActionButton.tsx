import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type DerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import type { CapsuleShadow } from './Capsule';
import type {
  ActionButtonOptions,
  BackgroundRenderProps,
  PressFeedback,
  ShrinkingTabBarColors,
} from './types';

export interface ActionButtonFrame {
  /** Uniform scale: current diameter / expanded diameter. */
  s: number;
  tx: number;
  ty: number;
}

interface Props {
  options: ActionButtonOptions;
  /** Expanded diameter (the bar's expanded height). */
  size: number;
  iconSize: number;
  frame: DerivedValue<ActionButtonFrame>;
  progress: SharedValue<number>;
  colors: ShrinkingTabBarColors;
  borderWidth: number;
  shadow?: CapsuleShadow;
  pressFeedback: PressFeedback;
  renderBackground?: (props: BackgroundRenderProps) => ReactNode;
}

/**
 * A round button beside the bar (search, compose, cart...). It is a circle,
 * so it shrinks with a uniform scale and stays perfectly round, using
 * transforms only.
 */
export function ActionButton({
  options,
  size,
  iconSize,
  frame,
  progress,
  colors,
  borderWidth,
  shadow,
  pressFeedback,
  renderBackground,
}: Props) {
  const pressed = useSharedValue(0);
  const feedback =
    pressFeedback === 'ripple' && Platform.OS !== 'android'
      ? 'opacity'
      : pressFeedback;
  const radius = size / 2;
  const color = options.color ?? colors.activeTint;
  const background = options.backgroundColor ?? colors.background;
  const border = options.borderColor ?? colors.border;

  const boxStyle = useAnimatedStyle(() => {
    const f = frame.value;
    return {
      transform: [{ translateX: f.tx }, { translateY: f.ty }, { scale: f.s }],
    };
  });

  // Keep the icon its real size while the circle shrinks around it.
  const iconStyle = useAnimatedStyle(() => {
    const press = feedback === 'scale' ? 1 - pressed.value * 0.1 : 1;
    return {
      opacity: feedback === 'opacity' ? 1 - pressed.value * 0.45 : 1,
      transform: [{ scale: press / frame.value.s }],
    };
  });

  const icon =
    typeof options.icon === 'function'
      ? options.icon({ color, size: iconSize })
      : options.icon;

  const shadowStyle =
    shadow && background !== 'transparent'
      ? {
          shadowColor: shadow.color,
          shadowOpacity: shadow.opacity,
          shadowRadius: shadow.radius,
          shadowOffset: { width: 0, height: shadow.offsetY },
          elevation: shadow.elevation,
        }
      : null;

  return (
    <Animated.View style={[{ width: size, height: size }, boxStyle]}>
      {renderBackground ? (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            styles.clip,
            {
              borderRadius: radius,
              borderWidth,
              borderColor: border,
              backgroundColor: background,
            },
          ]}
        >
          {renderBackground({ progress, borderRadius: radius })}
        </View>
      ) : (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius,
              borderWidth,
              borderColor: border,
              backgroundColor: background,
            },
            shadowStyle,
          ]}
        />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={options.accessibilityLabel}
        testID={options.testID}
        onPress={options.onPress}
        onLongPress={options.onLongPress}
        onPressIn={() => {
          pressed.value = withTiming(1, { duration: 90 });
        }}
        onPressOut={() => {
          pressed.value = withTiming(0, { duration: 160 });
        }}
        android_ripple={
          feedback === 'ripple'
            ? { color: colors.indicator, borderless: true, radius }
            : undefined
        }
        style={[styles.press, options.style]}
      >
        <Animated.View style={iconStyle}>{icon}</Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  press: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
