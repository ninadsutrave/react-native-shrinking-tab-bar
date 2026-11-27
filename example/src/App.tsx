import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
} from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  presets,
  ShrinkingTabBar,
  useShrinkingTabBar,
  useShrinkingTabBarInset,
  useShrinkingTabBarScrollHandler,
  useShrinkingTabBarScrollListener,
  type CollapseMode,
  type IndicatorTransition,
  type PressFeedback,
} from 'react-native-shrinking-tab-bar';
import { glass } from 'react-native-shrinking-tab-bar/glass';

// ---------------------------------------------------------------- settings

interface Settings {
  dark: boolean;
  collapseMode: CollapseMode;
  align: 'center' | 'stretch';
  spring: boolean;
  background: 'solid' | 'blur' | 'glass';
  placement: 'center' | 'start' | 'end';
  button: 'off' | 'end' | 'start';
  indicator: 'on' | 'off' | 'gradient';
  transition: IndicatorTransition;
  pop: boolean;
  scrub: boolean;
  defaultBar: boolean;
  preset: 'none' | keyof typeof presets;
  stressJS: boolean;
  keepLabels: boolean;
  pressFeedback: PressFeedback;
  direction: 'auto' | 'ltr' | 'rtl';
}

const DEFAULTS: Settings = {
  dark: true,
  collapseMode: 'icons',
  align: 'center',
  spring: false,
  background: 'solid',
  placement: 'center',
  button: 'off',
  indicator: 'on',
  transition: 'slide',
  pop: false,
  scrub: true,
  defaultBar: false,
  preset: 'none',
  stressJS: false,
  keepLabels: false,
  pressFeedback: 'scale',
  direction: 'auto',
};

const SettingsContext = createContext<{
  settings: Settings;
  set: (patch: Partial<Settings>) => void;
}>({ settings: DEFAULTS, set: () => {} });

const useSettings = () => useContext(SettingsContext);

function palette(dark: boolean) {
  return dark
    ? { bg: '#0E0E11', card: '#1A1A1F', text: '#F2F2F5', sub: '#8E8E98' }
    : { bg: '#F4F4F6', card: '#FFFFFF', text: '#111114', sub: '#6B6B75' };
}

// ---------------------------------------------------------------- screens

const ITEMS = Array.from({ length: 60 }, (_, i) => ({
  id: String(i),
  title: `Place ${i + 1}`,
  sub: `${(i * 0.7 + 1).toFixed(1)} km away`,
}));

function Card({ title, sub }: { title: string; sub: string }) {
  const c = palette(useSettings().settings.dark);
  return (
    <View style={[styles.card, { backgroundColor: c.card }]}>
      <View style={[styles.thumb, { backgroundColor: c.bg }]} />
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, { color: c.text }]}>{title}</Text>
        <Text style={{ color: c.sub }}>{sub}</Text>
      </View>
    </View>
  );
}

function Header({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  const c = palette(useSettings().settings.dark);
  return (
    <Text style={[styles.h1, { color: c.text, paddingTop: insets.top + 12 }]}>
      {title}
    </Text>
  );
}

function HomeScreen() {
  const onScroll = useShrinkingTabBarScrollHandler();
  const inset = useShrinkingTabBarInset();
  const c = palette(useSettings().settings.dark);
  return (
    <Animated.FlatList
      data={ITEMS}
      keyExtractor={(i) => i.id}
      onScroll={onScroll}
      scrollEventThrottle={16}
      style={{ backgroundColor: c.bg }}
      ListHeaderComponent={<Header title="Home" />}
      contentContainerStyle={{ paddingBottom: inset + 12 }}
      renderItem={({ item }) => <Card title={item.title} sub={item.sub} />}
    />
  );
}

function SearchScreen() {
  // Plain FlatList: uses the JS listener variant.
  const onScroll = useShrinkingTabBarScrollListener();
  const inset = useShrinkingTabBarInset();
  const [q, setQ] = useState('');
  const c = palette(useSettings().settings.dark);
  const data = ITEMS.filter((i) =>
    i.title.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <FlatList
      data={data}
      keyExtractor={(i) => i.id}
      onScroll={onScroll}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: c.bg }}
      ListHeaderComponent={
        <>
          <Header title="Search" />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search places"
            placeholderTextColor={c.sub}
            style={[styles.input, { backgroundColor: c.card, color: c.text }]}
          />
        </>
      }
      contentContainerStyle={{ paddingBottom: inset + 12 }}
      renderItem={({ item }) => <Card title={item.title} sub={item.sub} />}
    />
  );
}

function SavedScreen() {
  const c = palette(useSettings().settings.dark);
  return (
    <View style={[styles.flex, { backgroundColor: c.bg }]}>
      <Header title="Saved" />
      <Card
        title="Short screen"
        sub="Too short to scroll, so the bar stays expanded"
      />
    </View>
  );
}

function Chips<T extends string | boolean>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
}) {
  const c = palette(useSettings().settings.dark);
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: c.sub }]}>{label}</Text>
      <View style={styles.chips}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              onPress={() => onChange(o.value)}
              style={[styles.chip, { backgroundColor: on ? c.text : c.card }]}
            >
              <Text style={{ color: on ? c.bg : c.text, fontWeight: '600' }}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const YES_NO = [
  { label: 'On', value: true },
  { label: 'Off', value: false },
];

function PlaygroundScreen() {
  const onScroll = useShrinkingTabBarScrollHandler();
  const inset = useShrinkingTabBarInset();
  const bar = useShrinkingTabBar();
  const { settings: s, set } = useSettings();
  const c = palette(s.dark);
  return (
    <Animated.ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={{ paddingBottom: inset + 400 }}
    >
      <Header title="Playground" />
      <Chips
        label="Preset"
        value={s.preset}
        onChange={(preset) => set({ preset })}
        options={[
          { label: 'None', value: 'none' },
          { label: 'Minimal', value: 'minimal' },
          { label: 'Compact', value: 'compact' },
          { label: 'Vibrant', value: 'vibrant' },
          { label: 'Full width', value: 'fullWidth' },
          { label: 'Hide on scroll', value: 'hideOnScroll' },
        ]}
      />
      <Chips
        label="Theme"
        value={s.dark}
        onChange={(dark) => set({ dark })}
        options={[
          { label: 'Dark', value: true },
          { label: 'Light', value: false },
        ]}
      />
      <Chips
        label="Direction"
        value={s.direction}
        onChange={(direction) => set({ direction })}
        options={[
          { label: 'Auto', value: 'auto' },
          { label: 'LTR', value: 'ltr' },
          { label: 'RTL', value: 'rtl' },
        ]}
      />
      <Chips
        label="Collapse mode"
        value={s.collapseMode}
        onChange={(collapseMode) => set({ collapseMode })}
        options={[
          { label: 'Icons', value: 'icons' },
          { label: 'Hide', value: 'hide' },
          { label: 'None', value: 'none' },
        ]}
      />
      <Chips
        label="Align"
        value={s.align}
        onChange={(align) => set({ align })}
        options={[
          { label: 'Center', value: 'center' },
          { label: 'Stretch', value: 'stretch' },
        ]}
      />
      <Chips
        label="Spring animation"
        value={s.spring}
        onChange={(spring) => set({ spring })}
        options={YES_NO}
      />
      <Chips
        label="Background"
        value={s.background}
        onChange={(background) => set({ background })}
        options={[
          { label: 'Solid', value: 'solid' },
          { label: 'Blur', value: 'blur' },
          { label: 'Glass', value: 'glass' },
        ]}
      />
      <Chips
        label="Placement"
        value={s.placement}
        onChange={(placement) => set({ placement })}
        options={[
          { label: 'Center', value: 'center' },
          { label: 'Start', value: 'start' },
          { label: 'End', value: 'end' },
        ]}
      />
      <Chips
        label="Action button"
        value={s.button}
        onChange={(button) => set({ button })}
        options={[
          { label: 'Off', value: 'off' },
          { label: 'End', value: 'end' },
          { label: 'Start', value: 'start' },
        ]}
      />
      <Chips
        label="Indicator"
        value={s.indicator}
        onChange={(indicator) => set({ indicator })}
        options={[
          { label: 'On', value: 'on' },
          { label: 'Gradient', value: 'gradient' },
          { label: 'Off', value: 'off' },
        ]}
      />
      <Chips
        label="Switch animation"
        value={s.transition}
        onChange={(transition) => set({ transition })}
        options={[
          { label: 'Slide', value: 'slide' },
          { label: 'Stretch', value: 'stretch' },
          { label: 'Fade', value: 'fade' },
          { label: 'None', value: 'none' },
        ]}
      />
      <Chips
        label="Benchmark: tab bar"
        value={s.defaultBar}
        onChange={(defaultBar) => set({ defaultBar })}
        options={[
          { label: 'Shrinking', value: false },
          { label: 'Default', value: true },
        ]}
      />
      <Chips
        label="Benchmark: stress JS thread"
        value={s.stressJS}
        onChange={(stressJS) => set({ stressJS })}
        options={YES_NO}
      />
      <Chips
        label="Scrubbing"
        value={s.scrub}
        onChange={(scrub) => set({ scrub })}
        options={YES_NO}
      />
      <Chips
        label="Icon pop"
        value={s.pop}
        onChange={(pop) => set({ pop })}
        options={YES_NO}
      />
      <Chips
        label="Keep labels"
        value={s.keepLabels}
        onChange={(keepLabels) => set({ keepLabels })}
        options={YES_NO}
      />
      <Chips
        label="Press feedback"
        value={s.pressFeedback}
        onChange={(pressFeedback) => set({ pressFeedback })}
        options={[
          { label: 'Scale', value: 'scale' },
          { label: 'Opacity', value: 'opacity' },
          { label: 'Ripple', value: 'ripple' },
          { label: 'None', value: 'none' },
        ]}
      />
      <View style={styles.row}>
        <Text style={[styles.rowLabel, { color: c.sub }]}>From code</Text>
        <View style={styles.chips}>
          {(['collapse', 'expand', 'toggle'] as const).map((k) => (
            <Pressable
              key={k}
              onPress={bar[k]}
              style={[styles.chip, { backgroundColor: c.card }]}
            >
              <Text style={{ color: c.text, fontWeight: '600' }}>{k}()</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Animated.ScrollView>
  );
}

// ---------------------------------------------------------------- navigator

type IconName = ComponentProps<typeof Ionicons>['name'];
const icon =
  (on: IconName, off: IconName) =>
  ({
    focused,
    color,
    size,
  }: {
    focused: boolean;
    color: string;
    size: number;
  }) => <Ionicons name={focused ? on : off} color={color} size={size} />;

const Tab = createBottomTabNavigator();

// Blocks the JS thread for 80 ms out of every 100 ms, to show that the
// bar's animations don't depend on it.
function useStressJS(on: boolean) {
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => {
      const end = Date.now() + 80;
      while (Date.now() < end) {
        // busy wait
      }
    }, 100);
    return () => clearInterval(id);
  }, [on]);
}

function Tabs() {
  const { settings: s } = useSettings();
  useStressJS(s.stressJS);
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={
        s.defaultBar
          ? undefined
          : (props) => (
              <ShrinkingTabBar
                {...props}
                theme={s.dark ? 'dark' : 'light'}
                collapseMode={s.collapseMode}
                align={s.align}
                showIndicator={s.indicator !== 'off'}
                indicatorTransition={s.transition}
                tabFocusAnimation={s.pop ? 'pop' : 'none'}
                scrubbing={s.scrub}
                onScrubChange={() => Haptics.selectionAsync()}
                renderIndicator={
                  s.indicator === 'gradient'
                    ? () => (
                        <LinearGradient
                          colors={['#7C3AED', '#DB2777']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={StyleSheet.absoluteFill}
                        />
                      )
                    : undefined
                }
                keepLabelsWhenCollapsed={s.keepLabels}
                pressFeedback={s.pressFeedback}
                direction={s.direction}
                animation={
                  s.spring
                    ? { type: 'spring', damping: 18, stiffness: 220, mass: 0.9 }
                    : undefined
                }
                placement={s.placement}
                actionButton={
                  s.button === 'off'
                    ? undefined
                    : {
                        side: s.button,
                        accessibilityLabel: 'New post',
                        icon: ({ color, size }) => (
                          <Ionicons name="add" color={color} size={size + 4} />
                        ),
                        onPress: () =>
                          Haptics.impactAsync(
                            Haptics.ImpactFeedbackStyle.Light
                          ),
                      }
                }
                {...(s.background === 'glass'
                  ? glass({ scheme: s.dark ? 'dark' : 'light' })
                  : s.background === 'blur'
                    ? {
                        colors: { background: 'transparent' },
                        renderBackground: () => (
                          <BlurView
                            tint={s.dark ? 'dark' : 'light'}
                            intensity={60}
                            // Real blur on Android needs a BlurTargetView around the
                            // screens; this example keeps a tinted fallback there.
                            blurMethod="none"
                            style={StyleSheet.absoluteFill}
                          />
                        ),
                      }
                    : null)}
                {...(s.preset === 'none' ? null : presets[s.preset])}
                onTabPress={() => Haptics.selectionAsync()}
              />
            )
      }
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: icon('home', 'home-outline') }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarIcon: icon('search', 'search-outline') }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{
          tabBarIcon: icon('bookmark', 'bookmark-outline'),
          tabBarBadge: 3,
        }}
      />
      <Tab.Screen
        name="Playground"
        component={PlaygroundScreen}
        options={{
          tabBarIcon: icon('options', 'options-outline'),
          title: 'Tweak',
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [settings, setSettings] = useState(DEFAULTS);
  const value = useMemo(
    () => ({
      settings,
      set: (patch: Partial<Settings>) =>
        setSettings((p) => ({ ...p, ...patch })),
    }),
    [settings]
  );
  return (
    <SafeAreaProvider>
      <SettingsContext.Provider value={value}>
        <NavigationContainer theme={settings.dark ? DarkTheme : DefaultTheme}>
          <Tabs />
        </NavigationContainer>
        <StatusBar style={settings.dark ? 'light' : 'dark'} />
      </SettingsContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  h1: {
    fontSize: 32,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 16,
  },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  cardText: { marginLeft: 12, flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  input: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    fontSize: 16,
  },
  row: { paddingHorizontal: 16, marginBottom: 18 },
  rowLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
});
