import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  combine,
  presets,
  ShrinkingTabBar,
  useShrinkingTabBarInset,
  useShrinkingTabBarScrollHandler,
} from 'react-native-shrinking-tab-bar';
import { glass } from 'react-native-shrinking-tab-bar/glass';
import { CATEGORIES, feedPage, type EventItem, type FeedItem } from './data';
import {
  Carousel,
  CategoryChips,
  DARK,
  EventCard,
  LIGHT,
  PaletteContext,
  PlaceRow,
  SavedContext,
  SectionHeader,
  StatusBar,
  usePalette,
} from './ui';
import { installTouchCursor, useDemoConfig, useMouseDragScroll } from './web';

// ---------------------------------------------------------------- feed

function renderFeedItem({ item }: { item: FeedItem }) {
  switch (item.type) {
    case 'event':
      return <EventCard event={item} />;
    case 'place':
      return <PlaceRow place={item} />;
    case 'carousel':
      return <Carousel item={item} />;
    case 'section':
      return <SectionHeader item={item} />;
  }
}

/** An endless feed: the next page loads as you near the end. */
function useEndlessFeed() {
  const [pages, setPages] = useState(2);
  const [loading, setLoading] = useState(false);
  const data = useMemo(
    () => Array.from({ length: pages }, (_, i) => feedPage(i)).flat(),
    [pages]
  );
  const loadMore = useCallback(() => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      setPages((n) => n + 1);
      setLoading(false);
    }, 450);
  }, [loading]);
  return { data, loadMore };
}

function Footer({ inset }: { inset: number }) {
  const p = usePalette();
  return (
    <View style={[styles.footer, { paddingBottom: inset + 16 }]}>
      <ActivityIndicator color={p.sub} />
      <Text style={[styles.footerText, { color: p.faint }]}>Loading more</Text>
    </View>
  );
}

function HomeScreen() {
  const p = usePalette();
  const onScroll = useShrinkingTabBarScrollHandler();
  const inset = useShrinkingTabBarInset();
  const { data, loadMore } = useEndlessFeed();
  const listRef = useRef(null);
  useMouseDragScroll(listRef);

  return (
    <View style={[styles.screen, { backgroundColor: p.bg }]}>
      <StatusBar />
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(i) => i.id}
        renderItem={renderFeedItem}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<HomeHeader />}
        ListFooterComponent={<Footer inset={inset} />}
      />
    </View>
  );
}

function HomeHeader() {
  const p = usePalette();
  return (
    <View>
      <View style={styles.greeting}>
        <View>
          <Text style={[styles.hello, { color: p.sub }]}>Good evening</Text>
          <View style={styles.row}>
            <Text style={[styles.city, { color: p.text }]}>
              What's on tonight
            </Text>
          </View>
        </View>
        <LinearGradient colors={['#F59E0B', '#EC4899']} style={styles.me}>
          <Text style={styles.meText}>AR</Text>
        </LinearGradient>
      </View>
      <View
        style={[
          styles.search,
          { backgroundColor: p.card, borderColor: p.hairline },
        ]}
      >
        <Ionicons name="search" size={16} color={p.sub} />
        <Text style={[styles.searchText, { color: p.faint }]}>
          Events, places, people
        </Text>
      </View>
      <CategoryChips />
    </View>
  );
}

function ExploreScreen() {
  const p = usePalette();
  const onScroll = useShrinkingTabBarScrollHandler();
  const inset = useShrinkingTabBarInset();
  const { data, loadMore } = useEndlessFeed();
  const places = useMemo(() => data.filter((d) => d.type === 'place'), [data]);
  const listRef = useRef(null);
  useMouseDragScroll(listRef);

  return (
    <View style={[styles.screen, { backgroundColor: p.bg }]}>
      <StatusBar />
      <FlatList
        ref={listRef}
        data={places}
        keyExtractor={(i) => i.id}
        renderItem={renderFeedItem}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={[styles.h1, { color: p.text }]}>Explore</Text>
            <View style={styles.grid}>
              {CATEGORIES.map((c) => (
                <LinearGradient
                  key={c.key}
                  colors={c.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.tile}
                >
                  <Ionicons name={c.icon} size={22} color="#fff" />
                  <Text style={styles.tileText}>{c.label}</Text>
                </LinearGradient>
              ))}
            </View>
            <Text style={[styles.h2, { color: p.text }]}>Popular places</Text>
          </View>
        }
        ListFooterComponent={<Footer inset={inset} />}
      />
    </View>
  );
}

function SavedScreen() {
  const p = usePalette();
  const onScroll = useShrinkingTabBarScrollHandler();
  const inset = useShrinkingTabBarInset();
  const { saved } = useSavedState();
  const items = Object.values(saved);
  return (
    <View style={[styles.screen, { backgroundColor: p.bg }]}>
      <StatusBar />
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: inset + 16 }}
      >
        <Text style={[styles.h1, { color: p.text }]}>Saved</Text>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: p.card }]}>
              <Ionicons name="heart-outline" size={28} color={p.sub} />
            </View>
            <Text style={[styles.emptyTitle, { color: p.text }]}>
              Nothing saved yet
            </Text>
            <Text style={[styles.emptyText, { color: p.sub }]}>
              Tap the heart on any event in Home to keep it here.
            </Text>
          </View>
        ) : (
          items.map((e) => <EventCard key={e.id} event={e} />)
        )}
      </ScrollView>
    </View>
  );
}

function ProfileScreen() {
  const p = usePalette();
  const { saved } = useSavedState();
  const rows: {
    icon: ComponentProps<typeof Ionicons>['name'];
    label: string;
  }[] = [
    { icon: 'notifications-outline', label: 'Notifications' },
    { icon: 'location-outline', label: 'Location' },
    { icon: 'card-outline', label: 'Payments' },
    { icon: 'help-circle-outline', label: 'Help' },
  ];
  return (
    <View style={[styles.screen, { backgroundColor: p.bg }]}>
      <StatusBar />
      <Text style={[styles.h1, { color: p.text }]}>Profile</Text>
      <View
        style={[
          styles.profile,
          { backgroundColor: p.card, borderColor: p.hairline },
        ]}
      >
        <LinearGradient colors={['#F59E0B', '#EC4899']} style={styles.bigMe}>
          <Text style={styles.bigMeText}>AR</Text>
        </LinearGradient>
        <Text style={[styles.name, { color: p.text }]}>Alex Rivera</Text>
        <Text style={[styles.meta, { color: p.sub }]}>Out most Fridays</Text>
        <View style={styles.stats}>
          {[
            ['12', 'Going'],
            [String(Object.keys(saved).length), 'Saved'],
            ['48', 'Friends'],
          ].map(([n, l]) => (
            <View key={l} style={styles.stat}>
              <Text style={[styles.statNum, { color: p.text }]}>{n}</Text>
              <Text style={[styles.meta, { color: p.sub }]}>{l}</Text>
            </View>
          ))}
        </View>
      </View>
      <View
        style={[
          styles.list,
          { backgroundColor: p.card, borderColor: p.hairline },
        ]}
      >
        {rows.map((r, i) => (
          <View
            key={r.label}
            style={[
              styles.listRow,
              i > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderColor: p.hairline,
              },
            ]}
          >
            <Ionicons name={r.icon} size={20} color={p.text} />
            <Text style={[styles.listText, { color: p.text }]}>{r.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={p.faint} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- app

const useSavedState = () => useContext(SavedContext);

type IconName = ComponentProps<typeof Ionicons>['name'];
const tabIcon =
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

export default function App() {
  const config = useDemoConfig();
  const palette = config.theme === 'light' ? LIGHT : DARK;
  const [saved, setSaved] = useState<Record<string, EventItem>>({});
  const [toast, setToast] = useState(false);

  useEffect(() => installTouchCursor(palette.dark), [palette.dark]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 1400);
    return () => clearTimeout(t);
  }, [toast]);

  const savedValue = useMemo(
    () => ({
      saved,
      toggle: (e: EventItem) =>
        setSaved((s) => {
          const next = { ...s };
          if (next[e.id]) delete next[e.id];
          else next[e.id] = e;
          return next;
        }),
    }),
    [saved]
  );
  const savedCount = Object.keys(saved).length;

  const barOptions = combine(
    config.preset === 'none'
      ? null
      : config.preset === 'glass'
        ? glass()
        : presets[config.preset],
    {
      theme: palette.dark ? 'dark' : 'light',
      collapseMode: config.collapseMode,
      placement: config.placement,
      actionButton: config.actionButton
        ? {
            icon: ({ color, size }) => (
              <Ionicons name="add" color={color} size={size + 4} />
            ),
            accessibilityLabel: 'Create',
            onPress: () => setToast(true),
          }
        : undefined,
    }
  );

  return (
    <SafeAreaProvider>
      <PaletteContext.Provider value={palette}>
        <SavedContext.Provider value={savedValue}>
          <View style={[styles.flex, { backgroundColor: palette.bg }]}>
            <NavigationContainer
              theme={palette.dark ? DarkTheme : DefaultTheme}
            >
              <Tab.Navigator
                screenOptions={{ headerShown: false, animation: 'fade' }}
                tabBar={(props) => (
                  <ShrinkingTabBar
                    {...props}
                    {...barOptions}
                    insets={{ top: 0, left: 0, right: 0, bottom: 18 }}
                  />
                )}
              >
                <Tab.Screen
                  name="Home"
                  component={HomeScreen}
                  options={{ tabBarIcon: tabIcon('home', 'home-outline') }}
                />
                <Tab.Screen
                  name="Explore"
                  component={ExploreScreen}
                  options={{
                    tabBarIcon: tabIcon('compass', 'compass-outline'),
                  }}
                />
                <Tab.Screen
                  name="Saved"
                  component={SavedScreen}
                  options={{
                    tabBarIcon: tabIcon('heart', 'heart-outline'),
                    tabBarBadge: savedCount > 0 ? savedCount : undefined,
                  }}
                />
                <Tab.Screen
                  name="Profile"
                  component={ProfileScreen}
                  options={{ tabBarIcon: tabIcon('person', 'person-outline') }}
                />
              </Tab.Navigator>
            </NavigationContainer>
            {toast ? (
              <Animated.View
                entering={FadeIn.duration(150)}
                exiting={FadeOut.duration(200)}
                style={[styles.toast, { backgroundColor: palette.text }]}
                pointerEvents="none"
              >
                <Text style={{ color: palette.bg, fontWeight: '700' }}>
                  New post (demo)
                </Text>
              </Animated.View>
            ) : null}
            <View
              pointerEvents="none"
              style={[styles.homeIndicator, { backgroundColor: palette.text }]}
            />
          </View>
        </SavedContext.Provider>
      </PaletteContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
  },
  hello: { fontSize: 13, fontWeight: '600' },
  city: { fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
  me: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meText: { color: '#fff', fontWeight: '800' },
  search: {
    marginHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchText: { fontSize: 14 },
  footer: { alignItems: 'center', paddingTop: 12, gap: 6 },
  footerText: { fontSize: 12, fontWeight: '600' },
  h1: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
  },
  h2: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  tile: {
    width: '47.8%',
    height: 84,
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
  },
  tileText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  profile: {
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  bigMe: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  bigMeText: { color: '#fff', fontWeight: '800', fontSize: 24 },
  name: { fontSize: 19, fontWeight: '800' },
  meta: { fontSize: 13 },
  stats: {
    flexDirection: 'row',
    marginTop: 16,
    alignSelf: 'stretch',
    justifyContent: 'space-around',
  },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800' },
  list: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  listText: { flex: 1, fontSize: 15, fontWeight: '600' },
  toast: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  homeIndicator: {
    position: 'absolute',
    bottom: 7,
    alignSelf: 'center',
    width: 134,
    height: 5,
    borderRadius: 3,
    opacity: 0.85,
  },
});
