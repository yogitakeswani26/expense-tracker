/**
 * Central category constants.
 *
 * Single source of truth for top-level category metadata (emoji + brand color)
 * used across CategorySelector, Dashboard, Analytics, Expenses and Export pages.
 * Keys are matched case-insensitively against `Category.name` coming from the
 * backend (see backend/src/seeds/categories.seed.ts) so this file MUST be kept
 * in sync whenever a new top-level category is added on the backend.
 */

export interface CategoryMeta {
  /** Stable slug, also usable as a React key / query param */
  slug: string;
  /** Display name as stored in the backend `Category.name` field */
  name: string;
  /** Emoji shown in lists, chips and selectors */
  emoji: string;
  /** Hex color used for charts, badges and progress bars */
  color: string;
}

// Fallback shown when a category cannot be matched to the map below.
export const DEFAULT_CATEGORY_EMOJI = '📌';
export const DEFAULT_CATEGORY_COLOR = '#6B7280'; // gray-500

/**
 * Ordered list of top-level categories. Order mirrors the backend seed
 * (`order` field) so anything that iterates this array renders consistently
 * with the DB-driven category tree.
 */
export const CATEGORIES: CategoryMeta[] = [
  { slug: 'entertainment', name: 'Entertainment', emoji: '🎬', color: '#8B5CF6' }, // violet-500
  { slug: 'food-dining', name: 'Food & Dining', emoji: '🍔', color: '#F97316' }, // orange-500
  { slug: 'transportation', name: 'Transportation', emoji: '🚗', color: '#3B82F6' }, // blue-500
  { slug: 'utilities-bills', name: 'Utilities & Bills', emoji: '💡', color: '#EAB308' }, // yellow-500
  { slug: 'rent-housing', name: 'Rent & Housing', emoji: '🏠', color: '#14B8A6' }, // teal-500
  { slug: 'health-fitness', name: 'Health & Fitness', emoji: '💪', color: '#EF4444' }, // red-500
  { slug: 'education', name: 'Education', emoji: '📚', color: '#6366F1' }, // indigo-500
  { slug: 'insurance', name: 'Insurance', emoji: '🛡️', color: '#0EA5E9' }, // sky-500
  { slug: 'emi-loans', name: 'EMI & Loans', emoji: '🏦', color: '#DC2626' }, // red-600
  { slug: 'shopping-clothing', name: 'Shopping & Clothing', emoji: '👔', color: '#EC4899' }, // pink-500
  { slug: 'personal-care-grooming', name: 'Personal Care & Grooming', emoji: '💇', color: '#D946EF' }, // fuchsia-500
  { slug: 'travel-vacation', name: 'Travel & Vacation', emoji: '✈️', color: '#06B6D4' }, // cyan-500
  { slug: 'family-social', name: 'Family & Social', emoji: '👨‍👩‍👧‍👦', color: '#84CC16' }, // lime-500
  { slug: 'subscriptions', name: 'Subscriptions', emoji: '📡', color: '#A855F7' }, // purple-500
  { slug: 'miscellaneous', name: 'Miscellaneous', emoji: '🎯', color: '#78716C' }, // stone-500
];

/** name (lowercased) -> CategoryMeta, for O(1) lookups */
export const CATEGORY_BY_NAME: Record<string, CategoryMeta> = CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.name.toLowerCase()] = cat;
    return acc;
  },
  {} as Record<string, CategoryMeta>
);

/** slug -> CategoryMeta, for O(1) lookups */
export const CATEGORY_BY_SLUG: Record<string, CategoryMeta> = CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.slug] = cat;
    return acc;
  },
  {} as Record<string, CategoryMeta>
);

/** name (lowercased) -> emoji, kept separate for cheap imports in hot paths */
export const CATEGORY_EMOJI_MAP: Record<string, string> = CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.name.toLowerCase()] = cat.emoji;
    return acc;
  },
  {} as Record<string, string>
);

/** name (lowercased) -> color, kept separate for cheap imports in hot paths */
export const CATEGORY_COLOR_MAP: Record<string, string> = CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.name.toLowerCase()] = cat.color;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Legacy/short-form aliases (e.g. free-text "Food" instead of the DB's
 * "Food & Dining") that some older views still store on the Expense document.
 * Merged into CATEGORY_EMOJI_MAP / CATEGORY_COLOR_MAP below so both naming
 * schemes resolve to a sensible emoji/color without touching those views.
 * See frontend/src/utils/categoryEmojis.ts (legacy, still used by
 * ExpensesAdvanced.tsx) for the original short-name list.
 */
const CATEGORY_ALIASES: Record<string, string> = {
  food: 'food & dining',
  transport: 'transportation',
  bills: 'utilities & bills',
  health: 'health & fitness',
  healthcare: 'health & fitness',
  shopping: 'shopping & clothing',
  travel: 'travel & vacation',
  netflix: 'entertainment',
  uber: 'transportation',
  'hotel & accommodation': 'travel & vacation',
};

Object.entries(CATEGORY_ALIASES).forEach(([alias, canonical]) => {
  if (CATEGORY_EMOJI_MAP[canonical]) CATEGORY_EMOJI_MAP[alias] = CATEGORY_EMOJI_MAP[canonical];
  if (CATEGORY_COLOR_MAP[canonical]) CATEGORY_COLOR_MAP[alias] = CATEGORY_COLOR_MAP[canonical];
});

/** Ordered palette used to deterministically color categories not in the map above (subcategories, custom user categories, etc). */
export const FALLBACK_COLOR_PALETTE: string[] = [
  '#8B5CF6',
  '#F97316',
  '#3B82F6',
  '#EAB308',
  '#14B8A6',
  '#EF4444',
  '#6366F1',
  '#0EA5E9',
  '#EC4899',
  '#84CC16',
  '#A855F7',
  '#06B6D4',
];
