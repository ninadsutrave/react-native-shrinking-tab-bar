# react-native-shrinking-tab-bar

A floating pill tab bar for React Navigation and Expo Router. It shrinks to icons when you scroll down and comes back when you scroll up.

- **Drop-in.** Pass it as the `tabBar` of `@react-navigation/bottom-tabs` v7 or Expo Router `<Tabs>`. It reads the tab options you already set: `tabBarIcon`, `tabBarLabel`, `title`, `tabBarBadge`, tint colours, test IDs and accessibility labels.
- **Smooth on Android and iOS.** The collapse is animated with transforms and opacity only, on the UI thread. It never re-runs layout and never waits on the JS thread, so a busy feed doesn't make it stutter.
- **Customisable.** Colours, sizes, scroll thresholds, animation curve, indicator style and transition, press feedback, background (including Liquid Glass), placement, an action button beside the bar, and the tab content itself.
- **Complete.** RTL, screen readers, badges, keyboard, safe areas, hidden routes and per-screen settings are handled.

## Contents

- [Requirements](#requirements)
- [Install](#install)
- [Usage](#usage)
- [Options](#options)
- [Presets](#presets) · [Scrubbing](#scrubbing) · [Glass](#glass) · [Action button](#action-button) · [Selected tab style](#selected-tab-style) · [Custom tab content](#custom-tab-content)
- [Right-to-left languages](#right-to-left-languages)
- [Controlling it from code](#controlling-it-from-code)
- [Hooks reference](#hooks-reference)
- [How it works](#how-it-works)
- [Accessibility](#accessibility)
- [Troubleshooting](#troubleshooting)
- [Example app](#example-app)
- [Contributing](#contributing)
- [License](#license)

## Requirements

| | Tested | Expected to work |
| --- | --- | --- |
| React Native | 0.86, new architecture | 0.72+ |
| Reanimated | 4.5 (with Worklets 0.10) | 3.6+ |
| React Navigation bottom tabs | 7.22 | 7.x |
| Expo | SDK 57 (Expo Go) | SDK 50+ |
| Platforms | iOS 26.5 simulator, Android 16 emulator | iOS, Android |

"Expected to work" means the code uses nothing newer, but it hasn't been run there yet. Web is untested.

## Install

```sh
npm install react-native-shrinking-tab-bar
```

Peer dependencies, which most React Navigation apps already have:

```sh
npm install react-native-reanimated react-native-safe-area-context
```

Reanimated 3.6 or newer works. On Reanimated 4, also install `react-native-worklets`, as its docs describe.

## Usage

### 1. Use it as the tab bar

React Navigation:

```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ShrinkingTabBar } from 'react-native-shrinking-tab-bar';

const Tab = createBottomTabNavigator();

<Tab.Navigator tabBar={(props) => <ShrinkingTabBar {...props} />}>
  <Tab.Screen name="Home" component={Home} options={{ tabBarIcon: ... }} />
</Tab.Navigator>
```

Expo Router:

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { ShrinkingTabBar } from 'react-native-shrinking-tab-bar';

export default function Layout() {
  return <Tabs tabBar={(props) => <ShrinkingTabBar {...props} />} />;
}
```

Routes with `href: null` are left out of the bar.

### 2. Connect your lists

The bar collapses when a list scrolls. Give each scrollable screen a handler:

```tsx
import Animated from 'react-native-reanimated';
import {
  useShrinkingTabBarScrollHandler,
  useShrinkingTabBarInset,
} from 'react-native-shrinking-tab-bar';

function Home() {
  const onScroll = useShrinkingTabBarScrollHandler();
  const inset = useShrinkingTabBarInset();

  return (
    <Animated.FlatList
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{ paddingBottom: inset }}
      ...
    />
  );
}
```

`useShrinkingTabBarScrollHandler` works with `Animated.ScrollView`, `Animated.FlatList` and any list wrapped in `Animated.createAnimatedComponent`. It runs on the UI thread.

**On the web,** Reanimated's animated lists don't pass scroll events on, so use a regular `FlatList` or `ScrollView` there. `useShrinkingTabBarScrollHandler` returns a plain callback on the web, so the same hook works with them.

For a list that isn't a Reanimated component (FlashList, SectionList, a third-party list), use the plain-callback version instead:

```tsx
const onScroll = useShrinkingTabBarScrollListener();
<FlashList onScroll={onScroll} scrollEventThrottle={16} ... />
```

To run your own Reanimated scroll handler as well, combine them with Reanimated's `useComposedEventHandler([onScroll, yours])`.

`useShrinkingTabBarInset()` returns the space the expanded bar covers, including the bottom safe area. Use it as bottom padding so the last item isn't hidden behind the bar. React Navigation's `useBottomTabBarHeight` doesn't apply to a floating bar.

No Provider is needed. If you render two shrinking tab bars at once (nested tab navigators), wrap each navigator in its own `<ShrinkingTabBarProvider>`.

## Options

All props are optional.

### Behaviour

| Prop | Default | |
| --- | --- | --- |
| `collapseMode` | `'icons'` | `'icons'` shrinks to icons, `'hide'` slides the whole bar away, `'none'` never changes. |
| `behavior.collapseAfter` | `48` | Points of continuous downward scroll before collapsing. |
| `behavior.expandAfter` | `24` | Points of continuous upward scroll before expanding. |
| `behavior.expandNearTop` | `16` | The bar is always expanded this close to the top. |
| `behavior.expandAtEnd` | `false` | Expand when the list reaches its end. |
| `expandOnTabChange` | `true` | Switching tabs expands the bar. |
| `expandOnFocusedTabPress` | `true` | Tapping the current tab while collapsed expands the bar. |
| `hideOnKeyboard` | `true` on Android | Slide the bar away while the keyboard is open. |
| `keepLabelsWhenCollapsed` | `false` | Keep labels and only reduce the height. The collapsed height is raised if needed so icon and label still fit. |
| `onCollapseChange` | | `(collapsed) => void`, called on the JS thread. |
| `onTabPress`, `onTabLongPress` | | `(routeName, focused) => void`. A good place for haptics. |
| `scrubbing` | `true` | Drag along the bar to switch tabs. See [Scrubbing](#scrubbing). |
| `onScrubChange` | | `(routeName) => void`, called as a scrub crosses into another tab. |

The scroll thresholds can also be set per screen: `useShrinkingTabBarScrollHandler({ behavior: { collapseAfter: 120 } })`. The hooks also take `enabled` and `inverted` (for chat lists).

To hide the bar on one screen, set `tabBarStyle: { display: 'none' }` in that screen's options, as with the default tab bar.

### Look

| Prop | Default | |
| --- | --- | --- |
| `theme` | `'auto'` | `'light'`, `'dark'`, or follow the system. |
| `direction` | `'auto'` | `'auto'` follows `I18nManager.isRTL`. `'rtl'` puts the first tab on the right. |
| `colors` | | `background`, `border`, `activeTint`, `inactiveTint`, `indicator`, `shadow`, `badge`, `badgeText`, `actionBackground`, `actionTint`. The last two default to `background` and `activeTint`. |
| `sizes.expanded` | `{ itemWidth: 84, height: 66 }` | Size of each tab and the bar when expanded. |
| `sizes.collapsed` | `{ itemWidth: 60, height: 50 }` | The same, collapsed. |
| `sizes.iconSize` | `24` | Passed to `tabBarIcon` as `size`. |
| `sizes.labelFontSize`, `labelLineHeight`, `labelGap` | `12`, `15`, `4` | |
| `sizes.padding`, `borderWidth`, `borderRadius` | `4`, `1`, `999` | `999` means fully rounded. |
| `sizes.indicatorRadius`, `indicatorInset` | `999`, `0` | |
| `placement` | `'center'` | `'start'` or `'end'` anchors the bar to that edge (mirrored in RTL), and it shrinks towards it. |
| `align` | `'center'` | `'stretch'` spans the screen width minus `horizontalInset`. |
| `bottomOffset` | `12` | Gap above the bottom safe area. |
| `horizontalInset` | `16` | Side margin. |
| `showIndicator` | `true` | The sliding pill behind the current tab. |
| `indicatorTransition` | `'slide'` | How the indicator moves between tabs: `'slide'`, `'stretch'` (leading edge runs ahead, trailing edge catches up), `'fade'` or `'none'`. |
| `tabFocusAnimation` | `'none'` | `'pop'` gives the newly selected icon a small bounce. |
| `renderIndicator` | | Draw the indicator yourself, e.g. a gradient. See below. |
| `shadow` | `true` | `false`, or `{ color, opacity, radius, offsetY, elevation }`. |
| `pressFeedback` | `'scale'` | `'scale'`, `'opacity'`, `'ripple'` (Android; opacity on iOS) or `'none'`. |
| `style`, `itemStyle`, `labelStyle`, `badgeStyle`, `badgeTextStyle` | | Style overrides. |

### Presets

Ready-made looks, spread in like any options:

```tsx
import { presets } from 'react-native-shrinking-tab-bar';

<ShrinkingTabBar {...props} {...presets.vibrant} />
```

| Preset | Look |
| --- | --- |
| `minimal` | No indicator, border or shadow. The active tab is shown by colour, with a small pop on select. |
| `compact` | Smaller tabs and a lower bar, for 5 tabs or small screens. |
| `vibrant` | Solid violet indicator with white icons, a stretchy switch and a pop. |
| `fullWidth` | Spans the screen, with softer corners. |
| `hideOnScroll` | Slides away entirely on scroll down. |

To mix presets, glass and your own options, use `combine()`. Later parts win, and nested options (`colors`, `sizes`, `behavior`, `shadow`) merge key by key, so changing one colour keeps the rest. Falsy parts are skipped:

```tsx
import { combine, presets } from 'react-native-shrinking-tab-bar';
import { glass } from 'react-native-shrinking-tab-bar/glass';

<ShrinkingTabBar
  {...props}
  {...combine(presets.compact, useGlass && glass(), {
    colors: { activeTint: '#FFFFFF' },
  })}
/>
```

### Animation

```tsx
<ShrinkingTabBar
  {...props}
  animation={{ type: 'spring', damping: 18, stiffness: 220 }}
  indicatorAnimation={{ type: 'timing', duration: 180 }}
/>
```

`animation` takes any Reanimated `withTiming` or `withSpring` config with a `type` field. The default is 220 ms timing on the standard ease-in-out curve (`Easing.bezier(0.4, 0, 0.2, 1)`). Reanimated's reduce-motion setting is respected.

### Scrubbing

Drag a finger along the bar to switch tabs: the indicator follows the finger, the tab under it lights up, and letting go switches to it. Letting go on the current tab slides the indicator back. Taps work exactly as before: a drag only takes over once it's clearly horizontal (more than 8 points, mostly sideways).

Add a haptic tick at each tab boundary:

```tsx
import * as Haptics from 'expo-haptics';

<ShrinkingTabBar {...props} onScrubChange={() => Haptics.selectionAsync()} />
```

Scrubbing works collapsed and expanded, with any placement, and in RTL. Turn it off with `scrubbing={false}`. It uses React Native's built-in touch responder, so it needs no extra dependency; the indicator is driven from the JS thread while you drag.

### Glass

```sh
npx expo install expo-glass-effect expo-blur
```

```tsx
import { glass } from 'react-native-shrinking-tab-bar/glass';

<ShrinkingTabBar {...props} {...glass()} />
```

It uses the best glass each platform has:

- **iOS 26 and newer:** real Liquid Glass (`expo-glass-effect`).
- **Older iOS:** the system material blur (`expo-blur`).
- **Android:** a frosted fill with a light top edge. There's no system glass there, and a live blur costs too much for a bar that sits on every screen.
- **Web:** a real blur of what's behind, with CSS `backdrop-filter`.

Options: `glass({ scheme, variant, tintColor, interactive, blurIntensity, fallbackColor })`. `scheme` is `'auto'` (follows the bar's `theme`), `'light'` or `'dark'`; `variant` is Liquid Glass's `'regular'` or `'clear'`. To change colours as well, merge with `combine(glass(), { colors: { activeTint: '#fff' } })`; passing `colors` on its own would replace glass's colours.

The glass import is separate, so apps that don't use it never need the Expo modules.

### Action button

A round button beside the bar, like the search button next to iOS 26's tab bar. It shrinks with the bar and keeps the same gap.

```tsx
<ShrinkingTabBar
  {...props}
  actionButton={{
    icon: ({ color, size }) => <Ionicons name="add" color={color} size={size} />,
    onPress: () => router.push('/new'),
    accessibilityLabel: 'New post',
  }}
/>
```

Options: `side` (`'end'` by default, or `'start'`), `gap` (10), `color`, `backgroundColor`, `borderColor`, `visible`, `onLongPress`, `testID`, `style`. It uses the bar's colours, shadow, press feedback and background (including glass) unless you override them.

### Custom background (blur)

```tsx
import { BlurView } from 'expo-blur';

<ShrinkingTabBar
  {...props}
  colors={{ background: 'transparent' }}
  renderBackground={() => (
    <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
  )}
/>
```

On Android, expo-blur 57 only blurs content inside a `BlurTargetView` that you pass as `blurTarget`. Without one it falls back to a tint (`blurMethod="none"`). See the [expo-blur docs](https://docs.expo.dev/versions/latest/sdk/blur-view/).

The built-in background is drawn as three pieces (two end caps and a middle) so it can change size with transforms alone. A custom background can't be split up that way, so it's clipped by a box whose size animates. That costs one layout pass per animation frame, for that box only.

### Selected tab style

- **Colour:** `colors.indicator` for every tab, or `tabBarActiveBackgroundColor` in a screen's options for that tab only.
- **Icon and label colour:** `colors.activeTint` and `colors.inactiveTint`, or `tabBarActiveTintColor` and `tabBarInactiveTintColor` per screen.
- **Shape:** `sizes.indicatorRadius` and `sizes.indicatorInset`.
- **Gradient or anything else:**

```tsx
import { LinearGradient } from 'expo-linear-gradient';

<ShrinkingTabBar
  {...props}
  renderIndicator={({ routeName }) => (
    <LinearGradient
      colors={routeName === 'Saved' ? ['#F59E0B', '#EF4444'] : ['#7C3AED', '#DB2777']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  )}
/>
```

Like a custom bar background, a custom indicator is clipped by a box that changes size, so it costs a layout pass per animation frame. The built-in indicator uses transforms only.

### Custom tab content

```tsx
<ShrinkingTabBar
  {...props}
  renderTab={({ label, focused, color, progress }) => <MyTab ... />}
/>
```

The bar still handles sizing, pressing and accessibility; you draw what's inside. `progress` is a shared value from 0 (expanded) to 1 (collapsed).

## Right-to-left languages

RTL works without any setup. When `I18nManager.isRTL` is true, the first tab sits on the right, the indicator and collapse animation mirror, and badges move to the icon's top-left. Screen readers still read the tabs from first to last. Use `direction="ltr"` or `"rtl"` to override.

In Expo, enable RTL with `"extra": { "supportsRTL": true }` in `app.json` (add `"forcesRTL": true` to test it). Expo Go ignores `I18nManager.forceRTL()` called at runtime.

## Controlling it from code

```tsx
const { collapse, expand, toggle, progress, collapsed, hidden } =
  useShrinkingTabBar();
```

`progress` is useful for moving other views with the bar, such as a floating action button:

```tsx
const { progress } = useShrinkingTabBar();
const style = useAnimatedStyle(() => ({
  transform: [{ translateY: progress.value * 14 }],
}));
```

## Hooks reference

| Hook | Returns | Use |
| --- | --- | --- |
| `useShrinkingTabBarScrollHandler(options?)` | Reanimated scroll handler | `onScroll` of `Animated.ScrollView` / `Animated.FlatList`. Runs on the UI thread. |
| `useShrinkingTabBarScrollListener(options?)` | `(event) => void` | `onScroll` of any other list (FlashList, SectionList). |
| `useShrinkingTabBarInset()` | `number` | Bottom padding that keeps the last item clear of the bar. |
| `useShrinkingTabBar()` | `{ collapse, expand, toggle, progress, collapsed, hidden }` | Control the bar from code, or drive your own views with `progress`. |

Both scroll hooks take `{ enabled, inverted, behavior }`. `behavior` overrides the bar's thresholds for that screen.

## How it works

A scroll hook feeds each list's offset to a small state machine. It collapses after `collapseAfter` points of continuous downward scroll and expands after `expandAfter` points upward. Offsets are clamped to the list's range, so iOS bounce and Android overscroll never flip it. The state lives in a shared value, so the scroll hooks and the bar talk on the UI thread without any React re-render.

The bar keeps its expanded layout at all times and draws the collapsed state with transforms:

- The pill is drawn as three pieces: two round end caps that scale evenly and slide inward, and a middle that stretches. That keeps the corners perfectly round at every size without changing any width or height.
- Each tab's tap area moves and scales with the bar, so taps land on the icon you see. The icon inside is scaled back so it stays sharp.
- Labels fade and the icons slide to the centre.

The only exceptions are custom backgrounds and custom indicators (`renderBackground`, `renderIndicator`, and so glass). Those can't be split into pieces, so their clipping box changes size, which costs one small layout pass per frame.

## Accessibility

Each tab has the `tab` role, its selected state, and its label as the accessibility label even when the label is hidden. Badges are read out (`"Saved, 3 new"`). Override with `tabBarAccessibilityLabel`. Label font scaling is capped at 1.3× so large text doesn't break the bar.

## Example app

```sh
yarn
yarn example start
```

Open it in Expo Go. The Tweak tab switches every visual option live.

## Troubleshooting

In development, the bar warns once in the console about common setup mistakes: more than 5 tabs, tabs without an icon (they'd be empty when collapsed), an opaque `colors.background` covering a custom background or glass, an action button without an accessibility label, and two bars sharing state without their own Providers. These checks are skipped in production builds.

**The bar never collapses.** Check that the list uses one of the scroll hooks and has `scrollEventThrottle={16}`. With `useShrinkingTabBarScrollHandler`, the list must be a Reanimated component (`Animated.FlatList`, not `FlatList`). Short screens never collapse: there has to be more content than fits.

**The last item is hidden behind the bar.** Add `useShrinkingTabBarInset()` as `paddingBottom` on the list's `contentContainerStyle`.

**`useAnimatedStyle` was used without a dependency array** (in tests). Add `react-native-worklets/plugin` to your Babel config for the test environment, and call Reanimated's `setUpTests()` in your Jest setup. This repo's `babel.config.mjs` and `test/setup.js` show how.

**Two tab bars affect each other.** Wrap each navigator in its own `<ShrinkingTabBarProvider>`.

**Blur looks like a flat tint on Android.** That's expo-blur's fallback; see [Custom background](#custom-background-blur).

## Contributing

Bug reports, ideas and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for how to run the example app and tests, and the [code of conduct](CODE_OF_CONDUCT.md). Report security issues privately, as described in [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © [Ninad Sutrave](https://ninadsutrave.com)
