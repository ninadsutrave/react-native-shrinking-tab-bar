# Contributing

Thanks for helping improve react-native-shrinking-tab-bar. This guide covers how to set up the project, run the example app and tests, and send a pull request.

By taking part you agree to follow the [code of conduct](CODE_OF_CONDUCT.md).

## Before you start

- **Bugs:** open an issue with the bug report form. A minimal reproduction (a Snack, a repo, or the example app with your settings) gets it fixed much faster.
- **Features and API changes:** open an issue first and describe the use case. It's easier to agree on the API before code is written, and it avoids a pull request that can't be merged.
- **Small fixes** (typos, docs, an obvious bug with a test): go straight to a pull request.

## Project layout

```
src/                 the library
  ShrinkingTabBar.tsx  the bar: layout, state, animation
  TabItem.tsx          one tab
  Capsule.tsx          the transform-only rounded pill
  ActionButton.tsx     the round button beside the bar
  glass.tsx            the optional glass background (separate entry point)
  scroll.ts            the pure collapse state machine
  hooks.ts             scroll hooks and controls
  store.tsx            shared state, with an optional Provider
test/                unit tests (Node) and component tests (Jest)
example/             Expo app with a Tweak tab that toggles every option
```

## Setup

You need Node (the version in `.nvmrc`) and Yarn 4 through Corepack:

```sh
corepack enable
yarn
```

This is a Yarn workspace. Don't use npm to install, it won't link the example app to the library.

## Running the example app

```sh
yarn example start
```

Open it in Expo Go (SDK 57) on a device, the iOS Simulator or an Android emulator. The example imports the library's source directly, so edits in `src/` show up with fast refresh.

Please check visual changes on **both iOS and Android**. The two platforms differ in shadows, blur, group opacity and text rendering, and several past bugs only showed up on one of them.

## Checks

Run these before opening a pull request. CI runs the same ones.

```sh
yarn lint        # ESLint and Prettier
yarn typecheck   # TypeScript
yarn test        # Node unit tests + Jest component tests
yarn prepare     # builds lib/ with react-native-builder-bob
```

`yarn lint --fix` fixes formatting.

### Tests

- `test/scroll.test.mts` covers the collapse state machine with Node's built-in test runner. Add cases here for any change to scroll behaviour.
- `test/ShrinkingTabBar.test.tsx` covers the components and hooks with Jest and React Native Testing Library. Its `render`, `fireEvent` and `act` are async, so `await` them.

Animations don't run in Jest. Tests can check what an option renders and does, but not how it looks, so visual changes still need a device check.

## Guidelines

- **Performance:** animate with transforms and opacity, never width, height or position. If something truly can't be drawn that way, keep the layout animation to one small box and document it, as `renderBackground` does.
- **Worklets:** capture shared values in worklets, never objects that hold functions (such as the store). Reanimated copies whatever a worklet captures to the UI thread.
- **Animated styles:** always return every property from `useAnimatedStyle`. A property you stop returning keeps its last value.
- **RTL:** the bar lays out left to right internally and mirrors itself. Keep new geometry in physical coordinates and test with `direction="rtl"`.
- **Accessibility:** every pressable needs a role and a label, including when text is hidden.
- **Options:** new props should have a sensible default, a doc comment in `src/types.ts`, a row in the README tables, and a toggle in the example's Tweak tab when it's visual.
- **Dependencies:** the core must not depend on Expo packages. Optional integrations go in their own entry point, like `/glass`.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `fix:` a bug fix
- `feat:` a new feature or option
- `refactor:` a code change that is neither
- `docs:` documentation only
- `test:` tests only
- `chore:` tooling and config

For example: `fix: keep labels visible after toggling keepLabelsWhenCollapsed`.

## Pull requests

- Keep each pull request to one change.
- Fill in the template: what changed, why, and how you tested it on each platform.
- Add or update tests for behaviour changes.
- Update the README and `CHANGELOG.md` (under "Unreleased") for anything users will notice.
- CI must pass.

## Releases

Maintainers release from `main`. The version follows [Semantic Versioning](https://semver.org/); while the package is 0.x, minor versions may include breaking changes, and the changelog calls them out.
