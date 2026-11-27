import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [a, b] = event.category.colors;
  return (
    <LinearGradient
      colors={[a, b]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.cover, { height, borderRadius: radius }]}
    >
      {/* soft circles give the cover some depth without stock imagery */}
      <View
        style={[
          styles.orb,
          {
            width: height * 1.1,
            height: height * 1.1,
            borderRadius: height,
            right: -height * 0.35,
            top: -height * 0.45,
          },
        ]}
      />
      <View
        style={[
          styles.orb,
          {
            width: height * 0.7,
            height: height * 0.7,
            borderRadius: height,
            left: -height * 0.2,
            bottom: -height * 0.35,
          },
        ]}
      />
      <Ionicons
        name={event.category.icon}
        size={height * 0.42}
        color="rgba(255,255,255,0.92)"
        style={styles.coverIcon}
      />
      <View style={styles.dateBadge}>
        <Text style={styles.dateDay}>{event.day}</Text>
        <Text style={styles.dateNum}>{event.date}</Text>
      </View>
    </LinearGradient>
  );
}

function Avatars({ event }: { event: EventItem }) {
  const p = usePalette();
  return (
    <View style={styles.row}>
      {event.avatars.map((av, i) => (
        <View
          key={av.initials + i}
          style={[
            styles.avatar,
            {
              backgroundColor: av.color,
              marginLeft: i ? -6 : 0,
              borderColor: p.card,
            },
          ]}
        >
          <Text style={styles.avatarText}>{av.initials}</Text>
        </View>
      ))}
      <Text style={[styles.going, { color: p.sub }]}>+{event.going} going</Text>
    </View>
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
        color={on ? '#F43F5E' : p.text}
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
          <Text style={[styles.kicker, { color: p.accent }]}>
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
          <Avatars event={event} />
          <Heart event={event} />
        </View>
      </View>
    </View>
  );
}

export function PlaceRow({ place }: { place: PlaceItem }) {
  const p = usePalette();
  const [a, b] = place.category.colors;
  return (
    <View
      style={[
        styles.place,
        { backgroundColor: p.card, borderColor: p.hairline },
      ]}
    >
      <LinearGradient
        colors={[a, b]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.thumb}
      >
        <Ionicons
          name={place.category.icon}
          size={24}
          color="rgba(255,255,255,0.95)"
        />
      </LinearGradient>
      <View style={styles.placeBody}>
        <Text style={[styles.placeName, { color: p.text }]}>{place.name}</Text>
        <Text style={[styles.meta, { color: p.sub }]}>
          {place.cuisine} · {place.distance}
        </Text>
        <View style={[styles.row, styles.placeFoot]}>
          <View
            style={[
              styles.rating,
              { backgroundColor: p.dark ? '#14532D' : '#DCFCE7' },
            ]}
          >
            <Ionicons
              name="star"
              size={11}
              color={p.dark ? '#86EFAC' : '#15803D'}
            />
            <Text
              style={[
                styles.ratingText,
                { color: p.dark ? '#86EFAC' : '#15803D' },
              ]}
            >
              {place.rating}
            </Text>
          </View>
          <Text
            style={[
              styles.open,
              {
                color: place.open ? (p.dark ? '#86EFAC' : '#15803D') : p.faint,
              },
            ]}
          >
            {place.open ? 'Open now' : 'Opens at 6 PM'}
          </Text>
        </View>
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
            <Ionicons name={c.icon} size={14} color={on ? p.bg : p.text} />
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
  orb: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.12)' },
  coverIcon: { opacity: 0.95 },
  dateBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
  },
  dateDay: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B76',
    letterSpacing: 0.5,
  },
  dateNum: { fontSize: 17, fontWeight: '800', color: '#111114', marginTop: -1 },
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
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  going: { fontSize: 12, marginLeft: 8, fontWeight: '600' },
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
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginRight: 8,
  },
  ratingText: { fontSize: 11, fontWeight: '800', marginLeft: 2 },
  open: { fontSize: 12, fontWeight: '600' },
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
