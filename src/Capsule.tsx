import { processColor, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type DerivedValue,
} from 'react-native-reanimated';

/** Current on-screen frame of a capsule, relative to its expanded layout box. */
export interface CapsuleFrame {
  /** Current width and height. */
  w: number;
  h: number;
  /** Offset of the current centre from the layout box centre. */
  tx: number;
  ty: number;
}

export interface CapsuleShadow {
  color: string;
  opacity: number;
  radius: number;
  offsetY: number;
  elevation: number;
}

interface Props {
  /** Layout box (the expanded size). Never changes during the animation. */
  width: number;
  height: number;
  /** Corner radius at full height. Clamped to height / 2. */
  radius: number;
  color: string;
  borderColor: string;
  borderWidth: number;
  frame: DerivedValue<CapsuleFrame>;
  shadow?: CapsuleShadow;
  style?: ViewStyle;
}

/** Extra width the middle piece tucks under each cap, to hide seams. */
const OVERLAP = 1;

function rgba(color: string): [number, number, number, number] | null {
  const c = processColor(color);
  if (typeof c !== 'number') return null;
  const n = c >>> 0;
  return [(n >>> 16) & 255, (n >>> 8) & 255, n & 255, ((n >>> 24) & 255) / 255];
}

/**
 * The pieces overlap slightly, so a see-through fill would show darker
 * seams. Instead draw the pieces opaque and fade the whole group once,
 * which iOS and Android both composite as a single layer.
 */
function splitAlpha(fill: string, border: string) {
  const f = rgba(fill);
  if (!f || f[3] >= 1 || f[3] <= 0) {
    return { fill, border, opacity: 1 };
  }
  const alpha = f[3];
  const b = rgba(border);
  const borderOut = b
    ? `rgba(${b[0]}, ${b[1]}, ${b[2]}, ${Math.min(1, b[3] / alpha)})`
    : border;
  return {
    fill: `rgb(${f[0]}, ${f[1]}, ${f[2]})`,
    border: borderOut,
    opacity: alpha,
  };
}

/**
 * A rounded rectangle that changes size using transforms only, so it never
 * triggers layout. It is drawn as three pieces: two end caps that scale
 * uniformly (corners stay circular) and slide, and a middle that stretches.
 */
export function Capsule({
  width,
  height,
  radius,
  color,
  borderColor,
  borderWidth,
  frame,
  shadow,
  style,
}: Props) {
  const solid = splitAlpha(color, borderColor);
  const W = Math.max(width, 2 * Math.min(radius, height / 2));
  const H = height;
  const R = Math.min(radius, H / 2);
  const mid = Math.max(W - 2 * R, 0) + 2 * OVERLAP;

  const leftStyle = useAnimatedStyle(() => {
    const f = frame.value;
    const s = f.h / H;
    const curW = Math.max(f.w, 2 * R * s);
    return {
      transform: [
        { translateX: (W - curW) / 2 - (R * (1 - s)) / 2 },
        { scale: s },
      ],
    };
  });

  const rightStyle = useAnimatedStyle(() => {
    const f = frame.value;
    const s = f.h / H;
    const curW = Math.max(f.w, 2 * R * s);
    return {
      transform: [
        { translateX: -(W - curW) / 2 + (R * (1 - s)) / 2 },
        { scale: s },
      ],
    };
  });

  const midStyle = useAnimatedStyle(() => {
    const f = frame.value;
    const s = f.h / H;
    const curMid = Math.max(f.w - 2 * R * s, 0) + 2 * OVERLAP * s;
    return {
      transform: [{ scaleX: mid > 0 ? curMid / mid : 0 }, { scaleY: s }],
    };
  });

  // The container carries the position, so the pieces only ever shrink
  // inside their own box. That matters on Android, where a faded group is
  // drawn offscreen and clipped to the box.
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: frame.value.tx }, { translateY: frame.value.ty }],
  }));

  // The shadow is one blurred shape scaled non-uniformly. Its slightly
  // squashed corners are invisible under the blur, and it is inset so it
  // never pokes out from behind the crisp pieces.
  const shadowStyle = useAnimatedStyle(() => {
    const f = frame.value;
    const inset = 3;
    return {
      transform: [
        { scaleX: (f.w - 2 * inset) / W },
        { scaleY: (f.h - 2 * inset) / H },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      // Android fades each child separately unless told to composite the
      // group offscreen, which would bring the seams back.
      needsOffscreenAlphaCompositing={solid.opacity < 1}
      style={[
        { position: 'absolute', width: W, height: H, opacity: solid.opacity },
        style,
        containerStyle,
      ]}
    >
      {shadow && color !== 'transparent' ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: R,
              backgroundColor: solid.fill,
              shadowColor: shadow.color,
              shadowOpacity: shadow.opacity,
              shadowRadius: shadow.radius,
              shadowOffset: { width: 0, height: shadow.offsetY },
              elevation: shadow.elevation,
            },
            shadowStyle,
          ]}
        />
      ) : null}
      <Animated.View
        style={[
          styles.piece,
          {
            left: R - OVERLAP,
            width: mid,
            height: H,
            backgroundColor: solid.fill,
            borderColor: solid.border,
            borderTopWidth: borderWidth,
            borderBottomWidth: borderWidth,
          },
          midStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.piece,
          {
            left: 0,
            width: R,
            height: H,
            backgroundColor: solid.fill,
            borderColor: solid.border,
            borderTopWidth: borderWidth,
            borderBottomWidth: borderWidth,
            borderLeftWidth: borderWidth,
            borderTopLeftRadius: R,
            borderBottomLeftRadius: R,
          },
          leftStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.piece,
          {
            left: W - R,
            width: R,
            height: H,
            backgroundColor: solid.fill,
            borderColor: solid.border,
            borderTopWidth: borderWidth,
            borderBottomWidth: borderWidth,
            borderRightWidth: borderWidth,
            borderTopRightRadius: R,
            borderBottomRightRadius: R,
          },
          rightStyle,
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0 },
});
