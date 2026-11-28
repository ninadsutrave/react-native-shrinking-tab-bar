/// <reference types="jest" />
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react-native';
import { AccessibilityInfo, Text } from 'react-native';
import {
  combine,
  presets,
  ShrinkingTabBar,
  ShrinkingTabBarProvider,
  useShrinkingTabBar,
  useShrinkingTabBarScrollListener,
  type ShrinkingTabBarProps,
} from '../src';
import { resetWarnings } from '../src/warnings';

type RouteSpec = { name: string; options?: Record<string, unknown> };

async function setup(
  specs: RouteSpec[],
  index = 0,
  extra: Partial<ShrinkingTabBarProps> = {},
  preventDefault = false
) {
  const routes = specs.map((s) => ({
    key: `${s.name}-key`,
    name: s.name,
    params: undefined,
  }));
  const descriptors = Object.fromEntries(
    specs.map((s) => [
      `${s.name}-key`,
      {
        options: {
          tabBarIcon: ({ color }: { color: string }) => (
            <Text testID={`icon-${s.name}`}>{color}</Text>
          ),
          ...s.options,
        },
      },
    ])
  );
  const navigation = {
    emit: jest.fn(() => ({ defaultPrevented: preventDefault })),
    navigate: jest.fn(),
  };
  const props = {
    state: { index, routes, key: 'tabs', routeNames: specs.map((s) => s.name) },
    descriptors,
    navigation,
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
    ...extra,
  } as unknown as ShrinkingTabBarProps & BottomTabBarProps;

  // Each test gets its own store, so collapse state never leaks between tests.
  const utils = await render(
    <ShrinkingTabBarProvider>
      <ShrinkingTabBar {...props} />
    </ShrinkingTabBarProvider>
  );
  return { ...utils, navigation };
}

const THREE: RouteSpec[] = [
  { name: 'Home' },
  { name: 'Search' },
  { name: 'Saved', options: { tabBarBadge: 3 } },
];

describe('ShrinkingTabBar', () => {
  it('renders one tab per route, with labels and the selected state', async () => {
    await setup(THREE, 1);
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Search' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Home' })).not.toBeSelected();
  });

  it('uses title and tabBarLabel when given', async () => {
    await setup([
      { name: 'home', options: { title: 'Start' } },
      { name: 'feed', options: { tabBarLabel: 'For you', title: 'Feed' } },
    ]);
    expect(screen.getByText('Start')).toBeTruthy();
    expect(screen.getByText('For you')).toBeTruthy();
  });

  it('passes the active and inactive tint to icons', async () => {
    await setup(THREE, 0, {
      colors: { activeTint: '#ff0000', inactiveTint: '#00ff00' },
    });
    expect(screen.getByTestId('icon-Home')).toHaveTextContent('#ff0000');
    expect(screen.getByTestId('icon-Search')).toHaveTextContent('#00ff00');
  });

  it('lets a screen override the tint with tabBarActiveTintColor', async () => {
    await setup(
      [{ name: 'Home', options: { tabBarActiveTintColor: '#123456' } }],
      0
    );
    expect(screen.getByTestId('icon-Home')).toHaveTextContent('#123456');
  });

  it('emits tabPress and navigates when another tab is pressed', async () => {
    const { navigation } = await setup(THREE, 0);
    await fireEvent.press(screen.getByRole('tab', { name: 'Search' }));
    expect(navigation.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tabPress',
        target: 'Search-key',
        canPreventDefault: true,
      })
    );
    expect(navigation.navigate).toHaveBeenCalledWith('Search', undefined);
  });

  it('does not navigate when a listener prevents the press', async () => {
    const { navigation } = await setup(THREE, 0, {}, true);
    await fireEvent.press(screen.getByRole('tab', { name: 'Search' }));
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('does not navigate when the focused tab is pressed', async () => {
    const { navigation } = await setup(THREE, 0);
    await fireEvent.press(screen.getByRole('tab', { name: 'Home' }));
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('emits tabLongPress and calls onTabLongPress', async () => {
    const onTabLongPress = jest.fn();
    const { navigation } = await setup(THREE, 0, { onTabLongPress });
    await fireEvent(screen.getByRole('tab', { name: 'Search' }), 'longPress');
    expect(navigation.emit).toHaveBeenCalledWith({
      type: 'tabLongPress',
      target: 'Search-key',
    });
    expect(onTabLongPress).toHaveBeenCalledWith('Search', false);
  });

  it('calls onTabPress with the route name and focus', async () => {
    const onTabPress = jest.fn();
    await setup(THREE, 0, { onTabPress });
    await fireEvent.press(screen.getByRole('tab', { name: 'Home' }));
    expect(onTabPress).toHaveBeenCalledWith('Home', true);
  });

  it('skips routes hidden with href: null or display: none', async () => {
    await setup([
      { name: 'Home' },
      { name: 'Hidden', options: { href: null } },
      { name: 'AlsoHidden', options: { tabBarItemStyle: { display: 'none' } } },
      { name: 'Profile' },
    ]);
    expect(screen.getAllByRole('tab')).toHaveLength(2);
    expect(screen.queryByText('Hidden')).toBeNull();
  });

  it('reads badges in the accessibility label', async () => {
    await setup(THREE);
    expect(screen.getByRole('tab', { name: 'Saved, 3 new' })).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('respects tabBarAccessibilityLabel', async () => {
    await setup([
      { name: 'Home', options: { tabBarAccessibilityLabel: 'Go home' } },
    ]);
    expect(screen.getByRole('tab', { name: 'Go home' })).toBeTruthy();
  });

  it('hides labels when tabBarShowLabel is false', async () => {
    await setup([{ name: 'Home', options: { tabBarShowLabel: false } }]);
    expect(screen.queryByText('Home')).toBeNull();
    expect(screen.getByRole('tab', { name: 'Home' })).toBeTruthy();
  });

  it('keeps screen-reader order first to last in RTL', async () => {
    await setup(THREE, 0, { direction: 'rtl' });
    const names = screen
      .getAllByRole('tab')
      .map((t) => t.props.accessibilityLabel);
    expect(names).toEqual(['Home', 'Search', 'Saved, 3 new']);
  });

  it('renders renderTab content instead of the default', async () => {
    await setup(THREE, 0, {
      renderTab: ({ label, focused }) => (
        <Text>{`${label}${focused ? '*' : ''}`}</Text>
      ),
    });
    expect(screen.getByText('Home*')).toBeTruthy();
    expect(screen.getByText('Search')).toBeTruthy();
  });

  describe('indicator', () => {
    it('renders renderIndicator with the focused route name', async () => {
      await setup(THREE, 1, {
        renderIndicator: ({ routeName }) => <Text>{`ind:${routeName}`}</Text>,
      });
      expect(screen.getByText('ind:Search')).toBeTruthy();
    });

    it('does not render an indicator when showIndicator is false', async () => {
      await setup(THREE, 1, {
        showIndicator: false,
        renderIndicator: () => <Text>ind</Text>,
      });
      expect(screen.queryByText('ind')).toBeNull();
    });

    it.each(['slide', 'stretch', 'fade', 'none'] as const)(
      'switches tabs with the %s transition',
      async (indicatorTransition) => {
        const { navigation, rerender } = await setup(THREE, 0, {
          indicatorTransition,
          tabFocusAnimation: 'pop',
        });
        await fireEvent.press(screen.getByRole('tab', { name: 'Search' }));
        expect(navigation.navigate).toHaveBeenCalledWith('Search', undefined);
        expect(rerender).toBeDefined();
      }
    );
  });

  it('taps still work with scrubbing off', async () => {
    const { navigation } = await setup(THREE, 0, { scrubbing: false });
    await fireEvent.press(screen.getByRole('tab', { name: 'Search' }));
    expect(navigation.navigate).toHaveBeenCalledWith('Search', undefined);
  });

  describe('action button', () => {
    it('renders with its label and calls onPress', async () => {
      const onPress = jest.fn();
      await setup(THREE, 0, {
        actionButton: {
          icon: <Text>+</Text>,
          onPress,
          accessibilityLabel: 'New post',
        },
      });
      await fireEvent.press(screen.getByRole('button', { name: 'New post' }));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('passes colour and size to an icon function', async () => {
      await setup(THREE, 0, {
        colors: { activeTint: '#abcdef' },
        actionButton: {
          icon: ({ color, size }) => <Text>{`${color}/${size}`}</Text>,
          onPress: () => {},
          accessibilityLabel: 'New',
        },
      });
      expect(screen.getByText('#abcdef/24')).toBeTruthy();
    });

    it('is not rendered when visible is false', async () => {
      await setup(THREE, 0, {
        actionButton: {
          icon: <Text>+</Text>,
          onPress: () => {},
          accessibilityLabel: 'New post',
          visible: false,
        },
      });
      expect(screen.queryByRole('button', { name: 'New post' })).toBeNull();
    });
  });
});

describe('hooks', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ShrinkingTabBarProvider>{children}</ShrinkingTabBarProvider>
  );

  it('collapse, expand and toggle change the collapsed state', async () => {
    const { result } = await renderHook(() => useShrinkingTabBar(), {
      wrapper,
    });
    expect(result.current.collapsed.value).toBe(false);
    await act(() => result.current.collapse());
    expect(result.current.collapsed.value).toBe(true);
    await act(() => result.current.toggle());
    expect(result.current.collapsed.value).toBe(false);
    await act(() => result.current.collapse());
    await act(() => result.current.expand());
    expect(result.current.collapsed.value).toBe(false);
  });

  it('the plain scroll listener collapses and expands the bar', async () => {
    const { result } = await renderHook(
      () => ({
        bar: useShrinkingTabBar(),
        onScroll: useShrinkingTabBarScrollListener(),
      }),
      { wrapper }
    );
    const scrollTo = (y: number) =>
      act(() =>
        result.current.onScroll({
          nativeEvent: {
            contentOffset: { x: 0, y },
            contentSize: { width: 400, height: 5000 },
            layoutMeasurement: { width: 400, height: 800 },
          },
        } as never)
      );

    await scrollTo(10);
    await scrollTo(200);
    expect(result.current.bar.collapsed.value).toBe(true);
    await scrollTo(150);
    expect(result.current.bar.collapsed.value).toBe(false);
  });

  it('the listener can be disabled per screen', async () => {
    const { result } = await renderHook(
      () => ({
        bar: useShrinkingTabBar(),
        onScroll: useShrinkingTabBarScrollListener({ enabled: false }),
      }),
      { wrapper }
    );
    await act(() =>
      result.current.onScroll({
        nativeEvent: {
          contentOffset: { x: 0, y: 500 },
          contentSize: { width: 400, height: 5000 },
          layoutMeasurement: { width: 400, height: 800 },
        },
      } as never)
    );
    expect(result.current.bar.collapsed.value).toBe(false);
  });
});

describe('screen readers', () => {
  const scrollEvent = (y: number) =>
    ({
      nativeEvent: {
        contentOffset: { x: 0, y },
        contentSize: { width: 400, height: 5000 },
        layoutMeasurement: { width: 400, height: 800 },
      },
    }) as never;

  let onChange: ((on: boolean) => void) | undefined;
  beforeEach(() => {
    onChange = undefined;
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(((
      _: string,
      fn: (on: boolean) => void
    ) => {
      onChange = fn;
      return { remove: jest.fn() };
    }) as never);
  });
  afterEach(() => jest.restoreAllMocks());

  async function mount(screenReader: boolean, keep?: boolean) {
    jest
      .spyOn(AccessibilityInfo, 'isScreenReaderEnabled')
      .mockResolvedValue(screenReader);
    let controls: ReturnType<typeof useShrinkingTabBar> | undefined;
    let onScroll: ReturnType<typeof useShrinkingTabBarScrollListener>;
    function Screen() {
      controls = useShrinkingTabBar();
      onScroll = useShrinkingTabBarScrollListener();
      return null;
    }
    const props = {
      state: { index: 0, routes: [{ key: 'h', name: 'Home' }], key: 't' },
      descriptors: { h: { options: { tabBarIcon: () => null } } },
      navigation: { emit: jest.fn(() => ({})), navigate: jest.fn() },
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
      ...(keep === undefined ? null : { keepExpandedWithScreenReader: keep }),
    } as unknown as ShrinkingTabBarProps & BottomTabBarProps;
    await render(
      <ShrinkingTabBarProvider>
        <ShrinkingTabBar {...props} />
        <Screen />
      </ShrinkingTabBarProvider>
    );
    const scroll = async (...ys: number[]) => {
      for (const y of ys) await act(() => onScroll(scrollEvent(y)));
    };
    return { controls: () => controls!, scroll };
  }

  it('scrolling never collapses the bar while a screen reader is on', async () => {
    const { controls, scroll } = await mount(true);
    await scroll(10, 400);
    expect(controls().collapsed.value).toBe(false);
  });

  it('expands a collapsed bar when a screen reader turns on', async () => {
    const { controls, scroll } = await mount(false);
    await scroll(10, 400);
    expect(controls().collapsed.value).toBe(true);
    await act(() => onChange?.(true));
    expect(controls().collapsed.value).toBe(false);
    await scroll(800);
    expect(controls().collapsed.value).toBe(false);
  });

  it('can be turned off', async () => {
    const { controls, scroll } = await mount(true, false);
    await scroll(10, 400);
    expect(controls().collapsed.value).toBe(true);
  });
});

describe('combine and presets', () => {
  it('merges nested colours and sizes key by key, later parts winning', () => {
    const out = combine(
      {
        colors: { activeTint: '#111', badge: '#f00' },
        sizes: { expanded: { height: 70 } },
      },
      { colors: { activeTint: '#222' }, sizes: { expanded: { itemWidth: 90 } } }
    );
    expect(out.colors).toEqual({ activeTint: '#222', badge: '#f00' });
    expect(out.sizes).toEqual({ expanded: { height: 70, itemWidth: 90 } });
  });

  it('skips falsy parts and ignores undefined values', () => {
    const out = combine(presets.compact, false, null, undefined, {
      bottomOffset: undefined,
    });
    expect(out.bottomOffset).toBe(8);
  });

  it('replaces animation configs instead of mixing them', () => {
    const out = combine(
      { animation: { type: 'timing', duration: 300 } },
      { animation: { type: 'spring', damping: 10 } }
    );
    expect(out.animation).toEqual({ type: 'spring', damping: 10 });
  });

  it('keeps functions such as renderBackground', () => {
    const renderBackground = () => null;
    const out = combine(presets.vibrant, { renderBackground });
    expect(out.renderBackground).toBe(renderBackground);
    expect(out.colors?.indicator).toBe('#7C3AED');
  });

  it.each(Object.keys(presets) as (keyof typeof presets)[])(
    'renders with the %s preset',
    async (name) => {
      await setup(THREE, 0, presets[name]);
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    }
  );

  it('minimal hides the indicator', async () => {
    await setup(THREE, 0, {
      ...presets.minimal,
      renderIndicator: () => <Text>ind</Text>,
    });
    expect(screen.queryByText('ind')).toBeNull();
  });
});

describe('development warnings', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    resetWarnings();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  const messages = () => warn.mock.calls.map((c) => String(c[0]));

  it('warns about more than 5 tabs', async () => {
    await setup(['A', 'B', 'C', 'D', 'E', 'F'].map((name) => ({ name })));
    expect(messages().some((m) => m.includes('6 tabs'))).toBe(true);
  });

  it('warns about tabs without an icon', async () => {
    await setup([
      { name: 'Home' },
      { name: 'Bare', options: { tabBarIcon: undefined } },
    ]);
    expect(messages().some((m) => m.includes('No tabBarIcon for: Bare'))).toBe(
      true
    );
  });

  it('warns when an opaque background covers renderBackground', async () => {
    await setup(THREE, 0, {
      renderBackground: () => null,
      colors: { background: '#000000' },
    });
    expect(messages().some((m) => m.includes('opaque colors.background'))).toBe(
      true
    );
  });

  it('does not warn for a transparent background', async () => {
    await setup(THREE, 0, {
      renderBackground: () => null,
      colors: { background: 'transparent' },
    });
    expect(messages().some((m) => m.includes('opaque'))).toBe(false);
  });

  it('warns when two bars share one store', async () => {
    const routes = [{ key: 'h', name: 'Home', params: undefined }];
    const props = {
      state: { index: 0, routes, key: 'tabs', routeNames: ['Home'] },
      descriptors: { h: { options: { tabBarIcon: () => null } } },
      navigation: {
        emit: jest.fn(() => ({ defaultPrevented: false })),
        navigate: jest.fn(),
      },
      insets: { top: 0, bottom: 0, left: 0, right: 0 },
    } as unknown as ShrinkingTabBarProps & BottomTabBarProps;
    await render(
      <ShrinkingTabBarProvider>
        <ShrinkingTabBar {...props} />
        <ShrinkingTabBar {...props} />
      </ShrinkingTabBarProvider>
    );
    expect(messages().some((m) => m.includes('sharing collapse state'))).toBe(
      true
    );
  });

  it('stays quiet for a normal setup', async () => {
    await setup(THREE);
    expect(warn).not.toHaveBeenCalled();
  });
});
