import { Ionicons } from '@expo/vector-icons';
import { createContext, useContext, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CATEGORIES,
  type CarouselItem,
  type EventItem,
  type PlaceItem,
  type SectionItem,
} from './data';

export interface Palette {
  dark: boolean;
  bg: string;
  card: string;
  raised: string;
  text: string;
  sub: string;
  faint: string;
  hairline: string;
  accent: string;
}

export const DARK: Palette = {
  dark: true,
  bg: '#0B0B0E',
  card: '#16161B',
  raised: '#1F1F26',
  text: '#F4F4F6',
  sub: '#9A9AA6',
  faint: '#5C5C68',
  hairline: 'rgba(255,255,255,0.08)',
  accent: '#A78BFA',
};

export const LIGHT: Palette = {
  dark: false,
  bg: '#F4F4F6',
  card: '#FFFFFF',
  raised: '#ECECF0',
  text: '#111114',
  sub: '#6B6B76',
  faint: '#A1A1AA',
  hairline: 'rgba(0,0,0,0.07)',
  accent: '#7C3AED',
};

export const PaletteContext = createContext<Palette>(DARK);
export const usePalette = () => useContext(PaletteContext);

/** Saved events, shared by the feed and the Saved tab. */
export const SavedContext = createContext<{
  saved: Record<string, EventItem>;
  toggle: (e: EventItem) => void;
}>({ saved: {}, toggle: () => {} });

// ---------------------------------------------------------------- pieces

function Cover({
  event,
  height,
  radius,
}: {
  event: EventItem;
  height: number;
  radius: number;
}) {
  const p = usePalette();
  return (
    <View
      style={[
        styles.cover,
        { height, borderRadius: radius, backgroundColor: p.raised },
      ]}
    >
      <Ionicons
        name={event.category.icon}
        size={height * 0.28}
        color={p.faint}
      />
    </View>
  );
}

function Going({ event }: { event: EventItem }) {
  const p = usePalette();
  return (
    <Text style={[styles.going, { color: p.sub }]}>{event.going} going</Text>
  );
}

function Heart({ event }: { event: EventItem }) {
  const p = usePalette();
  const { saved, toggle } = useContext(SavedContext);
  const on = !!saved[event.id];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? 'Remove from saved' : 'Save'}
      onPress={() => toggle(event)}
      hitSlop={8}
      style={[styles.heart, { backgroundColor: p.raised }]}
    >
      <Ionicons
        name={on ? 'heart' : 'heart-outline'}
        size={18}
        color={p.text}
      />
    </Pressable>
  );
}

// ---------------------------------------------------------------- cards

export function EventCard({ event }: { event: EventItem }) {
  const p = usePalette();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: p.card, borderColor: p.hairline },
      ]}
    >
      <Cover event={event} height={event.featured ? 190 : 150} radius={16} />
      <View style={styles.cardBody}>
        <View style={styles.rowBetween}>
          <Text style={[styles.kicker, { color: p.sub }]}>
            {event.category.label.toUpperCase()} · {event.time}
          </Text>
          <Text style={[styles.price, { color: p.text }]}>{event.price}</Text>
        </View>
        <Text style={[styles.title, { color: p.text }]} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={14} color={p.sub} />
          <Text style={[styles.meta, { color: p.sub }]}>
            {event.venue} · {event.distance}
          </Text>
        </View>
        <View style={[styles.rowBetween, styles.cardFoot]}>
          <Going event={event} />
          <Heart event={event} />
        </View>
      </View>
    </View>
  );
}

export function PlaceRow({ place }: { place: PlaceItem }) {
  const p = usePalette();
  return (
    <View
      style={[
        styles.place,
        { backgroundColor: p.card, borderColor: p.hairline },
      ]}
    >
      <View style={[styles.thumb, { backgroundColor: p.raised }]}>
        <Ionicons name={place.category.icon} size={22} color={p.faint} />
      </View>
      <View style={styles.placeBody}>
        <Text style={[styles.placeName, { color: p.text }]}>{place.name}</Text>
        <Text style={[styles.meta, { color: p.sub }]}>
          {place.cuisine} · {place.distance}
        </Text>
        <Text style={[styles.meta, styles.placeFoot, { color: p.faint }]}>
          {place.rating} · {place.open ? 'Open now' : 'Opens at 6 PM'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={p.faint} />
    </View>
  );
}

export function Carousel({ item }: { item: CarouselItem }) {
  const p = usePalette();
  return (
    <View style={styles.carousel}>
      <Text
        style={[styles.sectionTitle, { color: p.text, paddingHorizontal: 16 }]}
      >
        {item.title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselRow}
      >
        {item.events.map((e) => (
          <View
            key={e.id}
            style={[
              styles.mini,
              { backgroundColor: p.card, borderColor: p.hairline },
            ]}
          >
            <Cover event={e} height={110} radius={14} />
            <Text
              style={[styles.miniTitle, { color: p.text }]}
              numberOfLines={2}
            >
              {e.title}
            </Text>
            <Text style={[styles.meta, { color: p.sub }]} numberOfLines={1}>
              {e.venue}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

export function SectionHeader({ item }: { item: SectionItem }) {
  const p = usePalette();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: p.text }]}>{item.title}</Text>
      <Text style={[styles.meta, { color: p.sub }]}>{item.subtitle}</Text>
    </View>
  );
}

export function StatusBar() {
  const p = usePalette();
  return (
    <View style={styles.status}>
      <Text style={[styles.statusTime, { color: p.text }]}>9:41</Text>
      <View style={styles.row}>
        <Ionicons name="cellular" size={14} color={p.text} />
        <Ionicons
          name="wifi"
          size={14}
          color={p.text}
          style={styles.statusIcon}
        />
        <Ionicons
          name="battery-full"
          size={18}
          color={p.text}
          style={styles.statusIcon}
        />
      </View>
    </View>
  );
}

export function CategoryChips() {
  const p = usePalette();
  const [active, setActive] = useState('all');
  const chips = [
    { key: 'all', label: 'For you', icon: 'sparkles' as const },
    ...CATEGORY_CHIPS,
  ];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
    >
      {chips.map((c) => {
        const on = c.key === active;
        return (
          <Pressable
            key={c.key}
            onPress={() => setActive(c.key)}
            style={[
              styles.chip,
              {
                backgroundColor: on ? p.text : p.card,
                borderColor: p.hairline,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: on ? p.bg : p.text }]}>
              {c.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const CATEGORY_CHIPS = CATEGORIES.map((c) => ({
  key: c.key,
  label: c.label,
  icon: c.icon,
}));

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 20,
    padding: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cover: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  cardBody: { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 4 },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  price: { fontSize: 13, fontWeight: '700' },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  meta: { fontSize: 13, marginLeft: 3 },
  cardFoot: { marginTop: 10 },
  going: { fontSize: 12, fontWeight: '600' },
  heart: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  place: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 18,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeBody: { flex: 1, marginLeft: 12 },
  placeName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  placeFoot: { marginTop: 6 },
  carousel: { marginBottom: 16, marginTop: 4 },
  carouselRow: { paddingHorizontal: 16, gap: 12, paddingTop: 10 },
  mini: {
    width: 168,
    borderRadius: 18,
    padding: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  miniTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    marginHorizontal: 4,
    marginBottom: 2,
  },
  section: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  status: {
    height: 44,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusTime: { fontSize: 15, fontWeight: '700' },
  statusIcon: { marginLeft: 5 },
  chips: { paddingHorizontal: 16, gap: 8, paddingBottom: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
});
