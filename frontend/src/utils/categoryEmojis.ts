// Shared category -> emoji mapping used across expense views (table, modals, etc.)
export const categoryEmojis: Record<string, string> = {
  Food: '🍔',
  Transport: '🚗',
  Travel: '✈️',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Bills: '📄',
  Health: '🏥',
  Healthcare: '🏥',
  Education: '📚',
  Utilities: '💡',
  Netflix: '🎬',
  Uber: '🚗',
  'Hotel & Accommodation': '🏨',
};

export const DEFAULT_CATEGORY_EMOJI = '💳';

export const getCategoryEmoji = (category?: string | null): string => {
  if (!category) return DEFAULT_CATEGORY_EMOJI;
  return categoryEmojis[category] || DEFAULT_CATEGORY_EMOJI;
};

// Fallback list used when the family's category list hasn't loaded yet (or fails to load)
export const FALLBACK_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Bills',
  'Entertainment',
  'Healthcare',
  'Utilities',
  'Transport',
  'Health',
  'Education',
];
