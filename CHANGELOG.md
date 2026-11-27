# Changelog

All notable changes to this project are documented here. The project uses [Semantic Versioning](https://semver.org/). Entries are generated from changesets; see [RELEASING.md](RELEASING.md).

## 0.1.0

### Added

- Floating pill tab bar for React Navigation bottom tabs and Expo Router `<Tabs>`, as a drop-in `tabBar`.
- Shrinks to icons on scroll down and expands on scroll up, animated with transforms and opacity only on the UI thread.
- Collapse modes: `icons`, `hide` and `none`, with configurable scroll thresholds per bar or per screen.
- Scroll hooks for Reanimated lists (`useShrinkingTabBarScrollHandler`) and plain lists (`useShrinkingTabBarScrollListener`), plus `useShrinkingTabBarInset` and `useShrinkingTabBar`.
- Light, dark and system themes; every colour and size customisable; centred or full-width layout; `placement` start, center or end.
- Sliding indicator with `slide`, `stretch`, `fade` and `none` transitions, `renderIndicator` for gradients, and per-tab `tabBarActiveBackgroundColor`.
- `tabFocusAnimation: 'pop'` for the newly selected icon.
- Action button beside the bar that shrinks with it.
- Finger scrubbing: drag along the bar to switch tabs, with `onScrubChange` for haptics.
- Glass background in a separate `/glass` entry point: Liquid Glass on iOS 26+, blur on older iOS, frosted fill on Android and web.
- `renderBackground` and `renderTab` for custom drawing.
- RTL support, screen-reader labels and states, badges, keyboard hiding, and hiding the bar per screen.
- Style presets (`minimal`, `compact`, `vibrant`, `fullWidth`, `hideOnScroll`) and `combine()` to merge presets, glass and your own options.
- Development warnings for common setup mistakes.
