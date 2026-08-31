import { getCategoryColor, getCategoryEmoji } from '../utils/categoryUtils';

interface CategoryBadgeProps {
  /** Category display name, e.g. "Food & Dining" */
  name: string;
  /** Overrides the looked-up emoji (useful for subcategories that carry their own emoji) */
  emoji?: string;
  /** Visual size */
  size?: 'sm' | 'md' | 'lg';
  /** Renders just the emoji + colored dot, no name label */
  compact?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<CategoryBadgeProps['size']>, string> = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-sm px-2.5 py-1 gap-1.5',
  lg: 'text-base px-3 py-1.5 gap-2',
};

/**
 * Small pill showing a category's emoji + name, colored consistently with
 * charts elsewhere in the app (see utils/categoryUtils.ts -> getCategoryColor).
 */
export default function CategoryBadge({
  name,
  emoji,
  size = 'md',
  compact = false,
  className = '',
}: CategoryBadgeProps) {
  const resolvedEmoji = getCategoryEmoji(name, emoji);
  const color = getCategoryColor(name);

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${SIZE_CLASSES[size]} ${className}`}
      style={{ backgroundColor: `${color}1A`, color }}
      title={name}
    >
      <span aria-hidden="true">{resolvedEmoji}</span>
      {!compact && <span className="truncate max-w-[10rem]">{name}</span>}
    </span>
  );
}
