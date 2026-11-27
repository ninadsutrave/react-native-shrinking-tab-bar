import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { makeMutable, type SharedValue } from 'react-native-reanimated';
import { DEFAULT_SCROLL_BEHAVIOR, type ScrollBehavior } from './scroll';

/** Height the expanded bar takes above the safe area, before the bar mounts. */
export const DEFAULT_OCCUPIED_HEIGHT = 66 + 12;

export interface TabBarStore {
  /** Target state, flipped by scroll hooks or by `collapse()` / `expand()`. */
  collapsed: SharedValue<boolean>;
  /** Animated 0 (expanded) to 1 (collapsed). Drive your own views with it. */
  progress: SharedValue<number>;
  /** Animated 0 (visible) to 1 (hidden by the keyboard or a screen option). */
  hidden: SharedValue<number>;
  /** Behaviour set on the bar; scroll hooks can override it per screen. */
  behavior: SharedValue<ScrollBehavior>;
  /** Space the expanded bar covers above the bottom safe area, in points. */
  occupiedHeight: {
    get: () => number;
    set: (value: number) => void;
    subscribe: (listener: () => void) => () => void;
  };
}

export function createTabBarStore(): TabBarStore {
  let height = DEFAULT_OCCUPIED_HEIGHT;
  const listeners = new Set<() => void>();
  return {
    collapsed: makeMutable(false),
    progress: makeMutable(0),
    hidden: makeMutable(0),
    behavior: makeMutable<ScrollBehavior>(DEFAULT_SCROLL_BEHAVIOR),
    occupiedHeight: {
      get: () => height,
      set: (value) => {
        if (value === height) return;
        height = value;
        listeners.forEach((l) => l());
      },
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
  };
}

let defaultStore: TabBarStore | undefined;

function getDefaultStore(): TabBarStore {
  if (!defaultStore) defaultStore = createTabBarStore();
  return defaultStore;
}

const StoreContext = createContext<TabBarStore | null>(null);

/**
 * Optional. Only needed when the app renders more than one shrinking tab bar
 * at once (for example, nested tab navigators). Wrap each navigator in its
 * own provider. Without it, every bar and hook share one default store.
 */
export function ShrinkingTabBarProvider({ children }: { children: ReactNode }) {
  const store = useMemo(createTabBarStore, []);
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

export function useTabBarStore(): TabBarStore {
  return useContext(StoreContext) ?? getDefaultStore();
}
