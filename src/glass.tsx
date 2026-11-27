import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform, StyleSheet, View } from 'react-native';
import type {
  BackgroundRenderProps,
  ShrinkingTabBarColors,
  ShrinkingTabBarOptions,
} from './types';

export interface GlassOptions {
  /** Light or dark glass. `auto` follows the bar's `theme`. Default `auto`. */
  scheme?: 'auto' | 'light' | 'dark';
  /** Liquid Glass style on iOS 26+: `regular` (frosted) or `clear`. Default `regular`. */
  variant?: 'regular' | 'clear';
  /** Tints the glass. On iOS 26+ it is passed to Liquid Glass; elsewhere it is laid over the blur. */
  tintColor?: string;
  /** Liquid Glass reacts to touch on iOS 26+. Default false. */
  interactive?: boolean;
  /** Blur strength on iOS before 26 and on web, 0 to 100. Default 80. */
  blurIntensity?: number;
  /** Fill on Android, where there is no system glass. */
  fallbackColor?: string;
}

function GlassFill({
  options,
  borderRadius,
  barDark,
}: {
  options: GlassOptions;
  borderRadius: number;
  barDark: boolean;
}) {
  const dark =
    !options.scheme || options.scheme === 'auto'
      ? barDark
      : options.scheme === 'dark';

  if (Platform.OS === 'ios' && isLiquidGlassAvailable()) {
    return (
      <GlassView
        style={[StyleSheet.absoluteFill, { borderRadius }]}
        glassEffectStyle={options.variant ?? 'regular'}
        tintColor={options.tintColor}
        isInteractive={options.interactive}
        colorScheme={dark ? 'dark' : 'light'}
      />
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <>
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={options.blurIntensity ?? 80}
          tint={dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'}
        />
        {options.tintColor ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: options.tintColor },
            ]}
          />
        ) : null}
      </>
    );
  }

  // Browsers blur what's behind cheaply with backdrop-filter.
  if (Platform.OS === 'web') {
    return (
      <BlurView
        style={[StyleSheet.absoluteFill, { borderRadius }]}
        intensity={options.blurIntensity ?? 80}
        tint={dark ? 'dark' : 'light'}
      >
        {options.tintColor ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: options.tintColor },
            ]}
          />
        ) : null}
      </BlurView>
    );
  }

  // Android has no system glass: a frosted fill with a light top edge reads
  // as glass without the cost of a live blur.
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor:
            options.fallbackColor ??
            (dark ? 'rgba(38, 38, 42, 0.94)' : 'rgba(250, 250, 252, 0.95)'),
        },
      ]}
    >
      <View
        style={[
          styles.highlight,
          {
            backgroundColor: dark
              ? 'rgba(255, 255, 255, 0.10)'
              : 'rgba(255, 255, 255, 0.85)',
          },
        ]}
      />
    </View>
  );
}

/**
 * Glass background for the bar and the action button. Spread it into the bar:
 *
 * ```tsx
 * import { glass } from 'react-native-shrinking-tab-bar/glass';
 * <ShrinkingTabBar {...props} {...glass()} />
 * ```
 *
 * Needs `expo-glass-effect` and `expo-blur`. If you also pass `colors`,
 * merge them: `colors={{ ...glass().colors, activeTint: '#fff' }}`.
 */
export function glass(options: GlassOptions = {}): Required<
  Pick<ShrinkingTabBarOptions, 'renderBackground'>
> & {
  colors: Partial<ShrinkingTabBarColors>;
} {
  return {
    renderBackground: ({ borderRadius, dark }: BackgroundRenderProps) => (
      <GlassFill options={options} borderRadius={borderRadius} barDark={dark} />
    ),
    colors: {
      background: 'transparent',
      border: 'rgba(255, 255, 255, 0.16)',
      indicator: 'rgba(128, 128, 128, 0.22)',
    },
  };
}

const styles = StyleSheet.create({
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
