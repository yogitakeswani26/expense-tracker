import {
  CATEGORY_BY_NAME,
  CATEGORY_EMOJI_MAP,
  CATEGORY_COLOR_MAP,
  DEFAULT_CATEGORY_EMOJI,
  DEFAULT_CATEGORY_COLOR,
  FALLBACK_COLOR_PALETTE,
  CategoryMeta,
} from '../constants/categories';

/**
 * Shape returned by GET /categories (backend Category model).
 * `children` is populated when the API/consumer builds a tree from the
 * flat, `parentId`-linked documents.
 */
export interface CategoryNode {
  _id: string;
  name: string;
  emoji: string;
  description?: string;
  level: 1 | 2 | 3;
  order?: number;
  parentId?: string | null;
  isActive?: boolean;
  isDefault?: boolean;
  children?: CategoryNode[];
}

const MAX_CATEGORY_NAME_LENGTH = 60;
const MIN_CATEGORY_NAME_LENGTH = 2;
// Matches a single emoji grapheme (with optional variation selector / ZWJ sequences).
const EMOJI_REGEX =
  /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})(‍(\p{Extended_Pictographic}|\p{Emoji_Presentation}))*️?$/u;

/**
 * Look up the curated emoji for a top-level category name.
 * Falls back to a category's own `emoji` field (if provided) and finally to
 * a generic pin emoji so the UI never renders blank.
 */
export const getCategoryEmoji = (name?: string | null, fallbackEmoji?: string): string => {
  if (!name) return fallbackEmoji || DEFAULT_CATEGORY_EMOJI;
  const match = CATEGORY_EMOJI_MAP[name.trim().toLowerCase()];
  return match || fallbackEmoji || DEFAULT_CATEGORY_EMOJI;
};

/**
 * Deterministically hash a string to an index — used so categories without a
 * curated color (subcategories, custom/user-created categories) still get a
 * stable, repeatable color instead of a random one on every render.
 */
const hashStringToIndex = (value: string, modulo: number): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0; // force 32-bit int
  }
  return Math.abs(hash) % modulo;
};

/**
 * Look up (or deterministically derive) a brand color for a category name.
 * Known top-level categories use the curated palette in constants/categories.ts;
 * anything else (subcategories, user-defined categories) gets a stable color
 * derived from the name so charts stay visually consistent across renders.
 */
export const getCategoryColor = (name?: string | null): string => {
  if (!name) return DEFAULT_CATEGORY_COLOR;
  const trimmed = name.trim();
  const match = CATEGORY_COLOR_MAP[trimmed.toLowerCase()];
  if (match) return match;
  const idx = hashStringToIndex(trimmed, FALLBACK_COLOR_PALETTE.length);
  return FALLBACK_COLOR_PALETTE[idx];
};

/** Full metadata (slug/name/emoji/color) lookup, or null when unknown. */
export const getCategoryMeta = (name?: string | null): CategoryMeta | null => {
  if (!name) return null;
  return CATEGORY_BY_NAME[name.trim().toLowerCase()] || null;
};

/** True when the name matches one of the curated top-level categories. */
export const isKnownCategory = (name?: string | null): boolean => {
  if (!name) return false;
  return Boolean(CATEGORY_BY_NAME[name.trim().toLowerCase()]);
};

/**
 * Validate a user-supplied category name.
 * Returns `{ valid: true }` or `{ valid: false, error }` so callers can
 * surface the message directly in a form.
 */
export const validateCategoryName = (
  name: unknown
): { valid: true } | { valid: false; error: string } => {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Category name must be text' };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Category name is required' };
  }
  if (trimmed.length < MIN_CATEGORY_NAME_LENGTH) {
    return { valid: false, error: `Category name must be at least ${MIN_CATEGORY_NAME_LENGTH} characters` };
  }
  if (trimmed.length > MAX_CATEGORY_NAME_LENGTH) {
    return { valid: false, error: `Category name must be under ${MAX_CATEGORY_NAME_LENGTH} characters` };
  }
  return { valid: true };
};

/**
 * Validate a user-supplied emoji (single grapheme, incl. multi-codepoint
 * sequences like flags/skin tones/ZWJ combos).
 */
export const validateCategoryEmoji = (
  emoji: unknown
): { valid: true } | { valid: false; error: string } => {
  if (typeof emoji !== 'string' || emoji.trim().length === 0) {
    return { valid: false, error: 'Category emoji is required' };
  }
  if (!EMOJI_REGEX.test(emoji.trim())) {
    return { valid: false, error: 'Category emoji must be a single emoji character' };
  }
  return { valid: true };
};

/**
 * Validate a hex color string (`#RGB` or `#RRGGBB`).
 */
export const validateCategoryColor = (
  color: unknown
): { valid: true } | { valid: false; error: string } => {
  if (typeof color !== 'string' || !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color.trim())) {
    return { valid: false, error: 'Category color must be a valid hex code (e.g. #8B5CF6)' };
  }
  return { valid: true };
};

/**
 * Convenience wrapper that runs name/emoji validation together for a
 * "create/edit category" form and collects all errors keyed by field.
 */
export const validateCategoryInput = (input: {
  name: unknown;
  emoji: unknown;
  color?: unknown;
}): { valid: boolean; errors: Partial<Record<'name' | 'emoji' | 'color', string>> } => {
  const errors: Partial<Record<'name' | 'emoji' | 'color', string>> = {};

  const nameResult = validateCategoryName(input.name);
  if (!nameResult.valid) errors.name = nameResult.error;

  const emojiResult = validateCategoryEmoji(input.emoji);
  if (!emojiResult.valid) errors.emoji = emojiResult.error;

  if (input.color !== undefined) {
    const colorResult = validateCategoryColor(input.color);
    if (!colorResult.valid) errors.color = colorResult.error;
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

/**
 * Build a nested category tree from the flat list returned by
 * `GET /categories` (each doc has `parentId` + `level`).
 * Result is sorted by `order` at every level.
 */
export const buildCategoryTree = (flat: CategoryNode[]): CategoryNode[] => {
  const byId = new Map<string, CategoryNode>();
  flat.forEach((cat) => byId.set(cat._id, { ...cat, children: [] }));

  const roots: CategoryNode[] = [];

  byId.forEach((cat) => {
    if (cat.parentId && byId.has(cat.parentId)) {
      const parent = byId.get(cat.parentId)!;
      parent.children = parent.children || [];
      parent.children.push(cat);
    } else {
      roots.push(cat);
    }
  });

  const sortRecursive = (nodes: CategoryNode[]): CategoryNode[] => {
    nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    nodes.forEach((n) => {
      if (n.children && n.children.length > 0) {
        sortRecursive(n.children);
      }
    });
    return nodes;
  };

  return sortRecursive(roots);
};

/** Flatten a category tree back into a single array (depth-first). */
export const flattenCategoryTree = (tree: CategoryNode[]): CategoryNode[] => {
  const result: CategoryNode[] = [];
  const walk = (nodes: CategoryNode[]) => {
    nodes.forEach((node) => {
      const { children, ...rest } = node;
      result.push(rest as CategoryNode);
      if (children && children.length > 0) walk(children);
    });
  };
  walk(tree);
  return result;
};

/** Find a node anywhere in a category tree by id. */
export const findCategoryById = (tree: CategoryNode[], id: string): CategoryNode | null => {
  for (const node of tree) {
    if (node._id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findCategoryById(node.children, id);
      if (found) return found;
    }
  }
  return null;
};

/** Breadcrumb path (root -> ... -> node) for a given category id, e.g. for display as "Entertainment > Streaming > Netflix". */
export const getCategoryPath = (tree: CategoryNode[], id: string): CategoryNode[] => {
  const path: CategoryNode[] = [];

  const walk = (nodes: CategoryNode[]): boolean => {
    for (const node of nodes) {
      path.push(node);
      if (node._id === id) return true;
      if (node.children && node.children.length > 0 && walk(node.children)) return true;
      path.pop();
    }
    return false;
  };

  walk(tree);
  return path;
};

/** Human-friendly "Entertainment > Streaming > Netflix" string for a category path. */
export const formatCategoryPath = (tree: CategoryNode[], id: string, separator = ' > '): string => {
  return getCategoryPath(tree, id)
    .map((n) => n.name)
    .join(separator);
};
