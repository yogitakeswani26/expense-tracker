import { Types } from 'mongoose';

/**
 * Cursor-based pagination
 *
 * PROBLEM with offset pagination (page/skip/limit, still used by the
 * existing `GET /:familyId` expense list for backward compatibility):
 * - `skip(N)` gets linearly slower as N grows - MongoDB still has to walk
 *   and discard N documents before it can return a page. At page 10,000
 *   (millions of records) this turns a <10ms index scan into a multi-second
 *   collection scan.
 * - Pages shift under concurrent writes: inserting a new expense while a
 *   user is paginating can duplicate or skip a row between page N and N+1.
 *
 * SOLUTION: keyset ("cursor") pagination. The cursor encodes the sort key of
 * the last row on the page (date + _id tie-breaker, since `date` alone is
 * not unique). The next page is fetched with a range query
 * (`date < cursor.date OR (date == cursor.date AND _id < cursor.id)`),
 * which uses the existing `{ familyId: 1, date: -1 }` index at O(limit)
 * cost regardless of how deep into the collection you are.
 *
 * This is additive: it powers the new `GET /:familyId/feed` endpoint
 * alongside the existing page/limit endpoint, so no current API consumer
 * is affected.
 */

export interface DateIdCursor {
  date: string; // ISO string
  id: string; // Mongo ObjectId hex string
}

/** Opaque, URL-safe cursor string encoding {date, id}. */
export function encodeCursor(date: Date, id: Types.ObjectId | string): string {
  const payload: DateIdCursor = { date: date.toISOString(), id: id.toString() };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/** Returns null for missing/invalid cursors instead of throwing - callers should treat that as "first page". */
export function decodeCursor(cursor: string | undefined): DateIdCursor | null {
  if (!cursor) return null;
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof decoded.date !== 'string' ||
      typeof decoded.id !== 'string' ||
      isNaN(new Date(decoded.date).getTime()) ||
      !Types.ObjectId.isValid(decoded.id)
    ) {
      return null;
    }
    return decoded as DateIdCursor;
  } catch {
    return null;
  }
}

/**
 * Build the Mongo match clause for "everything strictly after this cursor",
 * assuming a `{ ...otherFilters, date: -1, _id: -1 }`-style sort.
 * Merge the result into your existing $match stage.
 */
export function buildCursorMatch(cursor: DateIdCursor | null): Record<string, any> {
  if (!cursor) return {};
  const cursorDate = new Date(cursor.date);
  return {
    $or: [
      { date: { $lt: cursorDate } },
      { date: cursorDate, _id: { $lt: new Types.ObjectId(cursor.id) } },
    ],
  };
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Given `limit + 1` results fetched in sort order, split off the "is there
 * more?" sentinel and build the cursor for the next page.
 */
export function paginateWithCursor<T extends { date: Date; _id: any }>(
  results: T[],
  limit: number,
): CursorPage<T> {
  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;
  const last = items[items.length - 1];
  return {
    items,
    hasMore,
    nextCursor: hasMore && last ? encodeCursor(last.date, last._id) : null,
  };
}

/** Clamp a client-supplied limit into a safe range to prevent DoS via `?limit=999999`. */
export function clampLimit(rawLimit: unknown, max = 100, fallback = 20): number {
  const n = parseInt(rawLimit as string, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}
