import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export interface Category {
  key: string;
  label: string;
  icon: IconName;
  colors: [string, string];
}

export const CATEGORIES: Category[] = [
  {
    key: 'music',
    label: 'Music',
    icon: 'musical-notes',
    colors: ['#7C3AED', '#DB2777'],
  },
  {
    key: 'food',
    label: 'Food',
    icon: 'restaurant',
    colors: ['#F97316', '#E11D48'],
  },
  {
    key: 'art',
    label: 'Art',
    icon: 'color-palette',
    colors: ['#0EA5E9', '#6366F1'],
  },
  {
    key: 'comedy',
    label: 'Comedy',
    icon: 'happy',
    colors: ['#F59E0B', '#F97316'],
  },
  {
    key: 'wellness',
    label: 'Wellness',
    icon: 'leaf',
    colors: ['#10B981', '#0D9488'],
  },
  {
    key: 'night',
    label: 'Nightlife',
    icon: 'moon',
    colors: ['#312E81', '#7C3AED'],
  },
  { key: 'film', label: 'Film', icon: 'film', colors: ['#0F172A', '#0EA5E9'] },
  {
    key: 'social',
    label: 'Social',
    icon: 'people',
    colors: ['#EC4899', '#8B5CF6'],
  },
];

const EVENTS = [
  ['Midnight Jazz on the Terrace', 'music'],
  ['Rooftop Cinema: Cult Classics', 'film'],
  ['Sunday Ceramics Workshop', 'art'],
  ['Paper Lanterns, Live', 'music'],
  ['Street Food Crawl', 'food'],
  ['Sunrise Yoga by the Lake', 'wellness'],
  ['Open Mic Comedy', 'comedy'],
  ['Vinyl & Coffee Morning', 'social'],
  ['Night Market Pop-up', 'night'],
  ['Board Game Social', 'social'],
  ['Synthwave Dance Party', 'night'],
  ['Poetry at the Bookshop', 'art'],
  ['Pottery & Pinot', 'art'],
  ['Late Show Stand-up', 'comedy'],
  ['Acoustic Garden Sessions', 'music'],
  ['Food Truck Friday', 'food'],
  ['Silent Disco in the Park', 'night'],
  ['Breathwork & Sound Bath', 'wellness'],
] as const;

const VENUES = [
  'The Glasshouse',
  'Pier 7',
  'Old Mill Studio',
  'Lantern Hall',
  'Riverside Park',
  'Courtyard 21',
  'The Loft',
  'Canal Street Market',
];

const PLACES = [
  ['Saffron & Salt', 'Indian', 'food'],
  ['Kettle & Crumb', 'Café · Bakery', 'food'],
  ['Noodle Theory', 'Ramen', 'food'],
  ['Little Lisbon', 'Portuguese', 'food'],
  ['Green Room', 'Plant-based', 'wellness'],
  ['Ember Grill', 'Grill · Bar', 'night'],
  ['The Gallery Bar', 'Cocktails', 'night'],
  ['Atlas Books & Brew', 'Café · Books', 'social'],
] as const;

const NAMES = ['AK', 'MS', 'JL', 'RP', 'TN', 'EV', 'DS', 'OB', 'LC', 'FH'];
const AVATAR_COLORS = [
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#EC4899',
  '#8B5CF6',
  '#EF4444',
];
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const PRICES = ['Free', '$12', '$18', '$25', '$9', '$40'];

export interface EventItem {
  type: 'event';
  id: string;
  title: string;
  venue: string;
  distance: string;
  day: string;
  date: number;
  time: string;
  price: string;
  going: number;
  avatars: { initials: string; color: string }[];
  category: Category;
  featured: boolean;
}

export interface PlaceItem {
  type: 'place';
  id: string;
  name: string;
  cuisine: string;
  rating: string;
  distance: string;
  open: boolean;
  category: Category;
}

export interface CarouselItem {
  type: 'carousel';
  id: string;
  title: string;
  events: EventItem[];
}

export interface SectionItem {
  type: 'section';
  id: string;
  title: string;
  subtitle: string;
}

export type FeedItem = EventItem | PlaceItem | CarouselItem | SectionItem;

const category = (key: string) =>
  CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0]!;

function makeEvent(i: number): EventItem {
  const [title, cat] = EVENTS[i % EVENTS.length]!;
  const going = 12 + ((i * 37) % 180);
  return {
    type: 'event',
    id: `e${i}`,
    title,
    venue: VENUES[(i * 3) % VENUES.length]!,
    distance: `${(0.4 + ((i * 7) % 40) / 10).toFixed(1)} km`,
    day: DAYS[(i + 4) % 7]!,
    date: 1 + ((i * 3) % 28),
    time: `${6 + (i % 5)}:${i % 2 ? '30' : '00'} PM`,
    price: PRICES[i % PRICES.length]!,
    going,
    avatars: [0, 1, 2].map((k) => ({
      initials: NAMES[(i + k * 3) % NAMES.length]!,
      color: AVATAR_COLORS[(i + k) % AVATAR_COLORS.length]!,
    })),
    category: category(cat),
    featured: i % 5 === 0,
  };
}

function makePlace(i: number): PlaceItem {
  const [name, cuisine, cat] = PLACES[i % PLACES.length]!;
  return {
    type: 'place',
    id: `p${i}`,
    name,
    cuisine,
    rating: (4 + ((i * 3) % 9) / 10).toFixed(1),
    distance: `${(0.2 + ((i * 5) % 30) / 10).toFixed(1)} km`,
    open: i % 4 !== 3,
    category: category(cat),
  };
}

/** One page of the feed: a varied but repeatable mix of cards. */
export function feedPage(page: number): FeedItem[] {
  const base = page * 6;
  const items: FeedItem[] = [];
  if (page > 0) {
    items.push({
      type: 'section',
      id: `s${page}`,
      title: page % 2 ? 'Near you' : 'This weekend',
      subtitle: page % 2 ? 'Within a short walk' : 'Plans worth making',
    });
  }
  items.push(makeEvent(base));
  items.push(makePlace(base));
  items.push(makePlace(base + 1));
  items.push(makeEvent(base + 1));
  if (page % 2 === 0) {
    items.push({
      type: 'carousel',
      id: `c${page}`,
      title: 'Trending this week',
      events: [2, 3, 4, 5].map((k) => makeEvent(base + k + 100)),
    });
  }
  items.push(makeEvent(base + 2));
  items.push(makePlace(base + 2));
  return items;
}
